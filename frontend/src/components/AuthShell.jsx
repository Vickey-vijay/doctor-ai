// Shared two-column shell for the login / register screens: branded panel + form area.
import React from 'react'
import Icon from '../lib/icons.jsx'

export default function AuthShell({ children }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Brand panel */}
      <div className="relative hidden w-1/2 flex-col justify-between bg-gradient-to-br from-teal-600 to-teal-800 p-12 text-white lg:flex">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
            <Icon.Cross className="h-6 w-6" />
          </div>
          <span className="text-lg font-bold">MediQuick AI</span>
        </div>

        <div className="max-w-md">
          <h1 className="text-3xl font-bold leading-tight">
            A calm first step before you see a doctor.
          </h1>
          <p className="mt-4 text-teal-50/90">
            Describe your symptoms — or show a photo — and MediQuick AI talks with you like a doctor,
            asks the right questions, and tells you how urgent it is and which specialist to see.
          </p>
          <div className="mt-8 space-y-3 text-sm">
            <Feature icon="✓" text="Conversational triage that asks before it concludes" />
            <Feature icon="🩺" text="Routes you to the right specialist agent" />
            <Feature icon="🛡️" text="Triage guidance, never a diagnosis" />
          </div>
        </div>

        <p className="text-xs text-teal-100/70">
          Preliminary triage only · Not a substitute for professional medical care
        </p>
      </div>

      {/* Form area */}
      <div className="flex w-full items-center justify-center p-6 lg:w-1/2">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  )
}

function Feature({ icon, text }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-sm">{icon}</span>
      <span className="text-teal-50/90">{text}</span>
    </div>
  )
}
