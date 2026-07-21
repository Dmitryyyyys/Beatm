import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import AdminLoginPage from './pages/AdminLoginPage'
import AdminPage from './pages/AdminPage'
import AdminUsersPage from './pages/AdminUsersPage'
import AdminUserDetailPage from './pages/AdminUserDetailPage'
import AdminCategoriesPage from './pages/AdminCategoriesPage'
import ProfilePage from './pages/ProfilePage'
import SettingsProfilePage from './pages/SettingsProfilePage'
import MessengerPage from './pages/MessengerPage'
import SubscriptionsPage from './pages/SubscriptionsPage'
import FavoritesPage from './pages/FavoritesPage'
import SavedPage from './pages/SavedPage'
import MyOrdersPage from './pages/MyOrdersPage'
import RecentlyPlayedPage from './pages/RecentlyPlayedPage'
import CreateTrackPage from './pages/CreateTrackPage'
import EditTrackPage from './pages/EditTrackPage'
import TrackDetailPage from './pages/TrackDetailPage'
import StudioPage from './pages/StudioPage'
import SearchPage from './pages/SearchPage'
import Header from './components/Header'
import Footer from './components/Footer'
import MiniPlayer from './components/MiniPlayer'
import { AudioPlayerProvider } from './contexts/AudioPlayerContext'
import { authService } from './services/authService'

const LayoutWithHeader = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-900">
      <Header />
      <main className="flex-grow pb-20">
        {children}
      </main>
      <Footer />
      <MiniPlayer />
    </div>
  )
}

const RequireAuth = ({ children }: { children: JSX.Element }) => {
  const location = useLocation()

  if (!authService.isAuthenticated()) {
    const next = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?next=${next}`} replace />
  }

  return children
}

const LayoutWithMiniPlayerNoScroll = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="h-screen overflow-hidden">
      {children}
      <MiniPlayer />
    </div>
  )
}

function App() {
  return (
    <AudioPlayerProvider>
      <Router>
        <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route
          path="/admin"
          element={
            <RequireAuth>
              <LayoutWithHeader><AdminPage /></LayoutWithHeader>
            </RequireAuth>
          }
        />
        <Route
          path="/admin/users"
          element={
            <RequireAuth>
              <LayoutWithHeader><AdminUsersPage /></LayoutWithHeader>
            </RequireAuth>
          }
        />
        <Route
          path="/admin/users/:id"
          element={
            <RequireAuth>
              <LayoutWithHeader><AdminUserDetailPage /></LayoutWithHeader>
            </RequireAuth>
          }
        />
        <Route
          path="/admin/categories"
          element={
            <RequireAuth>
              <LayoutWithHeader><AdminCategoriesPage /></LayoutWithHeader>
            </RequireAuth>
          }
        />
        <Route
          path="/messenger"
          element={
            <RequireAuth>
              <LayoutWithMiniPlayerNoScroll><MessengerPage /></LayoutWithMiniPlayerNoScroll>
            </RequireAuth>
          }
        />
        <Route
          path="/messenger/:conversationId"
          element={
            <RequireAuth>
              <LayoutWithMiniPlayerNoScroll><MessengerPage /></LayoutWithMiniPlayerNoScroll>
            </RequireAuth>
          }
        />
        <Route
          path="/subscriptions"
          element={
            <RequireAuth>
              <LayoutWithMiniPlayerNoScroll><SubscriptionsPage /></LayoutWithMiniPlayerNoScroll>
            </RequireAuth>
          }
        />
        <Route
          path="/favorites"
          element={
            <RequireAuth>
              <LayoutWithMiniPlayerNoScroll><FavoritesPage /></LayoutWithMiniPlayerNoScroll>
            </RequireAuth>
          }
        />
        <Route
          path="/saved"
          element={
            <RequireAuth>
              <LayoutWithMiniPlayerNoScroll><SavedPage /></LayoutWithMiniPlayerNoScroll>
            </RequireAuth>
          }
        />
        <Route
          path="/orders"
          element={
            <RequireAuth>
              <LayoutWithMiniPlayerNoScroll><MyOrdersPage /></LayoutWithMiniPlayerNoScroll>
            </RequireAuth>
          }
        />
        <Route
          path="/recent"
          element={
            <RequireAuth>
              <LayoutWithMiniPlayerNoScroll><RecentlyPlayedPage /></LayoutWithMiniPlayerNoScroll>
            </RequireAuth>
          }
        />
        <Route
          path="/"
          element={<LayoutWithHeader><HomePage /></LayoutWithHeader>}
        />
        <Route
          path="/search"
          element={<LayoutWithHeader><SearchPage /></LayoutWithHeader>}
        />
        <Route
          path="/profile/:displayName"
          element={<LayoutWithHeader><ProfilePage /></LayoutWithHeader>}
        />
        <Route
          path="/settings/profile"
          element={
            <RequireAuth>
              <LayoutWithHeader><SettingsProfilePage /></LayoutWithHeader>
            </RequireAuth>
          }
        />
        <Route
          path="/create-track"
          element={
            <RequireAuth>
              <LayoutWithHeader><CreateTrackPage /></LayoutWithHeader>
            </RequireAuth>
          }
        />
        <Route
          path="/tracks/:id/edit"
          element={
            <RequireAuth>
              <LayoutWithHeader><EditTrackPage /></LayoutWithHeader>
            </RequireAuth>
          }
        />
        <Route
          path="/tracks/:id"
          element={<LayoutWithHeader><TrackDetailPage /></LayoutWithHeader>}
        />
        <Route
          path="/studio"
          element={
            <RequireAuth>
              <StudioPage />
            </RequireAuth>
          }
        />
        </Routes>
      </Router>
    </AudioPlayerProvider>
  )
}

export default App