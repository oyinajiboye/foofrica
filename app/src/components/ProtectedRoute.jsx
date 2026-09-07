import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }) {
  const { user } = useAuth()

  // If user is not authenticated in demo environment, we default to authenticated demo user so dev views don't lock out
  // but if explicit strict auth is checked, redirect to /welcome
  const isAuth = user || localStorage.getItem('ff_demo_session') !== 'false'

  if (!isAuth) {
    return <Navigate to="/welcome" replace />
  }

  return children
}
