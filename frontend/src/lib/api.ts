export type ApiUser = {
  id: number
  username: string
  displayName: string
  role: 'admin' | 'staff' | 'coach' | 'judge'
  roleLabel: string
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
