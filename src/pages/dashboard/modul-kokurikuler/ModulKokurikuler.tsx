import React, { useState, useEffect } from 'react';
import ModelSelector from '@/components/ModelSelector';
import { BookOpen, CheckCircle, Sparkles, Printer, Loader2, Save, ChevronUp, ChevronDown } from 'lucide-react';
import { GoogleGenAI } from '@/lib/genai';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { marked } from 'marked';
import PrintSupportModal from '@/components/PrintSupportModal';
import AIVisualGenerator from '@/components/AIVisualGenerator';
import PDFRemixUpload from '@/components/PDFRemixUpload';
import { educationLevels, phaseClassMap, subjectsByLevel, topicsBySubject } from '@/lib/constants';
import { useAuth } from '@/context/AuthContext';
import { getWatermarkHtml, universalPrint } from '@/lib/print';
import AIAssistedInput from '@/components/AIAssistedInput';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import LogoUploader from '@/components/LogoUploader';

const TEMA_OPTIONS = [
  "Literasi dan Numerasi",
  "Kesehatan dan Gaya Hidup Sehat",
  "Lingkungan Hidup dan Keberlanjutan",
  "Kewirausahaan",
  "Kewargaan dan Kebhinekaan",
  "Digital Safety dan Literasi Digital",
  "Kreativitas dan Inovasi",
  "Kepemimpinan dan Kolaborasi",
  "Budaya dan Kearifan Lokal",
  "Pencegahan Perundungan dan Kekerasan",
  "Keselamatan dan Mitigasi Bencana",
  "Penguatan Karakter dan Etika Sosial",
  "Generasi sehat dan bugar",
  "Peduli dan berbagi",
  "Aku cinta Indonesia",
  "Hidup hemat dan produktif",
  "Berkarya untuk sesama dan bangsa"
];

const SUBTEMA_OPTIONS: Record<string, string[]> = {
  keimanan: ["peduli dan berbagi", "Aku dan Sang Pencipta", "kegiatan keagamaan", "jurnal ibadah", "catatan syukur"],
  kewargaan: ["Hidup bersama dalam keberagaman", "Aku bagian dari bangsa ini", "Diskusi toleransi", "Simulasi pemilu mini", "Kegiatan gotong royong"],
  penalaranKritis: ["Menyelesaikan masalah", "Fakta dan opini", "Aku berpikir", "Proyek mini riset", "Analisis berita", "Eksperimen sederhana"],
  kreativitas: ["Aku bisa berkarya", "Inovasi untuk sekitar", "Karya seni", "Pameran ide", "Karya tulis kreatif", "Desain poster"],
  kolaborasi: ["Kerja tim itu asyik", "Bersama kita bisa", "Proyek kelompok", "Games kerja sama", "Forum diskusi"],
  kemandirian: ["Mengatur waktuku", "Aku bertanggung jawab", "Jurnal manajemen waktu", "Tantangan pribadi harian", "Penjadwalan mingguan"],
  kesehatan: ["Hidup sehat", "Aku sayang tubuhku", "Jadwal olahraga bersama", "Pojok sehat", "Kampanye gizi"],
  komunikasi: ["Bicara yang baik", "Aku bisa menyampaikan pendapat", "Debat kelompok", "Kegiatan presentasi", "Cerita pengalaman"]
};


const TAKSONOMI_BLOOM = [
  'C1: Mengingat (Remembering)',
  'C2: Memahami (Understanding)',
  'C3: Menerapkan (Applying)',
  'C4: Menganalisis (Analyzing)',
  'C5: Mengevaluasi (Evaluating)',
  'C6: Menciptakan (Creating)',
  'Campuran (Sesuai Kurikulum Merdeka)'
];

const TAKSONOMI_SOLO = [
  'Pra-struktural',
  'Uni-struktural',
  'Multi-struktural',
  'Relasional',
  'Abstrak Diperluas',
  'HOTS (Higher Order Thinking Skills)',
  'Kombinasi'
];

