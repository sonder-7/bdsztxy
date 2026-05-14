from django.contrib import admin

from .models import Camp, CampEnrollment, Coach, Judge, Student, Team


@admin.register(Camp)
class CampAdmin(admin.ModelAdmin):
    list_display = ("name", "season", "starts_on", "ends_on", "is_active")
    list_filter = ("is_active",)
    search_fields = ("name", "season")


@admin.register(Coach)
class CoachAdmin(admin.ModelAdmin):
    list_display = ("name", "phone", "is_active")
    list_filter = ("is_active",)
    search_fields = ("name", "phone")


@admin.register(Judge)
class JudgeAdmin(admin.ModelAdmin):
    list_display = ("name", "phone", "is_active")
    list_filter = ("is_active",)
    search_fields = ("name", "phone")


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ("real_name", "phone")
    search_fields = ("real_name", "phone")


@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ("name", "camp", "coach")
    list_filter = ("camp",)
    search_fields = ("name", "coach__name")


@admin.register(CampEnrollment)
class CampEnrollmentAdmin(admin.ModelAdmin):
    list_display = ("nickname", "student", "camp", "team")
    list_filter = ("camp", "team")
    search_fields = ("nickname", "student__real_name")

# Register your models here.
