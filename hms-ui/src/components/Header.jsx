import { useLocation } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import './Header.css'

const BREADCRUMBS = {
  '/':          'Dashboard',
  '/patients':  'Patients',
  '/visits':    'Visits',
  '/emr':       'EMR Notes',
  '/lab':       'Laboratory',
  '/pharmacy':  'Pharmacy',
  '/billing':   'Billing',
  '/beds':      'Beds & Wards',
  '/reports':   'Reports',
  '/admin':     'Administration',
}

export default function Header() {
  const { pathname } = useLocation()
  const { user } = useAuth()
  const base = '/' + pathname.split('/')[1]
  const title = BREADCRUMBS[base] || 'HMS'

  return (
    <header className="app-header">
      <div className="header-title">{title}</div>
      <div className="header-right">
        <button className="btn-icon btn-ghost header-bell">
          <Bell size={18} />
        </button>
        <div className="header-user">
          <div className="avatar" style={{ width: 32, height: 32, fontSize: '0.75rem' }}>
            {user?.full_name_en?.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase() || 'US'}
          </div>
          <span className="header-username">{user?.full_name_en || user?.username}</span>
        </div>
      </div>
    </header>
  )
}