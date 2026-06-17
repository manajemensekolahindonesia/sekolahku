import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
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
import ModulP5 from "@/pages/dashboard/modul-p5/ModulP5";
import ModulKokurikuler from "@/pages/dashboard/modul-kokurikuler/ModulKokurikuler";
import DeepLearningPlan from "@/pages/dashboard/deep-learning/DeepLearningPlan";
import SNP from "@/pages/dashboard/snp/SNP";
import EvaluasiMutu from "@/pages/dashboard/evaluasi-mutu/EvaluasiMutu";
import StrategicAdvisor from "@/pages/dashboard/strategic-advisor/StrategicAdvisor";
import Reports from "@/pages/dashboard/reports/Reports";
import InvoiceGenerator from "@/pages/dashboard/invoice/InvoiceGenerator";
import ChangelogPage from "@/pages/dashboard/changelog/Changelog";
import AdminPanel from "@/pages/dashboard/admin/AdminPanel";
import Chatbot from "@/pages/dashboard/chatbot/Chatbot";
import QuickProfile from "@/components/QuickProfile";
import { X, Sparkles, LogIn, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toaster } from "react-hot-toast";

function ModalOverlays() {
  const { showLoginModal, showPremiumModal, showWelcome, setShowLoginModal, setShowPremiumModal, setShowWelcome, isAuthenticated } = useAuth();

  return (
    <>
      {/* Welcome Popup — hanya untuk user BELUM login DAN belum pernah lihat */}
      {showWelcome && !isAuthenticated && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
            <button onClick={() => setShowWelcome(false)} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Selamat Datang di SekolahKu!</h2>
              <p className="text-sm text-gray-500 mb-6">
                Platform manajemen sekolah dengan AI. Buat modul ajar, soal, absensi, dan lainnya dalam hitungan detik.
              </p>
              <div className="grid grid-cols-3 gap-2 mb-6 text-xs">
                {["Modul Ajar AI", "Buat Soal", "Absensi Cepat", "KKTP & Rubrik", "Kalender", "Worksheet"].map((f) => (
                  <div key={f} className="bg-gray-50 rounded-lg p-2 text-gray-600 font-medium">{f}</div>
                ))}
              </div>
              <Button onClick={() => { setShowWelcome(false); try { localStorage.setItem("welcome_seen", "true"); } catch {} window.location.href = "/login"; }} className="w-full">
                Mulai Sekarang
              </Button>
              <Button variant="ghost" onClick={() => { setShowWelcome(false); try { localStorage.setItem("welcome_seen", "true"); } catch {} }} className="w-full mt-2">
                Lanjutkan
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Premium Lock Modal */}
      {showPremiumModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
            <button onClick={() => setShowPremiumModal(false)} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4">
                <Crown className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Token Harian Habis</h2>
              <p className="text-sm text-gray-500 mb-4">
                Anda telah menggunakan 2 token gratis hari ini. Upgrade ke paket Premium untuk akses tanpa batas.
              </p>
              <div className="bg-amber-50 rounded-lg p-3 mb-4 text-sm text-amber-800">
                <strong>Premium</strong> — Rp 99.000/bulan<br />
                Akses AI tanpa batas + semua fitur
              </div>
              <Button onClick={() => setShowPremiumModal(false)} variant="outline" className="w-full">
                Nanti Saja
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Login Required Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
            <button onClick={() => setShowLoginModal(false)} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-4">
                <LogIn className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Login Diperlukan</h2>
              <p className="text-sm text-gray-500 mb-6">
                Silakan login terlebih dahulu untuk menggunakan fitur AI.
              </p>
              <Button onClick={() => { setShowLoginModal(false); window.location.href = "/login"; }} className="w-full">
                Login Sekarang
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

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

          {/* Auth Callback */}
          <Route path="/auth/callback" element={<AuthCallbackPage />} />

          {/* Dashboard Routes */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardHome />} />
            <Route path="perangkat-ajar" element={<PerangkatAjarPage />} />
            <Route path="modul-ajar" element={<ModuleGenerator />} />
            <Route path="buat-soal" element={<BuatSoal />} />
            <Route path="jurnal" element={<JurnalPage />} />
            <Route path="jurnal-harian" element={<DailyJournal />} />
            <Route path="absensi" element={<AbsensiPage />} />
            <Route path="penilaian" element={<PenilaianPage />} />
            <Route path="kktp" element={<KKTP />} />
            <Route path="rubrik" element={<RubrikPenilaian />} />
            <Route path="worksheet" element={<WorksheetGenerator />} />
            <Route path="kalender" element={<KalenderPendidikan />} />
            <Route path="analisis-hari-efektif" element={<AnalisisHariEfektif />} />
            <Route path="program-tahunan" element={<ProgramTahunan />} />
            <Route path="program-semester" element={<ProgramSemester />} />
            <Route path="mengajar-harian" element={<MengajarHarian />} />
            <Route path="supervisi" element={<Supervisi />} />
            <Route path="laporan-kegiatan" element={<LaporanKegiatan />} />
            <Route path="modul-p5" element={<ModulP5 />} />
            <Route path="modul-kokurikuler" element={<ModulKokurikuler />} />
            <Route path="deep-learning" element={<DeepLearningPlan />} />
            <Route path="snp" element={<SNP />} />
            <Route path="evaluasi-mutu" element={<EvaluasiMutu />} />
            <Route path="strategic-advisor" element={<StrategicAdvisor />} />
            <Route path="reports" element={<Reports />} />
            <Route path="barcode" element={<BarcodeGenerator />} />
            <Route path="kelompok" element={<GroupGenerator />} />
            <Route path="invoice" element={<InvoiceGenerator />} />
            <Route path="changelog" element={<ChangelogPage />} />
            <Route path="admin" element={<AdminPanel />} />
          </Route>
        </Routes>
        <ModalOverlays />
        <Toaster position="top-center" />
        <Chatbot isOpen={false} onClose={() => {}} />
      </BrowserRouter>
    </AuthProvider>
  );
}
