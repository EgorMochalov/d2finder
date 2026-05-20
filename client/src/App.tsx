import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { HelmetProvider, Helmet } from 'react-helmet-async';
import { AuthProvider, useAuth } from './lib/auth';
import { useSocket } from './lib/socket';
import { I18nProvider } from './lib/i18n';
import { ToastProvider } from './components/Toast';
import { UnreadProvider } from './lib/unread';
import NavBar from './components/NavBar';
import AppBackground from './components/AppBackground';
import BackButton from './components/BackButton';
import MobileNav from './components/MobileNav';
import Tour from './components/Tour';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import SearchPage from './pages/SearchPage';
import TeamsPage from './pages/TeamsPage';
import TeamDetailPage from './pages/TeamDetailPage';
import ChatPage from './pages/ChatPage';
import DraftSimulator from './pages/DraftSimulator';
import ClanWarsPage from './pages/ClanWarsPage';
import MyRequestsPage from './pages/MyRequestsPage';
import NotificationsPage from './pages/NotificationsPage';
import { SITE_NAME, SITE_DESC } from './lib/meta';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function AppContent() {
  useSocket();
  const { user } = useAuth();
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Helmet>
        <title>{SITE_NAME}</title>
        <meta name="description" content={SITE_DESC} />
        <meta property="og:title" content={SITE_NAME} />
        <meta property="og:description" content={SITE_DESC} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://d2finder.vercel.app" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={SITE_NAME} />
        <meta name="twitter:description" content={SITE_DESC} />
      </Helmet>
      {user && <Tour />}
      <AppBackground />
      <div className="app-shell">
        <NavBar />
        <main className="flex-1 pb-20 md:pb-6">
          <div className="max-w-7xl mx-auto px-4 pt-4">
            <BackButton />
          </div>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/profile/:id" element={<ProfilePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/teams" element={<TeamsPage />} />
            <Route path="/teams/:id" element={<TeamDetailPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/draft" element={<DraftSimulator />} />
            <Route path="/clanwars" element={<ClanWarsPage />} />
            <Route path="/my-teams" element={<MyRequestsPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
          </Routes>
        </main>
        <MobileNav />
      </div>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <HelmetProvider>
        <I18nProvider>
          <ToastProvider>
            <UnreadProvider>
              <AppContent />
            </UnreadProvider>
          </ToastProvider>
        </I18nProvider>
      </HelmetProvider>
    </AuthProvider>
  );
}
