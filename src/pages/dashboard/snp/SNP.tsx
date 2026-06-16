import React, { useState, useEffect, useRef } from 'react';
import ModelSelector from '@/components/ModelSelector';
import { GoogleGenAI } from '@/lib/genai';
import { Leaf, Shield, Users, BarChart, BookOpen, FileText, Loader2, Save, Crown, ExternalLink, Printer } from 'lucide-react';
import { marked } from 'marked';
import { repairMarkdown } from '@/lib/markdown';
import DocumentUpload, { UploadedFile } from '@/components/DocumentUpload';
import { useAuth } from '@/context/AuthContext';
import AIAssistedTextarea from '@/components/AIAssistedTextarea';
import PrintSupportModal from '@/components/PrintSupportModal';
import { getWatermarkHtml, universalPrint } from '@/lib/print';

interface SNPProps {
  subTab?: string;
}

const SNP: React.FC<SNPProps> = ({ subTab = 'ksp' }) => {
  const { profile } = useAuth();
  const [inputData, setInputData] = useState('');
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedModel, setSelectedModel] = React.useState<string>('openai');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const isTitan = profile?.role === 'owner' || profile?.role === 'admin' || profile?.tier?.toLowerCase() === 'titan' || profile?.role?.toLowerCase() === 'titan';

  useEffect(() => {
    const saved = localStorage.getItem(`SNPData_${subTab}`);
    if (saved) {
      try {
        setInputData(saved);
      } catch (e) {}
    } else {
      setInputData('');
    }
    setResult('');
    setError('');
    setUploadedFile(null);
  }, [subTab]);

  const saveProgress = () => {
    localStorage.setItem(`SNPData_${subTab}`, inputData);
    alert('Progress berhasil disimpan!');
  };

  const getTabConfig = () => {
    switch (subTab) {
      case 'snp-adiwiyata':
        return {
          title: 'Adiwiyata (Sekolah Berbudaya Lingkungan)',
          icon: <Leaf className="w-8 h-8 text-green-400" />,
          agentName: 'AI Adiwiyata Agent',
          focus: 'Lingkungan hidup, budaya peduli lingkungan',
          role: 'Monitoring program hijau, audit perilaku siswa & warga sekolah',
          placeholder: 'Masukkan data kebersihan, penggunaan plastik, observasi lingkungan sekolah...',
          color: 'from-green-500 to-emerald-600'
        };
      case 'snp-sra':
        return {
          title: 'Sekolah Ramah Anak (SRA)',
          icon: <Shield className="w-8 h-8 text-blue-400" />,
          agentName: 'AI SRA Agent',
          focus: 'Perlindungan anak, psikososial, anti bullying',
          role: 'Deteksi dini risiko, evaluasi iklim sekolah',
          placeholder: 'Masukkan hasil survey bullying, laporan konseling, observasi iklim sekolah...',
          color: 'from-blue-500 to-indigo-600'
        };
      case 'snp-ssk':
        return {
          title: 'Sekolah Siaga Kependudukan (SSK)',
          icon: <Users className="w-8 h-8 text-orange-400" />,
          agentName: 'AI SSK Agent',
          focus: 'Literasi kependudukan & perencanaan kehidupan',
          role: 'Integrasi materi kependudukan dalam pembelajaran',
          placeholder: 'Masukkan data pemahaman siswa, rencana integrasi materi kependudukan...',
          color: 'from-orange-500 to-red-600'
        };
      case 'snp-rapor':
        return {
          title: 'Rapor Pendidikan (Diagnosis & Data Mutu)',
          icon: <BarChart className="w-8 h-8 text-purple-400" />,
          agentName: 'AI Rapor Pendidikan Agent',
          focus: 'Diagnosis mutu berbasis data nasional',
          role: 'Analisis gap mutu, prioritas perbaikan',
          placeholder: 'Masukkan nilai literasi, numerasi, karakter dari Rapor Pendidikan...',
          color: 'from-purple-500 to-fuchsia-600'
        };
      case 'snp-spmi':
        return {
          title: 'SPMI (Sistem Penjaminan Mutu Internal)',
          icon: <BookOpen className="w-8 h-8 text-teal-400" />,
          agentName: 'AI SPMI Agent',
          focus: 'Siklus mutu (Pemetaan → Perencanaan → Implementasi → Evaluasi)',
          role: 'Menjamin semua program berjalan sesuai standar',
          placeholder: 'Masukkan data evaluasi diri sekolah, hasil audit mutu internal...',
          color: 'from-teal-500 to-cyan-600'
        };
      case 'snp-ksp':
        return {
          title: 'KSP (Kurikulum Satuan Pendidikan)',
          icon: <FileText className="w-8 h-8 text-yellow-400" />,
          agentName: 'AI KSP Agent',
          focus: 'Kurikulum operasional sekolah',
          role: 'Sinkronisasi kurikulum dengan semua program',
          placeholder: 'Masukkan draf kurikulum, modul ajar, rencana integrasi tema...',
          color: 'from-yellow-500 to-amber-600'
        };
      default:
        return {
          title: 'Standar Nasional Pendidikan',
          icon: <FileText className="w-8 h-8 text-gray-400" />,
          agentName: 'AI Koordinator Utama (Chief Education Intelligence)',
          focus: 'Integrasi semua program',
          role: 'Mengambil keputusan berbasis data lintas program',
          placeholder: 'Masukkan data...',
          color: 'from-gray-500 to-slate-600'
        };
    }
  };

  const config = getTabConfig();

  const handleAnalyze = async () => {
    if (!inputData.trim()) {
      setError('Silakan masukkan data untuk dianalisis.');
      return;
    }

    setIsGenerating(true);
    setError('');
    setResult('');

    try {
      const ai = new GoogleGenAI({});

      const prompt = `Anda adalah ${config.agentName}.
Fokus Anda: ${config.focus}
Peran Anda: ${config.role}

Tugas Anda adalah melakukan analisis dan menyusun LAPORAN RESMI yang sesuai dengan panduan pengawas atau kriteria supervisor terkini.
Anda HARUS MENGGUNAKAN MESIN PENCARIAN GOOGLE (dari akses tools) untuk mencari panduan standar, instrumen penilaian, regulasi, atau juknis terbaru terkait ${config.title} di wilayah Indonesia.

Berdasarkan data input (dan lampiran jika ada), buat laporan dengan WORKFLOW berikut:
1. PROCESS (Analisis): Identifikasi masalah, pemetaan kondisi saat ini, dan deteksi gap (kesenjangan) berdasarkan regulasi/kriteria pengawas terbaru hasil rujukan Google.
2. OUTPUT (Rekomendasi Laporan): Susun laporan resmi sesuai kriteria supervisor yang mencakup program prioritas, intervensi spesifik, dan target capaian.
3. ACTION (Implementasi): Sarankan kegiatan operasional sekolah, rujukan integrasi pembelajaran, dan cara pelibatan pihak terkait yang sejalan.
4. EVALUASI: Berikan indikator atau matriks laporan (berkala rutin) yang disukai supervisor/pengawas.

Data Input:
${inputData}
${uploadedFile ? '\nDokumen referensi telah disertakan. Analisis dokumen tersebut secara cermat agar data di dalam dokumen diolah menyatu ke dalam laporan pengawas.' : ''}

Berikan hasilnya dalam format Markdown yang elegan, profesional, dan siap dijadikan sebagai Draft Laporan Resmi Supervisor.`;

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
        config: { 
          temperature: 0.7,
          tools: [{ googleSearch: {} }] 
        }
      });

      setResult(response.text || 'Tidak ada hasil yang di-generate.');
    } catch (err: any) {
      console.error(err);
      setError('Terjadi kesalahan saat menganalisis data: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const printDocument = () => {
    const printContent = printRef.current?.innerHTML;
    if (printContent) {
      universalPrint(`
        <h2 style="text-align: center;">Draft Dokumen ${config.agentName}</h2>
            ${printContent}
            ${getWatermarkHtml(profile?.role)}
      `, 'Print Dokumen ${config.title}');
    }
  };

  if (!isTitan) {
    return (
      <div className="max-w-3xl mx-auto h-[60vh] flex flex-col items-center justify-center p-8 text-center space-y-6">
        <div className="w-24 h-24 bg-rose-500/10 rounded-full flex items-center justify-center border border-rose-500/30 mb-4">
          <Crown className="w-12 h-12 text-rose-500" />
        </div>
        <h2 className="text-3xl font-bold text-black tracking-widest">AKSES DITOLAK</h2>
        <p className="text-gray-600 max-w-lg">
          Fitur Standar Nasional Pendidikan (SNP) ini adalah fitur eksklusif untuk pengguna dengan status 
          <span className="text-rose-500 font-bold mx-2">TITAN</span>.
        </p>
        <p className="text-sm text-gray-500">
          Silakan upgrade paket akun Anda ke Titan melalui menu Pengaturan Pembayaran.
        </p>
      </div>
    );
  }

  // Khusus SNP memunculkan kembali form chat sesuai permintaan + tool external
  return (
    <div className="max-w-5xl lg:max-w-7xl mx-auto space-y-6 relative">
      <div className="flex justify-between items-center bg-rose-500/10 border border-rose-500/30 p-4 rounded-xl mb-6">
        <div className="flex items-center gap-3">
          <Crown className="w-8 h-8 text-rose-500" />
          <div>
            <h3 className="text-black font-bold tracking-widest text-sm uppercase">Mode Pengawas / Supervisor (Titan)</h3>
            <p className="text-xs text-rose-400">Pemberdayaan Google Search untuk Standardisasi Dokumen</p>
          </div>
        </div>
        <a 
          href="https://ai.studio/apps/8f9760ce-cddb-4e61-b8e6-5cb47ef8eb17" 
          target="_blank" 
          rel="noopener noreferrer"
          className="px-3 py-2 bg-rose-500 hover:bg-rose-600 text-black rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-2"
        >
          Buka SNP Legacy <ExternalLink size={14} />
        </a>
      </div>

      <div className="gen-card bg-red-50  p-6 rounded-2xl shadow-xl">
        <div className="flex items-center gap-4 mb-6">
          <div className={`p-3 bg-gradient-to-br ${config.color} rounded-xl shadow-lg`}>
            {config.icon}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-black">{config.title}</h2>
            <p className="text-gray-600 text-sm">{config.agentName} - {config.focus}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Input Form (Observasi, Survey, Nilai, Rekapan Kegiatan)
            </label>
            <AIAssistedTextarea value={inputData}
              onChange={(e) => setInputData(e.target.value)}
              placeholder={config.placeholder}
              className="w-full h-40 bg-white border border-gray-300 rounded-xl p-4 text-black placeholder-slate-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all resize-none" />
          </div>

          <DocumentUpload onFileUploaded={setUploadedFile} label="Upload Dokumen / Formulir Sebelumnya (Wajib Lampirkan)" />

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          
              <ModelSelector modality="text" value={selectedModel} onChange={setSelectedModel} disabled={isGenerating} />
<div className="flex flex-wrap gap-2 w-full">
            <button 
              onClick={saveProgress}
              className="px-4 py-3 bg-red-100 hover:bg-slate-600 text-black rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
              title="Simpan Progress"
            >
              <Save size={18} /> Simpan
            </button>
            <button
              onClick={handleAnalyze}
              disabled={isGenerating}
              className="flex-1 py-4 bg-gradient-to-r from-rose-500 to-red-600 shadow-sm text-black font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Mencari Data Google & Menyusun Laporan...
                </>
              ) : (
                'Proses Laporan Standar Supervisor'
              )}
            </button>
          </div>
        </div>
      </div>

      {result && (
        <div className="gen-card bg-red-50  p-6 md:p-8 rounded-2xl shadow-xl animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between mb-6 border-b border-black pb-4">
            <h3 className="text-xl font-bold text-black flex items-center gap-2">
              {config.icon}
              Draft Dokumen {config.agentName}
            </h3>
            <button onClick={() => setIsPrintModalOpen(true)} className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-colors shadow-md hover:shadow-lg">
              <Printer size={16} /> Cetak
            </button>
          </div>
          <div ref={printRef} className="prose prose-invert max-w-none prose-headings:text-rose-400 prose-a:text-rose-300">
            <div dangerouslySetInnerHTML={{ __html: marked.parse(repairMarkdown(result)) as string }} />
          </div>
        </div>
      )}
      <PrintSupportModal isOpen={isPrintModalOpen} onClose={() => setIsPrintModalOpen(false)} onConfirm={printDocument} />
    </div>
  );
};

export default SNP;
