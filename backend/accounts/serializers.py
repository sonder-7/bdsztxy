from django.contrib.auth import authenticate
from rest_framework import serializers


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
