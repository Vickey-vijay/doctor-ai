// Structured triage card — colour-coded by urgency tier. Rendered when the assistant
// concludes an assessment. Shows conditions, urgency, specialist, and the disclaimer.
import React from 'react'
import { urgencyMeta } from '../lib/urgency'
import Icon from '../lib/icons.jsx'

export default function TriageCard({ triage }) {
  if (!triage) return null
  const u = urgencyMeta(triage.urgency_tier)
  const conditions = triage.possible_conditions || []
  const followUps = triage.follow_up_questions || []

  return (
    <div className={`mt-3 overflow-hidden rounded-xl border-l-4 ${u.border} ${u.bg} border border-slate-200`}>
      {/* Urgency header */}
      <div className="flex items-center justify-between gap-3 px-4 pt-3.5">
        <div className={`inline-flex items-center gap-2 rounded-full ${u.badge} px-3 py-1 text-xs font-bold text-white`}>
          <span>{u.icon}</span> {u.label}
        </div>
        <div className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
          <Icon.Stethoscope className="h-3.5 w-3.5" /> {triage.specialist_type}
        </div>
      </div>

      <div className="space-y-3 px-4 py-3.5">
        {triage.urgency_reason && (
          <p className={`text-sm ${u.text}`}>{triage.urgency_reason}</p>
        )}

        {conditions.length > 0 && (
          <div>
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Possible directions (not a diagnosis)
            </div>
            <div className="flex flex-wrap gap-1.5">
              {conditions.map((c, i) => (
                <span key={i} className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700">
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}

        {followUps.length > 0 && (
          <div>
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Worth considering
            </div>
            <ul className="space-y-1">
              {followUps.map((q, i) => (
                <li key={i} className="flex gap-2 text-xs text-slate-600">
                  <span className="text-slate-400">•</span> {q}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {triage.disclaimer && (
        <div className="border-t border-slate-200/70 bg-white/60 px-4 py-2 text-[11px] leading-relaxed text-slate-500">
          {triage.disclaimer}
        </div>
      )}
    </div>
  )
}
