from rest_framework.response import Response
from rest_framework.views import APIView

from camps.models import Camp, Judge, Team
from camps.permissions import IsAdminOrStaff
from camps.serializers import CampSerializer, JudgeSerializer, TeamSerializer
from competitions.models import CompetitionVenue, IntegralRound, Match
from competitions.serializers import CompetitionVenueSerializer, IntegralRoundSerializer, MatchSerializer


class OperationsDashboardView(APIView):
    permission_classes = [IsAdminOrStaff]

    def get(self, request):
        camp = Camp.objects.filter(is_active=True).order_by("-starts_on", "-id").first()
        if not camp:
            camp = Camp.objects.order_by("-starts_on", "-id").first()

        rounds = IntegralRound.objects.none()
        venues = CompetitionVenue.objects.none()
        matches = Match.objects.none()
        teams = Team.objects.none()

        if camp:
            rounds = IntegralRound.objects.filter(camp=camp).prefetch_related("matches")
            venues = CompetitionVenue.objects.filter(integral_round__camp=camp).prefetch_related("judges")
            matches = Match.objects.filter(integral_round__camp=camp).select_related(
                "integral_round",
                "venue",
                "affirmative_team",
                "negative_team",
            )
            teams = Team.objects.filter(camp=camp).select_related("coach").prefetch_related("members")

        return Response(
            {
                "activeCamp": CampSerializer(camp).data if camp else None,
                "rounds": IntegralRoundSerializer(rounds, many=True).data,
                "venues": CompetitionVenueSerializer(venues, many=True).data,
                "matches": MatchSerializer(matches, many=True).data,
                "teams": TeamSerializer(teams, many=True).data,
                "judges": JudgeSerializer(Judge.objects.filter(is_active=True), many=True).data,
            }
        )
