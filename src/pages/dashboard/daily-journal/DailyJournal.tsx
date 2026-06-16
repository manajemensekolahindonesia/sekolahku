import React, { useState, useEffect } from 'react';
import { parseMarkdown } from '@/lib/markdown';
import { BookOpen, Sparkles, Printer, Loader2, Save, Trash2, List, FileText, ClipboardList, Target, BarChart, MessageCircle, Calculator, Layout, AlertCircle, Download, Upload, ChevronDown, ChevronUp } from 'lucide-react';
import { mapelNames, cpData, atpData, educationLevels, phaseClassMap, subjectsByLevel, topicsBySubject } from '@/lib/constants';
import PrintSupportModal from '@/components/PrintSupportModal';
import { useAuth } from '@/context/AuthContext';
import { getWatermarkHtml, createPrintWindow } from '@/lib/print';
import AIAssistedInput from '@/components/AIAssistedInput';
import AIAssistedTextarea from '@/components/AIAssistedTextarea';
import { GoogleGenAI, Type } from '@/lib/genai';
import ModelSelector from '@/components/ModelSelector';
import { useLocalStorage } from '@/hooks/useLocalStorage';

export default function DailyJournal() {
  const { profile } = useAuth();
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [formData, setFormData] = useLocalStorage('DailyJournalData', {
    namaGuru: '', jenisNipGuru: 'NIP', nip: '', namaSekolah: '', jenisSekolah: 'Negeri', kepalaSekolah: '', jenisNipKepalaSekolah: 'NIP', nipKepalaSekolah: '', jenjang: 'sd', kelas: '1', fase: 'A',
    semester: '1', tahunAjaran: '', mapel: 'bahasa-indonesia', topik: '', isCustomTopik: false, tanggal: new Date().toISOString().split('T')[0], jam: '',
    cp: '', atp: '', catatan: '', refleksi: '', ttdGuru: '', ttdKS: ''
  });
  
  const [result, setResult] = useState<any>(null);
  const [selectedModel, setSelectedModel] = useLocalStorage<string>('DailyJournal_selectedModel', 'openai');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({ guru: true, detail: true });
  const toggleSection = (id: string) => {
    setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    const now = new Date();
    const currentJam = now.toTimeString().slice(0, 5);
    setFormData(prev => ({ ...prev, jam: currentJam }));
  }, []);

  useEffect(() => {
    const defaultCp = cpData[formData.mapel]?.[formData.fase] || '';
    const defaultAtp = atpData[formData.mapel]?.[formData.fase] || '';
    const topics = topicsBySubject[formData.mapel] || topicsBySubject['default'];
    setFormData(prev => ({ ...prev, cp: defaultCp, atp: defaultAtp, topik: topics[0] || '', isCustomTopik: false }));
  }, [formData.mapel, formData.fase]);

  useEffect(() => {
    const phases = phaseClassMap[formData.jenjang]?.phases || [];
    if (!phases.find(p => p.id === formData.fase)) {
      const firstPhase = phases[0]?.id || '';
      const classes = phaseClassMap[formData.jenjang]?.classes[firstPhase] || [];
      const firstClass = classes[0]?.id || '';
      
      const subjects = subjectsByLevel[formData.jenjang] || [];
      const firstSubject = subjects[0]?.id || '';
      
      const topics = topicsBySubject[firstSubject] || topicsBySubject['default'];
      const firstTopic = topics[0] || '';
      
      setFormData(prev => ({ ...prev, fase: firstPhase, kelas: firstClass, mapel: firstSubject, topik: firstTopic, isCustomTopik: false }));
    } else {
      const classes = phaseClassMap[formData.jenjang]?.classes[formData.fase] || [];
      if (!classes.find(c => c.id === formData.kelas)) {
        setFormData(prev => ({ ...prev, kelas: classes[0]?.id || '' }));
      }
    }
  }, [formData.jenjang, formData.fase]);

  const generateJurnal = async () => {
    setIsGenerating(true);
    setError('');
    
    try {
      const ai = new GoogleGenAI({});
      const modelToUse = selectedModel || 'openai';
      const mapelLabel = subjectsByLevel[formData.jenjang]?.find(s => s.id === formData.mapel)?.label || mapelNames[formData.mapel] || formData.mapel;
      
      const prompt = `Pastikan dokumen ini disusun sesuai standar terbaru Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi (Kemendikbudristek) serta Kementerian Agama (Kemenag) Republik Indonesia, mengikuti panduan Kurikulum Merdeka yang mengikat.

Buatkan Catatan Pembelajaran dan Refleksi Guru untuk Jurnal Harian Pembelajaran dengan detail berikut:
Detail Pembelajaran:
- Mata Pelajaran: ${mapelLabel}
- Topik/Materi: ${formData.topik}
- Jenjang: ${formData.jenjang.toUpperCase()}
- Kelas: ${formData.kelas}
- Fase: ${formData.fase}
- Capaian Pembelajaran (CP): ${formData.cp}
- Alur Tujuan Pembelajaran (ATP): ${formData.atp}

Tolong buatkan:
1. Catatan Pembelajaran: Deskripsi pelaksanaan pembelajaran secara konkret, terstruktur, mencakup pembukaan, kegiatan inti (misal: diskusi kelompok, praktik, atau eksplorasi), dan penutup.
2. Refleksi & Evaluasi Guru: Analisis keberhasilan pembelajaran, kendala yang dihadapi siswa, dan tindak lanjut (perbaikan/pengayaan) untuk pertemuan berikutnya.

ATURAN KETAT PENULISAN (SANGAT PENTING):
1. JANGAN memuat singkatan "P5" atau istilah "Proyek Penguatan Profil Pelajar Pancasila". Gantilah semua dengan istilah "Kokurikuler" atau "Kegiatan Kokurikuler" atau "Modul Kokurikuler".
2. Tuliskan teks dalam bahasa Indonesia yang baku, formal, bebas typo, dan informatif.
3. Kembalikan hasil dalam format JSON terstruktur dengan properti:
   - "catatan": Teks catatan pembelajaran (panjang sedang, 2-3 paragraf).
   - "refleksi": Teks refleksi guru (panjang sedang, 2-3 paragraf).
PASTIKAN HANYA MENGEMBALIKAN JSON VALID.`;

      const response = await ai.models.generateContent({
        model: modelToUse,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              catatan: { type: Type.STRING },
              refleksi: { type: Type.STRING }
            },
            required: ['catatan', 'refleksi']
          }
        }
      });

      let catatanGen = '';
      let refleksiGen = '';

      if (response.text) {
        try {
          const data = JSON.parse(response.text);
          catatanGen = data.catatan || '';
          refleksiGen = data.refleksi || '';
        } catch (e) {
          throw new Error('Gagal memproses respons AI. Pastikan JSON valid.');
        }
      } else {
        throw new Error('Gagal menghasilkan konten dari AI.');
      }

      const tanggalObj = new Date(formData.tanggal || new Date());
      const tanggalFormat = tanggalObj.toLocaleDateString('id-ID', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
      });

      const jenjangLabel = educationLevels.find(l => l.id === formData.jenjang)?.label || formData.jenjang.toUpperCase();
      const faseLabel = phaseClassMap[formData.jenjang]?.phases.find(p => p.id === formData.fase)?.label || formData.fase;
      const kelasLabel = phaseClassMap[formData.jenjang]?.classes[formData.fase]?.find(c => c.id === formData.kelas)?.label || formData.kelas;

      const newFormData = {
        ...formData,
        catatan: catatanGen,
        refleksi: refleksiGen
      };

      setFormData(newFormData);

      setResult({ 
        ...newFormData, 
        tanggalFormat, 
        jenjangLabel,
        faseLabel,
        kelasLabel,
        mapelName: mapelLabel 
      });

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Terjadi kesalahan saat menghasilkan jurnal.');
    } finally {
      setIsGenerating(false);
    }
  };

  const printJurnal = () => {
    if (!result) return;
    
    const printWindow = createPrintWindow();
    if (!printWindow) return;

    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]')).map(el => el.outerHTML).join('\n');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
          <title>Jurnal Harian Pembelajaran</title>
          <style>
              @page {
                size: A4;
                margin: 0;
              }
              @media print {
                  body { 
                    -webkit-print-color-adjust: exact; 
                    print-color-adjust: exact; 
                    margin: 0;
                    padding: 10mm;
                  }
                  .no-print { display: none; }
                  .content-wrapper {
                    max-width: 100% !important;
                    padding: 5mm !important;
                    margin: 0 !important;
                  }
              }
              body {
                font-family: 'Times New Roman', Times, serif;
                background: white;
                position: relative;
                min-height: 100vh;
                margin: 0;
                padding: 0;
                line-height: 1.6;
              }
              .watermark {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) rotate(-45deg);
                font-size: 5vw;
                color: rgba(0, 0, 0, 0.05);
                white-space: nowrap;
                pointer-events: none;
                z-index: -1;
                font-weight: bold;
                text-transform: uppercase;
              }
              .content-wrapper {
                width: 100%;
                max-width: 210mm;
                margin: 0 auto;
                padding: 15mm;
                box-sizing: border-box;
              }
              h1, h2, h3 { text-align: center; margin: 5px 0; }
              h1 { font-size: 16px; text-decoration: underline; }
              table { width: 100%; border-collapse: collapse; margin: 10px 0; }
              th, td { border: 1px solid #000; padding: 8px; text-align: left; }
              th { background: #f5f5f5; font-weight: bold; }
              .section { margin: 15px 0; }
              .section-title { font-weight: bold; margin-top: 10px; margin-bottom: 5px; }
              .content { margin-left: 20px; }
              .sign-area { margin-top: 40px; display: flex; justify-content: space-between; }
              .sign-box { width: 40%; text-align: center; }
              .sign-line { border-top: 1px solid #000; margin-top: 60px; }
              .support-footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 2px solid #eee;
                text-align: center;
                font-size: 11px;
                color: #666;
              }
              .support-links {
                margin-top: 8px;
                display: flex;
                justify-content: center;
                gap: 15px;
                font-weight: bold;
                color: #2563eb;
              }
          
              table { width: 100%; border-collapse: collapse; margin-bottom: 20px; page-break-inside: auto; }
              tr { page-break-inside: avoid; page-break-after: auto; }
              thead { display: table-header-group; }
              tfoot { display: table-footer-group; }
            </style>
      
          ${styles}
          <style>
            td ul, .content-wrapper ul { list-style-type: disc !important; padding-left: 20px !important; margin-bottom: 8px !important; }
            td ol, .content-wrapper ol { list-style-type: decimal !important; padding-left: 20px !important; margin-bottom: 8px !important; }
            td p, .content-wrapper p { margin-bottom: 8px !important; }
            .html-content table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 10px; }
            .html-content th, .html-content td { border: 1px solid #cbd5e1; padding: 8px; }
            .html-content th { background-color: #f1f5f9; font-weight: bold; }
          </style></head>
      <body>
          <div class="watermark">PEMURYADI - MAJU PENDIDIKAN INDONESIA</div>
          <div class="content-wrapper">
              <h1>JURNAL HARIAN PEMBELAJARAN</h1>
              <p style="text-align: center; margin-bottom: 20px;">Kurikulum Merdeka</p>

              <div class="section">
                  <div class="section-title">A. IDENTITAS GURU & SEKOLAH</div>
                  <table>
                      <tr><td width="25%"><b>Nama Guru</b></td><td>${result.namaGuru || '-'}</td></tr>
                      <tr><td><b>${result.jenisNipGuru || 'NIP'} Guru</b></td><td>${result.nip || '-'}</td></tr>
                      <tr><td><b>Kepala Sekolah</b></td><td>${result.kepalaSekolah || '-'}</td></tr>
                      <tr><td><b>${result.jenisNipKepalaSekolah || 'NIP'} Kepsek</b></td><td>${result.nipKepalaSekolah || '-'}</td></tr>
                      <tr><td><b>Nama Sekolah</b></td><td>${result.namaSekolah || '-'} (${result.jenisSekolah || 'Negeri'})</td></tr>
                  </table>
              </div>

              <div class="section">
                  <div class="section-title">B. DATA PEMBELAJARAN</div>
                  <table>
                      <tr><td width="25%"><b>Mata Pelajaran</b></td><td>${result.mapelName || '-'}</td></tr>
                      <tr><td><b>Topik/Materi</b></td><td>${result.topik || '-'}</td></tr>
                      <tr><td><b>Jenjang / Kelas / Fase</b></td><td>${result.jenjangLabel || '-'} / ${result.kelasLabel || '-'} / ${result.faseLabel || '-'}</td></tr>
                      <tr><td><b>Semester</b></td><td>${result.semester || '-'}</td></tr>
                      <tr><td><b>Tanggal / Jam</b></td><td>${result.tanggalFormat} / ${result.jam || '-'}</td></tr>
                  </table>
              </div>

              <div class="section">
                  <div class="section-title">C. CAPAIAN PEMBELAJARAN (CP)</div>
                  <div class="content html-content">${parseMarkdown(result.cp)}</div>
              </div>

              <div class="section">
                  <div class="section-title">D. ALUR TUJUAN PEMBELAJARAN (ATP)</div>
                  <div class="content html-content">${parseMarkdown(result.atp)}</div>
              </div>

              <div class="section">
                  <div class="section-title">E. CATATAN PEMBELAJARAN</div>
                  <div class="content html-content">${parseMarkdown(result.catatan)}</div>
              </div>

              <div class="section">
                  <div class="section-title">F. REFLEKSI & EVALUASI</div>
                  <div class="content html-content">${parseMarkdown(result.refleksi)}</div>
              </div>

              ${(result.kepalaSekolah || result.ttdKS || result.namaGuru || result.ttdGuru) ? `<div style="margin-top: 40px; display: flex; justify-content: space-between; text-align: center; font-size: 12px; page-break-inside: avoid;">
                  <div style="width: 45%;">
                      <p>Mengetahui,</p>
                      <p>Kepala Sekolah</p>
                      <br><br><br><br>
                      <p style="font-weight: bold; text-decoration: underline;">${result.kepalaSekolah || result.ttdKS || '................................'}</p>
                      <p>${result.jenisNipKepalaSekolah || 'NIP'}. ${result.nipKepalaSekolah || '................................'}</p>
                  </div>
                  <div style="width: 45%;">
                      <p>Dibuat pada, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      <p>Guru Mata Pelajaran</p>
                      <br><br><br><br>
                      <p style="font-weight: bold; text-decoration: underline;">${result.namaGuru || result.ttdGuru || '................................'}</p>
                      <p>${result.jenisNipGuru || 'NIP'}. ${result.nip || '................................'}</p>
                  </div>
              </div>` : ''}
              <div class="support-footer">
                  <p>Dokumen ini dihasilkan secara otomatis oleh <strong>Daily Journal - Pemuryadi</strong></p>
                  <p>Maju Pendidikan Indonesia &copy; ${new Date().getFullYear()}</p>
                  <p style="margin-top: 10px; font-style: italic;">"Dukungan Anda sangat berarti bagi kami untuk terus mengembangkan platform ini secara gratis."</p>
                  <div class="support-links">
                      <span>Saweria: saweria.co/pemuryadi</span>
                      <span>FB/IG/TikTok: @p.e.muryadi</span>
                  </div>
              </div>
          </div>
          ${getWatermarkHtml(profile?.role)}
          <script>
            setTimeout(() => {
              window.print();
            }, 1000);
          </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="gen-card rounded-2xl p-6 md:p-8  shadow-xl">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-2xl shadow-lg">
          📔
        </div>
        <div>
          <h3 className="text-2xl font-bold text-black">Jurnal Harian Pembelajaran</h3>
          <p className="text-gray-600">Terintegrasi dengan Modul Ajar & Sesuai Kurikulum Merdeka</p>
        </div>
      </div>
      
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <button onClick={() => toggleSection('guru')} className="w-full flex items-center justify-between p-6 bg-white hover:bg-gray-50 transition-colors text-left">
              <h4 className="font-semibold text-amber-600 flex items-center gap-2"><FileText size={18} className="text-blue-500 inline-block mr-1"/> Data Guru</h4>
              {expandedSections.guru ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </button>
            {expandedSections.guru && (
              <div className="p-6 pt-0 space-y-3 border-t border-gray-100">
                <AIAssistedInput type="text" placeholder="Nama Guru" value={formData.namaGuru} onChange={e => setFormData({...formData, namaGuru: e.target.value})} className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-gray-900 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all" />
                <div className="flex gap-2">
                  <select value={formData.jenisNipGuru} onChange={e => setFormData({...formData, jenisNipGuru: e.target.value})} className="w-1/3 bg-gray-50 border border-gray-300 rounded-xl p-3 text-gray-900 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all">
                    <option value="NIP">NIP</option>
                    <option value="NUPTK">NUPTK</option>
                    <option value="NIY">NIY</option>
                    <option value="NRG">NRG</option>
                    <option value="NPK">NPK</option>
                  </select>
                  <AIAssistedInput type="text" placeholder="Nomor Induk Guru" value={formData.nip} onChange={e => setFormData({...formData, nip: e.target.value})} className="w-2/3 bg-gray-50 border border-gray-300 rounded-xl p-3 text-gray-900 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all" />
                </div>
                <AIAssistedInput type="text" placeholder="Nama Sekolah" value={formData.namaSekolah} onChange={e => setFormData({...formData, namaSekolah: e.target.value})} className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-gray-900 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all" />
                <select value={formData.jenisSekolah} onChange={e => setFormData({...formData, jenisSekolah: e.target.value})} className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-gray-900 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all">
                  <option value="Negeri">Negeri</option>
                  <option value="Swasta">Swasta</option>
                  <option value="Islam Terpadu">Islam Terpadu</option>
                </select>
                <AIAssistedInput type="text" placeholder="Nama Kepala Sekolah" value={formData.kepalaSekolah} onChange={e => setFormData({...formData, kepalaSekolah: e.target.value})} className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-gray-900 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all" />
                <div className="flex gap-2">
                  <select value={formData.jenisNipKepalaSekolah} onChange={e => setFormData({...formData, jenisNipKepalaSekolah: e.target.value})} className="w-1/3 bg-gray-50 border border-gray-300 rounded-xl p-3 text-gray-900 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all">
                    <option value="NIP">NIP</option>
                    <option value="NUPTK">NUPTK</option>
                    <option value="NIY">NIY</option>
                    <option value="NRG">NRG</option>
                    <option value="NPK">NPK</option>
                  </select>
                  <AIAssistedInput type="text" placeholder="Nomor Induk Kepala Sekolah" value={formData.nipKepalaSekolah} onChange={e => setFormData({...formData, nipKepalaSekolah: e.target.value})} className="w-2/3 bg-gray-50 border border-gray-300 rounded-xl p-3 text-gray-900 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all" />
                </div>
              </div>
            )}
          </div>
          
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <button onClick={() => toggleSection('detail')} className="w-full flex items-center justify-between p-6 bg-white hover:bg-gray-50 transition-colors text-left">
              <h4 className="font-semibold text-amber-600 flex items-center gap-2"><ClipboardList size={18} className="text-blue-500 inline-block mr-1"/> Detail Jurnal</h4>
              {expandedSections.detail ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </button>
            {expandedSections.detail && (
              <div className="p-6 pt-0 space-y-4 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Jenjang</label>
                    <select value={formData.jenjang} onChange={e => setFormData({...formData, jenjang: e.target.value})} className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all">
                      {educationLevels.map(level => (
                        <option key={level.id} value={level.id}>{level.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Fase</label>
                    <select value={formData.fase} onChange={e => setFormData({...formData, fase: e.target.value})} className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all">
                      {phaseClassMap[formData.jenjang]?.phases.map(p => (
                        <option key={p.id} value={p.id}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Kelas / Semester</label>
                    <div className="flex gap-2">
                      <select value={formData.kelas} onChange={e => setFormData({...formData, kelas: e.target.value})} className="w-1/2 bg-gray-50 border border-gray-300 rounded-xl p-3 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all">
                        {phaseClassMap[formData.jenjang]?.classes[formData.fase]?.map(c => (
                          <option key={c.id} value={c.id}>{c.label}</option>
                        ))}
                      </select>
                      <select value={formData.semester} onChange={e => setFormData({...formData, semester: e.target.value})} className="w-1/2 bg-gray-50 border border-gray-300 rounded-xl p-3 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all">
                        <option value="1">Semester 1</option><option value="2">Semester 2</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mata Pelajaran</label>
                    <select value={formData.mapel} onChange={e => setFormData({...formData, mapel: e.target.value})} className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all">
                      {subjectsByLevel[formData.jenjang]?.map(s => (
                        <option key={s.id} value={s.id}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Topik/Materi</label>
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
                      className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    >
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
                        className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all mt-3" 
                      />
                    )}
                  </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal</label>
                    <AIAssistedInput type="date" value={formData.tanggal} onChange={e => setFormData({...formData, tanggal: e.target.value})} className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Jam</label>
                    <AIAssistedInput type="time" value={formData.jam} onChange={e => setFormData({...formData, jam: e.target.value})} className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all" />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">🎯 Capaian Pembelajaran (CP)</label>
                    <AIAssistedTextarea rows={2} value={formData.cp} onChange={e => setFormData({...formData, cp: e.target.value})} className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-gray-900 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all" placeholder="Capaian pembelajaran..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">📌 Alur Tujuan Pembelajaran (ATP)</label>
                    <AIAssistedTextarea rows={2} value={formData.atp} onChange={e => setFormData({...formData, atp: e.target.value})} className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-gray-900 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all" placeholder="Alur tujuan pembelajaran..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">📝 Catatan Pembelajaran</label>
                    <AIAssistedTextarea rows={3} value={formData.catatan} onChange={e => setFormData({...formData, catatan: e.target.value})} className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-gray-900 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all" placeholder="Catatan pelaksanaan..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">🔍 Refleksi & Evaluasi</label>
                    <AIAssistedTextarea rows={3} value={formData.refleksi} onChange={e => setFormData({...formData, refleksi: e.target.value})} className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-gray-900 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all" placeholder="Refleksi..." />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nama Kepala Sekolah</label>
                    <AIAssistedInput type="text" value={formData.ttdKS} onChange={e => setFormData({...formData, ttdKS: e.target.value})} className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all" placeholder="Nama Kepala Sekolah" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nama Guru (Tanda Tangan)</label>
                    <AIAssistedInput type="text" value={formData.ttdGuru} onChange={e => setFormData({...formData, ttdGuru: e.target.value})} className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all" placeholder="Nama Guru" />
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-4 space-y-4">
            <ModelSelector modality="text" value={selectedModel} onChange={setSelectedModel} disabled={isGenerating} />
            
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2">
                <span className="text-red-500 shrink-0">⚠️</span>
                <p className="text-xs text-red-400">{error}</p>
              </div>
            )}

            <div className="flex gap-4">
              <button 
                onClick={generateJurnal} 
                disabled={isGenerating}
                className="flex-1 py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 font-bold text-lg text-black hover:opacity-90 transition-all shadow-lg hover:shadow-amber-500/25 btn-generate-animated flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <span>📔 Generate Jurnal</span>
                  </>
                )}
              </button>
              <button 
                onClick={() => setIsPrintModalOpen(true)} 
                disabled={!result || isGenerating} 
                className="flex-1 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-lg text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2"
              >
                <span>🖨️ Print</span>
              </button>
            </div>
          </div>
          <p className="text-[10px] text-gray-500 italic text-center mt-2">
            * Gunakan Chrome di Desktop untuk hasil terbaik. Di mobile, gunakan "Simpan sebagai PDF".<br/>
            * Jangan lupa support saya agar makin berusaha dalam memperbaiki website ini.
          </p>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-2xl p-6 min-h-[600px] overflow-auto shadow-sm">
          {result ? (
            <div className="space-y-4 text-sm">
              <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-xl p-6 border border-amber-500/30 text-center shadow-inner">
                <h3 className="text-xl font-bold text-black mb-2 tracking-wide">JURNAL HARIAN PEMBELAJARAN</h3>
                <h4 className="text-amber-600 font-medium">Kurikulum Merdeka</h4>
              </div>

              <details className="bg-gray-50 border border-gray-200 rounded-xl p-5 shadow-sm group" open>
                <summary className="font-semibold text-blue-400 mb-4 flex items-center justify-between cursor-pointer list-none">
                  <div className="flex items-center gap-2">👨‍🏫 IDENTITAS</div>
                  <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="grid grid-cols-2 gap-y-3 text-gray-700 text-sm">
                  <p><span className="text-gray-500 block text-xs mb-1">Nama Guru</span> <span className="font-medium text-black">{result.namaGuru || '-'}</span></p>
                  <p><span className="text-gray-500 block text-xs mb-1">{result.jenisNipGuru || 'NIP'} Guru</span> <span className="font-medium text-black">{result.nip || '-'}</span></p>
                  <p><span className="text-gray-500 block text-xs mb-1">Kepala Sekolah</span> <span className="font-medium text-black">{result.kepalaSekolah || '-'}</span></p>
                  <p><span className="text-gray-500 block text-xs mb-1">{result.jenisNipKepalaSekolah || 'NIP'} Kepsek</span> <span className="font-medium text-black">{result.nipKepalaSekolah || '-'}</span></p>
                  <p className="col-span-2"><span className="text-gray-500 block text-xs mb-1">Sekolah</span> <span className="font-medium text-black">{result.namaSekolah || '-'} ({result.jenisSekolah || 'Negeri'})</span></p>
                </div>
              </details>

              <details className="bg-gray-50 border border-gray-200 rounded-xl p-5 shadow-sm group" open>
                <summary className="font-semibold text-green-400 mb-3 flex items-center justify-between cursor-pointer list-none">
                  <div className="flex items-center gap-2">📝 CATATAN & REFLEKSI</div>
                  <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="space-y-4">
                  <div>
                    <h5 className="text-xs text-gray-500 mb-1">Catatan Pembelajaran</h5>
                    <div className="text-gray-700 bg-white p-3 rounded-lg border border-black" dangerouslySetInnerHTML={{ __html: parseMarkdown(result.catatan) }} />
                  </div>
                  <div>
                    <h5 className="text-xs text-gray-500 mb-1">Refleksi & Evaluasi</h5>
                    <div className="text-gray-700 bg-white p-3 rounded-lg border border-black" dangerouslySetInnerHTML={{ __html: parseMarkdown(result.refleksi) }} />
                  </div>
                </div>
              </details>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-16 h-full flex flex-col items-center justify-center">
              <div className="text-6xl mb-4 opacity-50">📔</div>
              <p>Jurnal Harian akan muncul di sini</p>
            </div>
          )}
        </div>
      </div>

      <PrintSupportModal 
        isOpen={isPrintModalOpen} 
        onClose={() => setIsPrintModalOpen(false)} 
        onConfirm={printJurnal} 
      />
    </div>
  );
}
