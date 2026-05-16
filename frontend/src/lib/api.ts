export type ApiUser = {
  id: number
  username: string
  displayName: string
  role: 'admin' | 'staff' | 'coach' | 'judge'
  roleLabel: string
  coach: number | null
  judge: number | null
}

export type OperationsDashboard = {
  activeCamp: null | {
    id: number
    name: string
    season: string
    starts_on: string | null
    ends_on: string | null
    is_active: boolean
  }
  camps: Array<{
    id: number
    name: string
    season: string
    starts_on: string | null
    ends_on: string | null
    is_active: boolean
  }>
  rounds: Array<{
    id: number
    camp: number
    number: number
    topic: string
    match_count: number
  }>
  venues: Array<{
    id: number
    integral_round: number
    name: string
    judges: number[]
    judge_names: string[]
  }>
  matches: Array<{
    id: number
    integral_round: number
    round_number: number
    venue: number
    venue_name: string
    sequence: number
    starts_at: string
    affirmative_team: number
    affirmative_team_name: string
    negative_team: number
    negative_team_name: string
    best_speaker_override: number | null
    is_verified: boolean
    verified_at: string | null
    verification_note: string
  }>
  teams: Array<{
    id: number
    camp: number
    name: string
    coach: number
    coach_name: string
    member_count: number
  }>
  coaches: Array<{
    id: number
    name: string
    phone: string
    note: string
    is_active: boolean
  }>
  judges: Array<{
    id: number
    name: string
    phone: string
    note: string
    is_active: boolean
  }>
  students: Array<{
    id: number
    real_name: string
    phone: string
    note: string
  }>
  enrollments: Array<{
    id: number
    camp: number
    student: number
    student_name: string
    nickname: string
    team: number | null
    team_name: string | null
  }>
  users: Array<{
    id: number
    username: string
    is_active: boolean
    role: 'admin' | 'staff' | 'coach' | 'judge'
    display_name: string
    phone: string
    profile_is_active: boolean
    coach: number | null
    coach_name: string | null
    judge: number | null
    judge_name: string | null
  }>
  matchReviews: Array<{
    match: number
    round_number: number
    venue_name: string
    sequence: number
    starts_at: string
    topic: string
    affirmative_team: number
    affirmative_team_name: string
    negative_team: number
    negative_team_name: string
    is_verified: boolean
    verified_at: string | null
    verification_note: string
    best_speaker_override: number | null
    assigned_judge_count: number
    assigned_judge_names: string[]
    affirmative_position_count: number
    negative_position_count: number
    positions_are_complete: boolean
    submitted_ballot_count: number
    draft_ballot_count: number
    pending_ballot_count: number
    expected_score_count: number
    submitted_score_count: number
    is_complete: boolean
    affirmative_votes: number
    negative_votes: number
    affirmative_position_score: number
    negative_position_score: number
    affirmative_points: number
    negative_points: number
    best_speaker_totals: Array<{
      position: number
      label: string
      speaker: string
      side: 'affirmative' | 'negative'
      votes: number
    }>
    positions: Array<{
      id: number
      side: 'affirmative' | 'negative'
      position_number: number
      label: string
      speaker: string
      student_name: string
      team: number | null
      coach_note: string
    }>
    ballots: Array<{
      id: number
      judge: number
      judge_name: string
      submitted_at: string | null
      affirmative_votes: number
      negative_votes: number
      corrected_by_staff: boolean
      correction_note: string
      position_scores: Array<{
        position: number
        label: string
        speaker: string
        side: 'affirmative' | 'negative'
        score: number
        speech_record: string
        judge_feedback: string
      }>
      best_speaker_votes: Array<{
        position: number
        label: string
        speaker: string
        side: 'affirmative' | 'negative'
        weight: number
      }>
    }>
  }>
	  teamRankings: Array<{
	    team: number
	    team_name: string
	    round_scores: Array<{
	      round_number: number
	      position_score: number
	      votes: number
	      score: number
	    }>
	    total: number
	  }>
  studentHistories: Array<{
    student: number
    real_name: string
    phone: string
    participations: Array<{
      camp: number
      camp_name: string
      nickname: string
      team_name: string | null
    }>
  }>
	  studentMatchStats: Array<{
    position: number
    speaker: string
	    student_name: string
	    team: number | null
	    team_name: string
	    round_number: number
    match: number
    side: 'affirmative' | 'negative'
    label: string
    average_score: number
	    best_speaker_votes: number
	  }>
	  assessmentVenues: Array<{
	    id: number
	    camp: number
	    name: string
	    coaches: number[]
	    coach_names: string[]
	  }>
	  assessmentAssignments: Array<{
	    id: number
	    venue: number
	    venue_name: string
	    enrollment: number
	    enrollment_nickname: string
	    student_name: string
	  }>
	}

