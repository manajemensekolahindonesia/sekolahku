import { parseMarkdown } from '@/lib/markdown';
import React, { useState, useRef } from 'react';
import ModelSelector from '@/components/ModelSelector';
import { GoogleGenAI } from '@/lib/genai';
import { Loader2, Printer, Calendar, Settings, FileText, Save , Trash2 } from 'lucide-react';
import PrintSupportModal from '@/components/PrintSupportModal';
import DocumentUpload, { UploadedFile } from '@/components/DocumentUpload';
import { useAuth } from '@/context/AuthContext';
import { getWatermarkHtml, universalPrint } from '@/lib/print';
import AIAssistedInput from '@/components/AIAssistedInput';
import DOMPurify from 'dompurify';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import LogoUploader from '@/components/LogoUploader';

const ai = new GoogleGenAI({});

const PROVINSI_LIST = [
  'DKI Jakarta', 'Jawa Barat', 'Jawa Tengah', 'DI Yogyakarta', 'Jawa Timur', 'Banten',
  'Bali', 'Sumatera Utara', 'Sumatera Barat', 'Riau', 'Kepulauan Riau', 'Sumatera Selatan',
  'Kalimantan Barat', 'Kalimantan Tengah', 'Kalimantan Selatan', 'Kalimantan Timur',
  'Sulawesi Selatan', 'Sulawesi Utara', 'Papua', 'Lainnya'
];

