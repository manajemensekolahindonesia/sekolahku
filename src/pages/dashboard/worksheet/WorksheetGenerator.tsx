import React, { useState, useEffect } from 'react';
import ModelSelector from '@/components/ModelSelector';
import { educationLevels, phaseClassMap, subjectsByLevel } from '@/lib/constants';
import { GoogleGenAI, Type } from '@/lib/genai';
import Markdown from 'react-markdown';
import PrintSupportModal from '@/components/PrintSupportModal';
import PDFRemixUpload from '@/components/PDFRemixUpload';
import { useAuth } from '@/context/AuthContext';
import { getWatermarkHtml, getSignatureHtml, universalPrint } from '@/lib/print';
import AIAssistedInput from '@/components/AIAssistedInput';
import AIAssistedTextarea from '@/components/AIAssistedTextarea';
import DOMPurify from 'dompurify';
import { FileText, Settings, List, Palette, Loader2, Sparkles, Printer, ChevronDown, ChevronUp } from 'lucide-react';

const INFOGRAPHIC_BASE_PROMPT = `
Create a vertical worksheet, portrait orientation, optimized to fit entirely on a single A4 page.
Style: modern, eye-catching, vibrant, professional educational worksheet.
Typography: compact and readable (use text-sm or text-xs for questions) to ensure everything fits on one page.

🧱 STRUKTUR GRID & LAYOUT (STRICT — FOLLOW EXACTLY)
MAIN GRID: Top-bottom layout ONLY (1 column):
- Put the illustration at the TOP of the worksheet (below the header). YOU MUST INCLUDE an actual HTML <img> tag with src="https://picsum.photos/seed/education/200/400" alt="Illustration" class="w-full max-w-sm mx-auto h-auto object-cover rounded-xl shadow-sm mb-4 block". DO NOT put the image on the side.
- Content area (Questions) should take up the rest of the space below the image.

Rules:
- Use responsive Tailwind classes (e.g. w-full, flex-col sm:flex-row) to ensure the design works well on mobile. NEVER use fixed widths (like width="800" or w-[800px]).
- Use compact margins and padding (e.g., p-2, p-3, gap-2) to save space.
- Ensure the layout is tight enough to fit all questions on a single A4 page when printed.
- Each question panel should be compact.
- DO NOT use literal "\\n" characters. Use proper HTML tags like <p> and <br> for spacing and paragraphs.

🔝 PANEL 1 — HEADER UTAMA
- Main Headline: [TOPIC_TITLE] (Eye-catching, bold)
- Subheadline: [TOPIC_SUBTITLE]
- Identity Info: ONLY include Nama Siswa, Kelas, Tanggal, and Nama Sekolah. DO NOT put Nama Guru or Kepala Sekolah in the header!

🟨 PANEL 2 — INTI WORKSHEET (SOAL)
- Main content: [WORKSHEET_QUESTIONS_AND_TASKS]
- Presented as compact vertical stacked cards or a clean list. Use checkboxes or small input lines.

🎨 VISUAL STYLE & COLOR
- Vibrant, eye-catching, engaging colors for students.
- Clean, breathable but compact composition.
`;

