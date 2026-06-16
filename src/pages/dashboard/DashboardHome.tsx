import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, BookOpen, ClipboardCheck, GraduationCap, Users } from "lucide-react";

const stats = [
  { label: "Perangkat Ajar", value: "—", icon: Sparkles, color: "text-blue-600 bg-blue-50" },
  { label: "Jurnal", value: "—", icon: BookOpen, color: "text-emerald-600 bg-emerald-50" },
  { label: "Kehadiran", value: "—%", icon: ClipboardCheck, color: "text-amber-600 bg-amber-50" },
  { label: "Rata Nilai", value: "—", icon: GraduationCap, color: "text-purple-600 bg-purple-50" },
];

const adminStats = [
  { label: "Total Pengguna", value: "—", icon: Users, color: "text-indigo-600 bg-indigo-50" },
];

export default function DashboardHome() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Selamat datang, {user?.name?.split(" ")[0]}!
        </h2>
        <p className="text-gray-500 mt-1 capitalize">
          Anda login sebagai <span className="font-semibold text-gray-700">{user?.role}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">{s.label}</CardTitle>
              <div className={`w-8 h-8 rounded-lg ${s.color} flex items-center justify-center`}>
                <s.icon className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {(user?.role === "owner" || user?.role === "admin") && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {adminStats.map((s) => (
            <Card key={s.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">{s.label}</CardTitle>
                <div className={`w-8 h-8 rounded-lg ${s.color} flex items-center justify-center`}>
                  <s.icon className="w-4 h-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{s.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader><CardTitle>Aktivitas Terbaru</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-gray-400">Belum ada aktivitas. Mulai dengan membuat perangkat ajar atau mencatat jurnal.</p>
        </CardContent>
      </Card>
    </div>
  );
}
