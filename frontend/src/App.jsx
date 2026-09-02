import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './lib/authStore';
import Navbar           from './components/Navbar';
import HomePage         from './pages/HomePage';
import IncidentPage     from './pages/IncidentPage';
import SubmitPage       from './pages/SubmitPage';
import ProfilePage      from './pages/ProfilePage';
import ModerationPage   from './pages/ModerationPage';
import SubjectPage      from './pages/SubjectPage';
import AuthPage         from './pages/AuthPage';
import StatsPage        from './pages/StatsPage';
import LeaderboardPage  from './pages/LeaderboardPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import EditIncidentPage from './pages/EditIncidentPage';
import CategoryPage from './pages/CategoryPage';
import DashboardPage from './pages/DashboardPage';
import CreateProfilePage from './pages/CreateProfilePage';

function WithNav({ children, fullWidth }) {
  return (
    <>
      <Navbar />
      {fullWidth ? children : (
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '20px 16px' }}>
          {children}
        </div>
      )}
    </>
  );
}

export default function App() {
  const fetchMe = useAuthStore(s => s.fetchMe);
  useEffect(() => { fetchMe(); }, []);

  return (
    <BrowserRouter>
      <Toaster position="top-center" toastOptions={{ style: { fontSize: 14 } }} />
      <Routes>
          <Route path="/"             element={<WithNav fullWidth><HomePage /></WithNav>} />
          <Route path="/olay/:id"     element={<WithNav><IncidentPage /></WithNav>} />
          <Route path="/bildir"       element={<WithNav><SubmitPage /></WithNav>} />
          <Route path="/profil"       element={<WithNav><ProfilePage /></WithNav>} />
          <Route path="/profil-olustur"    element={<WithNav><CreateProfilePage /></WithNav>} />
          <Route path="/dashboard"        element={<WithNav><DashboardPage /></WithNav>} />
          <Route path="/kategori/:slug"    element={<WithNav><CategoryPage /></WithNav>} />
          <Route path="/moderasyon"   element={<WithNav><ModerationPage /></WithNav>} />
          <Route path="/konu/:name"   element={<WithNav><SubjectPage /></WithNav>} />
          <Route path="/giris"        element={<WithNav><AuthPage /></WithNav>} />
          <Route path="/istatistik"   element={<WithNav><StatsPage /></WithNav>} />
          <Route path="/olay-duzenle/:id" element={<WithNav><EditIncidentPage /></WithNav>} />
          <Route path="/sifre-sifirla" element={<WithNav><ResetPasswordPage /></WithNav>} />
          <Route path="/liderboard"   element={<WithNav><LeaderboardPage /></WithNav>} />
        </Routes>
    </BrowserRouter>
  );
}
