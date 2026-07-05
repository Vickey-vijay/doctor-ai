// Dashboard — summarised triage resolutions per session (conditions + urgency + specialist).
// No medication/prescription content, by design.
import React, { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { dashboardApi, errMessage } from '../api/client'
import { urgencyMeta, URGENCY } from '../lib/urgency'
import Icon from '../lib/icons.jsx'

export default function Dashboard() {
  const { openSession } = useOutletContext()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    dashboardApi.get()
      .then((d) => { if (active) setData(d) })
      .catch((e) => { if (active) setError(errMessage(e)) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  if (loading) return <div className="flex h-full items-center justify-center text-slate-400">Loading dashboard…</div>
  if (error) return <div className="flex h-full items-center justify-center text-red-500">{error}</div>

  const stats = data?.stats || { total_sessions: 0, concluded_sessions: 0, tier_counts: {} }
  const resolutions = data?.resolutions || []

  return (
    <div className="h-full overflow-y-auto bg-slate-50">
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
