import { Link } from "react-router-dom";

export default function TermsPage() {
  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-2xl mx-auto">
        <Link to="/" className="text-sm text-primary hover:underline mb-4 inline-block">&larr; Kembali</Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Syarat & Ketentuan</h1>
        <p className="text-sm text-gray-400 mb-8">Terakhir diperbarui: 17 Juni 2026</p>

        <div className="space-y-6 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">1. Penerimaan Ketentuan</h2>
            <p>Dengan mengakses dan menggunakan SekolahKu, Anda menyetujui syarat dan ketentuan ini. Jika Anda tidak setuju, jangan gunakan layanan ini.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">2. Akun Pengguna</h2>
            <p>Anda bertanggung jawab menjaga kerahasiaan akun Anda. Anda setuju untuk memberikan informasi yang akurat dan terkini saat mendaftar.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">3. Penggunaan Layanan</h2>
            <p>SekolahKu disediakan untuk keperluan manajemen pendidikan. Anda setuju untuk:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Tidak menyalahgunakan layanan untuk aktivitas ilegal</li>
              <li>Tidak mengunggah konten yang melanggar hak orang lain</li>
              <li>Tidak mencoba mengakses data pengguna lain tanpa izin</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">4. Berlangganan & Pembayaran</h2>
            <p>Paket berbayar ditagih sesuai periode yang dipilih. Pembatalan dapat dilakukan kapan saja. Tidak ada pengembalian dana untuk periode yang sudah berjalan.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">5. Batasan Tanggung Jawab</h2>
            <p>SekolahKu disediakan "sebagaimana adanya". Kami tidak bertanggung jawab atas kerugian tidak langsung yang timbul dari penggunaan layanan ini.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">6. Perubahan Ketentuan</h2>
            <p>Kami dapat memperbarui syarat ini sewaktu-waktu. Perubahan akan diumumkan melalui aplikasi atau email. Penggunaan berkelanjutan setelah perubahan berarti Anda menyetujui ketentuan baru.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">7. Kontak</h2>
            <p><a href="mailto:manajemensekolahindonesia@gmail.com" className="text-primary hover:underline">manajemensekolahindonesia@gmail.com</a></p>
          </section>
        </div>
      </div>
    </div>
  );
}
