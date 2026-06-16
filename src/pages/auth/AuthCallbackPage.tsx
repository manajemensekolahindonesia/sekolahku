import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import type { UserRole, UserStatus } from "@/types";
import { Loader2, AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [state, setState] = useState<"loading" | "error" | "no-backend">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const error = params.get("error");

    // Google returned an error (user denied, etc.)
    if (error) {
      setState("error");
      setErrorMsg(`Login dibatalkan atau ditolak oleh Google (${error}).`);
      return;
    }

    if (!code) {
      setState("error");
      setErrorMsg("Kode otorisasi tidak ditemukan. Silakan coba login kembali dari halaman login.");
      return;
    }

    (async () => {
      try {
        const res = await fetch("/api/auth-callback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });

        // Backend not available (likely running frontend-only without Functions)
        if (res.status === 404 || res.type === "opaqueredirect") {
          setState("no-backend");
          return;
        }

        const data = await res.json() as {
          success?: boolean;
          error?: string;
          user?: {
            id: string; email: string; name: string; role: string; status: string;
            avatar_url: string | null; active_period_end: string | null;
            created_at: string; updated_at: string;
          };
        };

        if (!res.ok || !data.success) {
          throw new Error(data.error || `Server error (${res.status})`);
        }

        if (data.user) {
          login({
            id: data.user.id,
            email: data.user.email,
            name: data.user.name,
            role: data.user.role as UserRole,
            status: data.user.status as UserStatus,
            avatar_url: data.user.avatar_url,
            google_id: null,
            subscription_id: null,
            active_period_end: data.user.active_period_end,
            created_at: data.user.created_at,
            updated_at: data.user.updated_at,
          });
          navigate("/dashboard", { replace: true });
        }
      } catch (err) {
        setState("error");
        const msg = err instanceof Error ? err.message : "Gagal terhubung ke server";
        if (msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
          setErrorMsg("Tidak dapat terhubung ke server backend. Pastikan Cloudflare Functions berjalan (wranger pages dev).");
        } else if (msg.includes("token exchange failed") || msg.includes("invalid_grant")) {
          setErrorMsg("Sesi login kadaluarsa atau kode sudah digunakan. Silakan login ulang.");
        } else {
          setErrorMsg(msg);
        }
      }
    })();
  }, [login, navigate]);

  // --- Loading ---
  if (state === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
          <p className="mt-4 text-sm text-gray-500">Memproses login Google...</p>
          <p className="mt-1 text-xs text-gray-400">Mohon tunggu sebentar</p>
        </div>
      </div>
    );
  }

  // --- No Backend (running frontend-only) ---
  if (state === "no-backend") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Backend Tidak Tersedia</h3>
            <p className="mt-2 text-sm text-gray-500">
              Cloudflare Functions (backend API) tidak berjalan. Login Google memerlukan backend untuk menukar token.
            </p>
            <div className="mt-4 bg-gray-50 rounded-lg p-3 text-left">
              <p className="text-xs font-semibold text-gray-700 mb-1">Solusi:</p>
              <ol className="text-xs text-gray-500 space-y-1 list-decimal list-inside">
                <li>Gunakan <strong>Dev Mode Login</strong> dari halaman login</li>
                <li>Atau jalankan backend: <code className="bg-gray-200 px-1 rounded">npx wrangler pages dev</code></li>
              </ol>
            </div>
            <Link
              to="/login"
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors"
            >
              <Home className="w-4 h-4" />
              Kembali ke Login
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- Error ---
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-md w-full border-red-200">
        <CardContent className="p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Login Gagal</h3>
          <p className="mt-2 text-sm text-gray-500">{errorMsg}</p>

          <div className="mt-6 flex flex-col gap-2">
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Coba Login Lagi
            </Link>
            <Link
              to="/"
              className="text-xs text-gray-400 hover:text-primary transition-colors"
            >
              Kembali ke Beranda
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
