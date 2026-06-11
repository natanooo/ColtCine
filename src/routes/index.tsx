import { createBrowserRouter, Navigate } from 'react-router-dom'
import { MainLayout } from '@/components/layout/MainLayout'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { LoginPage } from '@/pages/Login'
import { DashboardPage } from '@/pages/Dashboard'
import { MoviesPage } from '@/pages/MoviesPage'
import { SeriesPage } from '@/pages/SeriesPage'
import { MovieDetailPage } from '@/pages/MovieDetail'
import { TVDetailPage } from '@/pages/TVDetail'
import { WatchPage } from '@/pages/Watch'
import { ProfilePage } from '@/pages/Profile'
import { SearchPage } from '@/pages/Search'
import { FavoritesPage } from '@/pages/FavoritesPage'
import { WatchlistPage } from '@/pages/WatchlistPage'
import { AdminDashboardPage } from '@/pages/admin/AdminDashboard'
import { AdminUsersPage } from '@/pages/admin/AdminUsers'
import { AdminNewUserPage } from '@/pages/admin/AdminNewUser'
import { AdminUserEditPage } from '@/pages/admin/AdminUserEdit'
import { ProtectedRoute } from './ProtectedRoute'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'movies', element: <MoviesPage /> },
      { path: 'series', element: <SeriesPage /> },
      { path: 'movie/:id', element: <MovieDetailPage /> },
      { path: 'tv/:id', element: <TVDetailPage /> },
      { path: 'watch/:type/:id', element: <WatchPage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'search', element: <SearchPage /> },
      { path: 'favorites', element: <FavoritesPage /> },
      { path: 'watchlist', element: <WatchlistPage /> },
    ],
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute requireAdmin>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: '', element: <AdminDashboardPage /> },
      { path: 'users', element: <AdminUsersPage /> },
      { path: 'users/new', element: <AdminNewUserPage /> },
      { path: 'users/:id/edit', element: <AdminUserEditPage /> },
    ],
  },
])
