from io import BytesIO

from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from PIL import Image, ImageDraw, ImageFont
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet, ViewSet

from accounts.models import Role
from camps.models import CampEnrollment
from camps.permissions import IsAdminOrStaff

from .models import AssessmentAssignment, AssessmentVenue, EntranceAssessmentScore, GraduationEvaluation
from .serializers import (
    AssessmentAssignmentSerializer,
    AssessmentVenueSerializer,
    DIMENSION_FIELDS,
    EntranceAssessmentScoreSerializer,
    GraduationEvaluationSerializer,
    entrance_average_for_enrollment,
)


class AssessmentVenueViewSet(ModelViewSet):
    permission_classes = [IsAdminOrStaff]
    queryset = AssessmentVenue.objects.select_related("camp").prefetch_related("coaches")
    serializer_class = AssessmentVenueSerializer


class AssessmentAssignmentViewSet(ModelViewSet):
    permission_classes = [IsAdminOrStaff]
    queryset = AssessmentAssignment.objects.select_related("venue", "enrollment", "enrollment__student")
    serializer_class = AssessmentAssignmentSerializer


def _current_coach(user):
    profile = getattr(user, "profile", None)
    if not profile or profile.role != Role.COACH:
        raise PermissionDenied("仅教练可以访问测评与结营评定。")
    if not profile.coach_id or not profile.coach.is_active:
        raise NotFound("当前账号没有绑定可用的教练档案。")
    return profile.coach


def _score_payload(data):
    payload = {field: data.get(field) for field in DIMENSION_FIELDS}
    missing = [field for field, value in payload.items() if value in ("", None)]
    if missing:
        raise ValueError("五维分数必须填写完整。")
    return payload


