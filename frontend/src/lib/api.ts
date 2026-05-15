export type ApiUser = {
  id: number
  username: string
  displayName: string
  role: 'admin' | 'staff' | 'coach' | 'judge'
  roleLabel: string
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
  }>
  teams: Array<{
    id: number
    camp: number
    name: string
    coach: number
    coach_name: string
    member_count: number
  }>
  judges: Array<{
    id: number
    name: string
    phone: string
    note: string
    is_active: boolean
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
