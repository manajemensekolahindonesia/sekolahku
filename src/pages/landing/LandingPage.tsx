import { Link } from "react-router-dom";
import {
  Sparkles, BookOpen, ClipboardCheck, GraduationCap,
  FileText, Check, ArrowRight,
} from "lucide-react";

const features = [
  {
    icon: Sparkles,
    title: "Perangkat Ajar AI",
    desc: "Buat modul ajar harian otomatis dengan AI. Pilih model teks & gambar, dapatkan hasil lengkap dengan ilustrasi.",
  },
  {
    icon: BookOpen,
    title: "Jurnal Pembelajaran",
    desc: "Catat kemajuan materi, aktivitas kelas, kendala, dan rencana tindak lanjut dalam satu tempat.",
  },
  {
    icon: ClipboardCheck,
    title: "Absensi Cepat",
    desc: "Presensi siswa dengan satu klik. Widget persentase kehadiran real-time dan riwayat lengkap.",
  },
  {
    icon: GraduationCap,
    title: "Penilaian & Rekap",
    desc: "Input nilai Tugas, UH, UTS, UAS. Hitung nilai akhir dan rata-rata kelas secara otomatis.",
  },
  {
    icon: FileText,
    title: "Cetak PDF & Excel",
    desc: "Ekspor rapor, absensi, dan rekap nilai ke PDF dengan KOP Sekolah kustom atau format Excel.",
  },
];

const pricing = [
  {
    name: "Gratis",
    price: "0",
    period: "selamanya",
    features: [
      "Perangkat Ajar AI (terbatas)",
      "Jurnal Pembelajaran",
      "Absensi (max 50 siswa)",
      "Penilaian Dasar",
      "3 akun pengguna",
    ],
    cta: "Mulai Gratis",
    popular: false,
  },
  {
    name: "Pro",
    price: "99.000",
    period: "/bulan",
    features: [
      "Akses AI Penuh (unlimited)",
      "Semua Fitur Aktif",
      "Absensi Unlimited",
      "Cetak PDF & Excel",
      "Rekap Nilai Otomatis",
      "50 akun pengguna",
    ],
    cta: "Coba Pro",
    popular: true,
  },
  {
    name: "Sekolah",
    price: "299.000",
    period: "/bulan",
    features: [
      "Semua Fitur Pro",
      "Multi-Admin Sekolah",
      "KOP Sekolah Custom",
      "Import/Export CSV",
      "Prioritas Support",
      "Unlimited akun",
    ],
    cta: "Hubungi Kami",
    popular: false,
  },
];

const payments = [
  { name: "GoPay", color: "bg-blue-50 text-blue-700", label: "GoPay" },
  { name: "OVO", color: "bg-purple-50 text-purple-700", label: "OVO" },
  { name: "DANA", color: "bg-cyan-50 text-cyan-700", label: "DANA" },
  { name: "ShopeePay", color: "bg-orange-50 text-orange-700", label: "ShopeePay" },
  { name: "BCA", color: "bg-gray-50 text-gray-700", label: "BCA" },
  { name: "Mandiri", color: "bg-yellow-50 text-yellow-700", label: "Mandiri" },
  { name: "BRI", color: "bg-blue-50 text-blue-700", label: "BRI" },
  { name: "BNI", color: "bg-teal-50 text-teal-700", label: "BNI" },
];

export default function LandingPage() {
  return (
    <div>
      {/* ====== HERO ====== */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Didukung Kecerdasan Buatan
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight">
            Manajemen Sekolah
            <br />
            <span className="text-primary">Lebih Cerdas & Efisien</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
            SekolahKu membantu guru dan staf mengelola perangkat ajar, jurnal pembelajaran,
            absensi, dan penilaian — didukung AI generatif untuk membuat modul ajar otomatis.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
            >
              Mulai Sekarang
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="#fitur"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
            >
              Lihat Fitur
            </a>
          </div>
          <div className="mt-12 p-2 bg-gray-100 rounded-2xl max-w-3xl mx-auto">
            <div className="bg-white rounded-xl p-6 sm:p-8 shadow-sm border border-gray-200">
              <div className="flex items-center gap-3 text-left">
                <div className="w-10 h-10 rounded-lg bg-green-100 text-green-700 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">AI Modul Generator</p>
                  <p className="text-xs text-gray-500">Ketik topik, pilih model AI, dapatkan modul ajar + ilustrasi siap pakai</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====== FEATURES ====== */}
      <section id="fitur" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Fitur Lengkap untuk Sekolah</h2>
            <p className="mt-4 text-gray-500 max-w-xl mx-auto">
              Semua yang Anda butuhkan untuk mengelola pembelajaran dalam satu platform terintegrasi.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="group bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md hover:border-primary/20 transition-all"
              >
                <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-colors">
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== PRICING ====== */}
      <section id="harga" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Pilih Paket Sesuai Kebutuhan</h2>
            <p className="mt-4 text-gray-500 max-w-xl mx-auto">
              Harga terjangkau untuk setiap skala — dari guru mandiri hingga institusi besar.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {pricing.map((p) => (
              <div
                key={p.name}
                className={`relative rounded-2xl border-2 p-6 flex flex-col ${
                  p.popular
                    ? "border-primary bg-white shadow-xl shadow-primary/10 scale-[1.02]"
                    : "border-gray-100 bg-white shadow-sm"
                }`}
              >
                {p.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-4 py-1 rounded-full">
                    PALING POPULER
                  </span>
                )}
                <h3 className="text-lg font-bold text-gray-900">{p.name}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-sm text-gray-500">Rp</span>
                  <span className="text-4xl font-extrabold text-gray-900">{p.price}</span>
                  <span className="text-sm text-gray-400">{p.period}</span>
                </div>
                <ul className="mt-6 space-y-3 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                      <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to={p.popular ? "/login" : "/login"}
                  className={`mt-6 block text-center py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    p.popular
                      ? "bg-primary text-white hover:bg-primary/90 shadow-md"
                      : "border border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== PAYMENT METHODS ====== */}
      <section id="pembayaran" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Metode Pembayaran</h2>
          <p className="mt-4 text-gray-500">E-Wallet dan transfer bank — pilih yang paling nyaman untuk Anda</p>
          <div className="mt-10 grid grid-cols-4 sm:grid-cols-4 gap-3 max-w-lg mx-auto">
            {payments.map((p) => (
              <div
                key={p.name}
                className={`${p.color} rounded-xl py-3 px-2 text-center text-xs sm:text-sm font-semibold`}
              >
                {p.label}
              </div>
            ))}
          </div>
          <p className="mt-6 text-xs text-gray-400">
            Pembayaran diproses aman melalui Midtrans &bull; PCI DSS Compliant
          </p>
        </div>
      </section>

      {/* ====== FOOTER ====== */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-gray-100">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <GraduationCap className="w-5 h-5 text-primary" />
            <span>SekolahKu &copy; {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <a href="#" className="hover:text-gray-600 transition-colors">Kebijakan Privasi</a>
            <a href="#" className="hover:text-gray-600 transition-colors">Syarat & Ketentuan</a>
            <a href="#" className="hover:text-gray-600 transition-colors">Bantuan</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