export default function KalenderPendidikan() {
  const { profile } = useAuth();
  const [formData, setFormData] = useLocalStorage('KalenderPendidikanData', {
    provinsi: 'DKI Jakarta',
    jenjang: 'SD',
    tahunAjaran: '2026/2027',
    namaSekolah: '',
    kepalaSekolah: '',
    jenisNipKepalaSekolah: 'NIP',
    nipKepalaSekolah: '',
    tempatTanggal: 'Jakarta, 15 Juli 2026'
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedModel, setSelectedModel] = useLocalStorage<string>('KalenderPendidikan_selectedModel', 'openai');
  const [useLogo, setUseLogo] = useLocalStorage<boolean>('KalenderPendidikan_useLogo', false);
  const [logoUrl, setLogoUrl] = useLocalStorage<string | null>('KalenderPendidikan_logoUrl', null);

  const saveProgress = () => {
    alert('Progress otomatis disimpan saat Anda mengetik!');
  };

  const resetProgress = () => {
    if (confirm('Apakah Anda yakin ingin mereset semua data di halaman ini? Data yang belum di-export akan hilang.')) {
      localStorage.removeItem('KalenderPendidikanData');
      localStorage.removeItem('KalenderPendidikan_selectedModel');
      window.location.reload();
    }
  };

  const [resultHtml, setResultHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const generateKalender = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const prompt = `Pastikan dokumen ini disusun sesuai standar terbaru Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi (Kemendikbudristek) serta Kementerian Agama (Kemenag) Republik Indonesia, mengikuti panduan Kurikulum Merdeka yang mengikat.

Buatlah Kalender Pendidikan resmi untuk tahun ajaran ${formData.tahunAjaran} jenjang ${formData.jenjang} di Provinsi ${formData.provinsi}.
Gunakan sumber yang kredibel dari Dinas Pendidikan Provinsi terkait atau pedoman Kemendikbudristek terbaru untuk tahun 2026.
${uploadedFile ? '\nPerhatikan dokumen referensi yang dilampirkan untuk menyesuaikan dengan kalender pendidikan yang dikeluarkan kementerian, pemerintah provinsi, atau pemerintah kota.' : ''}

Buat dalam format HTML lengkap yang siap dicetak (A4).
Gunakan styling CSS inline yang rapi, profesional, dan mudah dibaca.

Struktur Dokumen HTML:
1. Kop Surat/Judul: "KALENDER PENDIDIKAN TAHUN AJARAN ${formData.tahunAjaran}"
2. Sub Judul: "Jenjang ${formData.jenjang} - Provinsi ${formData.provinsi}"
3. Nama Sekolah: "${formData.namaSekolah || '...........................'}"
4. Tabel Kalender per Bulan (Juli 2026 s.d. Juni 2027):
   - Buat tabel ringkas yang menampilkan bulan, jumlah hari efektif, dan keterangan kegiatan penting (Hari Libur Nasional, Perkiraan Ujian, Pembagian Rapor, Libur Semester).
5. Keterangan/Legenda di bawah tabel.

PENTING: JANGAN buat atau tambahkan bagian kolom tanda tangan (Mengetahui Kepala Sekolah dsb), karena sistem sudah menambahkannya secara otomatis di bagian bawah.

OUTPUT HANYA KODE HTML (tanpa tag markdown \`\`\`html). Pastikan menggunakan tag <table> yang di-style dengan border-collapse.`;

      const contents: any[] = [
        {
          role: 'user',
          parts: [
            { text: prompt }
          ]
        }
      ];

      if (uploadedFile) {
        contents[0].parts.push({
          inlineData: {
            data: uploadedFile.data,
            mimeType: uploadedFile.mimeType
          }
        });
      }

      const response = await ai.models.generateContent({
        model: selectedModel,
        contents: contents,
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
      setError('Terjadi kesalahan saat membuat kalender: ' + err.message);
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
      `, 'Print Kalender Pendidikan');
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="gen-card bg-white  rounded-3xl p-6 md:p-8 shadow-2xl">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Calendar size={24} className="text-black" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-black">Kalender Pendidikan</h2>
            <p className="text-gray-600 text-sm">Generate Kalender Pendidikan Tahun Ajaran 2026/2027</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="text-lg font-semibold text-black flex items-center gap-2 mb-4">
                <Settings size={18} className="text-blue-400" /> Pengaturan
              </h3>
              
              <div className="mb-4">
                <DocumentUpload 
                  onFileUploaded={setUploadedFile} 
                  label="Upload Kalender Referensi (Opsional)" 
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tahun Ajaran</label>
                <AIAssistedInput type="text" value={formData.tahunAjaran} onChange={e => setFormData({...formData, tahunAjaran: e.target.value})} className="w-full bg-white border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-blue-500 transition-all" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Provinsi</label>
                <select value={formData.provinsi} onChange={e => setFormData({...formData, provinsi: e.target.value})} className="w-full bg-white border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-blue-500 transition-all">
                  {PROVINSI_LIST.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Jenjang</label>
                <select value={formData.jenjang} onChange={e => setFormData({...formData, jenjang: e.target.value})} className="w-full bg-white border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-blue-500 transition-all">
                  <option value="PAUD">PAUD</option>
                  <option value="SD">SD</option>
                  <option value="SMP">SMP</option>
                  <option value="SMA">SMA</option>
                  <option value="SMK">SMK</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nama Sekolah</label>
                <AIAssistedInput type="text" value={formData.namaSekolah} onChange={e => setFormData({...formData, namaSekolah: e.target.value})} className="w-full bg-white border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-blue-500 transition-all" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Kepala Sekolah</label>
                <AIAssistedInput type="text" value={formData.kepalaSekolah} onChange={e => setFormData({...formData, kepalaSekolah: e.target.value})} className="w-full bg-white border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-blue-500 transition-all" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nomor Induk Kepala Sekolah</label>
                <div className="flex gap-2">
                  <select value={formData.jenisNipKepalaSekolah} onChange={e => setFormData({...formData, jenisNipKepalaSekolah: e.target.value})} className="w-1/3 bg-white border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-blue-500 transition-all">
                    <option value="NIP">NIP</option>
                    <option value="NUPTK">NUPTK</option>
                    <option value="NIY">NIY</option>
                    <option value="NRG">NRG</option>
                    <option value="NPK">NPK</option>
                  </select>
                  <AIAssistedInput type="text" value={formData.nipKepalaSekolah} onChange={e => setFormData({...formData, nipKepalaSekolah: e.target.value})} className="w-2/3 bg-white border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-blue-500 transition-all" />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tempat, Tanggal Penetapan</label>
                <AIAssistedInput type="text" value={formData.tempatTanggal} onChange={e => setFormData({...formData, tempatTanggal: e.target.value})} className="w-full bg-white border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-blue-500 transition-all" />
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
              onClick={generateKalender}
              disabled={isGenerating}
              className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-black rounded-xl font-bold text-lg shadow-xl shadow-blue-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2 btn-generate-animated"
            >
              {isGenerating ? <><Loader2 className="animate-spin" /> Menyusun...</> : <><FileText /> Buat Kalender</>}
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
                    <button onClick={() => setIsPrintModalOpen(true)} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-black text-sm font-medium rounded-lg flex items-center gap-2 transition-colors">
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
                    <Loader2 size={48} className="animate-spin text-blue-500" />
                    <p>Menyusun Kalender Pendidikan 2026/2027...</p>
                  </div>
                ) : resultHtml ? (
                  <div ref={printRef} className="print-container relative w-full pb-16">
                    <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(resultHtml) }} />
                    <div className="mt-12 flex justify-end" style={{ pageBreakInside: 'avoid' }}>
                      <div className="w-[40%] text-center text-sm">
                        <p>{formData.tempatTanggal || '................., .........................'}</p>
                        <p>Kepala Sekolah</p>
                        <br/><br/><br/><br/>
                        <p className="font-bold underline mb-0">{formData.kepalaSekolah || '................................'}</p>
                        <p className="mt-0">{formData.jenisNipKepalaSekolah || 'NIP'}. {formData.nipKepalaSekolah || '................................'}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-600">
                    <Calendar size={64} className="mb-4 opacity-20" />
                    <p>Belum ada dokumen. Silakan klik "Buat Kalender".</p>
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
