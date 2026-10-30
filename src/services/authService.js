import { apiClient, BASE_URL, SUPABASE_KEY } from '../config/api'

const SESSION_KEY = 'iron-vault-session'
const authUrl = `${BASE_URL.replace(/\/$/, '')}/auth/v1`

const readSession = () => {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null') } catch { return null }
}

const persistSession = (session) => {
  if (session?.access_token) localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  return session
}

async function authRequest(path, { method = 'POST', body, token } = {}) {
  if (!BASE_URL || !SUPABASE_KEY) throw new Error('Supabase belum dikonfigurasi. Isi VITE_API_BASE_URL dan VITE_SUPABASE_PUBLISHABLE_KEY.')
  const response = await fetch(`${authUrl}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_KEY,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.msg || data.message || data.error_description || data.error || 'Permintaan autentikasi gagal.')
  return data
}

export const getSession = () => readSession()

export async function signIn(email, password) {
  const session = await authRequest('/token?grant_type=password', { body: { email, password } })
  persistSession(session)
  return session
}

export async function signUp(email, password, fullName) {
  const result = await authRequest('/signup', { body: { email, password, data: { full_name: fullName } } })
  if (result.access_token) persistSession(result)
  return result
}

export async function signOut() {
  const session = readSession()
  try {
    if (session?.access_token) await authRequest('/logout', { token: session.access_token })
  } finally {
    localStorage.removeItem(SESSION_KEY)
  }
}

export async function loadProfile(userId) {
  const result = await apiClient.get(`/rest/v1/profiles?select=id,full_name,email,is_admin&id=eq.${encodeURIComponent(userId)}&limit=1`)
  return result?.[0] || null
}

export async function refreshSession() {
  const session = readSession()
  if (!session?.access_token) return null
  if (session.expires_at && session.expires_at * 1000 > Date.now() + 60_000) return session
  if (!session.refresh_token) { localStorage.removeItem(SESSION_KEY); return null }
  try {
    const next = await authRequest('/token?grant_type=refresh_token', { body: { refresh_token: session.refresh_token } })
    return persistSession(next)
  } catch {
    localStorage.removeItem(SESSION_KEY)
    return null
  }
}
