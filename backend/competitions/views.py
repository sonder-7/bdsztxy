from rest_framework.viewsets import ModelViewSet

from camps.permissions import IsAdminOrStaff

from .models import CompetitionVenue, DebatePosition, IntegralRound, Match
from .serializers import CompetitionVenueSerializer, DebatePositionSerializer, IntegralRoundSerializer, MatchSerializer


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

# Create your views here.
