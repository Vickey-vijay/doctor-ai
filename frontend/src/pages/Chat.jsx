// Main consultation screen — conversational triage with specialist handoff + triage cards.
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { chatApi, sessionsApi, errMessage } from '../api/client'
import { useAuth } from '../auth/AuthContext.jsx'
import MessageBubble from '../components/MessageBubble.jsx'
import ImageUpload from '../components/ImageUpload.jsx'
import DisclaimerBanner from '../components/DisclaimerBanner.jsx'
import Icon from '../lib/icons.jsx'

const EXAMPLES = [
  'I have a red, itchy, circular rash on my arm for 5 days',
  'I keep getting headaches behind my eyes in the afternoon',
  'My lower back hurts when I bend after lifting a box',
  'I feel anxious and my heart races at night',
]

export default function Chat() {
  const { activeId, setActiveId, refreshSessions, toggleSidebar } = useOutletContext()
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [specialty, setSpecialty] = useState('General Physician')
  const [input, setInput] = useState('')
  const [attached, setAttached] = useState(null)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [loadError, setLoadError] = useState('')
  const scrollRef = useRef(null)
  const loadingIdRef = useRef(null)

  // Load (or clear) the conversation when the active session changes. Guarded by
  // loadingIdRef so a slow, stale fetch can't clobber a newer session's messages.
  const loadMessages = useCallback(async () => {
    const id = activeId
    loadingIdRef.current = id
    setLoadError('')
    if (!id) {
      setMessages([])
      setSpecialty('General Physician')
      return
    }
    setLoadingMessages(true)
    try {
      const data = await sessionsApi.messages(id)
      if (loadingIdRef.current !== id) return
      setSpecialty(data.specialty_display || 'General Physician')
      setMessages(
        data.messages.map((m) => ({
          id: m.id, role: m.role, content: m.content,
          triage: m.triage, image_included: m.image_included,
        }))
      )
    } catch (err) {
      if (loadingIdRef.current === id) setLoadError(errMessage(err))
    } finally {
      if (loadingIdRef.current === id) setLoadingMessages(false)
    }
  }, [activeId])

  useEffect(() => { loadMessages() }, [loadMessages])

  // Auto-scroll to the newest message.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, sending])

  async function send(text) {
    const message = (text ?? input).trim()
    if (!message || sending) return
    setError('')
    setInput('')

    const userMsg = {
      id: `tmp-${Date.now()}`, role: 'user', content: message,
      image_included: !!attached, triage: null,
    }
    setMessages((m) => [...m, userMsg])
    const imagePayload = attached
    setAttached(null)
    setSending(true)

    try {
      const res = await chatApi.send({
        session_id: activeId,
        message,
        image_b64: imagePayload?.image_b64 || null,
        image_mime: imagePayload?.mime_type || null,
      })

      // First message of a brand-new chat → adopt the new session id + refresh sidebar.
      if (!activeId) {
        setActiveId(res.session_id)
        refreshSessions()
      } else if (res.assessment_status === 'concluded') {
        refreshSessions() // urgency/specialty may have changed → update sidebar dot
      }

      setSpecialty(res.specialty_display || specialty)

      const additions = []
      if (res.handoff) {
        additions.push({ id: `sys-${Date.now()}`, role: 'system', content: `Routed to ${res.specialty_display}` })
      }
      additions.push({
        id: res.message_id, role: 'assistant', content: res.reply, triage: res.triage,
      })
      setMessages((m) => [...m, ...additions])
    } catch (err) {
      setError(errMessage(err))
      setMessages((m) => [
        ...m,
        { id: `err-${Date.now()}`, role: 'assistant',
          content: '⚠ ' + errMessage(err, 'I could not reach the assessment service. Please try again.'),
          triage: null },
      ])
    } finally {
      setSending(false)
    }
  }

  const empty = messages.length === 0

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-2 sm:gap-2.5">
          <button
            onClick={toggleSidebar}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 md:hidden"
            aria-label="Open menu"
          >
            <Icon.Menu className="h-5 w-5" />
          </button>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-teal-700">
            <Icon.Stethoscope className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-slate-900">{specialty}</div>
            <div className="truncate text-[11px] text-slate-500">
              {empty ? 'Ready to help' : 'Consultation in progress'}
            </div>
          </div>
        </div>
        <div className="hidden items-center gap-1.5 text-xs text-slate-400 sm:flex">
          <Icon.Spark className="h-3.5 w-3.5" /> Powered by NVIDIA NIM · Llama 3.2 Vision
        </div>
      </header>

      <DisclaimerBanner />

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-6 sm:px-8">
        {loadingMessages ? (
          <ChatLoadingSkeleton />
        ) : loadError ? (
          <ChatLoadError message={loadError} onRetry={loadMessages} />
        ) : empty ? (
          <WelcomeState name={user?.full_name} onPick={(t) => send(t)} />
        ) : (
          <div className="mx-auto max-w-3xl space-y-4">
            {messages.map((m) =>
              m.role === 'system' ? (
                <div key={m.id} className="mq-fade flex justify-center">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1 text-[11px] font-medium text-teal-700 ring-1 ring-teal-200">
                    <Icon.Stethoscope className="h-3 w-3" /> {m.content}
                  </span>
                </div>
              ) : (
                <MessageBubble key={m.id} role={m.role} content={m.content}
                  triage={m.triage} imageIncluded={m.image_included} />
              )
            )}
            {sending && <TypingBubble />}
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-slate-200 bg-white px-4 py-3 sm:px-8">
        {error && <div className="mx-auto mb-2 max-w-3xl text-xs text-red-500">{error}</div>}
        <div className="mx-auto flex max-w-3xl items-end gap-2">
          <ImageUpload attached={attached} onAttach={setAttached} onClear={() => setAttached(null)} disabled={sending} />
          <div className="flex flex-1 items-end gap-2 rounded-xl border border-slate-300 bg-white px-3 py-1.5 focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-200">
            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
              placeholder="Describe your symptom… (Shift+Enter for a new line)"
              className="max-h-32 flex-1 resize-none bg-transparent py-1.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
            />
          </div>
          <button
            onClick={() => send()}
            disabled={sending || (!input.trim() && !attached)}
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-600 text-white transition hover:bg-teal-700 disabled:opacity-40"
            title="Send"
          >
            <Icon.Send className="h-5 w-5" />
          </button>
        </div>
        <p className="mx-auto mt-1.5 max-w-3xl text-center text-[10.5px] text-slate-400">
          Preliminary triage guidance only — not a medical diagnosis.
        </p>
      </div>
    </div>
  )
}

function WelcomeState({ name, onPick }) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center pt-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-600 text-white">
        <Icon.Stethoscope className="h-7 w-7" />
      </div>
      <h2 className="mt-4 text-xl font-bold text-slate-900">
        Hello{name ? `, ${name.split(' ')[0]}` : ''} — how are you feeling?
      </h2>
      <p className="mt-2 max-w-md text-sm text-slate-500">
        Describe a symptom in your own words, or attach a photo of something visible like a rash
        or wound. I’ll ask a few questions, then tell you how urgent it is and which doctor to see.
      </p>
      <div className="mt-6 grid w-full gap-2 sm:grid-cols-2">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            onClick={() => onPick(ex)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-600 shadow-sm transition hover:border-teal-300 hover:bg-teal-50/40"
          >
            {ex}
          </button>
        ))}
      </div>
    </div>
  )
}

function ChatLoadingSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
          <div
            className={`h-14 w-2/3 max-w-sm animate-pulse rounded-2xl bg-slate-200/80 ${
              i % 2 === 0 ? 'rounded-tl-sm' : 'rounded-br-sm'
            }`}
          />
        </div>
      ))}
    </div>
  )
}

function ChatLoadError({ message, onRetry }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center pt-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-500">
        <Icon.Alert className="h-6 w-6" />
      </div>
      <p className="mt-3 text-sm font-medium text-slate-700">Couldn't load this conversation</p>
      <p className="mt-1 text-sm text-slate-500">{message}</p>
      <button onClick={onRetry} className="btn-primary mt-4">
        <Icon.Refresh className="h-4 w-4" /> Retry
      </button>
    </div>
  )
}

function TypingBubble() {
  return (
    <div className="flex justify-start">
      <div className="flex gap-2.5">
        <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-teal-100 text-teal-700">
          <Icon.Stethoscope className="h-4 w-4" />
        </div>
        <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <span className="mq-dot h-2 w-2 rounded-full bg-slate-400" />
          <span className="mq-dot h-2 w-2 rounded-full bg-slate-400" />
          <span className="mq-dot h-2 w-2 rounded-full bg-slate-400" />
        </div>
      </div>
    </div>
  )
}
