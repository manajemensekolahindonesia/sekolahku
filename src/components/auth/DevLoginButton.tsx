import { useAuth } from "@/context/AuthContext";
import type { User } from "@/types";

const mockUsers: User[] = [
  {
    id: "dev-owner",
    email: "owner@sekolahku.dev",
    name: "Kepala Sekolah",
    role: "owner",
    avatar_url: null,
    google_id: null,
    subscription_id: "plan_sekolah",
    active_period_end: "2027-01-01",
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "dev-admin",
    email: "admin@sekolahku.dev",
    name: "Admin Sekolah",
    role: "admin",
    avatar_url: null,
    google_id: null,
    subscription_id: "plan_pro",
    active_period_end: "2027-01-01",
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "dev-guru",
    email: "guru@sekolahku.dev",
    name: "Budi Santoso",
    role: "guru",
    avatar_url: null,
    google_id: null,
    subscription_id: "plan_free",
    active_period_end: "2027-01-01",
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "dev-siswa",
    email: "siswa@sekolahku.dev",
    name: "Andi Pratama",
    role: "siswa",
    avatar_url: null,
    google_id: null,
    subscription_id: "plan_free",
    active_period_end: "2027-01-01",
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "dev-staf",
    email: "staf@sekolahku.dev",
    name: "Rini Oktaviani",
    role: "staf",
    avatar_url: null,
    google_id: null,
    subscription_id: "plan_free",
    active_period_end: "2027-01-01",
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const roleLabels: Record<string, string> = {
  owner: "Owner (Kepsek)",
  admin: "Admin",
  guru: "Guru",
  siswa: "Siswa",
  staf: "Staf",
};

export function DevLoginButton() {
  const { login } = useAuth();
  const isDev = import.meta.env.DEV;

  const handleLogin = (user: User) => {
    login(user);
  };

  if (!isDev) return null;

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-amber-200" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-3 text-amber-600 font-medium uppercase tracking-wider">
            DEV MODE — Pilih Role
          </span>
        </div>
      </div>
      <div className="space-y-2">
        {mockUsers.map((user) => (
          <button
            key={user.id}
            onClick={() => handleLogin(user)}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg border border-gray-200 hover:border-primary hover:bg-primary/5 transition-all text-left group"
          >
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold group-hover:bg-primary group-hover:text-white transition-colors">
              {user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
              <p className="text-xs text-gray-400">{user.email}</p>
            </div>
            <span className="text-[10px] font-bold uppercase bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
              {roleLabels[user.role] || user.role}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
