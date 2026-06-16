import { useState, useMemo } from "react";
import { Plus, Trash2, Calculator, FileText, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { exportNilaiPDF, exportToExcel } from "@/lib/export";

interface Score {
  id: string;
  student_id: string;
  type: "Tugas" | "UH" | "Praktik" | "UTS" | "UAS";
  score: number;
}

interface StudentScore {
  id: string;
  name: string;
  Tugas: number | null;
  UH: number | null;
  Praktik: number | null;
  UTS: number | null;
  UAS: number | null;
}

const mockStudents = [
  { id: "1", name: "Ahmad Fauzi" },
  { id: "2", name: "Bunga Lestari" },
  { id: "3", name: "Citra Dewi" },
  { id: "4", name: "Dimas Arifin" },
  { id: "5", name: "Eka Prasetyo" },
];

const types: Array<"Tugas" | "UH" | "Praktik" | "UTS" | "UAS"> = ["Tugas", "UH", "Praktik", "UTS", "UAS"];

function calculateFinal(s: StudentScore): number | null {
  const scores = [s.Tugas, s.UH, s.Praktik, s.UTS, s.UAS].filter((v): v is number => v !== null && !isNaN(v));
  if (scores.length === 0) return null;
  const sum = scores.reduce((a, b) => a + b, 0);
  return Math.round((sum / scores.length) * 100) / 100;
}

export default function PenilaianPage() {
  const [scores, setScores] = useState<Score[]>(() => {
    try {
      const saved = localStorage.getItem("penilaian_scores");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [form, setForm] = useState({ student_id: "1", type: "Tugas" as Score["type"], score: "" });

  const saveScores = (data: Score[]) => {
    setScores(data);
    localStorage.setItem("penilaian_scores", JSON.stringify(data));
  };

  const handleAdd = () => {
    const numScore = Number(form.score);
    if (isNaN(numScore) || numScore < 0 || numScore > 100) return;
    saveScores([...scores, { id: crypto.randomUUID(), student_id: form.student_id, type: form.type, score: numScore }]);
    setForm({ ...form, score: "" });
  };

  const handleDelete = (id: string) => {
    saveScores(scores.filter((s) => s.id !== id));
  };

  const studentScores: StudentScore[] = useMemo(() => {
    return mockStudents.map((stu) => {
      const result: StudentScore = { id: stu.id, name: stu.name, Tugas: null, UH: null, Praktik: null, UTS: null, UAS: null };
      types.forEach((type) => {
        const studentTypeScores = scores.filter((s) => s.student_id === stu.id && s.type === type);
        if (studentTypeScores.length > 0) {
          result[type] = Math.round((studentTypeScores.reduce((sum, s) => sum + s.score, 0) / studentTypeScores.length) * 100) / 100;
        }
      });
      return result;
    });
  }, [scores]);

  const classAverage = useMemo(() => {
    const finals = studentScores.map(calculateFinal).filter((v): v is number => v !== null);
    if (finals.length === 0) return null;
    return Math.round((finals.reduce((a, b) => a + b, 0) / finals.length) * 100) / 100;
  }, [studentScores]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Penilaian & Rekap Nilai</h2>
          <p className="text-gray-500 mt-1">Input nilai dan lihat perhitungan otomatis</p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={scores.length === 0}
            onClick={() => {
              const data = studentScores.map((s) => {
                const f = calculateFinal(s);
                return {
                  name: s.name,
                  tugas: s.Tugas?.toString() || "—",
                  uh: s.UH?.toString() || "—",
                  praktik: s.Praktik?.toString() || "—",
                  uts: s.UTS?.toString() || "—",
                  uas: s.UAS?.toString() || "—",
                  final: f !== null ? f.toFixed(1) : "—",
                };
              });
              exportNilaiPDF(data, "VII-A", "Semua Mapel");
            }}
          >
            <FileText className="w-4 h-4 mr-1" /> PDF
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={scores.length === 0}
            onClick={() => {
              const data = studentScores.map((s) => {
                const f = calculateFinal(s);
                return {
                  Nama: s.name,
                  Tugas: s.Tugas ?? "—",
                  UH: s.UH ?? "—",
                  Praktik: s.Praktik ?? "—",
                  UTS: s.UTS ?? "—",
                  UAS: s.UAS ?? "—",
                  Nilai_Akhir: f !== null ? f.toFixed(1) : "—",
                };
              });
              exportToExcel(data, "rekap-nilai-VII-A");
            }}
          >
            <Download className="w-4 h-4 mr-1" /> Excel
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-gray-500 font-medium">Total Entri Nilai</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{scores.length}</p></CardContent>
        </Card>
        <Card className="border-emerald-200">
          <CardHeader className="pb-2"><CardTitle className="text-xs text-emerald-600 font-medium">Rata-rata Kelas</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-700">
              {classAverage !== null ? classAverage.toFixed(1) : "—"}
            </p>
          </CardContent>
        </Card>
        <Card className="border-primary/20">
          <CardHeader className="pb-2"><CardTitle className="text-xs text-primary font-medium">Siswa</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{mockStudents.length}</p></CardContent>
        </Card>
      </div>

      <Tabs defaultValue="table">
        <TabsList>
          <TabsTrigger value="table">Tabel Nilai</TabsTrigger>
          <TabsTrigger value="input">Input Nilai</TabsTrigger>
        </TabsList>

        <TabsContent value="table">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-primary" />
                Rekap Nilai
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-3 font-semibold text-gray-600">Nama</th>
                    {types.map((t) => (
                      <th key={t} className="text-center py-3 px-3 font-semibold text-gray-600">{t}</th>
                    ))}
                    <th className="text-center py-3 px-3 font-bold text-primary">Nilai Akhir</th>
                  </tr>
                </thead>
                <tbody>
                  {studentScores.map((s) => {
                    const final = calculateFinal(s);
                    return (
                      <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-2.5 px-3 font-medium text-gray-900">{s.name}</td>
                        {types.map((t) => (
                          <td key={t} className="text-center py-2.5 px-3 text-gray-600">
                            {s[t] !== null ? s[t] : <span className="text-gray-300">—</span>}
                          </td>
                        ))}
                        <td className="text-center py-2.5 px-3">
                          {final !== null ? (
                            <span
                              className={`font-bold ${
                                final >= 75 ? "text-emerald-600" : "text-red-500"
                              }`}
                            >
                              {final.toFixed(1)}
                            </span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {scores.length === 0 && (
                <p className="text-center text-gray-400 py-8">Belum ada data nilai. Input nilai di tab Input.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="input">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Add Score */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5 text-primary" />
                  Tambah Nilai
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Siswa</label>
                  <select
                    value={form.student_id}
                    onChange={(e) => setForm({ ...form, student_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white"
                  >
                    {mockStudents.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jenis</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as Score["type"] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white"
                  >
                    {types.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nilai (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.score}
                    onChange={(e) => setForm({ ...form, score: e.target.value })}
                    placeholder="75"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                  />
                </div>
                <Button onClick={handleAdd} className="w-full gap-2">
                  <Plus className="w-4 h-4" />
                  Tambah Nilai
                </Button>
              </CardContent>
            </Card>

            {/* Recent Scores */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Riwayat Input</CardTitle>
                <span className="text-xs text-gray-400">{scores.length} entri</span>
              </CardHeader>
              <CardContent className="max-h-[40vh] overflow-y-auto">
                {scores.length === 0 ? (
                  <p className="text-center text-gray-400 py-8 text-sm">Belum ada nilai</p>
                ) : (
                  <div className="space-y-1">
                    {scores.slice().reverse().slice(0, 20).map((s) => {
                      const student = mockStudents.find((st) => st.id === s.student_id);
                      return (
                        <div key={s.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                              {s.type}
                            </span>
                            <span className="text-sm text-gray-700">{student?.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-gray-900">{s.score}</span>
                            <button
                              onClick={() => handleDelete(s.id)}
                              className="text-gray-300 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
