import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { turso } from '@/lib/turso'

export function AdminNewUserPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    avatar: '',
    role: 'user',
    expires_at: '',
    max_sessions: 2,
    can_watch_movies: true,
    can_watch_series: true,
    can_download: false,
    can_use_favorites: true,
    can_use_watchlist: true,
    vip_access: false,
  })
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.name || !form.email || !form.password) {
      setError('Preencha nome, email e senha.')
      return
    }

    const { default: bcrypt } = await import('bcryptjs')
    const hash = bcrypt.hashSync(form.password, 10)
    try {
      const rs = await turso.execute({
        sql: 'INSERT INTO users (name, email, password_hash, role, expires_at, max_sessions) VALUES (?, ?, ?, ?, ?, ?) RETURNING id',
        args: [form.name, form.email, hash, form.role, form.expires_at || null, form.max_sessions],
      })

      const userId = (rs.rows[0] as any).id as string

      await turso.execute({
        sql: `INSERT INTO permissions (user_id, can_watch_movies, can_watch_series, can_download, can_use_favorites, can_use_watchlist, vip_access)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [
          userId,
          form.can_watch_movies ? 1 : 0,
          form.can_watch_series ? 1 : 0,
          form.can_download ? 1 : 0,
          form.can_use_favorites ? 1 : 0,
          form.can_use_watchlist ? 1 : 0,
          form.vip_access ? 1 : 0,
        ],
      })

      navigate('/admin/users')
    } catch (err) {
      setError('Erro ao criar usuário. Email pode já existir.')
    }
  }

  const update = (field: string, value: any) => setForm(f => ({ ...f, [field]: value }))

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Novo Usuário</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className="text-[#bbb] text-xs mb-2 block">Nome</label>
          <input value={form.name} onChange={e => update('name', e.target.value)} placeholder="Nome" className="w-full h-[52px] rounded-full bg-[#151515] border-none outline-none px-6 text-white text-sm" />
        </div>
        <div>
          <label className="text-[#bbb] text-xs mb-2 block">Email</label>
          <input type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="Email" className="w-full h-[52px] rounded-full bg-[#151515] border-none outline-none px-6 text-white text-sm" />
        </div>
        <div>
          <label className="text-[#bbb] text-xs mb-2 block">Senha</label>
          <input type="password" value={form.password} onChange={e => update('password', e.target.value)} placeholder="Senha" className="w-full h-[52px] rounded-full bg-[#151515] border-none outline-none px-6 text-white text-sm" />
        </div>
        <div>
          <label className="text-[#bbb] text-xs mb-2 block">Data de Expiração (opcional)</label>
          <input type="date" value={form.expires_at} onChange={e => update('expires_at', e.target.value)} className="w-full h-[52px] rounded-full bg-[#151515] border-none outline-none px-6 text-white text-sm" />
        </div>
        <div>
          <label className="text-[#bbb] text-xs mb-2 block">Limite de Sessões (0 = ilimitado)</label>
          <input type="number" min="0" value={form.max_sessions} onChange={e => update('max_sessions', parseInt(e.target.value) || 0)} className="w-full h-[52px] rounded-full bg-[#151515] border-none outline-none px-6 text-white text-sm" />
        </div>
        <div>
          <label className="text-[#bbb] text-xs mb-2 block">Tipo</label>
          <select value={form.role} onChange={e => update('role', e.target.value)} className="w-full h-[52px] rounded-full bg-[#151515] border-none outline-none px-6 text-white text-sm">
            <option value="user">Usuário</option>
            <option value="admin">Administrador</option>
          </select>
        </div>

        <div>
          <h3 className="text-white text-sm font-medium mb-3">Permissões</h3>
          <div className="flex flex-col gap-3">
            {[
              ['can_watch_movies', 'Assistir Filmes'],
              ['can_watch_series', 'Assistir Séries'],
              ['can_download', 'Downloads'],
              ['can_use_favorites', 'Favoritos'],
              ['can_use_watchlist', 'Minha Lista'],
              ['vip_access', 'Acesso VIP'],
            ].map(([key, label]) => (
              <label key={key} className="flex items-center gap-3 text-sm text-[#d0d0d0] cursor-pointer">
                <input
                  type="checkbox"
                  checked={(form as any)[key]}
                  onChange={e => update(key, e.target.checked)}
                  className="w-4 h-4 rounded bg-[#151515] border-[#333]"
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        {error && <p className="text-red-400 text-xs">{error}</p>}

        <button type="submit" className="w-full h-[52px] rounded-full bg-white text-black font-semibold cursor-pointer text-sm">
          Criar Usuário
        </button>
      </form>
    </div>
  )
}
