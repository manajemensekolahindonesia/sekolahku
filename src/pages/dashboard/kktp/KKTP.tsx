import { universalPrint, createPrintWindow } from '@/lib/print';
import React, { useState, useEffect } from 'react';
import ModelSelector from '@/components/ModelSelector';
import { Printer, Plus, Trash2, Sparkles, AlertCircle, Save, Target, School, UserCheck } from 'lucide-react';
import PrintSupportModal from '@/components/PrintSupportModal';
import AIVisualGenerator from '@/components/AIVisualGenerator';
import PDFRemixUpload from '@/components/PDFRemixUpload';
import { educationLevels, phaseClassMap, subjectsByLevel, topicsBySubject } from '@/lib/constants';
import { GoogleGenAI, Type } from '@/lib/genai';
import { useAuth } from '@/context/AuthContext';
import AIAssistedInput from '@/components/AIAssistedInput';
import AIAssistedTextarea from '@/components/AIAssistedTextarea';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import LogoUploader from '@/components/LogoUploader';

export default function KKTP() {
  const { profile } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedModel, setSelectedModel] = useLocalStorage<string>('KKTP_selectedModel', 'openai');

  const saveProgress = () => {
    alert('Progress otomatis disimpan saat Anda mengetik!');
  };

  const resetProgress = () => {
    if (confirm('Apakah Anda yakin ingin mereset semua data di halaman ini? Data yang belum di-export akan hilang.')) {
      localStorage.removeItem('KKTPData');
      localStorage.removeItem('KKTP_tujuanPembelajaran');
      localStorage.removeItem('KKTP_selectedModel');
      window.location.reload();
    }
  };

  const [error, setError] = useState('');
  
  const [formData, setFormData] = useLocalStorage('KKTPData', {
    satuanPendidikan: '',
    eduLevel: 'sd',
    fase: 'A',
    kelas: '1',
    semester: '1',
    mapel: 'bahasa-indonesia',
    topikMateri: '',
    isCustomTopik: false,
    tahunPelajaran: `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
    kepalaSekolah: '',
    nipKepalaSekolah: '',
    jenisNipKepalaSekolah: 'NIP',
    guruMapel: '',
    nipGuruMapel: '',
    jenisNipGuruMapel: 'NIP',
    tempatTanggal: '',
    remixText: ''
  });

  const [useLogo, setUseLogo] = useLocalStorage<boolean>('KKTP_useLogo', false);
  const [logoUrl, setLogoUrl] = useLocalStorage<string | null>('KKTP_logoUrl', null);

  const [tujuanPembelajaran, setTujuanPembelajaran] = useLocalStorage('KKTP_tujuanPembelajaran', [{ kode: '', deskripsi: '' }]);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Sync dropdowns
  useEffect(() => {
    const phases = phaseClassMap[formData.eduLevel]?.phases || [];
    const firstPhase = phases[0]?.id || '';
    const classes = phaseClassMap[formData.eduLevel]?.classes[firstPhase] || [];
    const firstClass = classes[0]?.id || '';
    const subjects = subjectsByLevel[formData.eduLevel] || [];
    const firstSubject = subjects[0]?.id || '';
    const topics = topicsBySubject[firstSubject] || topicsBySubject['default'];
    const firstTopic = topics[0] || '';

    setFormData(prev => ({ 
      ...prev, 
      fase: firstPhase, 
      kelas: firstClass, 
      mapel: firstSubject, 
      topikMateri: firstTopic, 
      isCustomTopik: false 
    }));
  }, [formData.eduLevel]);

  useEffect(() => {
    const classes = phaseClassMap[formData.eduLevel]?.classes[formData.fase] || [];
    setFormData(prev => ({ ...prev, kelas: classes[0]?.id || '' }));
  }, [formData.fase, formData.eduLevel]);

  useEffect(() => {
    const topics = topicsBySubject[formData.mapel] || topicsBySubject['default'];
    setFormData(prev => ({ ...prev, topikMateri: topics[0] || '', isCustomTopik: false }));
  }, [formData.mapel]);

  useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        guruMapel: profile.displayName || prev.guruMapel,
        nipGuruMapel: profile.nip || prev.nipGuruMapel,
        eduLevel: profile.jenjang?.toLowerCase() || prev.eduLevel
      }));
    }
  }, [profile]);

  const generateKKTP = async () => {
    setIsGenerating(true);
    setError('');
    
    try {
      const ai = new GoogleGenAI({});
      
      const subjectLabel = subjectsByLevel[formData.eduLevel]?.find(s => s.id === formData.mapel)?.label || formData.mapel;
      const faseLabel = phaseClassMap[formData.eduLevel]?.phases.find(p => p.id === formData.fase)?.label || formData.fase;
      const kelasLabel = phaseClassMap[formData.eduLevel]?.classes[formData.fase]?.find(c => c.id === formData.kelas)?.label || formData.kelas;

      const prompt = `Pastikan dokumen ini disusun sesuai standar terbaru Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi (Kemendikbudristek) serta Kementerian Agama (Kemenag) Republik Indonesia, mengikuti panduan Kurikulum Merdeka yang mengikat.

Buatkan daftar Tujuan Pembelajaran (TP) untuk Kriteria Ketercapaian Tujuan Pembelajaran (KKTP) Kurikulum Merdeka:
Mata Pelajaran: ${subjectLabel}
Topik/Materi: ${formData.topikMateri}
Fase: ${faseLabel}
Kelas: ${kelasLabel}

${formData.remixText ? `INSTRUKSI REMIX:
Gunakan teks referensi berikut sebagai dasar utama pembuatan TP. Remix dan kembangkan konten ini agar sesuai dengan kurikulum merdeka dan target audiens di atas:
---
${formData.remixText}
---` : ''}

Berikan hasil dalam format JSON array of objects dengan properti "kode" (string, contoh: 1.1, 1.2) dan "deskripsi" (string, penjelasan TP yang spesifik dan operasional).
Minimal buatkan 3-5 TP yang relevan dengan topik tersebut.`;

      const response = await ai.models.generateContent({
        model: selectedModel,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                kode: { type: Type.STRING },
                deskripsi: { type: Type.STRING }
              },
              required: ["kode", "deskripsi"]
            }
          }
        }
      });

      const generatedTP = JSON.parse(response.text || '[]');
      if (Array.isArray(generatedTP) && generatedTP.length > 0) {
        setTujuanPembelajaran(generatedTP);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Gagal menghasilkan TP otomatis.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddTP = () => {
    setTujuanPembelajaran([...tujuanPembelajaran, { kode: '', deskripsi: '' }]);
  };

  const handleRemoveTP = (index: number) => {
    const newTP = [...tujuanPembelajaran];
    newTP.splice(index, 1);
    setTujuanPembelajaran(newTP);
  };

  const handleTPChange = (index: number, field: 'kode' | 'deskripsi', value: string) => {
    const newTP = [...tujuanPembelajaran];
    newTP[index][field] = value;
    setTujuanPembelajaran(newTP);
  };

  const printDocument = () => {
    const printWindow = createPrintWindow();
    if (!printWindow) return;

    const subjectLabel = subjectsByLevel[formData.eduLevel]?.find(s => s.id === formData.mapel)?.label || formData.mapel;
    const faseLabel = phaseClassMap[formData.eduLevel]?.phases.find(p => p.id === formData.fase)?.label || formData.fase;
    const kelasLabel = phaseClassMap[formData.eduLevel]?.classes[formData.fase]?.find(c => c.id === formData.kelas)?.label || formData.kelas;

    const isKemenag = formData.satuanPendidikan?.toLowerCase().includes('madrasah') || 
                      formData.satuanPendidikan?.toLowerCase().includes(' mi ') || 
                      formData.satuanPendidikan?.toLowerCase().includes('mts') || 
                      formData.satuanPendidikan?.toLowerCase().includes(' ma ') ||
                      formData.satuanPendidikan?.toLowerCase().startsWith('mi ') ||
                      formData.satuanPendidikan?.toLowerCase().startsWith('ma ') ||
                      ['al-quran-hadis', 'akidah-akhlak', 'fikih', 'ski', 'bahasa-arab'].includes(formData.mapel);

    const rowsHtml = tujuanPembelajaran.map((tp, index) => `
      <tr>
        <td style="border: 1px solid black; padding: 8px; text-align: center;">${index + 1}</td>
        <td style="border: 1px solid black; padding: 8px; text-align: center;">${tp.kode}</td>
        <td style="border: 1px solid black; padding: 8px;">${tp.deskripsi}</td>
        <td style="border: 1px solid black; padding: 8px;"></td>
        <td style="border: 1px solid black; padding: 8px;"></td>
        <td style="border: 1px solid black; padding: 8px;"></td>
        <td style="border: 1px solid black; padding: 8px;"></td>
      </tr>
    `).join('');

    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]')).map(el => el.outerHTML).join('\n');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
          <title>KKTP - ${subjectLabel}</title>
          <style>
              @page { size: portrait; margin: 30mm 30mm 30mm 40mm; }
              body { font-family: 'Arial', 'Helvetica', 'Inter', sans-serif; line-height: 1.4; color: black; position: relative; margin: 0; padding: 0; }
              .header { text-align: center; margin-bottom: 25px; border-bottom: 3px double #000; padding-bottom: 10px; }
              .info-table { width: 100%; margin-bottom: 15px; font-size: 10pt; }
              .info-table td { padding: 2px 0; vertical-align: top; }
              .info-table td:first-child { width: 180px; }
              .info-table td:nth-child(2) { width: 15px; }
              
              .kktp-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 9pt; }
              .kktp-table th, .kktp-table td { border: 1px solid black; padding: 5px; }
              .kktp-table th { text-align: center; vertical-align: middle; background-color: #f3f4f6; }
              
              .bg-pink { background-color: #ffccff !important; -webkit-print-color-adjust: exact; }
              .bg-yellow { background-color: #ffff99 !important; -webkit-print-color-adjust: exact; }
              .bg-green { background-color: #99ff99 !important; -webkit-print-color-adjust: exact; }
              .bg-cyan { background-color: #99ffff !important; -webkit-print-color-adjust: exact; }
              
              .keterangan-table { width: 90%; margin: 0 auto 30px auto; border-collapse: collapse; font-size: 9pt; }
              .keterangan-table th, .keterangan-table td { border: 1px solid black; padding: 4px 8px; }
              .keterangan-table th { text-align: left; width: 120px; background-color: #f3f4f6; }
              
              .signature-section { display: flex; justify-content: space-between; margin-top: 40px; font-size: 10pt; }
              .signature-box { width: 250px; text-align: center; }
              .signature-space { height: 60px; }
              .signature-name { font-weight: bold; text-decoration: underline; }
              
              .watermark {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) rotate(-45deg);
                font-size: 40pt;
                color: rgba(0, 0, 0, 0.05);
                white-space: nowrap;
                pointer-events: none;
                z-index: -1;
                font-weight: bold;
                text-transform: uppercase;
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
          <div class="header" style="position: relative;">
              ${useLogo && logoUrl ? `<img src="${logoUrl}" style="position: absolute; left: 0; top: 0; height: 80px; width: auto;" alt="Logo"/>` : ''}
              <div style="padding: 0 90px;">
                  <div style="font-size: 11pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">
                      ${isKemenag ? 'KEMENTERIAN AGAMA REPUBLIK INDONESIA' : 'KEMENTERIAN PENDIDIKAN DASAR DAN MENENGAH'}
                  </div>
                  <div style="font-size: 13pt; font-weight: bold; text-transform: uppercase; margin-top: 3px;">
                      ${formData.satuanPendidikan || 'SATUAN PENDIDIKAN'}
                  </div>
                  <div style="font-size: 9pt; margin-top: 2px;">
                      Tahun Pelajaran: ${formData.tahunPelajaran || '-'}
                  </div>
              </div>
              <hr style="border: none; border-top: 3px double #000; margin-top: 5px; margin-bottom: 20px; clear: both;" />
              
              <h3 style="margin: 0; font-size: 12pt; font-weight: bold; text-transform: uppercase;">
                  KRITERIA KETERCAPAIAN TUJUAN PEMBELAJARAN (KKTP)
              </h3>
              <div style="font-size: 10pt; margin-top: 5px; font-style: italic;">
                  Kurikulum Merdeka (Sesuai Panduan Pembelajaran dan Asesmen)
              </div>
          </div>
          
          <table class="info-table">
              <tr><td>SATUAN PENDIDIKAN</td><td>:</td><td>${formData.satuanPendidikan}</td></tr>
              <tr><td>FASE</td><td>:</td><td>${faseLabel}</td></tr>
              <tr><td>KELAS/SEMESTER</td><td>:</td><td>${kelasLabel} / ${formData.semester === '1' ? 'Ganjil' : 'Genap'}</td></tr>
              <tr><td>MATA PELAJARAN</td><td>:</td><td>${subjectLabel}</td></tr>
              <tr><td>TAHUN PELAJARAN</td><td>:</td><td>${formData.tahunPelajaran}</td></tr>
          </table>
          
          <table class="kktp-table">
              <thead>
                  <tr>
                      <th rowspan="2" style="width: 5%;">NO.</th>
                      <th rowspan="2" style="width: 10%;">KODE<br/>TP</th>
                      <th rowspan="2" style="width: 45%;">Tujuan Pembelajaran (TP)</th>
                      <th colspan="4">Skala atau Interval Nilai</th>
                  </tr>
                  <tr>
                      <th class="bg-pink" style="width: 10%;">(0 – 49) %<br/>Belum Tuntas<br/>Remidial<br/>Semua</th>
                      <th class="bg-yellow" style="width: 10%;">(50 – 69) %<br/>Belum Tuntas<br/>Remidial<br/>Sebagian</th>
                      <th class="bg-green" style="width: 10%;">(70 – 89) %<br/>Sudah<br/>Tuntas</th>
                      <th class="bg-cyan" style="width: 10%;">(90 – 100) %<br/>Sudah Tuntas<br/>Pengayaan</th>
                  </tr>
              </thead>
              <tbody>
                  ${rowsHtml}
              </tbody>
          </table>
          
          <table class="keterangan-table">
              <tr>
                  <th rowspan="4">KETERANGAN</th>
                  <td>(0 – 49) %</td>
                  <td>: Remidial Seluruh Bagian</td>
                  <td>Belum Mencapai Ketuntasan</td>
              </tr>
              <tr>
                  <td>(50 – 69) %</td>
                  <td>: Remidial Sebagian</td>
                  <td>Belum Mencapai Ketuntasan</td>
              </tr>
              <tr>
                  <td>(70 – 89) %</td>
                  <td>: Tidak Remidial</td>
                  <td>Mencapai Ketuntasan</td>
              </tr>
              <tr>
                  <td>(90 – 100) %</td>
                  <td>: Pengayaan</td>
                  <td>Melampaui Ketuntasan</td>
              </tr>
          </table>
          
          ${(formData.kepalaSekolah || formData.guruMapel) ? `<div style="margin-top: 40px; display: flex; justify-content: space-between; text-align: center; font-size: 12px; page-break-inside: avoid;">
              <div style="width: 45%;">
                  <p>Mengetahui,</p>
                  <p>Kepala Sekolah</p>
                  <br><br><br><br>
                  <p style="font-weight: bold; text-decoration: underline;">${formData.kepalaSekolah || '................................'}</p>
                  <p>${formData.jenisNipKepalaSekolah || 'NIP'}. ${formData.nipKepalaSekolah || '................................'}</p>
              </div>
              <div style="width: 45%;">
                  <p>${formData.tempatTanggal || '................., .........................'}</p>
                  <p>Guru Mata Pelajaran</p>
                  <br><br><br><br>
                  <p style="font-weight: bold; text-decoration: underline;">${formData.guruMapel || '................................'}</p>
                  <p>${formData.jenisNipGuruMapel || 'NIP'}. ${formData.nipGuruMapel || '................................'}</p>
              </div>
          </div>` : ''}
          
          <div style="margin-top: 30px; text-align: center; font-style: italic; font-size: 8pt; color: #666;">
              Dokumen ini dihasilkan secara otomatis oleh AI Generator KKTP - Pemuryadi<br/>
              Maju Pendidikan Indonesia &copy; ${new Date().getFullYear()}
          </div>

          <script>
            setTimeout(() => {
              window.print();
            }, 1000);
          </script>
      </body>
      </html>
    `);
    printWindow.document.close();
    setIsPrintModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-2xl shadow-lg">
          <Target className="w-7 h-7 text-white" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-black">Kriteria Ketercapaian Tujuan Pembelajaran (KKTP)</h3>
          <p className="text-gray-600">Generator KKTP Kurikulum Merdeka Otomatis</p>
        </div>
      </div>

      <div className="space-y-6">
          
          <div className="pb-6 border-b border-gray-200">
            <h4 className="font-semibold text-amber-600 mb-4 flex items-center gap-2"><School size={18} /> Informasi Umum</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <AIAssistedInput type="text" placeholder="Nama Satuan Pendidikan" value={formData.satuanPendidikan} onChange={e => setFormData({...formData, satuanPendidikan: e.target.value})} className="w-full bg-white border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-amber-500 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Jenjang</label>
                <select value={formData.eduLevel} onChange={e => setFormData({...formData, eduLevel: e.target.value})} className="w-full bg-white border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-amber-500 transition-all">
                  {educationLevels.map(level => (
                    <option key={level.id} value={level.id}>{level.label}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Fase</label>
                  <select value={formData.fase} onChange={e => setFormData({...formData, fase: e.target.value})} className="w-full bg-white border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-amber-500 transition-all">
                    {phaseClassMap[formData.eduLevel]?.phases.map(p => (
                      <option key={p.id} value={p.id}>{p.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Kelas</label>
                  <select value={formData.kelas} onChange={e => setFormData({...formData, kelas: e.target.value})} className="w-full bg-white border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-amber-500 transition-all">
                    {phaseClassMap[formData.eduLevel]?.classes[formData.fase]?.map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Semester</label>
                <select value={formData.semester} onChange={e => setFormData({...formData, semester: e.target.value})} className="w-full bg-white border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-amber-500 transition-all">
                  <option value="1">Ganjil (1)</option>
                  <option value="2">Genap (2)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tahun Pelajaran</label>
                <AIAssistedInput type="text" value={formData.tahunPelajaran} onChange={e => setFormData({...formData, tahunPelajaran: e.target.value})} className="w-full bg-white border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-amber-500 transition-all" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Mata Pelajaran</label>
                <select value={formData.mapel} onChange={e => setFormData({...formData, mapel: e.target.value})} className="w-full bg-white border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-amber-500 transition-all">
                  {subjectsByLevel[formData.eduLevel]?.map(sub => (
                    <option key={sub.id} value={sub.id}>{sub.label}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Topik/Materi</label>
                <select 
                  value={formData.isCustomTopik ? 'lainnya' : formData.topikMateri} 
                  onChange={e => {
                    const val = e.target.value;
                    if (val === 'lainnya') {
                      setFormData({...formData, isCustomTopik: true, topikMateri: ''});
                    } else {
                      setFormData({...formData, isCustomTopik: false, topikMateri: val});
                    }
                  }} 
                  className="w-full bg-white border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-amber-500 transition-all"
                >
                  {(topicsBySubject[formData.mapel] || topicsBySubject['default']).map((topic, idx) => (
                    <option key={idx} value={topic}>{topic}</option>
                  ))}
                  <option value="lainnya">Lainnya (+)</option>
                </select>
                {formData.isCustomTopik && (
                  <AIAssistedInput type="text" 
                    placeholder="Masukkan Topik/Materi secara manual..." 
                    value={formData.topikMateri} 
                    onChange={e => setFormData({...formData, topikMateri: e.target.value})} 
                    className="w-full bg-white border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-amber-500 transition-all mt-3" 
                  />
                )}
              </div>

              <PDFRemixUpload 
                onTextExtracted={(text) => setFormData(prev => ({ ...prev, remixText: text }))}
                label="Remix dari PDF (Opsional)"
              />
            </div>
          </div>

          <div className="pb-6 border-b border-gray-200">
            <h4 className="font-semibold text-amber-600 mb-4 flex items-center gap-2"><UserCheck size={18} /> Data Guru & Kepala Sekolah</h4>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <AIAssistedInput type="text" placeholder="Nama Kepala Sekolah" value={formData.kepalaSekolah} onChange={e => setFormData({...formData, kepalaSekolah: e.target.value})} className="w-full bg-white border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-amber-500 transition-all" />
                </div>
                <div className="col-span-2 flex gap-2">
                  <select value={formData.jenisNipKepalaSekolah} onChange={e => setFormData({...formData, jenisNipKepalaSekolah: e.target.value})} className="w-1/3 bg-white border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-amber-500 transition-all">
                    <option value="NIP">NIP</option>
                    <option value="NUPTK">NUPTK</option>
                    <option value="NIY">NIY</option>
                    <option value="NRG">NRG</option>
                    <option value="NPK">NPK</option>
                  </select>
                  <AIAssistedInput type="text" placeholder="Nomor Induk Kepala Sekolah" value={formData.nipKepalaSekolah} onChange={e => setFormData({...formData, nipKepalaSekolah: e.target.value})} className="w-2/3 bg-white border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-amber-500 transition-all" />
                </div>
                <div className="col-span-2">
                  <AIAssistedInput type="text" placeholder="Nama Guru Mata Pelajaran" value={formData.guruMapel} onChange={e => setFormData({...formData, guruMapel: e.target.value})} className="w-full bg-white border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-amber-500 transition-all" />
                </div>
                <div className="col-span-2 flex gap-2">
                  <select value={formData.jenisNipGuruMapel} onChange={e => setFormData({...formData, jenisNipGuruMapel: e.target.value})} className="w-1/3 bg-white border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-amber-500 transition-all">
                    <option value="NIP">NIP</option>
                    <option value="NUPTK">NUPTK</option>
                    <option value="NIY">NIY</option>
                    <option value="NRG">NRG</option>
                    <option value="NPK">NPK</option>
                  </select>
                  <AIAssistedInput type="text" placeholder="Nomor Induk Guru" value={formData.nipGuruMapel} onChange={e => setFormData({...formData, nipGuruMapel: e.target.value})} className="w-2/3 bg-white border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-amber-500 transition-all" />
                </div>
                <div className="col-span-2">
                  <AIAssistedInput type="text" placeholder="Tempat & Tanggal Penetapan (cth: Surabaya, 10 Juli 2024)" value={formData.tempatTanggal} onChange={e => setFormData({...formData, tempatTanggal: e.target.value})} className="w-full bg-white border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-amber-500 transition-all" />
                </div>
                <div className="col-span-2">
                  <LogoUploader useLogo={useLogo} setUseLogo={setUseLogo} logoUrl={logoUrl} setLogoUrl={setLogoUrl} />
                </div>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <ModelSelector modality="text" value={selectedModel} onChange={setSelectedModel} disabled={isGenerating} />
          </div>
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
            onClick={generateKKTP}
            disabled={isGenerating}
            className="flex-1 py-4 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-black rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-amber-500/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Menganalisis Kurikulum...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Generate KKTP Otomatis</span>
              </>
            )}
          </button>
            </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-6">
              <h4 className="font-bold text-black flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                Preview Hasil Generate
              </h4>
              <div className="flex gap-2">
                <button 
                  onClick={handleAddTP}
                  className="p-2 bg-red-50 hover:bg-red-100 text-gray-700 rounded-lg transition-colors"
                  title="Tambah TP Manual"
                >
                  <Plus size={18} />
                </button>
                <button 
                  onClick={() => setIsPrintModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-black rounded-lg text-sm font-medium transition-colors shadow-lg shadow-emerald-500/20"
                >
                  <Printer size={16} />
                  Print
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {tujuanPembelajaran.map((tp, index) => (
                <div key={index} className="group relative border-b border-gray-200 pb-6 mb-2 last:border-0 last:pb-0">
                  <div className="flex gap-4">
                    <div className="w-24 shrink-0">
                      <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-1">Kode</label>
                      <AIAssistedInput type="text" 
                        value={tp.kode} 
                        onChange={e => handleTPChange(index, 'kode', e.target.value)} 
                        className="w-full bg-white border border-gray-300 rounded-lg p-2 text-black text-sm focus:border-amber-500 transition-all" 
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-1">Deskripsi Tujuan Pembelajaran</label>
                      <AIAssistedTextarea value={tp.deskripsi} 
                        onChange={e => handleTPChange(index, 'deskripsi', e.target.value)} 
                        className="w-full bg-white border border-gray-300 rounded-lg p-2 text-black text-sm focus:border-amber-500 transition-all min-h-[80px]" />
                    </div>
                    <button 
                      onClick={() => handleRemoveTP(index)}
                      disabled={tujuanPembelajaran.length === 1}
                      className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-black rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg disabled:hidden"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8">
              <AIVisualGenerator 
                context={{
                  subject: subjectsByLevel[formData.eduLevel]?.find(s => s.id === formData.mapel)?.label || formData.mapel,
                  topic: formData.topikMateri,
                  level: educationLevels.find(l => l.id === formData.eduLevel)?.label || formData.eduLevel,
                  phase: phaseClassMap[formData.eduLevel]?.phases.find(p => p.id === formData.fase)?.label || formData.fase,
                  class: phaseClassMap[formData.eduLevel]?.classes[formData.fase]?.find(c => c.id === formData.kelas)?.label || formData.kelas,
                }}
              />
            </div>

            <div className="mt-8 p-6 bg-amber-500/5 border border-amber-500/10 rounded-2xl text-center">
              <p className="text-gray-600 text-sm mb-4 italic">
                "Jangan lupa support saya agar makin berusaha dalam memperbaiki website ini"
              </p>
              <button 
                onClick={() => setIsPrintModalOpen(true)}
                className="px-6 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 rounded-full text-sm font-semibold transition-all border border-amber-500/20"
              >
                Dukung Pengembang ☕
              </button>
            </div>
          </div>
        </div>

      <PrintSupportModal 
        isOpen={isPrintModalOpen} 
        onClose={() => setIsPrintModalOpen(false)} 
        onConfirm={printDocument} 
      />
    </div>
  );
}
