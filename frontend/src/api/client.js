// Axios client for the MediQuick AI backend (FastAPI on :8001).
// Attaches the JWT from localStorage to every request and exposes typed helpers.
import axios from 'axios'

export const API_BASE = 'http://localhost:8001'

const api = axios.create({ baseURL: API_BASE, timeout: 60000 })

// ── Attach bearer token on every request ──────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mq_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── On 401, clear the stored session so the app can redirect to login ─────────
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem('mq_token')
      localStorage.removeItem('mq_user')
    }
    return Promise.reject(err)
  }
)

// Turn an Axios error into a clean, user-facing message.
export function errMessage(err, fallback = 'Something went wrong. Please try again.') {
  return err?.response?.data?.detail || err?.message || fallback
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (body) => api.post('/auth/register', body).then((r) => r.data),
  login: (body) => api.post('/auth/login', body).then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data),
  updateProfile: (body) => api.put('/auth/profile', body).then((r) => r.data),
}

// ── Chat / sessions / dashboard ────────────────────────────────────────────────
export const chatApi = {
  send: (body) => api.post('/chat', body).then((r) => r.data),
  uploadImage: (file) => {
    const form = new FormData()
    form.append('file', file)
    return api
      .post('/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((r) => r.data)
  },
}

export const sessionsApi = {
  list: () => api.get('/sessions').then((r) => r.data),
  messages: (id) => api.get(`/sessions/${id}/messages`).then((r) => r.data),
  rename: (id, title) => api.post(`/sessions/${id}/rename`, { title }).then((r) => r.data),
  remove: (id) => api.delete(`/sessions/${id}`).then((r) => r.data),
}

export const dashboardApi = {
  get: () => api.get('/dashboard').then((r) => r.data),
}

export default api
