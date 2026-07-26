import { useState, useEffect } from 'react'
import { labApi, visitsApi, apiError } from '../api'
import { FlaskConical, Plus, Pencil, Trash2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Lab() {
  const [orders, setOrders] = useState([])
  const [testTypes, setTestTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [resultItem, setResultItem] = useState(null)
  const [tab, setTab] = useState('pending')
  const [testTypeModal, setTestTypeModal] = useState(null) // { testType } | { testType: null } for new
  const { user: me } = useAuth()
  const myRole = me?.role?.name ?? me?.role
  const canVerify = ['doctor', 'admin'].includes(myRole)
  const canOrder = myRole !== 'lab_technician'
  const canWorkOrders = ['lab_technician', 'admin'].includes(myRole)  // only tech & admin accept/collect/enter
  const isAdmin = myRole === 'admin'   // only admin manages the test catalogue & prices

  const loadTestTypes = async () => {
    // Admins also see retired tests so they can bring one back.
    const res = await labApi.testTypes(isAdmin ? { include_inactive: true } : undefined)
    setTestTypes(res.data)
  }

  useEffect(() => {
    Promise.all([labApi.pending(), labApi.testTypes(isAdmin ? { include_inactive: true } : undefined)])
      .then(([o, t]) => { setOrders(o.data); setTestTypes(t.data) })
      .catch(() => toast.error('Failed to load lab data'))
      .finally(() => setLoading(false))
  }, [isAdmin])

  const loadOrders = async () => {
    const res = await labApi.pending()
    setOrders(res.data)
  }

  const accept = async (itemId) => {
    try {
      await labApi.accept(itemId)
      toast.success('Order accepted')
      await loadOrders()
    } catch (err) {
      toast.error(apiError(err, 'Failed to accept order'))
    }
  }

  const collectSample = async (itemId) => {
    try {
      await labApi.collectSample({ lab_order_item_id: itemId })
      toast.success('Sample collected')
      await loadOrders()
    } catch (err) {
      toast.error(apiError(err, 'Failed to collect sample'))
    }
  }

  const verify = async (itemId) => {
    try {
      await labApi.verify(itemId)
      toast.success('Results verified')
      await loadOrders()
    } catch (err) {
      toast.error(apiError(err, 'Failed to verify results'))
    }
  }

  const statusBadge = (s) => {
    const map = { pending: 'badge-orange', accepted: 'badge-purple', sample_collected: 'badge-blue', completed: 'badge-green', cancelled: 'badge-gray' }
    return <span className={`badge ${map[s] || 'badge-gray'}`}>{s?.replace('_',' ')}</span>
  }

  return (
    <div className="page-body">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Laboratory</h1>
          <p>Lab orders, sample collection, and results</p>
        </div>
        {tab === 'types'
          ? isAdmin && (
            <button className="btn btn-primary" onClick={() => setTestTypeModal({ testType: null })}>
              <Plus size={16} /> Add Test Type
            </button>
          )
          : canOrder && (
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={16} /> New Order
            </button>
          )}
      </div>

      <div className="tabs">
        <button className={`tab-btn ${tab==='pending'?'active':''}`} onClick={() => setTab('pending')}>Pending</button>
        <button className={`tab-btn ${tab==='types'?'active':''}`} onClick={() => setTab('types')}>Test Types</button>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : tab === 'pending' ? (
          orders.length === 0 ? (
            <div className="empty-state"><FlaskConical size={48}/><p style={{marginTop:'0.5rem'}}>No pending lab orders</p></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Patient</th>
                    <th>Tests</th>
                    <th>Priority</th>
                    <th>Ordered</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => o.items?.map(item => (
                    <tr key={item.id}>
                      <td><span className="mono patient-num">{o.order_number}</span></td>
                      <td>{o.patient_name_en || (o.patient_id ? o.patient_id.slice(0,8)+'…' : '—')}</td>
                      <td>{item.test_name_en || item.test_type_name || item.test_type_id}</td>
                      <td><span className={`badge ${o.priority==='urgent'?'badge-red':'badge-blue'}`}>{o.priority}</span></td>
                      <td style={{fontSize:'0.8rem',color:'var(--text-muted)'}}>{new Date(o.ordered_at || o.created_at).toLocaleString()}</td>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                          {canWorkOrders && item.status === 'pending' && (
                            <button className="btn btn-primary btn-sm" onClick={() => accept(item.id)}>
                              Accept
                            </button>
                          )}
                          {canWorkOrders && item.status === 'accepted' && (
                            <button className="btn btn-accent btn-sm" onClick={() => collectSample(item.id)}>
                              Collect Sample
                            </button>
                          )}
                          {canWorkOrders && item.status === 'sample_collected' && (
                            <button className="btn btn-accent btn-sm" onClick={() => setResultItem(item)}>
                              Enter Results
                            </button>
                          )}
                          {item.status === 'completed' && !item.verified_at && (
                            canVerify
                              ? <button className="btn btn-primary btn-sm" onClick={() => verify(item.id)}>Verify</button>
                              : <span style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>Awaiting verification</span>
                          )}
                          {item.verified_at && <span className="badge badge-green">Verified ✓</span>}
                          {!item.verified_at && !canWorkOrders && statusBadge(item.status)}
                        </div>
                      </td>
                    </tr>
                  )))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          testTypes.length === 0 ? (
            <div className="empty-state">
              <FlaskConical size={48}/>
              <p style={{marginTop:'0.5rem'}}>No lab tests configured yet</p>
              {isAdmin && (
                <button className="btn btn-primary btn-sm" style={{marginTop:'1rem'}} onClick={() => setTestTypeModal({ testType: null })}>
                  <Plus size={14} /> Add the First Test
                </button>
              )}
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Test Name</th>
                    <th>Category</th>
                    <th>Sample</th>
                    <th>Turnaround</th>
                    <th>Price (ETB)</th>
                    <th>Parameters</th>
                    {isAdmin && <th>Status</th>}
                    {isAdmin && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {testTypes.map(t => (
                    <tr key={t.id} style={{ opacity: t.is_active === false ? 0.55 : 1 }}>
                      <td>{t.id}</td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{t.name_en}</div>
                        {t.name_am && <div className="amharic" style={{fontSize:'0.78rem',color:'var(--text-muted)'}}>{t.name_am}</div>}
                      </td>
                      <td>{t.category || '—'}</td>
                      <td>{t.sample_type || '—'}</td>
                      <td>{t.turnaround_hours != null ? `${t.turnaround_hours} h` : '—'}</td>
                      <td style={{ fontWeight: 600 }}>{Number(t.price ?? 0).toFixed(2)}</td>
                      <td>{t.parameters?.length || 0}</td>
                      {isAdmin && (
                        <td>
                          <span className={`badge ${t.is_active === false ? 'badge-gray' : 'badge-green'}`}>
                            {t.is_active === false ? 'Retired' : 'Active'}
                          </span>
                        </td>
                      )}
                      {isAdmin && (
                        <td>
                          <button
                            className="btn btn-ghost btn-xs"
                            style={{ display:'inline-flex', alignItems:'center', gap:'0.2rem' }}
                            onClick={() => setTestTypeModal({ testType: t })}
                            title="Edit name, price, sample type or parameters"
                          >
                            <Pencil size={12} /> Edit
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {showModal && (
        <NewOrderModal
          testTypes={testTypes.filter(t => t.is_active !== false)}
          onClose={() => setShowModal(false)}
          onSaved={async () => { setShowModal(false); await loadOrders() }}
        />
      )}

      {resultItem && (
        <EnterResultsModal
          item={resultItem}
          onClose={() => setResultItem(null)}
          onSaved={async () => { setResultItem(null); await loadOrders() }}
        />
      )}

      {testTypeModal && (
        <TestTypeModal
          testType={testTypeModal.testType}
          onClose={() => setTestTypeModal(null)}
          onSaved={async () => { setTestTypeModal(null); await loadTestTypes() }}
        />
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  TEST TYPE MODAL — admin adds a new lab test or edits an existing one      */
/* ═══════════════════════════════════════════════════════════════════════════ */

const emptyParam = () => ({
  id: null, parameter_name_en: '', unit: '',
  normal_range_min: '', normal_range_max: '', normal_range_text: ''
})

function TestTypeModal({ testType, onClose, onSaved }) {
  const isEdit = Boolean(testType)
  const [form, setForm] = useState({
    name_en: testType?.name_en ?? '',
    name_am: testType?.name_am ?? '',
    category: testType?.category ?? '',
    sample_type: testType?.sample_type ?? '',
    turnaround_hours: testType?.turnaround_hours ?? '',
    price: testType?.price ?? 0,
    instructions_en: testType?.instructions_en ?? '',
    is_active: testType?.is_active ?? true,
  })
  const [params, setParams] = useState(
    (testType?.parameters ?? []).map(p => ({
      id: p.id,
      parameter_name_en: p.parameter_name_en ?? '',
      unit: p.unit ?? '',
      normal_range_min: p.normal_range_min ?? '',
      normal_range_max: p.normal_range_max ?? '',
      normal_range_text: p.normal_range_text ?? '',
    }))
  )
  const [saving, setSaving] = useState(false)

  const handle = e => {
    const { name, value, type, checked } = e.target
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }
  const handleParam = (i, field, value) =>
    setParams(ps => ps.map((p, idx) => idx === i ? { ...p, [field]: value } : p))
  const addParam = () => setParams(ps => [...ps, emptyParam()])
  const removeParam = (i) => setParams(ps => ps.filter((_, idx) => idx !== i))

  const submit = async (e) => {
    e.preventDefault()
    const named = params.filter(p => p.parameter_name_en.trim() !== '')
    if (params.length > 0 && named.length !== params.length) {
      return toast.error('Every parameter needs a name — remove the blank rows')
    }
    setSaving(true)
    const payload = {
      name_en: form.name_en.trim(),
      name_am: form.name_am || null,
      category: form.category || null,
      sample_type: form.sample_type || null,
      turnaround_hours: form.turnaround_hours === '' ? null : parseInt(form.turnaround_hours),
      price: parseFloat(form.price) || 0,
      instructions_en: form.instructions_en || null,
      parameters: named.map((p, index) => ({
        id: p.id ?? undefined,
        parameter_name_en: p.parameter_name_en.trim(),
        unit: p.unit || null,
        normal_range_min: p.normal_range_min === '' ? null : parseFloat(p.normal_range_min),
        normal_range_max: p.normal_range_max === '' ? null : parseFloat(p.normal_range_max),
        normal_range_text: p.normal_range_text || null,
        sort_order: index,
      })),
    }
    try {
      const res = isEdit
        ? await labApi.updateTestType(testType.id, { ...payload, is_active: form.is_active })
        : await labApi.createTestType(payload)
      toast.success(isEdit ? `${payload.name_en} updated` : `${payload.name_en} added to the lab catalogue`)
      ;(res.data?.warnings ?? []).forEach(w => toast(w, { icon: '⚠️' }))
      onSaved()
    } catch (err) {
      toast.error(apiError(err, isEdit ? 'Failed to update test' : 'Failed to add test'))
    } finally { setSaving(false) }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>{isEdit ? `Edit Test — ${testType.name_en}` : 'Add Lab Test'}</h3>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={submit}>
          <div className="form-grid" style={{ marginBottom: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Test Name (EN) *</label>
              <input className="form-input" name="name_en" value={form.name_en} onChange={handle} required placeholder="e.g. Complete Blood Count" />
            </div>
            <div className="form-group">
              <label className="form-label">Test Name (AM)</label>
              <input className="form-input" name="name_am" value={form.name_am} onChange={handle} />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <input className="form-input" name="category" value={form.category} onChange={handle} placeholder="e.g. Hematology" />
            </div>
            <div className="form-group">
              <label className="form-label">Sample Type</label>
              <input className="form-input" name="sample_type" value={form.sample_type} onChange={handle} placeholder="e.g. Blood, Urine" />
            </div>
            <div className="form-group">
              <label className="form-label">Price (ETB) *</label>
              <input className="form-input" type="number" step="0.01" min="0" name="price" value={form.price} onChange={handle} required />
              <small className="form-hint">Billed to the patient when a doctor orders this test.</small>
            </div>
            <div className="form-group">
              <label className="form-label">Turnaround (hours)</label>
              <input className="form-input" type="number" min="0" name="turnaround_hours" value={form.turnaround_hours} onChange={handle} placeholder="e.g. 24" />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Instructions</label>
            <textarea className="form-input" rows={2} name="instructions_en" value={form.instructions_en} onChange={handle} placeholder="Patient prep, e.g. fasting 8 hours" />
          </div>

          {/* Parameters the lab technician will fill in when entering results */}
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.5rem' }}>
              <label className="form-label" style={{ margin: 0 }}>Result Parameters</label>
              <button type="button" className="btn btn-ghost btn-xs" onClick={addParam}>
                <Plus size={12} /> Add Parameter
              </button>
            </div>
            {params.length === 0 ? (
              <small className="form-hint">
                No parameters yet. Add at least one (e.g. "WBC", unit 10³/µL) — the lab cannot enter results without them.
              </small>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem', maxHeight:'240px', overflowY:'auto' }}>
                {params.map((p, i) => (
                  <div key={p.id ?? `new-${i}`} style={{ display:'flex', gap:'0.4rem', alignItems:'flex-start' }}>
                    <input
                      className="form-input" style={{ flex: 2 }} placeholder="Parameter name *"
                      value={p.parameter_name_en}
                      onChange={e => handleParam(i, 'parameter_name_en', e.target.value)}
                    />
                    <input
                      className="form-input" style={{ flex: 1 }} placeholder="Unit"
                      value={p.unit}
                      onChange={e => handleParam(i, 'unit', e.target.value)}
                    />
                    <input
                      className="form-input" style={{ width: 90 }} type="number" step="0.001" placeholder="Min"
                      value={p.normal_range_min}
                      onChange={e => handleParam(i, 'normal_range_min', e.target.value)}
                    />
                    <input
                      className="form-input" style={{ width: 90 }} type="number" step="0.001" placeholder="Max"
                      value={p.normal_range_max}
                      onChange={e => handleParam(i, 'normal_range_max', e.target.value)}
                    />
                    <button type="button" className="btn btn-ghost btn-xs btn-icon"
                            style={{ color:'var(--color-danger)', marginTop: '0.25rem' }}
                            title="Remove parameter" onClick={() => removeParam(i)}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {isEdit && (
            <label style={{ display:'flex', alignItems:'center', gap:'0.5rem', cursor:'pointer', fontSize:'0.88rem', marginBottom:'1rem' }}>
              <input type="checkbox" name="is_active" checked={form.is_active} onChange={handle} />
              Active (uncheck to retire — doctors can no longer order it)
            </label>
          )}

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Test'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function NewOrderModal({ testTypes, onClose, onSaved }) {
  const [visits, setVisits] = useState([])
  const [form, setForm] = useState({ visit_id: '', priority: 'routine', clinical_notes: '' })
  const [selectedTests, setSelectedTests] = useState([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    visitsApi.list({ status: 'open' })
      .then(r => setVisits(r.data))
      .catch(() => toast.error('Failed to load open visits'))
  }, [])

  const toggleTest = (id) =>
    setSelectedTests(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id])

  const submit = async (e) => {
    e.preventDefault()
    if (!form.visit_id) return toast.error('Select a visit')
    if (selectedTests.length === 0) return toast.error('Select at least one test')
    setSaving(true)
    try {
      await labApi.createOrder({
        visit_id: form.visit_id,
        test_type_ids: selectedTests,
        priority: form.priority,
        clinical_notes: form.clinical_notes || undefined,
      })
      toast.success('Lab order created')
      onSaved()
    } catch (err) {
      toast.error(apiError(err, 'Failed to create lab order'))
    } finally { setSaving(false) }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>New Lab Order</h3>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={submit}>
          <div className="form-group" style={{ marginBottom:'1rem' }}>
            <label className="form-label">Visit *</label>
            <select className="form-select" value={form.visit_id}
                    onChange={e => setForm(f => ({ ...f, visit_id: e.target.value }))} required>
              <option value="">Select an open visit…</option>
              {visits.map(v => (
                <option key={v.id} value={v.id}>
                  {v.visit_number} — {v.patient ? `${v.patient.first_name_en} ${v.patient.last_name_en}` : v.patient_id?.slice(0,8)}
                </option>
              ))}
            </select>
            {visits.length === 0 && <small className="form-hint">No open visits available.</small>}
          </div>

          <div className="form-group" style={{ marginBottom:'1rem' }}>
            <label className="form-label">Tests *</label>
            <div style={{ maxHeight:'180px', overflowY:'auto', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', padding:'0.5rem' }}>
              {testTypes.length === 0 ? (
                <small className="form-hint">No test types configured.</small>
              ) : testTypes.map(t => (
                <label key={t.id} style={{ display:'flex', alignItems:'center', gap:'0.5rem', padding:'0.25rem 0', cursor:'pointer' }}>
                  <input type="checkbox" checked={selectedTests.includes(t.id)} onChange={() => toggleTest(t.id)} />
                  <span>{t.name_en}</span>
                  <span style={{ marginLeft:'auto', color:'var(--text-muted)', fontSize:'0.8rem' }}>
                    {t.price != null ? `${t.price.toFixed(2)} ETB` : ''}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-group" style={{ marginBottom:'1rem' }}>
            <label className="form-label">Priority</label>
            <select className="form-select" value={form.priority}
                    onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
              <option value="routine">Routine</option>
              <option value="urgent">Urgent</option>
              <option value="stat">STAT</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom:'1rem' }}>
            <label className="form-label">Clinical Notes</label>
            <textarea className="form-input" rows={3} value={form.clinical_notes}
                      onChange={e => setForm(f => ({ ...f, clinical_notes: e.target.value }))} />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating…' : 'Create Order'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function EnterResultsModal({ item, onClose, onSaved }) {
  const [params, setParams] = useState([])
  const [values, setValues] = useState({})   // parameter_id -> string
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    labApi.testParameters(item.test_type_id)
      .then(r => setParams(r.data))
      .catch(err => toast.error(apiError(err, 'Failed to load test parameters')))
      .finally(() => setLoading(false))
  }, [item.test_type_id])

  const range = (p) => {
    if (p.normal_range_text) return p.normal_range_text
    if (p.normal_range_min != null && p.normal_range_max != null) return `${p.normal_range_min}–${p.normal_range_max}`
    return null
  }

  const submit = async (e) => {
    e.preventDefault()
    const results = params
      .filter(p => (values[p.id] ?? '').trim() !== '')
      .map(p => ({ parameter_id: p.id, result_value: values[p.id].trim() }))
    if (results.length === 0) return toast.error('Enter at least one result')
    setSaving(true)
    try {
      await labApi.enterResults({ lab_order_item_id: item.id, results })
      toast.success('Results submitted')
      onSaved()
    } catch (err) {
      toast.error(apiError(err, 'Failed to submit results'))
    } finally { setSaving(false) }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>Enter Results — {item.test_name_en || `Test #${item.test_type_id}`}</h3>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={submit}>
          {loading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : params.length === 0 ? (
            <p className="form-hint" style={{ marginBottom:'1rem' }}>No parameters configured for this test.</p>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem', marginBottom:'1rem' }}>
              {params.map(p => (
                <div key={p.id} className="form-group">
                  <label className="form-label">
                    {p.parameter_name_en}{p.unit ? ` (${p.unit})` : ''}
                  </label>
                  <input
                    className="form-input"
                    value={values[p.id] ?? ''}
                    onChange={e => setValues(v => ({ ...v, [p.id]: e.target.value }))}
                  />
                  {range(p) && <small className="form-hint">Normal: {range(p)}</small>}
                </div>
              ))}
            </div>
          )}
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving || loading}>
              {saving ? 'Submitting…' : 'Submit Results'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
