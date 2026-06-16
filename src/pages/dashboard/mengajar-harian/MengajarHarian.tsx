import React, { useState, useEffect } from 'react';
import ModelSelector from '@/components/ModelSelector';
import { GoogleGenAI, Type } from '@/lib/genai';
import { BookOpen, FileText, Download, Printer, Info, AlertCircle, Presentation, Map, Image as ImageIcon, CheckSquare, Star, Activity, Plus, Save , Trash2, ChevronDown } from 'lucide-react';
import { marked } from 'marked';
import PrintSupportModal from '@/components/PrintSupportModal';
import AIVisualGenerator from '@/components/AIVisualGenerator';
import PDFRemixUpload from '@/components/PDFRemixUpload';
import { useAuth } from '@/context/AuthContext';
import { getWatermarkHtml, getSignatureHtml, createPrintWindow } from '@/lib/print';
import { repairMarkdown } from '@/lib/markdown';
import AIAssistedInput from '@/components/AIAssistedInput';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { topicsBySubject } from '@/lib/constants';

const JENJANG_OPTIONS = ['SD/MI', 'SMP/MTs', 'SMA/MA', 'SMK/MAK'];
const FASE_OPTIONS = ['Fase A', 'Fase B', 'Fase C', 'Fase D', 'Fase E', 'Fase F'];
const KELAS_OPTIONS = {
  'Fase A': ['Kelas I', 'Kelas II'],
  'Fase B': ['Kelas III', 'Kelas IV'],
  'Fase C': ['Kelas V', 'Kelas VI'],
  'Fase D': ['Kelas VII', 'Kelas VIII', 'Kelas IX'],
  'Fase E': ['Kelas X'],
  'Fase F': ['Kelas XI', 'Kelas XII']
};

const MAPEL_UMUM = [
  'Pendidikan Agama dan Budi Pekerti',
  'Pendidikan Pancasila',
  'Bahasa Indonesia',
  'Matematika',
  'Ilmu Pengetahuan Alam (IPA)',
  'Ilmu Pengetahuan Sosial (IPS)',
  'Ilmu Pengetahuan Alam dan Sosial (IPAS)',
  'Bahasa Inggris',
  'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)',
  'Informatika',
  'Seni Budaya (Musik/Rupa/Teater/Tari)',
  'Prakarya / Kewirausahaan',
  'Sejarah',
  'Geografi',
  'Sosiologi',
  'Ekonomi',
  'Fisika',
  'Kimia',
  'Biologi',
  'Mata Pelajaran Kejuruan',
  'Muatan Lokal'
];

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
  'Abstrak Diperluas'
];

