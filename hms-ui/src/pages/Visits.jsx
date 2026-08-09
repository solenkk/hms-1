import { useState, useEffect, useCallback } from 'react'
import { visitsApi, patientsApi } from '../api'
import { Plus, Eye, Search, Clock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const STATUS_COLORS = { open: 'badge-green', closed: 'badge-gray', pending: 'badge-orange' }

export default function Visits() {
  const [visits, setVisits]   = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus]   = useState('open')
  const [showModal, setShowModal] = useState(false)
  const navigate = useNavigate()
  const { user } = useAuth()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await visitsApi.list({ status, limit: 50 })
      setVisits(res.data.items ?? res.data)
    } catch { toast.error('Failed to load visits') }
    finally { setLoading(false) }
  }, [status])

  useEffect(() => { load() }, [load])

  return (
    <div className="page-body">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Visits</h1>
          <p>Patient visit queue and management</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Open Visit
        </button>
      </div>

      <div className="tabs">
        {['open','closed'].map(s => (
          <button key={s} className={`tab-btn ${status === s ? 'active' : ''}`} onClick={() => setStatus(s)}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="card">
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : visits.length === 0 ? (
          <div className="empty-state"><Clock size={48} /><p style={{marginTop:'0.5rem'}}>No {status} visits</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Visit #</th>
                  <th>Patient</th>
                  <th>Type</th>
                  <th>Doctor</th>
                  <th>Chief Complaint</th>
                  <th>Status</th>
                  <th>Time</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visits.map(v => (
                  <tr key={v.id}>
                    <td><span className="mono patient-num">{v.visit_number}</span></td>
                    <td>{v.patient ? `${v.patient.first_name_en} ${v.patient.last_name_en}` : (v.patient_name || v.patient_id?.slice(0,8)+'…')}</td>
                    <td><span className="badge badge-blue">{v.visit_type}</span></td>
                    <td>{v.doctor_name || '—'}</td>
                    <td style={{ maxWidth: 200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {v.chief_complaint_en || '—'}
                    </td>
                    <td><span className={`badge ${STATUS_COLORS[v.status] || 'badge-gray'}`}>{v.status}</span></td>
                    <td style={{ fontSize:'0.8rem', color:'var(--text-muted)' }}>
                      {v.created_at ? new Date(v.created_at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) : '—'}
                    </td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/patients/${v.patient_id}`)}>
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
        <OpenVisitModal onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); load() }} doctor={user} />
      )}
    </div>
  )
}

function OpenVisitModal({ onClose, onSaved, doctor }) {
  const [patients, setPatients] = useState([])
  const [search, setSearch]     = useState('')
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({ visit_type: 'opd', chief_complaint_en: '', chief_complaint_am: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!search) return
    const t = setTimeout(async () => {
      try {
        const s = search.trim()
        let params = {}
        if (/^P[-]?\d+$/i.test(s)) {
          params = { patient_number: s }
        } else if (/^\+?\d{7,}$/.test(s)) {
          params = { phone: s }
        } else {
          params = { query: s }
        }
        const res = await patientsApi.list(params)
        setPatients(res.data.items ?? res.data)
      } catch {}
    }, 350)
    return () => clearTimeout(t)
  }, [search])

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    if (!selected) return toast.error('Please select a patient')
    setSaving(true)
    try {
      await visitsApi.open({ ...form, patient_id: selected.id, attending_doctor_id: doctor?.id })
      toast.success('Visit opened')
      onSaved()
    } catch (err) {
      const d = err.response?.data?.detail
      toast.error(typeof d === 'object' ? d.en : d || 'Failed to open visit')
    } finally { setSaving(false) }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>Open New Visit</h3>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={submit}>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Search Patient</label>
            <div className="search-bar">
              <Search size={14} className="search-icon" />
              <input className="form-input" placeholder="Name or phone…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            {patients.length > 0 && !selected && (
              <div className="patient-dropdown">
                {patients.map(p => (
                  <div key={p.id} className="patient-option" onClick={() => { setSelected(p); setSearch(`${p.first_name_en} ${p.last_name_en}`); setPatients([]) }}>
                    <span className="mono" style={{ fontSize:'0.8rem', color:'var(--color-primary-light)' }}>{p.patient_number}</span>
                    <span>{p.first_name_en} {p.last_name_en}</span>
                    <span style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>{p.phone}</span>
                  </div>
                ))}
              </div>
            )}
            {selected && (
              <div className="selected-patient">
                ✓ {selected.first_name_en} {selected.last_name_en} ({selected.patient_number})
                <button type="button" className="btn btn-ghost btn-sm" style={{marginLeft:'auto'}} onClick={() => { setSelected(null); setSearch('') }}>✕</button>
              </div>
            )}
          </div>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Visit Type</label>
            <select className="form-select" name="visit_type" value={form.visit_type} onChange={handle}>
              <option value="opd">OPD (Outpatient)</option>
              <option value="ipd">IPD (Inpatient)</option>
              <option value="emergency">Emergency</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Chief Complaint (English) *</label>
            <input className="form-input" name="chief_complaint_en" value={form.chief_complaint_en} onChange={handle} required />
          </div>

          <div className="form-group">
            <label className="form-label">Chief Complaint (Amharic)</label>
            <input className="form-input" name="chief_complaint_am" value={form.chief_complaint_am} onChange={handle} />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving || !selected}>
              {saving ? 'Opening…' : 'Open Visit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
