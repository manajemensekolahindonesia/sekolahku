import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useSidebar } from "@/context/SidebarContext";
import type { UserRole } from "@/types";
import {
  LayoutDashboard, Sparkles, BookOpen, ClipboardCheck, GraduationCap,
  Users, Settings, AlertTriangle, LogOut, School, FileText,
  Calendar, Clock, Target, Star, QrCode, Users2,
  BookMarked, BarChart3, ScrollText, ClipboardList, FileSpreadsheet,
  ChevronLeft, ChevronRight, Lightbulb, Globe, Briefcase, TrendingUp, Receipt, History,
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
  { label: "Modul P5",      path: "/dashboard/modul-p5",     icon: Lightbulb,        roles: ["owner", "admin", "guru"] },
  { label: "Kokurikuler",   path: "/dashboard/modul-kokurikuler", icon: Globe,       roles: ["owner", "admin", "guru"] },
  { label: "Deep Learning", path: "/dashboard/deep-learning", icon: TrendingUp,     roles: ["owner", "admin", "guru"] },
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
  { label: "SNP",            path: "/dashboard/snp",                  icon: Globe,         roles: ["owner", "admin"] },
  { label: "Evaluasi Mutu",  path: "/dashboard/evaluasi-mutu",         icon: TrendingUp,    roles: ["owner", "admin"] },
  { label: "Advisor",        path: "/dashboard/strategic-advisor",    icon: Briefcase,     roles: ["owner", "admin"] },
  { label: "Reports",        path: "/dashboard/reports",              icon: BarChart3,     roles: ["owner", "admin"] },
];

const toolsNav: NavItem[] = [
  { label: "Barcode",        path: "/dashboard/barcode",           icon: QrCode,         roles: ["owner", "admin", "guru", "staf"] },
  { label: "Kelompok",       path: "/dashboard/kelompok",          icon: Users2,         roles: ["owner", "admin", "guru"] },
  { label: "Invoice",        path: "/dashboard/invoice",           icon: Receipt,        roles: ["owner", "admin"] },
  { label: "Changelog",      path: "/dashboard/changelog",         icon: History,        roles: ["owner", "admin", "guru", "staf"] },
];

const systemNav: NavItem[] = [
  { label: "Pengguna",       path: "/dashboard/admin/users",      icon: Users,          roles: ["owner", "admin"] },
  { label: "Pengaturan",     path: "/dashboard/admin/settings",   icon: Settings,       roles: ["owner", "admin"] },
  { label: "Maintenance",    path: "/dashboard/admin/maintenance", icon: AlertTriangle,  roles: ["owner"] },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { collapsed, toggle } = useSidebar();
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
        {!collapsed && (
          <div className="pt-4 pb-1 px-3">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest whitespace-nowrap overflow-hidden">
              {title}
            </p>
          </div>
        )}
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/dashboard"}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg text-sm transition-colors whitespace-nowrap overflow-hidden",
                collapsed ? "px-2 py-2.5 justify-center" : "px-3 py-2.5",
                isActive
                  ? "bg-primary/20 text-white font-medium"
                  : "text-gray-400 hover:bg-gray-800 hover:text-gray-100"
              )
            }
          >
            <item.icon className="w-4 h-4 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </>
    );
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 bottom-0 bg-gray-950 text-gray-200 flex flex-col z-40 transition-all duration-200",
        collapsed ? "w-14" : "w-60"
      )}
    >
      {/* Logo */}
      <div className={cn("h-16 flex items-center border-b border-gray-800", collapsed ? "px-3 justify-center" : "px-5 gap-3")}>
        <School className="w-6 h-6 text-primary shrink-0" />
        {!collapsed && <span className="font-bold text-white text-lg">SekolahKu</span>}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2 space-y-1
        [&::-webkit-scrollbar]:w-1
        [&::-webkit-scrollbar-track]:bg-transparent
        [&::-webkit-scrollbar-thumb]:bg-gray-700
        [&::-webkit-scrollbar-thumb]:rounded-full
        hover:[&::-webkit-scrollbar-thumb]:bg-gray-600
        scrollbar-gutter-stable">
        {renderSection("Utama", filteredNav)}
        {renderSection("Administrasi", filteredAdmin)}
        {renderSection("Tools", filteredTools)}
        {renderSection("Sistem", filteredSystem)}
      </nav>

      {/* User & Logout */}
      <div className="border-t border-gray-800 p-2">
        {!collapsed && (
          <div className="flex items-center gap-3 px-2 py-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shrink-0">
              {user?.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-200 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize truncate">{role}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center gap-2 rounded-lg text-sm text-gray-500 hover:bg-gray-800 hover:text-red-400 transition-colors w-full",
            collapsed ? "px-2 py-2 justify-center" : "px-3 py-2"
          )}
          title="Keluar"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && "Keluar"}
        </button>
      </div>

      {/* Toggle Button */}
      <button
        onClick={toggle}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-gray-700 border border-gray-600 text-gray-400 hover:text-white hover:bg-gray-600 flex items-center justify-center transition-colors"
        title={collapsed ? "Buka sidebar" : "Tutup sidebar"}
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </aside>
  );
}
