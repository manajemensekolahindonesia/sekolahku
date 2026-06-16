import { parseMarkdown } from '@/lib/markdown';
import React, { useState, useRef, useEffect } from 'react';
import ModelSelector from '@/components/ModelSelector';
import { GoogleGenAI } from '@/lib/genai';
import { Loader2, Printer, LayoutDashboard, Settings, FileText, Save , Trash2 } from 'lucide-react';
import PrintSupportModal from '@/components/PrintSupportModal';
import { educationLevels, phaseClassMap, subjectsByLevel, topicsBySubject } from '@/lib/constants';
import { useAuth } from '@/context/AuthContext';
import { getWatermarkHtml, universalPrint } from '@/lib/print';
import AIAssistedInput from '@/components/AIAssistedInput';
import DOMPurify from 'dompurify';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import LogoUploader from '@/components/LogoUploader';

const ai = new GoogleGenAI({});

export default function ProgramTahunan() {
  const { profile } = useAuth();
  const [formData, setFormData] = useLocalStorage('ProgramTahunanData', {
    jenjang: 'sd',
    kelas: '1',
    fase: 'A',
    tahunAjaran: '2026/2027',
    mapel: 'bahasa-indonesia',
    topik: '',
    isCustomTopik: false,
    namaSekolah: '',
    namaGuru: '',
    jenisNipGuru: 'NIP',
    nipGuru: '',
    kepalaSekolah: '',
    jenisNipKepalaSekolah: 'NIP',
    nipKepalaSekolah: '',
    tempatTanggal: 'Jakarta, 15 Juli 2026',
    tingkatanKognitif: 'Campuran (Sesuai Kurikulum Merdeka)'
  });

  useEffect(() => {
    const phases = phaseClassMap[formData.jenjang]?.phases || [];
    const firstPhase = phases[0]?.id || '';
    
    const classes = phaseClassMap[formData.jenjang]?.classes[firstPhase] || [];
    const firstClass = classes[0]?.id || '';

    const subjects = subjectsByLevel[formData.jenjang] || [];
    const firstSubject = subjects[0]?.id || '';

    const topics = topicsBySubject[firstSubject] || topicsBySubject['default'];
    const firstTopic = topics[0] || '';

    setFormData(prev => ({ ...prev, fase: firstPhase, kelas: firstClass, mapel: firstSubject, topik: firstTopic, isCustomTopik: false }));
  }, [formData.jenjang]);

  useEffect(() => {
    const classes = phaseClassMap[formData.jenjang]?.classes[formData.fase] || [];
    setFormData(prev => ({ ...prev, kelas: classes[0]?.id || '' }));
  }, [formData.fase, formData.jenjang]);

  useEffect(() => {
    const topics = topicsBySubject[formData.mapel] || topicsBySubject['default'];
    setFormData(prev => ({ ...prev, topik: topics[0] || '', isCustomTopik: false }));
  }, [formData.mapel]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedModel, setSelectedModel] = useLocalStorage<string>('ProgramTahunan_selectedModel', 'openai');
  const [useLogo, setUseLogo] = useLocalStorage<boolean>('ProgramTahunan_useLogo', false);
  const [logoUrl, setLogoUrl] = useLocalStorage<string | null>('ProgramTahunan_logoUrl', null);

  const saveProgress = () => {
    alert('Progress otomatis disimpan saat Anda mengetik!');
  };

  const resetProgress = () => {
    if (confirm('Apakah Anda yakin ingin mereset semua data di halaman ini? Data yang belum di-export akan hilang.')) {
      localStorage.removeItem('ProgramTahunanData');
      localStorage.removeItem('ProgramTahunan_selectedModel');
      window.location.reload();
    }
  };

  const [resultHtml, setResultHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const generateProta = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const subjectLabel = subjectsByLevel[formData.jenjang]?.find(s => s.id === formData.mapel)?.label || formData.mapel;
      const faseLabel = phaseClassMap[formData.jenjang]?.phases.find(p => p.id === formData.fase)?.label || formData.fase;
      const kelasLabel = phaseClassMap[formData.jenjang]?.classes[formData.fase]?.find(c => c.id === formData.kelas)?.label || formData.kelas;
      const jenjangLabel = educationLevels.find(l => l.id === formData.jenjang)?.label || formData.jenjang;

      const prompt = `Pastikan dokumen ini disusun sesuai standar terbaru Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi (Kemendikbudristek) serta Kementerian Agama (Kemenag) Republik Indonesia, mengikuti panduan Kurikulum Merdeka yang mengikat.

Buatlah Program Tahunan (Prota) Kurikulum Merdeka untuk mata pelajaran ${subjectLabel} Kelas ${kelasLabel} (Fase ${faseLabel}) Tahun Ajaran ${formData.tahunAjaran}.
Gunakan sumber yang kredibel dari BSKAP Kemendikbudristek terbaru untuk tahun 2026.
${formData.topik ? `Fokuskan atau sertakan topik/materi berikut: ${formData.topik}` : ''}
Tingkatan Kognitif (Taksonomi Bloom): ${formData.tingkatanKognitif}

PENTING - KONTEKS KURIKULUM MERDEKA & PEDAGOGI:
1. Taksonomi Bloom: 
   - Jika memilih C1-C6 spesifik, sesuaikan Kata Kerja Operasional (KKO) pada ATP dengan tingkat tersebut.
   - Jika "Campuran", pastikan ada keseimbangan antara LOTS (Lower Order Thinking Skills: C1-C3) dan HOTS (Higher Order Thinking Skills: C4-C6).
   - Perhatikan Dimensi Pengetahuan: Faktual, Konseptual, Prosedural, dan Metakognitif.
   - JANGAN tampilkan label (C1, C2, dll) pada hasil akhir, cukup gunakan KKO yang tepat.
2. Tujuan Pembelajaran (ABCD): Jika memungkinkan, formulasikan tujuan/ATP dengan prinsip Audience (Peserta didik), Behavior (Perilaku/KKO), Condition (Kondisi pembelajaran), dan Degree (Kriteria keberhasilan).
3. TPACK & STEAM: Integrasikan pendekatan Technological Pedagogical Content Knowledge (TPACK) dan Science, Technology, Engineering, Art, Mathematics (STEAM) dalam rancangan kegiatan atau ATP jika relevan.

Buat dalam format HTML lengkap yang siap dicetak (A4).
Gunakan styling CSS inline yang rapi, profesional, dan mudah dibaca.

Struktur Dokumen HTML:
1. Kop Surat/Judul: "PROGRAM TAHUNAN (PROTA) KURIKULUM MERDEKA" (Tengah/Center, Huruf Tebal)
2. Identitas (Buat tanpa border luar, rapi, rata kiri):
   - Satuan Pendidikan: ${formData.namaSekolah || '...........................'}
   - Mata Pelajaran: ${subjectLabel}
   - Kelas / Fase: ${kelasLabel} / ${faseLabel}
   - Tahun Pelajaran: ${formData.tahunAjaran}
3. Capaian Pembelajaran (CP) Fase ${faseLabel} untuk mata pelajaran ${subjectLabel}.
4. Tabel Prota:
   - Kolom: No, Semester, Alur Tujuan Pembelajaran (ATP) / Materi Pokok, Alokasi Waktu (JP), dan Keterangan.
   - Isi tabel dengan contoh ATP yang relevan dibagi menjadi Semester Ganjil dan Semester Genap.
OUTPUT HANYA KODE HTML (tanpa tag markdown \`\`\`html). Pastikan menggunakan tag <table> yang di-style dengan border-collapse dan width 100%. Jangan membungkus bagian Identitas dengan kotak bergaris/border tebal.`;

      const response = await ai.models.generateContent({
        model: selectedModel,
        contents: prompt,
        config: { temperature: 0.7 }
      });

      let htmlContent = response.text || '';
      if (htmlContent.includes('\`\`\`html')) {
        htmlContent = htmlContent.replace(/\`\`\`html/g, '').replace(/\`\`\`/g, '');
      } else if (htmlContent.includes('\`\`\`')) {
        htmlContent = htmlContent.replace(/\`\`\`/g, '');
      }

      setResultHtml(htmlContent.trim());
    } catch (err: any) {
      console.error(err);
      setError('Terjadi kesalahan saat membuat prota: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const printDocument = () => {
    const printContent = printRef.current?.innerHTML;
    if (printContent) {
      universalPrint(`
        ${useLogo && logoUrl ? `<div style="text-align: center; margin-bottom: 20px;"><img src="${logoUrl}" style="height: 80px; width: auto;" alt="Logo"/></div>` : ''}
            ${printContent}
            ${getWatermarkHtml(profile?.role)}
      `, 'Print Program Tahunan');
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="gen-card bg-white  rounded-3xl p-6 md:p-8 shadow-2xl">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <LayoutDashboard size={24} className="text-black" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-black">Program Tahunan (Prota)</h2>
            <p className="text-gray-600 text-sm">Generate Program Tahunan Kurikulum Merdeka 2026</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="text-lg font-semibold text-black flex items-center gap-2 mb-4">
                <Settings size={18} className="text-orange-400" /> Pengaturan
              </h3>
              
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tahun Ajaran</label>
                <AIAssistedInput type="text" value={formData.tahunAjaran} onChange={e => setFormData({...formData, tahunAjaran: e.target.value})} className="w-full bg-white border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-orange-500 transition-all" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Jenjang</label>
                  <select value={formData.jenjang} onChange={e => setFormData({...formData, jenjang: e.target.value})} className="w-full bg-white border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-orange-500 transition-all">
                    {educationLevels.map(level => (
                      <option key={level.id} value={level.id}>{level.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Fase</label>
                  <select value={formData.fase} onChange={e => setFormData({...formData, fase: e.target.value})} className="w-full bg-white border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-orange-500 transition-all">
                    {phaseClassMap[formData.jenjang]?.phases.map(p => (
                      <option key={p.id} value={p.id}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Kelas</label>
                  <select value={formData.kelas} onChange={e => setFormData({...formData, kelas: e.target.value})} className="w-full bg-white border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-orange-500 transition-all">
                    {phaseClassMap[formData.jenjang]?.classes[formData.fase]?.map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Mata Pelajaran</label>
                  <select value={formData.mapel} onChange={e => setFormData({...formData, mapel: e.target.value})} className="w-full bg-white border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-orange-500 transition-all">
                    {subjectsByLevel[formData.jenjang]?.map(sub => (
                      <option key={sub.id} value={sub.id}>{sub.label}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Topik/Materi Khusus (Opsional)</label>
                  <select 
                    value={formData.isCustomTopik ? 'lainnya' : formData.topik} 
                    onChange={e => {
                      const val = e.target.value;
                      if (val === 'lainnya') {
                        setFormData({...formData, isCustomTopik: true, topik: ''});
                      } else {
                        setFormData({...formData, isCustomTopik: false, topik: val});
                      }
                    }} 
                    className="w-full bg-white border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-orange-500 transition-all"
                  >
                    <option value="">-- Semua Topik/Materi --</option>
                    {(topicsBySubject[formData.mapel] || topicsBySubject['default']).map((topic, idx) => (
                      <option key={idx} value={topic}>{topic}</option>
                    ))}
                    <option value="lainnya">Lainnya (+)</option>
                  </select>
                  {formData.isCustomTopik && (
                    <AIAssistedInput type="text" 
                      placeholder="Masukkan Topik/Materi secara manual..." 
                      value={formData.topik} 
                      onChange={e => setFormData({...formData, topik: e.target.value})} 
                      className="w-full bg-white border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-orange-500 transition-all mt-3" 
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tingkatan Kognitif (Taksonomi Bloom)</label>
                <select value={formData.tingkatanKognitif} onChange={e => setFormData({...formData, tingkatanKognitif: e.target.value})} className="w-full bg-white border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-orange-500 transition-all">
                  <option value="C1: Mengingat (Remembering)">C1: Mengingat (Remembering)</option>
                  <option value="C2: Memahami (Understanding)">C2: Memahami (Understanding)</option>
                  <option value="C3: Menerapkan (Applying)">C3: Menerapkan (Applying)</option>
                  <option value="C4: Menganalisis (Analyzing)">C4: Menganalisis (Analyzing)</option>
                  <option value="C5: Mengevaluasi (Evaluating)">C5: Mengevaluasi (Evaluating)</option>
                  <option value="C6: Menciptakan (Creating)">C6: Menciptakan (Creating)</option>
                  <option value="Campuran (Sesuai Kurikulum Merdeka)">Campuran (Sesuai Kurikulum Merdeka)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nama Sekolah</label>
                <AIAssistedInput type="text" value={formData.namaSekolah} onChange={e => setFormData({...formData, namaSekolah: e.target.value})} className="w-full bg-white border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-orange-500 transition-all" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nama Guru</label>
                <AIAssistedInput type="text" value={formData.namaGuru} onChange={e => setFormData({...formData, namaGuru: e.target.value})} className="w-full bg-white border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-orange-500 transition-all" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nomor Induk Guru</label>
                <div className="flex gap-2">
                  <select value={formData.jenisNipGuru} onChange={e => setFormData({...formData, jenisNipGuru: e.target.value})} className="w-1/3 bg-white border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-orange-500 transition-all">
                    <option value="NIP">NIP</option>
                    <option value="NUPTK">NUPTK</option>
                    <option value="NIY">NIY</option>
                    <option value="NRG">NRG</option>
                    <option value="NPK">NPK</option>
                  </select>
                  <AIAssistedInput type="text" value={formData.nipGuru} onChange={e => setFormData({...formData, nipGuru: e.target.value})} className="w-2/3 bg-white border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-orange-500 transition-all" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Kepala Sekolah</label>
                <AIAssistedInput type="text" value={formData.kepalaSekolah} onChange={e => setFormData({...formData, kepalaSekolah: e.target.value})} className="w-full bg-white border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-orange-500 transition-all" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nomor Induk Kepala Sekolah</label>
                <div className="flex gap-2">
                  <select value={formData.jenisNipKepalaSekolah} onChange={e => setFormData({...formData, jenisNipKepalaSekolah: e.target.value})} className="w-1/3 bg-white border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-orange-500 transition-all">
                    <option value="NIP">NIP</option>
                    <option value="NUPTK">NUPTK</option>
                    <option value="NIY">NIY</option>
                    <option value="NRG">NRG</option>
                    <option value="NPK">NPK</option>
                  </select>
                  <AIAssistedInput type="text" value={formData.nipKepalaSekolah} onChange={e => setFormData({...formData, nipKepalaSekolah: e.target.value})} className="w-2/3 bg-white border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-orange-500 transition-all" />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tempat, Tanggal Penetapan</label>
                <AIAssistedInput type="text" value={formData.tempatTanggal} onChange={e => setFormData({...formData, tempatTanggal: e.target.value})} className="w-full bg-white border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-green-500 transition-all" />
              </div>

              <LogoUploader useLogo={useLogo} setUseLogo={setUseLogo} logoUrl={logoUrl} setLogoUrl={setLogoUrl} />
            </div>

            
              <ModelSelector modality="text" value={selectedModel} onChange={setSelectedModel} disabled={isGenerating} />
<div className="flex flex-wrap gap-2 mt-4 w-full">
              <button 
                onClick={saveProgress}
                className="px-4 py-3 bg-red-100 hover:bg-slate-600 text-black rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                title="Simpan Progress"
              >
                <Save size={18} /> Simpan
              </button>
              <button 
                onClick={resetProgress}
                className="px-4 py-3 bg-red-100 hover:bg-slate-600 text-black rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                title="Reset Data"
              >
                <Trash2 size={18} /> Reset
              </button>
              <button 
              onClick={generateProta}
              disabled={isGenerating}
              className="flex-1 py-4 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-black rounded-xl font-bold text-lg shadow-xl shadow-orange-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2 btn-generate-animated"
            >
              {isGenerating ? <><Loader2 className="animate-spin" /> Menyusun...</> : <><FileText /> Buat Prota</>}
            </button>
            </div>

            {error && <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{error}</div>}
          </div>

          <div className="lg:col-span-2">
            <div className="bg-slate-200 rounded-2xl border border-slate-300 h-full min-h-[600px] flex flex-col overflow-hidden relative">
              <div className="bg-slate-300 px-4 py-3 border-b border-slate-400 flex justify-between items-center">
                <span className="text-slate-700 font-medium text-sm flex items-center gap-2">
                  <FileText size={16} /> Preview Dokumen
                </span>
                {resultHtml && (
                  <div className="flex flex-col items-end gap-1">
                    <button onClick={() => setIsPrintModalOpen(true)} className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-black text-sm font-medium rounded-lg flex items-center gap-2 transition-colors">
                      <Printer size={16} /> Cetak A4
                    </button>
                    <p className="text-[9px] text-slate-600 italic text-right">
                      * Gunakan Chrome di Desktop untuk hasil terbaik. Di mobile, gunakan "Simpan sebagai PDF".<br/>
                      * Jangan lupa support saya agar makin berusaha dalam memperbaiki website ini.
                    </p>
                  </div>
                )}
              </div>
              <div className="flex-1 overflow-auto p-8 bg-white text-black">
                {isGenerating ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4">
                    <Loader2 size={48} className="animate-spin text-orange-500" />
                    <p>Menyusun Program Tahunan 2026/2027...</p>
                  </div>
                ) : resultHtml ? (
                  <div ref={printRef} className="print-container relative w-full pb-16">
                    <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(resultHtml) }} />
                    {(formData.kepalaSekolah || formData.namaGuru) && (
                      <div className="mt-12 flex justify-between" style={{ pageBreakInside: 'avoid' }}>
                        <div className="w-[45%] text-center text-sm">
                          <p>Mengetahui,</p>
                          <p>Kepala Sekolah</p>
                          <br/><br/><br/><br/>
                          <p className="font-bold underline mb-0">{formData.kepalaSekolah || '................................'}</p>
                          <p className="mt-0">{formData.jenisNipKepalaSekolah || 'NIP'}. {formData.nipKepalaSekolah || '................................'}</p>
                        </div>
                        <div className="w-[45%] text-center text-sm">
                          <p>{formData.tempatTanggal || '................., .........................'}</p>
                          <p>Guru Mata Pelajaran</p>
                          <br/><br/><br/><br/>
                          <p className="font-bold underline mb-0">{formData.namaGuru || '................................'}</p>
                          <p className="mt-0">{formData.jenisNipGuru || 'NIP'}. {formData.nipGuru || '................................'}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-600">
                    <LayoutDashboard size={64} className="mb-4 opacity-20" />
                    <p>Belum ada dokumen. Silakan klik "Buat Prota".</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <PrintSupportModal isOpen={isPrintModalOpen} onClose={() => setIsPrintModalOpen(false)} onConfirm={printDocument} />
    </div>
  );
}
