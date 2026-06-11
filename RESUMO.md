# RESUMO - Alterações Realizadas

## 1. Menu Hambúrguer Responsivo (Header)
**Arquivo:** `src/components/layout/Header.tsx`
- Adicionado botão ☰ que aparece em telas mobile (md:hidden)
- Menu expansível com os links: Início, Filmes, Séries, Minha Lista
- Animações suaves de abertura (slideDown) e fade em cascata nos itens
- Animação de rotação no ícone do hambúrguer (90° ao abrir)

**Arquivo:** `src/styles/global.css`
- Animações CSS: `@keyframes slideDown`, `@keyframes fadeIn`
- Classe `.mobile-nav` para o menu mobile com animação
- Stagger delay nos links do menu

## 2. Correção: Permissões de Admin não funcionavam
**Arquivo:** `src/pages/admin/AdminUsers.tsx`
- **Problema:** A query `UPDATE permissions SET ... updated_at = datetime('now')` falhava porque a tabela `permissions` no schema (`database/schema.sql`) **não tem coluna `updated_at`**
- **Correção:** Removido `updated_at = datetime('now')` do UPDATE de permissões

## 3. Tela Dedicada de Edição de Usuário
**Arquivo:** `src/pages/admin/AdminUserEdit.tsx` (NOVO)
- Rota: `/admin/users/:id/edit`
- Design baseado em `TELA ESDIÇÂO USUSAIRO.html`
- Header com avatar, nome, email, badges de status
- Card "Dados da Conta": Nome, Email, Senha, Expiração, Tipo (select)
- Card "Permissões" do lado direito: checkboxes individuais
- Botões de ação rápida: Renovar, Editar Dias, Tornar Admin, Suspender, Bloquear, Desbloquear, Excluir
- Botão Salvar Alterações (salva dados da conta via Turso)

## 4. Rota da Página de Edição
**Arquivo:** `src/routes/index.tsx`
- Adicionada rota `users/:id/edit` → `AdminUserEditPage`

## 5. Simplificação da Lista de Usuários
**Arquivo:** `src/pages/admin/AdminUsers.tsx`
- Removidos botões de ação inline (Renovar, Suspender, etc.)
- Restou apenas o botão **Editar** que leva à página dedicada
- Código morto removido (togglePerm, handleAction, setUserDays, etc.)

## 6. Atualização em Tempo Real das Permissões
**Arquivo:** `src/stores/authStore.ts`
- **Problema:** `checkAuth()` carregava dados do `localStorage` (cacheados), não refletindo alterações feitas pelo admin
- **Correção:** `checkAuth()` agora busca dados frescos do banco Turso a cada carregamento:
  - Busca user por ID (do token JWT)
  - Verifica se não está suspenso/bloqueado/expirado
  - Busca permissões atualizadas
  - Atualiza Zustand store e localStorage

## 7. Seletor de Avatar com Personagens
**Arquivo:** `src/components/shared/AvatarPicker.tsx` (NOVO)
- Modal com grid de 30 avatares (5 colunas)
- Busca imagens via TMDB `/search/multi` para desenhos/filmes
- Lista de busca: Teen Titans, Avatar, Bob Esponja, Dragon Ball Z, Naruto, One Piece, Pokemon, Mickey Mouse, Simpsons, Shrek, Toy Story, Frozen, etc.
- Fallback para DiceBear caso TMDB não retorne resultados
- Exibido ao clicar no avatar (com hover "Alterar")

**Arquivo:** `src/pages/Profile.tsx`
- Avatar clicável com overlay "Alterar" no hover
- Abre o AvatarPicker ao clicar
- Ao selecionar: salva no banco (UPDATE users SET avatar = ?) e atualiza Zustand em tempo real

**Arquivo:** `src/pages/admin/AdminUserEdit.tsx`
- Avatar clicável com overlay "Alterar" no hover
- Abre o AvatarPicker ao clicar
- Ao selecionar: salva no banco e atualiza estado local
