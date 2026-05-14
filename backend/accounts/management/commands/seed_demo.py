from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from accounts.models import Role, UserProfile


DEMO_USERS = [
    ("admin", "admin123456", Role.ADMIN, "系统管理员"),
    ("staff", "staff123456", Role.STAFF, "赛事工作人员"),
    ("coach", "coach123456", Role.COACH, "示例教练"),
    ("judge", "judge123456", Role.JUDGE, "示例评委"),
]


class Command(BaseCommand):
    help = "Seed built-in demo accounts for local development."

    def handle(self, *args, **options):
        User = get_user_model()
        for username, password, role, display_name in DEMO_USERS:
            user, created = User.objects.get_or_create(username=username)
            user.set_password(password)
            user.is_staff = role == Role.ADMIN
            user.is_superuser = role == Role.ADMIN
            user.save()

            UserProfile.objects.update_or_create(
                user=user,
                defaults={"role": role, "display_name": display_name, "is_active": True},
            )
            verb = "Created" if created else "Updated"
            self.stdout.write(self.style.SUCCESS(f"{verb} {username} / {password}"))
