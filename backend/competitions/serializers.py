from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from camps.models import CampEnrollment

from .models import BestSpeakerVote, CompetitionVenue, DebatePosition, DebateSide, IntegralRound, JudgeBallot, Match, PositionScore


class IntegralRoundSerializer(serializers.ModelSerializer):
    match_count = serializers.SerializerMethodField()

    class Meta:
        model = IntegralRound
        fields = ["id", "camp", "number", "topic", "match_count"]

    def get_match_count(self, obj):
        return obj.matches.count()


class CompetitionVenueSerializer(serializers.ModelSerializer):
    judge_names = serializers.SerializerMethodField()

    class Meta:
        model = CompetitionVenue
        fields = ["id", "integral_round", "name", "judges", "judge_names"]

    def get_judge_names(self, obj):
        return [judge.name for judge in obj.judges.all()]


class MatchSerializer(serializers.ModelSerializer):
    round_number = serializers.IntegerField(source="integral_round.number", read_only=True)
    venue_name = serializers.CharField(source="venue.name", read_only=True)
    affirmative_team_name = serializers.CharField(source="affirmative_team.name", read_only=True)
    negative_team_name = serializers.CharField(source="negative_team.name", read_only=True)

    class Meta:
        model = Match
        fields = [
            "id",
            "integral_round",
            "round_number",
            "venue",
            "venue_name",
            "sequence",
            "starts_at",
            "affirmative_team",
            "affirmative_team_name",
            "negative_team",
            "negative_team_name",
            "best_speaker_override",
            "is_verified",
            "verified_at",
            "verification_note",
        ]
        read_only_fields = ["verified_at"]


class DebatePositionSerializer(serializers.ModelSerializer):
    enrollment_nickname = serializers.CharField(source="enrollment.nickname", read_only=True)

    class Meta:
        model = DebatePosition
        fields = ["id", "match", "side", "position_number", "enrollment", "enrollment_nickname", "coach_note"]


class JudgePositionSerializer(serializers.ModelSerializer):
    label = serializers.CharField(source="display_name", read_only=True)
    speaker = serializers.CharField(source="enrollment.nickname", read_only=True)

    class Meta:
        model = DebatePosition
        fields = ["id", "side", "position_number", "label", "speaker", "coach_note"]


class ExistingPositionScoreSerializer(serializers.ModelSerializer):
    position = serializers.IntegerField(source="position_id")

    class Meta:
        model = PositionScore
        fields = ["position", "score", "speech_record", "judge_feedback"]


class ExistingBestSpeakerVoteSerializer(serializers.ModelSerializer):
    position = serializers.IntegerField(source="position_id")

    class Meta:
        model = BestSpeakerVote
        fields = ["position", "weight"]


class ExistingJudgeBallotSerializer(serializers.ModelSerializer):
    position_scores = ExistingPositionScoreSerializer(many=True, read_only=True)
    best_speaker_votes = ExistingBestSpeakerVoteSerializer(many=True, read_only=True)

    class Meta:
        model = JudgeBallot
        fields = [
            "affirmative_votes",
            "negative_votes",
            "submitted_at",
            "position_scores",
            "best_speaker_votes",
        ]


class JudgeMatchSerializer(serializers.ModelSerializer):
    round_number = serializers.IntegerField(source="integral_round.number", read_only=True)
    round_label = serializers.SerializerMethodField()
    topic = serializers.CharField(source="integral_round.topic", read_only=True)
    venue_name = serializers.CharField(source="venue.name", read_only=True)
    affirmative_team_name = serializers.CharField(source="affirmative_team.name", read_only=True)
    negative_team_name = serializers.CharField(source="negative_team.name", read_only=True)
    positions = JudgePositionSerializer(many=True, read_only=True)
    ballot = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()

    class Meta:
        model = Match
        fields = [
            "id",
            "round_number",
            "round_label",
            "topic",
            "venue_name",
            "sequence",
            "starts_at",
            "affirmative_team_name",
            "negative_team_name",
            "positions",
            "ballot",
            "status",
        ]

    def get_round_label(self, obj):
        return f"积分赛{obj.integral_round.number}"

    def get_ballot(self, obj):
        ballot = self.context.get("ballots_by_match", {}).get(obj.id)
        if not ballot:
            return None
        return ExistingJudgeBallotSerializer(ballot).data

    def get_status(self, obj):
        ballot = self.context.get("ballots_by_match", {}).get(obj.id)
        if not ballot:
            return "pending"
        return "submitted" if ballot.submitted_at else "draft"


class PositionScoreInputSerializer(serializers.Serializer):
    position = serializers.IntegerField()
    score = serializers.DecimalField(max_digits=3, decimal_places=1, min_value=0, max_value=9)
    speech_record = serializers.CharField(allow_blank=True, required=False)
    judge_feedback = serializers.CharField(allow_blank=True, required=False)


class BestSpeakerVoteInputSerializer(serializers.Serializer):
    position = serializers.IntegerField()
    weight = serializers.IntegerField(min_value=1, max_value=3)


