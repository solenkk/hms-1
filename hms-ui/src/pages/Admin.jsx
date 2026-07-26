import { useState, useEffect } from 'react'
import { adminApi, apiError } from '../api'
import { Settings, Plus, UserX, ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Admin() {
  const [users, setUsers]   = useState([])
  const [roles, setRoles]   = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const { user: me } = useAuth()

  const load = async () => {
    setLoading(true)
    try {
      const [u, r] = await Promise.all([adminApi.users(), adminApi.roles()])
      setUsers(u.data)
      setRoles(r.data)
    } catch { toast.error('Failed to load admin data') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const deactivate = async (id) => {
    if (id === me?.id) return toast.error('Cannot deactivate yourself')
    const reason = window.prompt('Reason for deactivating this user?')
    if (reason === null) return          // cancelled
    if (!reason.trim()) return toast.error('A reason is required to deactivate a user')
    try {
      await adminApi.deactivateUser(id, reason.trim())
      toast.success('User deactivated')
      load()
    } catch (err) {
      toast.error(apiError(err, 'Failed to deactivate user'))
    }
  }

  return (
    <div className="page-body">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Administration</h1>
          <p>User management and system configuration</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Create User
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <h3><ShieldCheck size={18} style={{ marginRight:6, verticalAlign:'middle' }} />System Users</h3>
        </div>
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Full Name</th>
                  <th>Role</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:'0.6rem' }}>
                        <div className="avatar" style={{ width:30,height:30,fontSize:'0.7rem' }}>
                          {u.full_name_en?.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
                        </div>
                        <span className="mono">{u.username}</span>
                      </div>
                    </td>
                    <td>{u.full_name_en}</td>
                    <td><span className="badge badge-blue">{u.role?.name ?? u.role}</span></td>
                    <td style={{ fontSize:'0.85rem', color:'var(--text-muted)' }}>{u.email}</td>
                    <td>
                      {u.is_active
                        ? <span className="badge badge-green">Active</span>
                        : <span className="badge badge-gray">Inactive</span>
                      }
                    </td>
                    <td>
                      {u.is_active && u.id !== me?.id && (
                        <button className="btn btn-danger btn-sm" onClick={() => deactivate(u.id)}>
                          <UserX size={13}/> Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <CreateUserModal roles={roles} onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); load() }} />
      )}
    </div>
  )
}

function CreateUserModal({ roles, onClose, onSaved }) {
  const [form, setForm] = useState({ username:'', email:'', full_name_en:'', full_name_am:'', password:'', role_name: roles[0]?.name || 'nurse' })
  const [saving, setSaving] = useState(false)

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await adminApi.createUser(form)
      toast.success('User created')
      onSaved()
    } catch (err) {
      toast.error(apiError(err, 'Failed to create user'))
    } finally { setSaving(false) }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>Create User</h3>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={submit}>
          <div className="form-grid" style={{ marginBottom:'1rem' }}>
            <div className="form-group">
              <label className="form-label">Username *</label>
              <input className="form-input" name="username" value={form.username} onChange={handle} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password *</label>
              <input className="form-input" type="password" name="password" value={form.password} onChange={handle} required minLength={8} />
              <small className="form-hint">Min 8 characters, with an uppercase letter and a digit.</small>
            </div>
            <div className="form-group">
              <label className="form-label">Full Name (EN) *</label>
              <input className="form-input" name="full_name_en" value={form.full_name_en} onChange={handle} required />
            </div>
            <div className="form-group">
              <label className="form-label">Full Name (AM)</label>
              <input className="form-input" name="full_name_am" value={form.full_name_am} onChange={handle} />
            </div>
            <div className="form-group">
              <label className="form-label">Email *</label>
              <input className="form-input" type="email" name="email" value={form.email} onChange={handle} required />
            </div>
            <div className="form-group">
              <label className="form-label">Role *</label>
              <select className="form-select" name="role_name" value={form.role_name} onChange={handle}>
                {roles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating…' : 'Create User'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
