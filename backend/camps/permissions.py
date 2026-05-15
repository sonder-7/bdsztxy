from rest_framework.permissions import BasePermission

from accounts.models import Role


class IsAdminOrStaff(BasePermission):
    def has_permission(self, request, view):
        profile = getattr(request.user, "profile", None)
        return bool(profile and profile.role in {Role.ADMIN, Role.STAFF})
