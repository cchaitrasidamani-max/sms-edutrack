import { useEffect, useState } from 'react'
import { courseAPI, studentAPI } from '../services/api'
import toast from 'react-hot-toast'

const EMPTY = { code:'', name:'', description:'', durationYears:3, totalSemesters:6, maxStudents:60 }

export default function CoursesPage() {
  const [courses, setCourses] = useState([])
  const [students, setStudents] = useState([])
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const [cRes, sRes] = await Promise.all([courseAPI.getAll(), studentAPI.getAll()])
    setCourses(cRes.data.data || [])
    setStudents(sRes.data.data || [])

     console.log("COURSES:", cRes.data)
  }
  useEffect(() => { load() }, [])

  const studentCount = (courseId) => students.filter(s => s.courseId === courseId).length

  const openAdd = () => { setForm(EMPTY); setEditing(null); setModal('form') }
  const openEdit = (c) => {
    setForm({ code:c.code, name:c.name, description:c.description||'', durationYears:c.durationYears, totalSemesters:c.totalSemesters, maxStudents:c.maxStudents })
    setEditing(c)
    setModal('form')
  }

  const handleSave = async () => {
    if (!form.code || !form.name) return toast.error('Code and Name required')
    setSaving(true)
    try {
      if (editing) await courseAPI.update(editing.id, form)
      else await courseAPI.create(form)
      toast.success(editing ? 'Course updated!' : 'Course created!')
      setModal(null)
      load()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this course?')) return
    try { await courseAPI.delete(id); toast.success('Deleted'); load() }
    catch { toast.error('Cannot delete — students enrolled') }
  }

  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  return (
    <div>
      <div className="topbar">
        <div>
          <h1>Courses</h1>
          <p style={{ color:'var(--text-muted)', fontSize:13, marginTop:2 }}>Manage academic programmes</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><PlusIcon /> Add Course</button>
      </div>

      <div className="grid-3">
        {courses.map(c => {
          const enrolled = studentCount(c.id)
          const pct = Math.round((enrolled / c.maxStudents) * 100)
          return (
            <div key={c.id} className="card" style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
                <div style={{
                  background:'var(--accent-glow)', color:'var(--accent)',
                  padding:'4px 10px', borderRadius:6, fontSize:12, fontWeight:700,
                  fontFamily:'Space Mono, monospace',
                }}>{c.code}</div>
                <span className={`badge ${c.status === 'ACTIVE' ? 'badge-green' : 'badge-gray'}`}>{c.status}</span>
              </div>
              <div>
                <div style={{ fontWeight:700, fontSize:16 }}>{c.name}</div>
                {c.description && <div style={{ fontSize:13, color:'var(--text-muted)', marginTop:4, lineHeight:1.5 }}>{c.description}</div>}
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
                {[
                  ['Duration', `${c.durationYears} yrs`],
                  ['Semesters', c.totalSemesters],
                  ['Capacity', c.maxStudents],
                ].map(([l, v]) => (
                  <div key={l} style={{ background:'var(--bg-elevated)', borderRadius:6, padding:'8px 10px' }}>
                    <div style={{ fontSize:10, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em' }}>{l}</div>
                    <div style={{ fontSize:15, fontWeight:700, marginTop:2 }}>{v}</div>
                  </div>
                ))}
              </div>
              <div>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6, fontSize:12 }}>
                  <span style={{ color:'var(--text-muted)' }}>Enrolled</span>
                  <span style={{ fontWeight:600 }}>{enrolled} / {c.maxStudents}</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-bar-fill" style={{
                    width:`${Math.min(pct,100)}%`,
                    background: pct > 80 ? 'var(--accent4)' : pct > 60 ? 'var(--accent3)' : 'var(--accent)',
                  }} />
                </div>
              </div>
              <div style={{ display:'flex', gap:8, marginTop:'auto' }}>
                <button className="btn btn-ghost" style={{ flex:1, justifyContent:'center', fontSize:12 }} onClick={() => openEdit(c)}>Edit</button>
                <button className="btn btn-danger" style={{ padding:'8px 14px', fontSize:12 }} onClick={() => handleDelete(c.id)}>Delete</button>
              </div>
            </div>
          )
        })}

        {/* Add card */}
        <div
          onClick={openAdd}
          style={{
            border:'2px dashed var(--border)', borderRadius:'var(--radius)',
            display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
            gap:10, padding:32, cursor:'pointer', color:'var(--text-muted)',
            transition:'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)' }}
        >
          <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          <span style={{ fontSize:14, fontWeight:500 }}>Add Course</span>
        </div>
      </div>

      {modal === 'form' && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal">
            <div className="modal-header">
              <h3 style={{ fontWeight:700 }}>{editing ? 'Edit Course' : 'New Course'}</h3>
              <button onClick={() => setModal(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', fontSize:20 }}>×</button>
            </div>
            <div className="modal-body" style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Course Code *</label>
                  <input className="form-input" value={form.code} onChange={f('code')} placeholder="BTECH-CS" />
                </div>
                <div className="form-group">
                  <label className="form-label">Course Name *</label>
                  <input className="form-input" value={form.name} onChange={f('name')} placeholder="B.Tech Computer Science" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input className="form-input" value={form.description} onChange={f('description')} placeholder="Brief description..." />
              </div>
              <div className="grid-3">
                <div className="form-group">
                  <label className="form-label">Duration (Years)</label>
                  <input className="form-input" type="number" min="1" max="6" value={form.durationYears} onChange={f('durationYears')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Total Semesters</label>
                  <input className="form-input" type="number" min="1" max="12" value={form.totalSemesters} onChange={f('totalSemesters')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Max Students</label>
                  <input className="form-input" type="number" min="1" value={form.maxStudents} onChange={f('maxStudents')} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Course'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function PlusIcon() { return <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> }
