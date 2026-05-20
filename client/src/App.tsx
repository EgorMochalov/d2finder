import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { HelmetProvider, Helmet } from 'react-helmet-async';
import { AuthProvider, useAuth } from './lib/auth';
import { useSocket } from './lib/socket';
import { I18nProvider } from './lib/i18n';
import { ToastProvider } from './components/Toast';
import { UnreadProvider } from './lib/unread';
import { useEffect } from 'react';
import NavBar from './components/NavBar';
import AppBackground from './components/AppBackground';
import BackButton from './components/BackButton';
import MobileNav from './components/MobileNav';
import Tour from './components/Tour';
import { SITE_NAME, SITE_DESC } from './lib/meta';

const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const TeamsPage = lazy(() => import('./pages/TeamsPage'));
const TeamDetailPage = lazy(() => import('./pages/TeamDetailPage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const DraftSimulator = lazy(() => import('./pages/DraftSimulator'));
const ClanWarsPage = lazy(() => import('./pages/ClanWarsPage'));
const MyRequestsPage = lazy(() => import('./pages/MyRequestsPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <div className="animate-spin rounded-full h-9 w-9 border-2 border-white/10 border-t-accent shadow-glow" />
      <p className="text-muted text-xs uppercase tracking-widest font-display">Loading</p>
    </div>
  );
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
          <Suspense fallback={<PageLoader />}>
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
          </Suspense>
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
