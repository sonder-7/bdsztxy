from django.contrib import admin

from .models import AssessmentAssignment, AssessmentVenue, EntranceAssessmentScore, GraduationEvaluation


@admin.register(AssessmentVenue)
class AssessmentVenueAdmin(admin.ModelAdmin):
    list_display = ("name", "camp")
    list_filter = ("camp",)
    search_fields = ("name", "camp__name")
    filter_horizontal = ("coaches",)


@admin.register(AssessmentAssignment)
class AssessmentAssignmentAdmin(admin.ModelAdmin):
    list_display = ("enrollment", "venue")
    list_filter = ("venue__camp", "venue")
    search_fields = ("enrollment__nickname",)


@admin.register(EntranceAssessmentScore)
class EntranceAssessmentScoreAdmin(admin.ModelAdmin):
    list_display = ("assignment", "coach", "viewpoint", "personality", "emotion", "reasoning", "clash")
    list_filter = ("assignment__venue__camp", "coach")
    search_fields = ("assignment__enrollment__nickname", "coach__name")


@admin.register(GraduationEvaluation)
class GraduationEvaluationAdmin(admin.ModelAdmin):
    list_display = ("enrollment", "coach", "updated_at")
    list_filter = ("enrollment__camp", "coach")
    search_fields = ("enrollment__nickname", "coach__name")

# Register your models here.
