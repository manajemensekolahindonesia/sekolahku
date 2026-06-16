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
import ModuleGenerator from "@/pages/dashboard/perangkat-ajar/ModuleGenerator";
import JurnalPage from "@/pages/dashboard/jurnal/JurnalPage";
import DailyJournal from "@/pages/dashboard/daily-journal/DailyJournal";
import AbsensiPage from "@/pages/dashboard/absensi/AbsensiPage";
import PenilaianPage from "@/pages/dashboard/penilaian/PenilaianPage";
import BuatSoal from "@/pages/dashboard/buat-soal/BuatSoal";
import KalenderPendidikan from "@/pages/dashboard/kalender/KalenderPendidikan";
import AnalisisHariEfektif from "@/pages/dashboard/analisis/AnalisisHariEfektif";
import KKTP from "@/pages/dashboard/kktp/KKTP";
import RubrikPenilaian from "@/pages/dashboard/rubrik/RubrikPenilaian";
import BarcodeGenerator from "@/pages/dashboard/barcode/BarcodeGenerator";
import GroupGenerator from "@/pages/dashboard/kelompok/GroupGenerator";
import WorksheetGenerator from "@/pages/dashboard/worksheet/WorksheetGenerator";
import LaporanKegiatan from "@/pages/dashboard/laporan/LaporanKegiatan";
import MengajarHarian from "@/pages/dashboard/mengajar-harian/MengajarHarian";
import ProgramTahunan from "@/pages/dashboard/program/ProgramTahunan";
import ProgramSemester from "@/pages/dashboard/program/ProgramSemester";
import Supervisi from "@/pages/dashboard/supervisi/Supervisi";
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
            {/* Core */}
            <Route path="perangkat-ajar" element={<PerangkatAjarPage />} />
            <Route path="modul-ajar" element={<ModuleGenerator />} />
            <Route path="jurnal" element={<JurnalPage />} />
            <Route path="absensi" element={<AbsensiPage />} />
            <Route path="penilaian" element={<PenilaianPage />} />
            {/* Generators */}
            <Route path="buat-soal" element={<BuatSoal />} />
            <Route path="kktp" element={<KKTP />} />
            <Route path="rubrik" element={<RubrikPenilaian />} />
            <Route path="worksheet" element={<WorksheetGenerator />} />
            {/* Administration */}
            <Route path="kalender" element={<KalenderPendidikan />} />
            <Route path="analisis-hari-efektif" element={<AnalisisHariEfektif />} />
            <Route path="program-tahunan" element={<ProgramTahunan />} />
            <Route path="program-semester" element={<ProgramSemester />} />
            <Route path="mengajar-harian" element={<MengajarHarian />} />
            <Route path="jurnal-harian" element={<DailyJournal />} />
            <Route path="supervisi" element={<Supervisi />} />
            <Route path="laporan-kegiatan" element={<LaporanKegiatan />} />
            {/* Tools */}
            <Route path="barcode" element={<BarcodeGenerator />} />
            <Route path="kelompok" element={<GroupGenerator />} />
            {/* Admin */}
            <Route path="admin/users" element={<UsersPage />} />
            <Route path="admin/settings" element={<SettingsPage />} />
            <Route path="admin/maintenance" element={<MaintenancePage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
