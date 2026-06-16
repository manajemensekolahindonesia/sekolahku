import React, { useState, useEffect } from 'react';
import ModelSelector from '@/components/ModelSelector';
import { cpData, pabProfilPelajar, mapelNames, modelNames, educationLevels, phaseClassMap, subjectsByLevel, topicsBySubject } from '@/lib/constants';
import { GoogleGenAI, Type } from '@/lib/genai';
import PrintSupportModal from '@/components/PrintSupportModal';
import AIVisualGenerator from '@/components/AIVisualGenerator';
import PDFRemixUpload from '@/components/PDFRemixUpload';
import { BookOpen, CheckCircle, Plus, Minus, Download, Save, User , Trash2, Settings, ChevronDown, ChevronUp, Printer, FileText } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getWatermarkHtml, createPrintWindow } from '@/lib/print';
import AIAssistedInput from '@/components/AIAssistedInput';
import AIAssistedTextarea from '@/components/AIAssistedTextarea';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import LogoUploader from '@/components/LogoUploader';
import { parseMarkdown } from '@/lib/markdown';


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

export default function ModuleGenerator() {
  const { profile } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedModel, setSelectedModel] = useLocalStorage<string>('ModuleGenerator_selectedModel', 'openai');
  const [formatPerangkat, setFormatPerangkat] = useLocalStorage<'standar'|'kemenag'>('ModuleGenerator_formatPerangkat', 'standar');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [useLogo, setUseLogo] = useLocalStorage<boolean>('ModuleGenerator_useLogo', false);
  const [logoUrl, setLogoUrl] = useLocalStorage<string | null>('ModuleGenerator_logoUrl', null);

  const saveProgress = () => {
    alert('Progress otomatis disimpan saat Anda mengetik!');
  };

  const resetProgress = () => {
    if (confirm('Apakah Anda yakin ingin mereset semua data di halaman ini? Data yang belum di-export akan hilang.')) {
      localStorage.removeItem('ModuleGeneratorData');
      localStorage.removeItem('ModuleGenerator_formData');
      localStorage.removeItem('ModuleGenerator_custom');
      localStorage.removeItem('ModuleGenerator_customData');
      localStorage.removeItem('ModuleGenerator_prinsipInti');
      localStorage.removeItem('ModuleGenerator_selectedModel');
      localStorage.removeItem('ModuleGenerator_formatPerangkat');
      window.location.reload();
    }
  };

  const [error, setError] = useState('');
  const [formData, setFormData] = useLocalStorage('ModuleGenerator_formData', {
    namaGuru: '', jenisNipGuru: 'NIP', nip: '', namaSekolah: '', jenisSekolah: 'Negeri', kepalaSekolah: '', jenisNipKepalaSekolah: 'NIP', nipKepalaSekolah: '', jenjang: 'sd', kelas: '1', fase: 'A',
    semester: '1', tahunAjaran: '2024/2025', mapel: 'bahasa-indonesia', topik: '', isCustomTopik: false, waktu: '', model: 'pbl', mediaStyle: 'outline', tingkatanKognitif: 'Campuran (Sesuai Kurikulum Merdeka)',
    remixText: '', hasInklusi: false, jumlahInklusi: '', kerangkaTaksonomi: 'bloom', levelTaksonomi: 'Campuran (Sesuai Kurikulum Merdeka)'
  });

  const [custom, setCustom] = useLocalStorage('ModuleGenerator_custom', {
    cp: false, tp: false, pp: false, kp: false
  });

  const [customData, setCustomData] = useLocalStorage('ModuleGenerator_customData', {
    cpText: '', tpList: [''], ppList: [''], kpPembuka: '', kpInti: '', kpPenutup: ''
  });

  const [prinsipInti, setPrinsipInti] = useLocalStorage<string[]>('ModuleGenerator_prinsipInti', ['Bermakna']);

  const [rubrikList, setRubrikList] = useState([{ aspek: '', score: '', deskripsi: '' }]);
  const [result, setResult] = useState<any>(null);

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    identitas: false,
    pengaturan: true,
    opsi: false
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

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

  useEffect(() => {
    const topics = topicsBySubject[formData.mapel] || topicsBySubject['default'];
    setFormData(prev => ({ ...prev, topik: topics[0] || '', isCustomTopik: false }));
  }, [formData.mapel]);

  useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        namaGuru: profile.displayName || prev.namaGuru,
        nip: profile.nip || prev.nip,
        jenjang: profile.jenjang?.toLowerCase() || prev.jenjang
      }));
    }
  }, [profile]);

  const handleCustomChange = (field: keyof typeof customData, value: any) => {
    setCustomData(prev => ({ ...prev, [field]: value }));
  };

  const handlePrinsipIntiChange = (prinsip: string) => {
    setPrinsipInti(prev => {
      if (prev.includes(prinsip)) {
        return prev.filter(p => p !== prinsip);
      } else {
        return [...prev, prinsip];
      }
    });
  };

  const generateModul = async () => {
    setIsGenerating(true);
    setError('');
    setResult(null);
    
    try {
      const ai = new GoogleGenAI({});
      const { jenjang, mapel, topik, fase } = formData;
      const jenjangLabel = educationLevels.find(l => l.id === jenjang)?.label || jenjang.toUpperCase();
      const faseLabel = phaseClassMap[jenjang]?.phases.find(p => p.id === fase)?.label || fase;
      const kelasLabel = phaseClassMap[jenjang]?.classes[fase]?.find(c => c.id === formData.kelas)?.label || formData.kelas;
      const mapelLabel = subjectsByLevel[jenjang]?.find(s => s.id === mapel)?.label || mapelNames[mapel] || mapel;
      const modelName = formData.model === 'cinta' ? 'Pendekatan Kurikulum Berbasis Cinta' : (modelNames[formData.model] || formData.model);

      const formatInstruction = formatPerangkat === 'kemenag' 
        ? "Kemenag RPM (Rencana Pelaksanaan Pembelajaran/Modul Ajar) Berbasis Cinta"
        : "Modul Ajar/RPP+ Kurikulum Merdeka";

      const prompt = `Pastikan dokumen ini disusun sesuai standar terbaru Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi (Kemendikbudristek) serta Kementerian Agama (Kemenag) Republik Indonesia, mengikuti panduan Kurikulum Merdeka yang mengikat.

Buatkan ${formatInstruction} dengan format ${formData.mediaStyle === 'outline' ? 'Outline/Ringkasan' : 'Lengkap/Penuh'} untuk:
Mata Pelajaran: ${mapelLabel}
Topik/Materi: ${topik || 'Topik umum sesuai mata pelajaran'}
Fase/Kelas/Semester: ${faseLabel} / ${kelasLabel} / Semester ${formData.semester}
Model Pembelajaran: ${modelName}
Alokasi Waktu: ${formData.waktu || '2 JP (2 x 35 menit)'}
Nama Guru: ${formData.namaGuru}
${formData.jenisNipGuru} Guru: ${formData.nip}
Sekolah: ${formData.namaSekolah} (${formData.jenisSekolah})
Kepala Sekolah: ${formData.kepalaSekolah}
${formData.jenisNipKepalaSekolah} Kepala Sekolah: ${formData.nipKepalaSekolah}
${formData.hasInklusi ? `Terdapat Anak Inklusi: Ya, berjumlah ${formData.jumlahInklusi} siswa. Pastikan hasil generate menyediakan adaptasi atau modifikasi untuk anak inklusi.` : ''}

${formData.remixText ? `INSTRUKSI REMIX:
Gunakan teks referensi berikut sebagai dasar utama pembuatan Modul Ajar. Remix dan kembangkan konten ini agar sesuai dengan kurikulum merdeka dan target audiens di atas:
---
${formData.remixText}
---` : ''}

Jika ada instruksi khusus berikut, gunakan sebagai acuan utama:
${custom.cp && customData.cpText ? `- Capaian Pembelajaran: ${customData.cpText}` : ''}
${custom.tp && customData.tpList.some(v => v) ? `- Tujuan Pembelajaran: ${customData.tpList.filter(v => v).join(', ')}` : ''}
${custom.pp && customData.ppList.some(v => v) ? `- Profil Pelajar Pancasila: ${customData.ppList.filter(v => v).join(', ')}` : ''}
${custom.kp && (customData.kpPembuka || customData.kpInti || customData.kpPenutup) ? `- Kegiatan Pembelajaran: Pembuka (${customData.kpPembuka}), Inti (${customData.kpInti}), Penutup (${customData.kpPenutup})` : ''}
${prinsipInti.length > 0 ? `- Prinsip Kegiatan Inti: Pastikan kegiatan inti mencerminkan prinsip ${prinsipInti.join(', ')}.` : ''}

Konteks Kurikulum Merdeka & Pedagogi (SANGAT PENTING):
1. Taksonomi/Pendekatan Kognitif: ${formData.kerangkaTaksonomi === 'bloom' ? 'Taksonomi Bloom' : 'Taksonomi SOLO'} pada level: ${formData.levelTaksonomi}.
   - Seimbangkan LOTS (C1-C2) dan HOTS (C4-C6) sesuai target jika menggunakan Bloom.
   - Integrasikan Dimensi Pengetahuan: Faktual, Konseptual, Prosedural, dan Metakognitif.
   - PENTING: JANGAN tampilkan label "C1", "C2", dll. secara eksplisit pada hasil akhir, cukup terapkan dalam kata kerja operasional dan aktivitas.
2. Tujuan Pembelajaran (ABCD): Rumuskan tujuan pembelajaran dengan kaidah Audience (Peserta Didik), Behaviour (Perilaku/KKO), Condition (Kondisi/Metode), dan Degree (Kriteria/Tingkat Keberhasilan).
3. Pendekatan TPACK & STEAM:
   - TPACK (Technological Pedagogical Content Knowledge): Tunjukkan bagaimana guru menggunakan teknologi dan pedagogi yang tepat untuk menyampaikan konten materi.
   - STEAM (Science, Technology, Engineering, Art, Mathematics): Integrasikan elemen STEAM dalam aktivitas siswa untuk melatih berpikir kritis, kreatif, dan pemecahan masalah.
${formatPerangkat === 'kemenag' ? `4. Konteks Kemenag & Berbasis Cinta (WAJIB ADA):
   - Tambahkan nilai Profil Pelajar Rahmatan Lil 'Alamin (PPRA) ke dalam "profilPelajar" (misal: Berkeadaban, Keteladanan, dll).
   - Integrasikan "Pendekatan Cinta/Heartful Learning" (sapaan kasih sayang, empati, doa, kelembutan, bonding emosional) dalam "kegiatanPembelajaran" (pembuka, inti, penutup).
   - Selipkan nilai-nilai spiritual, akhlak, dan moderasi beragama dalam "ringkasanMateri" dan "contohNyata".` : ''}

Berikan hasil dalam format JSON dengan struktur berikut. Pastikan semua bagian terisi secara otomatis dan komprehensif. Gunakan sumber resmi dari Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi (Kemendikbudristek) atau website pendidikan yang kredibel sebagai acuan pengisian konten:
{
  "capaianPembelajaran": "Capaian pembelajaran sesuai fase",
  "tujuanPembelajaran": ["Tujuan 1", "Tujuan 2", "Tujuan 3"],
  "profilPelajar": ["Profil 1", "Profil 2"],
  "kegiatanPembelajaran": {
    "pembuka": "Kegiatan pembuka (Gunakan format Tabel Markdown dengan kolom: No, Aktivitas, Waktu)",
    "inti": "Kegiatan inti sesuai model ${modelName} (Gunakan format Tabel Markdown dengan kolom: Sintaks/Fase, Aktivitas Guru & Siswa, Waktu)",
    "penutup": "Kegiatan penutup (Gunakan format Tabel Markdown dengan kolom: No, Aktivitas, Waktu)"
  },
  "ringkasanMateri": "Ringkasan materi yang komprehensif sesuai topik",
  "contohNyata": "Contoh penerapan materi pada kehidupan nyata di dunia",
  "rubrikItems": [
    { "aspek": "Aspek penilaian", "score": "Skor maksimal", "deskripsi": "Deskripsi rubrik" }
  ],
  "sumberBelajar": ["Sumber 1", "Sumber 2"]
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
              capaianPembelajaran: { type: Type.STRING },
              tujuanPembelajaran: { type: Type.ARRAY, items: { type: Type.STRING } },
              profilPelajar: { type: Type.ARRAY, items: { type: Type.STRING } },
              kegiatanPembelajaran: {
                type: Type.OBJECT,
                properties: {
                  pembuka: { type: Type.STRING },
                  inti: { type: Type.STRING },
                  penutup: { type: Type.STRING }
                },
                required: ["pembuka", "inti", "penutup"]
              },
              ringkasanMateri: { type: Type.STRING },
              contohNyata: { type: Type.STRING },
              rubrikItems: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    aspek: { type: Type.STRING },
                    score: { type: Type.STRING },
                    deskripsi: { type: Type.STRING }
                  },
                  required: ["aspek", "score", "deskripsi"]
                }
              },
              sumberBelajar: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["capaianPembelajaran", "tujuanPembelajaran", "profilPelajar", "kegiatanPembelajaran", "ringkasanMateri", "contohNyata", "rubrikItems", "sumberBelajar"]
          }
        }
      });

      const generatedData = JSON.parse(response.text || '{}');

      setResult({
        ...formData,
        jenjangLabel,
        faseLabel,
        kelasLabel,
        mapelName: mapelLabel,
        modelName,
        ...generatedData
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Terjadi kesalahan saat menghasilkan modul ajar.');
    } finally {
      setIsGenerating(false);
    }
  };

  const printModul = () => {
    if (!result) return;
    
    const printWindow = createPrintWindow();
    if (!printWindow) return;

    let rubrikHtml = result.rubrikItems?.map((r: any) => `
      <tr><td>${r.aspek}</td><td>${r.score}</td><td>${r.deskripsi}</td></tr>
    `).join('') || '';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
          <title>Modul Ajar - ${result.topik}</title>
          <script src="https://cdn.tailwindcss.com"></script>
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
                line-height: 1.15;
                color: #333;
              }
              ol, ul { padding-left: 20px; margin-top: 4px; margin-bottom: 8px; }
              li { margin-bottom: 6px; line-height: 1.25; }
              p { margin-bottom: 8px; }
              .markdown-table p { margin-bottom: 8px; text-align: justify; }
              .markdown-table ul { list-style-type: disc; }
              .markdown-table ol { list-style-type: decimal; }
              @page landscape-page {
                size: A4 landscape;
              }
              .landscape-section {
                page: landscape-page;
                page-break-before: always;
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
              th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; font-size: 12px; }
              th { background: #f1f5f9; color: #0f172a; font-weight: bold; }
              .header { text-align: center; margin-bottom: 25px; border-bottom: 3px double #000; padding-bottom: 10px; }
              .section { margin: 15px 0; }
              .section-title { background: #e2e8f0; font-weight: bold; padding: 5px 10px; margin: 15px 0 10px 0; font-size: 13px; color: #0f172a; }
              .sub-section-title { font-weight: bold; margin-top: 8px; font-size: 12px; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 2px; }
              .content { margin-left: 10px; font-size: 12px; }
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
      </head>
      <body>
          <div class="watermark">PEMURYADI - MAJU PENDIDIKAN INDONESIA</div>
          <div class="content-wrapper">
              <div class="header" style="position: relative; text-align: center; margin-bottom: 25px; border-bottom: 3px double #000; padding-bottom: 10px;">
                  ${useLogo && logoUrl ? `<img src="${logoUrl}" style="position: absolute; left: 0; top: 0; height: 80px; width: auto;" alt="Logo"/>` : ''}
                  <div style="padding: 0 90px;">
                      <div style="font-size: 11pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">
                          ${(result.namaSekolah?.toLowerCase().includes('madrasah') || result.namaSekolah?.toLowerCase().includes(' mi ') || result.namaSekolah?.toLowerCase().includes('mts') || result.namaSekolah?.toLowerCase().includes(' ma ') || result.namaSekolah?.toLowerCase().startsWith('mi ') || result.namaSekolah?.toLowerCase().startsWith('ma ')) ? 'KEMENTERIAN AGAMA REPUBLIK INDONESIA' : 'KEMENTERIAN PENDIDIKAN DASAR DAN MENENGAH'}
                      </div>
                      <div style="font-size: 13pt; font-weight: bold; text-transform: uppercase; margin-top: 3px;">
                          ${result.namaSekolah || 'SATUAN PENDIDIKAN'}
                      </div>
                      <div style="font-size: 9pt; margin-top: 2px;">
                          Tahun Ajaran: ${result.tahunAjaran || '-'}
                      </div>
                  </div>
              </div>
              
              <h3 style="margin: 0; font-size: 12pt; font-weight: bold; text-transform: uppercase; text-align: center;">
                  MODUL AJAR / RENCANA PELAKSANAAN PEMBELAJARAN (RPP)
              </h3>
              <div style="font-size: 10pt; margin-top: 5px; font-style: italic; text-align: center; margin-bottom: 20px;">
                  Kurikulum Merdeka (Sesuai Panduan Pembelajaran dan Asesmen)
              </div>

              <div class="section">
                  <div class="section-title">1. INFORMASI UMUM</div>
                  <div class="content">
                      <div class="sub-section-title">A. Identitas Modul</div>
                      <table>
                          <tr><td width="35%">Nama Penyusun</td><td>${result.namaGuru || '-'}</td></tr>
                          <tr><td>${result.jenisNipGuru || 'NIP'} Guru</td><td>${result.nip || '-'}</td></tr>
                          <tr><td>Kepala Sekolah</td><td>${result.kepalaSekolah || '-'}</td></tr>
                          <tr><td>${result.jenisNipKepalaSekolah || 'NIP'} Kepsek</td><td>${result.nipKepalaSekolah || '-'}</td></tr>
                          <tr><td>Nama Sekolah</td><td>${result.namaSekolah || '-'} (${result.jenisSekolah || 'Negeri'})</td></tr>
                          <tr><td>Jenjang / Kelas / Fase</td><td>${result.jenjangLabel} / ${result.kelasLabel} / ${result.faseLabel}</td></tr>
                          <tr><td>Semester / Tahun Ajaran</td><td>${result.semester} / ${result.tahunAjaran}</td></tr>
                          <tr><td>Mata Pelajaran</td><td>${result.mapelName}</td></tr>
                          <tr><td>Topik/Materi</td><td>${result.topik || '-'}</td></tr>
                          <tr><td>Alokasi Waktu</td><td>${result.waktu || '-'}</td></tr>
                      </table>

                      <div class="sub-section-title">B. Kompetensi Awal</div>
                      <p style="text-align: justify;">${result.capaianPembelajaran}</p>

                      <div class="sub-section-title">C. Profil Pelajar Pancasila</div>
                      <ul style="margin: 5px 0; padding-left: 20px;">${result.profilPelajar?.map((pp: string) => `<li>${pp}</li>`).join('') || ''}</ul>

                      <div class="sub-section-title">D. Sarana dan Prasarana</div>
                      <ul style="margin: 5px 0; padding-left: 20px;">${result.sumberBelajar?.map((sb: string) => `<li>${sb}</li>`).join('') || ''}</ul>

                      <div class="sub-section-title">E. Target Peserta Didik</div>
                      <p>Peserta didik reguler/tipikal: umum, tidak ada kesulitan dalam mencerna dan memahami materi ajar.</p>

                      <div class="sub-section-title">F. Model Pembelajaran</div>
                      <p>${result.modelName}</p>
                  </div>
              </div>

              <div class="section">
                  <div class="section-title">2. KOMPONEN INTI</div>
                  <div class="content">
                      <div class="sub-section-title">A. Tujuan Pembelajaran</div>
                      <ol style="margin: 5px 0; padding-left: 20px;">${result.tujuanPembelajaran?.map((tp: string) => `<li>${tp}</li>`).join('') || ''}</ol>

                      <div class="sub-section-title">B. Pemahaman Bermakna</div>
                      <p>Peserta didik dapat memahami manfaat materi ${result.topik || 'ini'} dan menerapkannya dalam kehidupan sehari-hari.</p>

                      <div class="sub-section-title">C. Pertanyaan Pemantik</div>
                      <p>Apa yang kalian ketahui tentang ${result.topik || 'materi ini'}?</p>

                      <div class="sub-section-title">D. Kegiatan Pembelajaran</div>
                      <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                        <thead>
                          <tr>
                            <th style="width: 20%; text-align: left; background: #f1f5f9; padding: 8px; border: 1px solid #cbd5e1; font-weight: bold;">Tahap</th>
                            <th style="width: 80%; text-align: left; background: #f1f5f9; padding: 8px; border: 1px solid #cbd5e1; font-weight: bold;">Kegiatan Pembelajaran</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td style="font-weight: bold; border: 1px solid #cbd5e1; padding: 8px; vertical-align: top; font-size: 12px;">Kegiatan Pendahuluan</td>
                            <td style="border: 1px solid #cbd5e1; padding: 8px; vertical-align: top; font-size: 11px;">
                              <div class="markdown-table">${parseMarkdown(result.kegiatanPembelajaran?.pembuka || '-')}</div>
                            </td>
                          </tr>
                          <tr>
                            <td style="font-weight: bold; border: 1px solid #cbd5e1; padding: 8px; vertical-align: top; font-size: 12px;">Kegiatan Inti</td>
                            <td style="border: 1px solid #cbd5e1; padding: 8px; vertical-align: top; font-size: 11px;">
                              <div class="markdown-table">${parseMarkdown(result.kegiatanPembelajaran?.inti || '-')}</div>
                            </td>
                          </tr>
                          <tr>
                            <td style="font-weight: bold; border: 1px solid #cbd5e1; padding: 8px; vertical-align: top; font-size: 12px;">Kegiatan Penutup</td>
                            <td style="border: 1px solid #cbd5e1; padding: 8px; vertical-align: top; font-size: 11px;">
                              <div class="markdown-table">${parseMarkdown(result.kegiatanPembelajaran?.penutup || '-')}</div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                  </div>
              </div>

              <div class="section landscape-section">
                  <div class="section-title">2E. ASESMEN / RUBRIK PENILAIAN</div>
                  <div class="content">
                      <table><tr><th>Aspek Penilaian</th><th width="15%">Skor</th><th>Deskripsi</th></tr>${rubrikHtml}</table>
                  </div>
              </div>

              <div class="section">
                  <div class="section-title">3. PENGAYAAN & LAMPIRAN</div>
                  <div class="content">
                      <div class="sub-section-title">A. Pengayaan dan Remedial</div>
                      <p><strong>Pengayaan:</strong> Diberikan kepada peserta didik dengan capaian tinggi untuk mengembangkan potensinya secara optimal.<br>
                      <strong>Remedial:</strong> Diberikan kepada peserta didik yang membutuhkan bimbingan untuk memahami materi atau pembelajaran mengulang.</p>
                  </div>
              </div>

              <div class="section">
                  <div class="section-title">3. LAMPIRAN</div>
                  <div class="content">
                      <div class="sub-section-title">A. Ringkasan Materi</div>
                      <p style="text-align: justify;">${result.ringkasanMateri?.replace(/\n/g, '<br>') || '-'}</p>

                      <div class="sub-section-title">B. Contoh Penerapan di Kehidupan Nyata</div>
                      <p style="text-align: justify; font-style: italic; color: #1e40af;">${result.contohNyata?.replace(/\n/g, '<br>') || '-'}</p>

                      <div class="sub-section-title">C. Lembar Kerja Peserta Didik (LKPD)</div>
                      <p><em>(Terlampir secara terpisah)</em></p>

                      <div class="sub-section-title">D. Daftar Pustaka</div>
                      <p>Buku Panduan Guru dan Siswa Kurikulum Merdeka, PMM, dan sumber relevan lainnya.</p>
                  </div>
              </div>

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
                      <p>Guru Pengampu</p>
                      <br><br><br><br>
                      <p style="font-weight: bold; text-decoration: underline;">${formData.namaGuru || '................................'}</p>
                      <p>${formData.jenisNipGuru || 'NIP'}. ${formData.nip || '................................'}</p>
                  </div>
              </div>` : ''}

              <div class="support-footer">
                  <p>Dokumen ini dihasilkan secara otomatis oleh <strong>Modul Ajar Generator - Pemuryadi</strong></p>
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
    <div className="flex flex-col h-full bg-gray-50 text-gray-900">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center text-teal-600 border border-teal-200 shadow-sm">
            <BookOpen size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-wide">{formatPerangkat === 'standar' ? 'Modul Ajar' : 'Kemenag Modul Ajar'}</h1>
            <p className="text-sm text-teal-600">{formatPerangkat === 'standar' ? 'Sesuai Capaian Pembelajaran Kurikulum Merdeka' : 'Rencana Pelaksanaan Pembelajaran/Modul Ajar Berbasis Cinta'}</p>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-4 md:p-6">
        <div className="max-w-7xl mx-auto flex flex-col gap-6">

          {/* Sub Tab Menu */}
          <div className="flex bg-gray-100 p-1 rounded-xl shadow-inner border border-gray-200">
            <button 
              onClick={() => setFormatPerangkat('standar')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-300 ${formatPerangkat === 'standar' ? 'bg-white text-teal-700 shadow-md transform scale-[1.02]' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-200'}`}
            >
              Standar Kemendikbudristek
            </button>
            <button 
              onClick={() => setFormatPerangkat('kemenag')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-300 ${formatPerangkat === 'kemenag' ? 'bg-teal-50 text-teal-700 shadow-md border border-teal-200 transform scale-[1.02]' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-200'}`}
            >
              Kemenag Modul Ajar Berbasis Cinta
            </button>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <button 
              onClick={() => toggleSection('identitas')}
              className="w-full flex items-center justify-between p-6 bg-white hover:bg-gray-50 transition-colors"
            >
              <h4 className="font-semibold text-cyan-400 flex items-center gap-2"><User className="w-5 h-5" /> Data Profil Guru</h4>
              {expandedSections['identitas'] ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </button>
            {expandedSections['identitas'] && (
              <div className="p-6 pt-0 border-t border-gray-100 space-y-3">
                <AIAssistedInput type="text" placeholder="Nama Guru" value={formData.namaGuru} onChange={e => setFormData({...formData, namaGuru: e.target.value})} className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-cyan-500 transition-all" />
                <div className="flex gap-2">
                  <select value={formData.jenisNipGuru} onChange={e => setFormData({...formData, jenisNipGuru: e.target.value})} className="w-1/3 bg-gray-50 border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-cyan-500 transition-all">
                    <option value="NIP">NIP</option>
                    <option value="NUPTK">NUPTK</option>
                    <option value="NIY">NIY</option>
                    <option value="NRG">NRG</option>
                    <option value="NPK">NPK</option>
                  </select>
                  <AIAssistedInput type="text" placeholder="Nomor Induk Guru" value={formData.nip} onChange={e => setFormData({...formData, nip: e.target.value})} className="w-2/3 bg-gray-50 border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-cyan-500 transition-all" />
                </div>
                <AIAssistedInput type="text" placeholder="Nama Sekolah" value={formData.namaSekolah} onChange={e => setFormData({...formData, namaSekolah: e.target.value})} className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-cyan-500 transition-all" />
                <select value={formData.jenisSekolah} onChange={e => setFormData({...formData, jenisSekolah: e.target.value})} className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-cyan-500 transition-all">
                  <option value="Negeri">Negeri</option>
                  <option value="Swasta">Swasta</option>
                  <option value="Islam Terpadu">Islam Terpadu</option>
                </select>
                <AIAssistedInput type="text" placeholder="Nama Kepala Sekolah" value={formData.kepalaSekolah} onChange={e => setFormData({...formData, kepalaSekolah: e.target.value})} className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-cyan-500 transition-all" />
                <div className="flex gap-2">
                  <select value={formData.jenisNipKepalaSekolah} onChange={e => setFormData({...formData, jenisNipKepalaSekolah: e.target.value})} className="w-1/3 bg-gray-50 border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-cyan-500 transition-all">
                    <option value="NIP">NIP</option>
                    <option value="NUPTK">NUPTK</option>
                    <option value="NIY">NIY</option>
                    <option value="NRG">NRG</option>
                    <option value="NPK">NPK</option>
                  </select>
                  <AIAssistedInput type="text" placeholder="Nomor Induk Kepala Sekolah" value={formData.nipKepalaSekolah} onChange={e => setFormData({...formData, nipKepalaSekolah: e.target.value})} className="w-2/3 bg-gray-50 border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-cyan-500 transition-all" />
                </div>
                <LogoUploader useLogo={useLogo} setUseLogo={setUseLogo} logoUrl={logoUrl} setLogoUrl={setLogoUrl} />
              </div>
            )}
          </div>
          
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <button 
              onClick={() => toggleSection('pengaturan')}
              className="w-full flex items-center justify-between p-6 bg-white hover:bg-gray-50 transition-colors"
            >
              <h4 className="font-semibold text-cyan-400 flex items-center gap-2"><Settings size={18} className="text-blue-500 inline-block mr-1"/> Pengaturan Modul</h4>
              {expandedSections['pengaturan'] ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </button>
            {expandedSections['pengaturan'] && (
              <div className="p-6 pt-0 border-t border-gray-100 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Jenjang</label>
                  <select value={formData.jenjang} onChange={e => setFormData({...formData, jenjang: e.target.value})} className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-gray-900 focus:border-cyan-500 transition-all">
                    {educationLevels.map(level => (
                      <option key={level.id} value={level.id}>{level.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fase</label>
                  <select value={formData.fase} onChange={e => setFormData({...formData, fase: e.target.value})} className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-gray-900 focus:border-cyan-500 transition-all">
                    {phaseClassMap[formData.jenjang]?.phases.map(p => (
                      <option key={p.id} value={p.id}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Kelas</label>
                  <select value={formData.kelas} onChange={e => setFormData({...formData, kelas: e.target.value})} className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-gray-900 focus:border-cyan-500 transition-all">
                    {phaseClassMap[formData.jenjang]?.classes[formData.fase]?.map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Semester</label>
                  <select value={formData.semester} onChange={e => setFormData({...formData, semester: e.target.value})} className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-gray-900 focus:border-cyan-500 transition-all">
                    <option value="1">Semester 1</option><option value="2">Semester 2</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mata Pelajaran</label>
                <select value={formData.mapel} onChange={e => setFormData({...formData, mapel: e.target.value})} className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-gray-900 focus:border-cyan-500 transition-all">
                  {subjectsByLevel[formData.jenjang]?.map(s => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
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
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-gray-900 focus:border-cyan-500 transition-all"
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
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-gray-900 focus:border-cyan-500 transition-all mt-3" 
                  />
                )}
              </div>
              
              
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Model / Praktik Pedagogis</label>
                <select value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-gray-900 focus:border-cyan-500 transition-all">
                  <option value="pbl">Problem Based Learning (PBL)</option>
                  <option value="pjbl">Project Based Learning (PjBL)</option>
                  <option value="inquiry">Inquiry Learning</option>
                  <option value="discovery">Discovery Learning</option>
                  <option value="cooperative">Cooperative Learning</option>
                  {formatPerangkat === 'kemenag' && <option value="cinta">Pendekatan Kurikulum Berbasis Cinta</option>}
                </select>
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
                      className={`py-1 px-3 rounded-full text-xs font-medium transition-all ${formData.levelTaksonomi === lvl ? 'bg-cyan-500 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                    >
                      {lvl.split(':')[0]}
                    </button>
                  ))}
                </div>
              </div>


              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={formData.hasInklusi}
                    onChange={(e) => setFormData({...formData, hasInklusi: e.target.checked})}
                    className="w-4 h-4 rounded border-gray-300 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-white bg-white"
                  />
                  <span className="text-sm font-medium text-gray-700">Terdapat Anak Inklusi</span>
                </label>
                
                {formData.hasInklusi && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Jumlah Siswa Inklusi</label>
                    <input 
                      type="number"
                      min="1"
                      className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-gray-900 text-sm focus:border-cyan-500 transition-all"
                      placeholder="Masukkan jumlah siswa inklusi..."
                      value={formData.jumlahInklusi}
                      onChange={(e) => setFormData({...formData, jumlahInklusi: e.target.value})}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

          <PDFRemixUpload 
            onTextExtracted={(text) => setFormData(prev => ({ ...prev, remixText: text }))}
            label="Remix dari PDF (Opsional)"
          />
          
          <div className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 rounded-2xl border border-orange-500/30 mt-4 overflow-hidden">
            <button 
              onClick={() => toggleSection('opsi')}
              className="w-full flex items-center justify-between p-5 hover:bg-orange-500/5 transition-colors"
            >
              <h4 className="font-semibold text-orange-400 flex items-center gap-2">⚙️ Opsi Penyesuaian Manual</h4>
              {expandedSections['opsi'] ? <ChevronUp className="w-5 h-5 text-orange-400" /> : <ChevronDown className="w-5 h-5 text-orange-400" />}
            </button>
            {expandedSections['opsi'] && (
              <div className="p-5 pt-0 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" checked={custom.cp} onChange={e => setCustom({...custom, cp: e.target.checked})} className="w-4 h-4 text-orange-500 bg-red-100 border-black rounded focus:ring-orange-500" />
                <span className="text-sm text-gray-700 group-hover:text-black transition-colors">Gunakan Capaian Pembelajaran Manual</span>
              </label>
              {custom.cp && (
                <AIAssistedTextarea rows={3} value={customData.cpText} onChange={e => handleCustomChange('cpText', e.target.value)} className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-black text-sm focus:border-orange-500 transition-all mt-2" placeholder="Masukkan Capaian Pembelajaran..." />
              )}
              
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" checked={custom.tp} onChange={e => setCustom({...custom, tp: e.target.checked})} className="w-4 h-4 text-orange-500 bg-red-100 border-black rounded focus:ring-orange-500" />
                <span className="text-sm text-gray-700 group-hover:text-black transition-colors">Gunakan Tujuan Pembelajaran Manual</span>
              </label>
              {custom.tp && (
                <div className="space-y-2 mt-2">
                  {customData.tpList.map((tp, i) => (
                    <div key={i} className="flex gap-2">
                      <AIAssistedInput type="text" value={tp} onChange={e => {
                        const newList = [...customData.tpList];
                        newList[i] = e.target.value;
                        handleCustomChange('tpList', newList);
                      }} className="flex-1 bg-gray-50 border border-gray-300 rounded-lg p-2 text-black text-sm focus:border-orange-500 transition-all" placeholder="Tujuan Pembelajaran..." />
                    </div>
                  ))}
                  <button onClick={() => handleCustomChange('tpList', [...customData.tpList, ''])} className="w-full py-2 bg-red-100 hover:bg-slate-600 text-black rounded-lg text-sm font-medium transition-all">+ Tambah Tujuan</button>
                </div>
              )}
              
                <div className="pt-2 border-t border-black">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Prinsip Kegiatan Inti</label>
                  <div className="flex flex-wrap gap-3">
                    {['Berkesadaran', 'Bermakna', 'Menggembirakan'].map(prinsip => (
                      <label key={prinsip} className="flex items-center gap-2 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          checked={prinsipInti.includes(prinsip)} 
                          onChange={() => handlePrinsipIntiChange(prinsip)} 
                          className="w-4 h-4 text-orange-500 bg-red-100 border-black rounded focus:ring-orange-500" 
                        />
                        <span className="text-sm text-gray-700 group-hover:text-black transition-colors">{prinsip}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
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
              <button onClick={generateModul} disabled={isGenerating} className="flex-1 py-4 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 font-bold text-lg text-black hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-teal-500/25 disabled:opacity-50 disabled:cursor-not-allowed btn-generate-animated">
            {isGenerating ? (
              <>
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Menghasilkan Modul...</span>
              </>
            ) : (
              <>
                <span>📖</span> Generate Modul Ajar
              </>
            )}
          </button>
            </div>
          {error && <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
        </div>
        
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col min-h-[800px] overflow-hidden">
          {isGenerating ? (
            <div className="text-center text-gray-500 py-16 h-full flex flex-col items-center justify-center">
              <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-teal-400 font-medium animate-pulse">AI sedang menyusun Modul Ajar...</p>
            </div>
          ) : result ? (
            <div className="flex flex-col h-full relative">
              <div className="sticky top-0 z-20 bg-white border-b border-gray-200 p-4 mb-4 flex justify-between items-center shadow-sm rounded-t-2xl">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-teal-600" /> Hasil Modul Ajar
                </h3>
                <button 
                  onClick={() => setIsPrintModalOpen(true)} 
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-lg transition-all shadow flex items-center gap-2"
                >
                  <Printer size={16} /> Print / Download PDF
                </button>
              </div>
              <div className="px-6 pb-6 space-y-6 text-sm">
              <AIVisualGenerator 
                context={{
                  subject: subjectsByLevel[formData.jenjang]?.find(s => s.id === formData.mapel)?.label || formData.mapel,
                  topic: formData.topik,
                  level: educationLevels.find(l => l.id === formData.jenjang)?.label || formData.jenjang,
                  phase: phaseClassMap[formData.jenjang]?.phases.find(p => p.id === formData.fase)?.label || formData.fase,
                  class: phaseClassMap[formData.jenjang]?.classes[formData.fase]?.find(c => c.id === formData.kelas)?.label || formData.kelas,
                }}
              />
              <div className="bg-gradient-to-r from-teal-500/20 to-cyan-500/20 rounded-xl p-6 border border-teal-500/30 text-center shadow-inner">
                <h3 className="text-xl font-bold text-black mb-2 tracking-wide">MODUL AJAR</h3>
                <h4 className="text-teal-400 font-medium">{result.mapelName}</h4>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm mb-4">
                <h4 className="font-semibold text-blue-400 mb-4 flex items-center gap-2">1. INFORMASI UMUM</h4>
                <div className="space-y-4">
                  <div>
                    <h5 className="text-sm font-semibold text-gray-700 mb-2">A. Identitas Modul</h5>
                    <div className="grid grid-cols-2 gap-y-3 text-gray-700 text-sm">
                      <p><span className="text-gray-500 block text-xs mb-1">Nama Penyusun</span> <span className="font-medium text-black">{result.namaGuru || '-'}</span></p>
                      <p><span className="text-gray-500 block text-xs mb-1">{result.jenisNipGuru || 'NIP'} Guru</span> <span className="font-medium text-black">{result.nip || '-'}</span></p>
                      <p><span className="text-gray-500 block text-xs mb-1">Kepala Sekolah</span> <span className="font-medium text-black">{result.kepalaSekolah || '-'}</span></p>
                      <p><span className="text-gray-500 block text-xs mb-1">{result.jenisNipKepalaSekolah || 'NIP'} Kepsek</span> <span className="font-medium text-black">{result.nipKepalaSekolah || '-'}</span></p>
                      <p className="col-span-2"><span className="text-gray-500 block text-xs mb-1">Sekolah</span> <span className="font-medium text-black">{result.namaSekolah || '-'} ({result.jenisSekolah || 'Negeri'})</span></p>
                      <p><span className="text-gray-500 block text-xs mb-1">Jenjang / Kelas / Fase</span> <span className="font-medium text-black">{result.jenjangLabel} / {result.kelasLabel} / {result.faseLabel}</span></p>
                      <p><span className="text-gray-500 block text-xs mb-1">Semester / Tahun Ajaran</span> <span className="font-medium text-black">{result.semester} / {result.tahunAjaran}</span></p>
                      <p><span className="text-gray-500 block text-xs mb-1">Mata Pelajaran</span> <span className="font-medium text-black">{result.mapelName}</span></p>
                      <p><span className="text-gray-500 block text-xs mb-1">Topik/Materi</span> <span className="font-medium text-black">{result.topik || '-'}</span></p>
                      <p><span className="text-gray-500 block text-xs mb-1">Alokasi Waktu</span> <span className="font-medium text-black">{result.waktu || '-'}</span></p>
                    </div>
                  </div>
                  <div>
                    <h5 className="text-sm font-semibold text-gray-700 mb-2">B. Kompetensi Awal</h5>
                    <p className="text-gray-700 text-sm leading-relaxed">{result.capaianPembelajaran}</p>
                  </div>
                  <div>
                    <h5 className="text-sm font-semibold text-gray-700 mb-2">C. Profil Pelajar Pancasila</h5>
                    <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                      {result.profilPelajar?.map((pp: string, i: number) => <li key={i} className="pl-2">{pp}</li>)}
                    </ul>
                  </div>
                  <div>
                    <h5 className="text-sm font-semibold text-gray-700 mb-2">D. Sarana dan Prasarana</h5>
                    <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                      {result.sumberBelajar?.map((sb: string, i: number) => <li key={i} className="pl-2">{sb}</li>)}
                    </ul>
                  </div>
                  <div>
                    <h5 className="text-sm font-semibold text-gray-700 mb-2">E. Target Peserta Didik</h5>
                    <p className="text-gray-700 text-sm leading-relaxed">Peserta didik reguler/tipikal: umum, tidak ada kesulitan dalam mencerna dan memahami materi ajar.</p>
                  </div>
                  <div>
                    <h5 className="text-sm font-semibold text-gray-700 mb-2">F. Model Pembelajaran</h5>
                    <p className="text-gray-700 text-sm leading-relaxed">{result.modelName}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm mb-4">
                <h4 className="font-semibold text-green-400 mb-4 flex items-center gap-2">2. KOMPONEN INTI</h4>
                <div className="space-y-4">
                  <div>
                    <h5 className="text-sm font-semibold text-gray-700 mb-2">A. Tujuan Pembelajaran</h5>
                    <ol className="list-decimal list-inside text-gray-700 text-sm space-y-1">
                      {result.tujuanPembelajaran?.map((tp: string, i: number) => <li key={i} className="pl-2">{tp}</li>)}
                    </ol>
                  </div>
                  <div>
                    <h5 className="text-sm font-semibold text-gray-700 mb-2">B. Pemahaman Bermakna</h5>
                    <p className="text-gray-700 text-sm leading-relaxed">Peserta didik dapat memahami manfaat materi {result.topik || 'ini'} dan menerapkannya dalam kehidupan sehari-hari.</p>
                  </div>
                  <div>
                    <h5 className="text-sm font-semibold text-gray-700 mb-2">C. Pertanyaan Pemantik</h5>
                    <p className="text-gray-700 text-sm leading-relaxed">Apa yang kalian ketahui tentang {result.topik || 'materi ini'}?</p>
                  </div>
                  <div>
                    <h5 className="text-sm font-semibold text-gray-700 mb-2">D. Kegiatan Pembelajaran</h5>
                    <div className="space-y-2 text-sm text-gray-700">
                      <p><strong>Kegiatan Pendahuluan:</strong> {result.kegiatanPembelajaran?.pembuka || '-'}</p>
                      <p><strong>Kegiatan Inti:</strong> {result.kegiatanPembelajaran?.inti || '-'}</p>
                      <p><strong>Kegiatan Penutup:</strong> {result.kegiatanPembelajaran?.penutup || '-'}</p>
                    </div>
                  </div>
                  <div>
                    <h5 className="text-sm font-semibold text-gray-700 mb-2">E. Asesmen</h5>
                    <p className="text-gray-700 text-sm leading-relaxed">Rubrik Penilaian (Terlampir di hasil cetak)</p>
                  </div>
                  <div>
                    <h5 className="text-sm font-semibold text-gray-700 mb-2">F. Pengayaan dan Remedial</h5>
                    <p className="text-gray-700 text-sm leading-relaxed"><strong>Pengayaan:</strong> Diberikan kepada peserta didik dengan capaian tinggi untuk mengembangkan potensinya secara optimal.<br/>
                    <strong>Remedial:</strong> Diberikan kepada peserta didik yang membutuhkan bimbingan untuk memahami materi atau pembelajaran mengulang.</p>
                  </div>
                  <div>
                    <h5 className="text-sm font-semibold text-gray-700 mb-2">G. Refleksi Peserta Didik dan Guru</h5>
                    <p className="text-gray-700 text-sm leading-relaxed">Refleksi dilakukan untuk mengevaluasi proses pembelajaran dan merencanakan perbaikan.</p>
                  </div>
                </div>
              </div>

              <div className="gen-card bg-red-50 rounded-xl p-5 shadow-sm">
                <h4 className="font-semibold text-purple-400 mb-4 flex items-center gap-2">3. LAMPIRAN</h4>
                <div className="space-y-4">
                  <div>
                    <h5 className="text-sm font-semibold text-gray-700 mb-2">A. Ringkasan Materi</h5>
                    <div className="text-gray-700 text-sm leading-relaxed html-content markdown-body prose prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: parseMarkdown(result.ringkasanMateri) }} />
                  </div>
                  <div>
                    <h5 className="text-sm font-semibold text-gray-700 mb-2">B. Contoh Penerapan di Kehidupan Nyata</h5>
                    <div className="text-gray-700 text-sm leading-relaxed html-content markdown-body prose prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: parseMarkdown(result.contohNyata) }} />
                  </div>
                  <div>
                    <h5 className="text-sm font-semibold text-gray-700 mb-2">C. Lembar Kerja Peserta Didik (LKPD)</h5>
                    <p className="text-gray-700 text-sm leading-relaxed"><em>(Terlampir)</em></p>
                  </div>
                  <div>
                    <h5 className="text-sm font-semibold text-gray-700 mb-2">D. Bahan Bacaan Guru & Peserta Didik</h5>
                    <p className="text-gray-700 text-sm leading-relaxed">Buku Teks Utama Kemendikbudristek, Platform Merdeka Mengajar (PMM)</p>
                  </div>
                  <div>
                    <h5 className="text-sm font-semibold text-gray-700 mb-2">E. Glosarium</h5>
                    <p className="text-gray-700 text-sm leading-relaxed">Daftar istilah penting terkait materi {result.topik || 'pembelajaran'}.</p>
                  </div>
                  <div>
                    <h5 className="text-sm font-semibold text-gray-700 mb-2">F. Daftar Pustaka</h5>
                    <p className="text-gray-700 text-sm leading-relaxed">Buku Panduan Guru dan Siswa Kurikulum Merdeka.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <button 
                  onClick={() => setIsPrintModalOpen(true)} 
                  className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-black font-bold text-lg transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <span>🖨️</span> Print / Download PDF
                </button>
                <p className="text-[10px] text-gray-500 italic text-center">
                  * Gunakan Chrome di Desktop untuk hasil terbaik. Di mobile, gunakan "Simpan sebagai PDF".<br/>
                  * Jangan lupa support saya agar makin berusaha dalam memperbaiki website ini.
                </p>
              </div>
            </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-16 h-full flex flex-col items-center justify-center">
              <div className="text-6xl mb-4 opacity-50">📖</div>
              <p>Modul Ajar akan muncul di sini</p>
            </div>
          )}
        </div>
          </div>
        </div>
      </div>
      <PrintSupportModal isOpen={isPrintModalOpen} onClose={() => setIsPrintModalOpen(false)} onConfirm={printModul} />
    </div>
  );
}
