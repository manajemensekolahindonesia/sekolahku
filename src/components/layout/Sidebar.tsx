import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import type { UserRole } from "@/types";
import {
  LayoutDashboard, Sparkles, BookOpen, ClipboardCheck, GraduationCap,
  Users, Settings, AlertTriangle, LogOut, School, FileText,
  Calendar, Clock, Target, Star, QrCode, Users2, Pencil,
  BookMarked, BarChart3, ScrollText, ClipboardList, FileSpreadsheet,
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
  { label: "Modul Ajar AI", path: "/dashboard/modul-ajar",   icon: Sparkles,         roles: ["owner", "admin", "guru"] },
  { label: "Perangkat Ajar", path: "/dashboard/perangkat-ajar", icon: BookMarked,    roles: ["owner", "admin", "guru"] },
  { label: "Buat Soal",     path: "/dashboard/buat-soal",    icon: FileText,         roles: ["owner", "admin", "guru"] },
  { label: "Jurnal",        path: "/dashboard/jurnal",       icon: BookOpen,         roles: ["owner", "admin", "guru"] },
  { label: "Absensi",       path: "/dashboard/absensi",      icon: ClipboardCheck,   roles: ["owner", "admin", "guru", "staf"] },
  { label: "Penilaian",     path: "/dashboard/penilaian",    icon: GraduationCap,    roles: ["owner", "admin", "guru", "staf"] },
  { label: "KKTP",          path: "/dashboard/kktp",         icon: Target,           roles: ["owner", "admin", "guru"] },
  { label: "Rubrik",        path: "/dashboard/rubrik",       icon: Star,             roles: ["owner", "admin", "guru"] },
  { label: "Worksheet",     path: "/dashboard/worksheet",    icon: ScrollText,       roles: ["owner", "admin", "guru"] },
];

const adminNav: NavItem[] = [
  { label: "Kalender",       path: "/dashboard/kalender",            icon: Calendar,      roles: ["owner", "admin", "guru"] },
  { label: "Hari Efektif",   path: "/dashboard/analisis-hari-efektif", icon: Clock,       roles: ["owner", "admin", "guru"] },
  { label: "Program Tahunan", path: "/dashboard/program-tahunan",    icon: BarChart3,     roles: ["owner", "admin", "guru"] },
  { label: "Program Semester", path: "/dashboard/program-semester",  icon: FileSpreadsheet, roles: ["owner", "admin", "guru"] },
  { label: "Mengajar Harian", path: "/dashboard/mengajar-harian",    icon: ClipboardList, roles: ["owner", "admin", "guru"] },
  { label: "Jurnal Harian",  path: "/dashboard/jurnal-harian",      icon: BookMarked,    roles: ["owner", "admin", "guru"] },
  { label: "Supervisi",      path: "/dashboard/supervisi",          icon: Users2,        roles: ["owner", "admin", "guru"] },
  { label: "Laporan",        path: "/dashboard/laporan-kegiatan",    icon: FileText,      roles: ["owner", "admin", "guru"] },
];

const toolsNav: NavItem[] = [
  { label: "Barcode",        path: "/dashboard/barcode",           icon: QrCode,         roles: ["owner", "admin", "guru", "staf"] },
  { label: "Kelompok",       path: "/dashboard/kelompok",          icon: Users2,         roles: ["owner", "admin", "guru"] },
];

const systemNav: NavItem[] = [
  { label: "Pengguna",       path: "/dashboard/admin/users",      icon: Users,          roles: ["owner", "admin"] },
  { label: "Pengaturan",     path: "/dashboard/admin/settings",   icon: Settings,       roles: ["owner", "admin"] },
  { label: "Maintenance",    path: "/dashboard/admin/maintenance", icon: AlertTriangle,  roles: ["owner"] },
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
  const filteredAdmin = adminNav.filter((item) => item.roles.includes(role));
  const filteredTools = toolsNav.filter((item) => item.roles.includes(role));
  const filteredSystem = systemNav.filter((item) => item.roles.includes(role));

  const renderSection = (title: string, items: NavItem[]) => {
    if (items.length === 0) return null;
    return (
      <>
        <div className="pt-4 pb-1 px-3">
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">{title}</p>
        </div>
        {items.map((item) => (
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
      </>
    );
  };

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-60 bg-gray-950 text-gray-200 flex flex-col z-40">
      <div className="h-16 flex items-center gap-3 px-5 border-b border-gray-800">
        <School className="w-6 h-6 text-primary shrink-0" />
        <span className="font-bold text-white text-lg">SekolahKu</span>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {renderSection("Utama", filteredNav)}
        {renderSection("Administrasi", filteredAdmin)}
        {renderSection("Tools", filteredTools)}
        {renderSection("Sistem", filteredSystem)}
      </nav>

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
