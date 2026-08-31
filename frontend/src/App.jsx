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

function WithNav({ children }) {
  return (
    <>
      <Navbar />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '16px 12px' }}>
        {children}
      </div>
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
          <Route path="/"             element={<HomePage />} />
          <Route path="/olay/:id"     element={<WithNav><IncidentPage /></WithNav>} />
          <Route path="/bildir"       element={<WithNav><SubmitPage /></WithNav>} />
          <Route path="/profil"       element={<WithNav><ProfilePage /></WithNav>} />
          <Route path="/moderasyon"   element={<WithNav><ModerationPage /></WithNav>} />
          <Route path="/konu/:name"   element={<WithNav><SubjectPage /></WithNav>} />
          <Route path="/giris"        element={<WithNav><AuthPage /></WithNav>} />
          <Route path="/istatistik"   element={<WithNav><StatsPage /></WithNav>} />
          <Route path="/sifre-sifirla" element={<WithNav><ResetPasswordPage /></WithNav>} />
          <Route path="/liderboard"   element={<WithNav><LeaderboardPage /></WithNav>} />
        </Routes>
    </BrowserRouter>
  );
}
