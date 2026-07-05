// Persistent safety banner shown at the top of the chat — reinforces triage-not-diagnosis.
import React from 'react'

export default function DisclaimerBanner() {
  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-1.5 text-center text-[11.5px] text-amber-800">
      MediQuick AI provides <b>preliminary triage guidance only</b> — it is not a medical diagnosis.
      In an emergency, call your local emergency number immediately.
    </div>
  )
}
