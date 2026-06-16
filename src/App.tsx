import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import PublicLayout from "@/components/layout/PublicLayout";
import DashboardLayout from "@/components/layout/DashboardLayout";
import LandingPage from "@/pages/landing/LandingPage";
import PrivacyPage from "@/pages/landing/PrivacyPage";
import TermsPage from "@/pages/landing/TermsPage";
import LoginPage from "@/pages/auth/LoginPage";
import AuthCallbackPage from "@/pages/auth/AuthCallbackPage";
import DashboardHome from "@/pages/dashboard/DashboardHome";
import PerangkatAjarPage from "@/pages/dashboard/perangkat-ajar/PerangkatAjarPage";
import JurnalPage from "@/pages/dashboard/jurnal/JurnalPage";
import AbsensiPage from "@/pages/dashboard/absensi/AbsensiPage";
import PenilaianPage from "@/pages/dashboard/penilaian/PenilaianPage";
import UsersPage from "@/pages/dashboard/admin/UsersPage";
import SettingsPage from "@/pages/dashboard/admin/SettingsPage";
import MaintenancePage from "@/pages/dashboard/admin/MaintenancePage";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
          </Route>

          {/* Auth Callback (no layout) */}
          <Route path="/auth/callback" element={<AuthCallbackPage />} />

          {/* Dashboard Routes (Protected) */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardHome />} />
            <Route path="perangkat-ajar" element={<PerangkatAjarPage />} />
            <Route path="jurnal" element={<JurnalPage />} />
            <Route path="absensi" element={<AbsensiPage />} />
            <Route path="penilaian" element={<PenilaianPage />} />
            <Route path="admin/users" element={<UsersPage />} />
            <Route path="admin/settings" element={<SettingsPage />} />
            <Route path="admin/maintenance" element={<MaintenancePage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
