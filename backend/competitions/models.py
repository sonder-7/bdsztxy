from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from camps.models import Camp, CampEnrollment, Judge, Team, TimeStampedModel


class DebateSide(models.TextChoices):
    AFFIRMATIVE = "affirmative", "正方"
    NEGATIVE = "negative", "反方"


class IntegralRound(TimeStampedModel):
    camp = models.ForeignKey(Camp, on_delete=models.CASCADE, related_name="integral_rounds")
    number = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(3)])
    topic = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ["camp", "number"]
        constraints = [
            models.UniqueConstraint(fields=["camp", "number"], name="unique_integral_round_per_camp"),
        ]

    def __str__(self) -> str:
        return f"{self.camp} 积分赛{self.number}"


class CompetitionVenue(TimeStampedModel):
    integral_round = models.ForeignKey(IntegralRound, on_delete=models.CASCADE, related_name="venues")
    name = models.CharField(max_length=80)
    judges = models.ManyToManyField(Judge, related_name="competition_venues", blank=True)

    class Meta:
        ordering = ["integral_round", "name"]
        constraints = [
            models.UniqueConstraint(fields=["integral_round", "name"], name="unique_competition_venue_per_round"),
        ]

    def __str__(self) -> str:
        return f"{self.integral_round} - {self.name}"


class Match(TimeStampedModel):
    integral_round = models.ForeignKey(IntegralRound, on_delete=models.CASCADE, related_name="matches")
    venue = models.ForeignKey(CompetitionVenue, on_delete=models.PROTECT, related_name="matches")
    sequence = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    starts_at = models.TimeField()
    affirmative_team = models.ForeignKey(Team, on_delete=models.PROTECT, related_name="affirmative_matches")
    negative_team = models.ForeignKey(Team, on_delete=models.PROTECT, related_name="negative_matches")
    best_speaker_override = models.ForeignKey(
        "DebatePosition",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="best_speaker_override_matches",
    )

    class Meta:
        ordering = ["integral_round", "venue__name", "sequence"]
        constraints = [
            models.UniqueConstraint(fields=["venue", "sequence"], name="unique_match_sequence_per_venue"),
        ]

    def clean(self) -> None:
        if self.affirmative_team_id and self.negative_team_id and self.affirmative_team_id == self.negative_team_id:
            raise ValidationError("同一队伍的正反方不能相遇。")

    def __str__(self) -> str:
        return f"{self.integral_round} {self.venue.name} 第{self.sequence}场"


class DebatePosition(TimeStampedModel):
    match = models.ForeignKey(Match, on_delete=models.CASCADE, related_name="positions")
    side = models.CharField(max_length=20, choices=DebateSide.choices)
    position_number = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(4)])
    enrollment = models.ForeignKey(CampEnrollment, on_delete=models.PROTECT, related_name="debate_positions")
    coach_note = models.TextField(blank=True)

    class Meta:
        ordering = ["match", "side", "position_number"]
        constraints = [
            models.UniqueConstraint(fields=["match", "side", "position_number"], name="unique_position_per_match_side"),
        ]

    @property
    def display_name(self) -> str:
        side = "正方" if self.side == DebateSide.AFFIRMATIVE else "反方"
        return f"{side}{self.position_number}辩"

    def __str__(self) -> str:
        return f"{self.match} {self.display_name} {self.enrollment.nickname}"


class JudgeBallot(TimeStampedModel):
    match = models.ForeignKey(Match, on_delete=models.CASCADE, related_name="ballots")
    judge = models.ForeignKey(Judge, on_delete=models.PROTECT, related_name="ballots")
    affirmative_votes = models.PositiveSmallIntegerField(default=0, validators=[MinValueValidator(0), MaxValueValidator(3)])
    negative_votes = models.PositiveSmallIntegerField(default=0, validators=[MinValueValidator(0), MaxValueValidator(3)])
    submitted_at = models.DateTimeField(null=True, blank=True)
    corrected_by_staff = models.BooleanField(default=False)
    correction_note = models.TextField(blank=True)

    class Meta:
        ordering = ["match", "judge__name"]
        constraints = [
            models.UniqueConstraint(fields=["match", "judge"], name="unique_ballot_per_match_judge"),
        ]

    def clean(self) -> None:
        if self.affirmative_votes + self.negative_votes != 3:
            raise ValidationError("每位评委每场比赛必须分配 3 张最终投票。")

    def __str__(self) -> str:
        return f"{self.match} - {self.judge}"


class PositionScore(TimeStampedModel):
    ballot = models.ForeignKey(JudgeBallot, on_delete=models.CASCADE, related_name="position_scores")
    position = models.ForeignKey(DebatePosition, on_delete=models.CASCADE, related_name="scores")
    score = models.DecimalField(max_digits=3, decimal_places=1, validators=[MinValueValidator(0), MaxValueValidator(9)])
    speech_record = models.TextField(blank=True)
    judge_feedback = models.TextField(blank=True)

    class Meta:
        ordering = ["ballot", "position__side", "position__position_number"]
        constraints = [
            models.UniqueConstraint(fields=["ballot", "position"], name="unique_position_score_per_ballot"),
        ]

    def __str__(self) -> str:
        return f"{self.ballot} - {self.position.display_name}"


class BestSpeakerVote(TimeStampedModel):
    ballot = models.ForeignKey(JudgeBallot, on_delete=models.CASCADE, related_name="best_speaker_votes")
    position = models.ForeignKey(DebatePosition, on_delete=models.CASCADE, related_name="best_speaker_votes")
    weight = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(3)])

    class Meta:
        ordering = ["ballot", "-weight"]
        constraints = [
            models.UniqueConstraint(fields=["ballot", "weight"], name="unique_best_speaker_weight_per_ballot"),
            models.UniqueConstraint(fields=["ballot", "position"], name="unique_best_speaker_position_per_ballot"),
        ]

    def __str__(self) -> str:
        return f"{self.ballot} - {self.position.display_name} +{self.weight}"

# Create your models here.
