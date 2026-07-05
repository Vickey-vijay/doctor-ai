// Image attach control for the chat composer. Sends the file to /upload (which validates,
// resizes, and base64-encodes it in memory) and hands the result back to the composer.
import React, { useRef, useState } from 'react'
import { chatApi, errMessage } from '../api/client'
import Icon from '../lib/icons.jsx'

export default function ImageUpload({ attached, onAttach, onClear, disabled }) {
  const inputRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleFile(e) {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-selecting the same file
    if (!file) return
    setError('')
    setBusy(true)
    try {
      const previewUrl = URL.createObjectURL(file)
      const result = await chatApi.uploadImage(file)
      onAttach({ ...result, previewUrl, name: file.name })
    } catch (err) {
      setError(errMessage(err, 'Could not process that image.'))
    } finally {
      setBusy(false)
    }
  }

  if (attached) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5">
        <img src={attached.previewUrl} alt="attachment" className="h-9 w-9 rounded object-cover" />
        <span className="max-w-[120px] truncate text-xs text-slate-600">{attached.name}</span>
        <button onClick={onClear} className="rounded p-1 text-slate-400 hover:text-red-500" title="Remove">
          <Icon.X className="h-3.5 w-3.5" />
        </button>
      </div>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || busy}
        title="Attach a photo (rash, wound, eye, swelling…)"
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-500 transition hover:bg-slate-50 disabled:opacity-50"
      >
        {busy ? <span className="text-xs">…</span> : <Icon.Image className="h-5 w-5" />}
      </button>
      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={handleFile} />
      {error && <span className="text-xs text-red-500">{error}</span>}
    </>
  )
}
