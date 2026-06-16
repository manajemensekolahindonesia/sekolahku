import React, { useState } from 'react';
import { printElement } from '@/lib/print';
import { Loader2, Leaf, Users, Building, FileBarChart, CheckSquare, BookOpen, ChevronRight, Check, CheckCircle2, Circle, BrainCircuit, Printer, Save, RefreshCw, Download, FileText, ShieldCheck } from 'lucide-react';
import { GoogleGenAI } from '@/lib/genai';
import ReactMarkdown from 'react-markdown';

// Define the Adiwiyata Wizard inside the same file for brevity
function AdiwiyataWizard({ jenjang, jenisSekolah }: { jenjang?: string, jenisSekolah?: string }) {
  const [step, setStep] = useState(1);
  const [thinking, setThinking] = useState(false);
  const [history, setHistory] = useState<{ step: number; userSummary: string; aiResponse: string }[]>([]);
  
  const [data, setData] = useState({
    jenjang: 'SD/MI',
    skTim: '',
    kesenjangan: 'Data Lengkap (Ada logbook harian/bulanan)',
    rencanaAksi: [] as string[],
    rencanaLainnya: '',
    targetSampah: '< 10%',
    anggaranTotal: '',
    anggaranLingkungan: '',
    kemitraan: '',
    sarana: [] as string[],
    dokumentasi: 'Terdokumentasi rutin dengan timestamp (Foto/Video)'
  });

  const toggleArray = (field: 'rencanaAksi' | 'sarana', val: string) => {
    setData((prev) => {
      const arr = prev[field];
      return { ...prev, [field]: arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val] };
    });
  };

  const handleAnalisis = async (currentStep: number) => {
    let userSummary = '';
    let promptDetail = '';

    if (currentStep === 1) {
      if (!data.skTim) { alert('Pilih status SK Tim Adiwiyata'); return; }
      userSummary = `Tahap 1: Identitas & Pemetaan Mutu\n- Jenjang: ${data.jenjang}\n- SK Tim: ${data.skTim}\n- Kesenjangan Data: ${data.kesenjangan}`;
      promptDetail = `PROFIL SEKOLAH: Jenjang: ${jenjang || '-'} / ${jenisSekolah || '-'}\n\nPengguna telah mengisi Tahap 1 dengan data:\nJenjang: ${data.jenjang}\nSK Tim: ${data.skTim}\nKesenjangan Data: ${data.kesenjangan}\n\nBerikan Analisis Pemetaan Mutu singkat (Tabel Gap Analysis) dan rekomendasi prioritas sesuai pedoman. Akhiri dengan kalimat meminta pengguna untuk lanjut ke Tahap 2.`;
    } 
    else if (currentStep === 2) {
      if (data.rencanaAksi.length === 0 && !data.rencanaLainnya) { alert('Pilih minimal satu rencana aksi'); return; }
      const aksi = [...data.rencanaAksi, data.rencanaLainnya].filter(Boolean).join(', ');
      userSummary = `Tahap 2: Penyusunan Rencana\n- Rencana Prioritas: ${aksi}\n- Target Pengurangan Sampah: ${data.targetSampah}`;
      promptDetail = `Pengguna telah mengisi Tahap 2 dengan data:\nRencana Prioritas: ${aksi}\nTarget Sampah: ${data.targetSampah}\n\nBerikan Format Tabel Rencana Aksi (Gantt Chart Sederhana) beserta catatan kelayakan. Akhiri dengan kalimat meminta persetujuan untuk lanjut ke Tahap 3.`;
    }
    else if (currentStep === 3) {
      if (!data.anggaranTotal || !data.anggaranLingkungan) { alert('Isi data anggaran'); return; }
      userSummary = `Tahap 3: Penyusunan Anggaran\n- Total Anggaran: Rp ${data.anggaranTotal}\n- Dana Lingkungan: Rp ${data.anggaranLingkungan}`;
      promptDetail = `Pengguna telah mengisi Tahap 3 dengan data:\nTotal Anggaran Operasional: Rp ${data.anggaranTotal}\nDana Khusus Lingkungan: Rp ${data.anggaranLingkungan}\n\nLakukan kalkulasi otomatis (hitung persentase alokasi dana lingkungan terhadap total anggaran). Tampilkan visualisasi persentase tersebut secara menarik di dalam format Markdown. Jika di bawah 20%, berikan rekomendasi perbaikan/pergeseran pos anggaran yang preskriptif. Akhiri dengan kalimat ajakan ke Tahap 4.`;
    }
    else if (currentStep === 4) {
      if (!data.kemitraan) { alert('Pilih status Kemitraan'); return; }
      userSummary = `Tahap 4: Pemenuhan Mutu\n- Status Kemitraan: ${data.kemitraan}\n- Sarana: ${data.sarana.join(', ') || 'Tidak Ada'}\n- Dokumentasi: ${data.dokumentasi}`;
      promptDetail = `Pengguna telah mengisi Tahap 4 dengan data:\nStatus Kemitraan (MoU): ${data.kemitraan}\nKondisi Sarana: ${data.sarana.join(', ') || 'Belum tersedia'}\nDokumentasi Kegiatan: ${data.dokumentasi}\n\nBerikan skor sementara (Sebutkan secara eksplisit "Nilai Hijau", "Nilai Kuning", atau "Nilai Merah") beserta alasannya. Akhiri dengan ajakan lanjut ke tahap final (Evaluasi Akhir).`;
    }
    else if (currentStep === 5) {
      userSummary = `Tahap 5: Eksekusi Evaluator Akhir`;
      promptDetail = `Semua data dari tahap 1 hingga 4 telah dievaluasi. Sekarang, TANPA meminta input lagi, berikan output final:\n1. Matriks Penilaian Akhir (Berbentuk Tabel: Komponen, Bobot, Skor Perolehan, Status).\n2. Rekomendasi Tingkat Penghargaan (Pilih: Layak ikut seleksi tingkat Kab/Kota / Provinsi / Nasional / Belum Layak), sertakan pointer perbaikan yang tegas.\n3. JIKA jenjang pendidikan yang diisi pengguna adalah "Perguruan Tinggi", WAJIB tambahkan catatan khusus terkait indikator UI GreenMetric tentang jejak karbon dan limbah B3 lab. (Jenjang yang diisi oleh pengguna adalah: ${data.jenjang}).`;
    }

    setThinking(true);
    try {
      let conversationContents = [];
      for (const h of history) {
         conversationContents.push({ role: 'user', parts: [{ text: h.userSummary }] });
         conversationContents.push({ role: 'model', parts: [{ text: h.aiResponse }] });
      }
      conversationContents.push({ role: 'user', parts: [{ text: promptDetail }] });

      const systemInstruction = `Kamu adalah Analis Strategis Data Senior dari Kementerian Pendidikan (SD, SMP, SMA, SMK, SLB). 
Tugasmu adalah mengevaluasi pemetaan mutu sekolah dengan fokus pada validitas dan kedalaman data. 
WAJIB gunakan analisis '5 Why' dan 'Fishbone Analysis' secara implisit maupun eksplisit (dalam penjelasan) untuk mengidentifikasi akar masalah sebenarnya dari indikator mutu yang rendah.
Jika ada data yang tampak tidak konsisten, gunakan logika 'Venn Diagram' untuk menemukan irisan masalah lintas standar.
Pastikan rekomendasi memiliki keterkaitan kuat antara gap yang teridentifikasi dan program intervensi yang disusun.
DILARANG KERAS memberikan sapaan, pembukaan, atau penutup. Fokus pada output audit yang preskriptif.`;

      const ai = new GoogleGenAI({});
      const response = await ai.models.generateContent({
        model: 'openai',
        contents: conversationContents,
        config: {
          systemInstruction,
          temperature: 0.2
        }
      });
      const data = { text: response.text };

      setHistory(prev => [...prev, {
        step: currentStep,
        userSummary: userSummary,
        aiResponse: data.text || ''
      }]);

      setStep(currentStep + 1);

    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setThinking(false);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-12">
      {/* Introduction Header */}
      <div className="bg-white border-l-4 border-blue-600 p-8 md:p-10 shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 font-sans font-black  mb-3 flex items-center gap-4 text-gray-900">
          <Leaf className="text-blue-600" size={32} /> Audit Adiwiyata Digital
        </h2>
        <p className="font-sans text-base leading-relaxed max-w-3xl text-gray-700">
          Sistem Evaluasi Program Adiwiyata. Lengkapi kriteria di bawah ini untuk Audit Gap Analysis Eksekutif.
        </p>
      </div>

      {/* RENDER HISTORY */}
      {history.map((h, i) => (
         <div key={i} className="space-y-6">
            <div className="bg-white border border-gray-100 p-6 self-start max-w-2xl border-l-2 border-l-blue-600 shadow-sm relative">
               <div className="text-[10px] tracking-[3px] uppercase font-bold text-gray-500 mb-4 flex items-center gap-2">
                 Input Verifikasi - Tahap {h.step}
               </div>
               <pre className="font-mono text-sm whitespace-pre-wrap leading-relaxed text-gray-700">{h.userSummary}</pre>
            </div>
            <div className="bg-blue-50 border-t-2 border-b-2 border-gray-100 p-4 md:p-8 lg:p-14 self-end prose prose-slate max-w-none prose-tables:border prose-tables:border-gray-200 prose-th:bg-white prose-th:text-gray-900 prose-td:border-gray-100 prose-headings:font-sans prose-headings:text-gray-900 prose-a:text-blue-600 prose-p:font-sans prose-p:leading-[1.8] prose-p:text-base prose-li:font-sans prose-li:text-base relative print-area w-full">
               <div className="flex items-center justify-between mb-8">
                 <div className="text-[11px] tracking-[3px] uppercase font-bold text-blue-600 flex items-center gap-3">
                   <BrainCircuit size={18} /> Analisis Mutu Supervisor
                 </div>
                 <button onClick={() => printElement('printArea', 'Laporan', undefined)} className="no-print flex items-center gap-2 text-gray-900 hover:text-blue-600 transition-colors text-sm font-medium border border-gray-200 px-3 py-1.5 bg-white shadow-sm">
                    <Printer size={14} /> Cetak Laporan
                 </button>
               </div>
               <div className="markdown-body"><ReactMarkdown>{h.aiResponse}</ReactMarkdown></div>
            </div>
         </div>
      ))}

      {/* RENDER CURRENT STEP FORM */}
      {thinking && (
        <div className="p-16 flex flex-col items-center justify-center text-gray-900 bg-white border border-gray-100 shadow-sm animate-pulse">
           <Loader2 className="animate-spin text-blue-600 mb-6" size={48} />
           <p className="font-sans  text-base text-gray-600">Menganalisis matriks evaluasi Anda...</p>
        </div>
      )}

      {!thinking && step <= 5 && (
        <div className="bg-white border-t-2 border-gray-200 p-4 md:p-8 lg:p-14 shadow-lg border-l border-r border-b border-gray-100 relative">
           <h3 className="text-[22px] font-bold font-sans mb-10 border-b-2 border-gray-100 pb-4 flex items-center justify-between">
              <span className="text-gray-900">
                {step === 1 ? 'Tahap 1: Identitas Sekolah & Pemetaan Mutu' :
                 step === 2 ? 'Tahap 2: Penyusunan Rencana' :
                 step === 3 ? 'Tahap 3: Penyusunan Anggaran' :
                 step === 4 ? 'Tahap 4: Pemenuhan Mutu' :
                 'Tahap 5: Konfirmasi Evaluator Akhir'}
              </span>
              <span className="text-[10px] font-sans tracking-[3px] uppercase font-black text-gray-500 bg-gray-900/5 px-4 py-2 border border-gray-100">Step {step}/5</span>
           </h3>

           {/* STEP 1 FIELDS */}
           {step === 1 && (
             <div className="space-y-10">
               <div className="space-y-4">
                 <label className="text-[12px] font-bold text-gray-900 uppercase tracking-widest block border-l-[3px] border-blue-600 pl-3">Jenjang Pendidikan</label>
                 <select className="w-full p-4 border border-gray-200 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-accent text-base font-medium bg-white cursor-pointer transition-colors" value={data.jenjang} onChange={e => setData({...data, jenjang: e.target.value})}>
                    <option>SD/MI</option>
                    <option>SMP/MTs</option>
                    <option>SMA/MA/SMK</option>
                    <option>Perguruan Tinggi</option>
                 </select>
               </div>

               <div className="space-y-4">
                 <label className="text-[12px] font-bold text-gray-900 uppercase tracking-widest block border-l-[3px] border-blue-600 pl-3">Apakah sekolah sudah memiliki SK Tim Adiwiyata yang ditandatangani tahun ini?</label>
                 <div className="grid md:grid-cols-3 gap-6">
                    {['Sudah Ada dan Berlaku', 'Sudah Ada tapi Kedaluwarsa', 'Belum Ada'].map(opt => (
                       <label key={opt} className={`cursor-pointer border-2 p-5 flex items-center gap-4 transition-colors ${data.skTim === opt ? 'border-blue-600 bg-blue-600/5 shadow-sm' : 'border-gray-100 hover:border-gray-200 hover:bg-gray-900/5'}`}>
                         <input type="radio" className="hidden" name="sk" checked={data.skTim === opt} onChange={() => setData({...data, skTim: opt})} />
                         {data.skTim === opt ? <CheckCircle2 size={22} className="text-blue-600 shrink-0" /> : <Circle size={22} className="text-gray-500 shrink-0" />}
                         <span className="text-sm font-sans font-bold text-gray-900 leading-snug">{opt}</span>
                       </label>
                    ))}
                 </div>
               </div>

               <div className="space-y-4">
                 <label className="text-[12px] font-bold text-gray-900 uppercase tracking-widest block border-l-[3px] border-blue-600 pl-3">Seberapa besar kesenjangan data penggunaan listrik/air di sekolah?</label>
                 <select className="w-full p-4 border border-gray-200 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-accent text-base font-medium bg-white cursor-pointer transition-colors" value={data.kesenjangan} onChange={e => setData({...data, kesenjangan: e.target.value})}>
                    <option>Data Lengkap (Ada logbook harian/bulanan)</option>
                    <option>Data Parsial (Hanya ada tagihan bulanan)</option>
                    <option>Kritis (Tidak ada pencatatan sama sekali)</option>
                 </select>
               </div>
             </div>
           )}

           {/* STEP 2 FIELDS */}
           {step === 2 && (
             <div className="space-y-10">
               <div className="space-y-4">
                 <label className="text-[12px] font-bold text-gray-900 uppercase tracking-widest block border-l-[3px] border-blue-600 pl-3">Rencana aksi mana yang paling prioritas dilaksanakan tahun ini?</label>
                 <div className="space-y-4 bg-gray-900/5 p-6 border border-gray-100">
                    {['Pembuatan Bank Sampah Digital', 'Workshop Integrasi Lingkungan ke RPP Semua Mapel', 'Pembangunan Biopori / Sumur Resapan', 'Penanaman Pohon / Penghijauan'].map(opt => (
                       <label key={opt} className="flex items-center gap-4 cursor-pointer p-4 bg-white border border-gray-100 hover:border-blue-600 transition-colors shadow-sm">
                          <input type="checkbox" className="w-6 h-6 accent-accent cursor-pointer shrink-0" checked={data.rencanaAksi.includes(opt)} onChange={() => toggleArray('rencanaAksi', opt)} />
                          <span className="text-base font-sans font-medium text-gray-900 select-none leading-snug">{opt}</span>
                       </label>
                    ))}
                    <div className="pt-2">
                       <input type="text" placeholder="Lainnya (Tuliskan spesifik)..." className="w-full p-4 border border-gray-200 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-accent text-base bg-white transition-colors" value={data.rencanaLainnya} onChange={e => setData({...data, rencanaLainnya: e.target.value})} />
                    </div>
                 </div>
               </div>

               <div className="space-y-4">
                 <label className="text-[12px] font-bold text-gray-900 uppercase tracking-widest block border-l-[3px] border-blue-600 pl-3">Target Spesifik Pengurangan Sampah dalam 6 Bulan?</label>
                 <select className="w-full p-4 border border-gray-200 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-accent text-base font-medium bg-white cursor-pointer transition-colors" value={data.targetSampah} onChange={e => setData({...data, targetSampah: e.target.value})}>
                    <option>&lt; 10%</option>
                    <option>10% - 25%</option>
                    <option>&gt; 25%</option>
                 </select>
               </div>
             </div>
           )}

           {/* STEP 3 FIELDS */}
           {step === 3 && (
             <div className="space-y-10">
               <div className="space-y-4">
                 <label className="text-[12px] font-bold text-gray-900 uppercase tracking-widest block border-l-[3px] border-blue-600 pl-3">Total Anggaran Operasional Sekolah Tahun Ini (Rp)</label>
                 <input type="number" placeholder="Contoh: 500000000" className="w-full p-5 border-2 border-gray-200 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-accent text-[18px] font-mono tracking-[2px] bg-white transition-colors" value={data.anggaranTotal} onChange={e => setData({...data, anggaranTotal: e.target.value})} />
               </div>
               
               <div className="space-y-4">
                 <label className="text-[12px] font-bold text-gray-900 uppercase tracking-widest block border-l-[3px] border-blue-600 pl-3">Perkiraan Dana Teralokasi untuk Kebersihan, Penghijauan & Lomba (Rp)</label>
                 <input type="number" placeholder="Contoh: 150000000" className="w-full p-5 border-2 border-gray-200 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-accent text-[18px] font-mono tracking-[2px] bg-white transition-colors" value={data.anggaranLingkungan} onChange={e => setData({...data, anggaranLingkungan: e.target.value})} />
               </div>
             </div>
           )}

           {/* STEP 4 FIELDS */}
           {step === 4 && (
             <div className="space-y-10">
               <div className="space-y-4">
                 <label className="text-[12px] font-bold text-gray-900 uppercase tracking-widest block border-l-[3px] border-blue-600 pl-3">Status Kemitraan (MoU) dengan Pihak Luar (Puskesmas/DLH/LSM)?</label>
                 <div className="grid md:grid-cols-3 gap-6">
                    {['Sudah memiliki MoU Aktif (> 1 Mitra)', 'Masih dalam proses komunikasi', 'Belum memiliki sama sekali'].map(opt => (
                       <label key={opt} className={`cursor-pointer border-2 p-5 flex items-center gap-4 transition-colors ${data.kemitraan === opt ? 'border-blue-600 bg-blue-600/5 shadow-sm' : 'border-gray-100 hover:border-gray-200 hover:bg-gray-900/5'}`}>
                         <input type="radio" className="hidden" name="kemitraan" checked={data.kemitraan === opt} onChange={() => setData({...data, kemitraan: opt})} />
                         {data.kemitraan === opt ? <CheckCircle2 size={22} className="text-blue-600 shrink-0" /> : <Circle size={22} className="text-gray-500 shrink-0" />}
                         <span className="text-sm font-sans font-bold text-gray-900 leading-snug">{opt}</span>
                       </label>
                    ))}
                 </div>
               </div>

               <div className="space-y-4">
                 <label className="text-[12px] font-bold text-gray-900 uppercase tracking-widest block border-l-[3px] border-blue-600 pl-3">Kondisi Sarana Pendukung (Pilih yang Tersedia)</label>
                 <div className="space-y-4 bg-gray-900/5 p-6 border border-gray-100">
                    {['Tempat Sampah Terpilah (Organik/Anorganik/B3)', 'Komposter Aktif', 'Kantin Sehat Bebas Plastik Sekali Pakai', 'Papan Informasi Penggunaan Listrik/Air'].map(opt => (
                       <label key={opt} className="flex items-center gap-4 cursor-pointer p-4 bg-white border border-gray-100 hover:border-blue-600 transition-colors shadow-sm">
                          <input type="checkbox" className="w-6 h-6 accent-accent cursor-pointer shrink-0" checked={data.sarana.includes(opt)} onChange={() => toggleArray('sarana', opt)} />
                          <span className="text-base font-sans font-medium text-gray-900 select-none leading-snug">{opt}</span>
                       </label>
                    ))}
                 </div>
               </div>

               <div className="space-y-4">
                 <label className="text-[12px] font-bold text-gray-900 uppercase tracking-widest block border-l-[3px] border-blue-600 pl-3">Dokumentasi Kegiatan Jumat Bersih/Peduli Lingkungan</label>
                 <select className="w-full p-4 border border-gray-200 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-accent text-base font-medium bg-white cursor-pointer transition-colors" value={data.dokumentasi} onChange={e => setData({...data, dokumentasi: e.target.value})}>
                    <option>Terdokumentasi rutin dengan timestamp (Foto/Video)</option>
                    <option>Ada foto tapi tidak ada keterangan waktu</option>
                    <option>Kegiatan jalan tapi tidak pernah didokumentasikan</option>
                 </select>
               </div>
             </div>
           )}

           {/* STEP 5 Confirm */}
           {step === 5 && (
              <div className="text-center py-10 bg-blue-100/20 border border-gray-100 mt-8">
                 <div className="w-20 h-20 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-md shadow-accent/20">
                    <Check size={40} />
                 </div>
                 <h4 className="text-[26px] font-sans font-black  mb-3 text-gray-900">Evaluasi Formulir Selesai</h4>
                 <p className="text-base text-gray-600 font-sans mb-8 max-w-xl mx-auto leading-relaxed">
                   Seluruh data telah diverifikasi. Sistem siap mengeksekusi Kalkulasi Matriks Penilaian Akhir dan memberikan Rekomendasi Tingkat Penghargaan.
                 </p>
              </div>
           )}

           <div className="mt-12 flex justify-end">
              <button 
                 onClick={() => handleAnalisis(step)} 
                 className="bg-gray-900 hover:bg-blue-600 text-white hover:text-gray-900 font-bold uppercase tracking-[2px] text-[12px] px-10 py-5 transition-colors flex items-center gap-4 shadow-lg shadow-ink/10"
              >
                 {step === 5 ? 'Generate Evaluasi Akhir' : `Simpan Tahap ${step} & Analisis`} <ChevronRight size={18} />
              </button>
           </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 border border-gray-100 shadow-sm relative no-print mt-8">
         <button onClick={() => { if(window.confirm('Reset seluruh formulir?')){ setStep(1); setData({ jenjang: 'SD/MI', skTim: '', kesenjangan: 'Data Lengkap (Ada logbook harian/bulanan)', rencanaAksi: [], rencanaLainnya: '', targetSampah: '< 10%', anggaranTotal: '', anggaranLingkungan: '', kemitraan: '', sarana: [], dokumentasi: 'Terdokumentasi rutin dengan timestamp (Foto/Video)' }); setHistory([]); } }} className="text-danger flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest hover:underline w-full md:w-auto mb-4 md:mb-0">
            <RefreshCw size={14} /> Reset Seluruh Form
         </button>
         
         <div className="flex flex-wrap gap-4 w-full md:w-auto justify-end">
            <button onClick={() => alert("Data profil pengguna berhasil disimpan.")} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 border-2 border-gray-200 text-gray-900 font-bold text-[11px] uppercase tracking-widest hover:bg-gray-900 hover:text-white transition-colors">
               <Save size={16} /> Simpan Data
            </button>
            <button onClick={() => printElement('printArea', 'Laporan', undefined)} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 border-2 border-gray-200 text-gray-900 font-bold text-[11px] uppercase tracking-widest hover:bg-gray-900 hover:text-white transition-colors">
               <Printer size={16} /> Print
            </button>
            <button onClick={() => alert("Fungsi Save Word sedang dikembangkan.")} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-[#2b579a] text-white font-bold text-[11px] uppercase tracking-widest hover:bg-gray-900 transition-colors shadow-lg shadow-[#2b579a]/20">
               <FileText size={16} /> Save Word
            </button>
            <button onClick={() => alert("Fungsi Save PDF sedang dikembangkan. Gunakan fitur Print.")} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-[#e3242b] text-white font-bold text-[11px] uppercase tracking-widest hover:bg-gray-900 transition-colors shadow-lg shadow-[#e3242b]/20">
               <Download size={16} /> Save PDF
            </button>
         </div>
      </div>
    </div>
  );
}

// --- SEKOLAH RAMAH ANAK WIZARD ---
function SraWizard({ jenjang, jenisSekolah }: { jenjang?: string, jenisSekolah?: string }) {
  const [step, setStep] = useState(1);
  const [thinking, setThinking] = useState(false);
  const [history, setHistory] = useState<{ step: number; userSummary: string; aiResponse: string }[]>([]);

  const [formData, setFormData] = useState({
    sekolah: '',
    jenjang: 'SD/MI',
    tanggalEvaluasi: '',
    pemetaan: {
      kebijakan: { skor: '1', bukti: false },
      prosesBelajar: { skor: '1', bukti: false },
      pendidik: { skor: '1', bukti: false },
      sarpras: { skor: '1', bukti: false },
      partisipasiAnak: { skor: '1', bukti: false },
      partisipasiOrtu: { skor: '1', bukti: false }
    },
    rencana: { program: '', prioritas: 'Tinggi', timeline: '' },
    anggaran: { kegiatan: '', volume: '', hargaSatuan: '', sumberDana: 'BOS Reguler' },
    pemenuhan: { realisasi: '', hambatan: '' },
    evaluator: { penilaian: 'Kurang', rekomendasi: '', namaEvaluator: '', institusi: '' }
  });

  const handlePemetaanChange = (indikator: string, field: 'skor' | 'bukti', value: any) => {
    setFormData(prev => ({
      ...prev,
      pemetaan: {
        ...prev.pemetaan,
        [indikator]: { ...prev.pemetaan[indikator as keyof typeof prev.pemetaan], [field]: value }
      }
    }));
  };

  const handleAnalisis = async (currentStep: number) => {
    let userSummary = '';
    let promptDetail = '';

    if (currentStep === 1) {
      if (!formData.sekolah || !formData.tanggalEvaluasi) { alert('Harap isi Nama Sekolah dan Tanggal Evaluasi'); return; }
      const p = formData.pemetaan;
      userSummary = `Tahap 1: Pemetaan Mutu SRA\n- Sekolah: ${formData.sekolah}\n- Jenjang: ${formData.jenjang}\n- Tanggal: ${formData.tanggalEvaluasi}\n- Kebijakan [Skor: ${p.kebijakan.skor}, Bukti: ${p.kebijakan.bukti}]\n- Proses Belajar [Skor: ${p.prosesBelajar.skor}, Bukti: ${p.prosesBelajar.bukti}]\n- Pendidik [Skor: ${p.pendidik.skor}, Bukti: ${p.pendidik.bukti}]\n- Sarpras [Skor: ${p.sarpras.skor}, Bukti: ${p.sarpras.bukti}]\n- Partisipasi Anak [Skor: ${p.partisipasiAnak.skor}, Bukti: ${p.partisipasiAnak.bukti}]\n- Partisipasi Ortu [Skor: ${p.partisipasiOrtu.skor}, Bukti: ${p.partisipasiOrtu.bukti}]`;
      promptDetail = `PROFIL SEKOLAH: Jenjang: ${jenjang || '-'} / ${jenisSekolah || '-'}\n\nPengguna telah mengisi Tahap 1 (Pemetaan Mutu Sekolah Ramah Anak) dengan matriks skor 1-4 dan bukti fisik. Berikut ringkasannya:\n${userSummary}\n\nBerikan Analisis Audit singkat terkait indikator yang paling lemah dan indikator terkuat. Buat format tabel sederhana untuk menyoroti Gap. Akhiri dengan instruksi lanjut ke Tahap 2: Rencana Tindak Lanjut.`;
    } 
    else if (currentStep === 2) {
      if (!formData.rencana.program || !formData.rencana.timeline) { alert('Isi Program Prioritas dan Timeline'); return; }
      userSummary = `Tahap 2: Penyusunan RTL\n- Program: ${formData.rencana.program}\n- Prioritas: ${formData.rencana.prioritas}\n- Timeline: ${formData.rencana.timeline}`;
      promptDetail = `Pengguna merencanakan:\nProgram Prioritas: ${formData.rencana.program}\nTingkat Prioritas: ${formData.rencana.prioritas}\nPelaksanaan: ${formData.rencana.timeline}\n\nBerikan ulasan kritis (gaya Editorial Audit) tentang urgensi program SRA ini. Buatlah poin-poin milestone yang disarankan berdasarkan timeline tersebut. Akhiri dengan ajakan lanjut ke Tahap 3.`;
    }
    else if (currentStep === 3) {
      if (!formData.anggaran.kegiatan || !formData.anggaran.volume || !formData.anggaran.hargaSatuan) { alert('Lengkapi data RKAS'); return; }
      const total = Number(formData.anggaran.volume) * Number(formData.anggaran.hargaSatuan);
      userSummary = `Tahap 3: Rincian RKAS\n- Uraian: ${formData.anggaran.kegiatan}\n- Sumber Dana: ${formData.anggaran.sumberDana}\n- Volume: ${formData.anggaran.volume}, Harga Satuan: Rp ${Number(formData.anggaran.hargaSatuan).toLocaleString('id-ID')}\n- Total Estimasi: Rp ${total.toLocaleString('id-ID')}`;
      promptDetail = `Pengguna meminta anggaran untuk SRA:\nKegiatan: ${formData.anggaran.kegiatan}\nSumber: ${formData.anggaran.sumberDana}\nEstimasi Total: Rp ${total.toLocaleString('id-ID')}\n\nBerikan validasi anggaran dalam format 'Risk Assessment' untuk meminimalisir pemborosan. Apakah angka ini masuk akal untuk skala jenjang ${formData.jenjang}? Akhiri dengan ajakan lanjut ke Tahap 4.`;
    }
    else if (currentStep === 4) {
      if (!formData.pemenuhan.realisasi || !formData.pemenuhan.hambatan) { alert('Isi realisasi dan hambatan'); return; }
      userSummary = `Tahap 4: Pemenuhan Mutu\n- Realisasi & Dampak: ${formData.pemenuhan.realisasi}\n- Hambatan/Risiko: ${formData.pemenuhan.hambatan}`;
      promptDetail = `Laporan Pemenuhan:\nRealisasi: ${formData.pemenuhan.realisasi}\nHambatan Khusus: ${formData.pemenuhan.hambatan}\n\nAnalisis kemajuan dan klasifikasi risikonya. Tegur secara profesional jika hambatannya menunjukkan kelalaian pengawasan terhadap konsep Ramah Anak. Akhiri dengan instruksi lanjut ke tahap Evaluator (Tahap 5).`;
    }
    else if (currentStep === 5) {
      if (!formData.evaluator.namaEvaluator || !formData.evaluator.institusi || !formData.evaluator.rekomendasi) { alert('Isi lengkap kolom Evaluator'); return; }
      userSummary = `Tahap 5: Evaluator Akhir\n- Asesor: ${formData.evaluator.namaEvaluator} (${formData.evaluator.institusi})\n- Skor Akreditasi: ${formData.evaluator.penilaian}\n- Instruksi Asesor: ${formData.evaluator.rekomendasi}`;
      promptDetail = `Evaluator Akhir (${formData.evaluator.namaEvaluator} dari ${formData.evaluator.institusi}) memberikan label penilaian: ${formData.evaluator.penilaian} dengan rekomendasi: "${formData.evaluator.rekomendasi}".\n\nHasilkan Matriks Penilaian Akhir (Tabel) yang menyatukan rangkuman dari Tahap 1 hingga Tahap 4. Berikan stempel atau status akreditasi Sekolah Ramah Anak yang tegas.`;
    }

    setThinking(true);
    try {
      let conversationContents = [];
      for (const h of history) {
         conversationContents.push({ role: 'user', parts: [{ text: h.userSummary }] });
         conversationContents.push({ role: 'model', parts: [{ text: h.aiResponse }] });
      }
      conversationContents.push({ role: 'user', parts: [{ text: promptDetail }] });

      const systemInstruction = `Anda adalah Analis Strategis Data Senior dari Kementerian Pendidikan yang mengaudit Sekolah Ramah Anak (SRA). 
Tugas utama Anda adalah mengevaluasi pemetaan mutu sekolah dengan fokus pada validitas data iklim keamanan dan karakter.
WAJIB gunakan analisis '5 Why' dan 'Fishbone Analysis' untuk mengidentifikasi akar masalah dari gap yang ditemukan.
Gunakan data objektif (asesmen nasional, observasi) sebagai basis rekomendasi terintegrasi lintas standar.
DILARANG memberikan sapaan atau penutup. Hasilkan output audit Markdown murni (Tabel, Bold, List).`;

      const ai = new GoogleGenAI({});
      const response = await ai.models.generateContent({
        model: 'openai',
        contents: conversationContents,
        config: {
          systemInstruction,
          temperature: 0.2
        }
      });
      const data = { text: response.text };
      
      setHistory(prev => [...prev, {
        step: currentStep,
        userSummary: userSummary,
        aiResponse: data.text || ''
      }]);

      setStep(currentStep + 1);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setThinking(false);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-12">
      <div className="bg-white border-l-4 border-[#2A9D8F] p-8 md:p-10 shadow-sm border border-gray-100">
        <div className="flex justify-between items-start mb-3">
          <h2 className="text-2xl font-bold text-gray-900 font-sans font-black  flex items-center gap-4 text-gray-900">
            <Users className="text-[#2A9D8F]" size={32} /> Audit Sekolah Ramah Anak (SRA)
          </h2>
        </div>
        <p className="font-sans text-base leading-relaxed max-w-3xl text-gray-700">
          Sistem Evaluasi Program Sekolah Ramah Anak (SRA). Lengkapi kriteria di bawah ini untuk Audit Gap Analysis Eksekutif.
        </p>
      </div>

      {step === 1 && history.length === 0 && (
         <div className="bg-white p-6 md:p-8 border-[2px] border-gray-100 shadow-sm flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-2">
               <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest block">Nama Sekolah</label>
               <input type="text" className="w-full p-4 text-sm font-sans border border-gray-200 focus:outline-none focus:border-[#2A9D8F] bg-white" value={formData.sekolah} onChange={e => setFormData({...formData, sekolah: e.target.value})} placeholder="Contoh: SMA Negeri 1 Bangsa" />
            </div>
            <div className="w-full md:w-1/4 space-y-2">
               <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest block">Jenjang</label>
               <select className="w-full p-4 text-sm font-sans border border-gray-200 focus:outline-none focus:border-[#2A9D8F] bg-white relative z-10" value={formData.jenjang} onChange={e => setFormData({...formData, jenjang: e.target.value})}>
                  <option>SD/MI</option>
                  <option>SMP/MTs</option>
                  <option>SMA/MA/SMK</option>
                  <option>Perguruan Tinggi</option>
               </select>
            </div>
            <div className="w-full md:w-1/4 space-y-2">
               <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest block">Tanggal Evaluasi</label>
               <input type="date" className="w-full p-4 text-sm font-sans border border-gray-200 focus:outline-none focus:border-[#2A9D8F] bg-white" value={formData.tanggalEvaluasi} onChange={e => setFormData({...formData, tanggalEvaluasi: e.target.value})} />
            </div>
         </div>
      )}

      {/* RENDER HISTORY */}
      {history.map((h, i) => (
         <div key={i} className="space-y-6">
            <div className="bg-white border border-gray-100 p-6 self-start max-w-2xl border-l-2 border-l-[#2A9D8F] shadow-sm relative">
               <div className="text-[10px] tracking-[3px] uppercase font-bold text-gray-500 mb-4 flex items-center gap-2">
                 Input Verifikasi - Tahap {h.step}
               </div>
               <pre className="font-mono text-sm whitespace-pre-wrap leading-relaxed text-gray-700">{h.userSummary}</pre>
            </div>
            <div className="bg-blue-50 border-t-2 border-b-2 border-gray-100 p-4 md:p-8 lg:p-14 self-end prose prose-slate max-w-none prose-tables:border prose-tables:border-gray-200 prose-th:bg-white prose-th:text-gray-900 prose-td:border-gray-100 prose-headings:font-sans prose-headings:text-gray-900 prose-a:text-blue-600 prose-p:font-sans prose-p:leading-[1.8] prose-p:text-base prose-li:font-sans prose-li:text-base relative print-area w-full">
               <div className="flex items-center justify-between mb-8 transition-colors">
                 <div className="text-[11px] tracking-[3px] uppercase font-bold text-[#2A9D8F] flex items-center gap-3">
                   <BrainCircuit size={18} /> Audit Panel SRA
                 </div>
                 <button onClick={() => printElement('printArea', 'Laporan', undefined)} className="no-print flex items-center gap-2 text-gray-900 hover:text-[#2A9D8F] transition-colors text-sm font-medium border border-gray-200 px-3 py-1.5 bg-white shadow-sm">
                    <Printer size={14} /> Cetak Laporan
                 </button>
               </div>
               <div className="markdown-body"><ReactMarkdown>{h.aiResponse}</ReactMarkdown></div>
            </div>
         </div>
      ))}

      {thinking && (
        <div className="p-16 flex flex-col items-center justify-center text-gray-900 bg-white border border-gray-100 shadow-sm animate-pulse">
           <Loader2 className="animate-spin text-[#2A9D8F] mb-6" size={48} />
           <p className="font-sans  text-base text-gray-600">Menganalisis matriks SRA...</p>
        </div>
      )}

      {!thinking && step <= 5 && (
         <div className="bg-white border-t-2 border-gray-200 p-4 md:p-8 lg:p-14 shadow-lg border-l border-r border-b border-gray-100 relative">
           <h3 className="text-[22px] font-bold font-sans mb-10 border-b-2 border-gray-100 pb-4 flex items-center justify-between">
              <span className="text-gray-900">
                {step === 1 ? 'Tahap 1: Pemetaan Mutu SRA' :
                 step === 2 ? 'Tahap 2: Rencana Tindak Lanjut (RTL)' :
                 step === 3 ? 'Tahap 3: Rincian Anggaran (RKAS SRA)' :
                 step === 4 ? 'Tahap 4: Pemenuhan Mutu (Implementasi & Risiko)' :
                 'Tahap 5: Evaluator Akhir & Asesmen'}
              </span>
              <span className="text-[10px] font-sans tracking-[3px] uppercase font-black text-gray-500 bg-gray-900/5 px-4 py-2 border border-gray-100">Step {step}/5</span>
           </h3>

           {/* STEP 1: PEMETAAN MUTU */}
           {step === 1 && (
             <div className="overflow-x-auto">
               <table className="w-full text-left font-sans text-sm">
                 <thead>
                   <tr className="bg-blue-100 border-b-2 border-gray-200">
                     <th className="p-4 font-bold text-gray-900 text-[12px] uppercase tracking-widest">Kategori Indikator SRA</th>
                     <th className="p-4 font-bold text-gray-900 text-[12px] uppercase tracking-widest w-32 text-center">Skor (1-4)</th>
                     <th className="p-4 font-bold text-gray-900 text-[12px] uppercase tracking-widest w-32 text-center">Fisik/Bukti</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-ink/10">
                   {[
                     { id: 'kebijakan', label: 'Kebijakan SRA (SK tim, deklarasi, anti kekerasan, poin RKAS)' },
                     { id: 'prosesBelajar', label: 'Proses belajar ramah anak (disiplin positif, inklusif, kreativitas)' },
                     { id: 'pendidik', label: 'Pendidik & tenaga kependidikan terlatih hak anak' },
                     { id: 'sarpras', label: 'Sarana prasarana ramah anak (aman, bersih, hijau, disabilitas)' },
                     { id: 'partisipasiAnak', label: 'Partisipasi anak (dilibatkan dalam kebijakan, berpendapat)' },
                     { id: 'partisipasiOrtu', label: 'Partisipasi orang tua, masyarakat, alumni' },
                   ].map(ind => (
                     <tr key={ind.id} className="hover:bg-white/50 transition-colors">
                        <td className="p-4 py-5 font-medium leading-relaxed max-w-sm border-l-[3px] border-transparent hover:border-[#2A9D8F]">{ind.label}</td>
                        <td className="p-4 text-center">
                          <select 
                            className="w-[80px] mx-auto p-2 border border-gray-200 bg-white font-mono text-center focus:outline-none focus:border-[#2A9D8F] font-bold relative z-10"
                            value={formData.pemetaan[ind.id as keyof typeof formData.pemetaan].skor}
                            onChange={(e) => handlePemetaanChange(ind.id, 'skor', e.target.value)}
                          >
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                            <option value="4">4</option>
                          </select>
                        </td>
                        <td className="p-4 text-center">
                           <input type="checkbox" className="w-6 h-6 accent-[#2A9D8F] cursor-pointer" 
                              checked={formData.pemetaan[ind.id as keyof typeof formData.pemetaan].bukti}
                              onChange={(e) => handlePemetaanChange(ind.id, 'bukti', e.target.checked)} />
                        </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           )}

           {/* STEP 2: RENCANA RTL */}
           {step === 2 && (
             <div className="space-y-10">
                <div className="space-y-2">
                   <label className="text-[12px] font-bold text-gray-900 uppercase tracking-widest block border-l-[3px] border-[#2A9D8F] pl-3">Program Prioritas SRA</label>
                   <textarea className="w-full h-32 p-4 font-sans text-sm border border-gray-200 focus:outline-none focus:border-[#2A9D8F] bg-white resize-none" placeholder="Contoh: Deklarasi dan Sosialisasi SRA ke Siswa Baru, Pelatihan Disiplin Positif untuk Pendidik." value={formData.rencana.program} onChange={e => setFormData({...formData, rencana: {...formData.rencana, program: e.target.value}})} />
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                     <label className="text-[12px] font-bold text-gray-900 uppercase tracking-widest block border-l-[3px] border-[#2A9D8F] pl-3">Tingkat Prioritas</label>
                     <select className="w-full p-4 font-sans text-sm border border-gray-200 focus:outline-none focus:border-[#2A9D8F] bg-white relative z-10" value={formData.rencana.prioritas} onChange={e => setFormData({...formData, rencana: {...formData.rencana, prioritas: e.target.value}})}>
                       <option>Tinggi</option>
                       <option>Sedang</option>
                       <option>Rendah</option>
                     </select>
                   </div>
                   <div className="space-y-2">
                     <label className="text-[12px] font-bold text-gray-900 uppercase tracking-widest block border-l-[3px] border-[#2A9D8F] pl-3">Timeline Pelaksanaan</label>
                     <input type="date" className="w-full p-4 font-sans text-sm border border-gray-200 focus:outline-none focus:border-[#2A9D8F] bg-white" value={formData.rencana.timeline} onChange={e => setFormData({...formData, rencana: {...formData.rencana, timeline: e.target.value}})} />
                   </div>
                </div>
             </div>
           )}

           {/* STEP 3: RKAS */}
           {step === 3 && (
             <div className="space-y-10">
                <div className="space-y-2">
                   <label className="text-[12px] font-bold text-gray-900 uppercase tracking-widest block border-l-[3px] border-[#2A9D8F] pl-3">Uraian / Nama Kegiatan RKAS SRA</label>
                   <input type="text" className="w-full p-4 font-sans text-sm border border-gray-200 focus:outline-none focus:border-[#2A9D8F] bg-white" placeholder="Contoh: Pengadaan Plang Kawasan Tanpa Rokok dan Pembangunan Toilet Khusus Disabilitas" value={formData.anggaran.kegiatan} onChange={e => setFormData({...formData, anggaran: {...formData.anggaran, kegiatan: e.target.value}})} />
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                     <label className="text-[12px] font-bold text-gray-900 uppercase tracking-widest block border-l-[3px] border-[#2A9D8F] pl-3">Sumber Dana</label>
                     <select className="w-full p-4 font-sans text-sm border border-gray-200 focus:outline-none focus:border-[#2A9D8F] bg-white relative z-10" value={formData.anggaran.sumberDana} onChange={e => setFormData({...formData, anggaran: {...formData.anggaran, sumberDana: e.target.value}})}>
                       <option>BOS Reguler</option>
                       <option>BOS Afirmasi / Kinerja</option>
                       <option>Komite Sekolah</option>
                       <option>Bantuan CSR</option>
                     </select>
                   </div>
                   <div className="space-y-2">
                     <label className="text-[12px] font-bold text-gray-900 uppercase tracking-widest block border-l-[3px] border-[#2A9D8F] pl-3">Total Estimasi Estimasi Anggaran</label>
                     <div className="w-full p-4 font-mono font-bold text-base border border-gray-200 bg-blue-100 text-gray-900 px-4 h-[54px] flex items-center">
                       Rp {(Number(formData.anggaran.volume) * Number(formData.anggaran.hargaSatuan) || 0).toLocaleString('id-ID')}
                     </div>
                   </div>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                     <label className="text-[12px] font-bold text-gray-900 uppercase tracking-widest block border-l-[3px] border-[#2A9D8F] pl-3">Volume (Jumlah Item)</label>
                     <input type="number" className="w-full p-4 font-mono text-sm border border-gray-200 focus:outline-none focus:border-[#2A9D8F] bg-white" placeholder="Misal: 10" value={formData.anggaran.volume} onChange={e => setFormData({...formData, anggaran: {...formData.anggaran, volume: e.target.value}})} />
                   </div>
                   <div className="space-y-2">
                     <label className="text-[12px] font-bold text-gray-900 uppercase tracking-widest block border-l-[3px] border-[#2A9D8F] pl-3">Harga Satuan (Rp)</label>
                     <input type="number" className="w-full p-4 font-mono text-sm border border-gray-200 focus:outline-none focus:border-[#2A9D8F] bg-white" placeholder="Misal: 150000" value={formData.anggaran.hargaSatuan} onChange={e => setFormData({...formData, anggaran: {...formData.anggaran, hargaSatuan: e.target.value}})} />
                   </div>
                </div>
             </div>
           )}

           {/* STEP 4: PEMENUHAN MUTU */}
           {step === 4 && (
             <div className="space-y-10">
                <div className="space-y-2">
                   <label className="text-[12px] font-bold text-gray-900 uppercase tracking-widest block border-l-[3px] border-[#2A9D8F] pl-3">Laporan Realisasi & Dampak ke Siswa</label>
                   <textarea className="w-full h-32 p-4 font-sans text-sm leading-relaxed border border-gray-200 focus:outline-none focus:border-[#2A9D8F] bg-white resize-none" placeholder="Ceritakan bagaimana implementasi SRA berdampak nyata. Misal: Angka bullying menurun 30% berdasarkan survei BK bulan lalu." value={formData.pemenuhan.realisasi} onChange={e => setFormData({...formData, pemenuhan: {...formData.pemenuhan, realisasi: e.target.value}})} />
                </div>
                <div className="space-y-2">
                   <label className="text-[12px] font-bold text-danger uppercase tracking-widest block border-l-[3px] border-danger pl-3">Catatan Hambatan / Mitigasi Risiko</label>
                   <textarea className="w-full h-24 p-4 font-sans text-sm border border-gray-200 focus:outline-none focus:border-danger bg-white resize-none" placeholder="Tulis sejujurnya apa yang gagal, kurang, atau memerlukan perbaikan di tahap berikutnya." value={formData.pemenuhan.hambatan} onChange={e => setFormData({...formData, pemenuhan: {...formData.pemenuhan, hambatan: e.target.value}})} />
                </div>
             </div>
           )}

           {/* STEP 5: EVALUATOR AKHIR (ASESOR) */}
           {step === 5 && (
             <div className="space-y-10 bg-blue-100/20 p-8 border border-gray-100">
                <div className="space-y-4">
                   <label className="text-[12px] font-bold text-gray-900 uppercase tracking-widest block border-l-[3px] border-[#2A9D8F] pl-3">Skor Penilaian Akhir Akreditasi SRA</label>
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-0">
                      {['Unggul', 'Baik', 'Cukup', 'Kurang'].map(val => (
                         <label key={val} className={`cursor-pointer border-2 p-4 text-center font-bold font-sans transition-colors ${formData.evaluator.penilaian === val ? 'bg-gray-900 text-white border-gray-200' : 'border-gray-200 hover:border-[#2A9D8F] bg-white'}`}>
                            <input type="radio" className="hidden" name="penilaian" checked={formData.evaluator.penilaian === val} onChange={() => setFormData({...formData, evaluator: {...formData.evaluator, penilaian: val}})} />
                            {val}
                         </label>
                      ))}
                   </div>
                </div>
                
                <div className="space-y-4 mt-8">
                   <label className="text-[12px] font-bold text-gray-900 uppercase tracking-widest block border-l-[3px] border-[#2A9D8F] pl-3">Rekomendasi Strategis Mutu</label>
                   <textarea className="w-full h-32 p-4 font-sans text-sm leading-relaxed border border-gray-200 focus:outline-none focus:border-[#2A9D8F] bg-white resize-none shadow-sm" placeholder="Berikan instruksi korektif yang tajam. Hindari kata-kata bersayap. Rekomendasi ini akan diverifikasi oleh AI Supervisor." value={formData.evaluator.rekomendasi} onChange={e => setFormData({...formData, evaluator: {...formData.evaluator, rekomendasi: e.target.value}})} />
                </div>

                <div className="grid md:grid-cols-2 gap-6 mt-8">
                   <div className="space-y-2">
                     <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest block">Nama Asesor / Evaluator Mutu</label>
                     <input type="text" className="w-full p-4 font-sans text-sm border border-gray-200 focus:outline-none focus:border-[#2A9D8F] bg-white" placeholder="Contoh: Dr. Herman S.Pd." value={formData.evaluator.namaEvaluator} onChange={e => setFormData({...formData, evaluator: {...formData.evaluator, namaEvaluator: e.target.value}})} />
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest block">Institusi Afiliasi</label>
                     <input type="text" className="w-full p-4 font-sans text-sm border border-gray-200 focus:outline-none focus:border-[#2A9D8F] bg-white" placeholder="Contoh: KemenPPPA Div. Monev" value={formData.evaluator.institusi} onChange={e => setFormData({...formData, evaluator: {...formData.evaluator, institusi: e.target.value}})} />
                   </div>
                </div>
             </div>
           )}

           <div className="mt-12 flex justify-end relative z-10">
              <button 
                 onClick={() => handleAnalisis(step)} 
                 className="bg-gray-900 hover:bg-[#2A9D8F] text-white hover:text-white font-bold uppercase tracking-[2px] text-[12px] px-10 py-5 transition-colors flex items-center gap-4 shadow-lg shadow-ink/10"
              >
                 {step === 5 ? 'Generate Matriks SRA Akhir' : `Simpan Tahap ${step} & Analisis`} <ChevronRight size={18} />
              </button>
           </div>
         </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 border border-gray-100 shadow-sm relative no-print mt-8">
         <button onClick={() => { if(window.confirm('Reset seluruh formulir?')){ setStep(1); setFormData({sekolah:'',jenjang:'SD/MI',tanggalEvaluasi:'',pemetaan:{kebijakan:{skor:'1',bukti:false},prosesBelajar:{skor:'1',bukti:false},pendidik:{skor:'1',bukti:false},sarpras:{skor:'1',bukti:false},partisipasiAnak:{skor:'1',bukti:false},partisipasiOrtu:{skor:'1',bukti:false}},rencana:{program:'',prioritas:'Tinggi',timeline:''},anggaran:{kegiatan:'',volume:'',hargaSatuan:'',sumberDana:'BOS Reguler'},pemenuhan:{realisasi:'',hambatan:''},evaluator:{penilaian:'Kurang',rekomendasi:'',namaEvaluator:'',institusi:''}}); setHistory([]); } }} className="text-danger flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest hover:underline w-full md:w-auto mb-4 md:mb-0">
            <RefreshCw size={14} /> Reset Seluruh Form
         </button>
         
         <div className="flex flex-wrap gap-4 w-full md:w-auto justify-end">
            <button onClick={() => alert("Data profil pengguna berhasil disimpan.")} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 border-2 border-gray-200 text-gray-900 font-bold text-[11px] uppercase tracking-widest hover:bg-gray-900 hover:text-white transition-colors">
               <Save size={16} /> Simpan Data
            </button>
            <button onClick={() => printElement('printArea', 'Laporan', undefined)} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 border-2 border-gray-200 text-gray-900 font-bold text-[11px] uppercase tracking-widest hover:bg-gray-900 hover:text-white transition-colors">
               <Printer size={16} /> Print
            </button>
            <button onClick={() => alert("Fungsi Save Word sedang dikembangkan.")} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-[#2b579a] text-white font-bold text-[11px] uppercase tracking-widest hover:bg-gray-900 transition-colors shadow-lg shadow-[#2b579a]/20">
               <FileText size={16} /> Save Word
            </button>
            <button onClick={() => alert("Fungsi Save PDF sedang dikembangkan. Gunakan fitur Print.")} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-[#e3242b] text-white font-bold text-[11px] uppercase tracking-widest hover:bg-gray-900 transition-colors shadow-lg shadow-[#e3242b]/20">
               <Download size={16} /> Save PDF
            </button>
         </div>
      </div>
    </div>
  );
}

// --- SIAGA KEPENDUDUKAN (SSK) WIZARD ---
function SskWizard({ jenjang, jenisSekolah }: { jenjang?: string, jenisSekolah?: string }) {
  const [step, setStep] = useState(1);
  const [thinking, setThinking] = useState(false);
  const [history, setHistory] = useState<{ step: number; userSummary: string; aiResponse: string }[]>([]);

  const [formData, setFormData] = useState({
    sekolah: '',
    jenjang: 'SD',
    guru: '',
    siswa: '',
    pemetaan: {
      integrasi: '1',
      pojok: '1',
      fokus: '1',
      keterlibatan: '1',
      manfaat: '1',
      kesadaran: ''
    },
    rencana: {
      rkas: 'Tidak',
      integrasi: [] as string[],
      target: ''
    },
    anggaran: {
      sumber: [] as string[],
      butuh: '',
      tersedia: ''
    },
    pemenuhan: {
      guru: '',
      buku: '',
      duta: '',
      partisipasi: ''
    },
    evaluator: {
      tim: [] as string[],
      frekuensi: 'tidak pernah',
      prepost: 'Tidak'
    }
  });

  const toggleArray = (field: 'integrasi' | 'sumber' | 'tim', val: string, section?: 'rencana' | 'anggaran' | 'evaluator') => {
    setFormData(prev => {
      const targetSection = section ? prev[section] : prev;
      const arr = targetSection[field] as string[];
      const newArr = arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val];
      
      if (section) {
        return { ...prev, [section]: { ...prev[section], [field]: newArr } };
      }
      return { ...prev, [field]: newArr };
    });
  };

  const handleAnalisis = async (currentStep: number) => {
    let userSummary = '';
    let promptDetail = '';

    if (currentStep === 1) {
      if (!formData.sekolah) { alert('Isi Nama Sekolah'); return; }
      userSummary = `Tahap 1: Data Sekolah & Pemetaan Mutu\nSekolah: ${formData.sekolah}\nJenjang: ${formData.jenjang}\nGuru: ${formData.guru}\nSiswa: ${formData.siswa}\nIntegrasi Kurikulum: ${formData.pemetaan.integrasi}\nPojok Kependudukan: ${formData.pemetaan.pojok}\nFokus Materi: ${formData.pemetaan.fokus}\nKeterlibatan: ${formData.pemetaan.keterlibatan}\nManfaat: ${formData.pemetaan.manfaat}\nTujuan utama (kesadaran): ${formData.pemetaan.kesadaran}%`;
      promptDetail = `PROFIL SEKOLAH: Jenjang: ${jenjang || '-'} / ${jenisSekolah || '-'}\n\nPengguna telah mengisi Tahap 1 dengan data:\n${userSummary}\n\nBerikan evaluasi awal. Jangan pakai basa-basi AI. Ajakan ke Tahap 2.`;
    } 
    else if (currentStep === 2) {
      userSummary = `Tahap 2: Penyusunan Rencana\nRKAS Khusus SSK: ${formData.rencana.rkas}\nIntegrasi kegiatan: ${formData.rencana.integrasi.join(', ')}\nTarget peningkatan: ${formData.rencana.target}%`;
      promptDetail = `Pengguna mengisi Tahap 2:\n${userSummary}\n\nBerikan catatan perencanaan. Ajakan ke Tahap 3.`;
    }
    else if (currentStep === 3) {
      userSummary = `Tahap 3: Penyusunan Anggaran\nSumber Dana: ${formData.anggaran.sumber.join(', ')}\nButuh: Rp ${formData.anggaran.butuh}\nTersedia: Rp ${formData.anggaran.tersedia}`;
      promptDetail = `Pengguna mengisi Tahap 3:\n${userSummary}\n\nCek kelayakan finansial. Ajakan ke Tahap 4.`;
    }
    else if (currentStep === 4) {
      userSummary = `Tahap 4: Pemenuhan Mutu\nGuru terintegrasi: ${formData.pemenuhan.guru}%\nJumlah buku: ${formData.pemenuhan.buku}\nDuta SSK: ${formData.pemenuhan.duta}\nPartisipasi Siswa: ${formData.pemenuhan.partisipasi}%`;
      promptDetail = `Pengguna mengisi Tahap 4:\n${userSummary}\n\nBerikan penilaian performa. Ajakan ke Evaluator Akhir.`;
    }
    else if (currentStep === 5) {
      userSummary = `Tahap 5: Evaluator\nTim: ${formData.evaluator.tim.join(', ')}\nFrekuensi: ${formData.evaluator.frekuensi}\nLaporan Pre-Post: ${formData.evaluator.prepost}`;
      promptDetail = `Semua tahap telah diisi. Data Tahap 5:\n${userSummary}\n\nLakukan GAP ANALYSIS untuk 5 komponen mutu SSK. Tampilkan dalam bentuk tabel Markdown dengan kolom: Komponen, Indikator, Kondisi Aktual (ambil dari isian user), Target Standar (buat berdasarkan kriteria ideal SSK), Gap, Rekomendasi (berisi action item untuk tindakan perbaikan). Setiap rekomendasi harus menyertakan pilihan aksi seperti "[ Pilih: Segera / Jadwal / Tidak perlu ]" atau "[ ] sudah dilakukan". Setelah tabel, berikan ringkasan prioritas dalam bentuk checklist yang bisa dicentang oleh user.`;
    }

    setThinking(true);
    try {
      let conversationContents = [];
      for (const h of history) {
        conversationContents.push({ role: 'user', parts: [{ text: h.userSummary }] });
        conversationContents.push({ role: 'model', parts: [{ text: h.aiResponse }] });
      }
      conversationContents.push({ role: 'user', parts: [{ text: promptDetail }] });

      const systemInstruction = `Anda adalah Analis Strategis Data Senior dari Kementerian Pendidikan Dasar, Menengah, dan Tinggi yang mengevaluasi Sekolah Siaga Kependudukan (SSK).
Tugas Anda mendalami validitas pemetaan mutu kependudukan sekolah menggunakan analisis '5 Why' dan 'Fishbone Analysis' (serta Venn Diagram jika ada inkonsistensi).
Identifikasi akar masalah dari ketercapaian indikator SSK dan berikan rekomendasi program yang terintegrasi standar kurikulum dan sarana.
DILARANG memberikan sapaan atau penutup. Hasilkan output audit Markdown murni.`;

      const ai = new GoogleGenAI({});
      const response = await ai.models.generateContent({
        model: 'openai',
        contents: conversationContents,
        config: {
          systemInstruction,
          temperature: 0.2
        }
      });
      const data = { text: response.text };
      
      setHistory(prev => [...prev, {
        step: currentStep,
        userSummary: userSummary,
        aiResponse: data.text || ''
      }]);

      setStep(currentStep + 1);

    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setThinking(false);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-12">
      <div className="bg-white border-l-4 border-[#E76F51] p-8 md:p-10 shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 font-sans font-black  mb-3 flex items-center gap-4 text-gray-900">
          <Building className="text-[#E76F51]" size={32} /> Audit SSK
        </h2>
        <p className="font-sans text-base leading-relaxed max-w-3xl text-gray-700">
          Sistem Evaluasi Program Siaga Kependudukan (SSK). Lengkapi kriteria di bawah ini untuk Audit Gap Analysis Eksekutif.
        </p>
      </div>

      {history.map((h, i) => (
        <div key={i} className="space-y-6">
          <div className="bg-white border border-gray-100 p-6 self-start max-w-2xl border-l-2 border-l-blue-600 shadow-sm relative">
             <div className="text-[10px] tracking-[3px] uppercase font-bold text-gray-500 mb-4 flex items-center gap-2">
               Input Verifikasi - Tahap {h.step}
             </div>
             <pre className="font-mono text-sm whitespace-pre-wrap leading-relaxed text-gray-700">{h.userSummary}</pre>
          </div>
          <div className="bg-blue-50 border-t-2 border-b-2 border-gray-100 p-4 md:p-8 lg:p-14 self-end prose prose-slate max-w-none prose-tables:border prose-tables:border-gray-200 prose-th:bg-white prose-th:text-gray-900 prose-td:border-gray-100 prose-headings:font-sans prose-headings:text-gray-900 prose-a:text-[#E76F51] prose-p:font-sans prose-p:leading-[1.8] prose-p:text-base prose-li:font-sans prose-li:text-base relative print-area w-full">
             <div className="flex items-center justify-between mb-8">
               <div className="text-[11px] tracking-[3px] uppercase font-bold text-[#E76F51] flex items-center gap-3">
                 <BrainCircuit size={18} /> Analisis Mutu Supervisor
               </div>
               <button onClick={() => printElement('printArea', 'Laporan', undefined)} className="no-print flex items-center gap-2 text-gray-900 hover:text-[#E76F51] transition-colors text-sm font-medium border border-gray-200 px-3 py-1.5 bg-white shadow-sm">
                  <Printer size={14} /> Cetak Laporan
               </button>
             </div>
             <div className="markdown-body"><ReactMarkdown>{h.aiResponse}</ReactMarkdown></div>
          </div>
        </div>
      ))}

      {thinking && (
        <div className="p-16 flex flex-col items-center justify-center text-gray-900 bg-white border border-gray-100 shadow-sm animate-pulse">
           <Loader2 className="animate-spin text-[#E76F51] mb-6" size={48} />
           <p className="font-sans  text-base text-gray-600">Menganalisis matriks evaluasi SSK...</p>
        </div>
      )}

      {!thinking && step <= 5 && (
        <div className="bg-white border-t-2 border-gray-200 p-4 md:p-8 lg:p-14 shadow-lg border-l border-r border-b border-gray-100 relative">
           <h3 className="text-[22px] font-bold font-sans mb-10 border-b-2 border-gray-100 pb-4 flex items-center justify-between">
              <span className="text-gray-900">
                {step === 1 && 'Tahap 1: Data Sekolah & Pemetaan Mutu'}
                {step === 2 && 'Tahap 2: Penyusunan Rencana'}
                {step === 3 && 'Tahap 3: Penyusunan Anggaran'}
                {step === 4 && 'Tahap 4: Pemenuhan Mutu'}
                {step === 5 && 'Tahap 5: Evaluator Pemenuhan Mutu'}
              </span>
           </h3>

           {/* STEP 1 */}
           {step === 1 && (
             <div className="space-y-10">
                <div className="grid md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                     <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest block">Nama Sekolah</label>
                     <input type="text" className="w-full p-4 font-sans text-sm border border-gray-200 focus:outline-none focus:border-[#E76F51] bg-white" placeholder="Nomor NPSN / Nama Institusi" value={formData.sekolah} onChange={e => setFormData({...formData, sekolah: e.target.value})} />
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest block">Jenjang</label>
                     <select className="w-full p-4 font-sans text-sm border border-gray-200 focus:outline-none focus:border-[#E76F51] bg-white appearance-none" value={formData.jenjang} onChange={e => setFormData({...formData, jenjang: e.target.value})}>
                       <option value="SD">SD</option>
                       <option value="SMP">SMP</option>
                       <option value="SMA">SMA</option>
                       <option value="SMK">SMK</option>
                     </select>
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest block">Jumlah Guru</label>
                     <input type="number" className="w-full p-4 font-sans text-sm border border-gray-200 focus:outline-none focus:border-[#E76F51] bg-white" placeholder="Contoh: 45" value={formData.guru} onChange={e => setFormData({...formData, guru: e.target.value})} />
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest block">Jumlah Siswa</label>
                     <input type="number" className="w-full p-4 font-sans text-sm border border-gray-200 focus:outline-none focus:border-[#E76F51] bg-white" placeholder="Contoh: 1200" value={formData.siswa} onChange={e => setFormData({...formData, siswa: e.target.value})} />
                   </div>
                </div>

                <div className="space-y-6 pt-6 border-t border-gray-100">
                   <h4 className="font-sans font-black  text-[18px]">1. Integrasi Kurikulum</h4>
                   <select className="w-full p-4 font-sans text-sm border border-gray-200 bg-white" value={formData.pemetaan.integrasi} onChange={e => setFormData({...formData, pemetaan: {...formData.pemetaan, integrasi: e.target.value}})}>
                     <option value="1(Tdk ada)">1 (Tidak ada)</option>
                     <option value="2(1-2 mapel)">2 (1-2 mapel)</option>
                     <option value="3(3 mapel)">3 (3 mapel)</option>
                     <option value="4(4 mapel)">4 (4 mapel)</option>
                   </select>

                   <h4 className="font-sans font-black  text-[18px]">2. Pojok Kependudukan</h4>
                   <select className="w-full p-4 font-sans text-sm border border-gray-200 bg-white" value={formData.pemetaan.pojok} onChange={e => setFormData({...formData, pemetaan: {...formData.pemetaan, pojok: e.target.value}})}>
                     <option value="1(Tdk ada)">1 (Tidak ada)</option>
                     <option value="2(Ada tp <10 buku)">2 (Ada tp &lt;10 buku)</option>
                     <option value="3(Ada 10-20 buku)">3 (Ada 10-20 buku)</option>
                     <option value="4(>20 buku+diskusi)">4 (&gt;20 buku+diskusi)</option>
                   </select>

                   <h4 className="font-sans font-black  text-[18px]">3. Fokus Materi</h4>
                   <select className="w-full p-4 font-sans text-sm border border-gray-200 bg-white" value={formData.pemetaan.fokus} onChange={e => setFormData({...formData, pemetaan: {...formData.pemetaan, fokus: e.target.value}})}>
                     <option value="1(0-1 tema)">1 (0-1 tema)</option>
                     <option value="2(2-3 tema)">2 (2-3 tema)</option>
                     <option value="3(4 tema)">3 (4 tema)</option>
                     <option value="4(5 tema)">4 (5 tema)</option>
                   </select>

                   <h4 className="font-sans font-black  text-[18px]">4. Keterlibatan</h4>
                   <select className="w-full p-4 font-sans text-sm border border-gray-200 bg-white" value={formData.pemetaan.keterlibatan} onChange={e => setFormData({...formData, pemetaan: {...formData.pemetaan, keterlibatan: e.target.value}})}>
                     <option value="1(tdk ada)">1 (Tidak ada)</option>
                     <option value="2(kepsek saja)">2 (Kepsek saja)</option>
                     <option value="3(kepsek+guru)">3 (Kepsek+guru)</option>
                     <option value="4(semua aktif)">4 (Semua aktif)</option>
                   </select>

                   <h4 className="font-sans font-black  text-[18px]">5. Manfaat</h4>
                   <select className="w-full p-4 font-sans text-sm border border-gray-200 bg-white" value={formData.pemetaan.manfaat} onChange={e => setFormData({...formData, pemetaan: {...formData.pemetaan, manfaat: e.target.value}})}>
                     <option value="1(tdk ada)">1 (Tidak ada)</option>
                     <option value="2(ada rencana)">2 (Ada rencana)</option>
                     <option value="3(sudah ukur sekali)">3 (Sudah ukur sekali)</option>
                     <option value="4(monitor rutin)">4 (Monitor rutin)</option>
                   </select>

                   <h4 className="font-sans font-black  text-[18px]">6. Tujuan Utama (Skor Kesadaran Remaja)</h4>
                   <div className="flex gap-4 items-center">
                     <input type="number" className="p-4 font-sans text-sm border border-gray-200 focus:outline-none focus:border-[#E76F51] bg-white w-32" placeholder="45" value={formData.pemetaan.kesadaran} onChange={e => setFormData({...formData, pemetaan: {...formData.pemetaan, kesadaran: e.target.value}})} />
                     <span className="font-bold text-gray-600">%</span>
                   </div>
                </div>
             </div>
           )}

           {/* STEP 2 */}
           {step === 2 && (
             <div className="space-y-10">
                <div className="space-y-4">
                   <label className="text-[12px] font-bold text-gray-900 uppercase tracking-widest block border-l-[3px] border-[#E76F51] pl-3">Apakah sudah ada RKAS khusus SSK?</label>
                   <div className="flex gap-6">
                      <label className="flex items-center gap-3 cursor-pointer group">
                         <input type="radio" className="w-5 h-5 accent-[#E76F51]" name="rkasSsk" checked={formData.rencana.rkas === 'Ya'} onChange={() => setFormData({...formData, rencana: {...formData.rencana, rkas: 'Ya'}})} />
                         <span className="font-sans text-sm group-hover:text-[#E76F51]">Ya</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer group">
                         <input type="radio" className="w-5 h-5 accent-[#E76F51]" name="rkasSsk" checked={formData.rencana.rkas === 'Tidak'} onChange={() => setFormData({...formData, rencana: {...formData.rencana, rkas: 'Tidak'}})} />
                         <span className="font-sans text-sm group-hover:text-[#E76F51]">Tidak</span>
                      </label>
                   </div>
                </div>
                
                <div className="space-y-4">
                   <label className="text-[12px] font-bold text-gray-900 uppercase tracking-widest block border-l-[3px] border-[#E76F51] pl-3">Rencana kegiatan terintegrasi dalam:</label>
                   <div className="grid grid-cols-2 gap-4">
                      {['RPP', 'Program OSIS', 'Ekstrakurikuler', 'Tidak ada'].map(val => (
                         <label key={val} className="flex items-center gap-3 p-4 border border-gray-200 bg-white cursor-pointer hover:border-[#E76F51]">
                            <input type="checkbox" className="w-5 h-5 accent-[#E76F51]" checked={formData.rencana.integrasi.includes(val)} onChange={() => toggleArray('integrasi', val, 'rencana')} />
                            <span className="font-sans text-sm">{val}</span>
                         </label>
                      ))}
                   </div>
                </div>

                <div className="space-y-2">
                   <label className="text-[12px] font-bold text-gray-900 uppercase tracking-widest block border-l-[3px] border-[#E76F51] pl-3">Target peningkatan kesadaran (post-test) %</label>
                   <input type="number" className="w-full p-4 font-sans text-sm border border-gray-200 bg-white" placeholder="Misal: 80" value={formData.rencana.target} onChange={e => setFormData({...formData, rencana: {...formData.rencana, target: e.target.value}})} />
                </div>
             </div>
           )}

           {/* STEP 3 */}
           {step === 3 && (
             <div className="space-y-10">
                <div className="space-y-4">
                   <label className="text-[12px] font-bold text-gray-900 uppercase tracking-widest block border-l-[3px] border-[#E76F51] pl-3">Sumber dana yang tersedia:</label>
                   <div className="grid grid-cols-2 gap-4">
                      {['BOS', 'Komite', 'Donatur', 'Tidak ada'].map(val => (
                         <label key={val} className="flex items-center gap-3 p-4 border border-gray-200 bg-white cursor-pointer hover:border-[#E76F51]">
                            <input type="checkbox" className="w-5 h-5 accent-[#E76F51]" checked={formData.anggaran.sumber.includes(val)} onChange={() => toggleArray('sumber', val, 'anggaran')} />
                            <span className="font-sans text-sm">{val}</span>
                         </label>
                      ))}
                   </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                     <label className="text-[12px] font-bold text-gray-900 uppercase tracking-widest block border-l-[3px] border-[#E76F51] pl-3">Perkiraan total anggaran dibutuhkan (Rp)</label>
                     <input type="number" className="w-full p-4 font-sans text-sm border border-gray-200 bg-white" placeholder="Misal: 5000000" value={formData.anggaran.butuh} onChange={e => setFormData({...formData, anggaran: {...formData.anggaran, butuh: e.target.value}})} />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[12px] font-bold text-gray-900 uppercase tracking-widest block border-l-[3px] border-[#E76F51] pl-3">Anggaran tersedia saat ini (Rp)</label>
                     <input type="number" className="w-full p-4 font-sans text-sm border border-gray-200 bg-white" placeholder="Misal: 2000000" value={formData.anggaran.tersedia} onChange={e => setFormData({...formData, anggaran: {...formData.anggaran, tersedia: e.target.value}})} />
                  </div>
                </div>
             </div>
           )}

           {/* STEP 4 */}
           {step === 4 && (
             <div className="space-y-10">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                     <label className="text-[12px] font-bold text-gray-900 uppercase tracking-widest block border-l-[3px] border-[#E76F51] pl-3">% guru yang sudah integrasi materi</label>
                     <input type="number" className="w-full p-4 font-sans text-sm border border-gray-200 bg-white" placeholder="Misal: 45" value={formData.pemenuhan.guru} onChange={e => setFormData({...formData, pemenuhan: {...formData.pemenuhan, guru: e.target.value}})} />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[12px] font-bold text-gray-900 uppercase tracking-widest block border-l-[3px] border-[#E76F51] pl-3">Jumlah buku di pojok</label>
                     <input type="number" className="w-full p-4 font-sans text-sm border border-gray-200 bg-white" placeholder="Misal: 15" value={formData.pemenuhan.buku} onChange={e => setFormData({...formData, pemenuhan: {...formData.pemenuhan, buku: e.target.value}})} />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[12px] font-bold text-gray-900 uppercase tracking-widest block border-l-[3px] border-[#E76F51] pl-3">Jumlah Duta SSK aktif</label>
                     <input type="number" className="w-full p-4 font-sans text-sm border border-gray-200 bg-white" placeholder="Misal: 5" value={formData.pemenuhan.duta} onChange={e => setFormData({...formData, pemenuhan: {...formData.pemenuhan, duta: e.target.value}})} />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[12px] font-bold text-gray-900 uppercase tracking-widest block border-l-[3px] border-[#E76F51] pl-3">% partisipasi siswa dalam kampanye</label>
                     <input type="number" className="w-full p-4 font-sans text-sm border border-gray-200 bg-white" placeholder="Misal: 60" value={formData.pemenuhan.partisipasi} onChange={e => setFormData({...formData, pemenuhan: {...formData.pemenuhan, partisipasi: e.target.value}})} />
                  </div>
                </div>
             </div>
           )}

           {/* STEP 5 */}
           {step === 5 && (
             <div className="space-y-10">
                <div className="space-y-4">
                   <label className="text-[12px] font-bold text-gray-900 uppercase tracking-widest block border-l-[3px] border-[#E76F51] pl-3">Tim evaluator terdiri dari:</label>
                   <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {['Kepsek', 'Pengawas', 'Komite', 'Siswa', 'LSM', 'Tidak ada'].map(val => (
                         <label key={val} className="flex items-center gap-3 p-4 border border-gray-200 bg-white cursor-pointer hover:border-[#E76F51]">
                            <input type="checkbox" className="w-5 h-5 accent-[#E76F51]" checked={formData.evaluator.tim.includes(val)} onChange={() => toggleArray('tim', val, 'evaluator')} />
                            <span className="font-sans text-sm">{val}</span>
                         </label>
                      ))}
                   </div>
                </div>
                
                <div className="space-y-2">
                   <label className="text-[12px] font-bold text-gray-900 uppercase tracking-widest block border-l-[3px] border-[#E76F51] pl-3">Frekuensi evaluasi</label>
                   <select className="w-full p-4 font-sans text-sm border border-gray-200 bg-white appearance-none" value={formData.evaluator.frekuensi} onChange={e => setFormData({...formData, evaluator: {...formData.evaluator, frekuensi: e.target.value}})}>
                     <option value="1x/thn">1x/thn</option>
                     <option value="2x/thn">2x/thn</option>
                     <option value="4x/thn">4x/thn</option>
                     <option value="tidak pernah">tidak pernah</option>
                   </select>
                </div>

                <div className="space-y-4">
                   <label className="text-[12px] font-bold text-gray-900 uppercase tracking-widest block border-l-[3px] border-[#E76F51] pl-3">Apakah ada laporan pre-post test?</label>
                   <div className="flex gap-6">
                      <label className="flex items-center gap-3 cursor-pointer group">
                         <input type="radio" className="w-5 h-5 accent-[#E76F51]" name="prepost" checked={formData.evaluator.prepost === 'Ya'} onChange={() => setFormData({...formData, evaluator: {...formData.evaluator, prepost: 'Ya'}})} />
                         <span className="font-sans text-sm group-hover:text-[#E76F51]">Ya</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer group">
                         <input type="radio" className="w-5 h-5 accent-[#E76F51]" name="prepost" checked={formData.evaluator.prepost === 'Tidak'} onChange={() => setFormData({...formData, evaluator: {...formData.evaluator, prepost: 'Tidak'}})} />
                         <span className="font-sans text-sm group-hover:text-[#E76F51]">Tidak</span>
                      </label>
                   </div>
                </div>
             </div>
           )}

           <div className="mt-12 flex justify-end relative z-10">
              <button 
                 onClick={() => handleAnalisis(step)} 
                 className="bg-gray-900 hover:bg-[#E76F51] text-white font-bold uppercase tracking-[2px] text-[12px] px-10 py-5 transition-colors flex items-center gap-4 shadow-lg shadow-ink/10"
              >
                 {step === 5 ? 'Generate GAP ANALYSIS Akhir' : `Simpan Tahap ${step} & Analisis`} <ChevronRight size={18} />
              </button>
           </div>
         </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 border border-gray-100 shadow-sm relative no-print mt-8">
         <button onClick={() => { if(window.confirm('Reset seluruh formulir?')){ setStep(1); setFormData({sekolah:'',jenjang:'SD',guru:'',siswa:'',pemetaan:{integrasi:'1',pojok:'1',fokus:'1',keterlibatan:'1',manfaat:'1',kesadaran:''},rencana:{rkas:'Tidak',integrasi:[],target:''},anggaran:{sumber:[],butuh:'',tersedia:''},pemenuhan:{guru:'',buku:'',duta:'',partisipasi:''},evaluator:{tim:[],frekuensi:'tidak pernah',prepost:'Tidak'}}); setHistory([]); } }} className="text-danger flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest hover:underline w-full md:w-auto mb-4 md:mb-0">
            <RefreshCw size={14} /> Reset Seluruh Form
         </button>
         
         <div className="flex flex-wrap gap-4 w-full md:w-auto justify-end">
            <button onClick={() => alert("Data profil pengguna berhasil disimpan.")} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 border-2 border-gray-200 text-gray-900 font-bold text-[11px] uppercase tracking-widest hover:bg-gray-900 hover:text-white transition-colors">
               <Save size={16} /> Simpan Data
            </button>
            <button onClick={() => printElement('printArea', 'Laporan', undefined)} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 border-2 border-gray-200 text-gray-900 font-bold text-[11px] uppercase tracking-widest hover:bg-gray-900 hover:text-white transition-colors">
               <Printer size={16} /> Print
            </button>
            <button onClick={() => alert("Fungsi Save Word sedang dikembangkan.")} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-[#2b579a] text-white font-bold text-[11px] uppercase tracking-widest hover:bg-gray-900 transition-colors shadow-lg shadow-[#2b579a]/20">
               <FileText size={16} /> Save Word
            </button>
            <button onClick={() => alert("Fungsi Save PDF sedang dikembangkan. Gunakan fitur Print.")} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-[#e3242b] text-white font-bold text-[11px] uppercase tracking-widest hover:bg-gray-900 transition-colors shadow-lg shadow-[#e3242b]/20">
               <Download size={16} /> Save PDF
            </button>
         </div>
      </div>
    </div>
  );
}

// --- RAPOR PENDIDIKAN WIZARD ---
function RaporWizard({ jenjang, jenisSekolah }: { jenjang?: string, jenisSekolah?: string }) {
  const [step, setStep] = useState(1);
  const [thinking, setThinking] = useState(false);
  const [history, setHistory] = useState<{ step: number; userSummary: string; aiResponse: string }[]>([]);

  const [tableData, setTableData] = useState([
    {
      dimensi: 'A. Mutu dan Relevansi Hasil Belajar Murid',
      indikator: 'Kemampuan Literasi',
      prioritas: true,
      capaian: 55,
      target: 75,
      akar: 'Minim buku bacaan yang relevan di tingkat sekolah dasar.',
      rtl: 'Pengadaan Pojok Baca dan Program 15 Menit Membaca.'
    },
    {
      dimensi: 'C. Kompetensi dan Kinerja GTK',
      indikator: 'Refleksi dan Perbaikan Pembelajaran oleh Guru',
      prioritas: true,
      capaian: 40,
      target: 80,
      akar: 'Kurang pendampingan dan komunitas belajar yang aktif.',
      rtl: 'Pelatihan mandiri di PMM dan optimalisasi Komunitas Belajar (Kombel).'
    },
    {
      dimensi: 'D. Mutu dan Relevansi Pembelajaran',
      indikator: 'Iklim Keamanan Sekolah',
      prioritas: false,
      capaian: 68,
      target: 85,
      akar: 'Kasus perundungan verbal masih terjadi di luar pantauan guru.',
      rtl: 'Pembentukan Satgas Anti-Perundungan dan Program Duta Sahabat.'
    }
  ]);

  const [formData, setFormData] = useState({
    dimensi: 'A. Mutu dan Relevansi Hasil Belajar Murid',
    indikator: 'Kemampuan Literasi',
    prioritas: false,
    capaian: '',
    target: '',
    akar: '',
    rtl: ''
  });

  const indikatorMap: Record<string, string[]> = {
    'A. Mutu dan Relevansi Hasil Belajar Murid': ['Kemampuan Literasi', 'Kemampuan Numerasi', 'Karakter Murid'],
    'B. Pemerataan Pendidikan yang Bermutu': ['Pemerataan Akses', 'Kesenjangan Hasil Belajar Gender', 'Kesenjangan Sosial Ekonomi'],
    'C. Kompetensi dan Kinerja GTK': ['Kompetensi GTK', 'Refleksi dan Perbaikan Pembelajaran oleh Guru', 'Kepemimpinan Instruksional'],
    'D. Mutu dan Relevansi Pembelajaran': ['Iklim Keamanan Sekolah', 'Iklim Kebinekaan', 'Iklim Inklusivitas', 'Kualitas Pembelajaran'],
    'E. Pengelolaan Sekolah yang Partisipatif, Transparan, dan Akuntabel': ['Partisipasi Warga Sekolah', 'Pemanfaatan Sumber Daya', 'Perencanaan Berbasis Data']
  };

  const availableIndikators = indikatorMap[formData.dimensi] || [];

  const handleDimensiChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDimensi = e.target.value;
    const newIndikators = indikatorMap[newDimensi] || [];
    setFormData(prev => ({
      ...prev,
      dimensi: newDimensi,
      indikator: newIndikators[0] || ''
    }));
  };

  const handleAddRow = () => {
    if (!formData.capaian || !formData.target || !formData.akar || !formData.rtl) {
      alert("Harap lengkapi form isian (Capaian, Target, Akar Masalah, Rencana Tindak Lanjut).");
      return;
    }
    setTableData(prev => [...prev, {
      dimensi: formData.dimensi,
      indikator: formData.indikator,
      prioritas: formData.prioritas,
      capaian: Number(formData.capaian),
      target: Number(formData.target),
      akar: formData.akar,
      rtl: formData.rtl
    }]);
    
    setFormData(prev => ({ ...prev, capaian: '', target: '', akar: '', rtl: '', prioritas: false }));
  };

  const getRowColor = (capaian: number) => {
    if (capaian < 60) return 'bg-[#E63946]/10 border-l-2 border-[#E63946]';
    if (capaian <= 79) return 'bg-[#D4AF37]/10 border-l-2 border-[#D4AF37]';
    return 'bg-[#2A9D8F]/10 border-l-2 border-[#2A9D8F]';
  };
  
  const getExecutiveSummary = () => {
    let merah = 0, kuning = 0, hijau = 0;
    tableData.forEach(r => {
      if (r.capaian < 60) merah++;
      else if (r.capaian <= 79) kuning++;
      else hijau++;
    });
    return { merah, kuning, hijau };
  };
  const sum = getExecutiveSummary();

  const handleAnalisis = async () => {
    if (tableData.length === 0) {
      alert("Tabel masih kosong. Tambahkan minimal satu indikator.");
      return;
    }
    
    // Collect data to send to AI
    const summaryText = tableData.map((r, i) => 
      `${i+1}. [${r.dimensi}] ${r.indikator}\n   Capaian: ${r.capaian}% (Target: ${r.target}%, Gap: ${r.capaian - r.target}%)\n   Prioritas: ${r.prioritas ? 'YA' : 'TIDAK'}\n   Akar Masalah: ${r.akar}\n   RTL: ${r.rtl}`
    ).join('\n\n');

    let userSummary = `Pengguna telah menyusun ${tableData.length} baris matriks Kesenjangan Mutu Rapor Pendidikan:\n(Merah/Kurang: ${sum.merah}, Kuning/Sedang: ${sum.kuning}, Hijau/Baik: ${sum.hijau})\n\nDetail:\n${summaryText}`;
    
    let promptDetail = `PROFIL SEKOLAH:\nJenjang: ${jenjang || '-'}\nJenis Sekolah: ${jenisSekolah || '-'}\n\n${userSummary}

INSTRUKSI:
Anda bertindak sebagai analis strategis data kementerian pendidikan. Evaluasi pemetaan mutu sekolah ini dengan fokus pada validitas dan kedalaman data.
Gunakan analisis '5 Why' dan 'Fishbone Analysis' untuk mengidentifikasi akar masalah sebenarnya dari indikator yang rendah.
Pastikan penggunaan data objektif (Rapor Pendidikan, profil sekolah) menjadi basis utama. 

Gunakan standar instrumen 8 dimensi Rapor Pendidikan berikut (jika datanya bersinggungan):
1. Kemampuan Literasi Murid (Baik: >70%, Sedang: 40-70%, Kurang: <40%). Tanggapan Masyarakat: Membiasakan membaca bersama diselingi diskusi analitis/kritis.
2. Kemampuan Numerasi Murid (Baik: >70%, Sedang: 40-70%, Kurang: <40%). Tanggapan Masyarakat: Mengajak anak menggunakan prinsip matematika dalam masalah sehari-hari.
3. Karakter Murid (Baik: Konsisten Pancasila, Sedang: Menyadari, Kurang: Sebagian kecil). Tanggapan Masyarakat: Mengajarkan perilaku nilai Pancasila di rumah/sekolah/masyarakat.
4. Kualitas Pembelajaran (Baik: Kondusif & dukungan optimal, Sedang: Mulai kondusif, Kurang: Belum). Tanggapan Masyarakat: Mendorong penerapan komunikasi dua arah guru-murid.
5. Iklim Keamanan Sekolah (Baik: Aman/Nyaman, Sedang: Mulai mapan, Kurang: Belum). Tanggapan Masyarakat: Menguatkan pencegahan kekerasan, anti perundungan.
6. Iklim Kebinekaan Sekolah (Baik: Toleran tinggi, Sedang: Mulai, Kurang: Berisiko). Tanggapan Masyarakat: Memberi kesempatan anak berinteraksi positif dengan ragam budaya.
7. Iklim Inklusivitas Sekolah (Baik: CIBI/Disabilitas difasilitasi, Sedang: Mulai, Kurang: Belum). Tanggapan Masyarakat: Meningkatkan pemahaman terkait kebutuhan khusus anak/CIBI.
8. Kemitraan Orang Tua/Wali (Baik: Komunikasi 2 arah berkala, Sedang: Belum jadi mitra, Kurang: Tidak ada). Tanggapan Masyarakat: Kolaborasi kesinambungan belajar rumah & sekolah.

WAJIB hasilkan analisis komparatif per Dimensi yang diinputkan pengguna dengan evaluasi mendalam akar masalah, menggunakan struktur:
**Dimensi: [Nama Dimensi]**
- **Kategori Capaian:** [Baik/Sedang/Kurang]
- **Tanggapan Analis (Root Cause Analysis - 5 Why/Fishbone):** [Analisis strategis & solusi akar masalah]
- **Tanggapan Sebagai Masyarakat:** [Aksi masyarakat sesuai standar dimensi Rapor]
- **Tanggapan Pemangku Kepentingan:** [Kebijakan/Evaluasi sistemik]

Kemudian, tabelkan Ringkasan Prioritas (Dimensi | Capaian | Rekomendasi Program Terintegrasi). DILARANG KERAS MENGGUNAKAN BASA-BASI AI.`;

    setThinking(true);
    try {
      const systemInstruction = `Anda adalah Analis Strategis Data Senior Kementerian Pendidikan (SD-PT).
Tugas Anda mengevaluasi Rapor Pendidikan dengan fokus pada validitas dan kedalaman data.
WAJIB gunakan analisis '5 Why' dan 'Fishbone' (dan 'Venn Diagram' jika ada inkonsistensi data) untuk mengidentifikasi akar masalah.
Berikan rekomendasi yang memastikan keterkaitan kuat antara masalah teridentifikasi dan program intervensi lintas standar.
DILARANG KERAS menyapa, memberikan pendahuluan, dan dilarang menggunakan basa-basi penutup. 
Output Anda HARUS 100% MURNI berupa analisis audit (Markdown) tanpa paragraf pengantar AI.`;

      const ai = new GoogleGenAI({});
      const response = await ai.models.generateContent({
        model: 'openai',
        contents: [{ role: 'user', parts: [{ text: promptDetail }] }],
        config: {
          systemInstruction,
          temperature: 0.2
        }
      });
      const data = { text: response.text };

      setHistory([{
        step: 2,
        userSummary: "Matriks Evaluasi Rapor Pendidikan telah diserahkan.",
        aiResponse: data.text || ''
      }]);

      setStep(2);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setThinking(false);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-12">
      <div className="bg-white border-l-4 border-[#457B9D] p-8 md:p-10 shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 font-sans font-black  mb-3 flex items-center gap-4 text-gray-900">
          <FileBarChart className="text-[#457B9D]" size={32} /> Audit Rapor Pendidikan
        </h2>
        <p className="font-sans text-base leading-relaxed max-w-3xl text-gray-700">
          Sistem Evaluasi Rapor Pendidikan. Lengkapi kriteria di bawah ini untuk Audit Gap Analysis Eksekutif.
        </p>
      </div>

      {step === 1 && (
        <div className="bg-white border-t-2 border-gray-200 p-4 md:p-8 lg:p-14 shadow-lg border-l border-r border-b border-gray-100 relative">
           
           <h3 className="text-[22px] font-bold font-sans mb-6 border-b-2 border-gray-100 pb-4">
             1. Ringkasan Eksekutif (Otomatis)
           </h3>
           <div className="flex gap-6 mb-12">
              <div className="flex-1 bg-[#E63946]/10 p-6 border border-[#E63946]/20 flex flex-col items-center justify-center">
                 <span className="text-4xl font-black text-[#E63946]">{sum.merah}</span>
                 <span className="text-[10px] font-bold uppercase tracking-widest text-[#E63946] mt-2">Kurang (&lt;60%)</span>
              </div>
              <div className="flex-1 bg-[#D4AF37]/10 p-6 border border-[#D4AF37]/20 flex flex-col items-center justify-center">
                 <span className="text-4xl font-black text-[#D4AF37]">{sum.kuning}</span>
                 <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] mt-2">Sedang (60-79%)</span>
              </div>
              <div className="flex-1 bg-[#2A9D8F]/10 p-6 border border-[#2A9D8F]/20 flex flex-col items-center justify-center">
                 <span className="text-4xl font-black text-[#2A9D8F]">{sum.hijau}</span>
                 <span className="text-[10px] font-bold uppercase tracking-widest text-[#2A9D8F] mt-2">Baik (&ge;80%)</span>
              </div>
           </div>

           <h3 className="text-[22px] font-bold font-sans mb-6 border-b-2 border-gray-100 pb-4">
             2. Form Analisis Kesenjangan Mutu
           </h3>
           <div className="grid md:grid-cols-2 gap-6 bg-white p-8 border border-gray-100 mb-12">
              <div className="space-y-4 md:col-span-2">
                 <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest block">Dimensi Rapor Pendidikan</label>
                 <select className="w-full p-4 font-sans text-sm border border-gray-200 focus:outline-none focus:border-[#457B9D] bg-white" value={formData.dimensi} onChange={handleDimensiChange}>
                    {Object.keys(indikatorMap).map(dim => <option key={dim} value={dim}>{dim}</option>)}
                 </select>
              </div>
              <div className="space-y-4 md:col-span-2">
                 <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest block">Indikator Spesifik</label>
                 <select className="w-full p-4 font-sans text-sm border border-gray-200 focus:outline-none focus:border-[#457B9D] bg-white" value={formData.indikator} onChange={e => setFormData({...formData, indikator: e.target.value})}>
                    {availableIndikators.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                 </select>
              </div>
              <div className="space-y-4">
                 <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest block">Skor Capaian Saat Ini (%)</label>
                 <input type="number" className="w-full p-4 font-sans text-sm border border-gray-200 focus:outline-none focus:border-[#457B9D] bg-white" placeholder="Contoh: 55" value={formData.capaian} onChange={e => setFormData({...formData, capaian: e.target.value})} />
              </div>
              <div className="space-y-4">
                 <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest block">Target Capaian (%)</label>
                 <input type="number" className="w-full p-4 font-sans text-sm border border-gray-200 focus:outline-none focus:border-[#457B9D] bg-white" placeholder="Contoh: 75" value={formData.target} onChange={e => setFormData({...formData, target: e.target.value})} />
              </div>
              <div className="space-y-4 md:col-span-2">
                 <label className="flex items-center gap-3 cursor-pointer group p-4 border border-gray-200 bg-white hover:border-[#E63946]">
                    <input type="checkbox" className="w-5 h-5 accent-[#E63946]" checked={formData.prioritas} onChange={e => setFormData({...formData, prioritas: e.target.checked})} />
                    <span className="font-sans text-sm font-bold group-hover:text-[#E63946]">Tandai sebagai Indikator Prioritas (Berdampak Langsung)</span>
                 </label>
              </div>
              <div className="space-y-4">
                 <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest block">Akar Masalah / Temuan Lapangan</label>
                 <textarea className="w-full h-24 p-4 font-sans text-sm border border-gray-200 focus:outline-none focus:border-[#457B9D] bg-white resize-none" placeholder="Tuliskan analisis akar masalah..." value={formData.akar} onChange={e => setFormData({...formData, akar: e.target.value})} />
              </div>
              <div className="space-y-4">
                 <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest block">Rencana Intervensi / Tindak Lanjut</label>
                 <textarea className="w-full h-24 p-4 font-sans text-sm border border-gray-200 focus:outline-none focus:border-[#457B9D] bg-white resize-none" placeholder="Tuliskan rencana perbaikan..." value={formData.rtl} onChange={e => setFormData({...formData, rtl: e.target.value})} />
              </div>
              <div className="md:col-span-2 flex justify-end mt-4">
                 <button onClick={handleAddRow} className="bg-gray-900 text-white px-8 py-4 font-bold uppercase tracking-widest text-[11px] hover:bg-[#457B9D] transition-colors">
                    + Tambah ke Tabel Analisis
                 </button>
              </div>
           </div>

           <h3 className="text-[22px] font-bold font-sans mb-6 border-b-2 border-gray-100 pb-4">
             3. Matriks Data Rapor Pendidikan
           </h3>
           <div className="overflow-x-auto w-full mb-12">
              <table className="w-full text-left border-collapse border border-gray-100">
                 <thead>
                    <tr className="bg-gray-900 text-white">
                       <th className="p-4 text-sm font-medium border border-gray-200">Dimensi & Indikator</th>
                       <th className="p-4 text-sm font-medium border border-gray-200 text-center w-24">Prioritas</th>
                       <th className="p-4 text-sm font-medium border border-gray-200 text-center w-32">Capaian vs Target</th>
                       <th className="p-4 text-sm font-medium border border-gray-200 text-center w-20">Gap</th>
                       <th className="p-4 text-sm font-medium border border-gray-200 w-1/4">Akar Masalah</th>
                       <th className="p-4 text-sm font-medium border border-gray-200 w-1/4">Tindak Lanjut</th>
                    </tr>
                 </thead>
                 <tbody>
                    {tableData.length === 0 ? (
                      <tr><td colSpan={6} className="p-8 text-center text-gray-500 font-sans  border border-gray-100">Data masih kosong, silakan tambah melalui form di atas.</td></tr>
                    ) : tableData.map((row, idx) => {
                       const gap = row.capaian - row.target;
                       return (
                         <tr key={idx} className={`${getRowColor(row.capaian)} border-b border-gray-100`}>
                            <td className="p-4 align-top border border-gray-100">
                              <div className="font-bold text-[12px] mb-1">{row.dimensi}</div>
                              <div className="text-sm font-sans">{row.indikator}</div>
                            </td>
                            <td className="p-4 align-top border border-gray-100 text-center">
                              {row.prioritas ? <span className="inline-block px-2 py-1 bg-[#E63946] text-white text-[10px] font-bold uppercase tracking-widest rounded-sm">Prioritas</span> : '-'}
                            </td>
                            <td className="p-4 align-top border border-gray-100 text-center">
                              <div className="font-black text-[18px]">{row.capaian}%</div>
                              <div className="text-[10px] opacity-70 uppercase font-bold tracking-widest mt-1">Target: {row.target}%</div>
                            </td>
                            <td className="p-4 align-top border border-gray-100 text-center font-bold text-base">
                              {gap > 0 ? `+${gap}%` : `${gap}%`}
                            </td>
                            <td className="p-4 align-top border border-gray-100 text-sm font-sans leading-relaxed opacity-90">{row.akar}</td>
                            <td className="p-4 align-top border border-gray-100 text-sm font-sans leading-relaxed opacity-90">{row.rtl}</td>
                         </tr>
                       )
                    })}
                 </tbody>
              </table>
           </div>

           {thinking ? (
             <div className="flex flex-col items-center justify-center py-10 opacity-70">
                <Loader2 className="animate-spin text-[#457B9D] mb-4" size={32} />
                <p className="font-sans  text-sm text-gray-900">Menyusun Gap Analysis Editorial...</p>
             </div>
           ) : (
             <div className="mt-8 flex justify-end relative z-10">
                <button 
                   onClick={handleAnalisis} 
                   className="bg-[#457B9D] hover:bg-gray-900 text-white font-bold uppercase tracking-[2px] text-[12px] px-10 py-5 transition-colors flex items-center gap-4 shadow-lg shadow-[#457B9D]/20"
                >
                   Kunci Data & Eksekusi Gap Analysis <ChevronRight size={18} />
                </button>
             </div>
           )}
        </div>
      )}

      {/* STEP 2 - RESULTS */}
      {step === 2 && history.map((h, i) => (
        <div key={i} className="bg-blue-50 border-t-2 border-[#457B9D] p-4 md:p-8 lg:p-14 prose prose-slate max-w-none prose-tables:border prose-tables:border-gray-200 prose-th:bg-white prose-th:text-gray-900 prose-td:border-gray-100 prose-headings:font-sans prose-headings:text-gray-900 prose-a:text-[#457B9D] prose-p:font-sans prose-p:leading-[1.8] prose-p:text-base prose-li:font-sans prose-li:text-base relative print-area w-full border border-gray-100 shadow-lg">
           <div className="flex items-center justify-between mb-10 border-b border-gray-100 pb-6">
             <div className="text-[12px] tracking-[3px] uppercase font-bold text-[#457B9D] flex items-center gap-3">
               <BrainCircuit size={20} /> Laporan Audit Rapor Pendidikan
             </div>
             <button onClick={() => printElement('printArea', 'Laporan', undefined)} className="no-print flex items-center gap-2 text-gray-900 hover:text-[#457B9D] transition-colors text-sm font-medium border border-gray-200 px-4 py-2 bg-white shadow-sm">
                <Printer size={16} /> Cetak Laporan
             </button>
           </div>
           
           <div className="markdown-body mb-12"><ReactMarkdown>{h.aiResponse}</ReactMarkdown></div>

           <div className="no-print pt-8 border-t border-gray-100 flex justify-between items-center">
              <button 
                 onClick={() => { setStep(1); setHistory([]); }} 
                 className="text-gray-500 hover:text-gray-900 font-bold uppercase tracking-widest text-[11px] transition-colors border border-gray-200 px-6 py-3 bg-white"
              >
                 &larr; Kembali ke Tabel Data
              </button>
           </div>
        </div>
      ))}

      {/* Action Buttons */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 border border-gray-100 shadow-sm relative no-print mt-8">
         <button onClick={() => { if(window.confirm('Hapus seluruh tabel data?')){ setTableData([]); setStep(1); setHistory([]); } }} className="text-danger flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest hover:underline w-full md:w-auto mb-4 md:mb-0">
            <RefreshCw size={14} /> Reset Seluruh Data
         </button>
         
         <div className="flex flex-wrap gap-4 w-full md:w-auto justify-end">
            <button onClick={() => alert("Data profil pengguna berhasil disimpan.")} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 border-2 border-gray-200 text-gray-900 font-bold text-[11px] uppercase tracking-widest hover:bg-gray-900 hover:text-white transition-colors">
               <Save size={16} /> Simpan Data
            </button>
            <button onClick={() => printElement('printArea', 'Laporan', undefined)} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 border-2 border-gray-200 text-gray-900 font-bold text-[11px] uppercase tracking-widest hover:bg-gray-900 hover:text-white transition-colors">
               <Printer size={16} /> Print
            </button>
            <button onClick={() => alert("Fungsi Save Word sedang dikembangkan.")} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-[#2b579a] text-white font-bold text-[11px] uppercase tracking-widest hover:bg-gray-900 transition-colors shadow-lg shadow-[#2b579a]/20">
               <FileText size={16} /> Save Word
            </button>
            <button onClick={() => alert("Fungsi Save PDF sedang dikembangkan. Gunakan fitur Print.")} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-[#e3242b] text-white font-bold text-[11px] uppercase tracking-widest hover:bg-gray-900 transition-colors shadow-lg shadow-[#e3242b]/20">
               <Download size={16} /> Save PDF
            </button>
         </div>
      </div>
    </div>
  );
}

// --- ISO 9001:2015 WIZARD ---
function IsoWizard({ jenjang, jenisSekolah }: { jenjang?: string, jenisSekolah?: string }) {
  const [step, setStep] = useState(1);
  const [thinking, setThinking] = useState(false);
  const [history, setHistory] = useState<{ step: number; userSummary: string; aiResponse: string }[]>([]);

  const [formData, setFormData] = useState({
    sec1: { tingkat: '', tim: false, pelatihan: false, jumlahStaf: '' },
    sec2: { klausul: '', kondisi: '', kesenjangan: '', rekomendasi: '' },
    sec3: { kebijakan: false, sasaran: false, sopAkademik: false, sopAdmin: false, jumlahSOP: '', status: '' },
    sec4: { sopPembelajaran: false, sopAdmin: false, monitoring: false, persentase: '' },
    sec5: { unit: '', temuan: '', status: '', korektif: '' },
    sec6: { lembaga: '', audit: false, sertifikat: false, surveillance: false, nomor: '' },
    sec7: { kegiatan: '', estimasi: '', sumber: '', keterangan: '' },
    sec8: { aspek: '', target: '', capaian: '', status: '' }
  });

  const handleAnalisis = async () => {
    // Generate prompt text
    let userSummary = `DATA IMPLEMENTASI ISO 9001:2015 SEKOLAH DASAR
    
1. Komitmen Manajemen & Pelatihan:
- Tingkat Komitmen: ${formData.sec1.tingkat}
- Tim ISO Terbentuk: ${formData.sec1.tim ? 'Ya' : 'Tidak'}
- Pelatihan ISO: ${formData.sec1.pelatihan ? 'Ya' : 'Tidak'}
- Jumlah Staf Terlatih: ${formData.sec1.jumlahStaf}

2. Analisis Kesenjangan (Gap Analysis):
- Klausul: ${formData.sec2.klausul}
- Kondisi Saat Ini: ${formData.sec2.kondisi}
- Kesenjangan: ${formData.sec2.kesenjangan}
- Rekomendasi: ${formData.sec2.rekomendasi}

3. Dokumentasi & SOP:
- Kebijakan Mutu: ${formData.sec3.kebijakan ? 'Tersedia' : 'Belum'}
- Sasaran Mutu: ${formData.sec3.sasaran ? 'Ditetapkan' : 'Belum'}
- SOP Akademik: ${formData.sec3.sopAkademik ? 'Disusun' : 'Belum'}
- SOP Administrasi: ${formData.sec3.sopAdmin ? 'Disusun' : 'Belum'}
- Jumlah SOP: ${formData.sec3.jumlahSOP}
- Status Dokumentasi: ${formData.sec3.status}

4. Implementasi Sistem:
- SOP Pembelajaran Dijalankan: ${formData.sec4.sopPembelajaran ? 'Ya' : 'Tidak'}
- SOP Administrasi Dijalankan: ${formData.sec4.sopAdmin ? 'Ya' : 'Tidak'}
- Monitoring Harian: ${formData.sec4.monitoring ? 'Ya' : 'Tidak'}
- Persentase SOP Dijalankan: ${formData.sec4.persentase}%

5. Audit Internal:
- Unit Diaudit: ${formData.sec5.unit}
- Temuan Audit: ${formData.sec5.temuan}
- Status Temuan: ${formData.sec5.status}
- Tindakan Korektif: ${formData.sec5.korektif}

6. Audit Eksternal (Badan Sertifikasi):
- Lembaga: ${formData.sec6.lembaga}
- Audit Sertifikasi: ${formData.sec6.audit ? 'Dilakukan' : 'Belum'}
- Sertifikat Diterbitkan: ${formData.sec6.sertifikat ? 'Ya' : 'Tidak'}
- Surveillance Audit: ${formData.sec6.surveillance ? 'Dilakukan' : 'Belum'}
- Nomor Sertifikat: ${formData.sec6.nomor}

7. Rencana Anggaran:
- Kegiatan: ${formData.sec7.kegiatan}
- Estimasi Biaya: Rp ${formData.sec7.estimasi}
- Sumber Dana: ${formData.sec7.sumber}
- Keterangan: ${formData.sec7.keterangan}

8. Evaluasi Pemenuhan Mutu:
- Aspek Evaluasi: ${formData.sec8.aspek}
- Target: ${formData.sec8.target}%
- Capaian: ${formData.sec8.capaian}%
- Status: ${formData.sec8.status}`;

    let promptDetail = `PROFIL SEKOLAH:\nJenjang: ${jenjang || '-'}\nJenis Sekolah: ${jenisSekolah || '-'}\n\n${userSummary}\n\nLakukan analisis kesenjangan mutu (Gap Analysis) ISO 9001:2015. Berikan tabel evaluasi markdown struktural yang sangat tajam tanpa basa-basi. Soroti setiap matriks pengisian. Jangan memberikan sapaan atau penutup.`;

    setThinking(true);
    try {
      const systemInstruction = `Anda adalah Auditor ISO 9001:2015 Senior dan Analis Strategis Data Kementerian Pendidikan.
Tugas Anda mengevaluasi Pemetaan Mutu Sekolah berbasis QMS dengan validitas data tinggi.
WAJIB gunakan analisis '5 Why' dan 'Fishbone Analysis' untuk mengurai temuan audit atau gap sistemik.
Berikan rekomendasi perbaikan yang mengintegrasikan standar ISO dengan standar nasional pendidikan secara kohesif.
DILARANG memberikan sapaan atau penutup.`;

      const ai = new GoogleGenAI({});
      const response = await ai.models.generateContent({
        model: 'openai',
        contents: [{ role: 'user', parts: [{ text: promptDetail }] }],
        config: {
          systemInstruction,
          temperature: 0.2
        }
      });
      const data = { text: response.text };

      setHistory([{
        step: 2,
        userSummary: "Formulir 8 Modul ISO 9001:2015 telah diserahkan.",
        aiResponse: data.text || ''
      }]);

      setStep(2);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setThinking(false);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-12">
      <div className="bg-white border-l-4 border-gray-200 p-8 md:p-10 shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 font-sans font-black  mb-3 flex items-center gap-4 text-gray-900">
          <CheckCircle2 className="text-gray-900" size={32} /> Implementasi ISO 9001:2015
        </h2>
        <p className="font-sans text-base leading-relaxed max-w-3xl text-gray-700">
          Sistem Evaluasi Modul Mutu Manajemen Sekolah (QMS). Lengkapi kriteria di bawah ini untuk Audit Gap Analysis Eksekutif.
        </p>
      </div>

      {step === 1 && (
        <div className="bg-white border-t-2 border-gray-200 p-4 md:p-8 lg:p-14 shadow-lg border-l border-r border-b border-gray-100 space-y-10 relative">
          
          {/* SECTION 1 */}
          <div>
            <h3 className="text-[18px] font-bold font-sans mb-6 border-b-2 border-gray-100 pb-4 text-gray-900">1. Komitmen Manajemen & Pelatihan</h3>
            <div className="grid md:grid-cols-2 gap-6 bg-blue-100/20 p-8 border border-gray-100">
              <div className="space-y-4">
                 <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest block">Tingkat Komitmen Manajemen</label>
                 <select className="w-full p-4 font-sans text-sm border border-gray-200 focus:outline-none focus:border-gray-200 bg-white" value={formData.sec1.tingkat} onChange={e => setFormData(prev => ({...prev, sec1: {...prev.sec1, tingkat: e.target.value}}))}>
                    <option value="">-- Pilih --</option>
                    <option value="Rendah">Rendah</option>
                    <option value="Sedang">Sedang</option>
                    <option value="Tinggi">Tinggi</option>
                 </select>
              </div>
              <div className="space-y-4">
                 <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest block">Jumlah Staf Mengikuti Pelatihan</label>
                 <input type="number" className="w-full p-4 font-sans text-sm border border-gray-200 focus:outline-none focus:border-gray-200 bg-white" placeholder="Misal: 12" value={formData.sec1.jumlahStaf} onChange={e => setFormData(prev => ({...prev, sec1: {...prev.sec1, jumlahStaf: e.target.value}}))} />
              </div>
              <div className="space-y-4 md:col-span-2">
                 <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" className="w-5 h-5 accent-ink" checked={formData.sec1.tim} onChange={e => setFormData(prev => ({...prev, sec1: {...prev.sec1, tim: e.target.checked}}))} />
                    <span className="font-sans text-sm font-bold opacity-80 group-hover:opacity-100">Tim ISO terbentuk</span>
                 </label>
                 <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" className="w-5 h-5 accent-ink" checked={formData.sec1.pelatihan} onChange={e => setFormData(prev => ({...prev, sec1: {...prev.sec1, pelatihan: e.target.checked}}))} />
                    <span className="font-sans text-sm font-bold opacity-80 group-hover:opacity-100">Pelatihan ISO dilakukan</span>
                 </label>
              </div>
            </div>
          </div>

          {/* SECTION 2 */}
          <div>
            <h3 className="text-[18px] font-bold font-sans mb-6 border-b-2 border-gray-100 pb-4 text-gray-900">2. Analisis Kesenjangan (Gap Analysis)</h3>
            <div className="grid md:grid-cols-2 gap-6 bg-blue-100/20 p-8 border border-gray-100">
              <div className="space-y-4 md:col-span-2">
                 <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest block">Klausul ISO yang Dievaluasi</label>
                 <select className="w-full p-4 font-sans text-sm border border-gray-200 focus:outline-none focus:border-gray-200 bg-white" value={formData.sec2.klausul} onChange={e => setFormData(prev => ({...prev, sec2: {...prev.sec2, klausul: e.target.value}}))}>
                    <option value="">-- Pilih --</option>
                    <option value="7.1 Sumber Daya">7.1 Sumber Daya</option>
                    <option value="8.2 Kepuasan Pelanggan">8.2 Kepuasan Pelanggan</option>
                    <option value="9.1 Evaluasi Kinerja">9.1 Evaluasi Kinerja</option>
                 </select>
              </div>
              <div className="space-y-4 md:col-span-2">
                 <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest block">Kondisi Sekolah Saat Ini</label>
                 <textarea className="w-full h-16 p-4 font-sans text-sm border border-gray-200 bg-white" value={formData.sec2.kondisi} onChange={e => setFormData(prev => ({...prev, sec2: {...prev.sec2, kondisi: e.target.value}}))} />
              </div>
              <div className="space-y-4 md:col-span-2">
                 <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest block">Kesenjangan yang Ditemukan</label>
                 <textarea className="w-full h-16 p-4 font-sans text-sm border border-gray-200 bg-white" value={formData.sec2.kesenjangan} onChange={e => setFormData(prev => ({...prev, sec2: {...prev.sec2, kesenjangan: e.target.value}}))} />
              </div>
              <div className="space-y-4 md:col-span-2">
                 <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest block">Rekomendasi Perbaikan</label>
                 <textarea className="w-full h-16 p-4 font-sans text-sm border border-gray-200 bg-white" value={formData.sec2.rekomendasi} onChange={e => setFormData(prev => ({...prev, sec2: {...prev.sec2, rekomendasi: e.target.value}}))} />
              </div>
            </div>
          </div>

          {/* SECTION 3 */}
          <div>
            <h3 className="text-[18px] font-bold font-sans mb-6 border-b-2 border-gray-100 pb-4 text-gray-900">3. Dokumentasi & SOP</h3>
            <div className="grid md:grid-cols-2 gap-6 bg-blue-100/20 p-8 border border-gray-100">
              <div className="space-y-4">
                 <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" className="w-5 h-5 accent-ink" checked={formData.sec3.kebijakan} onChange={e => setFormData(prev => ({...prev, sec3: {...prev.sec3, kebijakan: e.target.checked}}))} />
                    <span className="font-sans text-sm font-bold opacity-80 group-hover:opacity-100">Kebijakan Mutu tersedia</span>
                 </label>
                 <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" className="w-5 h-5 accent-ink" checked={formData.sec3.sasaran} onChange={e => setFormData(prev => ({...prev, sec3: {...prev.sec3, sasaran: e.target.checked}}))} />
                    <span className="font-sans text-sm font-bold opacity-80 group-hover:opacity-100">Sasaran Mutu ditetapkan</span>
                 </label>
                 <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" className="w-5 h-5 accent-ink" checked={formData.sec3.sopAkademik} onChange={e => setFormData(prev => ({...prev, sec3: {...prev.sec3, sopAkademik: e.target.checked}}))} />
                    <span className="font-sans text-sm font-bold opacity-80 group-hover:opacity-100">SOP Akademik disusun</span>
                 </label>
                 <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" className="w-5 h-5 accent-ink" checked={formData.sec3.sopAdmin} onChange={e => setFormData(prev => ({...prev, sec3: {...prev.sec3, sopAdmin: e.target.checked}}))} />
                    <span className="font-sans text-sm font-bold opacity-80 group-hover:opacity-100">SOP Administrasi disusun</span>
                 </label>
              </div>
              <div className="space-y-6">
                <div className="space-y-4">
                   <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest block">Jumlah SOP yg Dibuat</label>
                   <input type="number" className="w-full p-4 font-sans text-sm border border-gray-200 bg-white" placeholder="Misal: 5" value={formData.sec3.jumlahSOP} onChange={e => setFormData(prev => ({...prev, sec3: {...prev.sec3, jumlahSOP: e.target.value}}))} />
                </div>
                <div className="space-y-4">
                   <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest block">Status Dokumentasi</label>
                   <select className="w-full p-4 font-sans text-sm border border-gray-200 bg-white" value={formData.sec3.status} onChange={e => setFormData(prev => ({...prev, sec3: {...prev.sec3, status: e.target.value}}))}>
                      <option value="">-- Pilih --</option>
                      <option value="Draft">Draft</option>
                      <option value="Final">Final</option>
                      <option value="Disahkan">Disahkan</option>
                   </select>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4 */}
          <div>
            <h3 className="text-[18px] font-bold font-sans mb-6 border-b-2 border-gray-100 pb-4 text-gray-900">4. Implementasi Sistem</h3>
            <div className="grid md:grid-cols-2 gap-6 bg-blue-100/20 p-8 border border-gray-100">
              <div className="space-y-4">
                 <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" className="w-5 h-5 accent-ink" checked={formData.sec4.sopPembelajaran} onChange={e => setFormData(prev => ({...prev, sec4: {...prev.sec4, sopPembelajaran: e.target.checked}}))} />
                    <span className="font-sans text-sm font-bold opacity-80 group-hover:opacity-100">SOP Pembelajaran dijalankan</span>
                 </label>
                 <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" className="w-5 h-5 accent-ink" checked={formData.sec4.sopAdmin} onChange={e => setFormData(prev => ({...prev, sec4: {...prev.sec4, sopAdmin: e.target.checked}}))} />
                    <span className="font-sans text-sm font-bold opacity-80 group-hover:opacity-100">SOP Administrasi dijalankan</span>
                 </label>
                 <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" className="w-5 h-5 accent-ink" checked={formData.sec4.monitoring} onChange={e => setFormData(prev => ({...prev, sec4: {...prev.sec4, monitoring: e.target.checked}}))} />
                    <span className="font-sans text-sm font-bold opacity-80 group-hover:opacity-100">Monitoring harian dilakukan</span>
                 </label>
              </div>
              <div className="space-y-4">
                 <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest block">Persentase SOP Dijalankan (%)</label>
                 <input type="number" className="w-full p-4 font-sans text-sm border border-gray-200 bg-white" placeholder="Misal: 80" value={formData.sec4.persentase} onChange={e => setFormData(prev => ({...prev, sec4: {...prev.sec4, persentase: e.target.value}}))} />
              </div>
            </div>
          </div>

          {/* SECTION 5 */}
          <div>
            <h3 className="text-[18px] font-bold font-sans mb-6 border-b-2 border-gray-100 pb-4 text-gray-900">5. Audit Internal</h3>
            <div className="grid md:grid-cols-2 gap-6 bg-blue-100/20 p-8 border border-gray-100">
               <div className="space-y-4">
                 <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest block">Unit / Kelas Diaudit</label>
                 <select className="w-full p-4 font-sans text-sm border border-gray-200 bg-white" value={formData.sec5.unit} onChange={e => setFormData(prev => ({...prev, sec5: {...prev.sec5, unit: e.target.value}}))}>
                    <option value="">-- Pilih --</option>
                    <option value="Kelas I">Kelas I</option>
                    <option value="Kelas II">Kelas II</option>
                    <option value="Kelas III">Kelas III</option>
                    <option value="Kelas IV">Kelas IV</option>
                    <option value="Kelas V">Kelas V</option>
                    <option value="Kelas VI">Kelas VI</option>
                 </select>
              </div>
              <div className="space-y-4">
                 <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest block">Status Temuan</label>
                 <select className="w-full p-4 font-sans text-sm border border-gray-200 bg-white" value={formData.sec5.status} onChange={e => setFormData(prev => ({...prev, sec5: {...prev.sec5, status: e.target.value}}))}>
                    <option value="">-- Pilih --</option>
                    <option value="Minor">Minor</option>
                    <option value="Mayor">Mayor</option>
                 </select>
              </div>
              <div className="space-y-4 md:col-span-2">
                 <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest block">Temuan Audit</label>
                 <input type="text" className="w-full p-4 font-sans text-sm border border-gray-200 bg-white" value={formData.sec5.temuan} onChange={e => setFormData(prev => ({...prev, sec5: {...prev.sec5, temuan: e.target.value}}))} />
              </div>
              <div className="space-y-4 md:col-span-2">
                 <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest block">Tindakan Korektif</label>
                 <input type="text" className="w-full p-4 font-sans text-sm border border-gray-200 bg-white" value={formData.sec5.korektif} onChange={e => setFormData(prev => ({...prev, sec5: {...prev.sec5, korektif: e.target.value}}))} />
              </div>
            </div>
          </div>

          {/* SECTION 6 */}
          <div>
            <h3 className="text-[18px] font-bold font-sans mb-6 border-b-2 border-gray-100 pb-4 text-gray-900">6. Audit Eksternal (Badan Sertifikasi)</h3>
            <div className="grid md:grid-cols-2 gap-6 bg-blue-100/20 p-8 border border-gray-100">
               <div className="space-y-4">
                 <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest block">Lembaga Sertifikasi</label>
                 <select className="w-full p-4 font-sans text-sm border border-gray-200 bg-white" value={formData.sec6.lembaga} onChange={e => setFormData(prev => ({...prev, sec6: {...prev.sec6, lembaga: e.target.value}}))}>
                    <option value="">-- Pilih --</option>
                    <option value="Sucofindo">Sucofindo</option>
                    <option value="SGS">SGS</option>
                    <option value="TUV Rheinland">TUV Rheinland</option>
                 </select>
              </div>
              <div className="space-y-4">
                 <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest block">Nomor Sertifikat</label>
                 <input type="text" className="w-full p-4 font-sans text-sm border border-gray-200 bg-white" placeholder="No. Sertifikat ISO" value={formData.sec6.nomor} onChange={e => setFormData(prev => ({...prev, sec6: {...prev.sec6, nomor: e.target.value}}))} />
              </div>
              <div className="space-y-4 md:col-span-2 flex flex-col md:flex-row gap-6">
                 <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" className="w-5 h-5 accent-ink" checked={formData.sec6.audit} onChange={e => setFormData(prev => ({...prev, sec6: {...prev.sec6, audit: e.target.checked}}))} />
                    <span className="font-sans text-sm font-bold opacity-80 group-hover:opacity-100">Audit Eksternal dilakukan</span>
                 </label>
                 <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" className="w-5 h-5 accent-ink" checked={formData.sec6.sertifikat} onChange={e => setFormData(prev => ({...prev, sec6: {...prev.sec6, sertifikat: e.target.checked}}))} />
                    <span className="font-sans text-sm font-bold opacity-80 group-hover:opacity-100">Sertifikat diterbitkan</span>
                 </label>
                 <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" className="w-5 h-5 accent-ink" checked={formData.sec6.surveillance} onChange={e => setFormData(prev => ({...prev, sec6: {...prev.sec6, surveillance: e.target.checked}}))} />
                    <span className="font-sans text-sm font-bold opacity-80 group-hover:opacity-100">Surveillance Audit berjalan</span>
                 </label>
              </div>
            </div>
          </div>

          {/* SECTION 7 */}
          <div>
            <h3 className="text-[18px] font-bold font-sans mb-6 border-b-2 border-gray-100 pb-4 text-gray-900">7. Rencana Anggaran</h3>
            <div className="grid md:grid-cols-2 gap-6 bg-blue-100/20 p-8 border border-gray-100">
              <div className="space-y-4">
                 <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest block">Kegiatan</label>
                 <input type="text" className="w-full p-4 font-sans text-sm border border-gray-200 bg-white" placeholder="Contoh: Pelatihan ISO" value={formData.sec7.kegiatan} onChange={e => setFormData(prev => ({...prev, sec7: {...prev.sec7, kegiatan: e.target.value}}))} />
              </div>
              <div className="space-y-4">
                 <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest block">Estimasi Biaya (Rp)</label>
                 <input type="number" className="w-full p-4 font-sans text-sm border border-gray-200 bg-white" value={formData.sec7.estimasi} onChange={e => setFormData(prev => ({...prev, sec7: {...prev.sec7, estimasi: e.target.value}}))} />
              </div>
              <div className="space-y-4">
                 <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest block">Sumber Dana</label>
                 <select className="w-full p-4 font-sans text-sm border border-gray-200 bg-white" value={formData.sec7.sumber} onChange={e => setFormData(prev => ({...prev, sec7: {...prev.sec7, sumber: e.target.value}}))}>
                    <option value="">-- Pilih --</option>
                    <option value="BOS">BOS</option>
                    <option value="Komite">Komite</option>
                    <option value="Sponsor">Sponsor</option>
                 </select>
              </div>
              <div className="space-y-4">
                 <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest block">Keterangan Tambahan</label>
                 <input type="text" className="w-full p-4 font-sans text-sm border border-gray-200 bg-white" value={formData.sec7.keterangan} onChange={e => setFormData(prev => ({...prev, sec7: {...prev.sec7, keterangan: e.target.value}}))} />
              </div>
            </div>
          </div>

          {/* SECTION 8 */}
          <div>
            <h3 className="text-[18px] font-bold font-sans mb-6 border-b-2 border-gray-100 pb-4 text-gray-900">8. Evaluasi Pemenuhan Mutu</h3>
            <div className="grid md:grid-cols-2 gap-6 bg-blue-100/20 p-8 border border-gray-100">
               <div className="space-y-4 md:col-span-2">
                 <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest block">Aspek Evaluasi</label>
                 <select className="w-full p-4 font-sans text-sm border border-gray-200 bg-white" value={formData.sec8.aspek} onChange={e => setFormData(prev => ({...prev, sec8: {...prev.sec8, aspek: e.target.value}}))}>
                    <option value="">-- Pilih --</option>
                    <option value="Kepuasan Orang Tua">Kepuasan Orang Tua</option>
                    <option value="Kelulusan Siswa">Kelulusan Siswa</option>
                    <option value="Implementasi SOP">Implementasi SOP</option>
                 </select>
              </div>
              <div className="space-y-4">
                 <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest block">Target (%)</label>
                 <input type="number" className="w-full p-4 font-sans text-sm border border-gray-200 bg-white" value={formData.sec8.target} onChange={e => setFormData(prev => ({...prev, sec8: {...prev.sec8, target: e.target.value}}))} />
              </div>
              <div className="space-y-4">
                 <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest block">Capaian (%)</label>
                 <input type="number" className="w-full p-4 font-sans text-sm border border-gray-200 bg-white" value={formData.sec8.capaian} onChange={e => setFormData(prev => ({...prev, sec8: {...prev.sec8, capaian: e.target.value}}))} />
              </div>
              <div className="space-y-4 md:col-span-2">
                 <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest block">Status Pencapaian</label>
                 <select className="w-full p-4 font-sans text-sm border border-gray-200 bg-white" value={formData.sec8.status} onChange={e => setFormData(prev => ({...prev, sec8: {...prev.sec8, status: e.target.value}}))}>
                    <option value="">-- Pilih --</option>
                    <option value="Tercapai">Tercapai</option>
                    <option value="Hampir tercapai">Hampir tercapai</option>
                    <option value="Belum tercapai">Belum tercapai</option>
                 </select>
              </div>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <div className="pt-8 flex justify-end relative z-10 pb-4 border-t border-gray-100 mt-8">
             {thinking ? (
               <div className="flex flex-col items-center justify-center py-6 opacity-70 w-full">
                  <Loader2 className="animate-spin text-gray-900 mb-4" size={32} />
                  <p className="font-sans  text-sm text-gray-900">Menyusun Gap Analysis ISO 9001:2015...</p>
               </div>
             ) : (
               <button 
                  onClick={handleAnalisis} 
                  className="bg-gray-900 hover:bg-blue-600 text-white hover:text-gray-900 font-bold uppercase tracking-[2px] text-[12px] px-10 py-5 transition-colors flex items-center gap-4 shadow-lg"
               >
                  Kunci 8 Modul & Eksekusi Gap Analysis <ChevronRight size={18} />
               </button>
             )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 border border-gray-100 shadow-sm relative no-print mt-8">
         <button onClick={() => { if(window.confirm('Reset seluruh formulir?')){ setStep(1); setFormData({sec1: { tingkat: '', tim: false, pelatihan: false, jumlahStaf: '' }, sec2: { klausul: '', kondisi: '', kesenjangan: '', rekomendasi: '' }, sec3: { kebijakan: false, sasaran: false, sopAkademik: false, sopAdmin: false, jumlahSOP: '', status: '' }, sec4: { sopPembelajaran: false, sopAdmin: false, monitoring: false, persentase: '' }, sec5: { unit: '', temuan: '', status: '', korektif: '' }, sec6: { lembaga: '', audit: false, sertifikat: false, surveillance: false, nomor: '' }, sec7: { kegiatan: '', estimasi: '', sumber: '', keterangan: '' }, sec8: { aspek: '', target: '', capaian: '', status: '' }}); setHistory([]); } }} className="text-danger flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest hover:underline w-full md:w-auto mb-4 md:mb-0">
            <RefreshCw size={14} /> Reset Seluruh Form
         </button>
         
         <div className="flex flex-wrap gap-4 w-full md:w-auto justify-end">
            <button onClick={() => alert("Data profil pengguna berhasil disimpan.")} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 border-2 border-gray-200 text-gray-900 font-bold text-[11px] uppercase tracking-widest hover:bg-gray-900 hover:text-white transition-colors">
               <Save size={16} /> Simpan Data
            </button>
            <button onClick={() => printElement('printArea', 'Laporan', undefined)} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 border-2 border-gray-200 text-gray-900 font-bold text-[11px] uppercase tracking-widest hover:bg-gray-900 hover:text-white transition-colors">
               <Printer size={16} /> Print
            </button>
            <button onClick={() => alert("Fungsi Save Word sedang dikembangkan.")} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-[#2b579a] text-white font-bold text-[11px] uppercase tracking-widest hover:bg-gray-900 transition-colors shadow-lg shadow-[#2b579a]/20">
               <FileText size={16} /> Save Word
            </button>
            <button onClick={() => alert("Fungsi Save PDF sedang dikembangkan. Gunakan fitur Print.")} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-[#e3242b] text-white font-bold text-[11px] uppercase tracking-widest hover:bg-gray-900 transition-colors shadow-lg shadow-[#e3242b]/20">
               <Download size={16} /> Save PDF
            </button>
         </div>
      </div>

      {/* STEP 2 - RESULTS */}
      {step === 2 && history.map((h, i) => (
        <div key={i} className="bg-white mx-auto border-t-0 p-8 md:p-[20mm] prose prose-slate max-w-[800px] w-full min-h-[1123px] prose-tables:border prose-tables:border-gray-200 prose-tables:w-full prose-tables:table-auto prose-td:break-words prose-th:bg-blue-50 prose-th:text-gray-900 prose-th:p-3 prose-td:p-3 prose-td:border-gray-200 prose-headings:font-sans prose-headings:text-gray-900 prose-a:text-blue-600 prose-p:font-sans prose-p:leading-[1.8] prose-p:text-sm prose-li:font-sans prose-li:text-sm prose-table:text-[12px] relative print-area shadow-2xl overflow-visible ring-1 ring-ink/5 mt-8 mb-12">
           <div className="flex items-center justify-between mb-10 border-b border-gray-100 pb-6">
             <div className="text-[12px] tracking-[3px] uppercase font-bold text-gray-900 flex items-center gap-3">
               <CheckCircle2 size={20} /> Laporan Audit ISO 9001:2015
             </div>
             <button onClick={() => printElement('printArea', 'Laporan', undefined)} className="no-print flex items-center gap-2 text-gray-900 hover:text-blue-600 transition-colors text-sm font-medium border border-gray-200 px-4 py-2 bg-white shadow-sm">
                <Printer size={16} /> Cetak Laporan
             </button>
           </div>
           
           <div className="markdown-body mb-12"><ReactMarkdown>{h.aiResponse}</ReactMarkdown></div>

           <div className="no-print pt-8 border-t border-gray-100 flex justify-between items-center">
              <button 
                 onClick={() => { setStep(1); setHistory([]); }} 
                 className="text-gray-500 hover:text-gray-900 font-bold uppercase tracking-widest text-[11px] transition-colors border border-gray-200 px-6 py-3 bg-white"
              >
                 &larr; Evaluasi Ulang (Kembali)
              </button>
           </div>
        </div>
      ))}
    </div>
  );
}

// --- SPMI WIZARD ---
function SpmiWizard({ jenjang, jenisSekolah }: { jenjang?: string, jenisSekolah?: string }) {
  const [step, setStep] = useState(1);
  const [thinking, setThinking] = useState(false);
  const [history, setHistory] = useState<{ step: number; userSummary: string; aiResponse: string }[]>([]);
  
  const [customInp, setCustomInp] = useState({m1:'', m2:'', m3:'', m4:'', m7:'', m8:''});

  const [formData, setFormData] = useState({
    m1: { capaian: 'Rendah', skor: 45, target: 65, akar: ['Bahan bacaan kurang'] },
    m2: { skor: 49.7, target: 60, akar: ['Guru belum terlatih numerasi kontekstual'] },
    m3: { siswaAman: 70, target: 85, program: ['Satgas Anti Perundungan'] },
    m4: { belanjaMutu: 30, target: 50, akar: ['Perencanaan tidak berbasis data'] },
    m5: [
      { kegiatan: 'Pelatihan guru numerasi kontekstual', biaya: true },
      { kegiatan: 'Pengadaan buku bacaan tambahan', biaya: true },
      { kegiatan: 'Rapat koordinasi pembentukan satgas anti perundungan', biaya: false }
    ],
    m6: [
      { barang: 'Buku Fiksi/Non-Fiksi', jumlah: 150, harga: 45000 },
      { barang: 'Alat Peraga Numerasi', jumlah: 5, harga: 300000 }
    ],
    m7: { persentase: 40, catatan: 'Kendala administrasi pencairan dana BOS' },
    m8: { rekomendasi: 'Prioritaskan peningkatan kompetensi guru sebelum pengadaan barang' }
  });

  const toggleArrayItem = (module: 'm1'|'m2'|'m3'|'m4', field: string, val: string) => {
    setFormData(prev => {
      // @ts-ignore
      const arr = prev[module][field] as string[];
      return {
        ...prev,
        [module]: {
          ...prev[module],
          // @ts-ignore
          [field]: arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]
        }
      }
    });
  };

  const handleAnalisis = async () => {
    // Collect data state
    let userSummary = `DATA SPMI SEKOLAH & INDIKATOR RAPOR PENDIDIKAN

1. Literasi (A.1):
- Capaian: ${formData.m1.capaian}
- Skor: ${formData.m1.skor} (Target: ${formData.m1.target})
- Akar Masalah: ${formData.m1.akar.join(', ')}

2. Numerasi (A.2):
- Skor: ${formData.m2.skor} (Target: ${formData.m2.target})
- Akar Masalah: ${formData.m2.akar.join(', ')}

3. Perundungan (D.4.4):
- Siswa Aman (%): ${formData.m3.siswaAman} (Target: ${formData.m3.target})
- Program Pencegahan: ${formData.m3.program.join(', ')}

4. Pemanfaatan Dana BOS (E.2):
- Belanja Mutu (%): ${formData.m4.belanjaMutu} (Target: ${formData.m4.target})
- Akar Masalah: ${formData.m4.akar.join(', ')}

5. Rencana Kerja Tahunan (RKT):
${formData.m5.map((k, i) => `- ${k.kegiatan} (Butuh Biaya: ${k.biaya ? 'Ya' : 'Tidak'})`).join('\n')}

6. Penyusunan Anggaran (ARKAS):
${formData.m6.map((b, i) => `- ${b.barang} (${b.jumlah}x Rp ${b.harga})`).join('\n')}

7. Pemenuhan Mutu:
- Realisasi (%): ${formData.m7.persentase}
- Catatan: ${formData.m7.catatan}

8. Evaluator Mutu:
- Rekomendasi/Temuan: ${formData.m8.rekomendasi}`;

    let promptDetail = `PROFIL: ${jenjang || '-'} / ${jenisSekolah || '-'}

DATA AKTUAL SEKOLAH (8 Modul SPMI):
${userSummary}

INSTRUKSI:
Layanan Anda bertindak sebagai analis strategis data dari kementrian pendidikan untuk Menganalisis Rapor Pendidikan dan SPMI terkait pemetaan mutu, penyusunan rencana, penyusunan anggaran, pemenuhan mutu, dan evaluator pemenuhan mutu.
Gunakan metode analisis mendalam (5 Why & Fishbone Analysis) untuk membedah akar masalah yang rendah. Gunakan logika Venn Diagram jika ditemukan inkonsistensi data antar standar.

WAJIB hasilkan analisis komparatif setiap fase siklus mutu, dengan struktur:
**Fase Mutu: [Nama Fase]**
- **Kategori Kondisi:** [Optimal/Perlu Perbaikan/Kritis]
- **Tanggapan Analis (Root Cause Analysis - 5 Why/Fishbone):** [Analisis strategis & solusi akar masalah]
- **Tanggapan Sebagai Masyarakat:** [Aksi masyarakat sesuai instrumen pedoman]
- **Tanggapan Pemangku Kepentingan:** [Kebijakan/Evaluasi sistemik]

Sajikan dengan sangat rapi menggunakan Markdown. Jangan gunakan basa-basi.`;

    setThinking(true);
    try {
      const systemInstruction = `Anda adalah Analis Strategis Data Senior Kementerian Pendidikan. 
Tugas utama Anda mengevaluasi pemetaan mutu sekolah (Rapor Pendidikan & SPMI) dengan fokus pada validitas dan kedalaman data.
Anda wajib menggunakan analisis '5 Why', 'Fishbone Analysis', dan 'Venn Diagram' untuk mengidentifikasi akar masalah sebenarnya.
Berikan rekomendasi preskriptif yang menjamin integrasi antar program lintas standar.
DILARANG KERAS menyapa, basa-basi pengantar, atau memberi kata penutup. Fokus pada output audit murni.`;

      const ai = new GoogleGenAI({});
      const response = await ai.models.generateContent({
        model: 'openai',
        contents: [{ role: 'user', parts: [{ text: promptDetail }] }],
        config: {
          systemInstruction,
          temperature: 0.2
        }
      });
      const data = { text: response.text };

      setHistory([{
        step: 2,
        userSummary: "Draf 8 Modul SPMI telah dikunci. Meminta Gap Analysis Eksekutif.",
        aiResponse: data.text || ''
      }]);

      setStep(2);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setThinking(false);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-12">
      <div className="bg-white border-l-4 border-gray-200 p-8 md:p-10 shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 font-sans font-black  mb-3 flex items-center gap-4 text-gray-900">
          <CheckSquare className="text-gray-900" size={32} /> Sistem Penjaminan Mutu Internal (SPMI)
        </h2>
        <p className="font-sans text-base leading-relaxed max-w-3xl text-gray-700">
          Sistem Evaluasi Sistem Penjaminan Mutu Internal (SPMI). Lengkapi kriteria di bawah ini untuk Audit Gap Analysis Eksekutif.
        </p>
      </div>

      {step === 1 && (
        <div className="bg-white border-t-2 border-gray-200 p-4 md:p-8 lg:p-14 shadow-lg border-l border-r border-b border-gray-100 space-y-10 relative">
          
          <div className="grid lg:grid-cols-2 gap-10">
             {/* MODULE 1 */}
             <div>
                <h3 className="text-sm font-bold font-sans uppercase tracking-widest mb-6 border-b-2 border-gray-100 pb-4 text-gray-900">1. Pemetaan - Literasi (A.1)</h3>
                <div className="bg-blue-100/20 p-6 border border-gray-100 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest block">Level Capaian</label>
                       <select className="w-full p-3 font-sans text-sm border border-gray-200 focus:border-gray-200 bg-white" value={formData.m1.capaian} onChange={e => setFormData(prev => ({...prev, m1: {...prev.m1, capaian: e.target.value}}))}>
                          <option value="Sangat Rendah">Sangat Rendah</option>
                          <option value="Rendah">Rendah</option>
                          <option value="Cukup">Cukup</option>
                          <option value="Tinggi">Tinggi</option>
                          <option value="Sangat Tinggi">Sangat Tinggi</option>
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest block">Skor & Target</label>
                       <div className="flex items-center gap-2">
                         <input type="number" className="w-1/2 p-3 font-sans text-sm border border-gray-200 bg-white" placeholder="Skor" value={formData.m1.skor} onChange={e => setFormData(prev => ({...prev, m1: {...prev.m1, skor: Number(e.target.value)}}))} />
                         <span className="text-sm font-bold">/</span>
                         <input type="number" className="w-1/2 p-3 font-sans text-sm border border-gray-200 bg-green-50" placeholder="Target" value={formData.m1.target} onChange={e => setFormData(prev => ({...prev, m1: {...prev.m1, target: Number(e.target.value)}}))} />
                       </div>
                    </div>
                  </div>
                  <div className="space-y-2 pt-2 border-t border-gray-100">
                    <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest block mb-2">Akar Masalah (Indikator Turunan)</label>
                    {formData.m1.akar.map(akar => typeof akar === 'string' && (
                       <label key={akar} className="flex items-center gap-3 cursor-pointer group mb-1">
                         <input type="checkbox" className="w-4 h-4 accent-ink" checked readOnly onClick={() => toggleArrayItem('m1', 'akar', akar)} />
                         <span className="font-sans text-sm opacity-80 group-hover:opacity-100">{akar}</span>
                       </label>
                    ))}
                    {['Minat baca rendah', 'Bahan bacaan kurang', 'Perpustakaan tidak aktif'].filter(o => !formData.m1.akar.includes(o)).map(akar => (
                      <label key={akar} className="flex items-center gap-3 cursor-pointer group mb-1">
                        <input type="checkbox" className="w-4 h-4 accent-ink" checked={false} onChange={() => toggleArrayItem('m1', 'akar', akar)} />
                        <span className="font-sans text-sm opacity-80 group-hover:opacity-100">{akar}</span>
                      </label>
                    ))}
                    <div className="flex gap-2 mt-2">
                       <input type="text" className="flex-1 p-2 text-xs border border-gray-200" placeholder="Akar masalah lainnya..." value={customInp.m1} onChange={e => setCustomInp(p => ({...p, m1: e.target.value}))} />
                       <button onClick={() => { if(customInp.m1.trim()) { toggleArrayItem('m1', 'akar', customInp.m1); setCustomInp(p => ({...p, m1: ''})); } }} className="px-3 bg-gray-900 text-white text-xs font-bold font-mono hover:bg-blue-600">+</button>
                    </div>
                  </div>
                </div>
             </div>

             {/* MODULE 2 */}
             <div>
                <h3 className="text-sm font-bold font-sans uppercase tracking-widest mb-6 border-b-2 border-gray-100 pb-4 text-gray-900">2. Pemetaan - Numerasi (A.2)</h3>
                <div className="bg-blue-100/20 p-6 border border-gray-100 space-y-4">
                  <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest block">Skor Numerasi vs Target</label>
                      <div className="flex items-center gap-2">
                        <input type="number" step="0.01" className="w-1/2 p-3 font-sans text-sm border border-gray-200 bg-white" placeholder="Skor" value={formData.m2.skor} onChange={e => setFormData(prev => ({...prev, m2: {...prev.m2, skor: Number(e.target.value)}}))} />
                        <span className="text-sm font-bold">/</span>
                        <input type="number" className="w-1/2 p-3 font-sans text-sm border border-gray-200 bg-green-50" placeholder="Target" value={formData.m2.target} onChange={e => setFormData(prev => ({...prev, m2: {...prev.m2, target: Number(e.target.value)}}))} />
                      </div>
                  </div>
                  <div className="space-y-2 pt-2 border-t border-gray-100">
                    <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest block mb-2">Akar Masalah</label>
                    {formData.m2.akar.map(akar => typeof akar === 'string' && (
                       <label key={akar} className="flex items-center gap-3 cursor-pointer group mb-1">
                         <input type="checkbox" className="w-4 h-4 accent-ink" checked readOnly onClick={() => toggleArrayItem('m2', 'akar', akar)} />
                         <span className="font-sans text-sm opacity-80 group-hover:opacity-100">{akar}</span>
                       </label>
                    ))}
                    {['Guru belum terlatih numerasi kontekstual', 'Kurang alat peraga bilangan'].filter(o => !formData.m2.akar.includes(o)).map(akar => (
                      <label key={akar} className="flex items-center gap-3 cursor-pointer group mb-1">
                        <input type="checkbox" className="w-4 h-4 accent-ink" checked={false} onChange={() => toggleArrayItem('m2', 'akar', akar)} />
                        <span className="font-sans text-sm opacity-80 group-hover:opacity-100">{akar}</span>
                      </label>
                    ))}
                    <div className="flex gap-2 mt-2">
                       <input type="text" className="flex-1 p-2 text-xs border border-gray-200" placeholder="Akar masalah lainnya..." value={customInp.m2} onChange={e => setCustomInp(p => ({...p, m2: e.target.value}))} />
                       <button onClick={() => { if(customInp.m2.trim()) { toggleArrayItem('m2', 'akar', customInp.m2); setCustomInp(p => ({...p, m2: ''})); } }} className="px-3 bg-gray-900 text-white text-xs font-bold font-mono hover:bg-blue-600">+</button>
                    </div>
                  </div>
                </div>
             </div>

             {/* MODULE 3 */}
             <div>
                <h3 className="text-sm font-bold font-sans uppercase tracking-widest mb-6 border-b-2 border-gray-100 pb-4 text-gray-900">3. Iklim Keamanan (D.4.4)</h3>
                <div className="bg-blue-100/20 p-6 border border-gray-100 space-y-4">
                  <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest block">% Siswa Aman vs Target</label>
                      <div className="flex items-center gap-2">
                        <input type="number" className="w-1/2 p-3 font-sans text-sm border border-gray-200 bg-white" placeholder="Capaian %" value={formData.m3.siswaAman} onChange={e => setFormData(prev => ({...prev, m3: {...prev.m3, siswaAman: Number(e.target.value)}}))} />
                        <span className="text-sm font-bold">/</span>
                        <input type="number" className="w-1/2 p-3 font-sans text-sm border border-gray-200 bg-green-50" placeholder="Target" value={formData.m3.target} onChange={e => setFormData(prev => ({...prev, m3: {...prev.m3, target: Number(e.target.value)}}))} />
                      </div>
                  </div>
                  <div className="space-y-2 pt-2 border-t border-gray-100">
                    <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest block mb-2">Program / Isu Keamanan</label>
                    {formData.m3.program.map(program => typeof program === 'string' && (
                       <label key={program} className="flex items-center gap-3 cursor-pointer group mb-1">
                         <input type="checkbox" className="w-4 h-4 accent-ink" checked readOnly onClick={() => toggleArrayItem('m3', 'program', program)} />
                         <span className="font-sans text-sm opacity-80 group-hover:opacity-100">{program}</span>
                       </label>
                    ))}
                    {['Satgas Anti Perundungan', 'Perundungan tidak terdata', 'Evaluasi SOP Keamanan'].filter(o => !formData.m3.program.includes(o)).map(program => (
                      <label key={program} className="flex items-center gap-3 cursor-pointer group mb-1">
                        <input type="checkbox" className="w-4 h-4 accent-ink" checked={false} onChange={() => toggleArrayItem('m3', 'program', program)} />
                        <span className="font-sans text-sm opacity-80 group-hover:opacity-100">{program}</span>
                      </label>
                    ))}
                    <div className="flex gap-2 mt-2">
                       <input type="text" className="flex-1 p-2 text-xs border border-gray-200" placeholder="Program lainnya..." value={customInp.m3} onChange={e => setCustomInp(p => ({...p, m3: e.target.value}))} />
                       <button onClick={() => { if(customInp.m3.trim()) { toggleArrayItem('m3', 'program', customInp.m3); setCustomInp(p => ({...p, m3: ''})); } }} className="px-3 bg-gray-900 text-white text-xs font-bold font-mono hover:bg-blue-600">+</button>
                    </div>
                  </div>
                </div>
             </div>

             {/* MODULE 4 */}
             <div>
                <h3 className="text-sm font-bold font-sans uppercase tracking-widest mb-6 border-b-2 border-gray-100 pb-4 text-gray-900">4. Tata Kelola BOS (E.2)</h3>
                <div className="bg-blue-100/20 p-6 border border-gray-100 space-y-4">
                  <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest block">Proporsi Belanja Mutu vs Target (%)</label>
                      <div className="flex items-center gap-2">
                        <input type="number" className="w-1/2 p-3 font-sans text-sm border border-gray-200 bg-white" placeholder="Belanja %" value={formData.m4.belanjaMutu} onChange={e => setFormData(prev => ({...prev, m4: {...prev.m4, belanjaMutu: Number(e.target.value)}}))} />
                        <span className="text-sm font-bold">/</span>
                        <input type="number" className="w-1/2 p-3 font-sans text-sm border border-gray-200 bg-green-50" placeholder="Target" value={formData.m4.target} onChange={e => setFormData(prev => ({...prev, m4: {...prev.m4, target: Number(e.target.value)}}))} />
                      </div>
                  </div>
                  <div className="space-y-2 pt-2 border-t border-gray-100">
                    <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest block mb-2">Evaluasi Perencanaan</label>
                    {formData.m4.akar.map(akar => typeof akar === 'string' && (
                       <label key={akar} className="flex items-center gap-3 cursor-pointer group mb-1">
                         <input type="checkbox" className="w-4 h-4 accent-ink" checked readOnly onClick={() => toggleArrayItem('m4', 'akar', akar)} />
                         <span className="font-sans text-sm opacity-80 group-hover:opacity-100">{akar}</span>
                       </label>
                    ))}
                    {['Perencanaan tidak berbasis data', 'Tingginya pagu belanja administrasi'].filter(o => !formData.m4.akar.includes(o)).map(akar => (
                      <label key={akar} className="flex items-center gap-3 cursor-pointer group mb-1">
                        <input type="checkbox" className="w-4 h-4 accent-ink" checked={false} onChange={() => toggleArrayItem('m4', 'akar', akar)} />
                        <span className="font-sans text-sm opacity-80 group-hover:opacity-100">{akar}</span>
                      </label>
                    ))}
                    <div className="flex gap-2 mt-2">
                       <input type="text" className="flex-1 p-2 text-xs border border-gray-200" placeholder="Evaluasi lainnya..." value={customInp.m4} onChange={e => setCustomInp(p => ({...p, m4: e.target.value}))} />
                       <button onClick={() => { if(customInp.m4.trim()) { toggleArrayItem('m4', 'akar', customInp.m4); setCustomInp(p => ({...p, m4: ''})); } }} className="px-3 bg-gray-900 text-white text-xs font-bold font-mono hover:bg-blue-600">+</button>
                    </div>
                  </div>
                </div>
             </div>
          </div>

          <div className="border-t border-gray-100 pt-10 grid lg:grid-cols-2 gap-10">
             {/* MODULE 5 */}
             <div className="lg:col-span-1">
               <h3 className="text-sm font-bold font-sans uppercase tracking-widest mb-6 border-b-2 border-gray-100 pb-4 text-gray-900">5. Penyusunan RKT (Benahi)</h3>
               <div className="bg-blue-100/20 p-6 border border-gray-100 space-y-4">
                 {formData.m5.map((rkt, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-white border border-gray-100">
                      <div className="w-8 shrink-0 text-gray-500 font-bold text-sm">#{idx + 1}</div>
                      <input type="text" className="w-full text-sm outline-none" value={rkt.kegiatan} onChange={e => {
                         const n = [...formData.m5]; n[idx].kegiatan = e.target.value; setFormData({...formData, m5: n});
                      }} />
                      <label className="shrink-0 flex items-center gap-2 cursor-pointer bg-gray-900/5 px-2 py-1 rounded">
                        <input type="checkbox" className="w-3 h-3 accent-ink" checked={rkt.biaya} onChange={e => {
                           const n = [...formData.m5]; n[idx].biaya = e.target.checked; setFormData({...formData, m5: n});
                        }} />
                        <span className="text-[10px] font-bold uppercase">Biaya</span>
                      </label>
                      <button onClick={() => setFormData(p => ({...p, m5: p.m5.filter((_, i) => i !== idx)}))} className="text-danger font-bold text-xs">X</button>
                    </div>
                 ))}
                 <button onClick={() => setFormData(p => ({...p, m5: [...p.m5, {kegiatan: '', biaya: false}]}))} className="w-full bg-white border border-gray-100 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-gray-900 hover:text-white transition-colors">+ Tambah RKT</button>
               </div>
             </div>

             {/* MODULE 6 */}
             <div className="lg:col-span-1">
               <h3 className="text-sm font-bold font-sans uppercase tracking-widest mb-6 border-b-2 border-gray-100 pb-4 text-gray-900">6. Penyusunan RKAS (Anggaran)</h3>
               <div className="bg-blue-100/20 p-6 border border-gray-100">
                 <div className="grid grid-cols-12 gap-2 mb-2 px-2 text-[10px] font-bold tracking-wider uppercase opacity-50">
                   <div className="col-span-5 relative group">Komponen / Barang</div>
                   <div className="col-span-2">Vol</div>
                   <div className="col-span-4">Harga Satuan</div>
                   <div className="col-span-1"></div>
                 </div>
                 {formData.m6.map((arkas, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 mb-2">
                      <input type="text" className="col-span-5 p-2 text-[12px] border border-gray-200" value={arkas.barang} onChange={e => {
                         const n = [...formData.m6]; n[idx].barang = e.target.value; setFormData({...formData, m6: n});
                      }} />
                      <input type="number" className="col-span-2 p-2 text-[12px] border border-gray-200" value={arkas.jumlah} onChange={e => {
                         const n = [...formData.m6]; n[idx].jumlah = Number(e.target.value); setFormData({...formData, m6: n});
                      }} />
                      <input type="number" className="col-span-4 p-2 text-[12px] border border-gray-200" value={arkas.harga} onChange={e => {
                         const n = [...formData.m6]; n[idx].harga = Number(e.target.value); setFormData({...formData, m6: n});
                      }} />
                      <button onClick={() => setFormData(p => ({...p, m6: p.m6.filter((_, i) => i !== idx)}))} className="col-span-1 text-danger font-bold text-xs p-2 hover:bg-danger/10">X</button>
                    </div>
                 ))}
                 <button onClick={() => setFormData(p => ({...p, m6: [...p.m6, {barang: '', jumlah: 1, harga: 0}]}))} className="w-full bg-white border border-gray-100 py-3 mt-4 text-[10px] font-bold uppercase tracking-widest hover:bg-gray-900 hover:text-white transition-colors">+ Tambah Barang RKAS</button>
               </div>
             </div>

             {/* MODULE 7 */}
             <div className="lg:col-span-1">
               <h3 className="text-sm font-bold font-sans uppercase tracking-widest mb-6 border-b-2 border-gray-100 pb-4 text-gray-900">7. Pemenuhan Mutu</h3>
               <div className="bg-blue-100/20 p-6 border border-gray-100 space-y-4">
                  <div className="space-y-2">
                     <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest block">Tingkat Penyerapan Anggaran / Realisasi (%)</label>
                     <input type="number" className="w-full p-3 font-sans text-sm border border-gray-200 bg-white" value={formData.m7.persentase} onChange={e => setFormData(prev => ({...prev, m7: {...prev.m7, persentase: Number(e.target.value)}}))} />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest block">Kendala Implementasi</label>
                     <textarea className="w-full h-20 p-3 font-sans text-sm border border-gray-200 bg-white" value={formData.m7.catatan} onChange={e => setFormData(prev => ({...prev, m7: {...prev.m7, catatan: e.target.value}}))} />
                     <div className="flex gap-2">
                       <input type="text" className="flex-1 p-2 text-xs border border-gray-200" placeholder="Tambah catatan cepat..." value={customInp.m7} onChange={e => setCustomInp(p => ({...p, m7: e.target.value}))} />
                       <button onClick={() => { if(customInp.m7.trim()) { setFormData(p => ({...p, m7: {...p.m7, catatan: p.m7.catatan + '\n- ' + customInp.m7}})); setCustomInp(p => ({...p, m7: ''})); } }} className="px-3 bg-gray-900 text-white text-xs font-bold font-mono hover:bg-blue-600">+</button>
                     </div>
                  </div>
               </div>
             </div>

             {/* MODULE 8 */}
             <div className="lg:col-span-1">
               <h3 className="text-sm font-bold font-sans uppercase tracking-widest mb-6 border-b-2 border-gray-100 pb-4 text-gray-900">8. Evaluator Mutu</h3>
               <div className="bg-blue-100/20 p-6 border border-gray-100 space-y-4 h-full">
                  <div className="space-y-2 h-full flex flex-col">
                     <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest block">Rekomendasi Tindak Lanjut (Audit Internal)</label>
                     <textarea className="w-full flex-1 p-3 font-sans text-sm border border-gray-200 bg-white leading-relaxed" value={formData.m8.rekomendasi} onChange={e => setFormData(prev => ({...prev, m8: {...prev.m8, rekomendasi: e.target.value}}))} />
                     <div className="flex gap-2 mt-2">
                       <input type="text" className="flex-1 p-2 text-xs border border-gray-200" placeholder="Tambah rekomendasi cepat..." value={customInp.m8} onChange={e => setCustomInp(p => ({...p, m8: e.target.value}))} />
                       <button onClick={() => { if(customInp.m8.trim()) { setFormData(p => ({...p, m8: {...p.m8, rekomendasi: p.m8.rekomendasi + '\n- ' + customInp.m8}})); setCustomInp(p => ({...p, m8: ''})); } }} className="px-3 bg-gray-900 text-white text-xs font-bold font-mono hover:bg-blue-600">+</button>
                     </div>
                  </div>
               </div>
             </div>
          </div>

          {/* SUBMIT BUTTON */}
          <div className="pt-8 flex justify-end relative z-10 pb-4 border-t border-gray-100 mt-8">
             {thinking ? (
               <div className="flex flex-col items-center justify-center py-6 opacity-70 w-full">
                  <Loader2 className="animate-spin text-gray-900 mb-4" size={32} />
                  <p className="font-sans  text-sm text-gray-900">Mengumpulkan State 8 Modul & Eksekusi Analisis Rantai Mutu...</p>
               </div>
             ) : (
               <button 
                  onClick={handleAnalisis} 
                  className="bg-gray-900 hover:bg-blue-600 text-white hover:text-gray-900 font-bold uppercase tracking-[2px] text-[12px] px-10 py-5 transition-colors flex items-center gap-4 shadow-lg w-full md:w-auto justify-center"
               >
                  Kunci 8 Modul & Eksekusi Gap Analysis <ChevronRight size={18} />
               </button>
             )}
          </div>
        </div>
      )}
      {/* Action Buttons */}
      {step === 1 && (
<div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 border border-gray-100 shadow-sm relative no-print mt-8">
         <button onClick={() => { if(window.confirm('Reset seluruh formulir?')){ setStep(1); setHistory([]); } }} className="text-danger flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest hover:underline w-full md:w-auto mb-4 md:mb-0">
            <RefreshCw size={14} /> Reset Seluruh Form
         </button>
         
         <div className="flex flex-wrap gap-4 w-full md:w-auto justify-end">
            <button onClick={() => alert("Data profil pengguna berhasil disimpan.")} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 border-2 border-gray-200 text-gray-900 font-bold text-[11px] uppercase tracking-widest hover:bg-gray-900 hover:text-white transition-colors">
               <Save size={16} /> Simpan Data
            </button>
            <button onClick={() => printElement('printArea', 'Laporan', undefined)} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 border-2 border-gray-200 text-gray-900 font-bold text-[11px] uppercase tracking-widest hover:bg-gray-900 hover:text-white transition-colors">
               <Printer size={16} /> Print
            </button>
            <button onClick={() => alert("Fungsi Save Word sedang dikembangkan.")} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-[#2b579a] text-white font-bold text-[11px] uppercase tracking-widest hover:bg-gray-900 transition-colors shadow-lg shadow-[#2b579a]/20">
               <FileText size={16} /> Save Word
            </button>
            <button onClick={() => alert("Fungsi Save PDF sedang dikembangkan. Gunakan fitur Print.")} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-[#e3242b] text-white font-bold text-[11px] uppercase tracking-widest hover:bg-gray-900 transition-colors shadow-lg shadow-[#e3242b]/20">
               <Download size={16} /> Save PDF
            </button>
         </div>
      </div>
      )}

      {/* STEP 2 - RESULTS */}
      {step === 2 && history.map((h, i) => (
        <div key={i} className="bg-white mx-auto border-t-0 p-8 md:p-[20mm] prose prose-slate max-w-[800px] w-full min-h-[1123px] prose-tables:border prose-tables:border-gray-200 prose-tables:w-full prose-tables:table-auto prose-td:break-words prose-th:bg-blue-50 prose-th:text-gray-900 prose-th:p-3 prose-td:p-3 prose-td:border-gray-200 prose-headings:font-sans prose-headings:text-gray-900 prose-a:text-blue-600 prose-p:font-sans prose-p:leading-[1.8] prose-p:text-sm prose-li:font-sans prose-li:text-sm prose-table:text-[12px] relative print-area shadow-2xl overflow-visible ring-1 ring-ink/5 mt-8 mb-12">
           <div className="flex items-center justify-between mb-10 border-b border-gray-100 pb-6 w-full max-w-full">
             <div className="text-[12px] tracking-[3px] uppercase font-bold text-gray-900 flex items-center gap-3">
               <CheckSquare size={20} /> Gap Analysis SPMI Eksekutif
             </div>
             <button onClick={() => printElement('printArea', 'Laporan', undefined)} className="no-print flex items-center gap-2 text-gray-900 hover:text-blue-600 transition-colors text-sm font-medium border border-gray-200 px-4 py-2 bg-white shadow-sm">
                <Printer size={16} /> Cetak Laporan
             </button>
           </div>
           
           <div className="markdown-body mb-12 w-full overflow-x-auto"><ReactMarkdown>{h.aiResponse}</ReactMarkdown></div>

           <div className="no-print pt-8 border-t border-gray-100 flex justify-between items-center">
              <button 
                 onClick={() => { setStep(1); setHistory([]); }} 
                 className="text-gray-500 hover:text-gray-900 font-bold uppercase tracking-widest text-[11px] transition-colors border border-gray-200 px-6 py-3 bg-white"
              >
                 &larr; Evaluasi Ulang (Kembali)
              </button>
           </div>
        </div>
      ))}
    </div>
  );
}

// --- KSP WIZARD ---
export function KspWizard({ jenjang, jenisSekolah }: { jenjang?: string, jenisSekolah?: string }) {
  const [step, setStep] = useState(1);
  const [thinking, setThinking] = useState(false);
  const [history, setHistory] = useState<{ step: number; userSummary: string; aiResponse: string }[]>([]);

  const [formData, setFormData] = useState<{
      namaSekolah: string;
      jenjang: string;
      akreditasi: string;
      tahunKsp: string;
      pemetaan: {
         literasi: { dataTersedia: boolean, capaian: string, prioritas: string },
         numerasi: { dataTersedia: boolean, capaian: string, prioritas: string },
         p5: { dataTersedia: boolean, capaian: string, prioritas: string },
         guru: { dataTersedia: boolean, capaian: string, prioritas: string },
         sarana: { dataTersedia: boolean, capaian: string, prioritas: string },
         akarLiterasi: string,
         akarNumerasi: string,
         akarLainnya: string,
      };
      rencana: {
         komponen: string[],
         pendekatan: string[],
         deepLearning: string
      };
      anggaran: {
         sumberDana: string[],
         sumberLainnya: string,
         alokasiGuru: string,
         kesesuaian: string
      };
      pemenuhan: {
         frekuensi: string,
         capaian: { lit: string, litT: string, num: string, numT: string, p5: string, p5T: string },
         deepLearning: string[]
      };
      evaluator: {
         siapa: string[],
         metode: string,
         tindakLanjut: string
      };
  }>({
      namaSekolah: '',
      jenjang: '',
      akreditasi: '',
      tahunKsp: '',
      pemetaan: {
         literasi: { dataTersedia: false, capaian: '', prioritas: '' },
         numerasi: { dataTersedia: false, capaian: '', prioritas: '' },
         p5: { dataTersedia: false, capaian: '', prioritas: '' },
         guru: { dataTersedia: false, capaian: '', prioritas: '' },
         sarana: { dataTersedia: false, capaian: '', prioritas: '' },
         akarLiterasi: '',
         akarNumerasi: '',
         akarLainnya: '',
      },
      rencana: {
         komponen: [],
         pendekatan: [],
         deepLearning: ''
      },
      anggaran: {
         sumberDana: [],
         sumberLainnya: '',
         alokasiGuru: '',
         kesesuaian: ''
      },
      pemenuhan: {
         frekuensi: '',
         capaian: { lit: '', litT: '', num: '', numT: '', p5: '', p5T: '' },
         deepLearning: []
      },
      evaluator: {
         siapa: [],
         metode: '',
         tindakLanjut: ''
      }
  });

  const toggleArrayItem = (category: keyof typeof formData, field: string, value: string) => {
      setFormData(prev => {
         const arr = (prev[category] as any)[field] as string[];
         const newArr = arr.includes(value) ? arr.filter(i => i !== value) : [...arr, value];
         return { ...prev, [category]: { ...(prev[category] as any), [field]: newArr } };
      });
  };

  const handleAnalisis = async () => {
    setThinking(true);
    try {
      const payload = JSON.stringify(formData, null, 2);
      
      const prompt = `
         PROFIL SEKOLAH (Props):
         Jenjang: ${jenjang || '-'}
         Jenis Sekolah: ${jenisSekolah || '-'}

         Anda adalah Smart Wizard Eksekutif untuk evaluasi Kurikulum Satuan Pendidikan (KSP) Kementerian Pendidikan Dasar, Menengah, Atas, dan Perguruan Tinggi. Patuhi aturan berikut secara mutlak:

         1. DILARANG membuka dengan salam, basa-basi.
         2. Melakukan Gap Analysis (analisis kesenjangan) kondisi aktual dengan standar KSP Panduan BSKAP Edisi Revisi 2025.
         3. Gunakan struktur Markdown.
         4. Sorotan (highlight) pada baris/kolom yang memiliki kesenjangan kritis menggunakan format ** atau [!].
         5. Tampilkan Kesimpulan Gap dalam bentuk tabel prioritas (Tinggi/Sedang/Rendah) dan rekomendasi aksi konkret.
         6. Jangan menambahkan informasi di luar konteks KSP. Jangan meminta maaf.

         Berikut adalah data satuan pendidikan yang telah dikumpulkan (JSON format):
         ${payload}
         
         Lakukan Gap Analysis berdasarkan data di atas. Buatlah Kesimpulan Gap dalam bentuk tabel dan berikan rekomendasi aksi konkret.
      `;
      
      const systemInstruction = "Anda adalah analis mutu strategis data Kementerian Pendidikan untuk Kurikulum Satuan Pendidikan. Evaluasi pemetaan mutu sekolah ini menggunakan analisis '5 Why' dan 'Fishbone' untuk memastikan validitas gap. Berikan rekomendasi program terintegrasi lintas standar tanpa sapaan atau penutup.";

      const ai = new GoogleGenAI({});
      const response = await ai.models.generateContent({
        model: 'openai',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          systemInstruction,
          temperature: 0.2
        }
      });
      const data = { text: response.text };
      
      setHistory([{
        step: 2,
        userSummary: 'Meminta Gap Analysis KSP',
        aiResponse: data.text || ''
      }]);
      setStep(2);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setThinking(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white w-full max-w-full">
      {step === 1 && (
        <div className="flex-1 overflow-x-hidden p-4 md:p-6 lg:p-12 space-y-12 shrink-0 h-max print-area">
          <div className="bg-white p-8 border-l-4 border-blue-600 shadow-sm">
             <h2 className="text-2xl font-sans font-bold  mb-4">Evaluasi Kurikulum Satuan Pendidikan (KSP)</h2>
             <p className="text-sm leading-relaxed mb-6 font-sans">
               Berdasarkan Panduan BSKAP Edisi Revisi 2025. Lakukan analisis kesenjangan aktual satuan pendidikan.
             </p>
             <div className="grid md:grid-cols-2 gap-6 bg-blue-100/20 p-6 border border-gray-100">
                <div className="space-y-2 md:col-span-2">
                   <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest">Nama Sekolah</label>
                   <input type="text" className="w-full p-3 font-sans text-sm border border-gray-200 bg-white" placeholder="Nama Sekolah" value={formData.namaSekolah} onChange={e => setFormData({...formData, namaSekolah: e.target.value})} />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest">Jenjang</label>
                   <select className="w-full p-3 font-sans text-sm border border-gray-200 bg-white" value={formData.jenjang} onChange={e => setFormData({...formData, jenjang: e.target.value})}>
                      <option value="">-- Pilih Jenjang --</option>
                      <option value="SD">SD</option>
                      <option value="SMP">SMP</option>
                      <option value="SMA">SMA</option>
                      <option value="SMK">SMK</option>
                      <option value="SLB">SLB</option>
                      <option value="PAUD">PAUD</option>
                      <option value="Kesetaraan">Kesetaraan</option>
                   </select>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest">Akreditasi</label>
                   <select className="w-full p-3 font-sans text-sm border border-gray-200 bg-white" value={formData.akreditasi} onChange={e => setFormData({...formData, akreditasi: e.target.value})}>
                      <option value="">-- Pilih Akreditasi --</option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="Belum">Belum Terakreditasi</option>
                   </select>
                </div>
                <div className="space-y-2 md:col-span-2">
                   <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest">Tahun Penyusunan KSP Terakhir</label>
                   <input type="number" className="w-full p-3 font-sans text-sm border border-gray-200 bg-white" placeholder="Contoh: 2024" value={formData.tahunKsp} onChange={e => setFormData({...formData, tahunKsp: e.target.value})} />
                </div>
             </div>
          </div>

          {/* PEMETAAN MUTU */}
          <div className="bg-white p-8 border border-gray-100 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 bg-gray-900 text-white px-4 py-1 text-sm font-medium">Dimensi B</div>
             <h3 className="text-lg font-bold font-sans mb-6 text-gray-900 flex items-center gap-3">
               <span className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-600 flex items-center justify-center text-sm">1</span> 
               Pemetaan Mutu (Rapor Pendidikan)
             </h3>
             <div className="overflow-x-auto w-full">
               <table className="w-full text-left text-sm mb-6 border border-gray-200">
                  <thead className="bg-gray-900/5 border-b border-gray-200">
                     <tr>
                        <th className="p-3 font-bold">Indikator</th>
                        <th className="p-3 font-bold">Data Tersedia?</th>
                        <th className="p-3 font-bold">Capaian</th>
                        <th className="p-3 font-bold">Prioritas Perbaikan</th>
                     </tr>
                  </thead>
                  <tbody>
                     {Object.entries({
                        literasi: { label: 'Literasi', capOps: ['<50', '50-65', '66-80', '>80'] },
                        numerasi: { label: 'Numerasi', capOps: ['<50', '50-65', '66-80', '>80'] },
                        p5: { label: 'Profil Pelajar Pancasila', capOps: ['<50', '50-65', '66-80', '>80'] },
                        guru: { label: 'Kompetensi Guru', capOps: ['<40%', '40-60%', '61-80%', '>80%'] },
                        sarana: { label: 'Sarana Digital', capOps: ['>1:10', '1:10 s.d 1:5', '1:5 s.d 1:3', '<1:3'] },
                     }).map(([k, v], i) => (
                        <tr key={k} className="border-b border-gray-100">
                           <td className="p-3 bg-blue-100/10 font-bold">{v.label}</td>
                           <td className="p-3">
                              <label className="flex items-center gap-2 cursor-pointer">
                                 <input type="checkbox" className="accent-ink" checked={(formData.pemetaan as any)[k].dataTersedia} onChange={e => setFormData(prev => ({...prev, pemetaan: {...prev.pemetaan, [k]: {...(prev.pemetaan as any)[k], dataTersedia: e.target.checked}}}))} /> Ya
                              </label>
                           </td>
                           <td className="p-3">
                              <select className="border border-gray-200 p-2 w-full max-w-[150px] bg-white outline-none" value={(formData.pemetaan as any)[k].capaian} onChange={e => setFormData(prev => ({...prev, pemetaan: {...prev.pemetaan, [k]: {...(prev.pemetaan as any)[k], capaian: e.target.value}}}))}>
                                 <option value="">-- Pilih --</option>
                                 {v.capOps.map(op => <option key={op} value={op}>{op}</option>)}
                              </select>
                           </td>
                           <td className="p-3">
                              <select className="border border-gray-200 p-2 w-full max-w-[150px] bg-white outline-none" value={(formData.pemetaan as any)[k].prioritas} onChange={e => setFormData(prev => ({...prev, pemetaan: {...prev.pemetaan, [k]: {...(prev.pemetaan as any)[k], prioritas: e.target.value}}}))}>
                                 <option value="">-- Pilih --</option>
                                 <option value="Tinggi">Tinggi</option>
                                 <option value="Sedang">Sedang</option>
                                 <option value="Rendah">Rendah</option>
                              </select>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
             </div>
             
             <div className="space-y-4 pt-4">
                <div className="grid md:grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest">Akar Masalah - Literasi</label>
                      <input type="text" className="w-full p-2 border border-gray-200 text-sm" value={formData.pemetaan.akarLiterasi} onChange={e => setFormData(prev => ({...prev, pemetaan: {...prev.pemetaan, akarLiterasi: e.target.value}}))} />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest">Akar Masalah - Numerasi</label>
                      <input type="text" className="w-full p-2 border border-gray-200 text-sm" value={formData.pemetaan.akarNumerasi} onChange={e => setFormData(prev => ({...prev, pemetaan: {...prev.pemetaan, akarNumerasi: e.target.value}}))} />
                   </div>
                   <div className="space-y-2 md:col-span-2">
                      <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest">Akar Masalah - Lainnya</label>
                      <input type="text" className="w-full p-2 border border-gray-200 text-sm" value={formData.pemetaan.akarLainnya} onChange={e => setFormData(prev => ({...prev, pemetaan: {...prev.pemetaan, akarLainnya: e.target.value}}))} />
                   </div>
                </div>
             </div>
          </div>

          {/* RENCANA */}
          <div className="bg-white p-8 border border-gray-100 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 bg-gray-900 text-white px-4 py-1 text-sm font-medium">Dimensi C</div>
             <h3 className="text-lg font-bold font-sans mb-6 text-gray-900 flex items-center gap-3">
               <span className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-600 flex items-center justify-center text-sm">2</span> 
               Penyusunan Rencana (Dokumen KSP)
             </h3>
             <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-3">
                   <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest block mb-2 border-b border-gray-100 pb-2">Komponen Tersusun</label>
                   {['Analisis karakteristik satuan pendidikan', 'Visi, misi, tujuan (SMARTer)', 'Pengorganisasian pembelajaran', 'Perencanaan pembelajaran (ATP & Modul Ajar)', 'Evaluasi, pendampingan, pengembangan profesional', 'Lampiran'].map(itm => (
                      <label key={itm} className="flex items-center gap-3 cursor-pointer group">
                        <input type="checkbox" className="w-4 h-4 accent-ink" checked={formData.rencana.komponen.includes(itm)} onChange={() => toggleArrayItem('rencana', 'komponen', itm)} />
                        <span className="font-sans text-sm opacity-80 group-hover:opacity-100">{itm}</span>
                      </label>
                   ))}
                </div>
                <div className="space-y-3">
                   <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest block mb-2 border-b border-gray-100 pb-2">Pendekatan Pengorganisasian</label>
                   {['Mata Pelajaran', 'Tematik', 'Integrasi', 'Blok waktu terpisah'].map(itm => (
                      <label key={itm} className="flex items-center gap-3 cursor-pointer group">
                        <input type="checkbox" className="w-4 h-4 accent-ink" checked={formData.rencana.pendekatan.includes(itm)} onChange={() => toggleArrayItem('rencana', 'pendekatan', itm)} />
                        <span className="font-sans text-sm opacity-80 group-hover:opacity-100">{itm}</span>
                      </label>
                   ))}
                </div>
                <div className="space-y-3 md:col-span-2 mt-4 pt-4 border-t border-gray-100">
                   <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest block mb-4">Prinsip Deep Learning (Mindful, Meaningful, Joyful)</label>
                   <div className="flex flex-wrap gap-4">
                      {['Belum sama sekali', 'Sebagian guru', 'Semua guru', 'Sudah terdokumentasi'].map(itm => (
                         <label key={itm} className="flex items-center gap-2 cursor-pointer p-3 border border-gray-100 hover:bg-blue-50 transition-colors">
                           <input type="radio" name="deepLearningR" className="accent-ink" value={itm} checked={formData.rencana.deepLearning === itm} onChange={e => setFormData(prev => ({...prev, rencana: {...prev.rencana, deepLearning: e.target.value}}))} />
                           <span className="text-sm">{itm}</span>
                         </label>
                      ))}
                   </div>
                </div>
             </div>
          </div>

          {/* ANGGARAN */}
          <div className="bg-white p-8 border border-gray-100 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 bg-gray-900 text-white px-4 py-1 text-sm font-medium">Dimensi D</div>
             <h3 className="text-lg font-bold font-sans mb-6 text-gray-900 flex items-center gap-3">
               <span className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-600 flex items-center justify-center text-sm">3</span> 
               Penyusunan Anggaran
             </h3>
             <div className="space-y-6">
                <div>
                   <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest block mb-4 border-b border-gray-100 pb-2">Sumber Dana Utama KSP</label>
                   <div className="flex flex-wrap gap-6 items-center">
                      {['BOS Reguler', 'BOS Kinerja', 'APBD', 'Komite sekolah'].map(itm => (
                         <label key={itm} className="flex items-center gap-2 cursor-pointer">
                           <input type="checkbox" className="w-4 h-4 accent-ink" checked={formData.anggaran.sumberDana.includes(itm)} onChange={() => toggleArrayItem('anggaran', 'sumberDana', itm)} />
                           <span className="text-sm">{itm}</span>
                         </label>
                      ))}
                      <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                         <label className="text-sm">Lainnya: </label>
                         <input type="text" className="flex-1 p-2 border-b border-gray-200 outline-none focus:border-blue-600 text-sm" value={formData.anggaran.sumberLainnya} onChange={e => setFormData(prev => ({...prev, anggaran: {...prev.anggaran, sumberLainnya: e.target.value}}))} />
                      </div>
                   </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-8 pt-4 border-t border-gray-100">
                   <div>
                      <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest block mb-2">Alokasi Pengembangan Profesional Guru (%)</label>
                      <div className="flex items-center gap-2">
                         <input type="number" className="w-24 p-2 border border-gray-200 text-sm outline-none" value={formData.anggaran.alokasiGuru} onChange={e => setFormData(prev => ({...prev, anggaran: {...prev.anggaran, alokasiGuru: e.target.value}}))} />
                         <span className="text-sm">% dari total anggaran (Standar min. 20%)</span>
                      </div>
                   </div>
                   <div>
                      <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest block mb-2">Kesesuaian Anggaran dengan Pemetaan Mutu</label>
                      <select className="w-full p-3 border border-gray-200 bg-white text-sm" value={formData.anggaran.kesesuaian} onChange={e => setFormData(prev => ({...prev, anggaran: {...prev.anggaran, kesesuaian: e.target.value}}))}>
                         <option value="">-- Pilih --</option>
                         <option value="Sesuai">Sesuai</option>
                         <option value="Sebagian sesuai">Sebagian sesuai</option>
                         <option value="Tidak sesuai">Tidak sesuai</option>
                      </select>
                   </div>
                </div>
             </div>
          </div>

          {/* PEMENUHAN MUTU */}
          <div className="bg-white p-8 border border-gray-100 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 bg-gray-900 text-white px-4 py-1 text-sm font-medium">Dimensi E</div>
             <h3 className="text-lg font-bold font-sans mb-6 text-gray-900 flex items-center gap-3">
               <span className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-600 flex items-center justify-center text-sm">4</span> 
               Pemenuhan Mutu (Implementasi)
             </h3>
             <div className="grid md:grid-cols-2 gap-8">
                <div>
                   <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest block mb-4 border-b border-gray-100 pb-2">Frekuensi Pemantauan Pemenuhan Mutu</label>
                   <div className="flex flex-col gap-3">
                      {['Harian', 'Mingguan', 'Bulanan', 'Tidak rutin'].map(itm => (
                         <label key={itm} className="flex items-center gap-3 cursor-pointer">
                           <input type="radio" name="frekuensiPM" className="w-4 h-4 accent-ink" value={itm} checked={formData.pemenuhan.frekuensi === itm} onChange={e => setFormData(prev => ({...prev, pemenuhan: {...prev.pemenuhan, frekuensi: e.target.value}}))} />
                           <span className="text-sm">{itm}</span>
                         </label>
                      ))}
                   </div>
                </div>
                
                <div>
                   <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest block mb-4 border-b border-gray-100 pb-2">Capaian Target Mutu Terakhir</label>
                   <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm bg-blue-100/10 p-2 border border-gray-100">
                         <span className="w-16 font-bold">Literasi:</span>
                         <input type="text" className="w-16 p-1 text-center border-b border-gray-200 bg-white" value={formData.pemenuhan.capaian.lit} onChange={e => setFormData(p => ({...p, pemenuhan: {...p.pemenuhan, capaian: {...p.pemenuhan.capaian, lit: e.target.value}}}))} />
                         <span>dari target</span>
                         <input type="text" className="w-16 p-1 text-center border-b border-gray-200 bg-white" value={formData.pemenuhan.capaian.litT} onChange={e => setFormData(p => ({...p, pemenuhan: {...p.pemenuhan, capaian: {...p.pemenuhan.capaian, litT: e.target.value}}}))} />
                      </div>
                      <div className="flex items-center gap-2 text-sm bg-blue-100/10 p-2 border border-gray-100">
                         <span className="w-16 font-bold">Numerasi:</span>
                         <input type="text" className="w-16 p-1 text-center border-b border-gray-200 bg-white" value={formData.pemenuhan.capaian.num} onChange={e => setFormData(p => ({...p, pemenuhan: {...p.pemenuhan, capaian: {...p.pemenuhan.capaian, num: e.target.value}}}))} />
                         <span>dari target</span>
                         <input type="text" className="w-16 p-1 text-center border-b border-gray-200 bg-white" value={formData.pemenuhan.capaian.numT} onChange={e => setFormData(p => ({...p, pemenuhan: {...p.pemenuhan, capaian: {...p.pemenuhan.capaian, numT: e.target.value}}}))} />
                      </div>
                      <div className="flex items-center gap-2 text-sm bg-blue-100/10 p-2 border border-gray-100">
                         <span className="w-16 font-bold">P5:</span>
                         <input type="text" className="w-16 p-1 text-center border-b border-gray-200 bg-white" value={formData.pemenuhan.capaian.p5} onChange={e => setFormData(p => ({...p, pemenuhan: {...p.pemenuhan, capaian: {...p.pemenuhan.capaian, p5: e.target.value}}}))} />
                         <span>projek dari target</span>
                         <input type="text" className="w-16 p-1 text-center border-b border-gray-200 bg-white" value={formData.pemenuhan.capaian.p5T} onChange={e => setFormData(p => ({...p, pemenuhan: {...p.pemenuhan, capaian: {...p.pemenuhan.capaian, p5T: e.target.value}}}))} />
                      </div>
                   </div>
                </div>
                
                <div className="md:col-span-2 pt-4 border-t border-gray-100">
                   <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest block mb-4">Checklist Implementasi Deep Learning di Kelas</label>
                   <div className="grid md:grid-cols-2 gap-3">
                      {['Guru membuka dengan pertanyaan pemantik (mindful)', 'Materi dikaitkan dengan konteks nyata murid (meaningful)', 'Suasana belajar menyenangkan & aman (joyful)', 'Ada aktivitas kolaborasi (diskusi/projek kelompok)', 'Umpan balik konstruktif diberikan secara rutin'].map(itm => (
                         <label key={itm} className="flex items-center gap-3 cursor-pointer group">
                           <input type="checkbox" className="w-4 h-4 accent-ink" checked={formData.pemenuhan.deepLearning.includes(itm)} onChange={() => toggleArrayItem('pemenuhan', 'deepLearning', itm)} />
                           <span className="font-sans text-sm opacity-80 group-hover:opacity-100">{itm}</span>
                         </label>
                      ))}
                   </div>
                </div>
             </div>
          </div>

          {/* EVALUATOR */}
          <div className="bg-white p-8 border border-gray-100 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 bg-gray-900 text-white px-4 py-1 text-sm font-medium">Dimensi F</div>
             <h3 className="text-lg font-bold font-sans mb-6 text-gray-900 flex items-center gap-3">
               <span className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-600 flex items-center justify-center text-sm">5</span> 
               Evaluator Pemenuhan Mutu
             </h3>
             <div className="grid md:grid-cols-3 gap-8">
                <div className="space-y-3">
                   <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest block mb-2 border-b border-gray-100 pb-2">Siapa saja yang terlibat?</label>
                   {['Kepala sekolah', 'Tim penjaminan mutu internal', 'Pengawas sekolah', 'Komite sekolah/orang tua', 'Murid', 'Mitra dunia kerja (khusus SMK)'].map(itm => (
                      <label key={itm} className="flex items-center gap-3 cursor-pointer group">
                        <input type="checkbox" className="w-4 h-4 accent-ink" checked={formData.evaluator.siapa.includes(itm)} onChange={() => toggleArrayItem('evaluator', 'siapa', itm)} />
                        <span className="font-sans text-sm opacity-80 group-hover:opacity-100">{itm}</span>
                      </label>
                   ))}
                </div>
                
                <div className="space-y-3 md:col-span-2">
                   <div className="grid md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                         <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest block mb-2 border-b border-gray-100 pb-2">Metode Evaluasi</label>
                         {['Observasi kelas', 'Survei', 'FGD', 'Analisis dokumen', 'Rapor Pendidikan'].map(itm => (
                            <label key={itm} className="flex items-center gap-3 cursor-pointer group">
                              <input type="radio" name="metodeEval" className="w-4 h-4 accent-ink" value={itm} checked={formData.evaluator.metode === itm} onChange={e => setFormData(prev => ({...prev, evaluator: {...prev.evaluator, metode: e.target.value}}))} />
                              <span className="font-sans text-sm opacity-80 group-hover:opacity-100">{itm}</span>
                            </label>
                         ))}
                      </div>
                      <div className="space-y-3">
                         <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest block mb-2 border-b border-gray-100 pb-2">Tindak Lanjut Evaluasi</label>
                         {['Setiap bulan', 'Setiap semester', 'Setahun sekali', 'Jarang/tidak pernah'].map(itm => (
                            <label key={itm} className="flex items-center gap-3 cursor-pointer group">
                              <input type="radio" name="tlEval" className="w-4 h-4 accent-ink" value={itm} checked={formData.evaluator.tindakLanjut === itm} onChange={e => setFormData(prev => ({...prev, evaluator: {...prev.evaluator, tindakLanjut: e.target.value}}))} />
                              <span className="font-sans text-sm opacity-80 group-hover:opacity-100">{itm}</span>
                            </label>
                         ))}
                      </div>
                   </div>
                </div>
             </div>
          </div>

          {/* SUBMIT BUTTON */}
          <div className="pt-8 flex justify-end relative z-10 pb-4 border-t border-gray-100 mt-8">
             {thinking ? (
               <div className="flex flex-col items-center justify-center py-6 opacity-70 w-full">
                  <Loader2 className="animate-spin text-gray-900 mb-4" size={32} />
                  <p className="font-sans  text-sm text-gray-900">Mengumpulkan Laporan Gap Analysis KSP...</p>
               </div>
             ) : (
               <button 
                  onClick={handleAnalisis} 
                  className="bg-gray-900 hover:bg-blue-600 text-white hover:text-gray-900 font-bold uppercase tracking-[2px] text-[12px] px-10 py-5 transition-colors flex items-center gap-4 shadow-lg w-full md:w-auto justify-center"
               >
                  Generate Gap Analysis Rekomendasi Prioritas <ChevronRight size={18} />
               </button>
             )}
          </div>
        </div>
      )}
      {/* Action Buttons */}
      {step === 1 && (
<div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 border border-gray-100 shadow-sm relative no-print mt-8">
         <button onClick={() => { if(window.confirm('Reset seluruh formulir?')){ setStep(1); setHistory([]); } }} className="text-danger flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest hover:underline w-full md:w-auto mb-4 md:mb-0">
            <RefreshCw size={14} /> Reset Seluruh Form
         </button>
         
         <div className="flex flex-wrap gap-4 w-full md:w-auto justify-end">
            <button onClick={() => alert("Data profil pengguna berhasil disimpan.")} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 border-2 border-gray-200 text-gray-900 font-bold text-[11px] uppercase tracking-widest hover:bg-gray-900 hover:text-white transition-colors">
               <Save size={16} /> Simpan Data
            </button>
            <button onClick={() => printElement('printArea', 'Laporan', undefined)} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 border-2 border-gray-200 text-gray-900 font-bold text-[11px] uppercase tracking-widest hover:bg-gray-900 hover:text-white transition-colors">
               <Printer size={16} /> Print
            </button>
            <button onClick={() => alert("Fungsi Save Word sedang dikembangkan.")} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-[#2b579a] text-white font-bold text-[11px] uppercase tracking-widest hover:bg-gray-900 transition-colors shadow-lg shadow-[#2b579a]/20">
               <FileText size={16} /> Save Word
            </button>
            <button onClick={() => alert("Fungsi Save PDF sedang dikembangkan. Gunakan fitur Print.")} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-[#e3242b] text-white font-bold text-[11px] uppercase tracking-widest hover:bg-gray-900 transition-colors shadow-lg shadow-[#e3242b]/20">
               <Download size={16} /> Save PDF
            </button>
         </div>
      </div>
      )}

      {/* STEP 2 - RESULTS */}
      {step === 2 && history.map((h, i) => (
        <div key={i} className="bg-white mx-auto border-t-0 p-8 md:p-[20mm] prose prose-slate max-w-[800px] w-full min-h-[1123px] prose-tables:border prose-tables:border-gray-200 prose-tables:w-full prose-tables:table-auto prose-td:break-words prose-th:bg-blue-50 prose-th:text-gray-900 prose-th:p-3 prose-td:p-3 prose-td:border-gray-200 prose-headings:font-sans prose-headings:text-gray-900 prose-a:text-blue-600 prose-p:font-sans prose-p:leading-[1.8] prose-p:text-sm prose-li:font-sans prose-li:text-sm prose-table:text-[12px] relative print-area shadow-2xl overflow-visible ring-1 ring-ink/5 mt-8 mb-12">
           <div className="flex items-center justify-between mb-10 border-b border-gray-100 pb-6 w-full max-w-full">
             <div className="text-[12px] tracking-[3px] uppercase font-bold text-gray-900 flex items-center gap-3">
               <BookOpen size={20} /> Laporan Gap Analysis KSP
             </div>
             <button onClick={() => printElement('printArea', 'Laporan', undefined)} className="no-print flex items-center gap-2 text-gray-900 hover:text-blue-600 transition-colors text-sm font-medium border border-gray-200 px-4 py-2 bg-white shadow-sm">
                <Printer size={16} /> Cetak Laporan
             </button>
           </div>
           
           <div className="markdown-body mb-12 w-full overflow-x-auto"><ReactMarkdown>{h.aiResponse}</ReactMarkdown></div>

           <div className="no-print pt-8 border-t border-gray-100 flex justify-between items-center">
              <button 
                 onClick={() => { setStep(1); setHistory([]); }} 
                 className="text-gray-500 hover:text-gray-900 font-bold uppercase tracking-widest text-[11px] transition-colors border border-gray-200 px-6 py-3 bg-white"
              >
                 &larr; Evaluasi Ulang (Kembali)
              </button>
           </div>
        </div>
      ))}
    </div>
  );
}

function AkreditasiWizard({ jenjang, jenisSekolah }: { jenjang?: string, jenisSekolah?: string }) {
  const [step, setStep] = useState(1);
  const [thinking, setThinking] = useState(false);
  const [history, setHistory] = useState<{ step: number; userSummary: string; aiResponse: string }[]>([]);

  const [formData, setFormData] = useState({
      mutuLulusan: { skor: '', catatan: '', bukti: '' },
      prosesPembelajaran: { skor: '', catatan: '', bukti: '' },
      mutuGuru: { skor: '', catatan: '', bukti: '' },
      manajemenSekolah: { skor: '', catatan: '', bukti: '' }
  });

  const getBobot = () => {
    switch(jenjang) {
      case 'SMA': return { mutuLulusan: 40, prosesPembelajaran: 25, mutuGuru: 20, manajemenSekolah: 15 };
      case 'SMK': return { mutuLulusan: 45, prosesPembelajaran: 25, mutuGuru: 15, manajemenSekolah: 15 };
      case 'PAUD': return { mutuLulusan: 35, prosesPembelajaran: 30, mutuGuru: 20, manajemenSekolah: 15 };
      case 'SD': 
      case 'SMP':
      case 'SLB':
      case 'Kesetaraan':
      default: return { mutuLulusan: 35, prosesPembelajaran: 30, mutuGuru: 20, manajemenSekolah: 15 };
    }
  };
  const bobot = getBobot();
  
  const isKhusus = jenisSekolah === 'Khusus' || jenjang === 'SLB';
  const activeComponents = isKhusus ? [
    { 
      key: 'mutuGuru', 
      label: '1. Kinerja Pendidik dalam Mengelola Proses Pembelajaran',
      indicators: [
        'Butir 1: Dukungan sosial emosional',
        'Butir 2: Suasana kelas aman dan nyaman',
        'Butir 3: Pembelajaran efektif dan bermakna (PPI/RPP)',
        'Butir 4: Nilai keimanan, ketakwaan, dan karakter'
      ],
      buktiTarget: 'Observasi kelas, telaah PPI, wawancara guru/murid'
    },
    { 
      key: 'manajemenSekolah', 
      label: '2. Kepemimpinan Kepala Satuan Pendidikan',
      indicators: [
        'Butir 5: Budaya refleksi & perbaikan (GPK)',
        'Butir 6: Layanan partisipatif & visi misi',
        'Butir 7: Pengelolaan anggaran berbasis data',
        'Butir 8: Pengelolaan sarpras adaptif',
        'Butir 9: Kurikulum berbasis kebutuhan murid'
      ],
      buktiTarget: 'Dokumen KSP, RKAS, daftar sarpras, wawancara komite'
    },
    { 
      key: 'prosesPembelajaran', 
      label: '3. Iklim Lingkungan Belajar',
      indicators: [
        'Butir 10: Sikap positif terhadap keberagaman',
        'Butir 11: Anti-perundungan dan kekerasan',
        'Butir 12: Keselamatan dan prosedur P3K',
        'Butir 13: Lingkungan sehat & kesadaran reproduksi/adiksi'
      ],
      buktiTarget: 'Observasi akses/fasilitas/UKS, SK Tim Pencegahan'
    },
    { 
      key: 'mutuLulusan', 
      label: '4. Kompetensi Hasil Pembelajaran Lulusan',
      indicators: [
        'Butir 14: Keterampilan hidup mandiri, bekerja & berkarya'
      ],
      buktiTarget: 'Dokumen capaian murid, kemitraan vokasi'
    }
  ] : [
    { 
      key: 'mutuLulusan', 
      label: 'Mutu Lulusan',
      indicators: ['Karakter & Kedisiplinan', 'Kompetensi Lulusan', 'Prestasi Akademik/Non-Akademik'],
      buktiTarget: 'Data kelulusan, daftar prestasi, portofolio'
    },
    { 
      key: 'prosesPembelajaran', 
      label: 'Proses Pembelajaran',
      indicators: ['Perencanaan (RPP/Modul)', 'Pelaksanaan Pembelajaran', 'Asesmen & Penilaian'],
      buktiTarget: 'Telaah silabus terintegrasi, observasi kegiatan'
    },
    { 
      key: 'mutuGuru', 
      label: 'Mutu Guru',
      indicators: ['Kualifikasi & Sertifikasi', 'Pengembangan Profesi Bertelanjutan', 'Inovasi Pembelajaran'],
      buktiTarget: 'Sertifikat, karya inovasi, laporan supervisi'
    },
    { 
      key: 'manajemenSekolah', 
      label: 'Manajemen Sekolah',
      indicators: ['Kepemimpinan Kepala Sekolah', 'Pengelolaan Sarpras & Anggaran', 'Keterlibatan Masyarakat'],
      buktiTarget: 'RKAS, dokumen evaluasi diri, wawancara komite'
    }
  ];

  const handleAnalisis = async () => {
    setThinking(true);
    try {
      const payload = JSON.stringify(formData, null, 2);
      
      const khususContext = isKhusus ? `
         Perhatikan bahwa ini adalah Sekolah Luar Biasa (SLB/MLB).
         Gunakan Panduan Instrumen Akreditasi SLB 2024 yang memiliki 4 komponen penilaian:
         1. Kinerja Pendidik dalam Mengelola Proses Pembelajaran (menggantikan Mutu Guru secara konseptual)
         2. Kepemimpinan Kepala Satuan Pendidikan (Manajemen Sekolah)
         3. Iklim Lingkungan Belajar (Proses Pembelajaran/Lingkungan)
         4. Kompetensi Hasil Pembelajaran Lulusan/Peserta Didik (Mutu Lulusan)
         Karakteristik murid SLB perlu dipertimbangkan, rubrik penilaian menggunakan "Perlu Perhatian", "Baik", dan "Sangat Baik".
      ` : '';

      const prompt = `
         PROFIL SEKOLAH (Props):
         Jenjang: ${jenjang || '-'}
         Jenis Sekolah: ${jenisSekolah || '-'}
         Bobot Maksimal (dari 100):
         - Mutu Lulusan: ${bobot.mutuLulusan}
         - Proses Pembelajaran: ${bobot.prosesPembelajaran}
         - Mutu Guru: ${bobot.mutuGuru}
         - Manajemen Sekolah: ${bobot.manajemenSekolah}
         ${khususContext}

         Anda adalah Tim Asesor Akreditasi Senior. Patuhi aturan berikut secara mutlak:

         1. DILARANG membuka dengan salam, basa-basi.
         2. Melakukan Gap Analysis (analisis kesenjangan) kondisi aktual dengan kriteria Akreditasi serta membandingkannya dengan bobot maksimal pencapaian.
         3. Gunakan struktur Markdown.
         4. Anda WAJIB menggunakan analisis '5 Why', 'Fishbone Analysis', dan 'Venn Diagram' untuk mengidentifikasi akar masalah (Root Cause) secara mendalam, bukan sekadar permukaan.
         5. Evaluasi kualitas Bukti Dukung yang disertakan (apakah valid, relevan, cukup kuat).
         6. Tampilkan Kesimpulan Gap dalam bentuk tabel dan berikan rekomendasi program terintegrasi.
         7. Jangan menambahkan informasi di luar konteks.

         Berikut adalah data input akreditasi satuan pendidikan (JSON), berserta Catatan Kondisi dan Bukti Dukung:
         ${payload}
         
         Buatlah Laporan Audit Gap Analysis Eksekutif berdasarkan instruksi sistem.
      `;
      
      const systemInstruction = "Anda adalah Asesor Akreditasi Strategis Kementerian Pendidikan. Evaluasi pemetaan akreditasi ini wajib menggunakan kerangka kerja '5 Why', 'Fishbone Analysis', dan 'Venn Diagram'. Berikan rekomendasi program terintegrasi lintas standar secara mendalam, bukan sekadar permukaan. Dilarang menggunakan sapaan, basa-basi, atau penutup.";

      const ai = new GoogleGenAI({});
      const response = await ai.models.generateContent({
        model: 'openai',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          systemInstruction,
          temperature: 0.2
        }
      });
      const data = { text: response.text };
      
      setHistory([{
        step: 2,
        userSummary: 'Meminta Analisis Akreditasi',
        aiResponse: data.text || ''
      }]);
      setStep(2);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setThinking(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white w-full max-w-full">
      {step === 1 && (
        <div className="flex-1 overflow-x-hidden p-4 md:p-6 lg:p-12 space-y-12 shrink-0 h-max print-area">
          <div className="bg-white p-8 border-l-4 border-blue-600 shadow-sm">
             <h2 className="text-2xl font-sans font-bold  mb-4">Evaluasi Akreditasi (Standar Nasional)</h2>
             <p className="text-sm leading-relaxed mb-6 font-sans">
               Mengukur 4 Komponen: Mutu Lulusan, Proses Pembelajaran, Mutu Guru, dan Manajemen Sekolah/Madrasah.
             </p>
             
             <div className="space-y-6">
                {activeComponents.map(({ key: k, label, indicators, buktiTarget }) => (
                   <div key={k} className="bg-blue-100/10 p-6 border border-gray-100">
                      <label className="text-sm font-bold text-gray-900 uppercase tracking-widest block mb-4 border-b border-gray-100 pb-2">{label}</label>
                      <ul className="mb-4 space-y-1.5 min-h-[60px]">
                        {indicators.map((ind: string, idx: number) => (
                          <li key={idx} className="text-xs font-sans flex items-start gap-2 text-gray-700"><Circle size={8} className="mt-1 shrink-0 text-blue-600/50" fill="currentColor"/> {ind}</li>
                        ))}
                      </ul>
                      <div className="grid md:grid-cols-6 gap-6 items-start">
                         <div className="space-y-2 md:col-span-2">
                             <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest">Skor Capaian (Max: {(bobot as any)[k] || '-'})</label>
                             <input type="number" className="w-full p-3 font-sans text-sm border border-gray-200 bg-white" placeholder={`0-${(bobot as any)[k] || '100'}`} value={(formData as any)[k].skor} onChange={e => setFormData(p => ({...p, [k]: { ...(p as any)[k], skor: e.target.value}}))} />
                         </div>
                         <div className="space-y-2 md:col-span-2">
                             <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest">Catatan Kondisi</label>
                             <textarea rows={2} className="w-full p-3 font-sans text-xs border border-gray-200 bg-white resize-none" placeholder="Jelaskan kondisi kualitatif aktual..." value={(formData as any)[k].catatan} onChange={e => setFormData(p => ({...p, [k]: { ...(p as any)[k], catatan: e.target.value}}))} />
                         </div>
                         <div className="space-y-2 md:col-span-2">
                             <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest">Bukti Dukung</label>
                             <textarea rows={2} className="w-full p-3 font-sans text-xs border border-gray-200 bg-white resize-none" placeholder={`Target: ${buktiTarget}`} value={(formData as any)[k].bukti} onChange={e => setFormData(p => ({...p, [k]: { ...(p as any)[k], bukti: e.target.value}}))} />
                         </div>
                      </div>
                   </div>
                ))}
             </div>
          </div>
          
          <div className="pt-8 flex justify-end relative z-10 pb-4 border-t border-gray-100 mt-8">
             {thinking ? (
               <div className="flex flex-col items-center justify-center py-6 opacity-70 w-full">
                  <Loader2 className="animate-spin text-gray-900 mb-4" size={32} />
                  <p className="font-sans  text-sm text-gray-900">Mengumpulkan Laporan Gap Analysis Akreditasi...</p>
               </div>
             ) : (
               <button 
                  onClick={handleAnalisis} 
                  className="bg-gray-900 hover:bg-blue-600 text-white hover:text-gray-900 font-bold uppercase tracking-[2px] text-[12px] px-10 py-5 transition-colors flex items-center gap-4 shadow-lg w-full md:w-auto justify-center"
               >
                  Generate Gap Analysis Akreditasi <ChevronRight size={18} />
               </button>
             )}
          </div>
        </div>
      )}

      {step === 2 && history.map((h, i) => (
        <div key={i} className="bg-white mx-auto border-t-0 p-8 md:p-[20mm] prose prose-slate max-w-[800px] w-full min-h-[1123px] prose-tables:border prose-tables:border-gray-200 relative print-area shadow-2xl mt-8 mb-12">
           <div className="flex items-center justify-between mb-10 border-b border-gray-100 pb-6 w-full max-w-full">
             <div className="text-[12px] tracking-[3px] uppercase font-bold text-gray-900 flex items-center gap-3">
               <ShieldCheck size={20} /> Laporan Audit Akreditasi 5 Why & Fishbone
             </div>
             <button onClick={() => printElement('printArea', 'Laporan', undefined)} className="no-print flex items-center gap-2 text-gray-900 hover:text-blue-600 transition-colors text-sm font-medium border border-gray-200 px-4 py-2 bg-white shadow-sm">
                <Printer size={16} /> Cetak Laporan
             </button>
           </div>
           
           <div className="markdown-body mb-12 w-full overflow-x-auto"><ReactMarkdown>{h.aiResponse}</ReactMarkdown></div>

           <div className="no-print pt-8 border-t border-gray-100 flex justify-between items-center">
              <button 
                 onClick={() => { setStep(1); setHistory([]); }} 
                 className="text-gray-500 hover:text-gray-900 font-bold uppercase tracking-widest text-[11px] transition-colors border border-gray-200 px-6 py-3 bg-white"
              >
                 &larr; Evaluasi Ulang (Kembali)
              </button>
           </div>
        </div>
      ))}
    </div>
  );
}

// MAIN PAGE LAYOUT
export default function EvaluasiMutu() {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    adiwiyata: true
  });
  const [jenjang, setJenjang] = useState('');
  const [jenisSekolah, setJenisSekolah] = useState('');
  
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const tabs = [
    { id: 'adiwiyata', label: 'Adiwiyata', icon: Leaf },
    { id: 'sra', label: 'Sekolah Ramah Anak', icon: Users },
    { id: 'ssk', label: 'Siaga Kependudukan', icon: Building },
    { id: 'rapor', label: 'Rapor Pendidikan', icon: FileBarChart },
    { id: 'spmi', label: 'SPMI', icon: CheckSquare },
    { id: 'ksp', label: 'KSP', icon: BookOpen },
    { id: 'iso', label: 'ISO 9001:2015', icon: CheckCircle2 },
    { id: 'akreditasi', label: 'Akreditasi', icon: ShieldCheck },
  ];

  return (
    <div className="p-4 md:p-10 lg:px-14 lg:py-10 max-w-[1400px] mx-auto font-sans text-gray-900 h-full flex flex-col">
      <header className="shrink-0 mb-8 border-b border-gray-100 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <h1 className="text-[44px] font-sans font-black  leading-none mb-3">Standar Nasional Pendidikan (SNP)</h1>
           <p className="text-sm font-mono tracking-widest text-blue-600 uppercase font-bold">
             Asesmen & Evaluasi Komprehensif Berbasis Data untuk Akreditasi Mutu Global
           </p>
        </div>
        <div className="flex items-center gap-4 bg-white p-3 border border-gray-100 shadow-sm no-print">
           <select className="p-2 border border-gray-200 text-sm font-bold uppercase tracking-wider bg-white outline-none focus:border-gray-200" value={jenjang} onChange={e => setJenjang(e.target.value)}>
              <option value="">-- Jenjang --</option>
              <option value="PAUD">PAUD</option>
              <option value="SD">SD</option>
              <option value="SMP">SMP</option>
              <option value="SMA">SMA</option>
              <option value="SMK">SMK</option>
              <option value="SLB">SLB</option>
           </select>
           <select className="p-2 border border-gray-200 text-sm font-bold uppercase tracking-wider bg-white outline-none focus:border-gray-200" value={jenisSekolah} onChange={e => setJenisSekolah(e.target.value)}>
              <option value="">-- Jenis Sekolah --</option>
              <option value="Umum">Umum</option>
              <option value="Keagamaan">Keagamaan / Madrasah</option>
              <option value="Khusus">Khusus</option>
           </select>
        </div>
      </header>
      
      <div id="printArea" className="flex-1 overflow-y-auto pr-3 pb-12 print-area w-full space-y-6">
        {tabs.map(tab => (
          <div key={tab.id} className="bg-white border border-gray-100 shadow-sm">
            <button
              onClick={() => toggleSection(tab.id)}
              className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <tab.icon size={20} className="text-gray-500" />
                <h2 className="font-semibold text-gray-900 font-sans">{tab.label}</h2>
              </div>
              <ChevronRight size={20} className={`transform transition-transform text-gray-500 ${expandedSections[tab.id] ? 'rotate-90' : ''}`} />
            </button>
            
            {expandedSections[tab.id] && (
              <div className="p-6 md:p-8 space-y-6 border-t border-gray-100">
                 {tab.id === 'adiwiyata' && <AdiwiyataWizard jenjang={jenjang} jenisSekolah={jenisSekolah} />}
                 {tab.id === 'sra' && <SraWizard jenjang={jenjang} jenisSekolah={jenisSekolah} />}
                 {tab.id === 'ssk' && <SskWizard jenjang={jenjang} jenisSekolah={jenisSekolah} />}
                 {tab.id === 'rapor' && <RaporWizard jenjang={jenjang} jenisSekolah={jenisSekolah} />}
                 {tab.id === 'iso' && <IsoWizard jenjang={jenjang} jenisSekolah={jenisSekolah} />}
                 {tab.id === 'spmi' && <SpmiWizard jenjang={jenjang} jenisSekolah={jenisSekolah} />}
                 {tab.id === 'ksp' && <KspWizard jenjang={jenjang} jenisSekolah={jenisSekolah} />}
                 {tab.id === 'akreditasi' && <AkreditasiWizard jenjang={jenjang} jenisSekolah={jenisSekolah} />}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}



