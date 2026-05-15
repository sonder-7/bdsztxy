from rest_framework.response import Response
from rest_framework.views import APIView

from camps.models import Camp, Judge, Team
from camps.permissions import IsAdminOrStaff
from camps.serializers import CampSerializer, JudgeSerializer, TeamSerializer
from competitions.models import CompetitionVenue, DebateSide, IntegralRound, Match
from competitions.serializers import CompetitionVenueSerializer, IntegralRoundSerializer, MatchSerializer


def _match_review_summary(match):
    assigned_judges = list(match.venue.judges.all())
    ballots = list(match.ballots.all())
    submitted_ballots = [ballot for ballot in ballots if ballot.submitted_at]
    draft_ballots = [ballot for ballot in ballots if not ballot.submitted_at]
    positions = list(match.positions.all())
    positions_by_id = {position.id: position for position in positions}
    expected_score_count = len(assigned_judges) * len(positions)
    submitted_score_count = sum(ballot.position_scores.count() for ballot in submitted_ballots)
    position_score_totals = {DebateSide.AFFIRMATIVE: 0.0, DebateSide.NEGATIVE: 0.0}
    best_speaker_totals = {}

    for ballot in submitted_ballots:
        for score in ballot.position_scores.all():
            position = positions_by_id.get(score.position_id)
            if position:
                position_score_totals[position.side] += float(score.score)
        for vote in ballot.best_speaker_votes.all():
            position = positions_by_id.get(vote.position_id)
            if not position:
                continue
            current = best_speaker_totals.setdefault(
                vote.position_id,
                {
                    "position": vote.position_id,
                    "label": position.display_name,
                    "speaker": position.enrollment.nickname,
                    "side": position.side,
                    "votes": 0,
                },
            )
            current["votes"] += vote.weight

    affirmative_votes = sum(ballot.affirmative_votes for ballot in submitted_ballots)
    negative_votes = sum(ballot.negative_votes for ballot in submitted_ballots)
    affirmative_position_score = position_score_totals[DebateSide.AFFIRMATIVE]
    negative_position_score = position_score_totals[DebateSide.NEGATIVE]
    affirmative_points = round(affirmative_position_score * 0.15 + affirmative_votes, 2)
    negative_points = round(negative_position_score * 0.15 + negative_votes, 2)

    return {
        "match": match.id,
        "round_number": match.integral_round.number,
        "venue_name": match.venue.name,
        "sequence": match.sequence,
        "starts_at": match.starts_at.strftime("%H:%M"),
        "topic": match.integral_round.topic,
        "affirmative_team": match.affirmative_team_id,
        "affirmative_team_name": match.affirmative_team.name,
        "negative_team": match.negative_team_id,
        "negative_team_name": match.negative_team.name,
        "assigned_judge_count": len(assigned_judges),
        "assigned_judge_names": [judge.name for judge in assigned_judges],
        "submitted_ballot_count": len(submitted_ballots),
        "draft_ballot_count": len(draft_ballots),
        "pending_ballot_count": max(len(assigned_judges) - len(ballots), 0),
        "expected_score_count": expected_score_count,
        "submitted_score_count": submitted_score_count,
        "is_complete": len(assigned_judges) > 0
        and len(submitted_ballots) == len(assigned_judges)
        and submitted_score_count == expected_score_count,
        "affirmative_votes": affirmative_votes,
        "negative_votes": negative_votes,
        "affirmative_position_score": round(affirmative_position_score, 1),
        "negative_position_score": round(negative_position_score, 1),
        "affirmative_points": affirmative_points,
        "negative_points": negative_points,
        "best_speaker_totals": sorted(best_speaker_totals.values(), key=lambda item: item["votes"], reverse=True),
    }


class OperationsDashboardView(APIView):
    permission_classes = [IsAdminOrStaff]

    def get(self, request):
        camp = Camp.objects.filter(is_active=True).order_by("-starts_on", "-id").first()
        if not camp:
            camp = Camp.objects.order_by("-starts_on", "-id").first()

        rounds = IntegralRound.objects.none()
        venues = CompetitionVenue.objects.none()
        matches = Match.objects.none()
        teams = Team.objects.none()

        if camp:
            rounds = IntegralRound.objects.filter(camp=camp).prefetch_related("matches")
            venues = CompetitionVenue.objects.filter(integral_round__camp=camp).prefetch_related("judges")
            matches = Match.objects.filter(integral_round__camp=camp).select_related(
                "integral_round",
                "venue",
                "affirmative_team",
                "negative_team",
            ).prefetch_related(
                "venue__judges",
                "positions",
                "positions__enrollment",
                "ballots",
                "ballots__position_scores",
                "ballots__best_speaker_votes",
            )
            teams = Team.objects.filter(camp=camp).select_related("coach").prefetch_related("members")

        match_reviews = [_match_review_summary(match) for match in matches]
        team_totals = {}
        for team in teams:
            team_totals[team.id] = {
                "team": team.id,
                "team_name": team.name,
                "round_scores": {1: 0, 2: 0, 3: 0},
                "total": 0,
            }
        for review in match_reviews:
            if review["affirmative_team"] in team_totals:
                team_totals[review["affirmative_team"]]["round_scores"][review["round_number"]] += review["affirmative_points"]
            if review["negative_team"] in team_totals:
                team_totals[review["negative_team"]]["round_scores"][review["round_number"]] += review["negative_points"]
        for total in team_totals.values():
            total["round_scores"] = [
                {"round_number": number, "score": round(total["round_scores"][number], 2)}
                for number in [1, 2, 3]
            ]
            total["total"] = round(sum(item["score"] for item in total["round_scores"]), 2)

        return Response(
            {
                "activeCamp": CampSerializer(camp).data if camp else None,
                "rounds": IntegralRoundSerializer(rounds, many=True).data,
                "venues": CompetitionVenueSerializer(venues, many=True).data,
                "matches": MatchSerializer(matches, many=True).data,
                "teams": TeamSerializer(teams, many=True).data,
                "judges": JudgeSerializer(Judge.objects.filter(is_active=True), many=True).data,
                "matchReviews": match_reviews,
                "teamRankings": sorted(team_totals.values(), key=lambda item: item["total"], reverse=True),
            }
        )
