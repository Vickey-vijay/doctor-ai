// Dashboard — summarised triage resolutions per session (conditions + urgency + specialist).
// No medication/prescription content, by design.
import React, { useCallback, useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { dashboardApi, errMessage } from '../api/client'
import { urgencyMeta, URGENCY } from '../lib/urgency'
import Icon from '../lib/icons.jsx'

export default function Dashboard() {
  const { openSession, newChat, toggleSidebar } = useOutletContext()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const d = await dashboardApi.get()
      setData(d)
    } catch (e) {
      setError(errMessage(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) return <DashboardSkeleton onMenu={toggleSidebar} />
  if (error) {
    return (
      <div className="flex h-full flex-col bg-slate-50">
        <MobileHeader onMenu={toggleSidebar} />
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-500">
            <Icon.Alert className="h-6 w-6" />
          </div>
          <p className="text-sm font-medium text-slate-700">Couldn't load your dashboard</p>
          <p className="max-w-sm text-sm text-slate-500">{error}</p>
          <button onClick={load} className="btn-primary">
            <Icon.Refresh className="h-4 w-4" /> Retry
          </button>
        </div>
      </div>
    )
  }

  const stats = data?.stats || { total_sessions: 0, concluded_sessions: 0, tier_counts: {} }
  const resolutions = data?.resolutions || []

  return (
    <div className="h-full overflow-y-auto bg-slate-50">
      <MobileHeader onMenu={toggleSidebar} />
      <div className="mx-auto max-w-5xl px-6 py-8">
        <h1 className="text-2xl font-bold text-slate-900">Your health dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          A summary of every consultation you’ve concluded. Tap any card to reopen the conversation.
        </p>

        {/* Stat tiles */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatTile label="Consultations" value={stats.total_sessions} color="#0d9488" icon={<Icon.Chat className="h-5 w-5" />} />
          <StatTile label="Concluded" value={stats.concluded_sessions} color="#475569" icon={<Icon.Grid className="h-5 w-5" />} />
          <StatTile label="Self-care" value={stats.tier_counts?.self_care || 0} color={URGENCY.self_care.color} icon={<span>✓</span>} />
          <StatTile label="Need a doctor" value={(stats.tier_counts?.consult_doctor || 0) + (stats.tier_counts?.seek_emergency || 0)} color={URGENCY.consult_doctor.color} icon={<span>⚠</span>} />
        </div>

        {/* Resolutions */}
        <h2 className="mt-8 mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Resolutions
        </h2>

        {resolutions.length === 0 ? (
          <div className="card flex flex-col items-center justify-center px-6 py-14 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
              <Icon.Grid className="h-6 w-6" />
            </div>
            <p className="mt-3 text-sm font-medium text-slate-700">No concluded consultations yet</p>
            <p className="mt-1 text-sm text-slate-500">Start a consultation and your summaries will appear here.</p>
            <button onClick={newChat} className="btn-primary mt-4">
              <Icon.Plus className="h-4 w-4" /> Start a consultation
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {resolutions.map((r) => {
              const u = urgencyMeta(r.urgency_tier)
              return (
                <button
                  key={r.session_id}
                  onClick={() => openSession(r.session_id)}
                  className={`card border-l-4 ${u.border} p-4 text-left transition hover:shadow-md`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`inline-flex items-center gap-1.5 rounded-full ${u.badge} px-2.5 py-0.5 text-[11px] font-bold text-white`}>
                      {u.icon} {u.label}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500">
                      <Icon.Stethoscope className="h-3.5 w-3.5" /> {r.specialty_display}
                    </span>
                  </div>
                  <div className="mt-2.5 truncate text-sm font-semibold text-slate-800">{r.title}</div>
                  {r.urgency_reason && (
                    <p className="mt-1 line-clamp-2 text-xs text-slate-500">{r.urgency_reason}</p>
                  )}
                  {r.possible_conditions?.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {r.possible_conditions.slice(0, 4).map((c, i) => (
                        <span key={i} className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-600">{c}</span>
                      ))}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function StatTile({ label, value, color, icon }) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500">{label}</span>
        <span className="flex h-7 w-7 items-center justify-center rounded-lg text-white" style={{ background: color }}>
          {icon}
        </span>
      </div>
      <div className="mt-2 text-2xl font-bold text-slate-900">{value}</div>
    </div>
  )
}

// Hamburger button shown only below `md`, matching the one in the Chat header —
// keeps the sidebar reachable on small screens where Dashboard has no fixed header of its own.
function MobileHeader({ onMenu }) {
  return (
    <div className="border-b border-slate-200 bg-white px-3 py-3 md:hidden">
      <button
        onClick={onMenu}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50"
        aria-label="Open menu"
      >
        <Icon.Menu className="h-5 w-5" />
      </button>
    </div>
  )
}

function DashboardSkeleton({ onMenu }) {
  return (
    <div className="flex h-full flex-col overflow-y-auto bg-slate-50">
      <MobileHeader onMenu={onMenu} />
      <div className="mx-auto w-full max-w-5xl px-6 py-8">
        <div className="h-7 w-64 max-w-full animate-pulse rounded bg-slate-200" />
        <div className="mt-2 h-4 w-80 max-w-full animate-pulse rounded bg-slate-200" />

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="card p-4">
              <div className="h-3.5 w-16 animate-pulse rounded bg-slate-200" />
              <div className="mt-3 h-6 w-10 animate-pulse rounded bg-slate-200" />
            </div>
          ))}
        </div>

        <div className="mt-8 h-4 w-24 animate-pulse rounded bg-slate-200" />
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="card p-4">
              <div className="h-4 w-20 animate-pulse rounded-full bg-slate-200" />
              <div className="mt-3 h-4 w-2/3 animate-pulse rounded bg-slate-200" />
              <div className="mt-2 h-3 w-full animate-pulse rounded bg-slate-200" />
              <div className="mt-1 h-3 w-4/5 animate-pulse rounded bg-slate-200" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
