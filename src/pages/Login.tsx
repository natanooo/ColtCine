import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/stores/authStore'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login, isAuthenticated, isLoading } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true })
  }, [isAuthenticated, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email || !password) {
      setError('Preencha todos os campos')
      return
    }
    const success = await login(email, password)
    if (success) {
      navigate('/dashboard', { replace: true })
    } else {
      setError('Email ou senha inválidos, ou acesso expirado.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-[#050505] z-[1]" />
      <div
        className="absolute inset-0 bg-cover bg-center z-0"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=2000&q=80')`,
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-[450px] max-w-[90%]"
      >
        <div className="bg-[rgba(17,17,17,.85)] backdrop-blur-xl rounded-[25px] p-10 border border-[rgba(255,255,255,.05)]">
          <div className="text-center mb-8">
            <h1 className="text-[28px] font-extrabold tracking-[2px] mb-1">COLT CINE</h1>
            <p className="text-[#999] text-sm">Entre na sua conta</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-[#bbb] text-xs mb-2 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full h-[52px] rounded-full bg-[#151515] border-none outline-none px-6 text-white text-sm"
              />
            </div>

            <div>
              <label className="text-[#bbb] text-xs mb-2 block">Senha</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-[52px] rounded-full bg-[#151515] border-none outline-none px-6 text-white text-sm"
              />
            </div>

            {error && (
              <p className="text-red-400 text-xs text-center">{error}</p>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full h-[52px] rounded-full bg-white text-black font-semibold cursor-pointer disabled:opacity-50 text-sm"
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </motion.button>
          </form>

          <p className="text-center mt-6">
            <a href="#" className="text-[#777] text-xs no-underline hover:text-white transition-colors">
              Esqueceu a senha?
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
