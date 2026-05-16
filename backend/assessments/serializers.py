from rest_framework import serializers

from camps.models import CampEnrollment

from .models import AssessmentAssignment, AssessmentVenue, EntranceAssessmentScore, GraduationEvaluation


DIMENSION_FIELDS = ["viewpoint", "personality", "emotion", "reasoning", "clash"]


class AssessmentVenueSerializer(serializers.ModelSerializer):
    coach_names = serializers.SerializerMethodField()

    class Meta:
        model = AssessmentVenue
        fields = ["id", "camp", "name", "coaches", "coach_names"]

    def get_coach_names(self, obj):
        return [coach.name for coach in obj.coaches.all()]


class AssessmentAssignmentSerializer(serializers.ModelSerializer):
    enrollment_nickname = serializers.CharField(source="enrollment.nickname", read_only=True)
    student_name = serializers.CharField(source="enrollment.student.real_name", read_only=True)
    venue_name = serializers.CharField(source="venue.name", read_only=True)

    class Meta:
        model = AssessmentAssignment
        fields = ["id", "venue", "venue_name", "enrollment", "enrollment_nickname", "student_name"]


class EntranceAssessmentScoreSerializer(serializers.ModelSerializer):
    coach_name = serializers.CharField(source="coach.name", read_only=True)

    class Meta:
        model = EntranceAssessmentScore
        fields = [*DIMENSION_FIELDS, "id", "assignment", "coach", "coach_name", "note"]


class GraduationEvaluationSerializer(serializers.ModelSerializer):
    enrollment_nickname = serializers.CharField(source="enrollment.nickname", read_only=True)
    coach_name = serializers.CharField(source="coach.name", read_only=True)

    class Meta:
        model = GraduationEvaluation
        fields = [
            *DIMENSION_FIELDS,
            "id",
            "enrollment",
            "enrollment_nickname",
            "coach",
            "coach_name",
            "viewpoint_text",
            "personality_text",
            "emotion_text",
            "reasoning_text",
            "clash_text",
            "message",
            "exported_image",
        ]
        read_only_fields = ["coach", "exported_image"]


def entrance_average_for_enrollment(enrollment: CampEnrollment):
    assignment = getattr(enrollment, "assessment_assignment", None)
    if not assignment:
        return None
    scores = list(assignment.scores.all())
    if not scores:
        return None
    return {
        field: round(sum(float(getattr(score, field)) for score in scores) / len(scores), 1)
        for field in DIMENSION_FIELDS
    }
