import { create } from 'zustand'
import type { User, Permission } from '@/types'
import { signToken, verifyToken } from '@/lib/jwt'

interface AuthState {
  user: (Omit<User, 'password_hash'> & { permissions?: Permission }) | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  checkAuth: () => Promise<void>
  setUser: (user: AuthState['user']) => void
}

function getStoredAuth() {
  try {
    const token = localStorage.getItem('coltcine_token')
    const user = localStorage.getItem('coltcine_user')
    const sessionId = localStorage.getItem('coltcine_session')
    if (token && user) {
      return { token, user: JSON.parse(user) as AuthState['user'], sessionId }
    }
  } catch {}
  return null
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: getStoredAuth()?.user ?? null,
  token: getStoredAuth()?.token ?? null,
  isLoading: false,
  isAuthenticated: !!getStoredAuth(),

  login: async (email: string, password: string) => {
    set({ isLoading: true })
    try {
      const { turso } = await import('@/lib/turso')
      const { default: bcrypt } = await import('bcryptjs')

      const rs = await turso.execute({
        sql: 'SELECT * FROM users WHERE email = ?',
        args: [email],
      })

      if (rs.rows.length === 0) {
        set({ isLoading: false })
        return false
      }

      const row = rs.rows[0]
      const valid = bcrypt.compareSync(password, row.password_hash as string)
      if (!valid) {
        set({ isLoading: false })
        return false
      }

      if (row.status === 'suspended' || row.status === 'blocked') {
        set({ isLoading: false })
        return false
      }

      if (row.expires_at) {
        const expires = new Date(row.expires_at as string)
        if (expires < new Date()) {
          await turso.execute({
            sql: "UPDATE users SET status = 'expired' WHERE id = ?",
            args: [row.id],
          })
          set({ isLoading: false })
          return false
        }
      }

      const maxSessions = Number(row.max_sessions ?? 2);
      if (maxSessions > 0) {
        await turso.execute({
          sql: "DELETE FROM user_sessions WHERE last_seen < datetime('now', '-24 hours')",
          args: [],
        })
        const sessionRs = await turso.execute({
          sql: 'SELECT COUNT(*) AS cnt FROM user_sessions WHERE user_id = ?',
          args: [row.id],
        })
        const activeCount = Number(sessionRs.rows[0].cnt)
        if (activeCount >= maxSessions) {
          set({ isLoading: false })
          return false
        }
      }

      const permRs = await turso.execute({
        sql: 'SELECT * FROM permissions WHERE user_id = ?',
        args: [row.id],
      })

      const userObj = {
        id: row.id as string,
        name: row.name as string,
        email: row.email as string,
        avatar: row.avatar as string,
        role: row.role as 'admin' | 'user',
        status: row.status as User['status'],
        expires_at: row.expires_at as string | null,
        max_sessions: maxSessions,
        created_at: row.created_at as string,
        updated_at: row.updated_at as string,
      }

      const permRow = permRs.rows[0] as Record<string, unknown> | undefined
      const permissions: Permission | undefined = permRow
        ? {
            id: permRow.id as string,
            user_id: permRow.user_id as string,
            can_watch_movies: Boolean(permRow.can_watch_movies),
            can_watch_series: Boolean(permRow.can_watch_series),
            can_download: Boolean(permRow.can_download),
            can_use_favorites: Boolean(permRow.can_use_favorites),
            can_use_watchlist: Boolean(permRow.can_use_watchlist),
            vip_access: Boolean(permRow.vip_access),
          }
        : undefined

      const token = await signToken({
        sub: userObj.id,
        role: userObj.role,
        email: userObj.email,
      })

      const sessionId = crypto.randomUUID()
      await turso.execute({
        sql: 'INSERT INTO user_sessions (id, user_id) VALUES (?, ?)',
        args: [sessionId, row.id],
      })

      const userWithPerms = { ...userObj, permissions }
      localStorage.setItem('coltcine_token', token)
      localStorage.setItem('coltcine_user', JSON.stringify(userWithPerms))
      localStorage.setItem('coltcine_session', sessionId)

      set({
        user: userWithPerms,
        token,
        isAuthenticated: true,
        isLoading: false,
      })
      return true
    } catch (error) {
      console.error('Login error:', error)
      set({ isLoading: false })
      return false
    }
  },

  logout: async () => {
    const sessionId = localStorage.getItem('coltcine_session')
    if (sessionId) {
      try {
        const { turso } = await import('@/lib/turso')
        await turso.execute({
          sql: 'DELETE FROM user_sessions WHERE id = ?',
          args: [sessionId],
        })
      } catch {}
    }
    localStorage.removeItem('coltcine_token')
    localStorage.removeItem('coltcine_user')
    localStorage.removeItem('coltcine_session')
    set({ user: null, token: null, isAuthenticated: false })
  },

  checkAuth: async () => {
    const stored = getStoredAuth()
    if (!stored) {
      set({ isAuthenticated: false, user: null, token: null })
      return
    }

    const payload = await verifyToken(stored.token)
    if (!payload) {
      get().logout()
      return
    }

    try {
      const { turso } = await import('@/lib/turso')

      const userId = payload.sub as string
      const sessionId = stored.sessionId

      if (sessionId) {
        const sessionRs = await turso.execute({
          sql: "UPDATE user_sessions SET last_seen = datetime('now') WHERE id = ?",
          args: [sessionId],
        })
        if (sessionRs.rowsAffected === 0) {
          get().logout()
          return
        }
      }

      const userRs = await turso.execute({
        sql: 'SELECT id, name, email, avatar, role, status, expires_at, max_sessions, created_at, updated_at FROM users WHERE id = ?',
        args: [userId],
      })

      if (userRs.rows.length === 0) {
        get().logout()
        return
      }

      const row = userRs.rows[0] as Record<string, unknown>

      if (row.status === 'suspended' || row.status === 'blocked') {
        get().logout()
        return
      }

      if (row.expires_at) {
        const expires = new Date(row.expires_at as string)
        if (expires < new Date()) {
          await turso.execute({
            sql: "UPDATE users SET status = 'expired' WHERE id = ?",
            args: [userId],
          })
          get().logout()
          return
        }
      }

      const permRs = await turso.execute({
        sql: 'SELECT * FROM permissions WHERE user_id = ?',
        args: [userId],
      })

      const userObj = {
        id: row.id as string,
        name: row.name as string,
        email: row.email as string,
        avatar: row.avatar as string,
        role: row.role as 'admin' | 'user',
        status: row.status as User['status'],
        expires_at: row.expires_at as string | null,
        max_sessions: Number(row.max_sessions ?? 2),
        created_at: row.created_at as string,
        updated_at: row.updated_at as string,
      }

      const permRow = permRs.rows[0] as Record<string, unknown> | undefined
      const permissions: Permission | undefined = permRow
        ? {
            id: permRow.id as string,
            user_id: permRow.user_id as string,
            can_watch_movies: Boolean(permRow.can_watch_movies),
            can_watch_series: Boolean(permRow.can_watch_series),
            can_download: Boolean(permRow.can_download),
            can_use_favorites: Boolean(permRow.can_use_favorites),
            can_use_watchlist: Boolean(permRow.can_use_watchlist),
            vip_access: Boolean(permRow.vip_access),
          }
        : undefined

      const freshUser = { ...userObj, permissions: permissions ?? stored.user?.permissions }
      localStorage.setItem('coltcine_user', JSON.stringify(freshUser))

      set({
        user: freshUser,
        token: stored.token,
        isAuthenticated: true,
      })
    } catch {
      set({
        user: stored.user,
        token: stored.token,
        isAuthenticated: true,
      })
    }
  },

  setUser: (user) => {
    localStorage.setItem('coltcine_user', JSON.stringify(user))
    set({ user })
  },
}))
