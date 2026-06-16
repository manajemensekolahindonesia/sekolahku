import { useState } from "react";
import { BookOpen, Save, Trash2, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface JurnalEntry {
  id: string;
  date: string;
  class_name: string;
  material_progress: string;
  activities: string;
  obstacles: string;
  follow_up: string;
}

export default function JurnalPage() {
  const [entries, setEntries] = useState<JurnalEntry[]>(() => {
    try {
      const saved = localStorage.getItem("jurnal_entries");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    class_name: "",
    material_progress: "",
    activities: "",
    obstacles: "",
    follow_up: "",
  });

  const saveToLocal = (data: JurnalEntry[]) => {
    setEntries(data);
    localStorage.setItem("jurnal_entries", JSON.stringify(data));
  };

  const handleAdd = () => {
    if (!form.material_progress.trim() && !form.activities.trim()) return;
    const entry: JurnalEntry = {
      id: crypto.randomUUID(),
      ...form,
    };
    saveToLocal([entry, ...entries]);
    setForm({
      date: new Date().toISOString().split("T")[0],
      class_name: form.class_name,
      material_progress: "",
      activities: "",
      obstacles: "",
      follow_up: "",
    });
  };

  const handleDelete = (id: string) => {
    saveToLocal(entries.filter((e) => e.id !== id));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Jurnal Pembelajaran</h2>
        <p className="text-gray-500 mt-1">Catat kemajuan materi, aktivitas, kendala, dan rencana tindak lanjut</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Entri Baru
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
                <input
                  type="text"
                  value={form.class_name}
                  onChange={(e) => setForm({ ...form, class_name: e.target.value })}
                  placeholder="VII-A"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kemajuan Materi</label>
              <textarea
                value={form.material_progress}
                onChange={(e) => setForm({ ...form, material_progress: e.target.value })}
                placeholder="Materi yang telah disampaikan hari ini..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Aktivitas Pembelajaran</label>
              <textarea
                value={form.activities}
                onChange={(e) => setForm({ ...form, activities: e.target.value })}
                placeholder="Aktivitas yang dilakukan siswa..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kendala / Hambatan</label>
              <textarea
                value={form.obstacles}
                onChange={(e) => setForm({ ...form, obstacles: e.target.value })}
                placeholder="Kendala yang dihadapi selama pembelajaran..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rencana Tindak Lanjut</label>
              <textarea
                value={form.follow_up}
                onChange={(e) => setForm({ ...form, follow_up: e.target.value })}
                placeholder="Rencana untuk pembelajaran selanjutnya..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
              />
            </div>

            <Button onClick={handleAdd} className="w-full gap-2">
              <Save className="w-4 h-4" />
              Simpan Jurnal
            </Button>
          </CardContent>
        </Card>

        {/* History */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                Riwayat Jurnal
              </CardTitle>
              <span className="text-xs text-gray-400">{entries.length} entri</span>
            </CardHeader>
            <CardContent className="max-h-[60vh] overflow-y-auto">
              {entries.length === 0 ? (
                <p className="text-center text-gray-400 py-8 text-sm">Belum ada entri jurnal</p>
              ) : (
                <div className="space-y-3">
                  {entries.map((entry) => (
                    <div key={entry.id} className="p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-xs text-gray-400">{entry.date}</p>
                          {entry.class_name && (
                            <span className="text-xs font-medium bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                              {entry.class_name}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="text-gray-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {entry.material_progress && (
                        <div className="mt-1">
                          <p className="text-xs font-medium text-gray-500">Materi</p>
                          <p className="text-sm text-gray-700">{entry.material_progress}</p>
                        </div>
                      )}
                      {entry.activities && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-gray-500">Aktivitas</p>
                          <p className="text-sm text-gray-700">{entry.activities}</p>
                        </div>
                      )}
                      {entry.obstacles && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-amber-600">Kendala</p>
                          <p className="text-sm text-gray-700">{entry.obstacles}</p>
                        </div>
                      )}
                      {entry.follow_up && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-emerald-600">Tindak Lanjut</p>
                          <p className="text-sm text-gray-700">{entry.follow_up}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
