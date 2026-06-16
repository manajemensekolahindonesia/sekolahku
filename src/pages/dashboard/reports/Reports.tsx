import React, { useState } from 'react';
import { BarChart, Printer, CheckCircle, FileText, Loader2, ArrowRight, UserCheck, BookOpen, Users, Presentation, CheckCircle2, Save, ChevronUp, ChevronDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { GoogleGenAI } from '@/lib/genai';

// Component for Kurikulum
function KurikulumForm() {
  const [formData, setFormData] = useState({
    jenisLaporan: '',
    semester: '',
    ketercapaian: '',
    kendala: ''
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  const generateReport = async () => {
    if (!formData.jenisLaporan || !formData.semester) {
      alert("Harap lengkapi instrumen laporan utama.");
      return;
    }
    setLoading(true);
    try {
      const prompt = `Buatkan draf akhir Laporan Wakil Kepala Sekolah Bidang Kurikulum secara profesional.
Data:
Jenis Laporan: ${formData.jenisLaporan}
Semester/Tahun Ajaran: ${formData.semester}
Tingkat Ketercapaian Target: ${formData.ketercapaian}
Kendala Utama: ${formData.kendala}

Tampilkan dalam format Markdown formal tanpa basa-basi. Gunakan gaya penulisan laporan kinerja eksekutif (Executive Summary).`;
      
      const ai = new GoogleGenAI({});
      const response = await ai.models.generateContent({
        model: 'openai',
        contents: prompt,
        config: {
          systemInstruction: 'Anda adalah asisten manajerial terampil yang bertugas menyusun laporan bidang kurikulum yang analitis dan rapi.',
          temperature: 0.2
        }
      });
      const data = { text: response.text };
      setResult(data.text);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest block mb-2">Pilih Jenis Laporan</label>
          <select className="w-full p-3 font-sans text-sm border border-gray-200 focus:border-blue-600 bg-white" value={formData.jenisLaporan} onChange={e => setFormData({...formData, jenisLaporan: e.target.value})}>
            <option value="">-- Pilih --</option>
            <option value="Evaluasi Pelaksanaan Kurikulum (KSP)">Evaluasi Pelaksanaan Kurikulum (KSP)</option>
            <option value="Laporan Kinerja Guru & Supervisi Akademik">Laporan Kinerja Guru & Supervisi Akademik</option>
            <option value="Analisis Hasil Asesmen Pemetaan Mutu">Analisis Hasil Asesmen Pemetaan Mutu</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest block mb-2">Periode Laporan</label>
          <select className="w-full p-3 font-sans text-sm border border-gray-200 focus:border-blue-600 bg-white" value={formData.semester} onChange={e => setFormData({...formData, semester: e.target.value})}>
            <option value="">-- Pilih --</option>
            <option value="Semester Ganjil">Semester Ganjil</option>
            <option value="Semester Genap">Semester Genap</option>
            <option value="Laporan Tahunan">Laporan Tahunan</option>
          </select>
        </div>
      </div>
      <div>
        <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest block mb-2">Capaian Pendampingan & Program</label>
        <textarea className="w-full p-3 font-sans text-sm border border-gray-200 focus:border-blue-600" rows={3} value={formData.ketercapaian} onChange={e => setFormData({...formData, ketercapaian: e.target.value})} placeholder="Jelaskan secara singkat kemajuan, implementasi RPP/Modul Ajar, atau hasil asesmen..." />
      </div>
      <div>
        <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest block mb-2">Kendala Utama & Isu</label>
        <textarea className="w-full p-3 font-sans text-sm border border-gray-200 focus:border-blue-600" rows={3} value={formData.kendala} onChange={e => setFormData({...formData, kendala: e.target.value})} placeholder="Tantangan pada adaptasi kurikulum, supervisi guru, fasilitas..." />
      </div>
      <div className="flex justify-end pt-4">
        <button onClick={generateReport} disabled={loading} className="bg-gray-900 hover:bg-blue-600 text-white px-8 py-4 rounded-none text-[11px] font-bold uppercase tracking-[2px] flex items-center gap-3 transition-colors shadow-sm">
          {loading ? <Loader2 className="animate-spin" size={16}/> : <CheckCircle2 size={16}/>} Generate Laporan
        </button>
      </div>
      {result && (
        <div id="printArea" className="mt-10 pt-10 border-t border-gray-100 print-area prose max-w-none text-sm break-words markdown-body">
           <ReactMarkdown>{result}</ReactMarkdown>
           <button onClick={() => window.print()} className="mt-8 border border-gray-200 px-6 py-3 hover:bg-gray-900 hover:text-white transition-colors uppercase tracking-[2px] font-bold text-[10px] no-print flex items-center gap-2">
              <Printer size={16}/> Cetak Dokumen
           </button>
        </div>
      )}
    </div>
  );
}

// Component for Humas
function HumasForm() {
  const [formData, setFormData] = useState({
    jenisLaporan: '',
    targetAudiens: '',
    programSukses: '',
    feedback: ''
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  const generateReport = async () => {
    if (!formData.jenisLaporan) {
      alert("Harap pilih fokus laporan.");
      return;
    }
    setLoading(true);
    try {
      const prompt = `Buatkan draf akhir Laporan Wakil Kepala Sekolah Bidang Humas secara profesional.
Data:
Fokus Laporan: ${formData.jenisLaporan}
Target Mitra/Audiens: ${formData.targetAudiens}
Aktivitas / Realisasi Kemitraan: ${formData.programSukses}
Tanggapan Publik/Mitra (Feedback): ${formData.feedback}

Tampilkan dalam format Markdown formal. Fokus pada strategi hubungan masyarakat, transparansi, dan kolaborasi eksternal institusi pendidikan.`;
      
      const ai = new GoogleGenAI({});
      const response = await ai.models.generateContent({
        model: 'openai',
        contents: prompt,
        config: {
          systemInstruction: 'Anda adalah tenaga ahli penyusun laporan kehumasan dan kemitraan satuan pendidikan, gunakan diksi yang profesional namun lugas.',
          temperature: 0.2
        }
      });
      setResult(response.text);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest block mb-2">Fokus Laporan Humas</label>
          <select className="w-full p-3 font-sans text-sm border border-gray-200 bg-white focus:border-blue-600" value={formData.jenisLaporan} onChange={e => setFormData({...formData, jenisLaporan: e.target.value})}>
            <option value="">-- Pilih --</option>
            <option value="Evaluasi Kemitraan DUDI / Industri">Evaluasi Kemitraan DUDI / Industri</option>
            <option value="Laporan Hubungan Komite & Orang Tua">Laporan Hubungan Komite & Orang Tua</option>
            <option value="Branding & Publikasi Eksternal">Branding & Publikasi Eksternal</option>
            <option value="Kerja Sama Puskesmas & Pihak Lainnya">Kerja Sama Lintas Lembaga (Pemerintah/Kesehatan)</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest block mb-2">Target Mitra Eksternal Utama</label>
          <input type="text" className="w-full p-3 font-sans text-sm border border-gray-200 focus:border-blue-600" value={formData.targetAudiens} onChange={e => setFormData({...formData, targetAudiens: e.target.value})} placeholder="Contoh: Industri otomotif lokal, Dinkes..." />
        </div>
      </div>
      <div>
        <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest block mb-2">Aktivitas Terlaksana / Penetrasi Sosialisasi</label>
        <textarea className="w-full p-3 font-sans text-sm border border-gray-200 focus:border-blue-600" rows={3} value={formData.programSukses} onChange={e => setFormData({...formData, programSukses: e.target.value})} placeholder="Rapat koordinasi, penandatanganan MoU, atau publikasi kegiatan..." />
      </div>
      <div>
        <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest block mb-2">Umpan Balik / Tantangan Komunikasi</label>
        <textarea className="w-full p-3 font-sans text-sm border border-gray-200 focus:border-blue-600" rows={2} value={formData.feedback} onChange={e => setFormData({...formData, feedback: e.target.value})} placeholder="Respons mitra, keluhan warga, atau kendala komunikasi..." />
      </div>
      <div className="flex justify-end pt-4">
        <button onClick={generateReport} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2">
          {loading ? <Loader2 className="animate-spin" size={16}/> : <CheckCircle2 size={16}/>} Generate Laporan
        </button>
      </div>
      {result && (
        <div id="printArea" className="mt-10 pt-10 border-t-2 border-gray-200 print-area prose max-w-none text-sm break-words markdown-body">
           <ReactMarkdown>{result}</ReactMarkdown>
           <button onClick={() => window.print()} className="mt-8 border border-gray-200 px-6 py-3 hover:bg-gray-900 hover:text-white transition-colors uppercase tracking-[2px] font-bold text-[10px] no-print flex items-center gap-2">
              <Printer size={16}/> Cetak Dokumen
           </button>
        </div>
      )}
    </div>
  );
}

// Component for Kesiswaan
function KesiswaanForm() {
  const [formData, setFormData] = useState({
    jenisLaporan: '',
    programFokus: '',
    statusKedisiplinan: '',
    prestasi: ''
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  const generateReport = async () => {
    if (!formData.jenisLaporan) {
      alert("Harap tentukan jenis klasifikasi laporan.");
      return;
    }
    setLoading(true);
    try {
      const prompt = `Buatkan draf akhir Laporan Wakil Kepala Sekolah Bidang Kesiswaan (Executive Summary).
Data:
Jenis Program/Laporan: ${formData.jenisLaporan}
Fokus Pembinaan yang dijalankan: ${formData.programFokus}
Status Tata Tertib / Kedisiplinan: ${formData.statusKedisiplinan}
Catatan Prestasi Murid (Akademik/Non): ${formData.prestasi}

Tampilkan dalam format Markdown formal terstruktur. Soroti kepemimpinan murid (student agency), iklim belajar yang aman, dan resolusi disiplin.`;
      
      const ai = new GoogleGenAI({});
      const response = await ai.models.generateContent({
        model: 'openai',
        contents: prompt,
        config: {
          systemInstruction: 'Anda ahli dalam tata laksana kesiswaan pendidikan.',
          temperature: 0.2
        }
      });
      setResult(response.text);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest block mb-2">Klasifikasi Kegiatan Kesiswaan</label>
          <select className="w-full p-3 font-sans text-sm border border-gray-200 bg-white focus:border-blue-600" value={formData.jenisLaporan} onChange={e => setFormData({...formData, jenisLaporan: e.target.value})}>
            <option value="">-- Pilih --</option>
            <option value="Laporan Kedisiplinan & Tata Tertib Harian">Laporan Kedisiplinan & Tata Tertib Harian</option>
            <option value="Evaluasi Ekstrakurikuler & OSIS">Evaluasi Ekstrakurikuler & OSIS</option>
            <option value="Bimbingan Karakter & Anti Perundungan">Bimbingan Karakter & Pencegahan Perundungan</option>
            <option value="Pelaksanaan MPLS / Kegiatan Siswa">Pelaksanaan MPLS / Event Kesiswaan Besar</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest block mb-2">Capaian Prestasi Murid</label>
          <input type="text" className="w-full p-3 font-sans text-sm border border-gray-200 focus:border-blue-600" value={formData.prestasi} onChange={e => setFormData({...formData, prestasi: e.target.value})} placeholder="Sebutkan jika ada lomba yang dimenangkan..." />
        </div>
      </div>
      <div>
        <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest block mb-2">Pelaksanaan Program Pembinaan</label>
        <textarea className="w-full p-3 font-sans text-sm border border-gray-200 focus:border-blue-600" rows={2} value={formData.programFokus} onChange={e => setFormData({...formData, programFokus: e.target.value})} placeholder="Diklat kepemimpinan, pramuka rutin, atau bimbingan sosial emosional..." />
      </div>
      <div>
        <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest block mb-2">Status Tata Tertib / Isu Disiplin</label>
        <textarea className="w-full p-3 font-sans text-sm border border-gray-200 focus:border-blue-600" rows={2} value={formData.statusKedisiplinan} onChange={e => setFormData({...formData, statusKedisiplinan: e.target.value})} placeholder="Evaluasi ketepatan waktu, kasus ringan, mediasi dengan orang tua..." />
      </div>
      <div className="flex justify-end pt-4">
        <button onClick={generateReport} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2">
          {loading ? <Loader2 className="animate-spin" size={16}/> : <CheckCircle2 size={16}/>} Generate Laporan
        </button>
      </div>
      {result && (
        <div id="printArea" className="mt-10 pt-10 border-t-2 border-gray-200 print-area prose max-w-none text-sm break-words markdown-body">
           <ReactMarkdown>{result}</ReactMarkdown>
           <button onClick={() => window.print()} className="mt-8 border border-gray-200 px-6 py-3 hover:bg-gray-900 hover:text-white transition-colors uppercase tracking-[2px] font-bold text-[10px] no-print flex items-center gap-2">
              <Printer size={16}/> Cetak Dokumen
           </button>
        </div>
      )}
    </div>
  );
}

export default function Reports() {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    kurikulum: true,
    humas: false,
    kesiswaan: false
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto font-sans text-gray-900 h-full flex flex-col">
      <header className="shrink-0 mb-8 border-b border-gray-100 pb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Laporan Manajerial</h1>
        <p className="text-sm font-mono tracking-widest text-blue-600 uppercase font-bold">
          Generator Laporan Kinerja Wakil Kepala Sekolah
        </p>
      </header>

      <div className="space-y-6 flex-1 overflow-auto pb-12">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-4">
          <button 
            onClick={() => toggleSection('kurikulum')}
            className="w-full flex items-center justify-between p-6 bg-white text-gray-900 hover:bg-gray-50 border-b border-gray-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <BookOpen size={20} />
              <h2 className="font-semibold text-gray-900">Wakil Kepala Bidang Kurikulum</h2>
            </div>
            {expandedSections.kurikulum ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          
          {expandedSections.kurikulum && (
            <div className="p-6 md:p-8 space-y-6 border-t border-gray-100">
              <KurikulumForm />
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-4">
          <button 
            onClick={() => toggleSection('humas')}
            className="w-full flex items-center justify-between p-6 bg-white text-gray-900 hover:bg-gray-50 border-b border-gray-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Presentation size={20} />
              <h2 className="font-semibold text-gray-900">Wakil Kepala Bidang Humas</h2>
            </div>
            {expandedSections.humas ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          
          {expandedSections.humas && (
            <div className="p-6 md:p-8 space-y-6 border-t border-gray-100">
              <HumasForm />
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-4">
          <button 
            onClick={() => toggleSection('kesiswaan')}
            className="w-full flex items-center justify-between p-6 bg-white text-gray-900 hover:bg-gray-50 border-b border-gray-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Users size={20} />
              <h2 className="font-semibold text-gray-900">Wakil Kepala Bidang Kesiswaan</h2>
            </div>
            {expandedSections.kesiswaan ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          
          {expandedSections.kesiswaan && (
            <div className="p-6 md:p-8 space-y-6 border-t border-gray-100">
              <KesiswaanForm />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
