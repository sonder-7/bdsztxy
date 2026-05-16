from rest_framework.authtoken.models import Token
from rest_framework.permissions import BasePermission
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet
from django.contrib.auth import get_user_model

from .models import Role
from .serializers import LoginSerializer, UserAccountSerializer


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        profile = getattr(request.user, "profile", None)
        return bool(profile and profile.role == Role.ADMIN)


def user_payload(user):
    profile = user.profile
    return {
        "id": user.id,
        "username": user.username,
        "displayName": profile.display_name,
        "role": profile.role,
        "roleLabel": profile.get_role_display(),
        "coach": profile.coach_id,
        "judge": profile.judge_id,
    }


class LoginView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        token, _ = Token.objects.get_or_create(user=user)
        return Response({"token": token.key, "user": user_payload(user)})


class MeView(APIView):
    def get(self, request):
        return Response({"user": user_payload(request.user)})


class UserAccountViewSet(ModelViewSet):
    permission_classes = [IsAdmin]
    serializer_class = UserAccountSerializer
    queryset = get_user_model().objects.select_related("profile", "profile__coach", "profile__judge").order_by("username")

# Create your views here.
