from django.contrib import admin

from .models import (
    BestSpeakerVote,
    CompetitionVenue,
    DebatePosition,
    IntegralRound,
    JudgeBallot,
    Match,
    PositionScore,
)


@admin.register(IntegralRound)
class IntegralRoundAdmin(admin.ModelAdmin):
    list_display = ("camp", "number", "topic")
    list_filter = ("camp",)
    search_fields = ("camp__name", "topic")


@admin.register(CompetitionVenue)
class CompetitionVenueAdmin(admin.ModelAdmin):
    list_display = ("name", "integral_round")
    list_filter = ("integral_round__camp", "integral_round")
    filter_horizontal = ("judges",)


@admin.register(Match)
class MatchAdmin(admin.ModelAdmin):
    list_display = ("integral_round", "venue", "sequence", "starts_at", "affirmative_team", "negative_team")
    list_filter = ("integral_round__camp", "integral_round", "venue")
    search_fields = ("affirmative_team__name", "negative_team__name")


@admin.register(DebatePosition)
class DebatePositionAdmin(admin.ModelAdmin):
    list_display = ("match", "side", "position_number", "enrollment")
    list_filter = ("match__integral_round__camp", "side")
    search_fields = ("enrollment__nickname",)


@admin.register(JudgeBallot)
class JudgeBallotAdmin(admin.ModelAdmin):
    list_display = ("match", "judge", "affirmative_votes", "negative_votes", "submitted_at", "corrected_by_staff")
    list_filter = ("match__integral_round__camp", "judge", "corrected_by_staff")


@admin.register(PositionScore)
class PositionScoreAdmin(admin.ModelAdmin):
    list_display = ("ballot", "position", "score")
    list_filter = ("ballot__match__integral_round__camp",)


@admin.register(BestSpeakerVote)
class BestSpeakerVoteAdmin(admin.ModelAdmin):
    list_display = ("ballot", "position", "weight")
    list_filter = ("ballot__match__integral_round__camp",)

# Register your models here.