def _font(size):
    for path in [
        "/System/Library/Fonts/PingFang.ttc",
        "/System/Library/Fonts/STHeiti Light.ttc",
        "/Library/Fonts/Arial Unicode.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]:
        try:
            return ImageFont.truetype(path, size)
        except OSError:
            continue
    return ImageFont.load_default()


class CoachAssessmentViewSet(ViewSet):
    def list(self, request):
        coach = _current_coach(request.user)
        team = coach.teams.select_related("camp").filter(camp__is_active=True).first()
        if not team:
            team = coach.teams.select_related("camp").order_by("-camp__starts_on", "-camp_id").first()
        assignments = (
            AssessmentAssignment.objects.filter(venue__coaches=coach)
            .select_related("venue", "enrollment", "enrollment__student", "enrollment__team")
            .prefetch_related("scores")
            .distinct()
        )
        members = CampEnrollment.objects.none()
        if team:
            members = (
                team.members.select_related("student", "team")
                .prefetch_related("assessment_assignment__scores", "graduation_evaluation")
                .order_by("nickname")
            )
        return Response(
            {
                "entranceAssignments": [
                    {
                        "id": assignment.id,
                        "venue": assignment.venue_id,
                        "venue_name": assignment.venue.name,
                        "enrollment": assignment.enrollment_id,
                        "nickname": assignment.enrollment.nickname,
                        "student_name": assignment.enrollment.student.real_name,
                        "score": EntranceAssessmentScoreSerializer(
                            next((score for score in assignment.scores.all() if score.coach_id == coach.id), None)
                        ).data
                        if any(score.coach_id == coach.id for score in assignment.scores.all())
                        else None,
                    }
                    for assignment in assignments
                ],
                "graduationMembers": [
                    {
                        "enrollment": enrollment.id,
                        "nickname": enrollment.nickname,
                        "student_name": enrollment.student.real_name,
                        "team_name": enrollment.team.name if enrollment.team else "",
                        "entrance_average": entrance_average_for_enrollment(enrollment),
                        "evaluation": GraduationEvaluationSerializer(getattr(enrollment, "graduation_evaluation", None)).data
                        if hasattr(enrollment, "graduation_evaluation")
                        else None,
                    }
                    for enrollment in members
                ],
            }
        )

    @action(detail=True, methods=["post"])
    def score(self, request, pk=None):
        coach = _current_coach(request.user)
        assignment = get_object_or_404(AssessmentAssignment.objects.filter(venue__coaches=coach), id=pk)
        try:
            payload = _score_payload(request.data)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        score, _ = EntranceAssessmentScore.objects.update_or_create(
            assignment=assignment,
            coach=coach,
            defaults={**payload, "note": request.data.get("note", "")},
        )
        return Response(EntranceAssessmentScoreSerializer(score).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"])
    def evaluate(self, request, pk=None):
        coach = _current_coach(request.user)
        enrollment = get_object_or_404(CampEnrollment.objects.filter(team__coach=coach), id=pk)
        try:
            payload = _score_payload(request.data)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        evaluation, _ = GraduationEvaluation.objects.update_or_create(
            enrollment=enrollment,
            defaults={
                **payload,
                "coach": coach,
                "viewpoint_text": request.data.get("viewpoint_text", ""),
                "personality_text": request.data.get("personality_text", ""),
                "emotion_text": request.data.get("emotion_text", ""),
                "reasoning_text": request.data.get("reasoning_text", ""),
                "clash_text": request.data.get("clash_text", ""),
                "message": request.data.get("message", ""),
            },
        )
        return Response(GraduationEvaluationSerializer(evaluation).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["get"])
    def export(self, request, pk=None):
        coach = _current_coach(request.user)
        enrollment = get_object_or_404(
            CampEnrollment.objects.select_related("student", "team").prefetch_related("assessment_assignment__scores").filter(team__coach=coach),
            id=pk,
        )
        evaluation = get_object_or_404(GraduationEvaluation, enrollment=enrollment, coach=coach)
        entrance_average = entrance_average_for_enrollment(enrollment)

        image = Image.new("RGB", (1200, 1600), "#f8fafc")
        draw = ImageDraw.Draw(image)
        title_font = _font(42)
        subtitle_font = _font(28)
        body_font = _font(24)
        small_font = _font(20)
        draw.rectangle((0, 0, 1200, 220), fill="#111827")
        draw.text((70, 60), "表达实战特训营 · 结营评定", fill="#ffffff", font=title_font)
        draw.text((70, 130), f"{enrollment.nickname} / 教练：{coach.name}", fill="#e5e7eb", font=subtitle_font)
        y = 280
        labels = [
            ("观点生产", "viewpoint", evaluation.viewpoint_text),
            ("个性张力", "personality", evaluation.personality_text),
            ("情感传达", "emotion", evaluation.emotion_text),
            ("事理表述", "reasoning", evaluation.reasoning_text),
            ("攻防交锋", "clash", evaluation.clash_text),
        ]
        for label, field, text in labels:
            initial = entrance_average[field] if entrance_average else "-"
            final = getattr(evaluation, field)
            draw.text((70, y), f"{label}  初始：{initial}  结营：{final}", fill="#111827", font=body_font)
            draw.rectangle((70, y + 34, 1130, y + 36), fill="#e5e7eb")
            for line_index, line in enumerate([text[i:i + 44] for i in range(0, len(text), 44)][:3]):
                draw.text((70, y + 58 + line_index * 28), line, fill="#334155", font=small_font)
            y += 205
        draw.text((70, y + 20), "结营寄语", fill="#111827", font=body_font)
        for line_index, line in enumerate([evaluation.message[i:i + 46] for i in range(0, len(evaluation.message), 46)][:5]):
            draw.text((70, y + 64 + line_index * 30), line, fill="#334155", font=small_font)

        buffer = BytesIO()
        image.save(buffer, format="PNG")
        buffer.seek(0)
        response = HttpResponse(buffer.getvalue(), content_type="image/png")
        response["Content-Disposition"] = f'attachment; filename="graduation-{enrollment.nickname}.png"'
        return response
