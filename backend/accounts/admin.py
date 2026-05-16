from django.contrib import admin

from .models import UserProfile


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("display_name", "role", "user", "coach", "judge", "phone", "is_active")
    list_filter = ("role", "is_active")
    search_fields = ("display_name", "user__username", "phone", "coach__name", "judge__name")

# Register your models here.
