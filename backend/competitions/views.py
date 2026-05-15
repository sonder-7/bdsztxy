from rest_framework import status
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet, ReadOnlyModelViewSet

from accounts.models import Role
from camps.models import Judge
from camps.permissions import IsAdminOrStaff

from .models import CompetitionVenue, DebatePosition, IntegralRound, JudgeBallot, Match
from .serializers import (
    CompetitionVenueSerializer,
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

# Create your views here.
