// One chat row. User messages sit right (teal); assistant messages sit left (white card)
// with an optional concluded TriageCard underneath the conversational reply.
import React from 'react'
import TriageCard from './TriageCard.jsx'
import Icon from '../lib/icons.jsx'

export default function MessageBubble({ role, content, triage, imageIncluded }) {
  const isUser = role === 'user'
  const concluded = triage && triage.assessment_status === 'concluded'

  if (isUser) {
    return (
      <div className="mq-fade flex justify-end">
        <div className="max-w-[78%] rounded-2xl rounded-br-sm bg-teal-600 px-4 py-2.5 text-sm text-white shadow-sm">
          {imageIncluded && (
            <div className="mb-1 inline-flex items-center gap-1 text-[11px] text-teal-100">
              <Icon.Image className="h-3.5 w-3.5" /> Photo attached
            </div>
          )}
          <p className="whitespace-pre-wrap">{content}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mq-fade flex justify-start">
      <div className="flex max-w-[82%] gap-2.5">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-700">
          <Icon.Stethoscope className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="rounded-2xl rounded-tl-sm border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 shadow-sm">
            <p className="whitespace-pre-wrap">{content}</p>
          </div>
          {concluded && <TriageCard triage={triage} />}
        </div>
      </div>
    </div>
  )
}
