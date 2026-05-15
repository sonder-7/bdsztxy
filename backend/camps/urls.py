from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import CampEnrollmentViewSet, CampViewSet, CoachViewSet, JudgeViewSet, StudentViewSet, TeamViewSet

router = DefaultRouter()
router.register("camps", CampViewSet, basename="camp")
router.register("coaches", CoachViewSet, basename="coach")
router.register("judges", JudgeViewSet, basename="judge")
router.register("students", StudentViewSet, basename="student")
router.register("teams", TeamViewSet, basename="team")
router.register("enrollments", CampEnrollmentViewSet, basename="enrollment")

urlpatterns = [
    path("", include(router.urls)),
]
