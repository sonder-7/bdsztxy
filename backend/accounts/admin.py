from django.contrib import admin

from .models import UserProfile


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("display_name", "role", "user", "phone", "is_active")
    list_filter = ("role", "is_active")
    search_fields = ("display_name", "user__username", "phone")

# Register your models here.
