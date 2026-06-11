import { useEffect, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

interface Props {
  children: ReactNode
  requireAdmin?: boolean
}

export function ProtectedRoute({ children, requireAdmin }: Props) {
  const { isAuthenticated, user, checkAuth } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true })
    } else if (requireAdmin && user?.role !== 'admin') {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, user, requireAdmin, navigate])

  if (!isAuthenticated) return null
  if (requireAdmin && user?.role !== 'admin') return null

  return <>{children}</>
}
