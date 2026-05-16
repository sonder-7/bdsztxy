from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import LoginView, MeView, UserAccountViewSet

router = DefaultRouter()
router.register("users", UserAccountViewSet, basename="user-account")

urlpatterns = [
    path("login/", LoginView.as_view(), name="login"),
    path("me/", MeView.as_view(), name="me"),
    path("", include(router.urls)),
]
