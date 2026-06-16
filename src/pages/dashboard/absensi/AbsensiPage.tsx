import { useState, useMemo } from "react";
import { Users, FileText, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { exportAbsensiPDF, exportToExcel } from "@/lib/export";

interface Student {
  id: string;
  name: string;
  nis: string;
}

interface AttendanceRecord {
  student_id: string;
  status: "Hadir" | "Sakit" | "Izin" | "Alfa" | "Terlambat";
}

const mockStudents: Student[] = [
  { id: "1", name: "Ahmad Fauzi", nis: "2024001" },
  { id: "2", name: "Bunga Lestari", nis: "2024002" },
  { id: "3", name: "Citra Dewi", nis: "2024003" },
  { id: "4", name: "Dimas Arifin", nis: "2024004" },
  { id: "5", name: "Eka Prasetyo", nis: "2024005" },
  { id: "6", name: "Fitri Handayani", nis: "2024006" },
  { id: "7", name: "Gilang Ramadhan", nis: "2024007" },
  { id: "8", name: "Hana Safira", nis: "2024008" },
];

const statusOptions = [
  { value: "Hadir" as const, label: "Hadir", color: "bg-emerald-500 text-white" },
  { value: "Terlambat" as const, label: "Terlambat", color: "bg-amber-500 text-white" },
  { value: "Sakit" as const, label: "Sakit", color: "bg-blue-500 text-white" },
  { value: "Izin" as const, label: "Izin", color: "bg-purple-500 text-white" },
  { value: "Alfa" as const, label: "Alfa", color: "bg-red-500 text-white" },
];

export default function AbsensiPage() {
  const [records, setRecords] = useState<AttendanceRecord[]>(
    mockStudents.map((s) => ({ student_id: s.id, status: "Hadir" as const }))
  );
  const [selectedKelas] = useState("VII-A");
  const [date] = useState(new Date().toISOString().split("T")[0]);

  const toggleStatus = (studentId: string, status: "Hadir" | "Sakit" | "Izin" | "Alfa" | "Terlambat") => {
    setRecords((prev) =>
      prev.map((r) => (r.student_id === studentId ? { ...r, status } : r))
    );
  };

  const stats = useMemo(() => {
    const total = records.length;
    const hadir = records.filter((r) => r.status === "Hadir" || r.status === "Terlambat").length;
    const sakit = records.filter((r) => r.status === "Sakit").length;
    const izin = records.filter((r) => r.status === "Izin").length;
    const alfa = records.filter((r) => r.status === "Alfa").length;
    return { total, hadir, sakit, izin, alfa, percentage: total ? Math.round((hadir / total) * 100) : 0 };
  }, [records]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Absensi Siswa</h2>
          <p className="text-gray-500 mt-1">Kelas {selectedKelas} &bull; {date}</p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const data = mockStudents.map((s) => {
                const rec = records.find((r) => r.student_id === s.id);
                return { name: s.name, nis: s.nis, status: rec?.status || "—" };
              });
              exportAbsensiPDF(data, selectedKelas, date);
            }}
          >
            <FileText className="w-4 h-4 mr-1" /> PDF
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const data = mockStudents.map((s) => {
                const rec = records.find((r) => r.student_id === s.id);
                return { Nama: s.name, NIS: s.nis, Status: rec?.status || "—" };
              });
              exportToExcel(data, `absensi-${selectedKelas}-${date}`);
            }}
          >
            <Download className="w-4 h-4 mr-1" /> Excel
          </Button>
        </div>
      </div>

      {/* Stats Widget */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-gray-500 font-medium">Total</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{stats.total}</p></CardContent>
        </Card>
        <Card className="border-emerald-200">
          <CardHeader className="pb-2"><CardTitle className="text-xs text-emerald-600 font-medium">Hadir</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-emerald-700">{stats.hadir}</p></CardContent>
        </Card>
        <Card className="border-amber-200">
          <CardHeader className="pb-2"><CardTitle className="text-xs text-amber-600 font-medium">Sakit</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-amber-700">{stats.sakit}</p></CardContent>
        </Card>
        <Card className="border-purple-200">
          <CardHeader className="pb-2"><CardTitle className="text-xs text-purple-600 font-medium">Izin</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-purple-700">{stats.izin}</p></CardContent>
        </Card>
        <Card className="border-red-200">
          <CardHeader className="pb-2"><CardTitle className="text-xs text-red-600 font-medium">Alfa</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-red-700">{stats.alfa}</p></CardContent>
        </Card>
      </div>

      {/* Attendance Percentage Widget */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border-4 border-emerald-500 flex items-center justify-center shrink-0">
              <span className="text-xl font-bold text-emerald-700">{stats.percentage}%</span>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Persentase Kehadiran</p>
              <div className="mt-1 w-full bg-gray-200 rounded-full h-2.5 max-w-xs">
                <div
                  className="bg-emerald-500 h-2.5 rounded-full transition-all"
                  style={{ width: `${stats.percentage}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {stats.hadir} dari {stats.total} siswa hadir hari ini
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Student List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Daftar Siswa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {mockStudents.map((student) => {
              const record = records.find((r) => r.student_id === student.id);
              const status = record?.status || "Hadir";
              return (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                      {student.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{student.name}</p>
                      <p className="text-xs text-gray-400">NIS: {student.nis}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
                    {statusOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => toggleStatus(student.id, opt.value)}
                        className={cn(
                          "px-2.5 py-1 text-xs font-medium rounded-md transition-all",
                          status === opt.value
                            ? opt.color + " shadow-sm"
                            : "text-gray-500 hover:text-gray-700 hover:bg-gray-200"
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
