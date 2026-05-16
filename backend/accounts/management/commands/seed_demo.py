from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from accounts.models import Role, UserProfile
from camps.models import Camp, CampEnrollment, Coach, Judge, Student, Team
from competitions.models import CompetitionVenue, DebatePosition, DebateSide, IntegralRound, Match


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

        camp, _ = Camp.objects.update_or_create(
            name="2026 春季表达实战特训营",
            defaults={"season": "2026 春季", "starts_on": "2026-05-01", "ends_on": "2026-05-07", "is_active": True},
        )

        coach_names = ["示例教练", "林教练", "周教练", "陈教练"]
        coaches = [
            Coach.objects.update_or_create(name=name, defaults={"is_active": True})[0]
            for name in coach_names
        ]

        judge_names = ["示例评委", "许评委", "沈评委"]
        judges = [
            Judge.objects.update_or_create(name=name, defaults={"is_active": True})[0]
            for name in judge_names
        ]

        UserProfile.objects.filter(user__username="coach").update(coach=coaches[0], judge=None)
        UserProfile.objects.filter(user__username="judge").update(judge=judges[0], coach=None)
        UserProfile.objects.filter(user__username__in=["admin", "staff"]).update(coach=None, judge=None)

        team_specs = [
            ("赤焰队", coaches[0], ["小鹿", "阿澈", "星河", "南乔", "清欢", "砚舟", "知夏", "予安"]),
            ("蓝锋队", coaches[1], ["青柠", "林深", "北辰", "云起", "明烛", "司南", "一川", "清越"]),
            ("晨光队", coaches[2], ["温言", "竹白", "若谷", "安禾", "景行", "澄明", "听澜", "子衿"]),
            ("鲸落队", coaches[3], ["洛川", "云岫", "初白", "星野", "沐辰", "知微", "南栀", "青原"]),
        ]

        teams = []
        enrollments_by_team = {}
        for team_name, coach, nicknames in team_specs:
            team, _ = Team.objects.update_or_create(camp=camp, name=team_name, defaults={"coach": coach})
            teams.append(team)
            enrollments_by_team[team_name] = []
            for nickname in nicknames:
                student, _ = Student.objects.update_or_create(real_name=f"{nickname}同学")
                enrollment, _ = CampEnrollment.objects.update_or_create(
                    camp=camp,
                    student=student,
                    defaults={"nickname": nickname, "team": team},
                )
                enrollments_by_team[team_name].append(enrollment)

        round_topics = {
            1: "人工智能是否会提升人类创造力",
            2: "成年人是否更应该追求稳定",
            3: "表达能力是否比专业能力更影响职场发展",
        }
        round_match_specs = {
            1: [
                (1, "08:00", teams[0], teams[1]),
                (2, "09:00", teams[2], teams[3]),
            ],
            2: [
                (1, "08:00", teams[0], teams[2]),
                (2, "09:00", teams[1], teams[3]),
            ],
            3: [
                (1, "08:00", teams[0], teams[3]),
                (2, "09:00", teams[1], teams[2]),
            ],
        }

        for round_number in [1, 2, 3]:
            integral_round, _ = IntegralRound.objects.update_or_create(
                camp=camp,
                number=round_number,
                defaults={"topic": round_topics[round_number]},
            )

            venue, _ = CompetitionVenue.objects.update_or_create(integral_round=integral_round, name="A 会场")
            venue.judges.set(judges)

            for sequence, starts_at, affirmative_team, negative_team in round_match_specs[round_number]:
                match, _ = Match.objects.update_or_create(
                    integral_round=integral_round,
                    venue=venue,
                    sequence=sequence,
                    defaults={
                        "starts_at": starts_at,
                        "affirmative_team": affirmative_team,
                        "negative_team": negative_team,
                    },
                )
                affirmative_enrollments = enrollments_by_team[affirmative_team.name][:4]
                negative_enrollments = enrollments_by_team[negative_team.name][:4]
                for index, enrollment in enumerate(affirmative_enrollments, start=1):
                    DebatePosition.objects.update_or_create(
                        match=match,
                        side=DebateSide.AFFIRMATIVE,
                        position_number=index,
                        defaults={"enrollment": enrollment, "coach_note": "示例教练备注，后续由教练端录入。"},
                    )
                for index, enrollment in enumerate(negative_enrollments, start=1):
                    DebatePosition.objects.update_or_create(
                        match=match,
                        side=DebateSide.NEGATIVE,
                        position_number=index,
                        defaults={"enrollment": enrollment, "coach_note": "示例教练备注，后续由教练端录入。"},
                    )

        self.stdout.write(self.style.SUCCESS("Seeded demo camp, teams, judges, venues, matches, and positions."))
