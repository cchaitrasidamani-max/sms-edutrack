import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { resultAPI } from '../services/api'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.username || !form.password) return toast.error('Fill in all fields')
    setLoading(true)
    try {
      const user = await login(form.username, form.password)
      toast.success('Welcome back!')

      if (user.role?.toUpperCase() === 'STUDENT') {
        try {
          const res = await resultAPI.getMy()
          const results = res.data.data || []
          if (results.length > 0) {
            toast.success(`You have ${results.length} result${results.length > 1 ? 's' : ''} ready. Visit My Results.`)
          }
        } catch (err) {
          // Ignore result notification errors during login
        }
      }

      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--bg-base)',
      backgroundImage: `
        radial-gradient(ellipse 80% 60% at 50% -10%, rgba(79,142,247,0.15) 0%, transparent 70%),
        radial-gradient(ellipse 40% 40% at 80% 80%, rgba(52,211,153,0.08) 0%, transparent 60%)
      `
    }}>
      <div style={{ width: '100%', maxWidth: 420, padding: '0 16px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 60, height: 60, borderRadius: 16,
            background: 'linear-gradient(135deg, #4f8ef7, #34d399)',
            marginBottom: 16, boxShadow: '0 8px 32px rgba(79,142,247,0.35)'
          }}>
            <svg width="30" height="30" fill="none" viewBox="0 0 24 24">
              <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3z" fill="white"/>
              <path d="M5 13.18V17.18L12 21l7-3.82V13.18L12 17l-7-3.82z" fill="white" opacity="0.7"/>
            </svg>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px' }}>EduTrack</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 6, fontSize: 14 }}>
            College Student Management System
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{ border: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Sign in to your account</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>
            Use your institutional credentials to access the portal.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                className="form-input"
                placeholder="e.g. admin"
                value={form.username}
                onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ marginTop: 8, justifyContent: 'center', padding: '12px 24px', fontSize: 15 }}
            >
              {loading ? <span className="spin" style={{
                display:'inline-block', width:16, height:16, border:'2px solid rgba(255,255,255,0.3)',
                borderTopColor:'white', borderRadius:'50%'
              }}/> : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
