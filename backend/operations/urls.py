from django.urls import path

from .views import OperationsDashboardView

urlpatterns = [
    path("dashboard/", OperationsDashboardView.as_view(), name="operations-dashboard"),
]
