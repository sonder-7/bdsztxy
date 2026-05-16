from rest_framework.viewsets import ModelViewSet

from competitions.models import IntegralRound

from .models import Camp, CampEnrollment, Coach, Judge, Student, Team
from .permissions import IsAdminOrStaff
from .serializers import (
    CampEnrollmentSerializer,
    CampSerializer,
    CoachSerializer,
    JudgeSerializer,
    StudentSerializer,
    TeamSerializer,
)


class StaffModelViewSet(ModelViewSet):
    permission_classes = [IsAdminOrStaff]


class CampViewSet(StaffModelViewSet):
    queryset = Camp.objects.all()
    serializer_class = CampSerializer

    def perform_create(self, serializer):
        camp = serializer.save()
        for number in [1, 2, 3]:
            IntegralRound.objects.get_or_create(camp=camp, number=number)


class CoachViewSet(StaffModelViewSet):
    queryset = Coach.objects.all()
    serializer_class = CoachSerializer


class JudgeViewSet(StaffModelViewSet):
    queryset = Judge.objects.all()
    serializer_class = JudgeSerializer


class StudentViewSet(StaffModelViewSet):
    queryset = Student.objects.all()
    serializer_class = StudentSerializer


class TeamViewSet(StaffModelViewSet):
    queryset = Team.objects.select_related("camp", "coach").prefetch_related("members")
    serializer_class = TeamSerializer


class CampEnrollmentViewSet(StaffModelViewSet):
    queryset = CampEnrollment.objects.select_related("camp", "student", "team")
    serializer_class = CampEnrollmentSerializer

# Create your views here.
