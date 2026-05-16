from django.conf import settings
from django.db import models

from camps.models import Coach, Judge


class Role(models.TextChoices):
    ADMIN = "admin", "管理员"
    STAFF = "staff", "工作人员"
    COACH = "coach", "教练"
    JUDGE = "judge", "评委"


class UserProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile")
    role = models.CharField(max_length=20, choices=Role.choices)
    display_name = models.CharField(max_length=80)
    phone = models.CharField(max_length=40, blank=True)
    coach = models.ForeignKey(Coach, null=True, blank=True, on_delete=models.SET_NULL, related_name="user_profiles")
    judge = models.ForeignKey(Judge, null=True, blank=True, on_delete=models.SET_NULL, related_name="user_profiles")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["role", "display_name"]

    def __str__(self) -> str:
        return f"{self.display_name} ({self.get_role_display()})"

# Create your models here.
