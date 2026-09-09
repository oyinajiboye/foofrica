import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, onboarding = false, roles }) {
  const { user, accessToken } = useAuth()
  const location = useLocation()
  if (!accessToken) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (!onboarding && !user?.username) return <Navigate to="/onboard/user-type" replace />
  if (roles && !roles.includes(user?.user_type)) return <Navigate to="/feed" replace />
  return children
}
