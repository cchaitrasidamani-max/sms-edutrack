import { useEffect, useState } from 'react'
import { userAPI } from '../services/api'
import toast from 'react-hot-toast'

const EMPTY = { username: '', password: '', fullName: '', email: '', phone: '', role: 'FACULTY' }
const NAME_RE = /^[A-Za-z][A-Za-z .'-]*$/
const PHONE_RE = /^\d{10}$/

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const res = await userAPI.getAll()
    setUsers(res.data.data || [])
  }
  useEffect(() => { load() }, [])

  const openAdd = () => { setForm(EMPTY); setEditing(null); setModal('form') }
  const openEdit = (u) => {
    setForm({ username: u.username, password: '', fullName: u.fullName, email: u.email, phone: u.phone || '', role: u.role })
    setEditing(u)
    setModal('form')
  }

  const handleSave = async () => {
    if (!form.username || !form.password || !form.fullName || !form.email) return toast.error('Fill all required fields')
    if (!NAME_RE.test(form.fullName.trim())) return toast.error('Full name should contain letters only')
    if (form.phone && !PHONE_RE.test(form.phone)) return toast.error('Phone number must be exactly 10 digits')
    setSaving(true)
    try {
      const payload = { ...form, fullName: form.fullName.trim(), phone: form.phone || null }
      if (editing) await userAPI.update(editing.id, payload)
      else await userAPI.create(payload)
      toast.success(editing ? 'User updated!' : 'User created!')
      setModal(null)
      load()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this user?')) return
    try { await userAPI.delete(id); toast.success('Deleted'); load() }
    catch { toast.error('Cannot delete') }
  }

  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }))
  const phoneField = e => setForm(p => ({ ...p, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))

  return (
    <div>
      <div className="topbar">
        <div>
          <h1>Users</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>Manage faculty and admin accounts</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>Add User</button>
      </div>

      <div className="grid-1">
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Full Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>{u.username}</td>
                  <td>{u.fullName}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`badge ${u.role === 'ADMIN' ? 'badge-red' : 'badge-blue'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${u.active ? 'badge-green' : 'badge-gray'}`}>
                      {u.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(u)}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal === 'form' && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal">
            <div className="modal-header">
              <h3 style={{ fontWeight: 700 }}>{editing ? 'Edit User' : 'New User'}</h3>
              <button onClick={() => setModal(null)}>×</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Username *</label>
                  <input className="form-input" value={form.username} onChange={f('username')} disabled={!!editing} />
                </div>
                <div className="form-group">
                  <label className="form-label">Password *</label>
                  <input className="form-input" type="password" value={form.password} onChange={f('password')} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input className="form-input" value={form.fullName} onChange={f('fullName')} pattern="[A-Za-z .'-]+" />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input className="form-input" type="email" value={form.email} onChange={f('email')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-input" type="tel" inputMode="numeric" maxLength="10" pattern="\d{10}" value={form.phone} onChange={phoneField} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="form-input" value={form.role} onChange={f('role')}>
                  <option value="FACULTY">Faculty</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
