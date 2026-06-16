import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

const labels: Record<string, string> = {
  dashboard: "Dashboard",
  "perangkat-ajar": "Perangkat Ajar AI",
  "modul-ajar": "Modul Ajar AI",
  "buat-soal": "Buat Soal",
  jurnal: "Jurnal Pembelajaran",
  absensi: "Absensi Siswa",
  penilaian: "Penilaian & Rekap",
  kktp: "KKTP",
  rubrik: "Rubrik Penilaian",
  worksheet: "Lembar Kerja (LKPD)",
  kalender: "Kalender Pendidikan",
  "analisis-hari-efektif": "Analisis Hari Efektif",
  "program-tahunan": "Program Tahunan",
  "program-semester": "Program Semester",
  "mengajar-harian": "Mengajar Harian",
  "jurnal-harian": "Jurnal Harian",
  supervisi: "Supervisi Akademik",
  "laporan-kegiatan": "Laporan Kegiatan",
  "modul-p5": "Modul P5",
  "modul-kokurikuler": "Modul Kokurikuler",
  "deep-learning": "Deep Learning Plan",
  snp: "SNP (Standar Nasional Pendidikan)",
  "evaluasi-mutu": "Evaluasi Mutu",
  "strategic-advisor": "Strategic Advisor",
  reports: "Reports",
  invoice: "Invoice Generator",
  changelog: "Changelog",
  barcode: "Barcode Generator",
  kelompok: "Pembagian Kelompok",
  admin: "Admin",
  users: "Pengguna",
  settings: "Pengaturan",
  maintenance: "Maintenance",
  profil: "Profil",
};

export default function DashboardHeader() {
  const location = useLocation();

  const segments = location.pathname.split("/").filter(Boolean);
  const breadcrumbs = segments.map((seg, i) => ({
    label: labels[seg] || seg.charAt(0).toUpperCase() + seg.slice(1),
    path: "/" + segments.slice(0, i + 1).join("/"),
    last: i === segments.length - 1,
  }));

  const title = breadcrumbs[breadcrumbs.length - 1]?.label || "Dashboard";

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-6">
        <div>
          <h1 className="text-lg font-bold text-gray-900">{title}</h1>
          <nav className="flex items-center gap-1 mt-0.5 text-xs text-gray-400">
            <Link to="/dashboard" className="hover:text-primary transition-colors flex items-center gap-1">
              <Home className="w-3 h-3" />
            </Link>
            {breadcrumbs.map((crumb) => (
              <span key={crumb.path} className="flex items-center gap-1">
                <ChevronRight className="w-3 h-3" />
                {crumb.last ? (
                  <span className="text-gray-600 font-medium">{crumb.label}</span>
                ) : (
                  <Link to={crumb.path} className="hover:text-primary transition-colors">
                    {crumb.label}
                  </Link>
                )}
              </span>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 hidden sm:block">
            {new Date().toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </span>
        </div>
      </div>
    </header>
  );
}
