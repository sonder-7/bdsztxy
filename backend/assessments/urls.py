from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import AssessmentAssignmentViewSet, AssessmentVenueViewSet, CoachAssessmentViewSet

router = DefaultRouter()
router.register("venues", AssessmentVenueViewSet, basename="assessment-venue")
router.register("assignments", AssessmentAssignmentViewSet, basename="assessment-assignment")
router.register("coach", CoachAssessmentViewSet, basename="coach-assessment")

urlpatterns = [
    path("", include(router.urls)),
]
