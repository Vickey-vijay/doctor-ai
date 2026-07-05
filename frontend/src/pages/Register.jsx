// Registration screen — account + optional health profile (used to personalise triage context).
import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { errMessage } from '../api/client'
import AuthShell from '../components/AuthShell.jsx'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    full_name: '', email: '', password: '',
    age: '', sex: '', height_cm: '', weight_kg: '',
  })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })) }

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const body = {
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        password: form.password,
        age: form.age ? Number(form.age) : null,
        sex: form.sex || null,
        height_cm: form.height_cm ? Number(form.height_cm) : null,
        weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
      }
      await register(body)
      navigate('/')
    } catch (err) {
      setError(errMessage(err, 'Could not create your account.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell>
      <h2 className="text-2xl font-bold text-slate-900">Create your account</h2>
      <p className="mt-1 text-sm text-slate-500">Health details are optional and help personalise your triage.</p>

      <form onSubmit={onSubmit} className="mt-5 space-y-4">
        <div>
          <label className="label">Full name</label>
          <input className="input" required value={form.full_name}
            onChange={(e) => set('full_name', e.target.value)} placeholder="Your name" />
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" required value={form.email}
            onChange={(e) => set('email', e.target.value)} placeholder="you@example.com" />
        </div>
        <div>
          <label className="label">Password</label>
          <input className="input" type="password" required minLength={6} value={form.password}
            onChange={(e) => set('password', e.target.value)} placeholder="At least 6 characters" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Age</label>
            <input className="input" type="number" min="0" max="120" value={form.age}
              onChange={(e) => set('age', e.target.value)} placeholder="—" />
          </div>
          <div>
            <label className="label">Sex</label>
            <select className="input" value={form.sex} onChange={(e) => set('sex', e.target.value)}>
              <option value="">—</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="label">Height (cm)</label>
            <input className="input" type="number" min="0" value={form.height_cm}
              onChange={(e) => set('height_cm', e.target.value)} placeholder="—" />
          </div>
          <div>
            <label className="label">Weight (kg)</label>
            <input className="input" type="number" min="0" value={form.weight_kg}
              onChange={(e) => set('weight_kg', e.target.value)} placeholder="—" />
          </div>
        </div>

        {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}

        <button type="submit" className="btn-primary w-full" disabled={busy}>
          {busy ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-teal-600 hover:text-teal-700">Sign in</Link>
      </p>
    </AuthShell>
  )
}
