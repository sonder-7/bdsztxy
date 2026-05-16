from django.urls import path

from .views import JudgeRecordsExportView, OperationsDashboardView, StudentStatsExportView, TeamRankingExportView

urlpatterns = [
    path("dashboard/", OperationsDashboardView.as_view(), name="operations-dashboard"),
    path("exports/team-rankings.xlsx", TeamRankingExportView.as_view(), name="export-team-rankings"),
    path("exports/student-stats.xlsx", StudentStatsExportView.as_view(), name="export-student-stats"),
    path("exports/judge-records.xlsx", JudgeRecordsExportView.as_view(), name="export-judge-records"),
]