export type FiveDimensionScores = {
  viewpoint: string
  personality: string
  emotion: string
  reasoning: string
  clash: string
}

export type CoachAssessmentDashboard = {
  entranceAssignments: Array<{
    id: number
    venue: number
    venue_name: string
    enrollment: number
    nickname: string
    student_name: string
    score: null | (FiveDimensionScores & {
      id: number
      assignment: number
      coach: number
      coach_name: string
      note: string
    })
  }>
  graduationMembers: Array<{
    enrollment: number
    nickname: string
    student_name: string
    team_name: string
    entrance_average: null | {
      viewpoint: number
      personality: number
      emotion: number
      reasoning: number
      clash: number
    }
    evaluation: null | (FiveDimensionScores & {
      id: number
      enrollment: number
      enrollment_nickname: string
      coach: number
      coach_name: string
      viewpoint_text: string
      personality_text: string
      emotion_text: string
      reasoning_text: string
      clash_text: string
      message: string
      exported_image: string
    })
  }>
}

export type CoachDashboard = {
  team: {
    id: number
    name: string
    camp: number
    camp_name: string
    coach_name: string
  }
  members: Array<{
    id: number
    nickname: string
    student_name: string
  }>
  matches: Array<{
    id: number
    round_number: number
    topic: string
    venue_name: string
    sequence: number
    starts_at: string
    affirmative_team_name: string
    negative_team_name: string
    coach_side: 'affirmative' | 'negative'
    coach_team_name: string
    positions: Array<{
      id: number
      side: 'affirmative' | 'negative'
      position_number: number
      enrollment: number
      enrollment_nickname: string
      coach_note: string
    }>
    position_completion: {
      completed: number
      required: number
      is_complete: boolean
    }
  }>
}

export type JudgeMatch = {
  id: number
  round_number: number
  round_label: string
  topic: string
  venue_name: string
  sequence: number
  starts_at: string
  affirmative_team_name: string
  negative_team_name: string
  status: 'pending' | 'draft' | 'submitted'
  positions: Array<{
    id: number
    side: 'affirmative' | 'negative'
    position_number: number
    label: string
    speaker: string
    coach_note: string
  }>
  ballot: null | {
    affirmative_votes: number
    negative_votes: number
    submitted_at: string | null
    position_scores: Array<{
      position: number
      score: string
      speech_record: string
      judge_feedback: string
    }>
    best_speaker_votes: Array<{
      position: number
      weight: number
    }>
  }
}

export type JudgeBallotPayload = {
  affirmative_votes: number
  negative_votes: number
  submit: boolean
  position_scores: Array<{
    position: number
    score: number
    speech_record: string
    judge_feedback: string
  }>
  best_speaker_votes: Array<{
    position: number
    weight: number
  }>
}

export type EnrollmentImportPreview = {
  total: number
  new_student_count: number
  matched_student_count: number
  committed: boolean
  rows: Array<{
    row: number
    real_name: string
    nickname: string
    phone: string
    matched_student_id: number | null
    status: 'new' | 'matched'
    errors: string[]
  }>
  errors: Array<{
    row: number
    messages: string[]
  }>
}

type LoginResponse = {
  token: string
  user: ApiUser
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000'

export async function apiLogin(username: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    const message =
      payload?.non_field_errors?.[0] ??
      payload?.detail ??
      '账号或密码错误。'
    throw new Error(message)
  }

  return response.json()
}

