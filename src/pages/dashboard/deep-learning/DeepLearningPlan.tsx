import React, { useState, useEffect } from 'react';
import ModelSelector from '@/components/ModelSelector';
import { educationLevels, phaseClassMap, subjectsByLevel, topicsBySubject } from '@/lib/constants';
import { GoogleGenAI, Type } from '@/lib/genai';
import PrintSupportModal from '@/components/PrintSupportModal';
import AIVisualGenerator from '@/components/AIVisualGenerator';
import PDFRemixUpload from '@/components/PDFRemixUpload';
import { BookOpen, CheckCircle, Plus, Minus, Download, Save, Brain, School, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getWatermarkHtml, createPrintWindow } from '@/lib/print';
import AIAssistedInput from '@/components/AIAssistedInput';
import AIAssistedTextarea from '@/components/AIAssistedTextarea';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import LogoUploader from '@/components/LogoUploader';

export default function DeepLearningPlan() {
  const { profile } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedModel, setSelectedModel] = useLocalStorage<string>('DeepLearningPlan_selectedModel', 'openai');
  const [formatPerangkat, setFormatPerangkat] = useLocalStorage<'standar'|'kemenag'>('DeepLearningPlan_formatPerangkat', 'standar');
  const [useLogo, setUseLogo] = useLocalStorage<boolean>('DeepLearningPlan_useLogo', false);
  const [logoUrl, setLogoUrl] = useLocalStorage<string | null>('DeepLearningPlan_logoUrl', null);

  const saveProgress = () => {
    alert('Progress otomatis disimpan saat Anda mengetik!');
  };

  const resetProgress = () => {
    if (confirm('Apakah Anda yakin ingin mereset semua data di halaman ini? Data yang belum di-export akan hilang.')) {
      localStorage.removeItem('DeepLearningPlanData');
      localStorage.removeItem('DeepLearningPlan_profilLulusan');
      localStorage.removeItem('DeepLearningPlan_selectedModel');
      localStorage.removeItem('DeepLearningPlan_formatPerangkat');
      window.location.reload();
    }
  };

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [error, setError] = useState('');
  
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    info: true,
    identifikasi: true,
    desain: true,
    pengalaman: true,
    asesmen: true
  });

  const toggleSection = (id: string) => {
    setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const [formData, setFormData] = useLocalStorage('DeepLearningPlanData', {
    sekolah: '',
    jenisSekolah: 'Negeri',
    namaGuru: '',
    jenisNipGuru: 'NIP',
    nip: '',
    kepalaSekolah: '',
    jenisNipKepalaSekolah: 'NIP',
    nipKepalaSekolah: '',
    jenisGuru: 'Guru Kelas',
    eduLevel: 'sd',
    fase: 'A',
    kelas: '1',
    semester: '1',
    mapel: 'bahasa-indonesia',
    topikMateri: '',
    isCustomTopik: false,
    alokasiWaktu: '',
    kerangkaTaksonomi: 'bloom',
    levelTaksonomi: 'Campuran (Sesuai Kurikulum Merdeka)',
    pesertaDidik: '',
    topikPelajaran: '',
    capaianPembelajaran: '',
    lintasDisiplin: '',
    tujuanPembelajaran: '',
    praktikPedagogis: 'Pembelajaran Berbasis Masalah (Problem Based Learning)',
    lingkunganBelajar: '',
    kemitraanPembelajaran: '',
    pemanfaatanDigital: '',
    prinsipAwal: ['Menggembirakan'],
    awal: '',
    prinsipMemahami: ['Berkesadaran'],
    memahami: '',
    prinsipMengaplikasi: ['Bermakna'],
    mengaplikasi: '',
    prinsipMerefleksi: ['Berkesadaran'],
    merefleksi: '',
    prinsipPenutup: ['Bermakna'],
    penutup: '',
    jenisAsesmenAwal: 'Tes Tertulis',
    asesmenAwal: '',
    jenisAsesmenFormatif: 'Observasi',
    asesmenFormatif: '',
    jenisAsesmenSumatif: 'Penilaian Kinerja',
    asesmenSumatif: '',
    jenisRubrik: 'Rubrik Analitik',
    indikatorRubrik: '',
    remixText: '',
    hasInklusi: false,
    jumlahInklusi: '',
    integrasiAdiwiyata: false,
    sekolahRamahAnak: false
  });

  const [profilLulusan, setProfilLulusan] = useLocalStorage('DeepLearningPlan_profilLulusan', {
    keimanan: false,
    kewargaan: false,
    penalaranKritis: false,
    kreativitas: false,
    kolaborasi: false,
    kemandirian: false,
    kesehatan: false,
    komunikasi: false
  });

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

  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        namaGuru: profile.displayName || prev.namaGuru,
        nip: profile.nip || prev.nip,
        eduLevel: profile.jenjang?.toLowerCase() || prev.eduLevel
      }));
    }
  }, [profile]);

  const handleProfilChange = (key: keyof typeof profilLulusan) => {
    setProfilLulusan(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePrinsipChange = (field: 'prinsipAwal' | 'prinsipMemahami' | 'prinsipMengaplikasi' | 'prinsipMerefleksi' | 'prinsipPenutup', value: string) => {
    setFormData(prev => {
      const currentArray = prev[field] as string[];
      if (currentArray.includes(value)) {
        return { ...prev, [field]: currentArray.filter(v => v !== value) };
      } else {
        return { ...prev, [field]: [...currentArray, value] };
      }
    });
  };

  useEffect(() => {
    const phases = phaseClassMap[formData.eduLevel]?.phases || [];
    const firstPhase = phases[0]?.id || '';
    
    const classes = phaseClassMap[formData.eduLevel]?.classes[firstPhase] || [];
    const firstClass = classes[0]?.id || '';

    const subjects = subjectsByLevel[formData.eduLevel] || [];
    const firstSubject = subjects[0]?.id || '';
    
    const topics = topicsBySubject[firstSubject] || topicsBySubject['default'];
    const firstTopic = topics[0] || '';

    setFormData(prev => ({ ...prev, fase: firstPhase, kelas: firstClass, mapel: firstSubject, topikMateri: firstTopic, isCustomTopik: false }));
  }, [formData.eduLevel]);

  useEffect(() => {
    const classes = phaseClassMap[formData.eduLevel]?.classes[formData.fase] || [];
    setFormData(prev => ({ ...prev, kelas: classes[0]?.id || '' }));
  }, [formData.fase, formData.eduLevel]);

  useEffect(() => {
    const topics = topicsBySubject[formData.mapel] || topicsBySubject['default'];
    setFormData(prev => ({ ...prev, topikMateri: topics[0] || '', isCustomTopik: false }));
  }, [formData.mapel]);

  const generatePlan = async () => {
    setIsGenerating(true);
    setError('');
    
    try {
      const ai = new GoogleGenAI({});
      
      const subjectLabel = subjectsByLevel[formData.eduLevel]?.find(s => s.id === formData.mapel)?.label || formData.mapel;
      const faseLabel = phaseClassMap[formData.eduLevel]?.phases.find(p => p.id === formData.fase)?.label || formData.fase;
      const kelasLabel = phaseClassMap[formData.eduLevel]?.classes[formData.fase]?.find(c => c.id === formData.kelas)?.label || formData.kelas;
      const jenjangLabel = educationLevels.find(l => l.id === formData.eduLevel)?.label || formData.eduLevel;
      const selectedProfil = Object.entries(profilLulusan)
        .filter(([_, isSelected]) => isSelected)
        .map(([key]) => {
          const labels: Record<string, string> = {
            keimanan: 'Keimanan dan Ketakwaan terhadap Tuhan YME',
            kewargaan: 'Kewargaan',
            penalaranKritis: 'Penalaran Kritis',
            kreativitas: 'Kreativitas',
            kolaborasi: 'Kolaborasi',
            kemandirian: 'Kemandirian',
            kesehatan: 'Kesehatan',
            komunikasi: 'Komunikasi'
          };
          return labels[key];
        });

      const formatInstruction = formatPerangkat === 'kemenag' 
        ? "Kemenag RPM (Rencana Pelaksanaan Pembelajaran/Modul Ajar) Berbasis Cinta"
        : "Rencana Pembelajaran Mendalam (Deep Learning Plan) Kurikulum Merdeka";
      
      const prompt = `Pastikan dokumen ini disusun sesuai standar terbaru Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi (Kemendikbudristek) serta Kementerian Agama (Kemenag) Republik Indonesia, mengikuti panduan Kurikulum Merdeka yang mengikat.

Buatkan ${formatInstruction} untuk:
Mata Pelajaran: ${subjectLabel}
Topik/Materi: ${formData.topikMateri}
Fase/Kelas/Semester: ${faseLabel} / ${kelasLabel} / Semester ${formData.semester}
Alokasi Waktu: ${formData.alokasiWaktu || 'Tidak ditentukan'}
Nama Guru: ${formData.namaGuru}
${formData.jenisNipGuru} Guru: ${formData.nip}
Sekolah: ${formData.sekolah} (${formData.jenisSekolah})
Kepala Sekolah: ${formData.kepalaSekolah}
${formData.jenisNipKepalaSekolah} Kepala Sekolah: ${formData.nipKepalaSekolah}
Dimensi Profil Lulusan: ${selectedProfil.join(', ') || 'Tidak ditentukan'}
Praktik Pedagogis: ${formData.praktikPedagogis}
Prinsip Awal: ${formData.prinsipAwal.join(', ')}
Prinsip Memahami: ${formData.prinsipMemahami.join(', ')}
Prinsip Mengaplikasi: ${formData.prinsipMengaplikasi.join(', ')}
Prinsip Merefleksi: ${formData.prinsipMerefleksi.join(', ')}
Prinsip Penutup: ${formData.prinsipPenutup.join(', ')}
Jenis Asesmen Awal: ${formData.jenisAsesmenAwal}
Jenis Asesmen Formatif: ${formData.jenisAsesmenFormatif}
Jenis Asesmen Sumatif: ${formData.jenisAsesmenSumatif}
Jenis Rubrik Penilaian: ${formData.jenisRubrik}
Indikator & Keterangan Rubrik yang Diinginkan: ${formData.indikatorRubrik || 'Tentukan sendiri berdasarkan topik'}
${formData.hasInklusi ? `Terdapat Anak Inklusi: Ya, berjumlah ${formData.jumlahInklusi} siswa. Pastikan hasil generate menyediakan adaptasi atau modifikasi untuk anak inklusi.` : ''}
${formData.integrasiAdiwiyata ? `Integrasi Adiwiyata: Ya. Pastikan rencana pembelajaran mengintegrasikan Pendidikan Lingkungan Hidup.` : ''}
${formData.sekolahRamahAnak ? `Sekolah Ramah Anak: Ya. Pastikan pendekatan inklusif dan aman untuk semua siswa diterapkan dalam rencana pembelajaran.` : ''}

${formData.remixText ? `INSTRUKSI REMIX:
Gunakan teks referensi berikut sebagai dasar utama pembuatan Deep Learning Plan. Remix dan kembangkan konten ini agar sesuai dengan kurikulum merdeka dan target audiens di atas:
---
${formData.remixText}
---` : ''}

${formatPerangkat === 'kemenag' ? `Konteks Kemenag & Berbasis Cinta (WAJIB DITAMBAHKAN DALAM RENCANA & KONTEN):
1. Profil Pelajar Rahmatan Lil 'Alamin (PPRA): Tambahkan elemen moderasi beragama (seperti Berkeadaban/Ta'addub, Keteladanan/Qudwah, atau Toleransi/Tasamuh).
2. Pendekatan Berbasis Cinta (Heartful Learning): Deskripsikan secara konkret bagaimana guru menunjukkan kasih sayang, empati, apresiasi, dan ikatan emosional yang kuat dengan siswa di setiap tahapan.
3. Nilai Spiritual: Integrasikan nilai-nilai agama dan pesan moral dalam penyampaian materi.
` : ''}
Konteks Kurikulum Merdeka & Pedagogi (SANGAT PENTING):
1. Taksonomi/Pendekatan Kognitif: ${formData.kerangkaTaksonomi === 'bloom' ? 'Taksonomi Bloom' : 'Taksonomi SOLO'} pada level: ${formData.levelTaksonomi}.
   - Seimbangkan LOTS (C1-C2) dan HOTS (C4-C6) sesuai target jika menggunakan Bloom.
   - Integrasikan Dimensi Pengetahuan: Faktual, Konseptual, Prosedural, dan Metakognitif.
   - PENTING: JANGAN tampilkan label "C1", "C2", dll. secara eksplisit pada hasil akhir, cukup terapkan dalam kata kerja operasional dan aktivitas.
2. Tujuan Pembelajaran (ABCD): Rumuskan tujuan pembelajaran dengan kaidah Audience (Peserta Didik), Behaviour (Perilaku/KKO), Condition (Kondisi/Metode), dan Degree (Kriteria/Tingkat Keberhasilan).
3. Pendekatan TPACK & STEAM:
   - TPACK (Technological Pedagogical Content Knowledge): Tunjukkan bagaimana guru menggunakan teknologi dan pedagogi yang tepat untuk menyampaikan konten materi.
   - STEAM (Science, Technology, Engineering, Art, Mathematics): Integrasikan elemen STEAM dalam aktivitas siswa untuk melatih berpikir kritis, kreatif, dan pemecahan masalah.

Berikan hasil dalam format JSON dengan struktur berikut. Pastikan semua rencana pembelajaran mendalam (Identifikasi, Desain Pembelajaran, Pengalaman Belajar, Asesmen, dan Tindak Lanjut) terisi secara otomatis dan komprehensif. PENTING: Untuk cetak yang rapi, susun konten paragraf dengan baris baru (newline ganda \\n\\n) agar tidak menumpuk. Gunakan tabel Markdown (dengan header | Kolom |) pada konten yang sesuai (misalnya Rubrik Penilaian) agar tersusun rapi:
{
  "pesertaDidik": "Identifikasi kesiapan peserta didik sebelum belajar, seperti pengetahuan awal, minat, latar belakang, dan kebutuhan belajar",
  "topikPelajaran": "Analisis topik pelajaran seperti jenis pengetahuan yang akan dicapai, relevansi dengan kehidupan nyata, tingkat kesulitan",
  "capaianPembelajaran": "Capaian pembelajaran sesuai fase",
  "lintasDisiplin": "Penjelasan singkat tentang integrasi dengan disiplin ilmu lain",
  "tujuanPembelajaran": "Tujuan pembelajaran yang spesifik dan terukur",
  "lingkunganBelajar": "Deskripsi lingkungan belajar fisik dan psikologis",
  "kemitraanPembelajaran": "Keterlibatan pihak luar (orang tua, komunitas, ahli)",
  "pemanfaatanDigital": "Penggunaan teknologi dalam pembelajaran",
  "awal": "Pengalaman belajar untuk tahap awal (sesuaikan dengan prinsip ${formData.prinsipAwal.join(', ')})",
  "memahami": "Pengalaman belajar untuk tahap memahami (sesuaikan dengan prinsip ${formData.prinsipMemahami.join(', ')})",
  "mengaplikasi": "Pengalaman belajar untuk tahap mengaplikasi (sesuaikan dengan prinsip ${formData.prinsipMengaplikasi.join(', ')})",
  "merefleksi": "Pengalaman belajar untuk tahap merefleksi (sesuaikan dengan prinsip ${formData.prinsipMerefleksi.join(', ')})",
  "penutup": "Pengalaman belajar untuk tahap penutup (sesuaikan dengan prinsip ${formData.prinsipPenutup.join(', ')})",
  "asesmenAwal": "Metode asesmen awal/diagnostik menggunakan ${formData.jenisAsesmenAwal}",
  "asesmenFormatif": "Metode asesmen formatif selama proses menggunakan ${formData.jenisAsesmenFormatif}",
  "asesmenSumatif": "Metode asesmen sumatif di akhir menggunakan ${formData.jenisAsesmenSumatif}",
  "rubrik": [
    {
      "indikator": "Indikator penilaian (Sesuaikan dengan Mata Pelajaran dan sumber-sumber terpercaya dari Kementerian Pendidikan Dasar dan Menengah)",
      "keterangan": "Keterangan atau deskripsi singkat mengenai indikator ini",
      "baruMemulai": "Deskripsi baru memulai",
      "berkembang": "Deskripsi berkembang",
      "cakap": "Deskripsi cakap",
      "mahir": "Deskripsi mahir"
    }
  ]
}`;

      const response = await ai.models.generateContent({
        model: selectedModel,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.7,
          topP: 0.9,
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              pesertaDidik: { type: Type.STRING },
              topikPelajaran: { type: Type.STRING },
              capaianPembelajaran: { type: Type.STRING },
              lintasDisiplin: { type: Type.STRING },
              tujuanPembelajaran: { type: Type.STRING },
              lingkunganBelajar: { type: Type.STRING },
              kemitraanPembelajaran: { type: Type.STRING },
              pemanfaatanDigital: { type: Type.STRING },
              awal: { type: Type.STRING },
              memahami: { type: Type.STRING },
              mengaplikasi: { type: Type.STRING },
              merefleksi: { type: Type.STRING },
              penutup: { type: Type.STRING },
              asesmenAwal: { type: Type.STRING },
              asesmenFormatif: { type: Type.STRING },
              asesmenSumatif: { type: Type.STRING },
              rubrik: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    indikator: { type: Type.STRING },
                    keterangan: { type: Type.STRING },
                    baruMemulai: { type: Type.STRING },
                    berkembang: { type: Type.STRING },
                    cakap: { type: Type.STRING },
                    mahir: { type: Type.STRING }
                  },
                  required: ["indikator", "keterangan", "baruMemulai", "berkembang", "cakap", "mahir"]
                }
              }
            },
            required: ["pesertaDidik", "topikPelajaran", "capaianPembelajaran", "lintasDisiplin", "tujuanPembelajaran", "lingkunganBelajar", "kemitraanPembelajaran", "pemanfaatanDigital", "awal", "memahami", "mengaplikasi", "merefleksi", "penutup", "asesmenAwal", "asesmenFormatif", "asesmenSumatif", "rubrik"]
          }
        }
      });

      const generatedData = JSON.parse(response.text || '{}');

      setResult({
        ...formData,
        ...generatedData,
        subjectLabel,
        faseLabel,
        kelasLabel,
        jenjangLabel,
        nip: formData.nip,
        selectedProfil
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Terjadi kesalahan saat menghasilkan rencana pembelajaran.');
    } finally {
      setIsGenerating(false);
    }
  };

  const printPlan = () => {
    if (!result) return;
    
    const printWindow = createPrintWindow();
    if (!printWindow) return;

    const profilHtml = result.selectedProfil?.map((p: string) => `<li>${p}</li>`).join('') || '';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
          <title>Rencana Pembelajaran Mendalam</title>
          <style>
              @page {
                size: A4;
                margin: 30mm 30mm 30mm 40mm;
              }
              @media print {
                  body { 
                    -webkit-print-color-adjust: exact; 
                    print-color-adjust: exact; 
                  }
                  .no-print { display: none; }
                  .content-wrapper {
                    max-width: 100% !important;
                    padding: 0 !important;
                    margin: 0 !important;
                  }
              }
              body {
                font-family: 'Arial', 'Helvetica', 'Inter', sans-serif;
                background: white;
                position: relative;
                min-height: 100vh;
                margin: 0;
                padding: 0;
                line-height: 1.5;
                color: #333;
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
              h1, h2, h3 { text-align: center; color: #0f172a; }
              table { width: 100%; border-collapse: collapse; margin: 15px 0; }
              th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; vertical-align: top; }
              th { background: #f1f5f9; font-weight: bold; width: 25%; }
              .header { text-align: center; margin-bottom: 25px; border-bottom: 3px double #000; padding-bottom: 10px; }
              .section-title { font-weight: bold; font-size: 1.2em; margin-top: 20px; background: #e2e8f0; padding: 5px 10px; }
              .content-box { padding: 10px; border: 1px solid #cbd5e1; margin-top: 5px; min-height: 50px; }
              ul { margin: 0; padding-left: 20px; }
          
              table { width: 100%; border-collapse: collapse; margin-bottom: 20px; page-break-inside: auto; }
              tr { page-break-inside: avoid; page-break-after: auto; }
              thead { display: table-header-group; }
              tfoot { display: table-footer-group; }
            </style>
      </head>
      <body>
          <div class="watermark">PEMURYADI - MAJU PENDIDIKAN INDONESIA</div>
          <div class="content-wrapper">
              <div class="header" style="position: relative; text-align: center; margin-bottom: 25px; border-bottom: 3px double #000; padding-bottom: 10px;">
                  ${useLogo && logoUrl ? `<img src="${logoUrl}" style="position: absolute; left: 0; top: 0; height: 80px; width: auto;" alt="Logo"/>` : ''}
                  <div style="padding: 0 90px;">
                      <div style="font-size: 11pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">
                          ${result.isKemenag ? 'KEMENTERIAN AGAMA REPUBLIK INDONESIA' : 'KEMENTERIAN PENDIDIKAN DASAR DAN MENENGAH'}
                      </div>
                      <div style="font-size: 13pt; font-weight: bold; text-transform: uppercase; margin-top: 3px;">
                          ${result.sekolah || 'SATUAN PENDIDIKAN'}
                      </div>
                      <div style="font-size: 9pt; margin-top: 2px;">
                          Tahun Pelajaran: ${result.tahunPelajaran || '-'}
                      </div>
                  </div>
              </div>
              <hr style="border: none; border-top: 3px double #000; margin-top: 5px; margin-bottom: 20px;" />
              
              <h3 style="margin: 0; font-size: 12pt; font-weight: bold; text-transform: uppercase; line-height: 1.4;">
                  ${result.isKemenag ? 'RENCANA PELAKSANAAN PEMBELAJARAN (RPP) BERBASIS CINTA' : 'RENCANA PELAKSANAAN PEMBELAJARAN (RPP) / MODUL AJAR MENDALAM'}
              </h3>
              <div style="font-size: 10pt; margin-top: 5px; font-style: italic; text-align: center;">
                  Kurikulum Merdeka (Sesuai Panduan Pembelajaran dan Asesmen)
              </div>

              <table>
                  <tr>
                      <th>Sekolah</th><td>${result.sekolah || '-'} (${result.jenisSekolah || 'Negeri'})</td>
                      <th>Jenjang/Fase/Kelas/Semester</th><td>${result.jenjangLabel} / ${result.faseLabel} / ${result.kelasLabel} / ${result.semester}</td>
                  </tr>
                  <tr>
                      <th>Mata Pelajaran</th><td>${result.subjectLabel}</td>
                      <th>Alokasi Waktu</th><td>${result.alokasiWaktu || '-'}</td>
                  </tr>
                  <tr>
                      <th>Nama Guru</th><td>${result.namaGuru || '-'}</td>
                      <th>${result.jenisNipGuru || 'NIP'} Guru</th><td>${result.nip || '-'}</td>
                  </tr>
                  <tr>
                      <th>Kepala Sekolah</th><td>${result.kepalaSekolah || '-'}</td>
                      <th>${result.jenisNipKepalaSekolah || 'NIP'} Kepsek</th><td>${result.nipKepalaSekolah || '-'}</td>
                  </tr>
                  <tr>
                      <th>Jenis Guru</th><td colspan="3">${result.jenisGuru || '-'}</td>
                  </tr>
              </table>

              <div class="section-title">A. Identifikasi</div>
              <table>
                  <tr>
                      <th>Peserta Didik</th>
                      <td>${result.pesertaDidik.replace(/\\n/g, '<br>') || '-'}</td>
                  </tr>
                  <tr>
                      <th>Topik Pelajaran</th>
                      <td>${result.topikPelajaran.replace(/\\n/g, '<br>') || '-'}</td>
                  </tr>
                  <tr>
                      <th>Dimensi Profil Lulusan</th>
                      <td><ul>${profilHtml || '<li>-</li>'}</ul></td>
                  </tr>
              </table>

              <div class="section-title">B. Desain Pembelajaran</div>
              <table>
                  <tr>
                      <th>Capaian Pembelajaran</th>
                      <td>${result.capaianPembelajaran.replace(/\\n/g, '<br>') || '-'}</td>
                  </tr>
                  <tr>
                      <th>Lintas Disiplin Ilmu</th>
                      <td>${result.lintasDisiplin || '-'}</td>
                  </tr>
                  <tr>
                      <th>Tujuan Pembelajaran</th>
                      <td>${result.tujuanPembelajaran.replace(/\\n/g, '<br>') || '-'}</td>
                  </tr>
                  <tr>
                      <th>Praktik Pedagogis</th>
                      <td>${result.praktikPedagogis.replace(/\\n/g, '<br>') || '-'}</td>
                  </tr>
                  <tr>
                      <th>Kemitraan Pembelajaran</th>
                      <td>${result.kemitraanPembelajaran.replace(/\\n/g, '<br>') || '-'}</td>
                  </tr>
                  <tr>
                      <th>Lingkungan Pembelajaran</th>
                      <td>${result.lingkunganBelajar.replace(/\\n/g, '<br>') || '-'}</td>
                  </tr>
                  <tr>
                      <th>Pemanfaatan Digital</th>
                      <td>${result.pemanfaatanDigital.replace(/\\n/g, '<br>') || '-'}</td>
                  </tr>
              </table>

              <div class="section-title">C. Pengalaman Belajar</div>
              <table>
                  <tr>
                      <th>AWAL<br><small>(${result.prinsipAwal.join(', ')})</small></th>
                      <td>${result.awal.replace(/\\n/g, '<br>') || '-'}</td>
                  </tr>
                  <tr>
                      <th colspan="2" style="background-color: #f1f5f9;">INTI</th>
                  </tr>
                  <tr>
                      <th>Memahami<br><small>(${result.prinsipMemahami.join(', ')})</small></th>
                      <td>${result.memahami.replace(/\\n/g, '<br>') || '-'}</td>
                  </tr>
                  <tr>
                      <th>Mengaplikasi<br><small>(${result.prinsipMengaplikasi.join(', ')})</small></th>
                      <td>${result.mengaplikasi.replace(/\\n/g, '<br>') || '-'}</td>
                  </tr>
                  <tr>
                      <th>Merefleksi<br><small>(${result.prinsipMerefleksi.join(', ')})</small></th>
                      <td>${result.merefleksi.replace(/\\n/g, '<br>') || '-'}</td>
                  </tr>
                  <tr>
                      <th>PENUTUP<br><small>(${result.prinsipPenutup.join(', ')})</small></th>
                      <td>${result.penutup.replace(/\\n/g, '<br>') || '-'}</td>
                  </tr>
              </table>

              <div class="section-title">D. Asesmen Pembelajaran</div>
              <table>
                  <tr>
                      <th>Asesmen pada Awal Pembelajaran<br><small>(${result.jenisAsesmenAwal})</small></th>
                      <td>${result.asesmenAwal.replace(/\\n/g, '<br>') || '-'}</td>
                  </tr>
                  <tr>
                      <th>Asesmen pada Proses Pembelajaran<br><small>(${result.jenisAsesmenFormatif})</small></th>
                      <td>${result.asesmenFormatif.replace(/\\n/g, '<br>') || '-'}</td>
                  </tr>
                  <tr>
                      <th>Asesmen pada Akhir Pembelajaran<br><small>(${result.jenisAsesmenSumatif})</small></th>
                      <td>${result.asesmenSumatif.replace(/\\n/g, '<br>') || '-'}</td>
                  </tr>
              </table>

              <div class="section-title">Rubrik Penilaian (${result.jenisRubrik || 'Rubrik'})</div>
              <table>
                  <tr>
                      <th>Indikator</th>
                      <th>Keterangan</th>
                      <th>Baru Memulai</th>
                      <th>Berkembang</th>
                      <th>Cakap</th>
                      <th>Mahir</th>
                  </tr>
                  ${result.rubrik ? result.rubrik.map((r: any) => `
                  <tr>
                      <td>${r.indikator}</td>
                      <td>${r.keterangan || '-'}</td>
                      <td>${r.baruMemulai}</td>
                      <td>${r.berkembang}</td>
                      <td>${r.cakap}</td>
                      <td>${r.mahir}</td>
                  </tr>`).join('') : '<tr><td colspan="6" style="text-align:center;">Tidak ada rubrik</td></tr>'}
              </table>

              ${(formData.kepalaSekolah || formData.namaGuru) ? `<div style="margin-top: 40px; display: flex; justify-content: space-between; text-align: center; font-size: 12px; page-break-inside: avoid;">
                  <div style="width: 45%;">
                      <p>Mengetahui,</p>
                      <p>Kepala Sekolah</p>
                      <br><br><br><br>
                      <p style="font-weight: bold; text-decoration: underline;">${formData.kepalaSekolah || '................................'}</p>
                      <p>${formData.jenisNipKepalaSekolah || 'NIP'}. ${formData.nipKepalaSekolah || '................................'}</p>
                  </div>
                  <div style="width: 45%;">
                      <p>Dibuat pada, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      <p>${formData.jenisGuru || 'Guru'}</p>
                      <br><br><br><br>
                      <p style="font-weight: bold; text-decoration: underline;">${formData.namaGuru || '................................'}</p>
                      <p>${formData.jenisNipGuru || 'NIP'}. ${formData.nip || '................................'}</p>
                  </div>
              </div>` : ''}
              
              <div style="margin-top: 50px; text-align: center; font-style: italic; font-size: 10px; color: #999; border-top: 1px solid #eee; padding-top: 10px;">
                  Dokumen ini dihasilkan secara otomatis oleh AI Deep Learning Plan - Pemuryadi<br/>
                  Maju Pendidikan Indonesia &copy; ${new Date().getFullYear()}<br/>
                  *Jangan lupa support saya agar makin berusaha dalam memperbaiki website ini*
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
    <div className="flex flex-col h-full bg-gray-50 text-gray-900 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 border border-emerald-200 shadow-sm">
            <Brain size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-wide">{formatPerangkat === 'standar' ? 'Rencana Pembelajaran Mendalam' : 'Kemenag RPM'}</h1>
            <p className="text-sm text-emerald-600">{formatPerangkat === 'standar' ? 'Format Perencanaan Pembelajaran Mendalam Kurikulum Merdeka' : 'Rencana Pelaksanaan Pembelajaran/Modul Ajar Berbasis Cinta'}</p>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-4 md:p-6">
        <div className="max-w-7xl mx-auto flex flex-col gap-6">

          {/* Sub Tab Menu */}
          <div className="flex bg-gray-100 p-1 rounded-xl shadow-inner border border-gray-200">
            <button 
              onClick={() => setFormatPerangkat('standar')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-300 ${formatPerangkat === 'standar' ? 'bg-white text-emerald-700 shadow-md transform scale-[1.02]' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-200'}`}
            >
              Standar Kemendikbudristek
            </button>
            <button 
              onClick={() => setFormatPerangkat('kemenag')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-300 ${formatPerangkat === 'kemenag' ? 'bg-emerald-50 text-emerald-700 shadow-md border border-emerald-200 transform scale-[1.02]' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-200'}`}
            >
              Kemenag RPM Berbasis Cinta
            </button>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-6">
          
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <button 
              onClick={() => toggleSection('info')}
              className="w-full flex items-center justify-between p-6 bg-white hover:bg-gray-50 transition-colors"
            >
              <h4 className="font-semibold text-emerald-600 flex items-center gap-2"><School className="w-5 h-5" /> Informasi Umum</h4>
              {expandedSections['info'] ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </button>
            {expandedSections['info'] && (
              <div className="p-6 pt-0 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="col-span-2 md:col-span-1">
                <AIAssistedInput type="text" placeholder="Nama Sekolah" value={formData.sekolah} onChange={e => setFormData({...formData, sekolah: e.target.value})} className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-emerald-500 transition-all" />
              </div>
              <div className="col-span-2 md:col-span-1">
                <select value={formData.jenisSekolah} onChange={e => setFormData({...formData, jenisSekolah: e.target.value})} className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-emerald-500 transition-all">
                  <option value="Negeri">Negeri</option>
                  <option value="Swasta">Swasta</option>
                  <option value="Islam Terpadu">Islam Terpadu</option>
                </select>
              </div>
              <div className="col-span-2 md:col-span-1">
                <AIAssistedInput type="text" placeholder="Nama Kepala Sekolah" value={formData.kepalaSekolah} onChange={e => setFormData({...formData, kepalaSekolah: e.target.value})} className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-emerald-500 transition-all" />
              </div>
              <div className="col-span-2 md:col-span-1 flex gap-2">
                <select value={formData.jenisNipKepalaSekolah} onChange={e => setFormData({...formData, jenisNipKepalaSekolah: e.target.value})} className="w-1/3 bg-gray-50 border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-emerald-500 transition-all">
                  <option value="NIP">NIP</option>
                  <option value="NUPTK">NUPTK</option>
                  <option value="NIY">NIY</option>
                  <option value="NRG">NRG</option>
                  <option value="NPK">NPK</option>
                </select>
                <AIAssistedInput type="text" placeholder="Nomor Induk Kepala Sekolah" value={formData.nipKepalaSekolah} onChange={e => setFormData({...formData, nipKepalaSekolah: e.target.value})} className="w-2/3 bg-gray-50 border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-emerald-500 transition-all" />
              </div>
              <div className="col-span-2">
                <LogoUploader useLogo={useLogo} setUseLogo={setUseLogo} logoUrl={logoUrl} setLogoUrl={setLogoUrl} />
              </div>
              <div className="col-span-2 md:col-span-1">
                <AIAssistedInput type="text" placeholder="Nama Guru" value={formData.namaGuru} onChange={e => setFormData({...formData, namaGuru: e.target.value})} className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-emerald-500 transition-all" />
              </div>
              <div className="col-span-2 md:col-span-1 flex gap-2">
                <select value={formData.jenisNipGuru} onChange={e => setFormData({...formData, jenisNipGuru: e.target.value})} className="w-1/3 bg-gray-50 border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-emerald-500 transition-all">
                  <option value="NIP">NIP</option>
                  <option value="NUPTK">NUPTK</option>
                  <option value="NIY">NIY</option>
                  <option value="NRG">NRG</option>
                  <option value="NPK">NPK</option>
                </select>
                <AIAssistedInput type="text" placeholder="Nomor Induk Guru" value={formData.nip} onChange={e => setFormData({...formData, nip: e.target.value})} className="w-2/3 bg-gray-50 border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-emerald-500 transition-all" />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="block text-xs font-medium text-gray-600 mb-1">Jenis Guru</label>
                <select value={formData.jenisGuru} onChange={e => setFormData({...formData, jenisGuru: e.target.value})} className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-emerald-500 transition-all">
                  <option value="Guru Kelas">Guru Kelas</option>
                  <option value="Guru Mapel (PJOK, PAdDP)">Guru Mapel (PJOK, PAdDP)</option>
                </select>
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="block text-xs font-medium text-gray-600 mb-1">Semester</label>
                <select value={formData.semester} onChange={e => setFormData({...formData, semester: e.target.value})} className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-emerald-500 transition-all">
                  <option value="1">Ganjil (1)</option>
                  <option value="2">Genap (2)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Jenjang</label>
                <select value={formData.eduLevel} onChange={e => setFormData({...formData, eduLevel: e.target.value})} className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-emerald-500 transition-all">
                  {educationLevels.map(level => (
                    <option key={level.id} value={level.id}>{level.label}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Fase</label>
                  <select value={formData.fase} onChange={e => setFormData({...formData, fase: e.target.value})} className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-emerald-500 transition-all">
                    {phaseClassMap[formData.eduLevel]?.phases.map(p => (
                      <option key={p.id} value={p.id}>{p.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Kelas</label>
                  <select value={formData.kelas} onChange={e => setFormData({...formData, kelas: e.target.value})} className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-emerald-500 transition-all">
                    {phaseClassMap[formData.eduLevel]?.classes[formData.fase]?.map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Mata Pelajaran</label>
                <select value={formData.mapel} onChange={e => setFormData({...formData, mapel: e.target.value})} className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-emerald-500 transition-all">
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
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-emerald-500 transition-all"
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
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-emerald-500 transition-all mt-3" 
                  />
                )}
              </div>
              <div className="col-span-2 md:col-span-1">
                <AIAssistedInput type="text" placeholder="Alokasi Waktu (Contoh: 4 Pertemuan / 8 JP)" value={formData.alokasiWaktu} onChange={e => setFormData({...formData, alokasiWaktu: e.target.value})} className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-emerald-500 transition-all" />
              </div>
              <div className="col-span-2 md:col-span-1 border border-gray-200 rounded-xl p-3 bg-white">
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-3">Kerangka Taksonomi</label>
                <div className="flex gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, kerangkaTaksonomi: 'bloom', levelTaksonomi: 'Campuran (Sesuai Kurikulum Merdeka)'})}
                    className={`flex-1 py-1.5 px-2 rounded-full text-xs font-semibold transition-all ${formData.kerangkaTaksonomi === 'bloom' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                  >
                    Taksonomi Bloom
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, kerangkaTaksonomi: 'solo', levelTaksonomi: 'Relasional'})}
                    className={`flex-1 py-1.5 px-2 rounded-full text-xs font-semibold transition-all ${formData.kerangkaTaksonomi === 'solo' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                  >
                    Taksonomi SOLO
                  </button>
                </div>

                <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-3">Level Yang Digunakan</label>
                <div className="flex flex-wrap gap-2">
                  {(formData.kerangkaTaksonomi === 'bloom' ? TAKSONOMI_BLOOM : TAKSONOMI_SOLO).map(lvl => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setFormData({...formData, levelTaksonomi: lvl})}
                      className={`py-1 px-3 rounded-full text-xs font-medium transition-all ${formData.levelTaksonomi === lvl ? 'bg-emerald-500 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                    >
                      {lvl.split(':')[0]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="col-span-2 md:col-span-1">
                <label className="flex items-start gap-3 p-4 bg-gray-50 border border-gray-300 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.integrasiAdiwiyata}
                    onChange={(e) => setFormData({...formData, integrasiAdiwiyata: e.target.checked})}
                    className="mt-1 w-5 h-5 rounded border-black text-emerald-500 focus:ring-emerald-500 bg-white"
                  />
                  <div>
                    <span className="block text-sm font-bold text-gray-900">Integrasi Adiwiyata</span>
                    <span className="block text-xs text-gray-600 mt-0.5">Pendidikan Lingkungan Hidup</span>
                  </div>
                </label>
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="flex items-start gap-3 p-4 bg-gray-50 border border-gray-300 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.sekolahRamahAnak}
                    onChange={(e) => setFormData({...formData, sekolahRamahAnak: e.target.checked})}
                    className="mt-1 w-5 h-5 rounded border-black text-emerald-500 focus:ring-emerald-500 bg-white"
                  />
                  <div>
                    <span className="block text-sm font-bold text-gray-900">Sekolah Ramah Anak</span>
                    <span className="block text-xs text-gray-600 mt-0.5">Pendekatan inklusif & aman</span>
                  </div>
                </label>
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

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <button 
              onClick={() => toggleSection('identifikasi')}
              className="w-full flex items-center justify-between p-6 bg-white hover:bg-gray-50 transition-colors"
            >
              <h4 className="font-semibold text-emerald-600 flex items-center gap-2">A. Identifikasi</h4>
              {expandedSections['identifikasi'] ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </button>
            {expandedSections['identifikasi'] && (
              <div className="p-6 pt-0 border-t border-gray-100">
                <div className="space-y-4 mt-4">
                  <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Peserta Didik</label>
                <AIAssistedTextarea rows={2} value={formData.pesertaDidik} onChange={e => setFormData({...formData, pesertaDidik: e.target.value})} className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-emerald-500 transition-all" placeholder="Contoh: Peserta didik kelas 1 dengan gaya belajar beragam..." />
              </div>
              
              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={formData.hasInklusi}
                    onChange={(e) => setFormData({...formData, hasInklusi: e.target.checked})}
                    className="w-4 h-4 rounded border-black text-emerald-500 focus:ring-emerald-500 focus:ring-offset-white bg-white"
                  />
                  <span className="text-sm font-medium text-gray-700">Terdapat Anak Inklusi</span>
                </label>
                
                {formData.hasInklusi && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Jumlah Siswa Inklusi</label>
                    <input 
                      type="number"
                      min="1"
                      className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-emerald-500 transition-all"
                      placeholder="Masukkan jumlah siswa inklusi..."
                      value={formData.jumlahInklusi}
                      onChange={(e) => setFormData({...formData, jumlahInklusi: e.target.value})}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Topik Pelajaran</label>
                <AIAssistedTextarea rows={2} value={formData.topikPelajaran} onChange={e => setFormData({...formData, topikPelajaran: e.target.value})} className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-emerald-500 transition-all" placeholder="Contoh: Membaca suku kata 'ba, bi, bu, be, bo'..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Dimensi Profil Lulusan</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.keys(profilLulusan).map((key) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={profilLulusan[key as keyof typeof profilLulusan]} 
                        onChange={() => handleProfilChange(key as keyof typeof profilLulusan)}
                        className="w-4 h-4 text-emerald-500 bg-red-100 border-black rounded focus:ring-emerald-500"
                      />
                      <span className="text-xs text-gray-700 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <button 
              onClick={() => toggleSection('desain')}
              className="w-full flex items-center justify-between p-6 bg-white hover:bg-gray-50 transition-colors"
            >
              <h4 className="font-semibold text-emerald-600 flex items-center gap-2">B. Desain Pembelajaran</h4>
              {expandedSections['desain'] ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </button>
            {expandedSections['desain'] && (
              <div className="p-6 pt-0 border-t border-gray-100">
                <div className="space-y-4 mt-4">
                  <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capaian Pembelajaran</label>
                <AIAssistedTextarea rows={2} value={formData.capaianPembelajaran} onChange={e => setFormData({...formData, capaianPembelajaran: e.target.value})} className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-emerald-500 transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lintas Disiplin Ilmu</label>
                <AIAssistedTextarea rows={2} value={formData.lintasDisiplin} onChange={e => setFormData({...formData, lintasDisiplin: e.target.value})} className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-emerald-500 transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tujuan Pembelajaran</label>
                <AIAssistedTextarea rows={2} value={formData.tujuanPembelajaran} onChange={e => setFormData({...formData, tujuanPembelajaran: e.target.value})} className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-emerald-500 transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Praktik Pedagogis</label>
                <select value={formData.praktikPedagogis} onChange={e => setFormData({...formData, praktikPedagogis: e.target.value})} className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-emerald-500 transition-all mb-2">
                  <option value="Pembelajaran Berbasis Masalah (Problem Based Learning)">Pembelajaran Berbasis Masalah (Problem Based Learning)</option>
                  <option value="Pembelajaran Berbasis Proyek (Project Based Learning)">Pembelajaran Berbasis Proyek (Project Based Learning)</option>
                  <option value="Pembelajaran Inkuiri (Inquiry Learning)">Pembelajaran Inkuiri (Inquiry Learning)</option>
                  <option value="Pembelajaran Penemuan (Discovery Learning)">Pembelajaran Penemuan (Discovery Learning)</option>
                  <option value="Pembelajaran Kontekstual (Contextual Teaching and Learning)">Pembelajaran Kontekstual (Contextual Teaching and Learning)</option>
                  <option value="Bermain Peran (Role Playing)">Bermain Peran (Role Playing)</option>
                  <option value="Pembelajaran Kooperatif (Cooperative Learning)">Pembelajaran Kooperatif (Cooperative Learning)</option>
                  {formatPerangkat === 'kemenag' && <option value="Pendekatan Kurikulum Berbasis Cinta">Pendekatan Kurikulum Berbasis Cinta</option>}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lingkungan Pembelajaran</label>
                <AIAssistedTextarea rows={2} value={formData.lingkunganBelajar} onChange={e => setFormData({...formData, lingkunganBelajar: e.target.value})} className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-emerald-500 transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kemitraan Pembelajaran</label>
                <AIAssistedTextarea rows={2} value={formData.kemitraanPembelajaran} onChange={e => setFormData({...formData, kemitraanPembelajaran: e.target.value})} className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-emerald-500 transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pemanfaatan Digital</label>
                <AIAssistedTextarea rows={2} value={formData.pemanfaatanDigital} onChange={e => setFormData({...formData, pemanfaatanDigital: e.target.value})} className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-emerald-500 transition-all" />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <button 
              onClick={() => toggleSection('pengalaman')}
              className="w-full flex items-center justify-between p-6 bg-white hover:bg-gray-50 transition-colors"
            >
              <h4 className="font-semibold text-emerald-600 flex items-center gap-2">C. Pengalaman Belajar</h4>
              {expandedSections['pengalaman'] ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </button>
            {expandedSections['pengalaman'] && (
              <div className="p-6 pt-0 border-t border-gray-100">
                <div className="space-y-4 mt-4">
                  <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">AWAL</label>
                <div className="flex gap-4 mb-2">
                  {['Berkesadaran', 'Bermakna', 'Menggembirakan'].map(prinsip => (
                    <label key={prinsip} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={formData.prinsipAwal.includes(prinsip)} onChange={() => handlePrinsipChange('prinsipAwal', prinsip)} className="w-4 h-4 text-emerald-500 bg-red-100 border-black rounded focus:ring-emerald-500" />
                      <span className="text-xs text-gray-700">{prinsip}</span>
                    </label>
                  ))}
                </div>
                <AIAssistedTextarea rows={3} value={formData.awal} onChange={e => setFormData({...formData, awal: e.target.value})} className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-emerald-500 transition-all" />
              </div>
              
              <div className="pt-4 border-t border-black">
                <h5 className="font-medium text-gray-600 mb-3">INTI</h5>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Memahami</label>
                    <div className="flex gap-4 mb-2">
                      {['Berkesadaran', 'Bermakna', 'Menggembirakan'].map(prinsip => (
                        <label key={prinsip} className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={formData.prinsipMemahami.includes(prinsip)} onChange={() => handlePrinsipChange('prinsipMemahami', prinsip)} className="w-4 h-4 text-emerald-500 bg-red-100 border-black rounded focus:ring-emerald-500" />
                          <span className="text-xs text-gray-700">{prinsip}</span>
                        </label>
                      ))}
                    </div>
                    <AIAssistedTextarea rows={3} value={formData.memahami} onChange={e => setFormData({...formData, memahami: e.target.value})} className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-emerald-500 transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mengaplikasi</label>
                    <div className="flex gap-4 mb-2">
                      {['Berkesadaran', 'Bermakna', 'Menggembirakan'].map(prinsip => (
                        <label key={prinsip} className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={formData.prinsipMengaplikasi.includes(prinsip)} onChange={() => handlePrinsipChange('prinsipMengaplikasi', prinsip)} className="w-4 h-4 text-emerald-500 bg-red-100 border-black rounded focus:ring-emerald-500" />
                          <span className="text-xs text-gray-700">{prinsip}</span>
                        </label>
                      ))}
                    </div>
                    <AIAssistedTextarea rows={3} value={formData.mengaplikasi} onChange={e => setFormData({...formData, mengaplikasi: e.target.value})} className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-emerald-500 transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Merefleksi</label>
                    <div className="flex gap-4 mb-2">
                      {['Berkesadaran', 'Bermakna', 'Menggembirakan'].map(prinsip => (
                        <label key={prinsip} className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={formData.prinsipMerefleksi.includes(prinsip)} onChange={() => handlePrinsipChange('prinsipMerefleksi', prinsip)} className="w-4 h-4 text-emerald-500 bg-red-100 border-black rounded focus:ring-emerald-500" />
                          <span className="text-xs text-gray-700">{prinsip}</span>
                        </label>
                      ))}
                    </div>
                    <AIAssistedTextarea rows={3} value={formData.merefleksi} onChange={e => setFormData({...formData, merefleksi: e.target.value})} className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-emerald-500 transition-all" />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-black">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PENUTUP</label>
                  <div className="flex gap-4 mb-2">
                    {['Berkesadaran', 'Bermakna', 'Menggembirakan'].map(prinsip => (
                      <label key={prinsip} className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={formData.prinsipPenutup.includes(prinsip)} onChange={() => handlePrinsipChange('prinsipPenutup', prinsip)} className="w-4 h-4 text-emerald-500 bg-red-100 border-black rounded focus:ring-emerald-500" />
                        <span className="text-xs text-gray-700">{prinsip}</span>
                      </label>
                    ))}
                  </div>
                  <AIAssistedTextarea rows={3} value={formData.penutup} onChange={e => setFormData({...formData, penutup: e.target.value})} className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-emerald-500 transition-all" />
                  </div>
                </div>
              </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <button 
              onClick={() => toggleSection('asesmen')}
              className="w-full flex items-center justify-between p-6 bg-white hover:bg-gray-50 transition-colors"
            >
              <h4 className="font-semibold text-emerald-600 flex items-center gap-2">D. Asesmen dan Tindak Lanjut</h4>
              {expandedSections['asesmen'] ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </button>
            {expandedSections['asesmen'] && (
              <div className="p-6 pt-0 border-t border-gray-100">
                <div className="space-y-4 mt-4">
                  <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Asesmen Awal</label>
                <select value={formData.jenisAsesmenAwal} onChange={e => setFormData({...formData, jenisAsesmenAwal: e.target.value})} className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-emerald-500 transition-all mb-2">
                  <option value="Tes Tertulis">Tes Tertulis</option>
                  <option value="Wawancara">Wawancara</option>
                  <option value="Observasi">Observasi</option>
                  <option value="Kuesioner/Angket">Kuesioner/Angket</option>
                  <option value="Diskusi Kelas">Diskusi Kelas</option>
                </select>
                <AIAssistedTextarea rows={2} value={formData.asesmenAwal} onChange={e => setFormData({...formData, asesmenAwal: e.target.value})} className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-emerald-500 transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Asesmen Formatif</label>
                <select value={formData.jenisAsesmenFormatif} onChange={e => setFormData({...formData, jenisAsesmenFormatif: e.target.value})} className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-emerald-500 transition-all mb-2">
                  <option value="Observasi">Observasi</option>
                  <option value="Penilaian Diri (Self Assessment)">Penilaian Diri (Self Assessment)</option>
                  <option value="Penilaian Antar Teman (Peer Assessment)">Penilaian Antar Teman (Peer Assessment)</option>
                  <option value="Jurnal">Jurnal</option>
                  <option value="Kuis">Kuis</option>
                  <option value="Tanya Jawab">Tanya Jawab</option>
                  <option value="Penugasan">Penugasan</option>
                </select>
                <AIAssistedTextarea rows={2} value={formData.asesmenFormatif} onChange={e => setFormData({...formData, asesmenFormatif: e.target.value})} className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-emerald-500 transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Asesmen Sumatif</label>
                <select value={formData.jenisAsesmenSumatif} onChange={e => setFormData({...formData, jenisAsesmenSumatif: e.target.value})} className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-emerald-500 transition-all mb-2">
                  <option value="Tes Tertulis">Tes Tertulis</option>
                  <option value="Tes Lisan">Tes Lisan</option>
                  <option value="Penilaian Praktik/Kinerja">Penilaian Praktik/Kinerja</option>
                  <option value="Penilaian Proyek">Penilaian Proyek</option>
                  <option value="Penilaian Portofolio">Penilaian Portofolio</option>
                  <option value="Penilaian Produk">Penilaian Produk</option>
                </select>
                <AIAssistedTextarea rows={2} value={formData.asesmenSumatif} onChange={e => setFormData({...formData, asesmenSumatif: e.target.value})} className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-emerald-500 transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Rubrik Penilaian</label>
                <select value={formData.jenisRubrik} onChange={e => setFormData({...formData, jenisRubrik: e.target.value})} className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-emerald-500 transition-all mb-2">
                  <option value="Rubrik Analitik">Rubrik Analitik</option>
                  <option value="Rubrik Holistik">Rubrik Holistik</option>
                  <option value="Rubrik Skala Penilaian">Rubrik Skala Penilaian</option>
                  <option value="Checklist">Checklist</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Indikator dan Keterangan Rubrik (Opsional)</label>
                <AIAssistedTextarea rows={2} placeholder="Contoh: Indikator 1: Keaktifan (Siswa aktif bertanya dan menjawab)..." value={formData.indikatorRubrik || ''} onChange={e => setFormData({...formData, indikatorRubrik: e.target.value})} className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-emerald-500 transition-all" />
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg text-red-700 p-4 rounded-xl text-sm">
              {error}
            </div>
          )}

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
            onClick={generatePlan} 
            disabled={isGenerating}
            className={`flex-1 py-4 rounded-xl font-bold text-lg text-black transition-all flex items-center justify-center gap-2 shadow-lg btn-generate-animated ${
              isGenerating 
                ? 'bg-slate-600 cursor-not-allowed' 
                : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-90 hover:shadow-emerald-500/25'
            }`}
          >
            {isGenerating ? (
              <>
                <span className="animate-spin text-2xl">⏳</span>
                <span>Generating...</span>
              </>
            ) : (
              <>
                <span>🧠</span> Generate Rencana Pembelajaran
              </>
            )}
          </button>
            </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm h-[700px] overflow-y-auto custom-scrollbar space-y-6">
          {result ? (
            <>
              <AIVisualGenerator 
                context={{
                  subject: subjectsByLevel[formData.eduLevel]?.find(s => s.id === formData.mapel)?.label || formData.mapel,
                  topic: formData.topikMateri,
                  level: educationLevels.find(l => l.id === formData.eduLevel)?.label || formData.eduLevel,
                  phase: phaseClassMap[formData.eduLevel]?.phases.find(p => p.id === formData.fase)?.label || formData.fase,
                  class: phaseClassMap[formData.eduLevel]?.classes[formData.fase]?.find(c => c.id === formData.kelas)?.label || formData.kelas,
                }}
              />
              <div className="space-y-6 text-sm">
              <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-xl p-6 border border-emerald-500/30 text-center shadow-inner">
                <h3 className="text-xl font-bold text-black mb-2 tracking-wide">RENCANA PEMBELAJARAN MENDALAM</h3>
                <h4 className="text-emerald-600 font-medium">{result.subjectLabel}</h4>
              </div>

              <div className="gen-card bg-red-50 rounded-xl p-5 shadow-sm">
                <div className="grid grid-cols-2 gap-y-3 text-gray-700 text-sm">
                  <p><span className="text-gray-500 block text-xs mb-1">Sekolah</span> <span className="font-medium text-black">{result.sekolah || '-'} ({result.jenisSekolah || 'Negeri'})</span></p>
                  <p><span className="text-gray-500 block text-xs mb-1">Fase/Kelas/Semester</span> <span className="font-medium text-black">{result.faseLabel} / {result.kelasLabel} / {result.semester}</span></p>
                  <p><span className="text-gray-500 block text-xs mb-1">Mata Pelajaran</span> <span className="font-medium text-black">{result.subjectLabel}</span></p>
                  <p><span className="text-gray-500 block text-xs mb-1">Alokasi Waktu</span> <span className="font-medium text-black">{result.alokasiWaktu || '-'}</span></p>
                  <p><span className="text-gray-500 block text-xs mb-1">Nama Kepala Sekolah</span> <span className="font-medium text-black">{result.kepalaSekolah || '-'}</span></p>
                  <p><span className="text-gray-500 block text-xs mb-1">{result.jenisNipKepalaSekolah || 'NIP'} Kepsek</span> <span className="font-medium text-black">{result.nipKepalaSekolah || '-'}</span></p>
                  <p><span className="text-gray-500 block text-xs mb-1">Nama Guru</span> <span className="font-medium text-black">{result.namaGuru || '-'}</span></p>
                  <p><span className="text-gray-500 block text-xs mb-1">{result.jenisNipGuru || 'NIP'} Guru</span> <span className="font-medium text-black">{result.nip || '-'}</span></p>
                  <p><span className="text-gray-500 block text-xs mb-1">Jenis Guru</span> <span className="font-medium text-black">{result.jenisGuru || '-'}</span></p>
                </div>
              </div>

              <div className="gen-card bg-red-50 rounded-xl p-5 shadow-sm">
                <h4 className="font-semibold text-emerald-600 mb-3">A. Identifikasi</h4>
                <div className="space-y-3 text-gray-700">
                  <div><span className="text-gray-500 text-xs">Peserta Didik:</span><p className="mt-1 whitespace-pre-line">{result.pesertaDidik || '-'}</p></div>
                  <div><span className="text-gray-500 text-xs">Topik Pelajaran:</span><p className="mt-1 whitespace-pre-line">{result.topikPelajaran || '-'}</p></div>
                  <div>
                    <span className="text-gray-500 text-xs">Dimensi Profil Lulusan:</span>
                    <ul className="list-disc list-inside mt-1">
                      {result.selectedProfil?.length > 0 ? result.selectedProfil.map((p: string, i: number) => <li key={i}>{p}</li>) : <li>-</li>}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="gen-card bg-red-50 rounded-xl p-5 shadow-sm">
                <h4 className="font-semibold text-emerald-600 mb-3">B. Desain Pembelajaran</h4>
                <div className="space-y-3 text-gray-700">
                  <div><span className="text-gray-500 text-xs">Capaian Pembelajaran:</span><p className="mt-1 whitespace-pre-line">{result.capaianPembelajaran || '-'}</p></div>
                  <div><span className="text-gray-500 text-xs">Lintas Disiplin Ilmu:</span><p className="mt-1">{result.lintasDisiplin || '-'}</p></div>
                  <div><span className="text-gray-500 text-xs">Tujuan Pembelajaran:</span><p className="mt-1 whitespace-pre-line">{result.tujuanPembelajaran || '-'}</p></div>
                  <div><span className="text-gray-500 text-xs">Praktik Pedagogis:</span><p className="mt-1 whitespace-pre-line">{result.praktikPedagogis || '-'}</p></div>
                  <div><span className="text-gray-500 text-xs">Kemitraan Pembelajaran:</span><p className="mt-1 whitespace-pre-line">{result.kemitraanPembelajaran || '-'}</p></div>
                  <div><span className="text-gray-500 text-xs">Lingkungan Pembelajaran:</span><p className="mt-1 whitespace-pre-line">{result.lingkunganBelajar || '-'}</p></div>
                  <div><span className="text-gray-500 text-xs">Pemanfaatan Digital:</span><p className="mt-1 whitespace-pre-line">{result.pemanfaatanDigital || '-'}</p></div>
                </div>
              </div>

              <div className="gen-card bg-red-50 rounded-xl p-5 shadow-sm">
                <h4 className="font-semibold text-emerald-600 mb-3">C. Pengalaman Belajar</h4>
                <div className="space-y-3 text-gray-700">
                  <div><span className="text-gray-500 text-xs">AWAL ({result.prinsipAwal?.join(', ')}):</span><p className="mt-1 whitespace-pre-line">{result.awal || '-'}</p></div>
                  <div className="pt-2 border-t border-black"><span className="text-gray-600 font-semibold text-xs">INTI</span></div>
                  <div><span className="text-gray-500 text-xs">Memahami ({result.prinsipMemahami?.join(', ')}):</span><p className="mt-1 whitespace-pre-line">{result.memahami || '-'}</p></div>
                  <div><span className="text-gray-500 text-xs">Mengaplikasi ({result.prinsipMengaplikasi?.join(', ')}):</span><p className="mt-1 whitespace-pre-line">{result.mengaplikasi || '-'}</p></div>
                  <div><span className="text-gray-500 text-xs">Merefleksi ({result.prinsipMerefleksi?.join(', ')}):</span><p className="mt-1 whitespace-pre-line">{result.merefleksi || '-'}</p></div>
                  <div className="pt-2 border-t border-black"><span className="text-gray-500 text-xs">PENUTUP ({result.prinsipPenutup?.join(', ')}):</span><p className="mt-1 whitespace-pre-line">{result.penutup || '-'}</p></div>
                </div>
              </div>

              <div className="gen-card bg-red-50 rounded-xl p-5 shadow-sm">
                <h4 className="font-semibold text-emerald-600 mb-3">D. Asesmen Pembelajaran</h4>
                <div className="space-y-3 text-gray-700">
                  <div><span className="text-gray-500 text-xs">Asesmen pada Awal Pembelajaran ({result.jenisAsesmenAwal}):</span><p className="mt-1 whitespace-pre-line">{result.asesmenAwal || '-'}</p></div>
                  <div><span className="text-gray-500 text-xs">Asesmen pada Proses Pembelajaran ({result.jenisAsesmenFormatif}):</span><p className="mt-1 whitespace-pre-line">{result.asesmenFormatif || '-'}</p></div>
                  <div><span className="text-gray-500 text-xs">Asesmen pada Akhir Pembelajaran ({result.jenisAsesmenSumatif}):</span><p className="mt-1 whitespace-pre-line">{result.asesmenSumatif || '-'}</p></div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col min-h-[800px] overflow-hidden">
                <h4 className="font-semibold text-emerald-600 mb-3">Rubrik Penilaian ({result.jenisRubrik || 'Rubrik'})</h4>
                {result.rubrik && result.rubrik.length > 0 ? (
                  <table className="w-full text-sm text-left text-gray-700">
                    <thead className="text-xs text-gray-600 uppercase bg-red-100/50">
                      <tr>
                        <th className="px-4 py-3">Indikator</th>
                        <th className="px-4 py-3">Keterangan</th>
                        <th className="px-4 py-3">Baru Memulai</th>
                        <th className="px-4 py-3">Berkembang</th>
                        <th className="px-4 py-3">Cakap</th>
                        <th className="px-4 py-3">Mahir</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.rubrik.map((r: any, i: number) => (
                        <tr key={i} className="border-b border-black">
                          <td className="px-4 py-3 font-medium text-black">{r.indikator}</td>
                          <td className="px-4 py-3 text-gray-600">{r.keterangan || '-'}</td>
                          <td className="px-4 py-3">{r.baruMemulai}</td>
                          <td className="px-4 py-3">{r.berkembang}</td>
                          <td className="px-4 py-3">{r.cakap}</td>
                          <td className="px-4 py-3">{r.mahir}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-gray-500 text-sm">Tidak ada rubrik</p>
                )}
              </div>

              <button onClick={() => setIsPrintModalOpen(true)} className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-black font-bold text-lg transition-all shadow-lg flex items-center justify-center gap-2">
                <span>🖨️</span> Print / Download PDF
              </button>
            </div>
          </>
        ) : (
            <div className="text-center text-gray-500 h-full flex flex-col items-center justify-center">
              <div className="text-6xl mb-4 opacity-50">🧠</div>
              <p>Rencana Pembelajaran Mendalam akan muncul di sini</p>
            </div>
          )}
        </div>
          </div>
        </div>
      </div>
      <PrintSupportModal 
        isOpen={isPrintModalOpen} 
        onClose={() => setIsPrintModalOpen(false)} 
        onConfirm={printPlan} 
      />
    </div>
  );
}
