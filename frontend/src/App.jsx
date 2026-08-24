import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './lib/authStore';
import Navbar         from './components/Navbar';
import HomePage       from './pages/HomePage';
import IncidentPage   from './pages/IncidentPage';
import SubmitPage     from './pages/SubmitPage';
import ProfilePage    from './pages/ProfilePage';
import ModerationPage from './pages/ModerationPage';
import SubjectPage    from './pages/SubjectPage';
import AuthPage       from './pages/AuthPage';
import StatsPage      from './pages/StatsPage';

export default function App() {
  const fetchMe = useAuthStore(s => s.fetchMe);
  useEffect(() => { fetchMe(); }, []);

  return (
    <BrowserRouter>
      <Toaster position="top-center" toastOptions={{ style: { fontSize: 14 } }} />
      <Navbar />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '16px 12px' }}>
        <Routes>
          <Route path="/"             element={<HomePage />} />
          <Route path="/olay/:id"     element={<IncidentPage />} />
          <Route path="/bildir"       element={<SubmitPage />} />
          <Route path="/profil"       element={<ProfilePage />} />
          <Route path="/moderasyon"   element={<ModerationPage />} />
          <Route path="/konu/:name"   element={<SubjectPage />} />
          <Route path="/giris"        element={<AuthPage />} />
          <Route path="/istatistik"   element={<StatsPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
