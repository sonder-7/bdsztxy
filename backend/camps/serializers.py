from rest_framework import serializers

from .models import Camp, CampEnrollment, Coach, Judge, Student, Team


class CampSerializer(serializers.ModelSerializer):
    class Meta:
        model = Camp
        fields = ["id", "name", "season", "starts_on", "ends_on", "is_active"]


class CoachSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coach
        fields = ["id", "name", "phone", "note", "is_active"]


class JudgeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Judge
        fields = ["id", "name", "phone", "note", "is_active"]


class StudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = ["id", "real_name", "phone", "note"]


class TeamSerializer(serializers.ModelSerializer):
    coach_name = serializers.CharField(source="coach.name", read_only=True)
    member_count = serializers.SerializerMethodField()

    class Meta:
        model = Team
        fields = ["id", "camp", "name", "coach", "coach_name", "member_count"]

    def get_member_count(self, obj):
        return obj.members.count()


class CampEnrollmentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.real_name", read_only=True)
    team_name = serializers.CharField(source="team.name", read_only=True)

    class Meta:
        model = CampEnrollment
        fields = ["id", "camp", "student", "student_name", "nickname", "team", "team_name"]
