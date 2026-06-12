import { Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SearchIcon, CloseIcon, MenuIcon } from '@/components/shared/Icons'

export function Header() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
      setSearchOpen(false)
    }
  }

  return (
    <header className="fixed top-0 left-0 w-full z-[999] backdrop-blur-xl bg-[rgba(5,5,5,.65)] border-b border-[rgba(255,255,255,.05)]">
      <div className="w-[1400px] max-w-[95%] mx-auto">
        <div className="h-20 flex items-center justify-between">
          <Link to="/dashboard" className="text-[28px] font-extrabold tracking-[2px] no-underline text-white">
            COLT CINE
          </Link>

          <nav className="hidden md:flex gap-[30px]">
            <Link to="/dashboard" className="text-[#d0d0d0] no-underline text-sm transition-colors duration-300 hover:text-white">
              Início
            </Link>
            <Link to="/movies" className="text-[#d0d0d0] no-underline text-sm transition-colors duration-300 hover:text-white">
              Filmes
            </Link>
            <Link to="/series" className="text-[#d0d0d0] no-underline text-sm transition-colors duration-300 hover:text-white">
              Séries
            </Link>
            <Link to="/watchlist" className="text-[#d0d0d0] no-underline text-sm transition-colors duration-300 hover:text-white">
              Minha Lista
            </Link>
          </nav>

          <div className="flex items-center gap-[15px]">
            {searchOpen ? (
              <form onSubmit={handleSearch} className="flex">
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Pesquisar..."
                  className="w-[250px] h-[45px] rounded-full bg-[#151515] border-none outline-none px-5 text-white text-sm"
                  onBlur={() => !searchQuery && setSearchOpen(false)}
                />
              </form>
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                className="w-[45px] h-[45px] rounded-full bg-[#151515] border-none text-white cursor-pointer flex items-center justify-center text-lg"
              >
                <SearchIcon size={20} />
              </button>
            )}

            <Link
              to="/profile"
              className="w-[42px] h-[42px] rounded-full bg-[#222] overflow-hidden block flex-shrink-0"
            >
              {user?.avatar ? (
                <img src={user.avatar} alt="" className="w-full h-full object-cover" />
              ) : null}
            </Link>

            {user?.role === 'admin' && (
              <Link to="/admin" className="text-[#d0d0d0] no-underline text-xs transition-colors duration-300 hover:text-white">
                Admin
              </Link>
            )}

            <button
              onClick={logout}
              className="text-[#777] no-underline text-xs transition-colors duration-300 hover:text-white bg-transparent border-none cursor-pointer"
            >
              Sair
            </button>

            {/* Botão do menu hambúrguer para mobile */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden w-[45px] h-[45px] rounded-full bg-[#151515] border-none text-white cursor-pointer flex items-center justify-center text-lg transition-transform duration-300"
              style={{ transform: menuOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}
              aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
            >
              {menuOpen ? <CloseIcon size={20} /> : <MenuIcon size={20} />}
            </button>
          </div>
        </div>

        {/* Menu mobile */}
        {menuOpen && (
          <nav className="mobile-nav md:hidden pb-4 flex flex-col gap-4">
            <Link
              to="/dashboard"
              onClick={() => setMenuOpen(false)}
              className="text-[#d0d0d0] no-underline text-sm transition-colors duration-300 hover:text-white"
            >
              Início
            </Link>
            <Link
              to="/movies"
              onClick={() => setMenuOpen(false)}
              className="text-[#d0d0d0] no-underline text-sm transition-colors duration-300 hover:text-white"
            >
              Filmes
            </Link>
            <Link
              to="/series"
              onClick={() => setMenuOpen(false)}
              className="text-[#d0d0d0] no-underline text-sm transition-colors duration-300 hover:text-white"
            >
              Séries
            </Link>
            <Link
              to="/watchlist"
              onClick={() => setMenuOpen(false)}
              className="text-[#d0d0d0] no-underline text-sm transition-colors duration-300 hover:text-white"
            >
              Minha Lista
            </Link>
          </nav>
        )}
      </div>
    </header>
  )
}