export default function ModulKokurikuler() {
  const { consumeToken } = useAuth();
  const { profile } = useAuth();
  const isPremium = (profile?.tier || '').toLowerCase() === 'titan' || ['owner', 'admin'].includes((profile?.role || '').toLowerCase());
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedModel, setSelectedModel] = React.useState<string>('openai');
  const [tema, setTema] = useState('');
  const [praktik, setPraktik] = useState('');
  const [lingkungan, setLingkungan] = useState('');
  const [namaGuru, setNamaGuru] = useState('');
  const [jenisNipGuru, setJenisNipGuru] = useState('NIP');
  const [nipGuru, setNipGuru] = useState('');
  const [namaSekolah, setNamaSekolah] = useState('');
  const [jenisSekolah, setJenisSekolah] = useState('Negeri');
  const [kepalaSekolah, setKepalaSekolah] = useState('');
  const [jenisNipKepalaSekolah, setJenisNipKepalaSekolah] = useState('NIP');
  const [nipKepalaSekolah, setNipKepalaSekolah] = useState('');
  const [eduLevel, setEduLevel] = useState('sd');
  const [fase, setFase] = useState('A');
  const [kelas, setKelas] = useState('1');
  const [tahunAjaran, setTahunAjaran] = useState('2024/2025');
  const [mapel, setMapel] = useState('bahasa-indonesia');
  const [topikMateri, setTopikMateri] = useState('');
  const [isCustomTopik, setIsCustomTopik] = useState(false);
  const [kerangkaTaksonomi, setKerangkaTaksonomi] = useState('bloom');
  const [levelTaksonomi, setLevelTaksonomi] = useState('Campuran (Sesuai Kurikulum Merdeka)');
  
  const [dimensiProfil, setDimensiProfil] = useState({
    keimanan: false,
    kewargaan: false,
    penalaranKritis: false,
    kreativitas: false,
    kolaborasi: false,
    kemandirian: false,
    kesehatan: false,
    komunikasi: false
  });

  const [subtema, setSubtema] = useState('');
  const [isCustomSubtema, setIsCustomSubtema] = useState(false);
  const [pemanfaatanDigital, setPemanfaatanDigital] = useState('');

  const [gerakan7Kaih, setGerakan7Kaih] = useState({
    beribadah: false,
    berolahraga: false,
    bermasyarakat: false,
    gemarBelajar: false,
    bangunPagi: false,
    tidurTepatWaktu: false,
    makanSehat: false
  });

  const [kemitraan, setKemitraan] = useState({
    satuanPendidikan: false,
    keluarga: false,
    masyarakat: false
  });

  const [activeAsesmenTab, setActiveAsesmenTab] = useState('formatif');
  
  const [teknikFormatif, setTeknikFormatif] = useState({
    observasi: false,
    checklist: false
  });

  const [teknikSumatif, setTeknikSumatif] = useState('');
  const [isCustomSumatif, setIsCustomSumatif] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    data: true,
    konten: false,
    strategi: false,
    lampiran: false,
    asesmen: false
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [remixText, setRemixText] = useState('');
  const [hasInklusi, setHasInklusi] = useState(false);
  const [jumlahInklusi, setJumlahInklusi] = useState('');

  // Premium appendix states
  const [generateCover, setGenerateCover] = useState(false);
  const [generateRubrik, setGenerateRubrik] = useState(false);
  const [generateRancanganSesi, setGenerateRancanganSesi] = useState(false);
  const [alokasiJP, setAlokasiJP] = useState('');
  const [jumlahPertemuan, setJumlahPertemuan] = useState('');

  const [useLogo, setUseLogo] = useLocalStorage<boolean>('ModulKokurikuler_useLogo', false);
  const [logoUrl, setLogoUrl] = useLocalStorage<string | null>('ModulKokurikuler_logoUrl', null);
  const [formatPerangkat, setFormatPerangkat] = useLocalStorage<'standar'|'kemenag'>('ModulKokurikuler_formatPerangkat', 'standar');

  useEffect(() => {
    const phases = phaseClassMap[eduLevel]?.phases || [];
    const firstPhase = phases[0]?.id || '';
    
    const classes = phaseClassMap[eduLevel]?.classes[firstPhase] || [];
    const firstClass = classes[0]?.id || '';

    const subjects = subjectsByLevel[eduLevel] || [];
    const firstSubject = subjects[0]?.id || '';
    
    const topics = topicsBySubject[firstSubject] || topicsBySubject['default'];
    const firstTopic = topics[0] || '';

    setFase(firstPhase);
    setKelas(firstClass);
    setMapel(firstSubject);
    setTopikMateri(firstTopic);
    setIsCustomTopik(false);
  }, [eduLevel]);

  useEffect(() => {
    const classes = phaseClassMap[eduLevel]?.classes[fase] || [];
    setKelas(classes[0]?.id || '');
  }, [fase, eduLevel]);

  useEffect(() => {
    const topics = topicsBySubject[mapel] || topicsBySubject['default'];
    setTopikMateri(topics[0] || '');
    setIsCustomTopik(false);
  }, [mapel]);

  const handleKemitraanChange = (key: keyof typeof kemitraan) => {
    setKemitraan(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleDimensiChange = (key: keyof typeof dimensiProfil) => {
    setDimensiProfil(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleGerakanChange = (key: keyof typeof gerakan7Kaih) => {
    setGerakan7Kaih(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleTeknikChange = (key: keyof typeof teknikFormatif) => {
    setTeknikFormatif(prev => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    if (profile) {
      setNamaGuru(profile.displayName || '');
      setNipGuru(profile.nip || '');
      setEduLevel(profile.jenjang?.toLowerCase() || 'sd');
    }
  }, [profile]);

  const generateModul = async () => {
    if (!tema) {
      setError('Silakan pilih tema terlebih dahulu.');
      return;
    }

    setIsGenerating(true);
setError('');
    setResult(null);
    const canGenerate = await consumeToken();
    if (!canGenerate) {
      setIsGenerating(false);
setError('');
    setResult(null);
      return;
    }

    try {
      const ai = new GoogleGenAI({});
      
      const subjectLabel = subjectsByLevel[eduLevel]?.find(s => s.id === mapel)?.label || mapel;
      const faseLabel = phaseClassMap[eduLevel]?.phases.find(p => p.id === fase)?.label || fase;
      const kelasLabel = phaseClassMap[eduLevel]?.classes[fase]?.find(c => c.id === kelas)?.label || kelas;
      const jenjangLabel = educationLevels.find(l => l.id === eduLevel)?.label || eduLevel;

      let lampiranInstructions = '';
      if (generateCover && isPremium) {
        lampiranInstructions += `\nM. LAMPIRAN - COVER MODUL KOKURIKULER (Buat format cover modul kokurikuler yang menarik meliputi: Judul Modul, Tema Kegiatan, Sasaran Kelas/Fase, Tahun Pelajaran, Nama Penyusun, dan Nama Sekolah).`;
      }
      if (generateRubrik && isPremium) {
        lampiranInstructions += `\nN. LAMPIRAN - RUBRIK PENILAIAN DESKRIPTIF (Buat tabel rubrik penilaian dengan 3 tingkatan/level pencapaian: Mulai Berkembang, Berkembang, Sangat Berkembang. Berikan deskripsi indikator pencapaian konkret yang mendalam untuk setiap dimensi profil kelulusan yang diperkuat).`;
      }
      if (generateRancanganSesi && isPremium) {
        lampiranInstructions += `\nO. LAMPIRAN - RANCANGAN ALUR SESI PERTEMUAN (Buat tabel rancangan sesi secara sistematis sebanyak ${jumlahPertemuan || 4} pertemuan, dengan total alokasi waktu ${alokasiJP || '16'} JP. Setiap sesi dijabarkan alur kegiatannya, alokasi waktu per sesi, aktivitas spesifik, serta sarana prasarana yang diperlukan).`;
      }

      const prompt = `Pastikan dokumen ini disusun sesuai standar terbaru Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi (Kemendikbudristek) serta Kementerian Agama (Kemenag) Republik Indonesia, mengikuti panduan Kurikulum Merdeka yang mengikat.

Buatkan Modul Kokurikuler yang komprehensif berdasarkan data berikut. Ikuti format dan struktur sesuai dengan Panduan Kokurikuler 2025 terbaru dari Kemendikbudristek (seperti yang tercantum dalam panduan resmi). Pastikan semua bagian terisi secara otomatis dan komprehensif sesuai dengan kriteria pilihan pengunjung.

Data pengunjung:
Tema: ${tema}
Subtema: ${subtema}
Dimensi Profil Lulusan: ${Object.entries(dimensiProfil).filter(([_, v]) => v).map(([k]) => k).join(', ')}
Mata Pelajaran: ${subjectLabel}
Topik/Materi: ${topikMateri}
Fase/Kelas: ${faseLabel} / ${kelasLabel}
Jenjang: ${jenjangLabel}
Praktik Pedagogis: ${praktik}
Kondisi Lingkungan: ${lingkungan}
Pemanfaatan Digital: ${pemanfaatanDigital}
Gerakan 7 KAIH: ${Object.entries(gerakan7Kaih).filter(([_, v]) => v).map(([k]) => k).join(', ')}
Nama Guru: ${namaGuru}
${jenisNipGuru} Guru: ${nipGuru}
Sekolah: ${namaSekolah} (${jenisSekolah})
Kepala Sekolah: ${kepalaSekolah}
${jenisNipKepalaSekolah} Kepala Sekolah: ${nipKepalaSekolah}
Tahun Ajaran: ${tahunAjaran}
${hasInklusi ? `Terdapat Anak Inklusi: Ya, berjumlah ${jumlahInklusi} siswa. Pastikan hasil generate menyediakan adaptasi atau modifikasi untuk anak inklusi.` : ''}
Kemitraan: ${Object.entries(kemitraan).filter(([_, v]) => v).map(([k]) => k).join(', ')}
Asesmen Formatif: ${Object.entries(teknikFormatif).filter(([_, v]) => v).map(([k]) => k).join(', ')}
Asesmen Sumatif: ${teknikSumatif}
${alokasiJP ? `Alokasi Waktu: ${alokasiJP}` : ''}
${jumlahPertemuan ? `Jumlah Pertemuan: ${jumlahPertemuan}` : ''}

${remixText ? `INSTRUKSI REMIX:
Gunakan teks referensi berikut sebagai dasar utama pembuatan Modul Kokurikuler. Remix dan kembangkan konten ini agar sesuai dengan kurikulum merdeka dan target audiens di atas:
---
${remixText}
---` : ''}

Konteks Kurikulum Merdeka & Pedagogi (SANGAT PENTING):
1. Taksonomi/Pendekatan Kognitif: ${kerangkaTaksonomi === 'bloom' ? 'Taksonomi Bloom' : 'Taksonomi SOLO'} pada level: ${levelTaksonomi}.
   - Seimbangkan LOTS (C1-C2) dan HOTS (C4-C6) sesuai target jika menggunakan Bloom.
   - Integrasikan Dimensi Pengetahuan: Faktual, Konseptual, Prosedural, dan Metakognitif.
   - PENTING: JANGAN tampilkan label "C1", "C2", dll. secara eksplisit pada hasil akhir, cukup terapkan dalam kata kerja operasional dan aktivitas.
2. Tujuan Pembelajaran: Rumuskan tujuan pembelajaran secara otomatis berdasarkan pilihan pengunjung. JANGAN mencantumkan label (ABCD) pada hasil akhir.

Struktur Modul Kokurikuler 2025 harus mencakup bagian-bagian berikut secara berurutan:
A. IDENTITAS (Nama Satuan Pendidikan, Jenjang, Kelas/Fase, Semester, Tahun Ajaran, Bentuk Kokurikuler, Tema Kegiatan, Alokasi Waktu, Mata Pelajaran Terintegrasi, Lokasi Kegiatan)
B. ANALISIS SATUAN PENDIDIKAN (Kebutuhan Belajar Murid, Sumber Daya yang Dimiliki, Kondisi Kontekstual & Sosial, Rasional Pemilihan Dimensi Profil Lulusan)
C. DIMENSI PROFIL LULUSAN YANG DIPERKUAT (Tabel: No, Dimensi, Alasan Pemilihan Dimensi)
D. TUJUAN PEMBELAJARAN
E. RANGKAIAN KEGIATAN (Tabel: No, Kegiatan, JP)
F. PRAKTIK PEDAGOGIS (Model, Strategi, Pendekatan, Berkesadaran, Bermakna, Menggembirakan)
G. LINGKUNGAN BELAJAR (Fisik, Sosial, Psikologis, Akademik)
H. KEMITRAAN PEMBELAJARAN (Tabel: Mitra, Pihak yang Terlibat, Peran)
I. PEMANFAATAN TEKNOLOGI DIGITAL
J. ASESMEN (Jenis Asesmen Formatif, Contoh Format Anekdotal, Contoh Format Jurnal Harian, Jenis Asesmen Sumatif, Pelaporan Rapor)
K. LKPD JURNAL HARIAN & INSTRUMEN REFLEKSI (Lembar Kerja Peserta Didik, Jurnal Harian, Target Kebiasaan, Refleksi Mingguan, Lembar Rencana Aksi, Lembar Sesi Bercerita, Lembar Catatan Outbond, Refleksi Akhir Semester, Kesepakatan Aksi Nyata)
L. INSTRUMEN REFLEKSI GURU (Refleksi Umum Kegiatan, Refleksi Berdasarkan Prinsip Pembelajaran, Refleksi Perkembangan Dimensi Profil Lulusan, Evaluasi Kelengkapan Jurnal Harian, Rekomendasi untuk Semester Mendatang)
${lampiranInstructions}

ATURAN KETAT PENULISAN & FORMAT (SANGAT PENTING):
1. JANGAN SEKALI-KALI MEMUAT singkatan "P5" atau istilah "Proyek Penguatan Profil Pelajar Pancasila" maupun "Projek Penguatan Profil Pelajar Pancasila" pada seluruh bagian dokumen. Semua istilah tersebut WAJIB diganti dengan "Kokurikuler", "Kegiatan Kokurikuler", atau "Modul Kokurikuler".
2. Tuliskan teks dalam bahasa Indonesia yang baku, formal, bebas typo, dan informatif.
3. Gunakan format Markdown yang rapi dan profesional. Buat tabel menggunakan sintaks Markdown.`;

      const response = await ai.models.generateContent({
        model: selectedModel,
        contents: prompt,
      });

      setResult(response.text || '');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Gagal menghasilkan modul.');
    } finally {
      setIsGenerating(false);
    }
  };

  const printModul = () => {
    if (!result) return;
    const printContent = document.getElementById('modul-kokurikuler-print')?.innerHTML || '';
    universalPrint(`
        ${printContent}
      `, `Modul Kokurikuler - ${tema}`);
  };

  return (
    <div className="max-w-4xl lg:max-w-6xl xl:max-w-7xl mx-auto space-y-6">
      <div className="gen-card bg-red-50  p-6 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-500/20 rounded-xl">
            <BookOpen className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-black">Modul Kokurikuler</h2>
            <p className="text-sm text-gray-600">Buat modul kokurikuler dengan bantuan AI</p>
          </div>
        </div>
        </div>

          <div className="bg-gray-100 p-1.5 rounded-xl flex items-center mb-6">
            <button
              onClick={() => setFormatPerangkat('standar')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-300 ${formatPerangkat === 'standar' ? 'bg-white text-blue-700 shadow-md transform scale-[1.02]' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-200'}`}
            >
              Standar
            </button>
            <button
              onClick={() => setFormatPerangkat('kemenag')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-300 ${formatPerangkat === 'kemenag' ? 'bg-blue-50 text-blue-700 shadow-md border border-blue-200 transform scale-[1.02]' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-200'}`}
            >
              Kemenag
            </button>
          </div>

        <div className="space-y-6">
          {/* Identitas */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <button 
              onClick={() => toggleSection('data')}
              className="w-full flex items-center justify-between p-6 bg-white hover:bg-gray-50 transition-colors"
            >
              <h4 className="font-semibold text-amber-600 flex items-center gap-2">👨‍🏫 Data Guru & Sekolah</h4>
              {expandedSections['data'] ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </button>
            {expandedSections['data'] && (
              <div className="p-6 pt-0 border-t border-gray-100">
                <div className="space-y-3">
                  <AIAssistedInput type="text" placeholder="Nama Guru" value={namaGuru} onChange={e => setNamaGuru(e.target.value)} className="w-full bg-white border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-amber-500 transition-all" />
                  <div className="flex gap-2">
                    <select value={jenisNipGuru} onChange={e => setJenisNipGuru(e.target.value)} className="w-1/3 bg-white border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-amber-500 transition-all">
                      <option value="NIP">NIP</option>
                      <option value="NUPTK">NUPTK</option>
                      <option value="NIY">NIY</option>
                      <option value="NRG">NRG</option>
                      <option value="NPK">NPK</option>
                    </select>
                    <AIAssistedInput type="text" placeholder="Nomor Induk Guru" value={nipGuru} onChange={e => setNipGuru(e.target.value)} className="w-2/3 bg-white border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-amber-500 transition-all" />
                  </div>
                  <AIAssistedInput type="text" placeholder="Nama Sekolah" value={namaSekolah} onChange={e => setNamaSekolah(e.target.value)} className="w-full bg-white border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-amber-500 transition-all" />
                  <select value={jenisSekolah} onChange={e => setJenisSekolah(e.target.value)} className="w-full bg-white border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-amber-500 transition-all">
                    <option value="Negeri">Negeri</option>
                    <option value="Swasta">Swasta</option>
                    <option value="Islam Terpadu">Islam Terpadu</option>
                  </select>
                  <AIAssistedInput type="text" placeholder="Nama Kepala Sekolah" value={kepalaSekolah} onChange={e => setKepalaSekolah(e.target.value)} className="w-full bg-white border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-amber-500 transition-all" />
                  <div className="flex gap-2">
                    <select value={jenisNipKepalaSekolah} onChange={e => setJenisNipKepalaSekolah(e.target.value)} className="w-1/3 bg-white border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-amber-500 transition-all">
                      <option value="NIP">NIP</option>
                      <option value="NUPTK">NUPTK</option>
                      <option value="NIY">NIY</option>
                      <option value="NRG">NRG</option>
                      <option value="NPK">NPK</option>
                    </select>
                    <AIAssistedInput type="text" placeholder="Nomor Induk Kepala Sekolah" value={nipKepalaSekolah} onChange={e => setNipKepalaSekolah(e.target.value)} className="w-2/3 bg-white border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-amber-500 transition-all" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Jenjang</label>
                      <select value={eduLevel} onChange={e => setEduLevel(e.target.value)} className="w-full bg-white border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-amber-500 transition-all">
                        {educationLevels.map(level => (
                          <option key={level.id} value={level.id}>{level.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Fase</label>
                        <select value={fase} onChange={e => setFase(e.target.value)} className="w-full bg-white border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-amber-500 transition-all">
                          {phaseClassMap[eduLevel]?.phases.map(p => (
                            <option key={p.id} value={p.id}>{p.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Kelas</label>
                        <select value={kelas} onChange={e => setKelas(e.target.value)} className="w-full bg-white border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-amber-500 transition-all">
                          {phaseClassMap[eduLevel]?.classes[fase]?.map(c => (
                            <option key={c.id} value={c.id}>{c.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Tahun Ajaran</label>
                    <select value={tahunAjaran} onChange={e => setTahunAjaran(e.target.value)} className="w-full bg-white border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-amber-500 transition-all">
                      <option value="2023/2024">2023/2024</option>
                      <option value="2024/2025">2024/2025</option>
                      <option value="2025/2026">2025/2026</option>
                      <option value="2026/2027">2026/2027</option>
                    </select>
                  </div>

                  <div className="mt-4">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Mata Pelajaran</label>
                    <select value={mapel} onChange={e => setMapel(e.target.value)} className="w-full bg-white border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-amber-500 transition-all">
                      {subjectsByLevel[eduLevel]?.map(sub => (
                        <option key={sub.id} value={sub.id}>{sub.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Topik/Materi</label>
                    <select 
                      value={isCustomTopik ? 'lainnya' : topikMateri} 
                      onChange={e => {
                        const val = e.target.value;
                        if (val === 'lainnya') {
                          setIsCustomTopik(true);
                          setTopikMateri('');
                        } else {
                          setIsCustomTopik(false);
                          setTopikMateri(val);
                        }
                      }} 
                      className="w-full bg-white border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-amber-500 transition-all"
                    >
                      {(topicsBySubject[mapel] || topicsBySubject['default']).map((topic, idx) => (
                        <option key={idx} value={topic}>{topic}</option>
                      ))}
                      <option value="lainnya">Lainnya (+)</option>
                    </select>
                    {isCustomTopik && (
                      <AIAssistedInput type="text" 
                        placeholder="Masukkan Topik/Materi secara manual..." 
                        value={topikMateri} 
                        onChange={e => setTopikMateri(e.target.value)} 
                        className="w-full bg-white border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-amber-500 transition-all mt-3" 
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Tingkatan Kognitif (Taksonomi Bloom)</label>
                    <select value={levelTaksonomi} onChange={e => setLevelTaksonomi(e.target.value)} className="w-full bg-white border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-amber-500 transition-all">
                      <option value="C1: Mengingat (Remembering)">C1: Mengingat (Remembering)</option>
                      <option value="C2: Memahami (Understanding)">C2: Memahami (Understanding)</option>
                      <option value="C3: Menerapkan (Applying)">C3: Menerapkan (Applying)</option>
                      <option value="C4: Menganalisis (Analyzing)">C4: Menganalisis (Analyzing)</option>
                      <option value="C5: Mengevaluasi (Evaluating)">C5: Mengevaluasi (Evaluating)</option>
                      <option value="C6: Menciptakan (Creating)">C6: Menciptakan (Creating)</option>
                      <option value="Campuran (Sesuai Kurikulum Merdeka)">Campuran (Sesuai Kurikulum Merdeka)</option>
                    </select>
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={hasInklusi}
                        onChange={(e) => setHasInklusi(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-500 focus:ring-offset-white bg-white"
                      />
                      <span className="text-sm font-medium text-gray-700">Terdapat Anak Inklusi</span>
                    </label>
                    
                    {hasInklusi && (
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Jumlah Siswa Inklusi</label>
                        <input 
                          type="number"
                          min="1"
                          className="w-full bg-white border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-amber-500 transition-all"
                          placeholder="Masukkan jumlah siswa inklusi..."
                          value={jumlahInklusi}
                          onChange={(e) => setJumlahInklusi(e.target.value)}
                        />
                      </div>
                    )}
                  </div>

                  <LogoUploader useLogo={useLogo} setUseLogo={setUseLogo} logoUrl={logoUrl} setLogoUrl={setLogoUrl} />

                  <PDFRemixUpload 
                    onTextExtracted={(text) => setRemixText(text)}
                    label="Remix dari PDF (Opsional)"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Konten Modul */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <button 
              onClick={() => toggleSection('konten')}
              className="w-full flex items-center justify-between p-6 bg-white hover:bg-gray-50 transition-colors"
            >
              <h4 className="font-semibold text-amber-600 flex items-center gap-2">🏕️ Konten Modul</h4>
              {expandedSections['konten'] ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </button>
            {expandedSections['konten'] && (
              <div className="p-6 pt-0 border-t border-gray-100">
                <div className="space-y-4">
                  {/* Tema */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pilih tema</label>
                    <select 
                      value={tema}
                      onChange={(e) => setTema(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="">Pilih tema</option>
                      {TEMA_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  {/* Dimensi Profil Lulusan */}
                  <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                    <label className="block text-sm font-medium text-gray-700 mb-3">Dimensi Profil Lulusan</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        { id: 'keimanan', label: 'Keimanan dan ketakwaan terhadap Tuhan YME' },
                        { id: 'kewargaan', label: 'Kewargaan' },
                        { id: 'penalaranKritis', label: 'Penalaran Kritis' },
                        { id: 'kreativitas', label: 'Kreativitas' },
                        { id: 'kolaborasi', label: 'Kolaborasi' },
                        { id: 'kemandirian', label: 'Kemandirian' },
                        { id: 'kesehatan', label: 'Kesehatan' },
                        { id: 'komunikasi', label: 'Komunikasi' }
                      ].map(item => (
                        <label key={item.id} className="flex items-center gap-3 cursor-pointer group">
                          <div className="relative flex items-center justify-center">
                            <input 
                              type="checkbox" 
                              checked={dimensiProfil[item.id as keyof typeof dimensiProfil]}
                              onChange={() => handleDimensiChange(item.id as keyof typeof dimensiProfil)}
                              className="peer sr-only" 
                            />
                            <div className="w-5 h-5 border-2 border-slate-500 rounded bg-white peer-checked:bg-blue-500 peer-checked:border-blue-500 transition-all"></div>
                            <CheckCircle className="absolute w-3.5 h-3.5 text-black opacity-0 peer-checked:opacity-100 transition-opacity" />
                          </div>
                          <span className="text-sm text-gray-700 group-hover:text-black transition-colors">{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Subtema */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Subtema</label>
                    <select 
                      value={isCustomSubtema ? 'lainnya' : subtema}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'lainnya') {
                          setIsCustomSubtema(true);
                          setSubtema('');
                        } else {
                          setIsCustomSubtema(false);
                          setSubtema(val);
                        }
                      }}
                      className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="">Pilih subtema</option>
                      {Array.from(new Set(
                        Object.entries(dimensiProfil)
                          .filter(([_, isSelected]) => isSelected)
                          .flatMap(([key]) => SUBTEMA_OPTIONS[key] || [])
                      )).map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                      <option value="lainnya">Lainnya (+)</option>
                    </select>
                    {isCustomSubtema && (
                      <AIAssistedInput type="text" 
                        placeholder="Masukkan Subtema secara manual..." 
                        value={subtema} 
                        onChange={e => setSubtema(e.target.value)} 
                        className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all mt-3" 
                      />
                    )}
                  </div>

                  {/* Gerakan 7 KAIH */}
                  <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                    <label className="block text-sm font-medium text-gray-700 mb-3">Gerakan 7 KAIH</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        { id: 'beribadah', label: 'Beribadah' },
                        { id: 'berolahraga', label: 'Berolahraga' },
                        { id: 'bermasyarakat', label: 'Bermasyarakat' },
                        { id: 'gemarBelajar', label: 'Gemar Belajar' },
                        { id: 'bangunPagi', label: 'Bangun Pagi' },
                        { id: 'tidurTepatWaktu', label: 'Tidur Tepat Waktu' },
                        { id: 'makanSehat', label: 'Makan Sehat dan Bergizi' }
                      ].map(item => (
                        <label key={item.id} className="flex items-center gap-3 cursor-pointer group">
                          <div className="relative flex items-center justify-center">
                            <input 
                              type="checkbox" 
                              checked={gerakan7Kaih[item.id as keyof typeof gerakan7Kaih]}
                              onChange={() => handleGerakanChange(item.id as keyof typeof gerakan7Kaih)}
                              className="peer sr-only" 
                            />
                            <div className="w-5 h-5 border-2 border-slate-500 rounded bg-white peer-checked:bg-blue-500 peer-checked:border-blue-500 transition-all"></div>
                            <CheckCircle className="absolute w-3.5 h-3.5 text-black opacity-0 peer-checked:opacity-100 transition-opacity" />
                          </div>
                          <span className="text-sm text-gray-700 group-hover:text-black transition-colors">{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Pemanfaatan Digital */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pemanfaatan Digital</label>
                    <AIAssistedInput type="text" 
                      placeholder="Contoh: Penggunaan Canva untuk poster, Google Forms untuk survei..." 
                      value={pemanfaatanDigital} 
                      onChange={e => setPemanfaatanDigital(e.target.value)} 
                      className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Strategi & Lingkungan */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <button 
              onClick={() => toggleSection('strategi')}
              className="w-full flex items-center justify-between p-6 bg-white hover:bg-gray-50 transition-colors"
            >
              <h4 className="font-semibold text-amber-600 flex items-center gap-2">⚙️ Strategi & Lingkungan</h4>
              {expandedSections['strategi'] ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </button>
            {expandedSections['strategi'] && (
              <div className="p-6 pt-0 border-t border-gray-100">
                <div className="space-y-4">
                  {/* Praktik Pedagogis */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Praktik Pedagogis</label>
                    <select 
                      value={praktik}
                      onChange={(e) => setPraktik(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="">Pilih praktik</option>
                      <option value="Pembelajaran Berbasis Proyek (PjBL)">Pembelajaran Berbasis Proyek (PjBL)</option>
                      <option value="Pembelajaran Berbasis Masalah (PBL)">Pembelajaran Berbasis Masalah (PBL)</option>
                      <option value="Inkuiri">Inkuiri</option>
                      <option value="Diskusi Kelompok">Diskusi Kelompok</option>
                      <option value="Bermain Peran (Role Play)">Bermain Peran (Role Play)</option>
                      {formatPerangkat === 'kemenag' && <option value="Pendekatan Kurikulum Berbasis Cinta">Pendekatan Kurikulum Berbasis Cinta</option>}
                    </select>
                  </div>

                  {/* Kondisi Lingkungan */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Kondisi Lingkungan</label>
                    <select 
                      value={lingkungan}
                      onChange={(e) => setLingkungan(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="">Pilih lingkungan</option>
                      <option value="Dalam Ruangan (Indoor)">Dalam Ruangan (Indoor)</option>
                      <option value="Luar Ruangan (Outdoor)">Luar Ruangan (Outdoor)</option>
                      <option value="Daring (Online)">Daring (Online)</option>
                      <option value="Campuran (Blended)">Campuran (Blended)</option>
                    </select>
                  </div>

                  {/* Kemitraan Pembelajaran */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Kemitraan Pembelajaran</label>
                    <div className="flex flex-wrap gap-6">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative flex items-center justify-center">
                          <input 
                            type="checkbox" 
                            checked={kemitraan.satuanPendidikan}
                            onChange={() => handleKemitraanChange('satuanPendidikan')}
                            className="peer sr-only" 
                          />
                          <div className="w-5 h-5 border-2 border-slate-500 rounded bg-white peer-checked:bg-blue-500 peer-checked:border-blue-500 transition-all"></div>
                          <CheckCircle className="absolute w-3.5 h-3.5 text-black opacity-0 peer-checked:opacity-100 transition-opacity" />
                        </div>
                        <span className="text-gray-700 group-hover:text-black transition-colors">Satuan Pendidikan</span>
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative flex items-center justify-center">
                          <input 
                            type="checkbox" 
                            checked={kemitraan.keluarga}
                            onChange={() => handleKemitraanChange('keluarga')}
                            className="peer sr-only" 
                          />
                          <div className="w-5 h-5 border-2 border-slate-500 rounded bg-white peer-checked:bg-blue-500 peer-checked:border-blue-500 transition-all"></div>
                          <CheckCircle className="absolute w-3.5 h-3.5 text-black opacity-0 peer-checked:opacity-100 transition-opacity" />
                        </div>
                        <span className="text-gray-700 group-hover:text-black transition-colors">Keluarga</span>
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative flex items-center justify-center">
                          <input 
                            type="checkbox" 
                            checked={kemitraan.masyarakat}
                            onChange={() => handleKemitraanChange('masyarakat')}
                            className="peer sr-only" 
                          />
                          <div className="w-5 h-5 border-2 border-slate-500 rounded bg-white peer-checked:bg-blue-500 peer-checked:border-blue-500 transition-all"></div>
                          <CheckCircle className="absolute w-3.5 h-3.5 text-black opacity-0 peer-checked:opacity-100 transition-opacity" />
                        </div>
                        <span className="text-gray-700 group-hover:text-black transition-colors">Masyarakat</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Lampiran Modul (Premium Only) */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-4 border-amber-500/30">
            <button 
              onClick={() => toggleSection('lampiran')}
              className="w-full flex items-center justify-between p-6 bg-white hover:bg-gray-50 transition-colors"
            >
              <h4 className="font-semibold text-amber-600 flex items-center gap-2">📂 Lampiran Modul (Premium Only)</h4>
              <div className="flex items-center gap-3">
                {!isPremium && (
                  <span className="bg-gradient-to-r from-yellow-500 to-amber-600 text-black text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider shadow">
                    🔒 Titan Only
                  </span>
                )}
                {expandedSections['lampiran'] ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
              </div>
            </button>
            {expandedSections['lampiran'] && (
              <div className="p-6 pt-0 border-t border-gray-100">
                <div className="space-y-4">
                  <p className="text-xs text-gray-600">
                    Generate lampiran tambahan otomatis untuk modul kokurikuler Anda.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <label className={`flex items-center gap-3 cursor-pointer group ${!isPremium ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <div className="relative flex items-center justify-center">
                        <input 
                          type="checkbox" 
                          checked={generateCover && isPremium}
                          disabled={!isPremium}
                          onChange={(e) => setGenerateCover(e.target.checked)}
                          className="peer sr-only" 
                        />
                        <div className="w-5 h-5 border-2 border-slate-500 rounded bg-white peer-checked:bg-amber-500 peer-checked:border-amber-500 transition-all"></div>
                        <CheckCircle className="absolute w-3.5 h-3.5 text-black opacity-0 peer-checked:opacity-100 transition-opacity" />
                      </div>
                      <span className="text-sm text-gray-700 group-hover:text-black transition-colors">Cover Modul</span>
                    </label>

                    <label className={`flex items-center gap-3 cursor-pointer group ${!isPremium ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <div className="relative flex items-center justify-center">
                        <input 
                          type="checkbox" 
                          checked={generateRubrik && isPremium}
                          disabled={!isPremium}
                          onChange={(e) => setGenerateRubrik(e.target.checked)}
                          className="peer sr-only" 
                        />
                        <div className="w-5 h-5 border-2 border-slate-500 rounded bg-white peer-checked:bg-amber-500 peer-checked:border-amber-500 transition-all"></div>
                        <CheckCircle className="absolute w-3.5 h-3.5 text-black opacity-0 peer-checked:opacity-100 transition-opacity" />
                      </div>
                      <span className="text-sm text-gray-700 group-hover:text-black transition-colors">Rubrik Deskripsi (3 Level)</span>
                    </label>

                    <label className={`flex items-center gap-3 cursor-pointer group ${!isPremium ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <div className="relative flex items-center justify-center">
                        <input 
                          type="checkbox" 
                          checked={generateRancanganSesi && isPremium}
                          disabled={!isPremium}
                          onChange={(e) => setGenerateRancanganSesi(e.target.checked)}
                          className="peer sr-only" 
                        />
                        <div className="w-5 h-5 border-2 border-slate-500 rounded bg-white peer-checked:bg-amber-500 peer-checked:border-amber-500 transition-all"></div>
                        <CheckCircle className="absolute w-3.5 h-3.5 text-black opacity-0 peer-checked:opacity-100 transition-opacity" />
                      </div>
                      <span className="text-sm text-gray-700 group-hover:text-black transition-colors">Rancangan Sesi</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Alokasi Waktu (JP)</label>
                      <input 
                        type="text"
                        placeholder="Contoh: 16 JP, 32 JP..."
                        value={alokasiJP}
                        disabled={!isPremium}
                        onChange={(e) => setAlokasiJP(e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded-lg p-2 text-xs text-black focus:border-amber-500 transition-all disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Jumlah Pertemuan</label>
                      <input 
                        type="number"
                        min="1"
                        placeholder="Contoh: 4, 8..."
                        value={jumlahPertemuan}
                        disabled={!isPremium}
                        onChange={(e) => setJumlahPertemuan(e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded-lg p-2 text-xs text-black focus:border-amber-500 transition-all disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Konfigurasi Asesmen */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <button 
              onClick={() => toggleSection('asesmen')}
              className="w-full flex items-center justify-between p-6 bg-white hover:bg-gray-50 transition-colors"
            >
              <h4 className="font-semibold text-amber-600 flex items-center gap-2">📊 Konfigurasi Asesmen</h4>
              {expandedSections['asesmen'] ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </button>
            
            {expandedSections['asesmen'] && (
              <div className="border-t border-gray-100">
                <div className="flex border-b border-gray-100">
                  <button 
                    onClick={() => setActiveAsesmenTab('formatif')}
                    className={`flex-1 py-4 text-sm font-medium transition-colors ${activeAsesmenTab === 'formatif' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
                  >
                    Asesmen Formatif
                  </button>
                  <button 
                    onClick={() => setActiveAsesmenTab('sumatif')}
                    className={`flex-1 py-4 text-sm font-medium transition-colors ${activeAsesmenTab === 'sumatif' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
                  >
                    Asesmen Sumatif
                  </button>
                </div>

                <div className="p-6">
                  {activeAsesmenTab === 'formatif' && (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-700 mb-3">Pilih Teknik Asesmen Formatif</p>
                      
                      <div className="space-y-3">
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <div className="relative flex items-center justify-center">
                            <input 
                              type="checkbox" 
                              checked={teknikFormatif.observasi}
                              onChange={() => handleTeknikChange('observasi')}
                              className="peer sr-only" 
                            />
                            <div className="w-5 h-5 border-2 border-slate-500 rounded bg-white peer-checked:bg-blue-500 peer-checked:border-blue-500 transition-all"></div>
                            <CheckCircle className="absolute w-3.5 h-3.5 text-black opacity-0 peer-checked:opacity-100 transition-opacity" />
                          </div>
                          <span className="text-gray-700 group-hover:text-black transition-colors">Teknik observasi (Catatan Anekdotal)</span>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer group">
                          <div className="relative flex items-center justify-center">
                            <input 
                              type="checkbox" 
                              checked={teknikFormatif.checklist}
                              onChange={() => handleTeknikChange('checklist')}
                              className="peer sr-only" 
                            />
                            <div className="w-5 h-5 border-2 border-slate-500 rounded bg-white peer-checked:bg-blue-500 peer-checked:border-blue-500 transition-all"></div>
                            <CheckCircle className="absolute w-3.5 h-3.5 text-black opacity-0 peer-checked:opacity-100 transition-opacity" />
                          </div>
                          <span className="text-gray-700 group-hover:text-black transition-colors">Instrumen checklist (Daftar Periksa)</span>
                        </label>
                      </div>

                      {(teknikFormatif.observasi || teknikFormatif.checklist) && (
                        <div className="mt-6 space-y-4">
                          <p className="text-sm text-gray-700">Pratinjau Instrumen</p>
                          
                          {teknikFormatif.observasi && (
                            <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                                <span className="text-xs font-medium text-gray-700">Teknik Observasi (Catatan Anekdotal)</span>
                              </div>
                              <div className="bg-white p-4">
                                <div className="grid grid-cols-2 gap-4 text-xs font-medium text-gray-600 mb-2 uppercase tracking-wider">
                                  <div>Nama Murid</div>
                                  <div>Catatan Guru</div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
                                  <div className="italic">[Nama Siswa]</div>
                                  <div className="italic">[Guru mencatat observasi spesifik di sini...]</div>
                                </div>
                              </div>
                            </div>
                          )}

                          {teknikFormatif.checklist && (
                            <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                                <span className="text-xs font-medium text-gray-700">Instrumen Checklist (Daftar Periksa)</span>
                              </div>
                              <div className="bg-white p-4">
                                <div className="grid grid-cols-3 gap-4 text-xs font-medium text-gray-600 mb-2 uppercase tracking-wider">
                                  <div>Nama Murid</div>
                                  <div>Hasil Pengamatan (Checklist)</div>
                                  <div>Catatan Guru</div>
                                </div>
                                <div className="grid grid-cols-3 gap-4 text-sm text-gray-700">
                                  <div className="italic">[Nama Siswa]</div>
                                  <div className="italic">[Daftar periksa yang dibuat AI akan muncul di sini]</div>
                                  <div className="italic">[Catatan tambahan guru...]</div>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          <p className="text-xs text-gray-500 mt-2">Pilih teknik asesmen formatif. Instrumen detail akan dibuat di modul yang dihasilkan.</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {activeAsesmenTab === 'sumatif' && (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-700 mb-3">Pilih Teknik Asesmen Sumatif</p>
                      <select 
                        value={isCustomSumatif ? 'lainnya' : teknikSumatif}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === 'lainnya') {
                            setIsCustomSumatif(true);
                            setTeknikSumatif('');
                          } else {
                            setIsCustomSumatif(false);
                            setTeknikSumatif(val);
                          }
                        }}
                        className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      >
                        <option value="">Pilih teknik asesmen sumatif</option>
                        <option value="Poster kampanye yang dibuat murid dalam proyek kolaboratif">Poster kampanye yang dibuat murid dalam proyek kolaboratif</option>
                        <option value="Presentasi akhir proyek kokurikuler">Presentasi akhir proyek kokurikuler</option>
                        <option value="Laporan pengamatan atau refleksi tertulis">Laporan pengamatan atau refleksi tertulis</option>
                        <option value="Produk berbasis kebudayaan lokal (dalam bentuk karya seni, video, atau pertunjukan)">Produk berbasis kebudayaan lokal (dalam bentuk karya seni, video, atau pertunjukan)</option>
                        <option value="Lembar penilaian kebiasaan (dalam G7KAIH) berdasarkan catatan harian">Lembar penilaian kebiasaan (dalam G7KAIH) berdasarkan catatan harian</option>
                        <option value="lainnya">Bentuk penilaian lainnya (+)</option>
                      </select>
                      {isCustomSumatif && (
                        <AIAssistedInput type="text" 
                          placeholder="Masukkan bentuk penilaian lainnya..." 
                          value={teknikSumatif} 
                          onChange={e => setTeknikSumatif(e.target.value)} 
                          className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all mt-3" 
                        />
                      )}
                      <p className="text-xs text-gray-500 mt-2">Instrumen detail akan dibuat di modul yang dihasilkan.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 mt-4 w-full">
              
              <div className="mb-4">
            <ModelSelector modality="text" value={selectedModel} onChange={setSelectedModel} disabled={isGenerating} />
          </div>
          <button 
            onClick={generateModul}
            disabled={isGenerating}
            className="flex-1 py-4 bg-blue-600 hover:bg-blue-500 text-black rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-blue-500/25 flex items-center justify-center gap-2 btn-generate-animated"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Menghasilkan Modul...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Buat Modul</span>
              </>
            )}
          </button>
            </div>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-8 space-y-6">
            <AIVisualGenerator 
              context={{
                subject: subjectsByLevel[eduLevel]?.find(s => s.id === mapel)?.label || mapel,
                topic: topikMateri,
                level: educationLevels.find(l => l.id === eduLevel)?.label || eduLevel,
                phase: phaseClassMap[eduLevel]?.phases.find(p => p.id === fase)?.label || fase,
                class: phaseClassMap[eduLevel]?.classes[fase]?.find(c => c.id === kelas)?.label || kelas,
              }}
            />
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-black">Hasil Modul</h3>
              <div className="flex flex-col items-end gap-2">
                <button 
                  onClick={() => setIsPrintModalOpen(true)}
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-500 text-black rounded-xl font-bold transition-all shadow-lg"
                >
                  <Printer className="w-4 h-4" />
                  Print Modul
                </button>
                <p className="text-[10px] text-gray-500 italic text-right">
                  * Gunakan Chrome di Desktop untuk hasil terbaik. Di mobile, gunakan "Simpan sebagai PDF".<br/>
                  * Jangan lupa support saya agar makin berusaha dalam memperbaiki website ini.
                </p>
              </div>
            </div>
            <div id="modul-kokurikuler-print" className="bg-white rounded-2xl p-8 shadow-inner overflow-auto max-h-[800px] prose prose-slate max-w-none">
              <Markdown remarkPlugins={[remarkGfm]}>{result}</Markdown>
            </div>
          </div>
        )}

      <PrintSupportModal 
        isOpen={isPrintModalOpen} 
        onClose={() => setIsPrintModalOpen(false)} 
        onConfirm={printModul} 
      />
    </div>
  );
}
