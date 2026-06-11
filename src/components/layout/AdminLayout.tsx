import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { Navigate } from 'react-router-dom'

const adminLinks = [
  { to: '/admin', label: 'Dashboard', icon: '📊' },
  { to: '/admin/users', label: 'Usuários', icon: '👥' },
  { to: '/admin/users/new', label: 'Novo Usuário', icon: '➕' },
]

export function AdminLayout() {
  const { user } = useAuthStore()
  const location = useLocation()

  if (!user || user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="min-h-screen bg-[#050505]">
      <div className="flex">
        <aside className="w-[250px] min-h-screen bg-[#0a0a0a] border-r border-[rgba(255,255,255,.05)] p-6 fixed left-0 top-0">
          <Link to="/admin" className="text-[28px] font-extrabold tracking-[2px] text-white no-underline block mb-10">
            COLT CINE
          </Link>
          <nav className="flex flex-col gap-2">
            {adminLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm no-underline transition-all duration-300 ${
                  location.pathname === link.to
                    ? 'bg-white text-black'
                    : 'text-[#d0d0d0] hover:bg-[#151515] hover:text-white'
                }`}
              >
                <span>{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="absolute bottom-6 left-6 right-6">
            <Link
              to="/dashboard"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm no-underline text-[#d0d0d0] hover:bg-[#151515] hover:text-white transition-all duration-300"
            >
              ← Voltar ao Site
            </Link>
          </div>
        </aside>
        <div className="ml-[250px] flex-1 p-8">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
