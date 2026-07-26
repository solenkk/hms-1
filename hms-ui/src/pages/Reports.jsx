import { useState, useEffect } from 'react'
import { reportsApi } from '../api'
import { useAuth } from '../context/AuthContext'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { BarChart3 } from 'lucide-react'
import toast from 'react-hot-toast'
import './Reports.css'

const COLORS = ['#3b9eff','#2ec98c','#f8a722','#e05c5c','#a78bfa','#34d399']
const PERIODS = ['today', 'week', 'month', 'year']

export default function Reports() {
  const { user } = useAuth()
  const role = user?.role || ''
  const [tab, setTab]           = useState('dashboard')
  const [period, setPeriod]     = useState('month')
  const [data, setData]         = useState(null)
  const [diagnoses, setDiagnoses] = useState([])
  const [stock, setStock]       = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    setLoading(true)
    // Fetch each API independently so one 403 doesn't break everything
    const dashPromise = reportsApi.dashboard().then(r => r.data).catch(() => null)
    const diagPromise = ['admin','doctor'].includes(role)
      ? reportsApi.diagnoses().then(r => r.data).catch(() => [])
      : Promise.resolve([])
    const stockPromise = ['admin','pharmacist'].includes(role)
      ? reportsApi.drugStock().then(r => r.data?.slice(0, 10)).catch(() => [])
      : Promise.resolve([])

    Promise.all([dashPromise, diagPromise, stockPromise]).then(([d, diag, stk]) => {
      setData(d)
      setDiagnoses(diag || [])
      setStock(stk || [])
    }).finally(() => setLoading(false))
  }, [role])

  if (loading) return <div className="page-body"><div className="loading-center"><div className="spinner" /></div></div>

  const visits = data?.visits || {}
  const visitTypeData = Object.entries({
    OPD: visits.total_opd ?? 0,
    IPD: visits.total_ipd ?? 0,
    Emergency: visits.total_emergency ?? 0,
  }).map(([name, value]) => ({ name, value }))

  const tabs = [
    { key: 'dashboard', label: 'Dashboard', show: true },
    { key: 'diagnoses', label: 'Diagnoses', show: ['admin','doctor'].includes(role) },
    { key: 'stock',     label: 'Drug Stock', show: ['admin','pharmacist'].includes(role) },
  ].filter(t => t.show)

  return (
    <div className="page-body">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Reports</h1>
          <p>Analytics, statistics, and compliance reports</p>
        </div>
        <div className="tabs">
          {PERIODS.map(p => (
            <button key={p} className={`tab-btn ${period === p ? 'active' : ''}`} onClick={() => setPeriod(p)}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="tabs" style={{ marginBottom: '1.5rem' }}>
        {tabs.map(t => (
          <button key={t.key} className={`tab-btn ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
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
              <ReportStat label="Total Visits" value={visits.total ?? 0} />
              <ReportStat label="Open Visits" value={visits.open ?? 0} color="var(--color-accent)" />
              <ReportStat label="Closed Visits" value={visits.closed ?? 0} />
              {['admin','cashier','receptionist'].includes(role) && (
                <ReportStat label="Revenue (ETB)" value={(data?.revenue_etb ?? 0).toLocaleString()} color="var(--color-warning)" />
              )}
              <ReportStat label="Pending Labs" value={data?.alerts?.pending_lab_orders ?? 0} color="hsl(270,65%,58%)" />
              <ReportStat label="Beds Total" value={data?.beds?.total ?? 0} />
              <ReportStat label="Beds Occupied" value={data?.beds?.occupied ?? 0} color="var(--color-danger)" />
            </div>
          </div>
        </div>
      )}

      {tab === 'diagnoses' && (
        <div className="card">
          <div className="card-header"><h3>Top Diagnoses</h3></div>
          {diagnoses.length === 0 ? (
            <div className="empty-state"><BarChart3 size={48}/><p style={{marginTop:'0.5rem'}}>No diagnoses recorded yet</p></div>
          ) : (
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={diagnoses} layout="vertical" barSize={20}>
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
          {!stock || stock.length === 0 ? (
            <div className="empty-state"><BarChart3 size={48}/><p style={{marginTop:'0.5rem'}}>No stock data</p></div>
          ) : (
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={stock} layout="vertical" barSize={20}>
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
