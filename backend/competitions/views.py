from rest_framework import status
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet, ReadOnlyModelViewSet
from django.db.models import Q

from accounts.models import Role
from camps.models import Coach, Judge
from camps.permissions import IsAdminOrStaff

from .models import CompetitionVenue, DebatePosition, DebateSide, IntegralRound, JudgeBallot, Match
from .serializers import (
    CompetitionVenueSerializer,
    CoachMatchSerializer,
    CoachPositionsSubmitSerializer,
    CoachTeamMemberSerializer,
    DebatePositionSerializer,
    IntegralRoundSerializer,
    JudgeBallotSubmitSerializer,
    JudgeMatchSerializer,
    MatchSerializer,
)


class StaffCompetitionViewSet(ModelViewSet):
    permission_classes = [IsAdminOrStaff]


class IntegralRoundViewSet(StaffCompetitionViewSet):
    queryset = IntegralRound.objects.select_related("camp").prefetch_related("matches")
    serializer_class = IntegralRoundSerializer


class CompetitionVenueViewSet(StaffCompetitionViewSet):
    queryset = CompetitionVenue.objects.select_related("integral_round", "integral_round__camp").prefetch_related("judges")
    serializer_class = CompetitionVenueSerializer


class MatchViewSet(StaffCompetitionViewSet):
    queryset = Match.objects.select_related("integral_round", "venue", "affirmative_team", "negative_team")
    serializer_class = MatchSerializer


class DebatePositionViewSet(StaffCompetitionViewSet):
    queryset = DebatePosition.objects.select_related("match", "enrollment")
    serializer_class = DebatePositionSerializer


class JudgeMatchViewSet(ReadOnlyModelViewSet):
    serializer_class = JudgeMatchSerializer

    def _get_current_judge(self):
        profile = getattr(self.request.user, "profile", None)
        if not profile or profile.role != Role.JUDGE:
            raise PermissionDenied("仅评委可以访问评审任务。")
        try:
            return Judge.objects.get(name=profile.display_name, is_active=True)
        except Judge.DoesNotExist as exc:
            raise NotFound("当前账号没有匹配的评委档案。") from exc

    def get_queryset(self):
        judge = self._get_current_judge()
        return (
            Match.objects.filter(venue__judges=judge)
            .select_related("integral_round", "venue", "affirmative_team", "negative_team")
            .prefetch_related("positions", "positions__enrollment")
            .distinct()
        )

    def get_serializer_context(self):
        context = super().get_serializer_context()
        judge = self._get_current_judge()
        match_ids = [match.id for match in self.get_queryset()]
        ballots = (
            JudgeBallot.objects.filter(judge=judge, match_id__in=match_ids)
            .prefetch_related("position_scores", "best_speaker_votes")
        )
        context["ballots_by_match"] = {ballot.match_id: ballot for ballot in ballots}
        return context

    @action(detail=True, methods=["post"])
    def submit_ballot(self, request, pk=None):
        judge = self._get_current_judge()
        match = self.get_object()
        serializer = JudgeBallotSubmitSerializer(data=request.data, context={"match": match, "judge": judge})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        response_serializer = self.get_serializer(match)
        return Response(response_serializer.data, status=status.HTTP_200_OK)


class CoachMatchViewSet(ReadOnlyModelViewSet):
    serializer_class = CoachMatchSerializer

    def _get_current_coach(self):
        profile = getattr(self.request.user, "profile", None)
        if not profile or profile.role != Role.COACH:
            raise PermissionDenied("仅教练可以访问教练工作台。")
        try:
            return Coach.objects.get(name=profile.display_name, is_active=True)
        except Coach.DoesNotExist as exc:
            raise NotFound("当前账号没有匹配的教练档案。") from exc

    def _get_current_team(self):
        coach = self._get_current_coach()
        team = coach.teams.select_related("camp").filter(camp__is_active=True).first()
        if not team:
            team = coach.teams.select_related("camp").order_by("-camp__starts_on", "-camp_id").first()
        if not team:
            raise NotFound("当前教练还没有分配队伍。")
        return team

    def get_queryset(self):
        team = self._get_current_team()
        return (
            Match.objects.filter(integral_round__camp=team.camp)
            .filter(Q(affirmative_team=team) | Q(negative_team=team))
            .select_related("integral_round", "venue", "affirmative_team", "negative_team")
            .prefetch_related("positions", "positions__enrollment")
        )

    def get_object(self):
        team = self._get_current_team()
        try:
            return (
                Match.objects.filter(integral_round__camp=team.camp)
                .filter(id=self.kwargs["pk"])
                .filter(Q(affirmative_team=team) | Q(negative_team=team))
                .select_related("integral_round", "venue", "affirmative_team", "negative_team")
                .prefetch_related("positions", "positions__enrollment")
                .get()
            )
        except Match.DoesNotExist as exc:
            raise NotFound("未找到当前教练可编辑的比赛。") from exc

    def list(self, request, *args, **kwargs):
        team = self._get_current_team()
        matches = (
            Match.objects.filter(integral_round__camp=team.camp)
            .filter(affirmative_team=team)
            .select_related("integral_round", "venue", "affirmative_team", "negative_team")
            .prefetch_related("positions", "positions__enrollment")
        )
        negative_matches = (
            Match.objects.filter(integral_round__camp=team.camp)
            .filter(negative_team=team)
            .select_related("integral_round", "venue", "affirmative_team", "negative_team")
            .prefetch_related("positions", "positions__enrollment")
        )
        ordered_matches = sorted([*matches, *negative_matches], key=lambda match: (match.integral_round.number, match.starts_at, match.sequence))
        return Response(
            {
                "team": {
                    "id": team.id,
                    "name": team.name,
                    "camp": team.camp_id,
                    "camp_name": team.camp.name,
                    "coach_name": team.coach.name,
                },
                "members": CoachTeamMemberSerializer(team.members.select_related("student"), many=True).data,
                "matches": CoachMatchSerializer(ordered_matches, many=True, context={"team": team}).data,
            }
        )

    @action(detail=True, methods=["post"])
    def submit_positions(self, request, pk=None):
        team = self._get_current_team()
        match = self.get_object()
        side = DebateSide.AFFIRMATIVE if match.affirmative_team_id == team.id else DebateSide.NEGATIVE
        serializer = CoachPositionsSubmitSerializer(data=request.data, context={"match": match, "team": team, "side": side})
        serializer.is_valid(raise_exception=True)
        serializer.save()

        refreshed_match = (
            Match.objects.select_related("integral_round", "venue", "affirmative_team", "negative_team")
            .prefetch_related("positions", "positions__enrollment")
            .get(id=match.id)
        )
        return Response(CoachMatchSerializer(refreshed_match, context={"team": team}).data, status=status.HTTP_200_OK)

# Create your views here.
