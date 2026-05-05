import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import StudentsPage from './pages/StudentsPage'
import CoursesPage from './pages/CoursesPage'
import AttendancePage from './pages/AttendancePage'
import ResultsPage from './pages/ResultsPage'
import StudentProfilePage from './pages/StudentProfilePage'
import StudentResultsPage from './pages/StudentResultsPage'
import NotificationsPage from './pages/NotificationsPage'
import UsersPage from './pages/UsersPage'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh' }}>
      <div className="spin" style={{ width:32, height:32, border:'3px solid var(--border)', borderTopColor:'var(--accent)', borderRadius:'50%' }} />
    </div>
  )
  return user ? children : <Navigate to="/login" replace />
}

function AdminRoute({ children }) {
  const { user } = useAuth()
  return user?.role === 'ADMIN' ? children : <Navigate to="/" replace />
}

function StudentRoute({ children }) {
  const { user } = useAuth()
  return user?.role === 'STUDENT' ? children : <Navigate to="/" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#34d399', secondary: 'var(--bg-card)' } },
            error:   { iconTheme: { primary: '#f87171', secondary: 'var(--bg-card)' } },
          }}
        />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/*" element={
            <PrivateRoute>
              <Layout>
                <Routes>
                  <Route path="/"           element={<DashboardPage />} />
                  <Route path="/students"   element={<StudentsPage />} />
                  <Route path="/courses"    element={<CoursesPage />} />
                  <Route path="/results"    element={<ResultsPage />} />
                  <Route path="/users"      element={<AdminRoute><UsersPage /></AdminRoute>} />
                  <Route path="/attendance" element={<AttendancePage />} />
                  <Route path="/profile"        element={<StudentRoute><StudentProfilePage /></StudentRoute>} />
                  <Route path="/my-results"     element={<StudentRoute><StudentResultsPage /></StudentRoute>} />
                  <Route path="/notifications" element={<StudentRoute><NotificationsPage /></StudentRoute>} />
                </Routes>
              </Layout>
            </PrivateRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
