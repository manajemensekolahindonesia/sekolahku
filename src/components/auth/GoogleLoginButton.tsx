import { useState } from "react";
import { AlertTriangle, Info } from "lucide-react";

export function GoogleLoginButton() {
  const [error, setError] = useState("");
  const isDev = import.meta.env.DEV;

  const handleLogin = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    if (!clientId || clientId.includes("your-google")) {
      setError("Google Client ID belum dikonfigurasi. Gunakan Dev Mode Login di bawah.");
      return;
    }

    const redirectUri = `${window.location.origin}/auth/callback`;
    const scope = "openid email profile";
    const url =
      `https://accounts.google.com/o/oauth2/v2/auth` +
      `?client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent(scope)}` +
      `&prompt=select_account`;

    window.location.href = url;
  };

  return (
    <div className="w-full">
      <button
        onClick={handleLogin}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-colors shadow-sm"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Masuk dengan Google
      </button>

      {isDev && (
        <div className="mt-2 flex items-start gap-2 p-2 rounded-lg bg-blue-50 border border-blue-100 text-xs text-blue-700">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <p>Login Google butuh backend Functions (<code className="bg-blue-100 px-1 rounded">npx wrangler pages dev</code>). Untuk lokal, gunakan <strong>Dev Mode Login</strong> di bawah.</p>
        </div>
      )}

      {error && (
        <div className="mt-3 flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <p className="text-xs">{error}</p>
        </div>
      )}
    </div>
  );
}
