import { useState, useEffect, useCallback } from 'react'
import { reportsApi } from '../api'
import { useAuth } from '../context/AuthContext'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'
import {
  BarChart3, FileSpreadsheet, Printer, AlertCircle,
  Loader2, CalendarDays, Activity,
} from 'lucide-react'
import toast from 'react-hot-toast'
import './Reports.css'

const COLORS = ['#3b9eff','#2ec98c','#f8a722','#e05c5c','#a78bfa','#34d399']
const PERIODS = ['today', 'week', 'month', 'year']

const MONTH_NAMES = [
  '', 'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

// ─── Helper: compute Monday of a given date's ISO week ───────────────────────
function isoWeekMonday(d) {
  const dt = new Date(d)
  const day = dt.getDay() || 7
  dt.setDate(dt.getDate() - day + 1)
  return dt.toISOString().slice(0, 10)
}

// ─── Helper: today as YYYY-MM-DD ─────────────────────────────────────────────
function todayISO() { return new Date().toISOString().slice(0, 10) }
function thisYear()  { return new Date().getFullYear() }
function thisMonth() { return new Date().getMonth() + 1 }

// ─── Helper: trigger a browser download from a Blob, no token in any URL ─────
function downloadBlob(blob, filename) {
  const objectUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = objectUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Give the download a moment to start before revoking.
  setTimeout(() => URL.revokeObjectURL(objectUrl), 30000)
}

// ─── Helper: open a Blob's content in a new tab, no token in any URL ─────────
function openBlobInNewTab(blob) {
  const objectUrl = URL.createObjectURL(blob)
  window.open(objectUrl, '_blank')
  setTimeout(() => URL.revokeObjectURL(objectUrl), 30000)
}

// ─── Empty State ─────────────────────────────────────────────────────────────
function EmptyReportState({ message = 'No reportable events found for this period' }) {
  return (
    <div className="hmis-empty-state">
      <AlertCircle size={42} strokeWidth={1.5} />
      <p>{message}</p>
    </div>
  )
}

// ─── Section-grouped preview table ───────────────────────────────────────────
function HmisPreviewTable({ data }) {
  if (!data || data.length === 0) return <EmptyReportState />

  // Check if every indicator has zero across all groups
  const hasAnyData = data.some(row => {
    const groups = row.groups || {}
    return Object.values(groups).some(v => {
      if (typeof v === 'number') return v > 0
      if (typeof v === 'object') return Object.values(v).some(n => n > 0)
      return false
    })
  })
  if (!hasAnyData) return <EmptyReportState />

  // Group rows by section
  const sections = {}
  data.forEach(row => {
    const sec = row.section || 'General'
    if (!sections[sec]) sections[sec] = []
    sections[sec].push(row)
  })

  // Collect all column headers across all rows in the section
  const getGroupCols = (rows) => {
    const cols = new Set()
    rows.forEach(r => Object.keys(r.groups || {}).forEach(k => cols.add(k)))
    return [...cols]
  }

  return (
    <div className="hmis-preview-wrap">
      {Object.entries(sections).map(([section, rows]) => {
        const cols = getGroupCols(rows)
        return (
          <div key={section} className="hmis-section-block">
            <div className="hmis-section-header">{section}</div>
            <div className="hmis-table-wrap">
              <table className="hmis-table">
                <thead>
                  <tr>
                    <th className="hmis-th-indicator">Indicator</th>
                    {cols.map(c => <th key={c} className="hmis-th-group">{c}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'hmis-row-even' : 'hmis-row-odd'}>
                      <td className="hmis-td-indicator">{row.indicator}</td>
                      {cols.map(c => {
                        const val = row.groups?.[c]
                        return (
                          <td key={c} className="hmis-td-value">
                            {typeof val === 'number' ? val : (val === undefined ? '—' : JSON.stringify(val))}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Cohort preview ──────────────────────────────────────────────────────────
function CohortPreviewTable({ data }) {
  if (!data || data.length === 0) return <EmptyReportState />

  const row = data[0]?.groups || {}
  const isEmpty = Object.values(row).every(cohort =>
    typeof cohort === 'object' && Object.values(cohort).every(n => n === 0)
  )
  if (isEmpty) return <EmptyReportState />

  const cohorts = Object.entries(row)
  const outcomeKeys = cohorts.length > 0 ? Object.keys(cohorts[0][1] || {}) : []

  return (
    <div className="hmis-preview-wrap">
      <div className="hmis-section-block">
        <div className="hmis-section-header">6-Month Cohort Outcomes (HTN/DM)</div>
        <div className="hmis-table-wrap">
          <table className="hmis-table">
            <thead>
              <tr>
                <th className="hmis-th-indicator">Outcome</th>
                {cohorts.map(([key]) => (
                  <th key={key} className="hmis-th-group">{key.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {outcomeKeys.map((outcome, i) => (
                <tr key={outcome} className={i % 2 === 0 ? 'hmis-row-even' : 'hmis-row-odd'}>
                  <td className="hmis-td-indicator" style={{ textTransform: 'capitalize' }}>
                    {outcome.replace(/_/g, ' ')}
                  </td>
                  {cohorts.map(([key, values]) => (
                    <td key={key} className="hmis-td-value">{values[outcome] ?? '—'}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── Government Reports Tab ───────────────────────────────────────────────────
function GovernmentReportsTab() {
  const [subTab, setSubTab] = useState('monthly')

  // Monthly state
  const [month, setMonth]   = useState(thisMonth())
  const [year, setYear]     = useState(thisYear())

  // Weekly state
  const [weekStart, setWeekStart] = useState(isoWeekMonday(todayISO()))
  const [weekLabel, setWeekLabel] = useState(null)
  const [weekLabelLoading, setWeekLabelLoading] = useState(false)

  // Cohort state
  const [cohortDate, setCohortDate] = useState(todayISO())

  // Report data
  const [reportData, setReportData] = useState(null)
  const [loading, setLoading]       = useState(false)
  const [fetched, setFetched]       = useState(false)

  // Export state (separate from preview loading, so exporting doesn't
  // disturb the "Generate Preview" button's own loading state)
  const [exportingExcel, setExportingExcel] = useState(false)
  const [exportingPdf, setExportingPdf]     = useState(false)

  // ── Fetch EPI week label whenever weekStart changes ──
  useEffect(() => {
    if (!weekStart) return
    setWeekLabelLoading(true)
    reportsApi.hmisWeekLabel(weekStart)
      .then(r => setWeekLabel(r.data))
      .catch(() => setWeekLabel(null))
      .finally(() => setWeekLabelLoading(false))
  }, [weekStart])

  // Reset preview when sub-tab or params change
  useEffect(() => {
    setReportData(null)
    setFetched(false)
  }, [subTab, month, year, weekStart, cohortDate])

  const handleGenerate = useCallback(async () => {
    setLoading(true)
    setFetched(false)
    try {
      let res
      if (subTab === 'monthly') {
        res = await reportsApi.hmisMonthly(year, month)
      } else if (subTab === 'weekly') {
        res = await reportsApi.hmisWeekly(`${weekStart}T00:00:00`)
      } else {
        res = await reportsApi.hmisCohort(`${cohortDate}T00:00:00`)
      }
      setReportData(res.data)
      setFetched(true)
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to load report')
      setReportData(null)
      setFetched(true)
    } finally {
      setLoading(false)
    }
  }, [subTab, month, year, weekStart, cohortDate])

  // ── Excel export: fetch as an authenticated blob, then trigger a
  //    normal browser download. The auth token travels in the request
  //    header via the shared axios instance — it never appears in a URL. ──
  const handleExcelExport = async () => {
    setExportingExcel(true)
    try {
      const res = await reportsApi.hmisExportExcel(year, month)
      downloadBlob(res.data, `hmis-monthly-report-${year}-${String(month).padStart(2, '0')}.xlsx`)
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to export Excel report')
    } finally {
      setExportingExcel(false)
    }
  }

  // ── HTML/print export: fetch as an authenticated blob, then open the
  //    blob's own object URL in a new tab (not the API URL) so the
  //    already-authenticated content displays without a token in the URL. ──
  const handleHtmlExport = async () => {
    setExportingPdf(true)
    try {
      const res = await reportsApi.hmisExportHtml(year, month)
      openBlobInNewTab(res.data)
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to open print report')
    } finally {
      setExportingPdf(false)
    }
  }

  const currentYear = thisYear()
  const years = Array.from({ length: 6 }, (_, i) => currentYear - i)

  return (
    <div className="hmis-tab-root">
      {/* Sub-tab navigation */}
      <div className="hmis-subtab-bar">
        {[
          { key: 'monthly', label: '📋 Monthly HMIS' },
          { key: 'weekly',  label: '📆 Weekly PHEM' },
          { key: 'cohort',  label: '🩺 Cohort Outcomes' },
        ].map(st => (
          <button
            key={st.key}
            id={`hmis-subtab-${st.key}`}
            className={`hmis-subtab-btn ${subTab === st.key ? 'active' : ''}`}
            onClick={() => setSubTab(st.key)}
          >
            {st.label}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
          {/* ── Controls ── */}
          {subTab === 'monthly' && (
            <div className="hmis-controls-row">
              <div className="hmis-control-group">
                <label className="hmis-label" htmlFor="hmis-month">Month</label>
                <select
                  id="hmis-month"
                  className="hmis-select"
                  value={month}
                  onChange={e => setMonth(Number(e.target.value))}
                >
                  {MONTH_NAMES.slice(1).map((name, i) => (
                    <option key={i + 1} value={i + 1}>{name}</option>
                  ))}
                </select>
              </div>
              <div className="hmis-control-group">
                <label className="hmis-label" htmlFor="hmis-year">Year</label>
                <select
                  id="hmis-year"
                  className="hmis-select"
                  value={year}
                  onChange={e => setYear(Number(e.target.value))}
                >
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <button
                id="hmis-generate-btn"
                className="btn btn-primary hmis-generate-btn"
                onClick={handleGenerate}
                disabled={loading}
              >
                {loading ? <Loader2 size={15} className="spinning" /> : <Activity size={15} />}
                {loading ? 'Generating…' : 'Generate Preview'}
              </button>
            </div>
          )}

          {subTab === 'weekly' && (
            <div className="hmis-controls-row">
              <div className="hmis-control-group">
                <label className="hmis-label" htmlFor="hmis-week-start">Week Start (Monday)</label>
                <input
                  id="hmis-week-start"
                  type="date"
                  className="hmis-input"
                  value={weekStart}
                  onChange={e => setWeekStart(isoWeekMonday(e.target.value))}
                />
              </div>
              {weekLabel && (
                <div className="hmis-week-label-badge">
                  <CalendarDays size={14} />
                  <span>
                    <strong>EPI Wk {weekLabel.iso_epi_week}/{weekLabel.iso_year}</strong>
                    &nbsp;·&nbsp;{weekLabel.ec_label}
                  </span>
                </div>
              )}
              {weekLabelLoading && <Loader2 size={14} className="spinning" style={{ color: 'var(--text-muted)' }} />}
              <button
                id="hmis-generate-weekly-btn"
                className="btn btn-primary hmis-generate-btn"
                onClick={handleGenerate}
                disabled={loading}
              >
                {loading ? <Loader2 size={15} className="spinning" /> : <Activity size={15} />}
                {loading ? 'Generating…' : 'Generate Preview'}
              </button>
            </div>
          )}

          {subTab === 'cohort' && (
            <div className="hmis-controls-row">
              <div className="hmis-control-group">
                <label className="hmis-label" htmlFor="hmis-cohort-date">Target Date</label>
                <input
                  id="hmis-cohort-date"
                  type="date"
                  className="hmis-input"
                  value={cohortDate}
                  onChange={e => setCohortDate(e.target.value)}
                />
              </div>
              <p className="hmis-helper-text">
                Shows 6-month HTN/DM cohort outcomes for patients enrolled ~6 months before this date.
              </p>
              <button
                id="hmis-generate-cohort-btn"
                className="btn btn-primary hmis-generate-btn"
                onClick={handleGenerate}
                disabled={loading}
              >
                {loading ? <Loader2 size={15} className="spinning" /> : <Activity size={15} />}
                {loading ? 'Generating…' : 'Generate Preview'}
              </button>
            </div>
          )}

          {/* ── Export buttons (monthly only) ── */}
          {subTab === 'monthly' && (
            <div className="hmis-export-row">
              <button
                id="hmis-export-excel-btn"
                className="btn hmis-export-btn hmis-export-excel"
                onClick={handleExcelExport}
                disabled={exportingExcel}
                title="Download as Excel (.xlsx)"
              >
                {exportingExcel ? <Loader2 size={15} className="spinning" /> : <FileSpreadsheet size={15} />}
                {exportingExcel ? 'Exporting…' : 'Export Excel'}
              </button>
              <button
                id="hmis-export-pdf-btn"
                className="btn hmis-export-btn hmis-export-pdf"
                onClick={handleHtmlExport}
                disabled={exportingPdf}
                title="Opens a print-ready HTML page — use File → Print → Save as PDF in your browser"
              >
                {exportingPdf ? <Loader2 size={15} className="spinning" /> : <Printer size={15} />}
                {exportingPdf ? 'Opening…' : 'Export / Print PDF'}
              </button>
            </div>
          )}
        </div>

        {/* Reminder banner: correctness caveat while indicators are still
            being wired/seeded and verified — remove once fully validated. */}
        {subTab === 'monthly' && (
          <div className="hmis-verify-banner">
            <AlertCircle size={14} />
            <span>Report preview — verify against source records before final government submission.</span>
          </div>
        )}

        {/* ── Preview area ── */}
        <div className="hmis-preview-area">
          {!fetched && !loading && (
            <div className="hmis-prompt-state">
              <BarChart3 size={38} strokeWidth={1.5} />
              <p>
                {subTab === 'monthly' && 'Select a month and year, then click "Generate Preview".'}
                {subTab === 'weekly'  && 'Choose a week start date, then click "Generate Preview".'}
                {subTab === 'cohort'  && 'Pick a target date, then click "Generate Preview".'}
              </p>
            </div>
          )}

          {loading && (
            <div className="hmis-loading-state">
              <Loader2 size={32} className="spinning" />
              <p>Loading report data…</p>
            </div>
          )}

          {fetched && !loading && subTab !== 'cohort' && (
            <HmisPreviewTable data={reportData} />
          )}

          {fetched && !loading && subTab === 'cohort' && (
            <CohortPreviewTable data={reportData} />
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Reports page ────────────────────────────────────────────────────────
export default function Reports() {
  const { user } = useAuth()
  const role = user?.role || ''
  const [tab, setTab]               = useState('dashboard')
  const [period, setPeriod]         = useState('month')
  const [dashData, setDashData]     = useState(null)
  const [visitsData, setVisitsData] = useState(null)
  const [revenueData, setRevenueData] = useState(null)
  const [diagnoses, setDiagnoses]   = useState([])
  const [stock, setStock]           = useState([])
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    setLoading(true)

    const dashPromise = reportsApi.dashboard()
      .then(r => r.data).catch(() => null)

    const visitsPromise = ['admin', 'doctor', 'receptionist'].includes(role)
      ? reportsApi.visits(period).then(r => r.data).catch(() => null)
      : Promise.resolve(null)

    const revenuePromise = ['admin', 'cashier', 'receptionist'].includes(role)
      ? reportsApi.revenue(period).then(r => r.data).catch(() => null)
      : Promise.resolve(null)

    const diagPromise = ['admin','doctor'].includes(role)
      ? reportsApi.diagnoses().then(r => r.data).catch(() => [])
      : Promise.resolve([])

    const stockPromise = ['admin','pharmacist'].includes(role)
      ? reportsApi.drugStock().then(r => r.data?.slice(0, 10)).catch(() => [])
      : Promise.resolve([])

    Promise.all([dashPromise, visitsPromise, revenuePromise, diagPromise, stockPromise])
      .then(([dash, visits, rev, diag, stk]) => {
        setDashData(dash)
        setVisitsData(visits)
        setRevenueData(rev)
        setDiagnoses(diag || [])
        setStock(stk || [])
      })
      .finally(() => setLoading(false))
  }, [role, period])

  if (loading) return <div className="page-body"><div className="loading-center"><div className="spinner" /></div></div>

  const breakdown = visitsData?.breakdown || {}
  const getTypeCount = (typeKey) => {
    const typeData = breakdown[typeKey] || breakdown[typeKey.toLowerCase()] || breakdown[typeKey.toUpperCase()] || {}
    return Object.values(typeData).reduce((sum, count) => sum + count, 0)
  }

  const visitTypeData = [
    { name: 'OPD', value: getTypeCount('opd') },
    { name: 'IPD', value: getTypeCount('ipd') },
    { name: 'Emergency', value: getTypeCount('emergency') },
  ]

  const totalVisits = visitsData?.total ?? 0
  const getStatusCount = (statusKey) => {
    let sum = 0
    Object.values(breakdown).forEach(typeData => {
      sum += typeData[statusKey] || typeData[statusKey.toLowerCase()] || typeData[statusKey.toUpperCase()] || 0
    })
    return sum
  }
  const openVisits   = getStatusCount('open')
  const closedVisits = getStatusCount('closed')
  const totalRevenue = revenueData?.by_payment_method?.reduce((sum, item) => sum + (item.total_etb || 0), 0) ?? 0

  const mappedDiagnoses = diagnoses.map(d => ({
    diagnosis_code: d.diagnosis_code || d.icd10_code || '',
    count: d.count ?? d.frequency ?? 0,
  }))

  const mappedStock = stock.map(s => ({
    ...s,
    name_generic_en: s.name_generic_en || s.name || '',
  }))

  const tabs = [
    { key: 'dashboard', label: 'Dashboard',         show: true },
    { key: 'diagnoses', label: 'Diagnoses',          show: ['admin','doctor'].includes(role) },
    { key: 'stock',     label: 'Drug Stock',         show: ['admin','pharmacist'].includes(role) },
    { key: 'hmis',      label: 'Government Reports', show: role === 'admin' },
  ].filter(t => t.show)

  return (
    <div className="page-body">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Reports</h1>
          <p>Analytics, statistics, and compliance reports</p>
        </div>
        {tab !== 'hmis' && (
          <div className="tabs">
            {PERIODS.map(p => (
              <button key={p} className={`tab-btn ${period === p ? 'active' : ''}`} onClick={() => setPeriod(p)}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="tabs" style={{ marginBottom: '1.5rem' }}>
        {tabs.map(t => (
          <button key={t.key} id={`report-tab-${t.key}`} className={`tab-btn ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'dashboard' && (
        <div className="reports-grid">
          <div className="card">
            <div className="card-header"><h3>Visit Type Distribution</h3></div>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={visitTypeData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({name,percent}) => `${name} ${(percent*100).toFixed(0)}%`}>
                  {visitTypeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:8 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <div className="card-header"><h3>Summary Stats</h3></div>
            <div className="report-stat-list">
              <ReportStat label="Total Visits" value={totalVisits} />
              <ReportStat label="Open Visits"  value={openVisits}  color="var(--color-accent)" />
              <ReportStat label="Closed Visits" value={closedVisits} />
              {['admin','cashier','receptionist'].includes(role) && (
                <ReportStat label="Revenue (ETB)" value={totalRevenue.toLocaleString()} color="var(--color-warning)" />
              )}
              <ReportStat label="Pending Labs"   value={dashData?.alerts?.pending_lab_orders ?? 0} color="hsl(270,65%,58%)" />
              <ReportStat label="Beds Total"     value={dashData?.beds?.total ?? 0} />
              <ReportStat label="Beds Occupied"  value={dashData?.beds?.occupied ?? 0} color="var(--color-danger)" />
            </div>
          </div>
        </div>
      )}

      {tab === 'diagnoses' && (
        <div className="card">
          <div className="card-header"><h3>Top Diagnoses</h3></div>
          {mappedDiagnoses.length === 0 ? (
            <div className="empty-state"><BarChart3 size={48}/><p style={{marginTop:'0.5rem'}}>No diagnoses recorded yet</p></div>
          ) : (
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={mappedDiagnoses} layout="vertical" barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" tick={{ fill:'var(--text-muted)', fontSize:12 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="diagnosis_code" tick={{ fill:'var(--text-secondary)', fontSize:11 }} width={80} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:8 }} />
                <Bar dataKey="count" fill="var(--color-primary)" radius={[0,6,6,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {tab === 'stock' && (
        <div className="card">
          <div className="card-header"><h3>Drug Stock Levels (Bottom 10)</h3></div>
          {!mappedStock || mappedStock.length === 0 ? (
            <div className="empty-state"><BarChart3 size={48}/><p style={{marginTop:'0.5rem'}}>No stock data</p></div>
          ) : (
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={mappedStock} layout="vertical" barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" tick={{ fill:'var(--text-muted)', fontSize:12 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name_generic_en" tick={{ fill:'var(--text-secondary)', fontSize:11 }} width={120} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:8 }} />
                <Bar dataKey="current_stock" name="Stock" fill="var(--color-accent)" radius={[0,6,6,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {tab === 'hmis' && <GovernmentReportsTab />}
    </div>
  )
}

function ReportStat({ label, value, color }) {
  return (
    <div className="report-stat-item">
      <span className="report-stat-label">{label}</span>
      <span className="report-stat-value" style={color ? { color } : {}}>{value}</span>
    </div>
  )
}
