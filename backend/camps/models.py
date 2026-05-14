from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Camp(TimeStampedModel):
    name = models.CharField(max_length=120)
    season = models.CharField(max_length=60, blank=True)
    starts_on = models.DateField(null=True, blank=True)
    ends_on = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["-starts_on", "-id"]

    def __str__(self) -> str:
        return self.name


class Coach(TimeStampedModel):
    name = models.CharField(max_length=80)
    phone = models.CharField(max_length=40, blank=True)
    note = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class Judge(TimeStampedModel):
    name = models.CharField(max_length=80)
    phone = models.CharField(max_length=40, blank=True)
    note = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class Student(TimeStampedModel):
    real_name = models.CharField(max_length=80)
    phone = models.CharField(max_length=40, blank=True)
    note = models.TextField(blank=True)

    class Meta:
        ordering = ["real_name"]

    def __str__(self) -> str:
        return self.real_name


class Team(TimeStampedModel):
    camp = models.ForeignKey(Camp, on_delete=models.CASCADE, related_name="teams")
    name = models.CharField(max_length=80)
    coach = models.ForeignKey(Coach, on_delete=models.PROTECT, related_name="teams")

    class Meta:
        ordering = ["camp", "name"]
        constraints = [
            models.UniqueConstraint(fields=["camp", "name"], name="unique_team_name_per_camp"),
            models.UniqueConstraint(fields=["camp", "coach"], name="unique_coach_team_per_camp"),
        ]

    def __str__(self) -> str:
        return f"{self.camp} - {self.name}"


class CampEnrollment(TimeStampedModel):
    camp = models.ForeignKey(Camp, on_delete=models.CASCADE, related_name="enrollments")
    student = models.ForeignKey(Student, on_delete=models.PROTECT, related_name="camp_enrollments")
    nickname = models.CharField(max_length=80)
    team = models.ForeignKey(Team, on_delete=models.SET_NULL, null=True, blank=True, related_name="members")

    class Meta:
        ordering = ["camp", "team__name", "nickname"]
        constraints = [
            models.UniqueConstraint(fields=["camp", "student"], name="unique_student_per_camp"),
            models.UniqueConstraint(fields=["camp", "nickname"], name="unique_nickname_per_camp"),
        ]

    def __str__(self) -> str:
        return f"{self.nickname} / {self.camp}"


class FiveDimensionScoreMixin(models.Model):
    viewpoint = models.DecimalField("观点生产", max_digits=3, decimal_places=1, validators=[MinValueValidator(1), MaxValueValidator(5)])
    personality = models.DecimalField("个性张力", max_digits=3, decimal_places=1, validators=[MinValueValidator(1), MaxValueValidator(5)])
    emotion = models.DecimalField("情感传达", max_digits=3, decimal_places=1, validators=[MinValueValidator(1), MaxValueValidator(5)])
    reasoning = models.DecimalField("事理表述", max_digits=3, decimal_places=1, validators=[MinValueValidator(1), MaxValueValidator(5)])
    clash = models.DecimalField("攻防交锋", max_digits=3, decimal_places=1, validators=[MinValueValidator(1), MaxValueValidator(5)])

    class Meta:
        abstract = True

# Create your models here.
