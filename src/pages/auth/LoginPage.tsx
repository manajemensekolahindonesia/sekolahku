import { GraduationCap, Shield, AlertTriangle } from "lucide-react";
import { GoogleLoginButton } from "@/components/auth/GoogleLoginButton";
import { DevLoginButton } from "@/components/auth/DevLoginButton";
import { Card, CardContent } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary to-blue-800 items-center justify-center p-12">
        <div className="max-w-md text-white">
          <GraduationCap className="w-16 h-16 mb-6 opacity-80" />
          <h2 className="text-3xl font-bold mb-4">Selamat Datang di SekolahKu</h2>
          <p className="text-lg text-blue-100 leading-relaxed">
            Platform manajemen sekolah terintegrasi dengan AI. Kelola perangkat ajar, absensi, jurnal, dan penilaian dalam satu tempat.
          </p>
          <div className="mt-8 space-y-3 text-sm text-blue-200">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Google OAuth — Login Aman
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Data Terenkripsi End-to-End
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="max-w-sm w-full">
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <GraduationCap className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold text-gray-900">SekolahKu</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 text-center">Masuk ke Akun</h1>
          <p className="mt-2 text-sm text-gray-500 text-center">
            Gunakan akun Google atau pilih role untuk development
          </p>

          <div className="mt-8 space-y-4">
            <GoogleLoginButton />

            {/* Error handling — show if Google login fails */}
            <Card className="border-amber-200 bg-amber-50 hidden" id="auth-error-card">
              <CardContent className="p-3 flex items-start gap-2 text-sm text-amber-800">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Tidak dapat login?</p>
                  <p className="text-xs text-amber-600 mt-0.5">
                    Pastikan akun Google Anda terdaftar atau gunakan mode development di bawah.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Dev Mode Login */}
            <DevLoginButton />
          </div>

          <p className="mt-6 text-xs text-gray-400 text-center">
            Dengan masuk, Anda menyetujui Syarat & Ketentuan dan Kebijakan Privasi kami.
          </p>

          <div className="mt-6 p-3 rounded-lg bg-gray-50 border border-gray-100">
            <p className="text-xs text-gray-400 text-center leading-relaxed">
              <strong className="text-gray-500">Catatan Dev:</strong> Saat berjalan di localhost,
              tombol login Google akan redirect ke halaman callback. Pastikan Anda sudah
              mengkonfigurasi <code className="bg-gray-200 px-1 rounded">.env</code> dan
              Cloudflare Functions berjalan ({import.meta.env.DEV ? "atau gunakan tombol Dev Mode di atas" : ""}).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
