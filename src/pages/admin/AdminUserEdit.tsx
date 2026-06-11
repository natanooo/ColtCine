import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { turso } from '@/lib/turso'
import { AvatarPicker } from '@/components/shared/AvatarPicker'

interface UserData {
  id: string
  name: string
  email: string
  avatar: string
  role: string
  status: string
  expires_at: string | null
  max_sessions: number
}

interface PermData {
  can_watch_movies: number
  can_watch_series: number
  can_download: number
  can_use_favorites: number
  can_use_watchlist: number
  vip_access: number
}

const DEFAULT_PERMS: PermData = {
  can_watch_movies: 1,
  can_watch_series: 1,
  can_download: 0,
  can_use_favorites: 1,
  can_use_watchlist: 1,
  vip_access: 0,
}

function calcDays(expiresAt: string | null) {
  if (!expiresAt) return null
  const diff = new Date(expiresAt.replace(' ', 'T')).getTime() - Date.now()
  return Math.ceil(diff / 86400000)
}

export function AdminUserEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [user, setUser] = useState<UserData | null>(null)
  const [perms, setPerms] = useState<PermData>(DEFAULT_PERMS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formPassword, setFormPassword] = useState('')
  const [formExpires, setFormExpires] = useState('')
  const [formRole, setFormRole] = useState('user')
  const [formMaxSessions, setFormMaxSessions] = useState(2)
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)

  useEffect(() => {
    if (!id) return
    ;(async () => {
      const [userRs, permRs] = await Promise.all([
        turso.execute({
          sql: 'SELECT id, name, email, avatar, role, status, expires_at, max_sessions FROM users WHERE id = ?',
          args: [id],
        }),
        turso.execute({
          sql: 'SELECT * FROM permissions WHERE user_id = ?',
          args: [id],
        }),
      ])

      if (userRs.rows.length === 0) {
        navigate('/admin/users')
        return
      }

      const u = userRs.rows[0] as unknown as UserData
      setUser(u)
      setFormName(u.name)
      setFormEmail(u.email)
      setFormRole(u.role)
      setFormMaxSessions(u.max_sessions ?? 2)
      if (u.expires_at) {
        setFormExpires(u.expires_at.split(' ')[0])
      }

      if (permRs.rows.length > 0) {
        const p = permRs.rows[0] as unknown as PermData
        setPerms({
          can_watch_movies: Number(p.can_watch_movies),
          can_watch_series: Number(p.can_watch_series),
          can_download: Number(p.can_download),
          can_use_favorites: Number(p.can_use_favorites),
          can_use_watchlist: Number(p.can_use_watchlist),
          vip_access: Number(p.vip_access),
        })
      }

      setLoading(false)
    })()
  }, [id, navigate])

  const handleAction = async (action: string) => {
    if (!id) return
    const actions: Record<string, string> = {
      renew: "UPDATE users SET status = 'active', expires_at = datetime('now', '+30 days'), updated_at = datetime('now') WHERE id = ?",
      suspend: "UPDATE users SET status = 'suspended', updated_at = datetime('now') WHERE id = ?",
      block: "UPDATE users SET status = 'blocked', updated_at = datetime('now') WHERE id = ?",
      unblock: "UPDATE users SET status = 'active', updated_at = datetime('now') WHERE id = ?",
      delete: 'DELETE FROM users WHERE id = ?',
      toggleRole: "UPDATE users SET role = CASE WHEN role = 'admin' THEN 'user' ELSE 'admin' END, updated_at = datetime('now') WHERE id = ?",
    }
    if (action === 'delete' && !confirm('Excluir usuário?')) return
    const sql = actions[action]
    if (!sql) return
    await turso.execute({ sql, args: [id] })

    if (action === 'delete') {
      navigate('/admin/users')
      return
    }

    const rs = await turso.execute({
      sql: 'SELECT id, name, email, avatar, role, status, expires_at, max_sessions FROM users WHERE id = ?',
      args: [id],
    })
    if (rs.rows.length > 0) {
      const u = rs.rows[0] as unknown as UserData
      setUser(u)
      setFormRole(u.role)
      setFormMaxSessions(u.max_sessions ?? 2)
      if (u.expires_at) setFormExpires(u.expires_at.split(' ')[0])
    }
  }

  const setUserDays = async () => {
    if (!id) return
    const days = parseInt(prompt('Dias:') || '')
    if (isNaN(days) || days < 0) return
    await turso.execute({
      sql: "UPDATE users SET status = 'active', expires_at = datetime('now', ?), updated_at = datetime('now') WHERE id = ?",
      args: [`+${days} days`, id],
    })
    const rs = await turso.execute({
      sql: 'SELECT id, name, email, avatar, role, status, expires_at, max_sessions FROM users WHERE id = ?',
      args: [id],
    })
    if (rs.rows.length > 0) {
      const u = rs.rows[0] as unknown as UserData
      setUser(u)
      if (u.expires_at) setFormExpires(u.expires_at.split(' ')[0])
    }
  }

  const togglePerm = async (field: keyof PermData) => {
    if (!id || !user) return
    const newVal = perms[field] ? 0 : 1
    await turso.execute({
      sql: `UPDATE permissions SET ${String(field)} = ? WHERE user_id = ?`,
      args: [newVal, id],
    })
    setPerms(prev => ({ ...prev, [field]: newVal }))
  }

  const handleAvatarChange = async (url: string) => {
    if (!id) return
    await turso.execute({
      sql: "UPDATE users SET avatar = ?, updated_at = datetime('now') WHERE id = ?",
      args: [url, id],
    })
    setUser(prev => prev ? { ...prev, avatar: url } : prev)
    setShowAvatarPicker(false)
  }

  const handleSave = async () => {
    if (!id) return
    setSaving(true)
    try {
      const updates: string[] = []
      const vals: (string | number)[] = []

      if (formName !== user?.name) {
        updates.push('name = ?')
        vals.push(formName)
      }
      if (formEmail !== user?.email) {
        updates.push('email = ?')
        vals.push(formEmail)
      }
      if (formPassword) {
        const { default: bcrypt } = await import('bcryptjs')
        const hash = bcrypt.hashSync(formPassword, 10)
        updates.push('password_hash = ?')
        vals.push(hash)
      }
      if (formRole !== user?.role) {
        updates.push('role = ?')
        vals.push(formRole)
      }
      if (formExpires) {
        updates.push('expires_at = ?')
        vals.push(`${formExpires} 23:59:59`)
      }
      if (formMaxSessions !== user?.max_sessions) {
        updates.push('max_sessions = ?')
        vals.push(formMaxSessions)
      }

      if (updates.length > 0) {
        updates.push("updated_at = datetime('now')")
        vals.push(id)
        await turso.execute({
          sql: `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
          args: vals,
        })
      }

      const rs = await turso.execute({
        sql: 'SELECT id, name, email, avatar, role, status, expires_at, max_sessions FROM users WHERE id = ?',
        args: [id],
      })
      if (rs.rows.length > 0) {
        const u = rs.rows[0] as unknown as UserData
        setUser(u)
        setFormPassword('')
      }
    } catch (error) {
      console.error('[save] Error:', error)
      alert('Erro ao salvar. Verifique o console.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-[#777]">Carregando...</p>
      </div>
    )
  }

  if (!user) return null

  const days = calcDays(user.expires_at)

  return (
    <div className="max-w-[1400px] mx-auto">
      {showAvatarPicker && (
        <AvatarPicker
          selected={user.avatar}
          onSelect={handleAvatarChange}
          onClose={() => setShowAvatarPicker(false)}
        />
      )}

      <div className="bg-[#111] border border-[#1d1d1d] rounded-3xl p-[30px] flex items-center gap-6 max-md:flex-col max-md:items-start mb-6">
        <div className="w-[90px] h-[90px] rounded-full overflow-hidden flex-shrink-0 bg-[#222] relative group cursor-pointer" onClick={() => setShowAvatarPicker(true)}>
          {user.avatar ? (
            <img src={user.avatar} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl text-[#555]">
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-medium rounded-full">Alterar</div>
        </div>

        <div className="flex-1">
          <h1 className="text-[28px] font-bold mb-2">{user.name}</h1>
          <p className="text-[#8f8f8f] mb-4">{user.email}</p>
          <div className="flex gap-2.5 flex-wrap">
            <span className={`text-xs px-3.5 py-2 rounded-full ${
              user.status === 'active' ? 'bg-green-900/50 text-green-400' :
              user.status === 'expired' ? 'bg-yellow-900/50 text-yellow-400' :
              user.status === 'suspended' ? 'bg-orange-900/50 text-orange-400' :
              'bg-red-900/50 text-red-400'
            }`}>
              {user.status}
            </span>
            <span className="text-xs px-3.5 py-2 rounded-full bg-[#1a1a1a] border border-[#242424] text-[#cfcfcf]">
              {user.role === 'admin' ? 'Administrador' : 'Usuário'}
            </span>
            {days !== null && (
              <span className={`text-xs px-3.5 py-2 rounded-full border ${
                days <= 0 ? 'bg-red-900/30 text-red-400 border-[#3d1c1c]' :
                days <= 7 ? 'bg-yellow-900/30 text-yellow-400 border-[#3d3d1c]' :
                'bg-blue-900/30 text-blue-400 border-[#1c2d3d]'
              }`}>
                {days <= 0 ? 'Vencido' : `Expira em ${days} dias`}
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-2.5 flex-wrap">
          <button onClick={() => handleAction('renew')} className="h-[42px] px-[18px] rounded-full border border-[#252525] bg-[#181818] text-white cursor-pointer transition-colors hover:bg-[#202020] font-semibold bg-white text-black border-none">
            Renovar
          </button>
          <button onClick={setUserDays} className="h-[42px] px-[18px] rounded-full border border-[#252525] bg-[#181818] text-white cursor-pointer transition-colors hover:bg-[#202020]">
            Editar Dias
          </button>
          <button onClick={() => handleAction('toggleRole')} className="h-[42px] px-[18px] rounded-full border border-[#252525] bg-[#181818] text-white cursor-pointer transition-colors hover:bg-[#202020]">
            {user.role === 'admin' ? 'Remover Admin' : 'Tornar Admin'}
          </button>
          <button onClick={() => handleAction('suspend')} className="h-[42px] px-[18px] rounded-full border border-[#252525] bg-[#181818] text-white cursor-pointer transition-colors hover:bg-[#202020]">
            Suspender
          </button>
          <button onClick={() => handleAction('block')} className="h-[42px] px-[18px] rounded-full border border-[#252525] bg-[#181818] text-white cursor-pointer transition-colors hover:bg-[#202020]">
            Bloquear
          </button>
          <button onClick={() => handleAction('unblock')} className="h-[42px] px-[18px] rounded-full border border-[#252525] bg-[#181818] text-white cursor-pointer transition-colors hover:bg-[#202020]">
            Desbloquear
          </button>
          <button onClick={() => handleAction('delete')} className="h-[42px] px-[18px] rounded-full border border-[#3d1c1c] bg-[#181818] text-[#ff8b8b] cursor-pointer transition-colors hover:bg-[#202020]">
            Excluir
          </button>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_400px] gap-6 max-xl:grid-cols-1">
        <div className="bg-[#111] border border-[#1d1d1d] rounded-3xl p-[30px]">
          <h2 className="text-[22px] mb-6">Dados da Conta</h2>

          <div className="grid grid-cols-2 gap-5 max-md:grid-cols-1">
            <div className="flex flex-col">
              <label className="mb-2 text-[#9f9f9f] text-sm">Nome</label>
              <input
                type="text"
                value={formName}
                onChange={e => setFormName(e.target.value)}
                className="h-[54px] border-none outline-none rounded-[14px] bg-[#1a1a1a] text-white px-4 border border-[#242424] focus:border-[#3a3a3a]"
              />
            </div>

            <div className="flex flex-col">
              <label className="mb-2 text-[#9f9f9f] text-sm">Email</label>
              <input
                type="email"
                value={formEmail}
                onChange={e => setFormEmail(e.target.value)}
                className="h-[54px] border-none outline-none rounded-[14px] bg-[#1a1a1a] text-white px-4 border border-[#242424] focus:border-[#3a3a3a]"
              />
            </div>

            <div className="flex flex-col">
              <label className="mb-2 text-[#9f9f9f] text-sm">Senha</label>
              <input
                type="password"
                value={formPassword}
                onChange={e => setFormPassword(e.target.value)}
                placeholder="Digite uma nova senha"
                className="h-[54px] border-none outline-none rounded-[14px] bg-[#1a1a1a] text-white px-4 border border-[#242424] focus:border-[#3a3a3a]"
              />
            </div>

            <div className="flex flex-col">
              <label className="mb-2 text-[#9f9f9f] text-sm">Data de Expiração</label>
              <input
                type="date"
                value={formExpires}
                onChange={e => setFormExpires(e.target.value)}
                className="h-[54px] border-none outline-none rounded-[14px] bg-[#1a1a1a] text-white px-4 border border-[#242424] focus:border-[#3a3a3a]"
              />
            </div>

            <div className="flex flex-col">
              <label className="mb-2 text-[#9f9f9f] text-sm">Limite de Sessões (0 = ilimitado)</label>
              <input
                type="number"
                min="0"
                value={formMaxSessions}
                onChange={e => setFormMaxSessions(parseInt(e.target.value) || 0)}
                className="h-[54px] border-none outline-none rounded-[14px] bg-[#1a1a1a] text-white px-4 border border-[#242424] focus:border-[#3a3a3a]"
              />
            </div>
            <div className="flex flex-col">
              <label className="mb-2 text-[#9f9f9f] text-sm">Tipo</label>
              <select
                value={formRole}
                onChange={e => setFormRole(e.target.value)}
                className="h-[54px] border-none outline-none rounded-[14px] bg-[#1a1a1a] text-white px-4 border border-[#242424] focus:border-[#3a3a3a]"
              >
                <option value="user">Usuário</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-[#111] border border-[#1d1d1d] rounded-3xl p-[30px]">
          <h2 className="text-[22px] mb-6">Permissões</h2>

          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-3 p-4 rounded-[14px] bg-[#181818] border border-[#232323] cursor-pointer hover:bg-[#1d1d1d] transition-colors">
              <input
                type="checkbox"
                checked={!!perms.can_watch_movies}
                onChange={() => togglePerm('can_watch_movies')}
                className="w-[18px] h-[18px] accent-white"
              />
              <span className="text-sm text-[#d0d0d0]">Assistir Filmes</span>
            </label>

            <label className="flex items-center gap-3 p-4 rounded-[14px] bg-[#181818] border border-[#232323] cursor-pointer hover:bg-[#1d1d1d] transition-colors">
              <input
                type="checkbox"
                checked={!!perms.can_watch_series}
                onChange={() => togglePerm('can_watch_series')}
                className="w-[18px] h-[18px] accent-white"
              />
              <span className="text-sm text-[#d0d0d0]">Assistir Séries</span>
            </label>

            <label className="flex items-center gap-3 p-4 rounded-[14px] bg-[#181818] border border-[#232323] cursor-pointer hover:bg-[#1d1d1d] transition-colors">
              <input
                type="checkbox"
                checked={!!perms.can_download}
                onChange={() => togglePerm('can_download')}
                className="w-[18px] h-[18px] accent-white"
              />
              <span className="text-sm text-[#d0d0d0]">Downloads</span>
            </label>

            <label className="flex items-center gap-3 p-4 rounded-[14px] bg-[#181818] border border-[#232323] cursor-pointer hover:bg-[#1d1d1d] transition-colors">
              <input
                type="checkbox"
                checked={!!perms.can_use_favorites}
                onChange={() => togglePerm('can_use_favorites')}
                className="w-[18px] h-[18px] accent-white"
              />
              <span className="text-sm text-[#d0d0d0]">Favoritos</span>
            </label>

            <label className="flex items-center gap-3 p-4 rounded-[14px] bg-[#181818] border border-[#232323] cursor-pointer hover:bg-[#1d1d1d] transition-colors">
              <input
                type="checkbox"
                checked={!!perms.can_use_watchlist}
                onChange={() => togglePerm('can_use_watchlist')}
                className="w-[18px] h-[18px] accent-white"
              />
              <span className="text-sm text-[#d0d0d0]">Minha Lista</span>
            </label>

            <label className="flex items-center gap-3 p-4 rounded-[14px] bg-[#181818] border border-[#232323] cursor-pointer hover:bg-[#1d1d1d] transition-colors">
              <input
                type="checkbox"
                checked={!!perms.vip_access}
                onChange={() => togglePerm('vip_access')}
                className="w-[18px] h-[18px] accent-white"
              />
              <span className="text-sm text-[#d0d0d0]">Acesso VIP</span>
            </label>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <Link
          to="/admin/users"
          className="h-[52px] px-6 rounded-full border border-[#252525] bg-[#1a1a1a] text-white no-underline flex items-center cursor-pointer transition-colors hover:bg-[#222]"
        >
          Cancelar
        </Link>
        <button
          onClick={handleSave}
          disabled={saving}
          className="h-[52px] px-[30px] rounded-full bg-white text-black font-bold border-none cursor-pointer disabled:opacity-50 transition-opacity"
        >
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>
    </div>
  )
}
