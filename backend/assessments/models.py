from django.db import models

from camps.models import Camp, CampEnrollment, Coach, FiveDimensionScoreMixin, TimeStampedModel


class AssessmentVenue(TimeStampedModel):
    camp = models.ForeignKey(Camp, on_delete=models.CASCADE, related_name="assessment_venues")
    name = models.CharField(max_length=80)
    coaches = models.ManyToManyField(Coach, related_name="assessment_venues", blank=True)

    class Meta:
        ordering = ["camp", "name"]
        constraints = [
            models.UniqueConstraint(fields=["camp", "name"], name="unique_assessment_venue_per_camp"),
        ]

    def __str__(self) -> str:
        return f"{self.camp} - {self.name}"


class AssessmentAssignment(TimeStampedModel):
    venue = models.ForeignKey(AssessmentVenue, on_delete=models.CASCADE, related_name="assignments")
    enrollment = models.OneToOneField(CampEnrollment, on_delete=models.CASCADE, related_name="assessment_assignment")

    class Meta:
        ordering = ["venue", "enrollment__nickname"]

    def __str__(self) -> str:
        return f"{self.enrollment} @ {self.venue.name}"


class EntranceAssessmentScore(FiveDimensionScoreMixin, TimeStampedModel):
    assignment = models.ForeignKey(AssessmentAssignment, on_delete=models.CASCADE, related_name="scores")
    coach = models.ForeignKey(Coach, on_delete=models.PROTECT, related_name="entrance_scores")
    note = models.TextField(blank=True)

    class Meta:
        ordering = ["assignment", "coach__name"]
        constraints = [
            models.UniqueConstraint(fields=["assignment", "coach"], name="unique_entrance_score_per_coach"),
        ]

    def __str__(self) -> str:
        return f"{self.assignment.enrollment.nickname} - {self.coach}"


class GraduationEvaluation(FiveDimensionScoreMixin, TimeStampedModel):
    enrollment = models.OneToOneField(CampEnrollment, on_delete=models.CASCADE, related_name="graduation_evaluation")
    coach = models.ForeignKey(Coach, on_delete=models.PROTECT, related_name="graduation_evaluations")
    viewpoint_text = models.TextField("观点生产评价", blank=True)
    personality_text = models.TextField("个性张力评价", blank=True)
    emotion_text = models.TextField("情感传达评价", blank=True)
    reasoning_text = models.TextField("事理表述评价", blank=True)
    clash_text = models.TextField("攻防交锋评价", blank=True)
    message = models.TextField("结营寄语", blank=True)
    exported_image = models.ImageField(upload_to="graduation_exports/", blank=True)

    class Meta:
        ordering = ["enrollment__camp", "enrollment__team__name", "enrollment__nickname"]

    def __str__(self) -> str:
        return f"{self.enrollment.nickname} 结营评定"

# Create your models here.
