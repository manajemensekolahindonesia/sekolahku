import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import type { UserRole } from "@/types";
import {
  LayoutDashboard, Sparkles, BookOpen, ClipboardCheck, GraduationCap,
  Users, Settings, AlertTriangle, LogOut, School,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  path: string;
  icon: typeof LayoutDashboard;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  { label: "Dashboard",   path: "/dashboard",                icon: LayoutDashboard,  roles: ["owner", "admin", "guru", "siswa", "staf"] },
  { label: "Perangkat Ajar", path: "/dashboard/perangkat-ajar", icon: Sparkles,      roles: ["owner", "admin", "guru"] },
  { label: "Jurnal",      path: "/dashboard/jurnal",          icon: BookOpen,         roles: ["owner", "admin", "guru"] },
  { label: "Absensi",     path: "/dashboard/absensi",         icon: ClipboardCheck,   roles: ["owner", "admin", "guru", "staf"] },
  { label: "Penilaian",   path: "/dashboard/penilaian",       icon: GraduationCap,    roles: ["owner", "admin", "guru", "staf"] },
];

const adminItems: NavItem[] = [
  { label: "Pengguna",    path: "/dashboard/admin/users",     icon: Users,            roles: ["owner", "admin"] },
  { label: "Pengaturan",  path: "/dashboard/admin/settings",  icon: Settings,         roles: ["owner", "admin"] },
  { label: "Maintenance", path: "/dashboard/admin/maintenance", icon: AlertTriangle,  roles: ["owner"] },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const role = user?.role || "guru";

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const filteredNav = navItems.filter((item) => item.roles.includes(role));
  const filteredAdmin = adminItems.filter((item) => item.roles.includes(role));

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-60 bg-gray-950 text-gray-200 flex flex-col z-40">
      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-gray-800">
        <School className="w-6 h-6 text-primary shrink-0" />
        <span className="font-bold text-white text-lg">SekolahKu</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {filteredNav.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/dashboard"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                isActive
                  ? "bg-primary/20 text-white font-medium"
                  : "text-gray-400 hover:bg-gray-800 hover:text-gray-100"
              )
            }
          >
            <item.icon className="w-4 h-4 shrink-0" />
            {item.label}
          </NavLink>
        ))}

        {filteredAdmin.length > 0 && (
          <>
            <div className="pt-4 pb-1 px-3">
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">
                Administrasi
              </p>
            </div>
            {filteredAdmin.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                    isActive
                      ? "bg-primary/20 text-white font-medium"
                      : "text-gray-400 hover:bg-gray-800 hover:text-gray-100"
                  )
                }
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {item.label}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* User & Logout */}
      <div className="border-t border-gray-800 p-3">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shrink-0">
            {user?.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "U"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-200 truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 capitalize truncate">{role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-800 hover:text-red-400 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Keluar
        </button>
      </div>
    </aside>
  );
}
