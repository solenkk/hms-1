import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Sidebar from './components/Sidebar'
import Header from './components/Header'

// Pages
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Patients from './pages/Patients'
import PatientDetail from './pages/PatientDetail'
import Visits from './pages/Visits'
import Lab from './pages/Lab'
import Pharmacy from './pages/Pharmacy'
import Billing from './pages/Billing'
import Beds from './pages/Beds'
import Reports from './pages/Reports'
import Admin from './pages/Admin'

function Layout() {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Header />
        <Outlet />
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Secure Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="patients" element={<Patients />} />
            <Route path="patients/:id" element={<PatientDetail />} />
            <Route path="visits" element={<Visits />} />
            
            {/* EMR route mapped to list-like EMR view, or just redirect to Patient Profile EMR tab */}
            <Route path="emr" element={<Patients />} />

            <Route path="lab" element={<Lab />} />
            <Route path="pharmacy" element={<Pharmacy />} />
            
            <Route
              path="billing"
              element={
                <ProtectedRoute roles={['admin', 'cashier', 'receptionist']}>
                  <Billing />
                </ProtectedRoute>
              }
            />
            
            <Route path="beds" element={<Beds />} />
            
            <Route
              path="reports"
              element={
                <ProtectedRoute roles={['admin', 'doctor']}>
                  <Reports />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="admin"
              element={
                <ProtectedRoute roles={['admin']}>
                  <Admin />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </Router>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
            fontSize: '0.88rem',
            borderRadius: 'var(--radius-md)',
          },
        }}
      />
    </AuthProvider>
  )
}
