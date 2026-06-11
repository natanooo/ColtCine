# ColtCine

Plataforma de streaming com catálogo TMDB, player embed, controle de permissões e limite de sessões.

---

## Índice

- [Tecnologias](#tecnologias)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Configuração](#configuração)
- [Banco de Dados](#banco-de-dados)
- [Rotas](#rotas)
- [Autenticação](#autenticação)
- [Permissões](#permissões)
- [Sessões](#sessões)
- [Player de Vídeo](#player-de-vídeo)
- [TMDB](#tmdb)
- [Admin](#admin)
- [Tema](#tema)
- [Scripts Úteis](#scripts-úteis)

---

## Tecnologias

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| React | 19 | UI |
| TypeScript | 5.7 | Tipagem |
| Vite | 6 | Build |
| Tailwind CSS | 4 | Estilos |
| Zustand | 5 | Estado global |
| React Router | 7 | Rotas |
| TanStack React Query | 5 | Cache de API |
| Framer Motion | 12 | Animações |
| @libsql/client | 0.14 | Banco Turso |
| jose | 5 | JWT |
| bcryptjs | 2.4 | Hash de senha |

---

## Estrutura do Projeto

```
PROJETO FILMES/
├── .env                          # Variáveis de ambiente
├── index.html                    # Entry point HTML
├── package.json
├── vite.config.ts                # Config Vite (React + Tailwind + @ alias)
├── tsconfig.json
│
├── database/
│   └── schema.sql                # Schema completo do banco
│
├── public/
│   └── schema.sql                # Schema + seed data (admin padrão)
│
├── scripts/
│   └── run_migration.mjs         # Script de migração Turso
│   └── migration_sessions.sql    # SQL da migração de sessões
│
├── src/
│   ├── main.tsx                  # Entry point React
│   ├── App.tsx                   # Componente raiz (QueryClient + Router)
│   │
│   ├── types/
│   │   └── index.ts              # Interfaces TypeScript
│   │
│   ├── styles/
│   │   └── global.css            # Tailwind + estilos globais
│   │
│   ├── routes/
│   │   ├── index.tsx             # Definição de todas as rotas
│   │   └── ProtectedRoute.tsx    # Guard de autenticação
│   │
│   ├── lib/
│   │   ├── turso.ts             # Cliente Turso
│   │   ├── jwt.ts               # JWT sign/verify
│   │   ├── api.ts               # Cliente TMDB
│   │   └── embed.ts             # URLs de embed
│   │
│   ├── stores/
│   │   ├── authStore.ts         # Store de autenticação
│   │   └── mediaStore.ts        # Store de mídia
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── MainLayout.tsx   # Layout principal (Header + Outlet + Footer)
│   │   │   ├── AdminLayout.tsx  # Layout admin (sidebar + Outlet)
│   │   │   ├── Header.tsx       # Header com navegação
│   │   │   └── Footer.tsx       # Footer
│   │   └── shared/
│   │       ├── MediaCard.tsx     # Card de filme/série
│   │       ├── MediaRow.tsx     # Fileira horizontal de cards
│   │       ├── AvatarPicker.tsx # Seletor de avatar DiceBear
│   │       └── LoadingSpinner.tsx
│   │
│   └── pages/
│       ├── Login.tsx
│       ├── Dashboard.tsx
│       ├── MoviesPage.tsx
│       ├── SeriesPage.tsx
│       ├── MovieDetail.tsx
│       ├── TVDetail.tsx
│       ├── Watch.tsx
│       ├── Profile.tsx
│       ├── Search.tsx
│       ├── FavoritesPage.tsx
│       ├── WatchlistPage.tsx
│       └── admin/
│           ├── AdminDashboard.tsx
│           ├── AdminUsers.tsx
│           ├── AdminNewUser.tsx
│           └── AdminUserEdit.tsx
```

---

## Configuração

### 1. Clonar e instalar dependências

```bash
npm install
```

### 2. Configurar `.env`

```env
VITE_TMDB_KEY=seu_tmdb_key
VITE_TMDB_TOKEN=seu_tmdb_token
VITE_TURSO_URL=libsql://filmes-natanoo.aws-us-east-1.turso.io
VITE_TURSO_TOKEN=seu_turso_token
VITE_JWT_SECRET=sua_chave_jwt
```

### 3. Rodar em dev

```bash
npm run dev
```

Acessar `http://localhost:5173`.

Para acesso na rede local (celular):
```bash
npx vite --host
```

### 4. Build produção

```bash
npm run build
```

---

## Banco de Dados

### Turso (libSQL)

Banco remoto SQLite-compatível. Acessado diretamente do navegador via `@libsql/client`.

URL: `libsql://filmes-natanoo.aws-us-east-1.turso.io`

### Tabelas

#### `users`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | TEXT PK | UUID |
| `name` | TEXT NOT NULL | Nome |
| `email` | TEXT UNIQUE | Email de login |
| `password_hash` | TEXT NOT NULL | Hash bcrypt |
| `avatar` | TEXT | URL do avatar |
| `role` | TEXT | `admin` ou `user` |
| `status` | TEXT | `active`, `expired`, `suspended`, `blocked` |
| `expires_at` | TEXT | Data de expiração |
| `max_sessions` | INTEGER | Limite de sessões (0 = ilimitado) |
| `created_at` | TEXT | ISO timestamp |
| `updated_at` | TEXT | ISO timestamp |

#### `permissions`
| Coluna | Tipo | Padrão | Descrição |
|--------|------|--------|-----------|
| `id` | TEXT PK | UUID | |
| `user_id` | TEXT UNIQUE FK | | |
| `can_watch_movies` | INTEGER | 1 | |
| `can_watch_series` | INTEGER | 1 | |
| `can_download` | INTEGER | 0 | |
| `can_use_favorites` | INTEGER | 1 | |
| `can_use_watchlist` | INTEGER | 1 | |
| `vip_access` | INTEGER | 0 | |

#### `favorites`
| Coluna | Descrição |
|--------|-----------|
| `id` | UUID PK |
| `user_id` | FK -> users |
| `media_id` | ID TMDB |
| `media_type` | `movie` ou `tv` |
| `created_at` | Timestamp |
| UNIQUE | `(user_id, media_id, media_type)` |

#### `watchlist`
Mesma estrutura de `favorites`.

#### `watch_history`
| Coluna | Descrição |
|--------|-----------|
| `id` | UUID PK |
| `user_id` | FK -> users |
| `media_id` | ID TMDB |
| `media_type` | `movie` ou `tv` |
| `watched_time` | Segundos assistidos |
| `total_duration` | Duração total |
| `season_number` | (tv) |
| `episode_number` | (tv) |
| `completed` | 0 ou 1 |
| `updated_at` | Timestamp |
| UNIQUE | `(user_id, media_id, media_type, season, episode)` |

#### `recent_views`
| Coluna | Descrição |
|--------|-----------|
| `id` | UUID PK |
| `user_id` | FK |
| `media_id` | ID TMDB |
| `viewed_at` | Timestamp |

#### `user_sessions`
| Coluna | Descrição |
|--------|-----------|
| `id` | TEXT PK (UUID gerado no login) |
| `user_id` | FK -> users |
| `created_at` | Timestamp de criação |
| `last_seen` | Timestamp da última atividade |

#### `subscriptions`
| Coluna | Descrição |
|--------|-----------|
| `id` | UUID PK |
| `user_id` | FK UNIQUE |
| `start_date` | Início |
| `expiration_date` | Fim |
| `status` | `active`, `expired`, `cancelled` |

---

## Rotas

### Públicas
| Rota | Página |
|------|--------|
| `/login` | Login |

### Autenticadas
| Rota | Página |
|------|--------|
| `/dashboard` | Home |
| `/movies` | Filmes |
| `/series` | Séries |
| `/movie/:id` | Detalhe do filme |
| `/tv/:id` | Detalhe da série |
| `/watch/:type/:id` | Player |
| `/profile` | Perfil |
| `/search` | Busca |
| `/favorites` | Favoritos |
| `/watchlist` | Minha Lista |

### Admin
| Rota | Página |
|------|--------|
| `/admin` | Dashboard admin |
| `/admin/users` | Gerenciar usuários |
| `/admin/users/new` | Novo usuário |
| `/admin/users/:id/edit` | Editar usuário |

---

## Autenticação

### Fluxo de Login

1. Usuário envia email + senha
2. Busca usuário no Turso (`SELECT * FROM users WHERE email = ?`)
3. Verifica hash bcrypt
4. Verifica status (`suspended`/`blocked`/`expired`)
5. Verifica sessões ativas (se excedeu `max_sessions`, nega login)
6. Cria sessão em `user_sessions` com UUID aleatório
7. Gera JWT (HS256, 7 dias de validade) com `{ sub, role, email }`
8. Salva no `localStorage`:
   - `coltcine_token` — JWT
   - `coltcine_user` — JSON com dados do usuário + permissões
   - `coltcine_session` — UUID da sessão

### Fluxo de Logout

1. Deleta sessão de `user_sessions WHERE id = sessionId`
2. Limpa `localStorage`
3. Reseta estado

### checkAuth (chamado em toda rota protegida)

1. Lê token do `localStorage`
2. Verifica JWT com `jose.jwtVerify()`
3. Atualiza `last_seen` da sessão
4. Re-busca dados do usuário no Turso (fresco)
5. Verifica status/expiração
6. Atualiza `localStorage` e estado

---

## Permissões

Cada usuário tem 6 flags booleanas em `permissions`:

| Flag | Bloqueia |
|------|----------|
| `can_watch_movies` | MoviesPage, MovieDetail, /watch/movie |
| `can_watch_series` | SeriesPage, TVDetail, /watch/tv |
| `can_download` | (não implementado no front) |
| `can_use_favorites` | Botão de favoritar |
| `can_use_watchlist` | Botão de Minha Lista |
| `vip_access` | (não implementado no front) |

**Admin ignora todas as permissões** — o padrão usado no código é:
```ts
user?.role === 'admin' || user?.permissions?.can_watch_movies !== false
```

Usuários **sem registro na tabela `permissions`** têm acesso liberado (compatibilidade).

---

## Sessões

### Limite de Sessões

- `max_sessions` na tabela `users` (padrão: 2, 0 = ilimitado)
- Cada login cria um registro em `user_sessions`
- Múltiplas abas no mesmo navegador = 1 sessão (compartilham `localStorage`)
- Logout em qualquer aba derruba todas (checkAuth detecta sessão deletada)
- Sessões órfãs (fechou navegador sem logout) expiram em 24h
- Na lista de admin: badge `N/M sessões` mostra ativas/máximo

---

## Player de Vídeo

### Embed

URLs geradas em `src/lib/embed.ts`:

```
https://cdn-embed.com/filme/{tmdb_id}           # Filme
https://cdn-embed.com/serie/{tmdb_id}           # Série
https://cdn-embed.com/serie/{id}/{season}/{ep}  # Episódio
```

Renderizado em iframe com `allowFullScreen`.

### Progresso

- A cada 30 segundos: `saveWatchProgress()` atualiza `watch_history`
- Ao desmontar (sair da página): chamada final
- "Continuar Assistindo" no perfil consulta entradas incompletas
- Barra de progresso visível nos cards (prop `progress`)

---

## TMDB

### API

Base: `https://api.themoviedb.org/3`
Auth: `api_key` + Bearer token
Idioma: `pt-BR`

### Endpoints usados

| Endpoint | Uso |
|----------|-----|
| `/trending/all/week` | Home |
| `/movie/popular` | Filmes |
| `/tv/popular` | Séries |
| `/movie/{id}` (append: credits,similar,videos) | Detalhe |
| `/tv/{id}` (append: credits,similar) | Detalhe |
| `/tv/{id}/season/{n}` | Episódios |
| `/search/multi` | Busca |

### Imagens

```
https://image.tmdb.org/t/p/{size}{path}
```
Sizes: `w200`, `w500`, `w780`, `original`

---

## Admin

### Acesso

Admin padrão: `admin@cineverse.com` / `admin123`

### Funcionalidades

**Dashboard** (`/admin`)
- Total de usuários, ativos, expirados, bloqueados

**Usuários** (`/admin/users`)
- Lista com badges: status, role, dias restantes, sessões
- Link para editar

**Novo Usuário** (`/admin/users/new`)
- Formulário: nome, email, senha, expiração, limite de sessões, role, permissões

**Editar Usuário** (`/admin/users/:id/edit`)
- Avatar (seletor DiceBear), badges
- Ações rápidas: renovar (30d), editar dias, toggle admin, suspender, bloquear, excluir
- Dados da conta: nome, email, senha, expiração, limite de sessões, role
- Permissões: 6 checkboxes independentes com toggle imediato

---

## Tema

### Design System

- **Fundo:** `#050505`
- **Fonte:** Inter (Google Fonts)
- **Cards:** `bg-[#111]`, `rounded-[18px-24px]`
- **Inputs:** `h-[52px]`, `rounded-full`, `bg-[#151515]`
- **Botões primários:** `bg-white text-black`
- **Bordas:** `#1d1d1d`, `#242424`
- **Container:** `max-w-[1400px] mx-auto`
- **Header:** Fixed, `backdrop-blur-xl`, `bg rgba(5,5,5,.65)`
- **Scrollbar:** Oculto (webkit)

### Responsivo

- Navegação vira hamburger em `< md` (768px)
- Grids adaptam colunas
- Textos reduzem em mobile

### Animações (Framer Motion)

- Login: fade + slide up
- MediaCard: hover lift (`y: -8`)
- Loading spinner: rotação infinita
- Stats: entrada escalonada

---

## Scripts Úteis

### Migração de sessões

```bash
node scripts/run_migration.mjs
```

Adiciona coluna `max_sessions` e cria tabela `user_sessions`.

### Recriar admin

```bash
node test-turso.cjs
```

### Corrigir admin

```bash
node fix-admin.cjs
```

---

## Variáveis de Ambiente

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `VITE_TMDB_KEY` | Sim | API key do TMDB |
| `VITE_TMDB_TOKEN` | Sim | Bearer token do TMDB |
| `VITE_TURSO_URL` | Sim | URL do banco Turso |
| `VITE_TURSO_TOKEN` | Sim | Token de autenticação Turso |
| `VITE_JWT_SECRET` | Sim | Chave secreta JWT |

---

## Admin Padrão

- **Email:** `admin@cineverse.com`
- **Senha:** `admin123`

---

## Licença

Uso interno.
