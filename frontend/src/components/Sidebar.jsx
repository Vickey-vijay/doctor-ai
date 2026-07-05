// Left sidebar — brand, new-chat, nav (Consult / Dashboard), session history, user + logout.
import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { sessionsApi } from '../api/client'
import { urgencyMeta } from '../lib/urgency'
import Icon from '../lib/icons.jsx'

export default function Sidebar({ sessions, activeId, loading, onOpenSession, onNewChat, onRefresh }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const onDashboard = location.pathname === '/dashboard'

  async function handleDelete(e, id) {
    e.stopPropagation()
    if (!confirm('Delete this consultation and its history?')) return
    try {
      await sessionsApi.remove(id)
      const fresh = await onRefresh()
      if (activeId === id) onNewChat()
      else if (fresh && fresh.length === 0) onNewChat()
    } catch { /* ignore */ }
  }

  return (
    <aside className="flex h-full w-72 flex-col bg-slate-900 text-slate-200">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-5 pt-5 pb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500 text-white">
          <Icon.Cross className="h-5 w-5" />
        </div>
        <div>
          <div className="text-[15px] font-bold leading-tight text-white">MediQuick AI</div>
          <div className="text-[11px] text-slate-400">Medical Triage Assistant</div>
        </div>
      </div>

      {/* New consultation */}
      <div className="px-3">
        <button
          onClick={onNewChat}
          className="flex w-full items-center gap-2 rounded-lg bg-teal-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-500"
        >
          <Icon.Plus className="h-4 w-4" /> New consultation
        </button>
      </div>

      {/* Nav */}
      <nav className="mt-3 space-y-1 px-3">
        <button
          onClick={() => navigate('/')}
          className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
            !onDashboard ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800/60'
          }`}
        >
          <Icon.Chat className="h-4 w-4" /> Consult
        </button>
        <button
          onClick={() => navigate('/dashboard')}
          className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
            onDashboard ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800/60'
          }`}
        >
          <Icon.Grid className="h-4 w-4" /> Dashboard
        </button>
      </nav>

      {/* History */}
      <div className="mt-4 px-5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        Recent consultations
      </div>
      <div className="mt-1.5 flex-1 space-y-0.5 overflow-y-auto px-3 pb-2">
        {loading ? (
          <div className="px-2 py-3 text-xs text-slate-500">Loading…</div>
        ) : sessions.length === 0 ? (
          <div className="px-2 py-3 text-xs text-slate-500">No consultations yet.</div>
        ) : (
          sessions.map((s) => {
            const u = s.urgency_tier ? urgencyMeta(s.urgency_tier) : null
            return (
              <button
                key={s.id}
                onClick={() => onOpenSession(s.id)}
                className={`group flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left transition ${
                  activeId === s.id ? 'bg-slate-800' : 'hover:bg-slate-800/60'
                }`}
              >
                <span
                  className="mt-0.5 h-2 w-2 shrink-0 rounded-full"
                  style={{ background: u ? u.color : '#64748b' }}
                  title={u ? u.short : 'In progress'}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] text-slate-200">{s.title}</span>
                  <span className="block truncate text-[11px] text-slate-500">
                    {s.specialty_display}
                  </span>
                </span>
                <span
                  onClick={(e) => handleDelete(e, s.id)}
                  className="hidden rounded p-1 text-slate-500 hover:text-red-400 group-hover:block"
                  title="Delete"
                >
                  <Icon.Trash className="h-3.5 w-3.5" />
                </span>
              </button>
            )
          })
        )}
      </div>

      {/* User */}
      <div className="border-t border-slate-800 p-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-xs font-bold text-white">
            {(user?.full_name || 'U').slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-medium text-white">{user?.full_name}</div>
            <div className="truncate text-[11px] text-slate-500">{user?.email}</div>
          </div>
          <button onClick={logout} className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white" title="Log out">
            <Icon.Logout className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