class JudgeBallotSubmitSerializer(serializers.Serializer):
    affirmative_votes = serializers.IntegerField(min_value=0, max_value=3)
    negative_votes = serializers.IntegerField(min_value=0, max_value=3)
    position_scores = PositionScoreInputSerializer(many=True)
    best_speaker_votes = BestSpeakerVoteInputSerializer(many=True)
    submit = serializers.BooleanField(default=True)

    def validate(self, attrs):
        match = self.context["match"]
        valid_position_ids = set(match.positions.values_list("id", flat=True))
        expected_count = len(valid_position_ids)
        score_position_ids = [item["position"] for item in attrs["position_scores"]]
        best_position_ids = [item["position"] for item in attrs["best_speaker_votes"]]
        weights = [item["weight"] for item in attrs["best_speaker_votes"]]

        if attrs["affirmative_votes"] + attrs["negative_votes"] != 3:
            raise serializers.ValidationError("每位评委每场比赛必须分配 3 张最终投票。")
        if set(score_position_ids) != valid_position_ids or len(score_position_ids) != expected_count:
            raise serializers.ValidationError("需要为本场所有辩位录入分数。")
        if any(position_id not in valid_position_ids for position_id in best_position_ids):
            raise serializers.ValidationError("最佳辩手票只能投给本场辩位。")
        if sorted(weights) != [1, 2, 3] or len(set(best_position_ids)) != 3:
            raise serializers.ValidationError("最佳辩手票必须分别选择 3 票、2 票、1 票，且不能重复。")
        return attrs

    def save(self, **kwargs):
        match = self.context["match"]
        judge = self.context["judge"]
        submit = self.validated_data["submit"]

        with transaction.atomic():
            ballot, _ = JudgeBallot.objects.update_or_create(
                match=match,
                judge=judge,
                defaults={
                    "affirmative_votes": self.validated_data["affirmative_votes"],
                    "negative_votes": self.validated_data["negative_votes"],
                    "submitted_at": timezone.now() if submit else None,
                },
            )

            for item in self.validated_data["position_scores"]:
                PositionScore.objects.update_or_create(
                    ballot=ballot,
                    position_id=item["position"],
                    defaults={
                        "score": item["score"],
                        "speech_record": item.get("speech_record", ""),
                        "judge_feedback": item.get("judge_feedback", ""),
                    },
                )

            ballot.best_speaker_votes.all().delete()
            BestSpeakerVote.objects.bulk_create(
                BestSpeakerVote(ballot=ballot, position_id=item["position"], weight=item["weight"])
                for item in self.validated_data["best_speaker_votes"]
            )

        return ballot


class CoachTeamMemberSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.real_name", read_only=True)

    class Meta:
        model = CampEnrollment
        fields = ["id", "nickname", "student_name"]


class CoachMatchPositionSerializer(serializers.ModelSerializer):
    enrollment_nickname = serializers.CharField(source="enrollment.nickname", read_only=True)

    class Meta:
        model = DebatePosition
        fields = ["id", "side", "position_number", "enrollment", "enrollment_nickname", "coach_note"]


class CoachMatchSerializer(serializers.ModelSerializer):
    round_number = serializers.IntegerField(source="integral_round.number", read_only=True)
    topic = serializers.CharField(source="integral_round.topic", read_only=True)
    venue_name = serializers.CharField(source="venue.name", read_only=True)
    affirmative_team_name = serializers.CharField(source="affirmative_team.name", read_only=True)
    negative_team_name = serializers.CharField(source="negative_team.name", read_only=True)
    coach_side = serializers.SerializerMethodField()
    coach_team_name = serializers.SerializerMethodField()
    positions = serializers.SerializerMethodField()
    position_completion = serializers.SerializerMethodField()

    class Meta:
        model = Match
        fields = [
            "id",
            "round_number",
            "topic",
            "venue_name",
            "sequence",
            "starts_at",
            "affirmative_team_name",
            "negative_team_name",
            "coach_side",
            "coach_team_name",
            "positions",
            "position_completion",
        ]

    def _coach_team(self):
        return self.context["team"]

    def get_coach_side(self, obj):
        team = self._coach_team()
        if obj.affirmative_team_id == team.id:
            return DebateSide.AFFIRMATIVE
        return DebateSide.NEGATIVE

    def get_coach_team_name(self, obj):
        return self._coach_team().name

    def get_positions(self, obj):
        side = self.get_coach_side(obj)
        positions = [position for position in obj.positions.all() if position.side == side]
        return CoachMatchPositionSerializer(positions, many=True).data

    def get_position_completion(self, obj):
        side = self.get_coach_side(obj)
        completed = sum(1 for position in obj.positions.all() if position.side == side)
        return {"completed": completed, "required": 4, "is_complete": completed == 4}


class CoachPositionInputSerializer(serializers.Serializer):
    position_number = serializers.IntegerField(min_value=1, max_value=4)
    enrollment = serializers.IntegerField()
    coach_note = serializers.CharField(allow_blank=True, required=False)


class CoachPositionsSubmitSerializer(serializers.Serializer):
    positions = CoachPositionInputSerializer(many=True)

    def validate(self, attrs):
        team = self.context["team"]
        enrollment_ids = set(team.members.values_list("id", flat=True))
        position_numbers = [item["position_number"] for item in attrs["positions"]]

        if sorted(position_numbers) != [1, 2, 3, 4]:
            raise serializers.ValidationError("必须录入一辩、二辩、三辩、四辩。")
        if any(item["enrollment"] not in enrollment_ids for item in attrs["positions"]):
            raise serializers.ValidationError("辩位只能选择本队队员。")
        return attrs

    def save(self, **kwargs):
        match = self.context["match"]
        side = self.context["side"]
        with transaction.atomic():
            for item in self.validated_data["positions"]:
                DebatePosition.objects.update_or_create(
                    match=match,
                    side=side,
                    position_number=item["position_number"],
                    defaults={
                        "enrollment_id": item["enrollment"],
                        "coach_note": item.get("coach_note", ""),
                    },
                )
        return match
