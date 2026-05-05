import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { notificationAPI } from '../services/api'
import toast from 'react-hot-toast'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [openIndex, setOpenIndex] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    notificationAPI.getMy()
      .then(res => setNotifications(res.data.data || []))
      .catch(() => toast.error('Failed to load notifications'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading">Loading notifications...</div>

  return (
    <div>
      <div className="topbar">
        <div>
          <h1>Notifications</h1>
          <p style={{ color:'var(--text-muted)', marginTop:4, fontSize:13 }}>
            View your latest student alerts, attendance summary, and quick links.
          </p>
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="card"><div className="empty-state">No notifications available.</div></div>
      ) : (
        <div className="grid-2" style={{ gap: 20 }}>
          {notifications.map((item, index) => {
            const isOpen = openIndex === index
            return (
              <div
                key={`${item.type}-${index}`}
                className="card"
                style={{ cursor: item.link ? 'pointer' : 'default' }}
              >
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                  <h3 style={{ margin:0, fontSize:18 }}>{item.title}</h3>
                  <div style={{ display:'flex', gap: 8, alignItems:'center' }}>
                    {item.meta?.resultCount != null && (
                      <span className="badge badge-blue">{item.meta.resultCount} new</span>
                    )}
                    {item.emailSubject && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setOpenIndex(isOpen ? null : index)
                        }}
                        style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px', background: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}
                      >
                        {isOpen ? 'Hide email' : 'View email'}
                      </button>
                    )}
                  </div>
                </div>
                <p style={{ color:'var(--text-muted)', marginBottom:16 }}>{item.message}</p>
                {item.link && (
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontSize:13, color:'var(--accent)' }} onClick={() => item.link && navigate(item.link)}>Open</span>
                    <span style={{ fontSize:13, color:'var(--text-muted)' }}>{item.link}</span>
                  </div>
                )}
                {isOpen && item.emailSubject && (
                  <div style={{ marginTop: 18, padding: 16, background: 'var(--bg-elevated)', borderRadius: 10 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>{item.emailSubject}</div>
                    <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13, lineHeight: 1.6, color: 'var(--text-muted)', margin: 0 }}>{item.emailBody}</pre>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
