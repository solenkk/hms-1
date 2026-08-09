import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { patientsApi } from '../api'
import { Plus, Search, UserX, Eye, Phone, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'
import './Patients.css'

export default function Patients() {
  const [patients, setPatients] = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [showModal, setShowModal] = useState(false)
  const navigate = useNavigate()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (search.trim()) {
        const s = search.trim()
        // Patient number format e.g. P-0001 or P0001
        if (/^P[-]?\d+$/i.test(s)) {
          params.patient_number = s
        } else if (/^\+?\d{7,}$/.test(s)) {
          // Pure digit string long enough to be a phone number
          params.phone = s
        } else {
          // General text: search by name OR phone via the `query` param
          params.query = s
        }
      }
      const res = await patientsApi.list(params)
      setPatients(res.data.items ?? res.data)
    } catch { toast.error('Failed to load patients') }
    finally { setLoading(false) }
  }, [search])

  useEffect(() => {
    const t = setTimeout(load, 350)
    return () => clearTimeout(t)
  }, [load])

  const statusBadge = (p) => {
    if (p.registration_paid === false) {
      return <span className="badge badge-orange">Unpaid Reg</span>
    }
    return p.is_active
      ? <span className="badge badge-green">Active</span>
      : <span className="badge badge-gray">Inactive</span>
  }

  return (
    <div className="page-body">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Patients</h1>
          <p>Search and manage patient records</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Register Patient
        </button>
      </div>

      <div className="toolbar">
        <div className="search-bar" style={{ flex: 1, maxWidth: 400 }}>
          <Search size={16} className="search-icon" />
          <input
            className="form-input"
            placeholder="Search by name or phone…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : patients.length === 0 ? (
          <div className="empty-state">
            <UserX size={48} />
            <p style={{ marginTop: '0.5rem' }}>No patients found</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Patient #</th>
                  <th>Name</th>
                  <th>Age / Gender</th>
                  <th>Phone</th>
                  <th>Registered</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {patients.map(p => (
                  <tr key={p.id}>
                    <td><span className="mono patient-num">{p.patient_number}</span></td>
                    <td>
                      <div className="patient-name">
                        <div className="avatar avatar-sm">{(p.first_name_en?.[0] || '') + (p.last_name_en?.[0] || '')}</div>
                        <div>
                          <div>{p.first_name_en} {p.last_name_en}</div>
                          {p.first_name_am && <div className="text-muted" style={{ fontSize:'0.78rem' }}>{p.first_name_am} {p.last_name_am}</div>}
                        </div>
                      </div>
                    </td>
                    <td>{p.date_of_birth ? calcAge(p.date_of_birth) : '—'} / {p.gender}</td>
                    <td><Phone size={12} style={{ marginRight:4, opacity:0.5 }}/>{p.phone || '—'}</td>
                    <td>{p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}</td>
                    <td>{statusBadge(p)}</td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/patients/${p.id}`)}>
                        <Eye size={14} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <PatientRegisterModal
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); load() }}
        />
      )}
    </div>
  )
}

function calcAge(dob) {
  const diff = Date.now() - new Date(dob).getTime()
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000)) + 'y'
}

function PatientRegisterModal({ onClose, onSaved }) {
  const [form, setForm] = useState({
    first_name_en: '', last_name_en: '',
    first_name_am: '', last_name_am: '',
    date_of_birth: '', gender: 'male',
    phone: '', email: '',
    address_en: '', blood_type: '',
    consent_given: true,
  })
  const [saving, setSaving] = useState(false)

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  const submit = async (e) => {
    e.preventDefault()

    // Explicit validation with a visible message — the browser's own
    // "please fill this field" bubble is hidden behind the modal, which makes
    // the submit button look dead when a required field is empty.
    const required = {
      first_name_en: 'First Name (English)',
      last_name_en: 'Last Name (English)',
      date_of_birth: 'Date of Birth',
      phone: 'Phone',
    }
    for (const [key, label] of Object.entries(required)) {
      if (!form[key]?.trim()) {
        toast.error(`${label} is required`)
        return
      }
    }

    setSaving(true)
    try {
      // Drop empty optional fields — the API rejects "" for enums like blood_type
      const payload = Object.fromEntries(
        Object.entries(form).filter(([, v]) => v !== '')
      )
      await patientsApi.create(payload)
      toast.success('Patient registered successfully')
      onSaved()
    } catch (err) {
      const detail = err.response?.data?.detail
      let msg = 'Registration failed'
      if (typeof detail === 'object' && detail.en) {
        msg = detail.en
      } else if (typeof detail === 'string') {
        msg = detail
      } else if (Array.isArray(detail)) {
        // FastAPI 422 validation errors: extract field-level messages
        const fieldErrors = detail
          .map(e => {
            const field = Array.isArray(e.loc) ? e.loc[e.loc.length - 1] : null
            const errMsg = (e.msg || '').replace(/^Value error,\s*/, '')
            return field ? `${field}: ${errMsg}` : errMsg
          })
          .filter(Boolean)
        msg = fieldErrors.join('; ') || msg
      }
      toast.error(msg, { duration: 5000 })
    } finally { setSaving(false) }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <h3>Register New Patient</h3>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={submit}>
          <div className="form-grid" style={{ marginBottom: '1rem' }}>
            <div className="form-group">
              <label className="form-label">First Name (English) *</label>
              <input className="form-input" name="first_name_en" value={form.first_name_en} onChange={handle} required />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name (English) *</label>
              <input className="form-input" name="last_name_en" value={form.last_name_en} onChange={handle} required />
            </div>
            <div className="form-group">
              <label className="form-label">First Name (Amharic)</label>
              <input className="form-input" name="first_name_am" value={form.first_name_am} onChange={handle} />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name (Amharic)</label>
              <input className="form-input" name="last_name_am" value={form.last_name_am} onChange={handle} />
            </div>
            <div className="form-group">
              <label className="form-label">Date of Birth *</label>
              <input className="form-input" type="date" name="date_of_birth" value={form.date_of_birth} onChange={handle} required />
            </div>
            <div className="form-group">
              <label className="form-label">Gender *</label>
              <select className="form-select" name="gender" value={form.gender} onChange={handle}>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Phone *</label>
              <input className="form-input" name="phone" value={form.phone} onChange={handle} placeholder="+251..." required />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" name="email" value={form.email} onChange={handle} />
            </div>
            <div className="form-group">
              <label className="form-label">Blood Type</label>
              <select className="form-select" name="blood_type" value={form.blood_type} onChange={handle}>
                <option value="">Unknown</option>
                {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bt => <option key={bt}>{bt}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Address</label>
              <input className="form-input" name="address_en" value={form.address_en} onChange={handle} />
            </div>
          </div>
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input type="checkbox" name="consent_given" checked={form.consent_given} onChange={handle} />
              <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                Patient has given informed consent for data processing
              </span>
            </label>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Registering…' : 'Register Patient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