export default function MengajarHarian() {
  const [formatPerangkat, setFormatPerangkat] = useLocalStorage<'standar'|'kemenag'>('MengajarHarian_formatPerangkat', 'standar');
  const [formData, setFormData] = useLocalStorage('MengajarHarianData', {
    jenisGuru: 'Guru Kelas',
    semester: 'Ganjil (1)',
    jenjang: 'SD/MI',
    fase: 'Fase A',
    kelas: 'Kelas I',
    mataPelajaran: '',
    customMapel: '',
    topikMateri: '',
    isCustomTopik: false,
    remixText: '',
    hasInklusi: false,
    jumlahInklusi: '',
    praktikPedagogis: '',
    kerangkaTaksonomi: 'bloom',
    levelTaksonomi: 'Campuran (Sesuai Kurikulum Merdeka)'
  });

  const [selectedFeatures, setSelectedFeatures] = useLocalStorage('MengajarHarian_selectedFeatures', {
    ringkasan: true,
    slide: true,
    petaPikiran: true,
    infographic: true,
    asesmen: true,
    rubrikSikap: true,
    rubrikHarian: true
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedModel, setSelectedModel] = useLocalStorage<string>('MengajarHarian_selectedModel', 'openai');

  const saveProgress = () => {
    alert('Progress otomatis disimpan saat Anda mengetik!');
  };

  const resetProgress = () => {
    if (confirm('Apakah Anda yakin ingin mereset semua data di halaman ini? Data yang belum di-export akan hilang.')) {
      localStorage.removeItem('MengajarHarianData');
      localStorage.removeItem('MengajarHarian_selectedFeatures');
      localStorage.removeItem('MengajarHarian_selectedModel');
      window.location.reload();
    }
  };

  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const { profile } = useAuth();

  useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        jenjang: profile.jenjang || prev.jenjang
      }));
    }
  }, [profile]);

  useEffect(() => {
    const validFase = KELAS_OPTIONS[formData.fase as keyof typeof KELAS_OPTIONS] ? formData.fase : 
      (formData.jenjang === 'SD/MI' ? 'Fase A' : 
       formData.jenjang === 'SMP/MTs' ? 'Fase D' : 'Fase E');
    
    if (formData.fase !== validFase || !KELAS_OPTIONS[formData.fase as keyof typeof KELAS_OPTIONS]?.includes(formData.kelas)) {
      const validKelas = KELAS_OPTIONS[validFase as keyof typeof KELAS_OPTIONS][0];
      setFormData(prev => ({...prev, fase: validFase, kelas: validKelas}));
    }
  }, [formData.jenjang]);

  const handleFeatureToggle = (feature: keyof typeof selectedFeatures) => {
    setSelectedFeatures(prev => ({ ...prev, [feature]: !prev[feature] }));
  };

  const generateContent = async () => {
    if (!formData.topikMateri) {
      setError('Mohon isi Topik/Materi terlebih dahulu.');
      return;
    }

    const mapel = formData.mataPelajaran === 'Lainnya' ? formData.customMapel : formData.mataPelajaran;
    if (formData.jenisGuru === 'Guru Mapel' && !mapel) {
      setError('Mohon pilih atau isi Mata Pelajaran.');
      return;
    }

    setIsGenerating(true);
    setError('');
    setResult(null);

    try {
      const ai = new GoogleGenAI({});

      const requestedFeatures = Object.entries(selectedFeatures)
        .filter(([_, isSelected]) => isSelected)
        .map(([key]) => key);

      if (requestedFeatures.length === 0) {
        throw new Error('Pilih minimal satu fitur untuk di-generate.');
      }

      const formatInstruction = formatPerangkat === 'kemenag' 
        ? "Kemenag Perangkat Mengajar Harian Berbasis Cinta"
        : "Perangkat Mengajar Harian Standar";

      const prompt = `Pastikan dokumen ini disusun sesuai standar terbaru Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi (Kemendikbudristek) serta Kementerian Agama (Kemenag) Republik Indonesia, mengikuti panduan Kurikulum Merdeka yang mengikat.

Buatkan ${formatInstruction} dengan detail berikut:
Informasi Umum:
- Jenis Guru: ${formData.jenisGuru}
- Semester: ${formData.semester}
- Jenjang: ${formData.jenjang}
- Fase: ${formData.fase}
- Kelas: ${formData.kelas}
${formData.jenisGuru === 'Guru Mapel' ? `- Mata Pelajaran: ${mapel}` : ''}
- Topik/Materi: ${formData.topikMateri}
${formData.praktikPedagogis ? `- Praktik Pedagogis: ${formData.praktikPedagogis}` : ''}
- Taksonomi/Pendekatan Kognitif: ${formData.kerangkaTaksonomi === 'bloom' ? 'Taksonomi Bloom' : 'Taksonomi SOLO'} pada level: ${formData.levelTaksonomi}.
${formData.hasInklusi ? `- Terdapat Anak Inklusi: Ya, berjumlah ${formData.jumlahInklusi} siswa. Pastikan hasil generate menyediakan adaptasi atau modifikasi untuk anak inklusi.` : ''}

${formatPerangkat === 'kemenag' ? `Konteks Kemenag & Berbasis Cinta (WAJIB ADA):
- Tambahkan nilai Profil Pelajar Rahmatan Lil 'Alamin (PPRA).
- Integrasikan "Pendekatan Cinta/Heartful Learning" (sapaan kasih sayang, empati, doa, kelembutan, bonding emosional) dalam kegiatan dan instruksi.
- Selipkan nilai-nilai spiritual, akhlak, dan moderasi beragama dalam konten.` : ''}

${formData.remixText ? `INSTRUKSI REMIX:
Gunakan teks referensi berikut sebagai dasar utama pembuatan konten. Remix dan kembangkan konten ini agar sesuai dengan kurikulum merdeka dan target audiens di atas:
---
${formData.remixText}
---` : ''}

Tolong buatkan konten untuk bagian-bagian berikut yang diminta (berikan dalam format JSON terstruktur):
${selectedFeatures.ringkasan ? '- "ringkasan": Ringkasan Materi Ajar yang komprehensif (format teks markdown biasa).' : ''}
${selectedFeatures.slide ? '- "slide": Array objek berisi "title" dan "content" (array of string) untuk setiap slide.' : ''}
${selectedFeatures.petaPikiran ? '- "petaPikiran": Array objek berisi "topic" (topik utama) dan "subtopics" (array of string) untuk mind map.' : ''}
${selectedFeatures.infographic ? '- "infographic": Array objek berisi "section" (judul bagian) dan "content" (penjelasan) untuk infografis.' : ''}
${selectedFeatures.asesmen ? '- "asesmen": Objek berisi "questions" (array soal dengan "number", "text", dan "options" jika pilihan ganda) dan "answers" (array jawaban dengan "number" dan "text").' : ''}
${selectedFeatures.rubrikSikap ? '- "rubrikSikap": Objek berisi "headers" (array string untuk kolom tabel) dan "rows" (array objek dengan "aspect" dan "criteria" array string sesuai header).' : ''}
${selectedFeatures.rubrikHarian ? '- "rubrikHarian": Objek berisi "headers" (array string untuk kolom tabel) dan "rows" (array objek dengan "aspect" dan "criteria" array string sesuai header).' : ''}
- "outOfTopic": Array string berisi ide-ide Out Of Topic (ice breakers, intermezzo, atau selingan) yang benar-benar efektif dan relevan untuk menyegarkan suasana kelas.

ATURAN KETAT PENULISAN & FORMAT (SANGAT PENTING):
1. JANGAN memuat singkatan "P5" atau istilah "Proyek Penguatan Profil Pelajar Pancasila". Gantilah semua dengan istilah "Kokurikuler" atau "Kegiatan Kokurikuler" atau "Modul Kokurikuler".
2. Tuliskan teks dalam bahasa Indonesia yang baku, formal, dan BEBAS dari kesalahan tik (typo). Misalnya, gunakan "Setelah" (bukan "Seteleh"), "Pilihan" (bukan "Piliham"), dll.
3. Hindari adanya spasi ganda yang aneh, tab kosong, atau pemisahan kata yang tidak semestinya di dalam teks atau daftar list.
4. Untuk penulisan rumus/ekspresi matematika, gunakan teks biasa yang jelas dan mudah dibaca.
5. PENTING: Untuk cetak yang rapi, susun konten paragraf dengan baris baru (newline ganda \\n\\n) agar tidak menumpuk. Gunakan tabel Markdown (dengan header | Kolom |) pada konten yang sesuai agar tersusun rapi.
6. Pastikan hanya mengembalikan properti JSON untuk fitur yang diminta. PASTIKAN JSON VALID.`;

      const response = await ai.models.generateContent({
        model: selectedModel,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              ringkasan: { type: Type.STRING },
              slide: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    content: { type: Type.ARRAY, items: { type: Type.STRING } }
                  }
                }
              },
              petaPikiran: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    topic: { type: Type.STRING },
                    subtopics: { type: Type.ARRAY, items: { type: Type.STRING } }
                  }
                }
              },
              infographic: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    section: { type: Type.STRING },
                    content: { type: Type.STRING }
                  }
                }
              },
              asesmen: {
                type: Type.OBJECT,
                properties: {
                  questions: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        number: { type: Type.NUMBER },
                        text: { type: Type.STRING },
                        options: { type: Type.ARRAY, items: { type: Type.STRING } }
                      }
                    }
                  },
                  answers: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        number: { type: Type.NUMBER },
                        text: { type: Type.STRING }
                      }
                    }
                  }
                }
              },
              rubrikSikap: {
                type: Type.OBJECT,
                properties: {
                  headers: { type: Type.ARRAY, items: { type: Type.STRING } },
                  rows: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        aspect: { type: Type.STRING },
                        criteria: { type: Type.ARRAY, items: { type: Type.STRING } }
                      }
                    }
                  }
                }
              },
              rubrikHarian: {
                type: Type.OBJECT,
                properties: {
                  headers: { type: Type.ARRAY, items: { type: Type.STRING } },
                  rows: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        aspect: { type: Type.STRING },
                        criteria: { type: Type.ARRAY, items: { type: Type.STRING } }
                      }
                    }
                  }
                }
              },
              outOfTopic: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            }
          }
        }
      });

      if (response.text) {
        setResult(JSON.parse(response.text));
      } else {
        throw new Error('Gagal menghasilkan konten.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Terjadi kesalahan saat menghasilkan konten.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    setIsPrintModalOpen(true);
  };

  const executePrint = () => {
    // Open all details before getting HTML so they print expanded
    const detailsElements = document.querySelectorAll('#print-content details');
    detailsElements.forEach(d => d.setAttribute('open', 'true'));

    const printContent = document.getElementById('print-content');
    if (printContent) {
      const printWindow = createPrintWindow();
      if (!printWindow) return;
      
      const watermark = getWatermarkHtml(profile?.role);
      const signature = getSignatureHtml(profile);
      
      printWindow.document.write(`
        <html>
          <head>
            <title>Print - Mengajar Harian</title>
            <style>
              @page {
                size: A4;
                margin: 20mm 20mm 20mm 25mm;
              }
              body {
                font-family: Arial, sans-serif;
                line-height: 1.5;
                color: #000;
                background: #fff;
                padding: 0;
                margin: 0;
              }
              h1, h2, h3 { color: #111; margin-top: 10px; margin-bottom: 10px; }
              .markdown-body { font-size: 11pt; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
              th, td { border: 1px solid #333; padding: 6px 10px; text-align: left; font-size: 10pt; }
              th { background-color: #f2f2f2; }
              
              .print-section {
                border: 1.5px solid #000;
                padding: 10px;
                margin-bottom: 20mm;
                page-break-inside: avoid;
                page-break-after: always;
                box-sizing: border-box;
                position: relative;
              }
              
              @media print {
                body {
                  margin: 0;
                  padding: 0;
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                }
                .no-print { display: none; }
                .print-section {
                  margin-bottom: 0;
                  page-break-after: always;
                  border: 1.5px solid #000 !important;
                }
              }
            
              table { width: 100%; border-collapse: collapse; margin-bottom: 20px; page-break-inside: auto; }
              tr { page-break-inside: avoid; page-break-after: auto; }
              thead { display: table-header-group; }
              tfoot { display: table-footer-group; }
            </style>
          </head>
          <body>
            ${watermark}
            <div style="position: relative; z-index: 1;">
              ${printContent.innerHTML}
              ${(profile?.kepalaSekolah || profile?.nama || profile?.displayName) ? `<div class="print-section" style="min-height: auto !important; margin-top: 20mm; display: flex; justify-content: space-between; text-align: center; font-size: 12px; page-break-inside: avoid; page-break-after: auto;">
                  <div style="width: 45%;">
                      <p>Mengetahui,</p>
                      <p>Kepala Sekolah</p>
                      <br><br><br><br>
                      <p style="font-weight: bold; text-decoration: underline;">${profile?.kepalaSekolah || '................................'}</p>
                      <p>${profile?.jenisNipKepalaSekolah || 'NIP'}. ${profile?.nipKepalaSekolah || '................................'}</p>
                  </div>
                  <div style="width: 45%;">
                      <p>Dibuat pada, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      <p>Guru Pengampu</p>
                      <br><br><br><br>
                      <p style="font-weight: bold; text-decoration: underline;">${profile?.nama || profile?.displayName || '................................'}</p>
                      <p>${profile?.jenisNipGuru || 'NIP'}. ${profile?.nip || '................................'}</p>
                  </div>
              </div>` : ''}
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
    }
    setIsPrintModalOpen(false);
  };

  const renderMarkdown = (text: string) => {
    if (!text) return null;
    return (
      <div className="markdown-body prose prose-slate max-w-none text-gray-700 html-content">
        <div dangerouslySetInnerHTML={{ __html: marked.parse(repairMarkdown(text)) as string }} />
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-black tracking-tight flex items-center gap-3">
            <BookOpen className="text-red-500" size={28} />
            {formatPerangkat === 'kemenag' ? 'Kemenag Mengajar Harian' : 'Mengajar Harian'}
          </h2>
          <p className="text-gray-600 text-sm mt-1">Generate perangkat mengajar harian lengkap dengan AI.</p>
        </div>
      </div>

      <div className="flex gap-2 p-1 bg-gray-100 rounded-xl max-w-md w-full">
        <button 
          onClick={() => setFormatPerangkat('standar')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-300 ${formatPerangkat === 'standar' ? 'bg-white text-gray-900 shadow-md transform scale-[1.02]' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-200'}`}
        >
          Standar
        </button>
        <button 
          onClick={() => setFormatPerangkat('kemenag')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-300 ${formatPerangkat === 'kemenag' ? 'bg-red-50 text-red-700 shadow-md border border-red-200 transform scale-[1.02]' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-200'}`}
        >
          Kemenag (Berbasis Cinta)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <details className="bg-white border border-gray-200 shadow-sm rounded-2xl group" open>
            <summary className="flex items-center justify-between p-6 pb-4 border-b border-gray-100 cursor-pointer list-none">
              <h3 className="text-lg font-bold text-black flex items-center gap-2">
                <Info size={18} className="text-red-500" />
                Informasi Umum
              </h3>
              <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" />
            </summary>
            <div className="p-6 pt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">Jenis Guru</label>
                  <select 
                    className="w-full bg-white border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-red-500 transition-all outline-none"
                    value={formData.jenisGuru}
                    onChange={(e) => setFormData({...formData, jenisGuru: e.target.value})}
                  >
                    <option className="bg-white text-black" value="Guru Kelas">Guru Kelas</option>
                    <option className="bg-white text-black" value="Guru Mapel">Guru Mapel</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">Semester</label>
                  <select 
                    className="w-full bg-white border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-red-500 transition-all outline-none"
                    value={formData.semester}
                    onChange={(e) => setFormData({...formData, semester: e.target.value})}
                  >
                    <option className="bg-white text-black" value="Ganjil (1)">Ganjil (1)</option>
                    <option className="bg-white text-black" value="Genap (2)">Genap (2)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">Jenjang</label>
                  <select 
                    className="w-full bg-white border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-red-500 transition-all outline-none"
                    value={formData.jenjang}
                    onChange={(e) => {
                      const newJenjang = e.target.value;
                      const validFase = newJenjang === 'SD/MI' ? 'Fase A' : newJenjang === 'SMP/MTs' ? 'Fase D' : 'Fase E';
                      setFormData({...formData, jenjang: newJenjang, fase: validFase, kelas: KELAS_OPTIONS[validFase as keyof typeof KELAS_OPTIONS][0]});
                    }}
                  >
                    {JENJANG_OPTIONS.map(j => <option className="bg-white text-black" key={j} value={j}>{j}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">Fase</label>
                  <select 
                    className="w-full bg-white border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-red-500 transition-all outline-none"
                    value={formData.fase}
                    onChange={(e) => setFormData({...formData, fase: e.target.value, kelas: KELAS_OPTIONS[e.target.value as keyof typeof KELAS_OPTIONS][0]})}
                  >
                    {(formData.jenjang === 'SD/MI' ? ['Fase A', 'Fase B', 'Fase C'] : 
                      formData.jenjang === 'SMP/MTs' ? ['Fase D'] : 
                      ['Fase E', 'Fase F']).map(f => <option className="bg-white text-black" key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">Kelas</label>
                <select 
                  className="w-full bg-white border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-red-500 transition-all outline-none"
                  value={formData.kelas}
                  onChange={(e) => setFormData({...formData, kelas: e.target.value})}
                >
                  {(KELAS_OPTIONS[formData.fase as keyof typeof KELAS_OPTIONS] || []).map(k => (
                    <option className="bg-white text-black" key={k} value={k}>{k}</option>
                  ))}
                </select>
              </div>

              {formData.jenisGuru === 'Guru Mapel' && (
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">Mata Pelajaran</label>
                  <select 
                    className="w-full bg-white border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-red-500 transition-all outline-none mb-2"
                    value={formData.mataPelajaran}
                    onChange={(e) => setFormData({...formData, mataPelajaran: e.target.value})}
                  >
                    <option className="bg-white text-black" value="">-- Pilih Mata Pelajaran --</option>
                    {MAPEL_UMUM.map(m => <option className="bg-white text-black" key={m} value={m}>{m}</option>)}
                    <option className="bg-white text-black" value="Lainnya">+ Tambah Mapel Lainnya</option>
                  </select>
                  {formData.mataPelajaran === 'Lainnya' && (
                    <AIAssistedInput type="text"
                      className="w-full bg-white border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-red-500 transition-all outline-none"
                      placeholder="Masukkan nama mata pelajaran..."
                      value={formData.customMapel}
                      onChange={(e) => setFormData({...formData, customMapel: e.target.value})}
                    />
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">Topik/Materi</label>
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
                  className="w-full bg-white border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-red-500 transition-all outline-none"
                >
                  <option value="">-- Pilih Topik --</option>
                  {(topicsBySubject[formData.mataPelajaran === 'Lainnya' ? formData.customMapel : formData.mataPelajaran] || topicsBySubject['default'] || []).map((topic: string, idx: number) => (
                    <option key={idx} value={topic}>{topic}</option>
                  ))}
                  <option value="lainnya">Lainnya (+ Input Manual)</option>
                </select>
                {formData.isCustomTopik && (
                  <AIAssistedInput type="text"
                    className="w-full bg-white border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-red-500 transition-all outline-none mt-2"
                    placeholder="Masukkan Topik/Materi secara manual..."
                    value={formData.topikMateri}
                    onChange={(e) => setFormData({...formData, topikMateri: e.target.value})}
                  />
                )}
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={formData.hasInklusi}
                    onChange={(e) => setFormData({...formData, hasInklusi: e.target.checked})}
                    className="w-4 h-4 rounded border-black text-red-500 focus:ring-red-500 focus:ring-offset-white bg-white"
                  />
                  <span className="text-sm font-medium text-gray-700">Terdapat Anak Inklusi</span>
                </label>
                
                {formData.hasInklusi && (
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">Jumlah Siswa Inklusi</label>
                    <input 
                      type="number"
                      min="1"
                      className="w-full bg-white border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-red-500 transition-all outline-none"
                      placeholder="Masukkan jumlah siswa inklusi..."
                      value={formData.jumlahInklusi}
                      onChange={(e) => setFormData({...formData, jumlahInklusi: e.target.value})}
                    />
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gray-100">
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">Praktik Pedagogis</label>
                <select 
                  className="w-full bg-white border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-red-500 transition-all outline-none mb-4"
                  value={formData.praktikPedagogis || ''}
                  onChange={(e) => setFormData({...formData, praktikPedagogis: e.target.value})}
                >
                  <option value="">Pilih Praktik Pedagogis</option>
                  <option value="Pembelajaran Berbasis Masalah (PBL)">Pembelajaran Berbasis Masalah (PBL)</option>
                  <option value="Pembelajaran Berbasis Proyek (PjBL)">Pembelajaran Berbasis Proyek (PjBL)</option>
                  <option value="Pembelajaran Penemuan (Discovery)">Pembelajaran Penemuan (Discovery)</option>
                  {formatPerangkat === 'kemenag' && (
                    <option value="Pendekatan Kurikulum Berbasis Cinta">Pendekatan Kurikulum Berbasis Cinta</option>
                  )}
                </select>

                <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-3">Kerangka Taksonomi</label>
                <div className="flex gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, kerangkaTaksonomi: 'bloom', levelTaksonomi: 'Campuran (Sesuai Kurikulum Merdeka)'})}
                    className={`flex-1 py-2 px-2 rounded-full text-sm font-semibold transition-all ${formData.kerangkaTaksonomi === 'bloom' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                  >
                    Taksonomi Bloom
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, kerangkaTaksonomi: 'solo', levelTaksonomi: 'Relasional'})}
                    className={`flex-1 py-2 px-2 rounded-full text-sm font-semibold transition-all ${formData.kerangkaTaksonomi === 'solo' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                  >
                    Taksonomi SOLO
                  </button>
                </div>

                <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-3">Level Yang Digunakan</label>
                <div className="flex flex-wrap gap-2 mb-4">
                  {(formData.kerangkaTaksonomi === 'bloom' ? TAKSONOMI_BLOOM : TAKSONOMI_SOLO).map(lvl => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setFormData({...formData, levelTaksonomi: lvl})}
                      className={`py-1.5 px-3 rounded-full text-xs font-medium transition-all ${formData.levelTaksonomi === lvl ? 'bg-blue-500 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                    >
                      {lvl.split(':')[0]}
                    </button>
                  ))}
                </div>
              </div>

              <PDFRemixUpload 
                onTextExtracted={(text) => setFormData(prev => ({ ...prev, remixText: text }))}
                label="Remix dari PDF (Opsional)"
              />
            </div>
          </details>

          <details className="bg-white border border-gray-200 shadow-sm rounded-2xl group" open>
            <summary className="flex items-center justify-between p-6 pb-4 border-b border-gray-100 cursor-pointer list-none">
              <h3 className="text-lg font-bold text-black flex items-center gap-2">
                <CheckSquare size={18} className="text-red-400" />
                Pilih Fitur Generate
              </h3>
              <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" />
            </summary>
            <div className="p-6 pt-4 space-y-3">
              {[
                { id: 'ringkasan', label: 'Ringkasan Materi Ajar', icon: FileText, color: 'text-blue-400' },
                { id: 'slide', label: 'Slide Presentasi', icon: Presentation, color: 'text-orange-400' },
                { id: 'petaPikiran', label: 'Peta Pikiran (Mind Map)', icon: Map, color: 'text-green-400' },
                { id: 'infographic', label: 'InfoGraphic', icon: ImageIcon, color: 'text-pink-400' },
                { id: 'asesmen', label: 'Asesmen & Kunci Jawaban', icon: CheckSquare, color: 'text-red-400' },
                { id: 'rubrikSikap', label: 'Rubrik Penilaian Sikap', icon: Star, color: 'text-yellow-400' },
                { id: 'rubrikHarian', label: 'Rubrik Penilaian Harian', icon: Activity, color: 'text-purple-400' },
              ].map((feature) => (
                <label key={feature.id} className="flex items-center gap-3 p-3 rounded-lg border border-white/5 hover:bg-white/5 cursor-pointer transition-colors">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-black text-red-400 focus:ring-red-400 bg-red-50"
                    checked={selectedFeatures[feature.id as keyof typeof selectedFeatures]}
                    onChange={() => handleFeatureToggle(feature.id as keyof typeof selectedFeatures)}
                  />
                  <feature.icon size={16} className={feature.color} />
                  <span className="text-sm text-gray-700">{feature.label}</span>
                </label>
              ))}
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
              onClick={generateContent}
              disabled={isGenerating}
              className="bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors btn-generate-animated flex-1 py-3 flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  <span>MEMPROSES...</span>
                </>
              ) : (
                <>
                  <Activity size={18} />
                  <span>GENERATE PERANGKAT</span>
                </>
              )}
            </button>
            </div>

            {error && (
              <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-3">
                <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={16} />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}
            </details>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {result ? (
            <>
              <AIVisualGenerator 
                context={{
                  subject: formData.mataPelajaran === 'Lainnya' ? formData.customMapel : formData.mataPelajaran,
                  topic: formData.topikMateri,
                  level: formData.jenjang,
                  phase: formData.fase,
                  class: formData.kelas,
                }}
              />
              <div className="bg-white border border-gray-200 shadow-sm p-6 md:p-8 rounded-2xl relative">
              <div className="absolute top-6 right-6 flex gap-2 no-print">
                <button onClick={handlePrint} className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-black transition-colors">
                  <Printer size={20} />
                </button>
              </div>

              <div id="print-content" className="space-y-8">
                <div className="print-section text-center border-b border-white/10 pb-6">
                  <h1 className="text-2xl md:text-3xl font-black text-black mb-2">{formatPerangkat === 'kemenag' ? 'Kemenag Mengajar Harian' : 'Perangkat Mengajar Harian'}: {formData.topikMateri}</h1>
                  <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600">
                    <span><strong>Jenis:</strong> {formData.jenisGuru}</span>
                    {formData.jenisGuru === 'Guru Mapel' && <span><strong>Mapel:</strong> {formData.mataPelajaran === 'Lainnya' ? formData.customMapel : formData.mataPelajaran}</span>}
                    <span><strong>Fase/Kelas:</strong> {formData.fase} / {formData.kelas}</span>
                    <span><strong>Semester:</strong> {formData.semester}</span>
                  </div>
                </div>

                {result.ringkasan && (
                  <details className="space-y-4 print-section group" open>
                    <summary className="text-xl font-bold text-red-500 flex items-center justify-between border-b border-red-500/30 pb-2 cursor-pointer list-none">
                      <div className="flex items-center gap-2"><FileText size={20} /> Ringkasan Materi Ajar</div>
                      <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform no-print" />
                    </summary>
                    <div className="pt-2">
                      {renderMarkdown(result.ringkasan)}
                    </div>
                  </details>
                )}

                {result.outOfTopic && Array.isArray(result.outOfTopic) && (
                  <details className="space-y-4 print-section group" open>
                    <summary className="text-xl font-bold text-red-200 flex items-center justify-between border-b border-red-200/30 pb-2 cursor-pointer list-none">
                      <div className="flex items-center gap-2"><Star size={20} /> Ide Out Of Topic (Ice Breaker / Intermezzo)</div>
                      <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform no-print" />
                    </summary>
                    <div className="pt-2">
                      <ul className="list-disc pl-5 space-y-2 text-gray-700">
                      {result.outOfTopic.map((idea: string, i: number) => (
                        <li key={i}>{idea}</li>
                      ))}
                      </ul>
                    </div>
                  </details>
                )}

                {result.slide && Array.isArray(result.slide) && (
                  <details className="space-y-4 page-break print-section group" open>
                    <summary className="text-xl font-bold text-orange-400 flex items-center justify-between border-b border-orange-400/30 pb-2 cursor-pointer list-none">
                      <div className="flex items-center gap-2"><Presentation size={20} /> Slide Presentasi</div>
                      <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform no-print" />
                    </summary>
                    <div className="pt-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {result.slide.map((s: any, i: number) => (
                        <div key={i} className="gen-card bg-red-50 rounded-xl p-5 shadow-lg">
                          <h3 className="text-lg font-bold text-black mb-3 border-b border-black pb-2">Slide {i + 1}: {s.title}</h3>
                          <ul className="list-disc pl-5 space-y-1 text-gray-700 text-sm">
                            {s.content.map((c: string, j: number) => <li key={j}>{c}</li>)}
                          </ul>
                        </div>
                      ))}
                    </div>
                    </div>
                  </details>
                )}

                {result.petaPikiran && Array.isArray(result.petaPikiran) && (
                  <details className="space-y-4 page-break print-section group" open>
                    <summary className="text-xl font-bold text-green-400 flex items-center justify-between border-b border-green-400/30 pb-2 cursor-pointer list-none">
                      <div className="flex items-center gap-2"><Map size={20} /> Peta Pikiran (Mind Map)</div>
                      <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform no-print" />
                    </summary>
                    <div className="pt-2">
                      <div className="gen-card bg-white p-6 rounded-xl">
                      <div className="flex flex-col space-y-6">
                        {result.petaPikiran.map((node: any, i: number) => (
                          <div key={i} className="relative pl-8">
                            <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-green-500/30"></div>
                            <div className="absolute left-[9px] top-2 w-3 h-3 rounded-full bg-green-400 shadow-sm"></div>
                            
                            <h3 className="text-lg font-bold text-green-300 mb-2">{node.topic}</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {node.subtopics.map((sub: string, j: number) => (
                                <div key={j} className="gen-card bg-red-50 px-4 py-2 rounded-lg text-sm text-gray-700 flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-green-500/50"></div>
                                  {sub}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                      </div>
                    </div>
                  </details>
                )}

                {result.infographic && Array.isArray(result.infographic) && (
                  <details className="space-y-4 page-break print-section group" open>
                    <summary className="text-xl font-bold text-pink-400 flex items-center justify-between border-b border-pink-400/30 pb-2 cursor-pointer list-none">
                      <div className="flex items-center gap-2"><ImageIcon size={20} /> InfoGraphic</div>
                      <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform no-print" />
                    </summary>
                    <div className="pt-2">
                      <div className="flex flex-col gap-4">
                      {result.infographic.map((info: any, i: number) => (
                        <div key={i} className="gen-card flex flex-col md:flex-row gap-4 bg-red-50 rounded-xl p-4 /20">
                          <div className="md:w-1/3">
                            <div className="bg-pink-500/10 text-pink-400 font-bold px-4 py-2 rounded-lg inline-block border border-pink-500/30">
                              {info.section}
                            </div>
                          </div>
                          <div className="md:w-2/3 text-gray-700 text-sm flex items-center">
                            {info.content}
                          </div>
                        </div>
                      ))}
                      </div>
                    </div>
                  </details>
                )}

                {result.asesmen && result.asesmen.questions && (
                  <details className="space-y-4 page-break print-section group" open>
                    <summary className="text-xl font-bold text-red-400 flex items-center justify-between border-b border-red-400/30 pb-2 cursor-pointer list-none">
                      <div className="flex items-center gap-2"><CheckSquare size={20} /> Asesmen & Kunci Jawaban</div>
                      <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform no-print" />
                    </summary>
                    <div className="pt-2">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="gen-card bg-red-50 rounded-xl p-5">
                        <h3 className="text-lg font-bold text-black mb-4 border-b border-black pb-2">Soal Latihan</h3>
                        <div className="space-y-4">
                          {result.asesmen.questions.map((q: any, i: number) => (
                            <div key={i} className="text-sm">
                              <p className="text-gray-900 font-medium mb-2">{q.number}. {q.text}</p>
                              {q.options && q.options.length > 0 && (
                                <ul className="space-y-1 pl-4">
                                  {q.options.map((opt: string, j: number) => (
                                    <li key={j} className="text-gray-600">{String.fromCharCode(65 + j)}. {opt}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="gen-card bg-red-50 rounded-xl p-5">
                        <h3 className="text-lg font-bold text-black mb-4 border-b border-black pb-2">Kunci Jawaban</h3>
                        <div className="space-y-2">
                          {result.asesmen.answers.map((a: any, i: number) => (
                            <div key={i} className="flex gap-3 text-sm border-b border-black pb-2 last:border-0">
                              <span className="font-bold text-red-400 w-6">{a.number}.</span>
                              <span className="text-gray-700">{a.text}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      </div>
                    </div>
                  </details>
                )}

                {result.rubrikSikap && result.rubrikSikap.headers && (
                  <details className="space-y-4 page-break print-section group" open>
                    <summary className="text-xl font-bold text-yellow-400 flex items-center justify-between border-b border-yellow-400/30 pb-2 cursor-pointer list-none">
                      <div className="flex items-center gap-2"><Star size={20} /> Rubrik Penilaian Sikap</div>
                      <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform no-print" />
                    </summary>
                    <div className="pt-2">
                      <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left text-gray-700">
                        <thead className="text-xs text-black uppercase bg-red-50 border-b border-black">
                          <tr>
                            <th className="px-4 py-3">Aspek</th>
                            {result.rubrikSikap.headers.map((h: string, i: number) => <th key={i} className="px-4 py-3">{h}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          {result.rubrikSikap.rows.map((row: any, i: number) => (
                            <tr key={i} className="bg-white border-b border-black hover:bg-red-50">
                              <td className="px-4 py-3 font-medium text-black">{row.aspect}</td>
                              {row.criteria.map((c: string, j: number) => <td key={j} className="px-4 py-3">{c}</td>)}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      </div>
                    </div>
                  </details>
                )}

                {result.rubrikHarian && result.rubrikHarian.headers && (
                  <details className="space-y-4 page-break print-section group" open>
                    <summary className="text-xl font-bold text-purple-400 flex items-center justify-between border-b border-purple-400/30 pb-2 cursor-pointer list-none">
                      <div className="flex items-center gap-2"><Activity size={20} /> Rubrik Penilaian Harian</div>
                      <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform no-print" />
                    </summary>
                    <div className="pt-2">
                      <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left text-gray-700">
                        <thead className="text-xs text-black uppercase bg-red-50 border-b border-black">
                          <tr>
                            <th className="px-4 py-3">Aspek</th>
                            {result.rubrikHarian.headers.map((h: string, i: number) => <th key={i} className="px-4 py-3">{h}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          {result.rubrikHarian.rows.map((row: any, i: number) => (
                            <tr key={i} className="bg-white border-b border-black hover:bg-red-50">
                              <td className="px-4 py-3 font-medium text-black">{row.aspect}</td>
                              {row.criteria.map((c: string, j: number) => <td key={j} className="px-4 py-3">{c}</td>)}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      </div>
                    </div>
                  </details>
                )}
              </div>
            </div>
          </>
        ) : (
            <div className="bg-white border border-gray-200 shadow-sm p-12 rounded-2xl flex flex-col items-center justify-center text-center h-full min-h-[400px]">
              <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
                <BookOpen size={40} className="text-red-500 opacity-50" />
              </div>
              <h3 className="text-xl font-bold text-black mb-2">Belum Ada Perangkat</h3>
              <p className="text-gray-600 max-w-md">
                Isi informasi umum di samping, pilih fitur yang ingin di-generate, lalu klik tombol "Generate Perangkat" untuk membuat perangkat mengajar harian Anda.
              </p>
            </div>
          )}
        </div>
      </div>

      <PrintSupportModal 
        isOpen={isPrintModalOpen} 
        onClose={() => setIsPrintModalOpen(false)} 
        onConfirm={executePrint} 
      />
    </div>
  );
}
