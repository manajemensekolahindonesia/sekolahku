import { useState, useEffect, useCallback, type FormEvent } from "react";
import { Sparkles, Loader2, Printer, Image, Copy, Check, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchTextModels, fetchImageModels, generateModul, getImageUrl, type ModulResponse } from "@/lib/api";
import type { AIModel } from "@/types";

export default function PerangkatAjarPage() {
  const [textModels, setTextModels] = useState<AIModel[]>([]);
  const [imageModels, setImageModels] = useState<AIModel[]>([]);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [modelsError, setModelsError] = useState("");

  const [topic, setTopic] = useState("");
  const [timeAllocation, setTimeAllocation] = useState("2 x 45 menit");
  const [selectedTextModel, setSelectedTextModel] = useState("");
  const [selectedImageModel, setSelectedImageModel] = useState("");
  const [kelas, setKelas] = useState("");
  const [mapel, setMapel] = useState("");

  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<ModulResponse | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setModelsError("");
        const [text, img] = await Promise.all([fetchTextModels(), fetchImageModels()]);
        if (cancelled) return;
        setTextModels(text);
        setImageModels(img);
        if (text.length > 0) setSelectedTextModel(text[0].id || text[0].name);
        if (img.length > 0) setSelectedImageModel(img[0].id || img[0].name);
      } catch {
        if (!cancelled) {
          setModelsError("Gagal memuat daftar model AI. Backend mungkin tidak berjalan.");
          // Fallback models
          setTextModels([
            { id: "openai", name: "OpenAI GPT-4o" },
            { id: "openai-large", name: "OpenAI GPT-4o Large" },
            { id: "gemini", name: "Google Gemini" },
            { id: "claude", name: "Anthropic Claude" },
          ]);
          setImageModels([
            { id: "flux", name: "Flux" },
            { id: "turbo", name: "Flux Turbo" },
          ]);
          if (!selectedTextModel) setSelectedTextModel("openai");
          if (!selectedImageModel) setSelectedImageModel("flux");
        }
      } finally {
        if (!cancelled) setModelsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setGenerating(true);
    setError("");
    setResult(null);

    try {
      const data = await generateModul({
        topic: topic.trim(),
        time_allocation: timeAllocation,
        text_model: selectedTextModel,
        image_model: selectedImageModel,
        kelas: kelas || undefined,
        mapel: mapel || undefined,
      });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal generate modul");
    } finally {
      setGenerating(false);
    }
  }, [topic, timeAllocation, selectedTextModel, selectedImageModel, kelas, mapel]);

  const handlePrint = () => {
    if (!result) return;
    const win = window.open("", "_blank");
    if (!win) return;
    const modul = result.modul;
    const imageUrls = result.image_urls || [];

    win.document.write(`
      <!DOCTYPE html>
      <html><head><meta charset="utf-8"><title>Modul Ajar - ${modul.identitas?.topik || topic}</title>
      <style>
        @page { size: A4; margin: 2cm; }
        body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12pt; line-height: 1.7; color: #1a1a1a; max-width: 21cm; margin: 0 auto; padding: 1cm; }
        .kop { text-align: center; border-bottom: 3px solid #2563eb; padding-bottom: 16px; margin-bottom: 24px; }
        .kop h1 { font-size: 18pt; color: #2563eb; margin: 0; }
        .kop p { font-size: 10pt; color: #666; margin: 4px 0; }
        h2 { font-size: 14pt; color: #2563eb; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; margin-top: 24px; }
        h3 { font-size: 12pt; margin-top: 16px; }
        table { width: 100%; border-collapse: collapse; margin: 12px 0; }
        th, td { border: 1px solid #d1d5db; padding: 6px 10px; text-align: left; font-size: 11pt; }
        th { background: #f3f4f6; font-weight: 600; }
        ul { padding-left: 20px; }
        li { margin: 4px 0; }
        .images-section { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 16px; }
        .images-section img { width: 100%; border-radius: 4px; border: 1px solid #e5e7eb; }
        @media print { body { padding: 0; } }
      </style></head><body>
      <div class="kop">
        <h1>SEKOLAHKU</h1>
        <p>Modul Ajar Harian - Kurikulum Merdeka</p>
        <p>Tahun Ajaran 2025/2026</p>
      </div>
      <h2>${modul.identitas?.topik || topic}</h2>
      <table>
        <tr><th style="width:150px">Alokasi Waktu</th><td>${timeAllocation}</td></tr>
        ${modul.identitas?.kelas ? `<tr><th>Kelas</th><td>${modul.identitas.kelas}</td></tr>` : ""}
        ${kelas ? `<tr><th>Kelas</th><td>${kelas}</td></tr>` : ""}
        ${mapel ? `<tr><th>Mata Pelajaran</th><td>${mapel}</td></tr>` : ""}
      </table>
      ${modul.kompetensi_dasar ? `<h3>Kompetensi Dasar</h3><p>${modul.kompetensi_dasar}</p>` : ""}
      ${modul.tujuan_pembelajaran ? `<h3>Tujuan Pembelajaran</h3><ul>${modul.tujuan_pembelajaran.map((t: string) => `<li>${t}</li>`).join("")}</ul>` : ""}
      ${modul.kegiatan_pembelajaran ? `
        <h3>Kegiatan Pembelajaran</h3>
        ${modul.kegiatan_pembelajaran.pendahuluan?.length ? `<h4>Pendahuluan</h4><ul>${modul.kegiatan_pembelajaran.pendahuluan.map((s: string) => `<li>${s}</li>`).join("")}</ul>` : ""}
        ${modul.kegiatan_pembelajaran.inti?.length ? `<h4>Inti</h4><ul>${modul.kegiatan_pembelajaran.inti.map((s: string) => `<li>${s}</li>`).join("")}</ul>` : ""}
        ${modul.kegiatan_pembelajaran.penutup?.length ? `<h4>Penutup</h4><ul>${modul.kegiatan_pembelajaran.penutup.map((s: string) => `<li>${s}</li>`).join("")}</ul>` : ""}
      ` : ""}
      ${modul.media_dan_sumber ? `<h3>Media & Sumber</h3><ul>${modul.media_dan_sumber.map((m: string) => `<li>${m}</li>`).join("")}</ul>` : ""}
      ${modul.penilaian ? `<h3>Penilaian</h3><p>Teknik: ${modul.penilaian.teknik}<br>Instrumen: ${modul.penilaian.instrumen}</p>` : ""}
      ${modul.raw ? `<div style="white-space:pre-wrap;margin-top:16px;">${modul.raw}</div>` : ""}
      ${imageUrls.length > 0 ? `<h3>Ilustrasi</h3><div class="images-section">${imageUrls.map((url: string) => `<img src="${url}" alt="ilustrasi" onerror="this.style.display='none'">`).join("")}</div>` : ""}
      <script>window.onload=function(){window.print();window.close();}<\/script>
      </body></html>
    `);
    win.document.close();
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Perangkat & Bahan Ajar AI</h2>
        <p className="text-gray-500 mt-1">Buat modul ajar harian otomatis dengan AI generatif</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Form Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Generate Modul
            </CardTitle>
            <CardDescription>Isi detail pembelajaran dan pilih model AI</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Topik Pembelajaran *</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Contoh: Fotosintesis pada Tumbuhan"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Alokasi Waktu</label>
                  <select
                    value={timeAllocation}
                    onChange={(e) => setTimeAllocation(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white"
                  >
                    <option>1 x 45 menit</option>
                    <option>2 x 45 menit</option>
                    <option>3 x 45 menit</option>
                    <option>4 x 45 menit</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
                  <input
                    type="text"
                    value={kelas}
                    onChange={(e) => setKelas(e.target.value)}
                    placeholder="Contoh: VII-A"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mata Pelajaran</label>
                <input
                  type="text"
                  value={mapel}
                  onChange={(e) => setMapel(e.target.value)}
                  placeholder="Contoh: IPA Biologi"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Model AI Teks {modelsLoading && "(loading...)"}
                  </label>
                  {modelsError ? (
                    <p className="text-xs text-amber-600 mb-1">{modelsError}</p>
                  ) : null}
                  <select
                    value={selectedTextModel}
                    onChange={(e) => setSelectedTextModel(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white"
                  >
                    {textModels.map((m) => (
                      <option key={m.id || m.name} value={m.id || m.name}>
                        {m.name} {m.description ? `(${m.description})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Model AI Gambar {modelsLoading && "(loading...)"}
                  </label>
                  <select
                    value={selectedImageModel}
                    onChange={(e) => setSelectedImageModel(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white"
                  >
                    {imageModels.map((m) => (
                      <option key={m.id || m.name} value={m.id || m.name}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                  {error}
                </div>
              )}

              <Button type="submit" disabled={generating || !topic.trim()} className="w-full gap-2">
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Menghasilkan Modul...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Modul Ajar
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Result Panel */}
        <div className="space-y-4">
          {result ? (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="text-lg">
                      {result.modul.identitas?.topik || topic}
                    </CardTitle>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Model: {result.model_used} &bull; {timeAllocation}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={handlePrint}>
                      <Printer className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopy(JSON.stringify(result.modul, null, 2))}
                    >
                      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="max-h-[60vh] overflow-y-auto">
                  <Tabs defaultValue="isi">
                    <TabsList className="w-full">
                      <TabsTrigger value="isi" className="flex-1">Isi Modul</TabsTrigger>
                      <TabsTrigger value="gambar" className="flex-1">Ilustrasi</TabsTrigger>
                      <TabsTrigger value="json" className="flex-1">JSON</TabsTrigger>
                    </TabsList>
                    <TabsContent value="isi">
                      <div className="space-y-4 text-sm">
                        {result.modul.kompetensi_dasar && (
                          <div>
                            <h4 className="font-semibold text-gray-900">Kompetensi Dasar</h4>
                            <p className="text-gray-600">{result.modul.kompetensi_dasar}</p>
                          </div>
                        )}
                        {result.modul.tujuan_pembelajaran && (
                          <div>
                            <h4 className="font-semibold text-gray-900">Tujuan Pembelajaran</h4>
                            <ul className="list-disc pl-5 text-gray-600 space-y-1">
                              {result.modul.tujuan_pembelajaran.map((t, i) => (
                                <li key={i}>{t}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {result.modul.kegiatan_pembelajaran && (
                          <div>
                            <h4 className="font-semibold text-gray-900">Kegiatan Pembelajaran</h4>
                            {result.modul.kegiatan_pembelajaran.pendahuluan?.length > 0 && (
                              <div className="mt-1">
                                <p className="text-xs font-medium text-primary">Pendahuluan</p>
                                <ul className="list-disc pl-5 text-gray-600 text-xs space-y-0.5">
                                  {result.modul.kegiatan_pembelajaran.pendahuluan.map((s, i) => (
                                    <li key={i}>{s}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {result.modul.kegiatan_pembelajaran.inti?.length > 0 && (
                              <div className="mt-1">
                                <p className="text-xs font-medium text-primary">Inti</p>
                                <ul className="list-disc pl-5 text-gray-600 text-xs space-y-0.5">
                                  {result.modul.kegiatan_pembelajaran.inti.map((s, i) => (
                                    <li key={i}>{s}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {result.modul.kegiatan_pembelajaran.penutup?.length > 0 && (
                              <div className="mt-1">
                                <p className="text-xs font-medium text-primary">Penutup</p>
                                <ul className="list-disc pl-5 text-gray-600 text-xs space-y-0.5">
                                  {result.modul.kegiatan_pembelajaran.penutup.map((s, i) => (
                                    <li key={i}>{s}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                        {result.modul.media_dan_sumber && (
                          <div>
                            <h4 className="font-semibold text-gray-900">Media & Sumber</h4>
                            <ul className="list-disc pl-5 text-gray-600 text-xs">
                              {result.modul.media_dan_sumber.map((m, i) => (
                                <li key={i}>{m}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {result.modul.penilaian && (
                          <div>
                            <h4 className="font-semibold text-gray-900">Penilaian</h4>
                            <p className="text-gray-600 text-xs">
                              Teknik: {result.modul.penilaian.teknik}<br />
                              Instrumen: {result.modul.penilaian.instrumen}
                            </p>
                          </div>
                        )}
                        {result.modul.raw && (
                          <div>
                            <h4 className="font-semibold text-gray-900">Raw Output</h4>
                            <pre className="text-xs text-gray-500 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">
                              {result.modul.raw}
                            </pre>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                    <TabsContent value="gambar">
                      {result.image_urls.length > 0 ? (
                        <div className="space-y-4">
                          {result.image_prompts.map((prompt, i) => (
                            <div key={i} className="rounded-lg border border-gray-200 overflow-hidden">
                              <img
                                src={result.image_urls[i]}
                                alt={prompt}
                                className="w-full h-48 object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "";
                                  (e.target as HTMLImageElement).alt = "Gambar gagal dimuat";
                                }}
                              />
                              <p className="p-2 text-xs text-gray-400 font-mono truncate">{prompt}</p>
                            </div>
                          ))}
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full gap-2"
                            onClick={() => {
                              result.image_prompts.forEach((p) =>
                                window.open(getImageUrl(p, selectedImageModel), "_blank")
                              );
                            }}
                          >
                            <Download className="w-4 h-4" />
                            Buka Semua Gambar
                          </Button>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400 text-center py-8">
                          <Image className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                          Belum ada ilustrasi yang dihasilkan
                        </p>
                      )}
                    </TabsContent>
                    <TabsContent value="json">
                      <div className="relative">
                        <pre className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg overflow-x-auto max-h-[50vh]">
                          {JSON.stringify(result, null, 2)}
                        </pre>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center py-16">
                <Sparkles className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400">Hasil modul akan muncul di sini</p>
                <p className="text-xs text-gray-300 mt-1">Isi form di sebelah kiri lalu klik Generate</p>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <span className="text-sm text-gray-500">
                {result ? "Modul siap — cetak atau salin" : "Siap generate modul"}
              </span>
              {result && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={handlePrint}>
                    <Printer className="w-4 h-4 mr-1" /> Cetak A4
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