export async function apiGetOperationsDashboard(token: string): Promise<OperationsDashboard> {
  const response = await fetch(`${API_BASE_URL}/api/operations/dashboard/`, {
    headers: {
      Authorization: `Token ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error('无法读取运营工作台数据。')
  }

  return response.json()
}

export async function apiGetJudgeMatches(token: string): Promise<JudgeMatch[]> {
  const response = await fetch(`${API_BASE_URL}/api/competitions/judge/matches/`, {
    headers: {
      Authorization: `Token ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error('无法读取评审任务。')
  }

  return response.json()
}

export async function apiGetCoachDashboard(token: string): Promise<CoachDashboard> {
  const response = await fetch(`${API_BASE_URL}/api/competitions/coach/matches/`, {
    headers: {
      Authorization: `Token ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error('无法读取教练工作台数据。')
  }

  return response.json()
}

export async function apiGetCoachAssessments(token: string): Promise<CoachAssessmentDashboard> {
  const response = await fetch(`${API_BASE_URL}/api/assessments/coach/`, {
    headers: {
      Authorization: `Token ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error('无法读取测评与结营评定数据。')
  }

  return response.json()
}

async function apiWrite<T>(path: string, token: string, method: 'POST' | 'PATCH', body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Token ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    const details = payload ? JSON.stringify(payload) : ''
    throw new Error(details || '保存失败，请检查输入。')
  }

  return response.json()
}

export async function apiUpdateRoundTopic(token: string, roundId: number, topic: string) {
  return apiWrite(`/api/competitions/rounds/${roundId}/`, token, 'PATCH', { topic })
}

export async function apiCreateCamp(
  token: string,
  payload: { name: string; season: string; starts_on: string | null; ends_on: string | null; is_active: boolean },
) {
  return apiWrite('/api/camps/camps/', token, 'POST', payload)
}

export async function apiCreateCoach(token: string, payload: { name: string; phone: string; note: string }) {
  return apiWrite<{ id: number; name: string; phone: string; note: string; is_active: boolean }>('/api/camps/coaches/', token, 'POST', { ...payload, is_active: true })
}

export async function apiCreateJudge(token: string, payload: { name: string; phone: string; note: string }) {
  return apiWrite<{ id: number; name: string; phone: string; note: string; is_active: boolean }>('/api/camps/judges/', token, 'POST', { ...payload, is_active: true })
}

export async function apiCreateStudent(token: string, payload: { real_name: string; phone: string; note: string }) {
  return apiWrite<{ id: number; real_name: string; phone: string; note: string }>('/api/camps/students/', token, 'POST', payload)
}

export async function apiCreateTeam(token: string, payload: { camp: number; name: string; coach: number }) {
  return apiWrite('/api/camps/teams/', token, 'POST', payload)
}

export async function apiCreateEnrollment(
  token: string,
  payload: { camp: number; student: number; nickname: string; team: number | null },
) {
  return apiWrite('/api/camps/enrollments/', token, 'POST', payload)
}

export async function apiImportEnrollments(token: string, campId: number, file: File, commit: boolean) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('commit', String(commit))

  const response = await fetch(`${API_BASE_URL}/api/camps/camps/${campId}/import_enrollments/`, {
    method: 'POST',
    headers: {
      Authorization: `Token ${token}`,
    },
    body: formData,
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(payload ? JSON.stringify(payload) : '导入失败，请检查 Excel。')
  }
  return payload as EnrollmentImportPreview
}

export async function apiCreateTeamFromNicknames(
  token: string,
  payload: { camp: number; coach: number; name: string; nicknames: string },
) {
  return apiWrite('/api/camps/teams/create_from_nicknames/', token, 'POST', payload)
}

export async function apiCreateUserAccount(
  token: string,
  payload: {
    username: string
    password: string
    role: 'admin' | 'staff' | 'coach' | 'judge'
    display_name: string
    phone: string
    coach: number | null
    judge: number | null
    is_active: boolean
    profile_is_active: boolean
  },
) {
  return apiWrite('/api/auth/users/', token, 'POST', payload)
}

export async function apiUpdateUserAccount(
  token: string,
  userId: number,
  payload: Partial<{
    password: string
    role: 'admin' | 'staff' | 'coach' | 'judge'
    display_name: string
    phone: string
    coach: number | null
    judge: number | null
    is_active: boolean
    profile_is_active: boolean
  }>,
) {
  return apiWrite(`/api/auth/users/${userId}/`, token, 'PATCH', payload)
}

export async function apiUpdateTeam(token: string, teamId: number, payload: Partial<{ name: string; coach: number }>) {
  return apiWrite(`/api/camps/teams/${teamId}/`, token, 'PATCH', payload)
}

export async function apiUpdateEnrollment(
  token: string,
  enrollmentId: number,
  payload: Partial<{ nickname: string; team: number | null }>,
) {
  return apiWrite(`/api/camps/enrollments/${enrollmentId}/`, token, 'PATCH', payload)
}

export async function apiCreateVenue(token: string, integralRound: number, name: string, judges: number[]) {
  return apiWrite('/api/competitions/venues/', token, 'POST', {
    integral_round: integralRound,
    name,
    judges,
  })
}

export async function apiCreateAssessmentVenue(token: string, camp: number, name: string, coaches: number[]) {
  return apiWrite('/api/assessments/venues/', token, 'POST', { camp, name, coaches })
}

export async function apiCreateAssessmentAssignment(token: string, venue: number, enrollment: number) {
  return apiWrite('/api/assessments/assignments/', token, 'POST', { venue, enrollment })
}

export async function apiCreateMatch(
  token: string,
  payload: {
    integral_round: number
    venue: number
    sequence: number
    starts_at: string
    affirmative_team: number
    negative_team: number
  },
) {
  return apiWrite('/api/competitions/matches/', token, 'POST', payload)
}

export async function apiVerifyMatch(
  token: string,
  matchId: number,
  payload: { is_verified: boolean; verification_note: string; best_speaker_override: number | null },
) {
  return apiWrite(`/api/competitions/matches/${matchId}/verify/`, token, 'POST', payload)
}

export async function apiSubmitJudgeBallot(token: string, matchId: number, payload: JudgeBallotPayload) {
  return apiWrite<JudgeMatch>(`/api/competitions/judge/matches/${matchId}/submit_ballot/`, token, 'POST', payload)
}

export async function apiSubmitCoachPositions(
  token: string,
  matchId: number,
  positions: Array<{ position_number: number; enrollment: number; coach_note: string }>,
) {
  return apiWrite<CoachDashboard['matches'][number]>(`/api/competitions/coach/matches/${matchId}/submit_positions/`, token, 'POST', { positions })
}

export async function apiSubmitEntranceScore(token: string, assignmentId: number, payload: FiveDimensionScores & { note: string }) {
  return apiWrite(`/api/assessments/coach/${assignmentId}/score/`, token, 'POST', payload)
}

export async function apiSubmitGraduationEvaluation(
  token: string,
  enrollmentId: number,
  payload: FiveDimensionScores & {
    viewpoint_text: string
    personality_text: string
    emotion_text: string
    reasoning_text: string
    clash_text: string
    message: string
  },
) {
  return apiWrite(`/api/assessments/coach/${enrollmentId}/evaluate/`, token, 'POST', payload)
}

export async function apiDownloadOperationsExport(token: string, kind: 'team-rankings' | 'student-stats' | 'judge-records') {
  const response = await fetch(`${API_BASE_URL}/api/operations/exports/${kind}.xlsx`, {
    headers: {
      Authorization: `Token ${token}`,
    },
  })
  if (!response.ok) {
    throw new Error('导出失败。')
  }
  return response.blob()
}

export async function apiDownloadGraduationExport(token: string, enrollmentId: number) {
  const response = await fetch(`${API_BASE_URL}/api/assessments/coach/${enrollmentId}/export/`, {
    headers: {
      Authorization: `Token ${token}`,
    },
  })
  if (!response.ok) {
    throw new Error('导出评定图失败。')
  }
  return response.blob()
}