export default function WorksheetGenerator() {
  const { consumeToken } = useAuth();
  const { profile } = useAuth();
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>('openai');
  const [selectedImageModel, setSelectedImageModel] = useState<string>('nanobanana');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<{
    jenjang: string;
    fase: string;
    kelas: string;
    mapel: string;
    topik: string;
    jenisSoal: string[];
    jumlahSoal: number;
    tingkatKesulitan: string;
    kerangkaTaksonomi: string;
    tingkatanKognitif: string;
    instruksiTambahan: string;
    gayaDesain: string;
    namaGuru: string;
    jenisNipGuru: string;
    nipGuru: string;
    namaSekolah: string;
    jenisSekolah: string;
    kepalaSekolah: string;
    jenisNipKepalaSekolah: string;
    nipKepalaSekolah: string;
    remixText: string;
  }>({
    jenjang: 'sd',
    fase: 'A',
    kelas: '1',
    mapel: 'bahasa-indonesia',
    topik: '',
    jenisSoal: ['Pilihan Ganda'],
    jumlahSoal: 5,
    tingkatKesulitan: 'Sedang',
    kerangkaTaksonomi: 'Bloom',
    tingkatanKognitif: 'C1 - Mengingat',
    instruksiTambahan: '',
    gayaDesain: 'Minimalis',
    namaGuru: '',
    jenisNipGuru: 'NIP',
    nipGuru: '',
    namaSekolah: '',
    jenisSekolah: 'Negeri',
    kepalaSekolah: '',
    jenisNipKepalaSekolah: 'NIP',
    nipKepalaSekolah: '',
    remixText: ''
  });

  const handleJenisSoalChange = (bentuk: string) => {
    let current = [...formData.jenisSoal];
    if (bentuk === 'Kombinasi') { current = ['Kombinasi']; }
    else {
      current = current.filter(c => c !== 'Kombinasi');
      if (current.includes(bentuk)) current = current.filter(c => c !== bentuk);
      else current.push(bentuk);
    }
    if (current.length === 0) current = ['Pilihan Ganda'];
    setFormData(prev => ({ ...prev, jenisSoal: current }));
  };

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    pengaturan: true,
    detail: false,
    gaya: false
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const [result, setResult] = useState<string | null>(null);

  const designPrompts: Record<string, string> = {
    'Minimalis': 'Use mostly white space, thin lines, soft gray and navy colors. Clean layout, no clutter, very clear structure.',
    'Colorful': 'Use bright but balanced colors (blue, yellow, green, orange). Add soft gradient highlights, icons, and friendly shapes.',
    'Playful': 'Add cute icons, rounded shapes, doodle elements, and soft colorful highlights. Friendly and engaging.',
    'Modern': 'Use clean grid layout, bold typography, subtle gradients, glassmorphism or soft shadow effects.',
    'Vintage': 'Use soft beige, brown, and muted tones. Add paper texture, classic typography, and subtle decorative lines.'
  };

  useEffect(() => {
    const phases = phaseClassMap[formData.jenjang]?.phases || [];
    const firstPhase = phases[0]?.id || '';
    
    const classes = phaseClassMap[formData.jenjang]?.classes?.[firstPhase] || [];
    const firstClass = classes[0]?.id || '';

    const subjects = subjectsByLevel[formData.jenjang] || [];
    const firstSubject = subjects[0]?.id || '';

    setFormData(prev => ({ ...prev, fase: firstPhase, kelas: firstClass, mapel: firstSubject }));
  }, [formData.jenjang]);

  useEffect(() => {
    const classes = phaseClassMap[formData.jenjang]?.classes?.[formData.fase] || [];
    setFormData(prev => ({ ...prev, kelas: classes[0]?.id || '' }));
  }, [formData.fase, formData.jenjang]);

  useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        namaGuru: profile.displayName || prev.namaGuru,
        nipGuru: profile.nip || prev.nipGuru,
        namaSekolah: profile.namaSekolah || prev.namaSekolah,
        jenjang: profile.jenjang?.toLowerCase() || prev.jenjang
      }));
    }
  }, [profile]);

  const generateWorksheet = async () => {
    if (!formData.topik) {
      setError('Topik/Materi harus diisi.');
      return;
    }

    setIsGenerating(true);
    const canGenerate = await consumeToken();
    if (!canGenerate) {
      setIsGenerating(false);
      return;
    }
setError('');
    
    try {
      const ai = new GoogleGenAI({});
      
      const subjectLabel = subjectsByLevel[formData.jenjang]?.find(s => s.id === formData.mapel)?.label || formData.mapel;
      const faseLabel = phaseClassMap[formData.jenjang]?.phases?.find(p => p.id === formData.fase)?.label || formData.fase;
      const kelasLabel = phaseClassMap[formData.jenjang]?.classes?.[formData.fase]?.find(c => c.id === formData.kelas)?.label || formData.kelas;
      const jenjangLabel = educationLevels.find(l => l.id === formData.jenjang)?.label || formData.jenjang;

      let imageUrl = "https://picsum.photos/seed/education/200/400";
      try {
        const encodedPrompt = encodeURIComponent(`Educational worksheet illustration about ${formData.topik}, minimalist, line art, colorful, child friendly`);
        const randomSeed = Math.floor(Math.random() * 1000000);
        
        const imageResponse = await fetch(`/api/generate-image?prompt=${encodedPrompt}&model=${selectedImageModel}&seed=${randomSeed}`);

        if (imageResponse.ok) {
          const blob = await imageResponse.blob();
          imageUrl = URL.createObjectURL(blob);
        } else {
          console.warn("Gagal mendapatkan gambar nanobanana, status:", imageResponse.status);
        }
      } catch (err) {
        console.warn("Error saat mengambil gambar nanobanana, menggunakan fallback", err);
      }

      const finalInfographicPrompt = INFOGRAPHIC_BASE_PROMPT.replace(
        'https://picsum.photos/seed/education/200/400',
        imageUrl
      );

      const prompt = `Buatkan Lembar Kerja Peserta Didik (LKPD) / Worksheet edukatif untuk:
Jenjang: ${jenjangLabel}
Fase/Kelas: ${faseLabel} / ${kelasLabel}
Mata Pelajaran: ${subjectLabel}
Topik/Materi: ${formData.topik}
Jenis Soal: ${formData.jenisSoal.join(', ')}
Jumlah Soal: ${formData.jumlahSoal}
Tingkat Kesulitan: ${formData.tingkatKesulitan}
Tingkatan Kognitif (${formData.kerangkaTaksonomi === 'Bloom' ? 'Taksonomi Bloom Revisi' : 'Taksonomi SOLO'}): ${formData.tingkatanKognitif}
Instruksi Tambahan: ${formData.instruksiTambahan || 'Tidak ada'}

${formData.remixText ? `INSTRUKSI REMIX:
Gunakan teks referensi berikut sebagai dasar utama pembuatan Worksheet. Remix dan kembangkan konten ini agar sesuai dengan kurikulum merdeka dan target audiens di atas:
---
${formData.remixText}
---` : ''}

Konteks Kurikulum Merdeka & Pedagogi:
1. Kerangka Kognitif (${formData.kerangkaTaksonomi === 'Bloom' ? 'Taksonomi Bloom' : 'Taksonomi SOLO'}):
${formData.kerangkaTaksonomi === 'Bloom' ? `   - Fokus HOTS: Kurikulum Merdeka mendorong keseimbangan antara LOTS (C1-C2) dan HOTS (C4-C6), dengan penekanan lebih pada tingkat tinggi.
   - Dimensi Pengetahuan: Selain proses kognitif, target juga mencakup dimensi pengetahuan: Faktual, Konseptual, Prosedural, dan Metakognitif.
   - Kata Kerja Operasional (KKO): Gunakan KKO yang spesifik untuk merumuskan soal agar dapat diukur.` : `   - Taksonomi SOLO berfokus pada kompleksitas pemahaman siswa.
   - Tahapan: Pra-struktural (belum paham konsep), Uni-struktural (satu aspek), Multi-struktural (beberapa aspek terpisah), Relasional (menghubungkan aspek), Abstrak Diperluas (menggeneralisasi ke domain baru).
   - Rumuskan soal yang memancing siswa untuk menunjukkan level pemahaman sesuai target.`}
   - Fleksibilitas: Tingkat kognitif disesuaikan dengan fase perkembangan peserta didik.
   - JANGAN tampilkan label (C1, C2, dll) pada hasil akhir, cukup gunakan KKO yang tepat.
2. Tujuan Pembelajaran (ABCD): Jika memungkinkan, formulasikan instruksi/tujuan dengan prinsip Audience (Peserta didik), Behavior (Perilaku/KKO), Condition (Kondisi pembelajaran), dan Degree (Kriteria keberhasilan).
3. TPACK & STEAM: Integrasikan pendekatan Technological Pedagogical Content Knowledge (TPACK) dan Science, Technology, Engineering, Art, Mathematics (STEAM) dalam rancangan kegiatan atau soal jika relevan.

Instruksi Desain (SANGAT PENTING - GUNAKAN STRUKTUR INFOGRAFIK INI):
${finalInfographicPrompt}

Sentuhan Gaya Visual Tambahan:
${designPrompts[formData.gayaDesain]}

Berikan hasil HANYA dalam format kode HTML lengkap (hanya bagian dalam <body>, tanpa tag <html>, <head>, atau <body>) yang menggunakan Tailwind CSS classes untuk styling.
Pastikan desainnya sangat menarik, interaktif, dan mengikuti struktur grid 40/60 (kiri visual, kanan teks) sesuai instruksi di atas.
Gunakan elemen HTML standar seperti <input type="text" class="border-b-2 border-black bg-transparent w-full focus:outline-none" /> untuk isian kosong, <input type="checkbox" class="w-4 h-4"> untuk pilihan, dll.
Jangan gunakan tag komponen React kustom seperti <AIAssistedInput>.
Jangan gunakan markdown \`\`\`html, langsung kembalikan string HTML-nya saja tanpa embel-embel teks lain.`;

      const response = await ai.models.generateContent({
        model: selectedModel,
        contents: prompt,
      });

      let htmlContent = response.text || '';
      // Clean up markdown code blocks if AI still includes them
      const htmlMatch = htmlContent.match(/```(?:html)?\n?([\s\S]*?)\n?```/);
      if (htmlMatch) {
        htmlContent = htmlMatch[1];
      } else {
        htmlContent = htmlContent.replace(/^```html\n?/, '').replace(/\n?```$/, '');
      }
      
      // Bersihkan teks \n literal jika AI mengembalikannya
      htmlContent = htmlContent.replace(/\\n/g, '<br/>');

      setResult(htmlContent);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Terjadi kesalahan saat menghasilkan worksheet.');
    } finally {
      setIsGenerating(false);
    }
  };

  const printWorksheet = () => {
    if (!result) return;
    
    universalPrint(`
        ${result}
      `, `Worksheet - ${formData.topik}`);
  };

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white shadow-lg">
          <FileText size={28} />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-black">AI Worksheet Generator</h3>
          <p className="text-gray-600">Buat Lembar Kerja Peserta Didik (LKPD) interaktif dengan AI</p>
        </div>
      </div>
      
      <div className="w-full flex flex-col gap-8">
        {/* Form Panel (Top) */}
        <div className="w-full flex flex-col gap-6">
          
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <button 
              onClick={() => toggleSection('pengaturan')}
              className="w-full flex items-center justify-between p-6 bg-white hover:bg-gray-50 transition-colors"
            >
              <h4 className="font-semibold text-blue-600 flex items-center gap-2">
                <Settings size={18} /> Pengaturan Worksheet
              </h4>
              {expandedSections['pengaturan'] ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </button>
            {expandedSections['pengaturan'] && (
              <div className="p-6 pt-0 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Jenjang</label>
                    <select value={formData.jenjang} onChange={e => setFormData({...formData, jenjang: e.target.value})} className="w-full bg-white border border-gray-300 rounded-xl p-3 text-black focus:border-blue-500 transition-all">
                      {educationLevels.map(level => (
                        <option key={level.id} value={level.id}>{level.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Fase</label>
                    <select value={formData.fase} onChange={e => setFormData({...formData, fase: e.target.value})} className="w-full bg-white border border-gray-300 rounded-xl p-3 text-black focus:border-blue-500 transition-all">
                      {phaseClassMap[formData.jenjang]?.phases?.map(p => (
                        <option key={p.id} value={p.id}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Kelas</label>
                    <select value={formData.kelas} onChange={e => setFormData({...formData, kelas: e.target.value})} className="w-full bg-white border border-gray-300 rounded-xl p-3 text-black focus:border-blue-500 transition-all">
                      {phaseClassMap[formData.jenjang]?.classes?.[formData.fase]?.map(c => (
                        <option key={c.id} value={c.id}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mata Pelajaran</label>
                    <select value={formData.mapel} onChange={e => setFormData({...formData, mapel: e.target.value})} className="w-full bg-white border border-gray-300 rounded-xl p-3 text-black focus:border-blue-500 transition-all">
                      {subjectsByLevel[formData.jenjang]?.map(s => (
                        <option key={s.id} value={s.id}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Topik / Materi Pembelajaran</label>
                    <AIAssistedInput type="text" placeholder="Contoh: Sistem Pencernaan Manusia" value={formData.topik} onChange={e => setFormData({...formData, topik: e.target.value})} className="w-full bg-white border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-blue-500 transition-all" />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <button 
              onClick={() => toggleSection('detail')}
              className="w-full flex items-center justify-between p-6 bg-white hover:bg-gray-50 transition-colors"
            >
              <h4 className="font-semibold text-blue-600 flex items-center gap-2">
                <List size={18} /> Detail Soal
              </h4>
              {expandedSections['detail'] ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </button>
            {expandedSections['detail'] && (
              <div className="p-6 pt-0 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bentuk/Jenis Soal</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {['Pilihan Ganda', 'Pilihan Ganda Kompleks', 'Benar Salah', 'Menjodohkan', 'Isian Singkat', 'Uraian', 'Essay', 'Kombinasi'].map(bentuk => (
                        <label key={bentuk} className="flex items-center gap-2 cursor-pointer bg-white p-2.5 rounded-xl border border-gray-300 hover:border-blue-500 transition-colors">
                          <input
                            type="checkbox"
                            checked={formData.jenisSoal.includes(bentuk)}
                            onChange={() => handleJenisSoalChange(bentuk)}
                            className="w-4 h-4 rounded border-black text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900 bg-white"
                          />
                          <span className="text-xs text-black">{bentuk}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Jumlah Soal</label>
                    <input type="number" min="1" max="20" value={formData.jumlahSoal} onChange={e => setFormData({...formData, jumlahSoal: parseInt(e.target.value) || 5})} className="w-full bg-white border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-blue-500 transition-all" />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tingkat Kesulitan</label>
                    <select value={formData.tingkatKesulitan} onChange={e => setFormData({...formData, tingkatKesulitan: e.target.value})} className="w-full bg-white border border-gray-300 rounded-xl p-3 text-black focus:border-blue-500 transition-all">
                      <option value="Mudah (LOTS)">Mudah (LOTS)</option>
                      <option value="Sedang (MOTS)">Sedang (MOTS)</option>
                      <option value="Sulit (HOTS)">Sulit (HOTS)</option>
                      <option value="Campuran">Campuran</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Kerangka Taksonomi</label>
                    <div className="flex bg-slate-50 p-1 rounded-full border border-slate-100 mb-4">
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, kerangkaTaksonomi: 'Bloom', tingkatanKognitif: 'C1 - Mengingat'})}
                        className={`flex-1 py-2 text-sm font-bold rounded-full transition-all ${formData.kerangkaTaksonomi === 'Bloom' ? 'bg-white text-indigo-900 shadow-sm border border-slate-200' : 'text-indigo-800/70 hover:text-indigo-900 hover:bg-white/50'}`}
                      >
                        Taksonomi Bloom
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, kerangkaTaksonomi: 'SOLO', tingkatanKognitif: 'Pra-struktural'})}
                        className={`flex-1 py-2 text-sm font-bold rounded-full transition-all ${formData.kerangkaTaksonomi === 'SOLO' ? 'bg-white text-indigo-900 shadow-sm border border-slate-200' : 'text-indigo-800/70 hover:text-indigo-900 hover:bg-white/50'}`}
                      >
                        Taksonomi SOLO
                      </button>
                    </div>

                    <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Level Yang Digunakan</label>
                    <div className="flex flex-wrap gap-2">
                      {(formData.kerangkaTaksonomi === 'Bloom' 
                        ? ['C1 - Mengingat', 'C2 - Memahami', 'C3 - Menerapkan', 'C4 - Menganalisis', 'C5 - Mengevaluasi', 'C6 - Mencipta']
                        : ['Pra-struktural', 'Uni-struktural', 'Multi-struktural', 'Relasional', 'Abstrak Diperluas']
                      ).map(level => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setFormData({...formData, tingkatanKognitif: level})}
                          className={`px-4 py-2 text-xs font-bold rounded-full border transition-all ${formData.tingkatanKognitif === level ? 'bg-indigo-50 border-indigo-200 text-indigo-900 shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:bg-indigo-50/50'}`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Instruksi Tambahan (Opsional)</label>
                    <AIAssistedTextarea rows={2} placeholder="Contoh: Buat soal yang berkaitan dengan kehidupan sehari-hari siswa di daerah pesisir." value={formData.instruksiTambahan} onChange={e => setFormData({...formData, instruksiTambahan: e.target.value})} className="w-full bg-white border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-blue-500 transition-all" />
                  </div>

                  <div className="col-span-2">
                    <PDFRemixUpload 
                      onTextExtracted={(text) => setFormData(prev => ({ ...prev, remixText: text }))}
                      label="Remix dari PDF (Opsional)"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6">
            <button 
              onClick={() => toggleSection('gaya')}
              className="w-full flex items-center justify-between p-6 bg-white hover:bg-gray-50 transition-colors"
            >
              <h4 className="font-semibold text-blue-600 flex items-center gap-2">
                <Palette size={18} /> Gaya Desain
              </h4>
              {expandedSections['gaya'] ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </button>
            {expandedSections['gaya'] && (
              <div className="p-6 pt-0 border-t border-gray-100">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Gaya Desain Worksheet</label>
                    <select value={formData.gayaDesain} onChange={e => setFormData({...formData, gayaDesain: e.target.value})} className="w-full bg-white border border-gray-300 rounded-xl p-3 text-black focus:border-blue-500 transition-all">
                      {Object.keys(designPrompts).map(style => (
                        <option key={style} value={style}>{style}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {error && (
            <div className="bg-white border border-red-200 rounded-lg text-red-700 p-4 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mb-4">
            <ModelSelector label="Model Teks AI" modality="text" value={selectedModel} onChange={setSelectedModel} disabled={isGenerating} />
            <ModelSelector label="Model Gambar AI" modality="image" value={selectedImageModel} onChange={setSelectedImageModel} disabled={isGenerating} />
          </div>
          <button 
            onClick={generateWorksheet} 
            disabled={isGenerating}
            className={`w-full py-4 rounded-xl font-bold text-lg text-black transition-all flex items-center justify-center gap-2 shadow-lg btn-generate-animated ${
              isGenerating 
                ? 'bg-slate-600 cursor-not-allowed' 
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 hover:shadow-blue-500/25'
            }`}
          >
            {isGenerating ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>Menyusun Worksheet...</span>
              </>
            ) : (
              <>
                <Sparkles size={20} /> Generate Worksheet
              </>
            )}
          </button>
        </div>
        
        {/* Result Panel (Bottom) */}
        <div className="w-full bg-white border border-gray-200 rounded-2xl p-6 min-h-[400px]">
          {result ? (
            <div className="space-y-6 text-sm">
              <div className="flex flex-col items-end gap-2">
                <button 
                  onClick={() => setIsPrintModalOpen(true)}
                  className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-lg flex items-center gap-2"
                >
                  <Printer size={18} /> Print Worksheet
                </button>
                <p className="text-[10px] text-gray-500 italic text-right">
                  * Gunakan Chrome di Desktop untuk hasil terbaik. Di mobile, gunakan "Simpan sebagai PDF".<br/>
                  * Jangan lupa support saya agar makin berusaha dalam memperbaiki website ini.
                </p>
              </div>
              <div 
                className="w-full min-h-[500px]"
                dangerouslySetInnerHTML={{ 
                  __html: DOMPurify.sanitize(result, { 
                    ADD_TAGS: ['style', 'iframe'], 
                    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|blob|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i 
                  }) 
                }}
              />
            </div>
          ) : (
            <div className="text-center text-gray-500 h-full flex flex-col items-center justify-center">
              <FileText size={64} className="mb-4 text-gray-300" />
              <p>Worksheet yang dihasilkan akan muncul di sini</p>
            </div>
          )}
        </div>
      </div>

      <PrintSupportModal 
        isOpen={isPrintModalOpen} 
        onClose={() => setIsPrintModalOpen(false)} 
        onConfirm={printWorksheet} 
      />
    </div>
  );
}
