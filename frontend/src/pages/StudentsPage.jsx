import { useEffect, useState } from 'react'
import { studentAPI, courseAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const EMPTY = {
  rollNumber:'', firstName:'', lastName:'', email:'', phone:'',
  address:'', dateOfBirth:'', gender:'', courseId:'', semester:1, status:'ACTIVE'
}
const NAME_RE = /^[A-Za-z][A-Za-z .'-]*$/
const PHONE_RE = /^\d{10}$/
const todayInputValue = () => {
  const today = new Date()
  const yyyy = today.getFullYear()
  const mm = String(today.getMonth() + 1).padStart(2, '0')
  const dd = String(today.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export default function StudentsPage() {
  const { user } = useAuth()
  const [students, setStudents] = useState([])
  const [courses, setCourses] = useState([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('ALL')
  const [modal, setModal] = useState(null) // null | 'add' | 'edit' | 'view'
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)

  const isAdmin = user?.role === 'ADMIN'
  const maxDateOfBirth = todayInputValue()

  const load = async () => {
    setLoading(true)
    try {
      const [sRes, cRes] = await Promise.all([studentAPI.getAll(), courseAPI.getAll()])
      setStudents(sRes.data.data || [])
      setCourses(cRes.data.data || [])
    } catch { toast.error('Failed to load data') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const filtered = students.filter(s => {
    const q = search.toLowerCase()
    const matchQ = !q || s.fullName?.toLowerCase().includes(q) || s.rollNumber?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q)
    const matchF = filter === 'ALL' || s.status === filter
    return matchQ && matchF
  })

  const openAdd = () => { setForm(EMPTY); setModal('add') }
  const openEdit = (s) => {
    setSelected(s)
    setForm({
      rollNumber: s.rollNumber, firstName: s.firstName, lastName: s.lastName,
      email: s.email, phone: s.phone || '', address: s.address || '',
      dateOfBirth: s.dateOfBirth || '', gender: s.gender || '',
      courseId: s.courseId, semester: s.semester, status: s.status
    })
    setModal('edit')
  }
  const openView = (s) => { setSelected(s); setModal('view') }

  const handleSave = async () => {
    if (!form.rollNumber || !form.firstName || !form.lastName || !form.email || !form.courseId) {
      return toast.error('Fill required fields')
    }
    if (!NAME_RE.test(form.firstName.trim()) || !NAME_RE.test(form.lastName.trim())) {
      return toast.error('Student name should contain letters only')
    }
    if (form.phone && !PHONE_RE.test(form.phone)) {
      return toast.error('Phone number must be exactly 10 digits')
    }
    if (form.dateOfBirth && form.dateOfBirth > maxDateOfBirth) {
      return toast.error('Date of birth cannot be in the future')
    }
    setSaving(true)
    try {
      const payload = {
        ...form,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone || null,
        courseId: Number(form.courseId),
        semester: Number(form.semester)
      }
      if (modal === 'add') {
        await studentAPI.create(payload)
        toast.success('Student added!')
      } else {
        await studentAPI.update(selected.id, payload)
        toast.success('Student updated!')
      }
      setModal(null)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this student? This cannot be undone.')) return
    setDeleting(id)
    try {
      await studentAPI.delete(id)
      toast.success('Student deleted')
      load()
    } catch { toast.error('Delete failed') }
    finally { setDeleting(null) }
  }

  const f = (k) => e => setForm(p => ({ ...p, [k]: e.target.value }))
  const phoneField = e => setForm(p => ({ ...p, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))

  return (
    <div>
      {/* Top bar */}
      <div className="topbar">
        <div>
          <h1>Students</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>
            {filtered.length} of {students.length} students
          </p>
        </div>
        <div className="actions">
          <div className="search-bar">
            <SearchIcon />
            <input className="form-input" placeholder="Search name, roll no..." value={search}
              onChange={e => setSearch(e.target.value)} style={{ width: 220 }} />
          </div>
          <select className="form-input" value={filter} onChange={e => setFilter(e.target.value)} style={{ width: 120 }}>
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="GRADUATED">Graduated</option>
          </select>
          {isAdmin && (
            <button className="btn btn-primary" onClick={openAdd}>
              <PlusIcon /> Add Student
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="empty-state"><Spinner /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <UsersIcon />
            <p>No students found</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Roll No.</th>
                  <th>Course</th>
                  <th>Semester</th>
                  <th>Contact</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar name={s.fullName} />
                        <div>
                          <div style={{ fontWeight: 600 }}>{s.fullName}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="mono" style={{ fontSize: 12, color: 'var(--accent)' }}>{s.rollNumber}</span></td>
                    <td>
                      <div style={{ fontSize: 13 }}>{s.courseName}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.courseCode}</div>
                    </td>
                    <td>Sem {s.semester}</td>
                    <td style={{ fontSize: 13 }}>{s.phone || '—'}</td>
                    <td><StatusBadge status={s.status} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-ghost" style={{ padding: '5px 10px', fontSize: 12 }}
                          onClick={() => openView(s)}>View</button>
                        {isAdmin && <>
                          <button className="btn btn-ghost" style={{ padding: '5px 10px', fontSize: 12 }}
                            onClick={() => openEdit(s)}>Edit</button>
                          <button className="btn btn-danger" style={{ padding: '5px 10px', fontSize: 12 }}
                            onClick={() => handleDelete(s.id)} disabled={deleting === s.id}>
                            {deleting === s.id ? '…' : 'Del'}
                          </button>
                        </>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(modal === 'add' || modal === 'edit') && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal">
            <div className="modal-header">
              <h3 style={{ fontWeight: 700 }}>{modal === 'add' ? 'Add New Student' : 'Edit Student'}</h3>
              <button onClick={() => setModal(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', fontSize:20 }}>×</button>
            </div>
            <div className="modal-body">
              <div className="grid-2" style={{ gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">First Name *</label>
                  <input className="form-input" value={form.firstName} onChange={f('firstName')} placeholder="Aarav" pattern="[A-Za-z .'-]+" />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name *</label>
                  <input className="form-input" value={form.lastName} onChange={f('lastName')} placeholder="Sharma" pattern="[A-Za-z .'-]+" />
                </div>
                <div className="form-group">
                  <label className="form-label">Roll Number *</label>
                  <input className="form-input" value={form.rollNumber} onChange={f('rollNumber')} placeholder="BTECH0001" disabled={modal==='edit'} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input className="form-input" type="email" value={form.email} onChange={f('email')} placeholder="student@college.edu" />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-input" type="tel" inputMode="numeric" maxLength="10" pattern="\d{10}" value={form.phone} onChange={phoneField} placeholder="9876543210" />
                </div>
                <div className="form-group">
                  <label className="form-label">Date of Birth</label>
                  <input className="form-input" type="date" max={maxDateOfBirth} value={form.dateOfBirth} onChange={f('dateOfBirth')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select className="form-input" value={form.gender} onChange={f('gender')}>
                    <option value="">Select</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Course *</label>
                  <select className="form-input" value={form.courseId} onChange={f('courseId')}>
                    <option value="">Select Course</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Semester *</label>
                  <select className="form-input" value={form.semester} onChange={f('semester')}>
                    {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>Semester {n}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-input" value={form.status} onChange={f('status')}>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="GRADUATED">Graduated</option>
                    <option value="SUSPENDED">Suspended</option>
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">Address</label>
                  <input className="form-input" value={form.address} onChange={f('address')} placeholder="Full address" />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : modal === 'add' ? 'Add Student' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {modal === 'view' && selected && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal">
            <div className="modal-header">
              <h3 style={{ fontWeight: 700 }}>Student Profile</h3>
              <button onClick={() => setModal(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', fontSize:20 }}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:20 }}>
                <Avatar name={selected.fullName} size={56} />
                <div>
                  <div style={{ fontSize:18, fontWeight:700 }}>{selected.fullName}</div>
                  <div className="mono" style={{ fontSize:12, color:'var(--accent)', marginTop:2 }}>{selected.rollNumber}</div>
                  <StatusBadge status={selected.status} />
                </div>
              </div>
              <div className="grid-2" style={{ gap:12 }}>
                {[
                  ['Email', selected.email],
                  ['Phone', selected.phone || '—'],
                  ['Course', selected.courseName],
                  ['Semester', `Semester ${selected.semester}`],
                  ['Gender', selected.gender || '—'],
                  ['Date of Birth', selected.dateOfBirth || '—'],
                  ['Address', selected.address || '—'],
                ].map(([label, value]) => (
                  <div key={label} style={{ background:'var(--bg-elevated)', borderRadius:8, padding:'10px 14px' }}>
                    <div style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em' }}>{label}</div>
                    <div style={{ marginTop:4, fontSize:14, fontWeight:500 }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              {isAdmin && <button className="btn btn-ghost" onClick={() => { setModal(null); setTimeout(() => openEdit(selected), 50) }}>Edit</button>}
              <button className="btn btn-primary" onClick={() => setModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Avatar({ name, size = 36 }) {
  const initials = name?.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() || '??'
  const colors = ['#4f8ef7','#34d399','#f59e0b','#a78bfa','#f87171']
  const color = colors[name?.charCodeAt(0) % colors.length] || '#4f8ef7'
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background:`${color}28`,
      color, display:'flex', alignItems:'center', justifyContent:'center',
      fontSize: size * 0.33, fontWeight: 700, flexShrink: 0,
    }}>{initials}</div>
  )
}
function StatusBadge({ status }) {
  const map = { ACTIVE:'badge-green', INACTIVE:'badge-gray', GRADUATED:'badge-blue', SUSPENDED:'badge-red' }
  return <span className={`badge ${map[status]||'badge-gray'}`}>{status}</span>
}
function Spinner() { return <div className="spin" style={{ width:24,height:24,border:'2px solid var(--border)',borderTopColor:'var(--accent)',borderRadius:'50%' }} /> }
function SearchIcon() { return <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> }
function PlusIcon()   { return <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> }
function UsersIcon()  { return <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg> }
