import { useEffect, useState } from 'react'
import { turso } from '@/lib/turso'

export function AdminDashboardPage() {
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    expired: 0,
    blocked: 0,
  })

  useEffect(() => {
    Promise.all([
      turso.execute({ sql: 'SELECT COUNT(*) as c FROM users', args: [] }),
      turso.execute({ sql: "SELECT COUNT(*) as c FROM users WHERE status = 'active'", args: [] }),
      turso.execute({ sql: "SELECT COUNT(*) as c FROM users WHERE status = 'expired'", args: [] }),
      turso.execute({ sql: "SELECT COUNT(*) as c FROM users WHERE status = 'blocked'", args: [] }),
    ]).then(([total, active, expired, blocked]) => {
      setStats({
        total: Number(total.rows[0]?.c || 0),
        active: Number(active.rows[0]?.c || 0),
        expired: Number(expired.rows[0]?.c || 0),
        blocked: Number(blocked.rows[0]?.c || 0),
      })
    })
  }, [])

  const cards = [
    { label: 'Total de Usuários', value: stats.total, color: 'text-white' },
    { label: 'Usuários Ativos', value: stats.active, color: 'text-green-400' },
    { label: 'Usuários Expirados', value: stats.expired, color: 'text-yellow-400' },
    { label: 'Usuários Bloqueados', value: stats.blocked, color: 'text-red-400' },
  ]

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Dashboard Admin</h1>
      <div className="grid grid-cols-4 gap-5 max-md:grid-cols-2">
        {cards.map(card => (
          <div key={card.label} className="bg-[#111] rounded-[22px] p-[30px]">
            <h2 className={`text-[42px] font-bold mb-2.5 ${card.color}`}>{card.value}</h2>
            <span className="text-[#999] text-sm">{card.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
