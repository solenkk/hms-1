import axios from 'axios'

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('hms_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !err.config.url.includes('/auth/login')) {
      localStorage.removeItem('hms_token')
      localStorage.removeItem('hms_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api

// ─── Error helper ─────────────────────────────────────────────
// Normalizes FastAPI error responses into a human-readable string.
// Handles the three shapes the backend returns:
//   1. string                    → "Something went wrong"
//   2. { en, am } localized dict  → uses the English message
//   3. array of 422 validation errors → joins each field message
export function apiError(err, fallback = 'Something went wrong') {
  const d = err?.response?.data?.detail
  if (!d) return err?.message || fallback
  if (typeof d === 'string') return d
  if (Array.isArray(d)) {
    const msgs = d
      .map(e => {
        const field = Array.isArray(e.loc) ? e.loc[e.loc.length - 1] : null
        const msg = (e.msg || '').replace(/^Value error,\s*/, '')
        return field ? `${field}: ${msg}` : msg
      })
      .filter(Boolean)
    return msgs.length ? msgs.join('; ') : fallback
  }
  if (typeof d === 'object') return d.en || d.am || fallback
  return fallback
}

// ─── Auth ─────────────────────────────────────────────────────
export const authApi = {
  login: (data) => api.post('/auth/login', data),
  me:    ()     => api.get('/auth/me'),
  changePassword: (data) => api.post('/auth/change-password', data),
}

// ─── Patients ─────────────────────────────────────────────────
export const patientsApi = {
  list:       (params) => api.get('/patients', { params }),
  get:        (id)     => api.get(`/patients/${id}`),
  create:     (data)   => api.post('/patients', data),
  update:     (id, data) => api.put(`/patients/${id}`, data),
  deactivate: (id)     => api.delete(`/patients/${id}`),
  consent:    (id, data) => api.post(`/patients/${id}/consent`, data),
}

// ─── Visits ───────────────────────────────────────────────────
export const visitsApi = {
  list:    (params) => api.get('/visits', { params }),
  get:     (id)     => api.get(`/visits/${id}`),
  open:    (data)   => api.post('/visits', data),
  close:   (id, data) => api.put(`/visits/${id}/close`, data),
  vitals:  (id, data) => api.post(`/visits/${id}/vitals`, data),
  patientVisits: (patientId, params) => api.get(`/visits/patients/${patientId}/visits`, { params }),
}

// ─── EMR ──────────────────────────────────────────────────────
export const emrApi = {
  getNotes:   (visitId) => api.get(`/emr/visits/${visitId}/notes`),
  getNote:    (id)       => api.get(`/emr/notes/${id}`),
  createNote: (data)    => api.post('/emr/notes', data),
  updateNote: (id, data) => api.put(`/emr/notes/${id}`, data),
  signNote:   (id)       => api.post(`/emr/notes/${id}/sign`),
  summary:    (patientId) => api.get(`/emr/patients/${patientId}/summary`),
  searchDiagnoses: (q) => api.get('/emr/diagnoses/search', { params: { q } }),
}

// ─── Lab ──────────────────────────────────────────────────────
export const labApi = {
  testTypes:      (params) => api.get('/lab/test-types', { params }),
  createTestType: (data) => api.post('/lab/test-types', data),
  updateTestType: (id, data) => api.put(`/lab/test-types/${id}`, data),
  testParameters: (id)   => api.get(`/lab/test-types/${id}/parameters`),
  createOrder:    (data) => api.post('/lab/orders', data),
  cancelOrder:    (id)   => api.delete(`/lab/orders/${id}`),
  getOrder:       (id)   => api.get(`/lab/orders/${id}`),
  pending:        ()     => api.get('/lab/orders/pending'),
  accept:         (id)   => api.post(`/lab/orders/items/${id}/accept`),
  collectSample:  (data) => api.post('/lab/orders/items/collect-sample', data),
  enterResults:   (data) => api.post('/lab/orders/items/results', data),
  verify:         (id)   => api.post(`/lab/orders/items/${id}/verify`),
  history:        (pid)  => api.get(`/lab/patients/${pid}/history`),
}

// ─── Pharmacy ─────────────────────────────────────────────────
export const pharmacyApi = {
  drugs:       (params) => api.get('/pharmacy/drugs', { params }),
  createDrug:  (data)   => api.post('/pharmacy/drugs', data),
  updateDrug:  (id, data) => api.put(`/pharmacy/drugs/${id}`, data),
  addBatch:    (data)   => api.post('/pharmacy/drugs/batches', data),
  expiring:    ()       => api.get('/pharmacy/drugs/expiring'),
  prescribe:   (data)   => api.post('/pharmacy/prescriptions', data),
  cancelPrescription: (id) => api.delete(`/pharmacy/prescriptions/${id}`),
  updatePrescriptionNotes: (id, notes) => api.patch(`/pharmacy/prescriptions/${id}/notes`, null, { params: { notes } }),
  getPrescription:(id)  => api.get(`/pharmacy/prescriptions/${id}`),
  dispense:    (data)   => api.post('/pharmacy/dispense', data),
  patientPrescriptions: (patientId) => api.get(`/pharmacy/patients/${patientId}/prescriptions`),
  listPrescriptions: (params) => api.get('/pharmacy/prescriptions', { params }),
  recordInjection: (data) => api.post('/pharmacy/injections', data),
  listInjectionLogs: (itemId) => api.get(`/pharmacy/prescriptions/items/${itemId}/injections`),
}

// ─── Billing ──────────────────────────────────────────────────
export const billingApi = {
  create:     (data)   => api.post('/billing/invoices', data),
  get:        (id)     => api.get(`/billing/invoices/${id}`),
  listAll:    (params) => api.get('/billing/invoices', { params }),
  list:       (patientId) => api.get(`/billing/patients/${patientId}/invoices`),
  pay:        (data)   => api.post('/billing/payments', data),
  cancel:     (id, reason) => api.post(`/billing/invoices/${id}/cancel`, null, { params: { reason } }),
}

// ─── Beds ─────────────────────────────────────────────────────
export const bedsApi = {
  wards:    ()     => api.get('/beds/wards'),
  beds:     (params) => api.get('/beds', { params }),
  admit:    (data) => api.post('/beds/admissions', data),
  discharge:(id, data) => api.put(`/beds/admissions/${id}/discharge`, data),
  getAdmission: (id) => api.get(`/beds/admissions/${id}`),
}

// ─── Reports ──────────────────────────────────────────────────
export const reportsApi = {
  dashboard: ()       => api.get('/reports/dashboard'),
  visits:    (period) => api.get('/reports/visits', { params: { period } }),
  revenue:   (period) => api.get('/reports/revenue', { params: { period } }),
  diagnoses: ()       => api.get('/reports/diagnoses'),
  labPerf:   ()       => api.get('/reports/lab-performance'),
  drugStock: ()       => api.get('/reports/drug-stock'),
  breach:    ()       => api.get('/reports/audit/breach-candidates'),
}

// ─── Admin ────────────────────────────────────────────────────
export const adminApi = {
  roles:          ()     => api.get('/admin/roles'),
  users:          ()     => api.get('/admin/users'),
  createUser:     (data) => api.post('/admin/users', data),
  deactivateUser: (id, reason) => api.delete(`/admin/users/${id}`, { params: { reason } }),
}
