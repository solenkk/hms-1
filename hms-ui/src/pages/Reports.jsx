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
  const [dashData, setDashData] = useState(null)
  const [visitsData, setVisitsData] = useState(null)
  const [revenueData, setRevenueData] = useState(null)
  const [diagnoses, setDiagnoses] = useState([])
  const [stock, setStock]       = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    setLoading(true)
    
    // Fetch general dashboard statistics (accessible by clinical roles)
    const dashPromise = reportsApi.dashboard()
      .then(r => r.data)
      .catch(() => null)
      
    // Fetch visits report (accessible by admin, doctor, receptionist)
    const visitsPromise = ['admin', 'doctor', 'receptionist'].includes(role)
      ? reportsApi.visits(period).then(r => r.data).catch(() => null)
      : Promise.resolve(null)

    // Fetch revenue report (accessible by admin, cashier, receptionist)
    const revenuePromise = ['admin', 'cashier', 'receptionist'].includes(role)
      ? reportsApi.revenue(period).then(r => r.data).catch(() => null)
      : Promise.resolve(null)

    // Fetch diagnoses report (accessible by admin, doctor)
    const diagPromise = ['admin','doctor'].includes(role)
      ? reportsApi.diagnoses().then(r => r.data).catch(() => [])
      : Promise.resolve([])

    // Fetch drug stock report (accessible by admin, pharmacist)
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

  // Calculate visit type distribution from visits report breakdown
  const breakdown = visitsData?.breakdown || {}
  const getTypeCount = (typeKey) => {
    const typeData = breakdown[typeKey] || breakdown[typeKey.toLowerCase()] || breakdown[typeKey.toUpperCase()] || {}
    return Object.values(typeData).reduce((sum, count) => sum + count, 0)
  }

  const visitTypeData = [
    { name: 'OPD', value: getTypeCount('opd') },
    { name: 'IPD', value: getTypeCount('ipd') },
    { name: 'Emergency', value: getTypeCount('emergency') }
  ]

  // Calculate summary stats
  const totalVisits = visitsData?.total ?? 0
  const getStatusCount = (statusKey) => {
    let sum = 0
    Object.values(breakdown).forEach(typeData => {
      sum += typeData[statusKey] || typeData[statusKey.toLowerCase()] || typeData[statusKey.toUpperCase()] || 0
    })
    return sum
  }
  const openVisits = getStatusCount('open')
  const closedVisits = getStatusCount('closed')

  // Calculate total revenue for the selected period
  const totalRevenue = revenueData?.by_payment_method?.reduce((sum, item) => sum + (item.total_etb || 0), 0) ?? 0

  // Standardize diagnoses keys (backend returns 'icd10_code' and 'frequency')
  const mappedDiagnoses = diagnoses.map(d => ({
    diagnosis_code: d.diagnosis_code || d.icd10_code || '',
    count: d.count ?? d.frequency ?? 0
  }))

  // Standardize stock keys (backend returns 'name' and 'current_stock')
  const mappedStock = stock.map(s => ({
    ...s,
    name_generic_en: s.name_generic_en || s.name || ''
  }))

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
              <ReportStat label="Total Visits" value={totalVisits} />
              <ReportStat label="Open Visits" value={openVisits} color="var(--color-accent)" />
              <ReportStat label="Closed Visits" value={closedVisits} />
              {['admin','cashier','receptionist'].includes(role) && (
                <ReportStat label="Revenue (ETB)" value={totalRevenue.toLocaleString()} color="var(--color-warning)" />
              )}
              <ReportStat label="Pending Labs" value={dashData?.alerts?.pending_lab_orders ?? 0} color="hsl(270,65%,58%)" />
              <ReportStat label="Beds Total" value={dashData?.beds?.total ?? 0} />
              <ReportStat label="Beds Occupied" value={dashData?.beds?.occupied ?? 0} color="var(--color-danger)" />
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
