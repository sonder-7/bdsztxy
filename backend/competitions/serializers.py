from rest_framework import serializers

from .models import CompetitionVenue, DebatePosition, IntegralRound, Match


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
        ]


class DebatePositionSerializer(serializers.ModelSerializer):
    enrollment_nickname = serializers.CharField(source="enrollment.nickname", read_only=True)

    class Meta:
        model = DebatePosition
        fields = ["id", "match", "side", "position_number", "enrollment", "enrollment_nickname", "coach_note"]
