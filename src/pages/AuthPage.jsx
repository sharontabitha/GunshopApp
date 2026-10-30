import { useState } from 'react'
import { KeyRound, LogIn, UserPlus } from 'lucide-react'

export default function AuthPage({ onSubmit, initialMode = 'login', notice = '' }) {
  const [mode, setMode] = useState(initialMode)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState(notice)

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')
    setBusy(true)
    try {
      const result = await onSubmit({ mode, fullName: fullName.trim(), email: email.trim(), password })
      if (result?.message) setMessage(result.message)
    } catch (cause) {
      setError(cause.message || 'Could not sign you in.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="auth-page page-enter">
      <div className="auth-card">
        <p className="eyebrow">Iron Vault account</p>
        <h1 className="display">{mode === 'login' ? 'Welcome back.' : 'Join the house.'}</h1>
        <p className="auth-intro">Sign in to place orders and follow their progress.</p>
        <form onSubmit={submit} className="auth-form">
          {mode === 'signup' && <label>Full name<input autoComplete="name" required maxLength={80} value={fullName} onChange={(event) => setFullName(event.target.value)} /></label>}
          <label>Email address<input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          <label>Password<input type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={6} required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          {message && <p className="form-success" role="status">{message}</p>}
          <button className="btn btn--primary auth-submit" disabled={busy} type="submit">
            {mode === 'login' ? <LogIn size={17} /> : <UserPlus size={17} />}{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>
        <button className="link-btn auth-switch" type="button" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setMessage('') }}>
          {mode === 'login' ? 'New here? Create an account' : 'Already have an account? Sign in'}
        </button>
        <p className="auth-privacy"><KeyRound size={13} /> Authentication is handled securely by Supabase.</p>
      </div>
    </section>
  )
}
