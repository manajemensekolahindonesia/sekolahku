import { Link } from "react-router-dom";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen pb-16 px-4 sm:px-6 lg:px-8 bg-gray-50 pt-8">
      <div className="max-w-2xl mx-auto">
        <Link to="/" className="text-sm text-primary hover:underline mb-4 inline-block">&larr; Kembali</Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Kebijakan Privasi</h1>
        <p className="text-sm text-gray-400 mb-8">Terakhir diperbarui: 17 Juni 2026</p>

        <div className="space-y-6 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">1. Informasi yang Kami Kumpulkan</h2>
            <p>Kami mengumpulkan informasi berikut saat Anda menggunakan SekolahKu:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Nama dan alamat email dari akun Google Anda</li>
              <li>Foto profil (avatar) dari akun Google Anda</li>
              <li>Data yang Anda input ke dalam aplikasi (perangkat ajar, jurnal, absensi, penilaian)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">2. Penggunaan Informasi</h2>
            <p>Informasi yang kami kumpulkan digunakan untuk:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Mengidentifikasi dan mengautentikasi akun Anda</li>
              <li>Menyediakan dan memelihara layanan SekolahKu</li>
              <li>Menyimpan data pembelajaran yang Anda buat</li>
              <li>Meningkatkan pengalaman pengguna</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">3. Penyimpanan Data</h2>
            <p>Data Anda disimpan di Cloudflare D1 (SQLite) dengan enkripsi saat transit (TLS) dan saat istirahat. Kami tidak membagikan data Anda kepada pihak ketiga tanpa izin tertulis.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">4. Hak Anda</h2>
            <p>Anda berhak untuk:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Mengakses data yang kami simpan tentang Anda</li>
              <li>Meminta penghapusan data Anda</li>
              <li>Menarik persetujuan kapan saja</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">5. Kontak</h2>
            <p>Untuk pertanyaan tentang kebijakan privasi ini, hubungi kami di: <a href="mailto:manajemensekolahindonesia@gmail.com" className="text-primary hover:underline">manajemensekolahindonesia@gmail.com</a></p>
          </section>
        </div>
      </div>
    </div>
  );
}
