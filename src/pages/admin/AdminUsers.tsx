import { useEffect, useState, useCallback } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { turso } from '@/lib/turso'

interface UserRow {
  id: string
  name: string
  email: string
  role: string
  status: string
  expires_at: string | null
  max_sessions: number
  created_at: string
}

function calcDays(expiresAt: string | null) {
  if (!expiresAt) return null
  const diff = new Date(expiresAt.replace(' ', 'T')).getTime() - Date.now()
  return Math.ceil(diff / 86400000)
}

export function AdminUsersPage() {
  const location = useLocation()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchUsers = async () => {
    setLoading(true)
    const rs = await turso.execute({
      sql: `SELECT u.id, u.name, u.email, u.role, u.status, u.expires_at, u.max_sessions, u.created_at,
        (SELECT COUNT(*) FROM user_sessions WHERE user_id = u.id) AS active_sessions
        FROM users u ORDER BY u.created_at DESC`,
      args: [],
    })
    setUsers(rs.rows as any[])
    setLoading(false)
  }

  useEffect(() => { fetchUsers() }, [location.key])

  if (loading) return <p className="text-[#777]">Carregando...</p>

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Gerenciar Usuários</h1>
        <Link
          to="/admin/users/new"
          className="px-6 py-3 rounded-full bg-white text-black font-semibold no-underline text-sm"
        >
          + Novo Usuário
        </Link>
      </div>

      <div className="flex flex-col gap-3">
        {users.map(u => {
          const days = calcDays(u.expires_at)
          return (
            <div key={u.id} className="bg-[#111] rounded-[18px] p-5 max-md:flex-col max-md:items-stretch max-md:gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white text-base font-medium">{u.name}</h3>
                  <p className="text-[#999] text-xs">{u.email}</p>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <span className={`text-xs px-3 py-1 rounded-full ${
                      u.status === 'active' ? 'bg-green-900/50 text-green-400' :
                      u.status === 'expired' ? 'bg-yellow-900/50 text-yellow-400' :
                      u.status === 'suspended' ? 'bg-orange-900/50 text-orange-400' :
                      'bg-red-900/50 text-red-400'
                    }`}>
                      {u.status}
                    </span>
                    <span className="text-xs px-3 py-1 rounded-full bg-[#222] text-[#999]">{u.role}</span>
                    {days !== null && (
                      <span className={`text-xs px-3 py-1 rounded-full ${
                        days <= 0 ? 'bg-red-900/50 text-red-400' :
                        days <= 7 ? 'bg-yellow-900/50 text-yellow-400' :
                        'bg-blue-900/50 text-blue-400'
                      }`}>
                        {days <= 0 ? 'Vencido' : `${days} dias`}
                      </span>
                    )}
                    {u.max_sessions !== undefined && (
                      <span className="text-xs px-3 py-1 rounded-full bg-purple-900/30 text-purple-400">
                        {(u as any).active_sessions}/{u.max_sessions} sessões
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Link to={`/admin/users/${u.id}/edit`} className="inline-flex items-center px-4 py-2 rounded-full bg-cyan-900/30 text-cyan-400 text-xs no-underline cursor-pointer hover:bg-cyan-900/50 transition-colors">Editar</Link>
                </div>
              </div>
            </div>
          )
        })}
        {users.length === 0 && (
          <p className="text-[#777]">Nenhum usuário encontrado.</p>
        )}
      </div>
    </div>
  )
}