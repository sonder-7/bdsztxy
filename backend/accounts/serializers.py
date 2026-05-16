from django.contrib.auth import authenticate
from django.contrib.auth import get_user_model
from rest_framework import serializers

from camps.models import Coach, Judge

from .models import Role, UserProfile


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate(self, attrs):
        user = authenticate(username=attrs["username"], password=attrs["password"])
        if not user:
            raise serializers.ValidationError("账号或密码错误。")
        if not user.is_active:
            raise serializers.ValidationError("账号已停用。")
        if not hasattr(user, "profile") or not user.profile.is_active:
            raise serializers.ValidationError("账号角色未启用。")
        attrs["user"] = user
        return attrs


class UserAccountSerializer(serializers.ModelSerializer):
    role = serializers.CharField(source="profile.role")
    display_name = serializers.CharField(source="profile.display_name")
    phone = serializers.CharField(source="profile.phone", required=False, allow_blank=True)
    profile_is_active = serializers.BooleanField(source="profile.is_active", required=False)
    coach = serializers.PrimaryKeyRelatedField(source="profile.coach", queryset=Coach.objects.all(), required=False, allow_null=True)
    coach_name = serializers.CharField(source="profile.coach.name", read_only=True)
    judge = serializers.PrimaryKeyRelatedField(source="profile.judge", queryset=Judge.objects.all(), required=False, allow_null=True)
    judge_name = serializers.CharField(source="profile.judge.name", read_only=True)
    password = serializers.CharField(write_only=True, required=False, trim_whitespace=False)

    class Meta:
        model = get_user_model()
        fields = [
            "id",
            "username",
            "password",
            "is_active",
            "role",
            "display_name",
            "phone",
            "profile_is_active",
            "coach",
            "coach_name",
            "judge",
            "judge_name",
        ]

    def validate(self, attrs):
        profile_data = attrs.get("profile", {})
        role = profile_data.get("role", getattr(getattr(self.instance, "profile", None), "role", None))
        coach = profile_data.get("coach", getattr(getattr(self.instance, "profile", None), "coach", None))
        judge = profile_data.get("judge", getattr(getattr(self.instance, "profile", None), "judge", None))
        if role == Role.COACH and not coach:
            raise serializers.ValidationError("教练账号必须绑定教练档案。")
        if role == Role.JUDGE and not judge:
            raise serializers.ValidationError("评委账号必须绑定评委档案。")
        return attrs

    def create(self, validated_data):
        profile_data = validated_data.pop("profile")
        password = validated_data.pop("password", None)
        user = get_user_model().objects.create(**validated_data)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save()
        UserProfile.objects.create(user=user, **profile_data)
        return user

    def update(self, instance, validated_data):
        profile_data = validated_data.pop("profile", {})
        password = validated_data.pop("password", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()

        profile = instance.profile
        for attr, value in profile_data.items():
            setattr(profile, attr, value)
        if profile.role != Role.COACH:
            profile.coach = None
        if profile.role != Role.JUDGE:
            profile.judge = None
        profile.save()
        return instance
