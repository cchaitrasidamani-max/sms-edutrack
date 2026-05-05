import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { dashboardAPI, studentAPI, courseAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'

const ATTENDANCE_TREND = [
  { month: 'Aug', pct: 88 }, { month: 'Sep', pct: 82 }, { month: 'Oct', pct: 91 },
  { month: 'Nov', pct: 76 }, { month: 'Dec', pct: 84 }, { month: 'Jan', pct: 89 },
]

const GRADE_COLORS = ['#4f8ef7','#34d399','#f59e0b','#f87171','#a78bfa']

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [students, setStudents] = useState([])
  const [courses, setCourses] = useState([])

  useEffect(() => {
    dashboardAPI.getStats().then(r => setStats(r.data.data)).catch(() => {})
    studentAPI.getAll().then(r => setStudents(r.data.data || [])).catch(() => {})
    courseAPI.getAll().then(r => setCourses(r.data.data || [])).catch(() => {})
  }, [])

  const courseData = courses.map(c => ({
    name: c.code,
    value: students.filter(s => s.courseId === c.id).length,
  })).filter(d => d.value > 0)

  const statCards = [
    { label: 'Total Students', value: stats?.totalStudents ?? '—', color: '#4f8ef7', bg: 'rgba(79,142,247,0.12)', icon: <UsersIcon /> },
    { label: 'Active Students', value: stats?.activeStudents ?? '—', color: '#34d399', bg: 'rgba(52,211,153,0.12)', icon: <CheckIcon /> },
    { label: 'Courses', value: stats?.totalCourses ?? '—', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: <BookIcon /> },
    { label: 'Faculty Members', value: stats?.totalFaculty ?? '—', color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', icon: <TeachIcon /> },
  ]

  const recentStudents = students.slice(-5).reverse()

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: 'var(--accent2)', boxShadow: '0 0 0 3px rgba(52,211,153,0.25)',
          }} />
          <span style={{ fontSize: 12, color: 'var(--accent2)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Live Dashboard
          </span>
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px' }}>
          Welcome back, {user?.fullName?.split(' ')[0]} 👋
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: 14 }}>
          Here's what's happening in your institution today.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid-4" style={{ marginBottom: 28 }}>
        {statCards.map(s => (
          <div key={s.label} className="stat-card" style={{ '--accent-color': s.color, '--accent-bg': s.bg }}>
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 20, marginBottom: 28 }}>
        {/* Area chart */}
        <div className="card">
          <h3 style={{ marginBottom: 20, fontWeight: 700 }}>Attendance Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={ATTENDANCE_TREND} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f8ef7" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#4f8ef7" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }}
                labelStyle={{ color: 'var(--text-primary)' }}
                formatter={(v) => [`${v}%`, 'Attendance']}
              />
              <Area type="monotone" dataKey="pct" stroke="#4f8ef7" strokeWidth={2} fill="url(#areaGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className="card">
          <h3 style={{ marginBottom: 20, fontWeight: 700 }}>Students by Course</h3>
          {courseData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={courseData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                  paddingAngle={3} dataKey="value">
                  {courseData.map((_, i) => (
                    <Cell key={i} fill={GRADE_COLORS[i % GRADE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }}
                />
                <Legend iconSize={10} iconType="circle"
                  formatter={(v) => <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{v}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state">No data yet</div>
          )}
        </div>
      </div>

      {user?.role !== 'STUDENT' && (
  <div className="card">
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
      <h3 style={{ fontWeight: 700 }}>Recently Added Students</h3>
      <Link to="/students" className="btn btn-ghost" style={{ fontSize: 12, padding: '6px 12px' }}>
        View all →
      </Link>
    </div>

    {recentStudents.length === 0 ? (
      <div className="empty-state">No students yet</div>
    ) : (
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Student</th>
              <th>Roll No.</th>
              <th>Course</th>
              <th>Semester</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {recentStudents.map(s => (
              <tr key={s.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar name={s.fullName} />
                    <span style={{ fontWeight: 500 }}>{s.fullName}</span>
                  </div>
                </td>
                <td><span className="mono" style={{ fontSize: 12 }}>{s.rollNumber}</span></td>
                <td>{s.courseCode}</td>
                <td>Sem {s.semester}</td>
                <td><StatusBadge status={s.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
)}
    </div>
  )
}

function Avatar({ name }) {
  const initials = name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??'
  const colors = ['#4f8ef7','#34d399','#f59e0b','#a78bfa','#f87171']
  const color = colors[name?.charCodeAt(0) % colors.length] || '#4f8ef7'
  return (
    <div style={{
      width: 32, height: 32, borderRadius: '50%', background: `${color}28`,
      color, display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 12, fontWeight: 700, flexShrink: 0,
    }}>{initials}</div>
  )
}

function StatusBadge({ status }) {
  const map = {
    ACTIVE: 'badge-green', INACTIVE: 'badge-gray',
    GRADUATED: 'badge-blue', SUSPENDED: 'badge-red',
  }
  return <span className={`badge ${map[status] || 'badge-gray'}`}>{status}</span>
}

function UsersIcon() { return <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> }
function CheckIcon() { return <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg> }
function BookIcon()  { return <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg> }
function TeachIcon() { return <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M2 20c0-4 4-7 10-7s10 3 10 7"/></svg> }
