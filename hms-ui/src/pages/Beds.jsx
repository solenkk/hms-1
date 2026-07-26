import { useState, useEffect } from 'react'
import { bedsApi } from '../api'
import { BedDouble, Plus } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Beds() {
  const [wards, setWards]   = useState([])
  const [beds, setBeds]     = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedWard, setSelectedWard] = useState(null)

  useEffect(() => {
    bedsApi.wards()
      .then(r => { setWards(r.data); if (r.data.length > 0) setSelectedWard(r.data[0].id) })
      .catch(() => toast.error('Failed to load wards'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedWard) return
    bedsApi.beds({ ward_id: selectedWard })
      .then(r => setBeds(r.data))
      .catch(() => {})
  }, [selectedWard])

  const statusColor = (s) => ({
    available: 'badge-green', occupied: 'badge-red', maintenance: 'badge-orange'
  }[s] || 'badge-gray')

  const totalBeds = beds.length
  const available = beds.filter(b => b.status === 'available').length
  const occupied  = beds.filter(b => b.status === 'occupied').length

  return (
    <div className="page-body">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Beds & Wards</h1>
          <p>Ward management, admissions, and discharges</p>
        </div>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : (
        <>
          {/* Ward Summary */}
          <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
            <div className="stat-card">
              <div className="stat-icon" style={{ background:'var(--color-primary)20', color:'var(--color-primary)' }}>
                <BedDouble size={20} />
              </div>
              <div className="stat-value">{totalBeds}</div>
              <div className="stat-label">Total Beds</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background:'var(--color-accent)20', color:'var(--color-accent)' }}>
                <BedDouble size={20} />
              </div>
              <div className="stat-value" style={{ color:'var(--color-accent)' }}>{available}</div>
              <div className="stat-label">Available</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background:'var(--color-danger)20', color:'var(--color-danger)' }}>
                <BedDouble size={20} />
              </div>
              <div className="stat-value" style={{ color:'var(--color-danger)' }}>{occupied}</div>
              <div className="stat-label">Occupied</div>
            </div>
          </div>

          {/* Ward Selector */}
          <div className="tabs" style={{ marginBottom: '1rem' }}>
            {wards.map(w => (
              <button
                key={w.id}
                className={`tab-btn ${selectedWard === w.id ? 'active' : ''}`}
                onClick={() => setSelectedWard(w.id)}
              >
                {w.name_en}
              </button>
            ))}
          </div>

          {/* Bed Grid */}
          <div className="bed-grid">
            {beds.map(bed => (
              <div key={bed.id} className={`bed-cell ${bed.status}`}>
                <div className="bed-cell-number">{bed.bed_number}</div>
                <BedDouble size={22} />
                <div className="bed-cell-type">{bed.bed_type}</div>
                <span className={`badge ${statusColor(bed.status)}`}>{bed.status}</span>
                {bed.status === 'occupied' && bed.current_admission_id && (
                  <div className="bed-cell-patient">Admission #{bed.current_admission_id?.slice(0,6)}</div>
                )}
              </div>
            ))}
            {beds.length === 0 && (
              <div className="empty-state" style={{ gridColumn:'1/-1' }}>
                <BedDouble size={48}/>
                <p style={{marginTop:'0.5rem'}}>No beds in this ward</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
