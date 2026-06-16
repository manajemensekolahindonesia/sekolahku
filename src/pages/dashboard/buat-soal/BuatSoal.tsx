import React, { useState, useEffect } from 'react';
import ModelSelector from '@/components/ModelSelector';

import { GoogleGenAI, Type } from '@/lib/genai';
import { educationLevels, phaseClassMap, subjectsByLevel, cpData } from '@/lib/constants';
import { Loader2, FileText, List, Printer, AlertTriangle, Lightbulb, Sparkles, Save , Trash2, CheckCircle, ChevronDown, Copy, Check, Info, Image as ImageIcon, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getWatermarkHtml, createPrintWindow } from '@/lib/print';
import PrintSupportModal from '@/components/PrintSupportModal';
import AIAssistedInput from '@/components/AIAssistedInput';
import AIAssistedTextarea from '@/components/AIAssistedTextarea';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import LogoUploader from '@/components/LogoUploader';

export default function BuatSoal() {
  const { profile } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'kisi-kisi' | 'naskah' | 'kunci' | 'kartu' | 'live-quiz'>('kisi-kisi');
  const [liveQuizIndex, setLiveQuizIndex] = useState(0);
  const [liveQuizAnswers, setLiveQuizAnswers] = useState<Record<number, string>>({});
  const [liveQuizFinished, setLiveQuizFinished] = useState(false);
  const [selectedModel, setSelectedModel] = React.useState<string>('openai');
  const [selectedImageModel, setSelectedImageModel] = React.useState<string>('flux');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printTypeToProceed, setPrintTypeToProceed] = useState<'kisi-kisi' | 'naskah' | 'kunci' | 'kartu' | null>(null);
  
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useLocalStorage<{
    jenjang: string;
    fase: string;
    kelas: string;
    semester: string;
    mapel: string;
    topik: string;
    materi: string;
    indikator: string;
    tipeUjian: string;
    subTipeUjian: string;
    bentukSoal: string[];
    kerangkaTaksonomi: string;
    levelKognitif: string[];
    jumlahSoalTotal: number;
    jumlahSoalPerBentuk: Record<string, number>;
    hasInklusi: boolean;
    jumlahInklusi: number;
    abkKategori: string;
    terdapatSoalBergambar: boolean;
    jumlahSoalBergambar: number;
  }>('BuatSoalData', {
    jenjang: '',
    fase: '',
    kelas: '',
    semester: '',
    mapel: '',
    topik: '',
    materi: '',
    indikator: '',
    tipeUjian: 'Ujian Biasa',
    subTipeUjian: 'TKA Literasi',
    bentukSoal: ['Pilihan Ganda'],
    kerangkaTaksonomi: 'Bloom',
    levelKognitif: ['C2 - Memahami', 'C3 - Mengaplikasikan'],
    jumlahSoalTotal: 10,
    jumlahSoalPerBentuk: { 'Pilihan Ganda': 10 },
    hasInklusi: false,
    jumlahInklusi: 0,
    abkKategori: '',
    terdapatSoalBergambar: false,
    jumlahSoalBergambar: 0
  });

  const [useLogo, setUseLogo] = useLocalStorage<boolean>('BuatSoal_useLogo', false);
  const [logoUrl, setLogoUrl] = useLocalStorage<string | null>('BuatSoal_logoUrl', null);

  const handleBentukSoalChange = (bentuk: string) => {
    let current = [...formData.bentukSoal];
    if (bentuk === 'Kombinasi') { current = ['Kombinasi']; }
    else {
      current = current.filter(c => c !== 'Kombinasi');
      if (current.includes(bentuk)) current = current.filter(c => c !== bentuk);
      else current.push(bentuk);
    }
    if (current.length === 0) current = ['Pilihan Ganda'];
    setFormData({ ...formData, bentukSoal: current });
  };

  const handleLevelKognitifChange = (lvl: string) => {
    let current = [...formData.levelKognitif];
    if (lvl === 'Kombinasi') { current = ['Kombinasi']; }
    else {
      current = current.filter(c => c !== 'Kombinasi');
      if (current.includes(lvl)) current = current.filter(c => c !== lvl);
      else current.push(lvl);
    }
    if (current.length === 0) current = ['C1 - Mengingat'];
    setFormData({ ...formData, levelKognitif: current });
  };

  const saveProgress = () => {
    alert('Progress otomatis disimpan saat Anda mengetik!');
  };

  const resetProgress = () => {
    if (confirm('Apakah Anda yakin ingin mereset semua data di halaman ini? Data yang belum di-export akan hilang.')) {
      localStorage.removeItem('BuatSoalData');
      window.location.reload();
    }
  };

  const [generatingImageIndex, setGeneratingImageIndex] = useState<{index: number, isABK: boolean} | null>(null);

  const handleGenerateImageForQuestion = async (index: number, description: string, isABK: boolean) => {
    setGeneratingImageIndex({ index, isABK });
    try {
      const cleanDescription = encodeURIComponent(`${description}, educational outline coloring page line-art, vector black and white line drawing, high quality diagram line art, no shading, no colors, plain white background`);
      const seed = Math.floor(Math.random() * 1000000);
      const url = `/api/generate-image?prompt=${cleanDescription}&model=${selectedImageModel}&seed=${seed}`;
      
      setResultSoal((prev: any) => {
        if (!prev) return prev;
        const next = { ...prev };
        if (isABK) {
          const list = [...next.soalABKList];
          list[index] = { ...list[index], gambarUrl: url };
          next.soalABKList = list;
        } else {
          const list = [...next.soalList];
          list[index] = { ...list[index], gambarUrl: url };
          next.soalList = list;
        }
        return next;
      });
    } catch (e) {
      console.error(e);
    } finally {
      setGeneratingImageIndex(null);
    }
  };

  const [resultKisiKisi, setResultKisiKisi] = useState<any>(null);
  const [resultSoal, setResultSoal] = useState<any>(null);

  useEffect(() => {
    if (profile && !formData.jenjang) {
      setFormData(prev => ({
        ...prev,
        jenjang: profile.jenjang?.toLowerCase() || 'sd'
      }));
    } else if (!formData.jenjang) {
      setFormData(prev => ({ ...prev, jenjang: 'sd' }));
    }
  }, [profile, formData.jenjang]);

  useEffect(() => {
    if (!formData.jenjang) return;
    const phases = phaseClassMap[formData.jenjang]?.phases || [];
    if (!phases.find(p => p.id === formData.fase)) {
      const firstPhase = phases[0]?.id || '';
      const classes = phaseClassMap[formData.jenjang]?.classes[firstPhase] || [];
      const firstClass = classes[0]?.id || '';
      
      const subjects = subjectsByLevel[formData.jenjang] || [];
      const firstSubject = subjects[0]?.id || '';
      
      setFormData(prev => ({ ...prev, fase: firstPhase, kelas: firstClass, mapel: firstSubject }));
    } else {
      const classes = phaseClassMap[formData.jenjang]?.classes[formData.fase] || [];
      if (!classes.find(c => c.id === formData.kelas)) {
        setFormData(prev => ({ ...prev, kelas: classes[0]?.id || '' }));
      }
    }
  }, [formData.jenjang, formData.fase]);

  const getCP = () => {
    const key = `${formData.jenjang}-${formData.mapel}-${formData.fase}`;
    return cpData[key] || 'Capaian Pembelajaran belum tersedia untuk kombinasi ini.';
  };

  const generateContent = async (type: 'kisi-kisi' | 'soal') => {
    setIsGenerating(true);
    setError('');
    
    try {
      const ai = new GoogleGenAI({});
      
      const jenjangLabel = educationLevels.find(l => l.id === formData.jenjang)?.label || formData.jenjang;
      const mapelLabel = subjectsByLevel[formData.jenjang]?.find(s => s.id === formData.mapel)?.label || formData.mapel;
      const cp = getCP();

      // Token limit is now securely enforced centrally in lib/genai.ts

      let prompt = '';
      let responseSchema: any = {};

      let totalSoal = 0;
      let breakdownSoal = '';
      if (formData.bentukSoal.includes('Kombinasi')) {
         totalSoal = formData.jumlahSoalTotal;
         breakdownSoal = `Jumlah Soal: ${totalSoal} Soal.`;
      } else {
         totalSoal = formData.bentukSoal.reduce((acc, b) => acc + (formData.jumlahSoalPerBentuk[b] || 0), 0);
         breakdownSoal = `Jumlah Soal: ${formData.bentukSoal.map(b => `${b} (${formData.jumlahSoalPerBentuk[b] || 0})`).join(', ')}. Total: ${totalSoal} Soal.`;
      }

      if (type === 'kisi-kisi') {
        prompt = `Pastikan dokumen ini disusun sesuai standar terbaru Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi (Kemendikbudristek) serta Kementerian Agama (Kemenag) Republik Indonesia, mengikuti panduan Kurikulum Merdeka yang mengikat.

Buatkan Kisi-kisi Soal untuk:
Mata Pelajaran: ${mapelLabel}
Jenjang: ${jenjangLabel}
Fase/Kelas/Semester: ${formData.fase} / ${formData.kelas} / ${formData.semester}
Tipe Ujian: ${formData.tipeUjian}
Capaian Pembelajaran: ${cp}
Materi Esensial: ${formData.materi}
Indikator Asesmen: ${formData.indikator}
Bentuk Soal: ${formData.bentukSoal.join(', ')}
Level Kognitif (${formData.kerangkaTaksonomi === 'Bloom' ? 'Taksonomi Bloom' : 'Taksonomi SOLO'}): ${formData.levelKognitif.join(', ')}
${breakdownSoal}
${formData.hasInklusi ? `Terdapat Anak Inklusi: Ya, berjumlah ${formData.jumlahInklusi} siswa. Pastikan hasil generate menyediakan adaptasi atau modifikasi untuk anak inklusi.` : ''}

PENTING:
- Selaraskan dengan CP. Tujuan Pembelajaran (TP) diturunkan dari CP.
- Gunakan indikator yang mencerminkan proses berpikir tingkat tinggi (HOTS) jika dipilih.
- Kaitkan soal dengan konteks nyata (meaningful learning).
- Jika Asesmen Nasional/Olimpiade, pastikan kisi-kisi memuat indikator stimulus (literasi/numerasi) dan soal menantang HOTS.

Berikan output dalam format JSON murni:
{
  "tujuanPembelajaran": "...",
  "kisiKisi": [
    {
      "elemen": "...",
      "tujuanPembelajaran": "...",
      "materi": "...",
      "levelKognitif": "...",
      "indikatorSoal": "...",
      "jenisSoal": "...",
      "noSoal": "..."
    }
  ]
}`;
        responseSchema = {
          type: Type.OBJECT,
          properties: {
            tujuanPembelajaran: { type: Type.STRING },
            kisiKisi: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  elemen: { type: Type.STRING },
                  tujuanPembelajaran: { type: Type.STRING },
                  materi: { type: Type.STRING },
                  levelKognitif: { type: Type.STRING },
                  indikatorSoal: { type: Type.STRING },
                  jenisSoal: { type: Type.STRING },
                  noSoal: { type: Type.STRING }
                }
              }
            }
          }
        };
      } else {
        let extraInstructions = '';
        if (formData.tipeUjian === 'Other' && formData.subTipeUjian) {
          extraInstructions += `\n- Tipe Ujian Sub-kategori: ${formData.subTipeUjian}. Lakukan pencarian web real-time menggunakan Google Search tool untuk mencari referensi soal dan kisi-kisi resmi ${formData.subTipeUjian} terbaru dari tahun 2022 hingga 2026.`;
        } else if (formData.tipeUjian === 'Olimpiade') {
          extraInstructions += `\n- Standar Olimpiade: Sesuaikan cakupan dan bobot soal dengan standar kompetisi olimpiade sains resmi (seperti OSN tingkat kabupaten/provinsi/nasional, IMO untuk Matematika, IPhO untuk Fisika, IChO untuk Kimia, IBO untuk Biologi, dll.) sesuai dengan mata pelajaran ${mapelLabel}. Soal harus bertipe analisis mendalam, pemecahan masalah kompleks, dan menantang.`;
        } else if (formData.tipeUjian === 'Live Quiz') {
          extraInstructions += `\n- Standar Live Quiz: Susun soal dengan format yang cocok untuk platform kuis interaktif (seperti Kahoot, Quizizz). Pertanyaan harus ringkas, jelas, dan menarik. Opsi jawaban maksimal 4 pilihan singkat. Pembahasan harus to the point.`;
        }

        if (formData.terdapatSoalBergambar && formData.jumlahSoalBergambar > 0) {
          extraInstructions += `\n- SOAL BERGAMBAR (SANGAT PENTING): Terdapat kebutuhan soal bergambar sebanyak ${formData.jumlahSoalBergambar} soal. Anda WAJIB membuat tepat ${formData.jumlahSoalBergambar} soal yang membutuhkan gambar/diagram ilustrasi visual. Untuk soal bergambar ini, Anda MUTLAK harus mengisi field "gambarDeskripsi" di format JSON dengan prompt gambar (bahasa Inggris) yang sangat detail. JANGAN KOSONGKAN "gambarDeskripsi" untuk soal bergambar! Contoh: "A detailed map of Indonesia showing major islands", "A diagram of human digestive system". Untuk soal reguler yang tidak butuh gambar, biarkan kosong.`;
        }

        if (['bahasa-arab', 'al-quran-hadis', 'akidah-akhlak', 'fikih', 'ski'].includes(formData.mapel)) {
          extraInstructions += `\n- BAHASA ARAB: Karena mata pelajaran ini berbasis PAI/Bahasa Arab, WAJIB gunakan teks Arab asli (Arabic script) berharakat untuk setiap ayat, hadis, kosakata, atau naskah Arab yang diperlukan. Jangan hanya menggunakan transliterasi latin.`;
        }

        prompt = `Pastikan dokumen ini disusun sesuai standar terbaru Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi (Kemendikbudristek) serta Kementerian Agama (Kemenag) Republik Indonesia, mengikuti panduan Kurikulum Merdeka yang mengikat.

Buatkan Soal beserta Kunci Jawabannya untuk:
Mata Pelajaran: ${mapelLabel}
Jenjang: ${jenjangLabel}
Fase/Kelas/Semester: ${formData.fase} / ${formData.kelas} / ${formData.semester}
Tipe Ujian: ${formData.tipeUjian}${formData.tipeUjian === 'Other' ? ` (${formData.subTipeUjian})` : ''}
Capaian Pembelajaran: ${cp}
Materi Esensial: ${formData.materi}
Indikator Asesmen: ${formData.indikator}
Bentuk Soal: ${formData.bentukSoal.join(', ')}
Level Kognitif (${formData.kerangkaTaksonomi === 'Bloom' ? 'Taksonomi Bloom' : 'Taksonomi SOLO'}): ${formData.levelKognitif.join(', ')}
Rincian Target Reguler: ${breakdownSoal}
${extraInstructions}

PENTING:
- PENCARIAN REAL-TIME: Kamu harus melampirkan referensi data riil, kasus aktual, atau informasi pendukung yang sedang tren di search dari 2022 - 2026 jika relevan dengan tipe ujian. Sebutkan bahwa source dukungan berasal dari "Source Nano Banana 2".
- PEMBAGIAN SOAL: Kamu WAJIB memisahkan soal menjadi ${formData.hasInklusi ? '2 bagian' : '1 bagian'} dalam JSON:
  1. "soalList": Berisi soal Reguler sesuai jumlah target pengunjung.
${formData.hasInklusi ? `  2. "soalABKList": Berisi anak inklusi / ABK (Anak Berkebutuhan Khusus). Buatkan modifikasi dari soal reguler (misal: bahasanya disederhanakan, lebih banyak butir visual langsung) MAKSIMAL 20 soal. Semua soal ABK ini dimasukkan ke array "soalABKList".\n` : ''}- Tipe Ujian Asesmen Nasional/Olimpiade wajib pakai stimulus konteks spesifik dari berita real-time kalau memungkinkan.
- JANGAN memuat singkatan "P5" atau istilah "Proyek Penguatan Profil Pelajar Pancasila" atau "Projek Penguatan Profil Pelajar Pancasila". Gantilah semua dengan istilah "Kokurikuler" atau "Kegiatan Kokurikuler" atau "Modul Kokurikuler".

Berikan output dalam format JSON murni:
{
  "soalList": [
    { 
      "jenisSoal": "Pilihan Ganda / Uraian / dll", 
      "no": "...", 
      "pertanyaan": "...", 
      "opsiTambahan": ["A. ...", "B. ..."], 
      "pasanganMenjodohkan": [{"kiri": "...", "kanan": "..."}],
      "kunci": "...", 
      "pembahasan": "...",
      "skor": "...",
      "materi": "...",
      "indikatorSoal": "...",
      "levelKognitif": "...",
      "gambarDeskripsi": "...",
      "gambarUrl": ""
    }
  ]${formData.hasInklusi ? `,
  "soalABKList": [
    {
      "jenisSoal": "...", "no": "...", "pertanyaan": "...", "opsiTambahan": [], "pasanganMenjodohkan": [], "kunci": "...", "pembahasan": "...", "skor": "...", "materi": "...", "indikatorSoal": "...", "levelKognitif": "...", "gambarDeskripsi": "...", "gambarUrl": ""
    }
  ]` : ''}
}`;
        let propertiesObj: any = {
          soalList: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                jenisSoal: { type: Type.STRING },
                no: { type: Type.STRING },
                pertanyaan: { type: Type.STRING },
                opsiTambahan: { type: Type.ARRAY, items: { type: Type.STRING } },
                pasanganMenjodohkan: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { kiri: { type: Type.STRING }, kanan: { type: Type.STRING } } } },
                kunci: { type: Type.STRING },
                pembahasan: { type: Type.STRING },
                skor: { type: Type.STRING },
                materi: { type: Type.STRING },
                indikatorSoal: { type: Type.STRING },
                levelKognitif: { type: Type.STRING },
                gambarDeskripsi: { type: Type.STRING },
                gambarUrl: { type: Type.STRING }
              },
              required: ["jenisSoal", "no", "pertanyaan", "kunci", "pembahasan", "gambarDeskripsi"]
            }
          }
        };

        if (formData.hasInklusi) {
          propertiesObj.soalABKList = {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                jenisSoal: { type: Type.STRING },
                no: { type: Type.STRING },
                pertanyaan: { type: Type.STRING },
                opsiTambahan: { type: Type.ARRAY, items: { type: Type.STRING } },
                pasanganMenjodohkan: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { kiri: { type: Type.STRING }, kanan: { type: Type.STRING } } } },
                kunci: { type: Type.STRING },
                pembahasan: { type: Type.STRING },
                skor: { type: Type.STRING },
                materi: { type: Type.STRING },
                indikatorSoal: { type: Type.STRING },
                levelKognitif: { type: Type.STRING },
                gambarDeskripsi: { type: Type.STRING },
                gambarUrl: { type: Type.STRING }
              },
              required: ["jenisSoal", "no", "pertanyaan", "kunci", "pembahasan", "gambarDeskripsi"]
            }
          };
        }

        responseSchema = {
          type: Type.OBJECT,
          properties: propertiesObj
        };
      }

      const response = await ai.models.generateContent({
        model: selectedModel,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
          tools: [{ googleSearch: {} }],
        }
      });

      let responseText = response.text || '{}';
      // Clean up markdown formatting if present
      responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      const generatedData = JSON.parse(responseText);

      if (type === 'soal') {
        const processSoalImages = (soalList: any[]) => {
          if (!soalList) return [];
          return soalList.map(s => {
            if (s.gambarDeskripsi && !s.gambarUrl) {
              const cleanDescription = encodeURIComponent(`${s.gambarDeskripsi}, educational outline coloring page line-art, vector black and white line drawing, high quality diagram line art, no shading, no colors, plain white background`);
              const seed = Math.floor(Math.random() * 1000000);
              s.gambarUrl = `/api/generate-image?prompt=${cleanDescription}&model=${selectedImageModel}&seed=${seed}`;
            }
            return s;
          });
        };

        if (generatedData.soalList) {
          generatedData.soalList = processSoalImages(generatedData.soalList);
        }
        if (generatedData.soalABKList) {
          generatedData.soalABKList = processSoalImages(generatedData.soalABKList);
        }
      }

      if (type === 'kisi-kisi') {
        setResultKisiKisi({ ...generatedData, meta: { mapelLabel, jenjangLabel, ...formData } });
      } else {
        setResultSoal({ ...generatedData, meta: { mapelLabel, jenjangLabel, ...formData } });
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Terjadi kesalahan saat menghasilkan konten.');
    } finally {
      setIsGenerating(false);
    }
  };

  const executePrint = (type: 'kisi-kisi' | 'naskah' | 'kunci' | 'kartu') => {
    const printWindow = createPrintWindow();
    if (!printWindow) return;

    let content = '';
    if (type === 'kisi-kisi') content = renderKisiKisiPrint();
    else content = renderSoalPrint(type);

    const docFooter = `
      ${(profile?.kepalaSekolah || profile?.nama || profile?.displayName) ? `<div style="margin-top: 40px; display: flex; justify-content: space-between; text-align: center; font-size: 12px; page-break-inside: avoid;">
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
      
      <div style="margin-top: 30px; border-top: 1px solid #ccc; padding-top: 20px; text-align: center; font-size: 11px; color: #666; page-break-inside: avoid;">
        <p>Dokumen ini dihasilkan secara otomatis oleh <b>Generator Soal - Pemuryadi</b></p>
        <p>Maju Pendidikan Indonesia &copy; ${new Date().getFullYear()}</p>
        <br>
        <p><i>"Dukungan Anda sangat berarti bagi kami untuk terus mengembangkan platform ini secara gratis."</i></p>
        <p style="margin-top: 5px;"><b>Saweria: saweria.co/pemuryadi FB/IG/TikTok: @p.e.muryadi</b></p>
      </div>
    `;

    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]')).map(el => el.outerHTML).join('\n');
    printWindow.document.write(`
      <html>
        <head>
          <title>Cetak ${type.toUpperCase()}</title>
          <style>
            body { font-family: 'Times New Roman', Times, serif; line-height: 1.5; padding: 2cm; color: black; }
            h1, h2, h3 { text-align: center; margin-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid black; padding: 8px; text-align: left; vertical-align: top; }
            th { background-color: #f2f2f2; text-align: center; }
            .header-info { margin-bottom: 20px; }
            .header-info table { border: none; margin-top: 0; }
            .header-info td { border: none; padding: 4px; }
            .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 100px; color: rgba(0,0,0,0.05); z-index: -1; white-space: nowrap; pointer-events: none; }
            .kartu-soal-box { border: 1px solid black; margin-bottom: 30px; page-break-inside: avoid; }
            .kartu-header { text-align: center; font-weight: bold; border-bottom: 1px solid black; padding: 5px; }
            .kartu-body { display: flex; }
            .kartu-left { width: 30%; border-right: 1px solid black; padding: 10px; font-size: 12px; }
            .kartu-right { width: 70%; padding: 10px; font-size: 14px; }
            @media print {
              @page { margin: 1cm; }
              body { padding: 0; }
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
          ${getWatermarkHtml()}
          ${content}
          ${docFooter}
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

  const handlePrintClick = (type: 'kisi-kisi' | 'naskah' | 'kunci' | 'kartu') => {
    setPrintTypeToProceed(type);
    setShowPrintModal(true);
  };

  const renderKisiKisiPrint = () => {
    if (!resultKisiKisi) return '';
    const { meta, kisiKisi } = resultKisiKisi;
    return `
      ${useLogo && logoUrl ? `<div style="text-align: center; margin-bottom: 20px;"><img src="${logoUrl}" style="height: 80px; width: auto;" alt="Logo"/></div>` : ''}
      <h2>KISI-KISI ${meta.tipeUjian ? meta.tipeUjian.toUpperCase() : 'SOAL'}</h2>
      <div class="header-info">
        <table>
          <tr><td width="150">Mata Pelajaran</td><td>: ${meta.mapelLabel}</td></tr>
          <tr><td>Kelas/Semester</td><td>: ${meta.kelas} / ${meta.semester}</td></tr>
          <tr><td>Fase</td><td>: ${meta.fase}</td></tr>
        </table>
      </div>
      <table>
        <thead>
          <tr>
            <th>No</th>
            <th>Elemen</th>
            <th>Tujuan Pembelajaran</th>
            <th>Materi</th>
            <th>Level Kognitif</th>
            <th>Indikator Soal</th>
            <th>Jenis Soal</th>
            <th>No Soal</th>
          </tr>
        </thead>
        <tbody>
          ${kisiKisi?.map((k: any, i: number) => `
            <tr>
              <td style="text-align: center;">${i + 1}</td>
              <td>${k.elemen || ''}</td>
              <td>${k.tujuanPembelajaran || ''}</td>
              <td>${k.materi || ''}</td>
              <td style="text-align: center;">${k.levelKognitif || ''}</td>
              <td>${k.indikatorSoal || ''}</td>
              <td style="text-align: center;">${k.jenisSoal || ''}</td>
              <td style="text-align: center;">${k.noSoal || ''}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  };

  const renderSoalPrint = (type: 'naskah' | 'kunci' | 'kartu') => {
    if (!resultSoal || (!resultSoal.soalList && !resultSoal.soalABKList)) return '';
    const { meta, soalList = [], soalABKList = [] } = resultSoal;

    const printHeader = `
      ${useLogo && logoUrl ? `<div style="text-align: center; margin-bottom: 20px;"><img src="${logoUrl}" style="height: 80px; width: auto;" alt="Logo"/></div>` : ''}
      <div class="header-info">
        <table>
          <tr><td width="150">Mata Pelajaran</td><td>: ${meta.mapelLabel}</td></tr>
          <tr><td>Kelas/Semester</td><td>: ${meta.kelas} / ${meta.semester}</td></tr>
          <tr><td>Tipe Ujian</td><td>: ${meta.tipeUjian}</td></tr>
        </table>
      </div>
    `;

    if (type === 'kartu') {
      return `
        <h2>KARTU SOAL</h2>
        ${printHeader}
        ${soalList.map((s: any) => `
          <div class="kartu-soal-box">
             <div class="kartu-header">KARTU SOAL NOMOR ${s.no} (REGULER)</div>
             <div class="kartu-body">
                <div class="kartu-left">
                   <strong>Materi:</strong><br/>${s.materi}<br/><br/>
                   <strong>Indikator:</strong><br/>${s.indikatorSoal}<br/><br/>
                   <strong>Level Kognitif:</strong> ${s.levelKognitif}<br/>
                   <strong>Bentuk Soal:</strong> ${s.jenisSoal}
                </div>
                <div class="kartu-right">
                   <strong>Rumusan Soal / Pertanyaan:</strong><br/>
                   <div style="white-space: pre-wrap; margin-bottom: 10px;">${s.pertanyaan}</div>
                   
                   ${s.gambarUrl ? `<div style="margin-bottom: 10px;"><img src="${s.gambarUrl}" style="max-width: 6cm; max-height: 6cm; border: 1px solid #ccc; display: block;" /></div>` : ''}

                   ${s.opsiTambahan && s.opsiTambahan.length > 0 ? `
                     <div style="margin-left: 15px; margin-bottom: 10px;">
                       ${s.opsiTambahan.map((o: string) => `<div>${o}</div>`).join('')}
                     </div>
                   ` : ''}

                   ${s.pasanganMenjodohkan && s.pasanganMenjodohkan.length > 0 ? `
                     <table style="width: 80%; border: none; margin-bottom: 10px;">
                        ${s.pasanganMenjodohkan.map((p: any) => `<tr><td style="border:none;">${p.kiri}</td><td style="border:none;width:30px;text-align:center;">---</td><td style="border:none;">${p.kanan}</td></tr>`).join('')}
                     </table>
                   ` : ''}

                   <div style="margin-top: 15px; border-top: 1px solid #ccc; padding-top: 10px;">
                      <strong>Kunci Jawaban:</strong> <br/>
                      <span style="white-space: pre-wrap;">${s.kunci}</span><br/><br/>
                      <strong>Skor:</strong> ${s.skor}
                   </div>
                </div>
             </div>
          </div>
        `).join('')}
        
        ${soalABKList.length > 0 ? `
          <div style="page-break-before: always;"></div>
          <h2>KARTU SOAL - ADAPTASI ABK (INKLUSI)</h2>
          ${printHeader}
          ${soalABKList.map((s: any) => `
          <div class="kartu-soal-box">
             <div class="kartu-header">KARTU SOAL NOMOR ${s.no} (ABK)</div>
             <div class="kartu-body">
                <div class="kartu-left">
                   <strong>Materi:</strong><br/>${s.materi}<br/><br/>
                   <strong>Indikator:</strong><br/>${s.indikatorSoal}<br/><br/>
                   <strong>Level Kognitif:</strong> ${s.levelKognitif}<br/>
                   <strong>Bentuk Soal:</strong> ${s.jenisSoal}
                </div>
                <div class="kartu-right">
                   <strong>Rumusan Soal / Pertanyaan:</strong><br/>
                   <div style="white-space: pre-wrap; margin-bottom: 10px;">${s.pertanyaan}</div>
                   
                   ${s.gambarUrl ? `<div style="margin-bottom: 10px;"><img src="${s.gambarUrl}" style="max-width: 6cm; max-height: 6cm; border: 1px solid #ccc; display: block;" /></div>` : ''}

                   ${s.opsiTambahan && s.opsiTambahan.length > 0 ? `
                     <div style="margin-left: 15px; margin-bottom: 10px;">
                       ${s.opsiTambahan.map((o: string) => `<div>${o}</div>`).join('')}
                     </div>
                   ` : ''}

                   ${s.pasanganMenjodohkan && s.pasanganMenjodohkan.length > 0 ? `
                     <table style="width: 80%; border: none; margin-bottom: 10px;">
                        ${s.pasanganMenjodohkan.map((p: any) => `<tr><td style="border:none;">${p.kiri}</td><td style="border:none;width:30px;text-align:center;">---</td><td style="border:none;">${p.kanan}</td></tr>`).join('')}
                     </table>
                   ` : ''}

                   <div style="margin-top: 15px; border-top: 1px solid #ccc; padding-top: 10px;">
                      <strong>Kunci Jawaban:</strong> <br/>
                      <span style="white-space: pre-wrap;">${s.kunci}</span><br/><br/>
                      <strong>Skor:</strong> ${s.skor}
                   </div>
                </div>
             </div>
          </div>
          `).join('')}
        ` : ''}
      `;
    }

    if (type === 'kunci') {
      return `
        <h2>KUNCI JAWABAN & PEMBAHASAN</h2>
        ${printHeader}
        <table style="width: 100%;">
          <tr><th style="width: 50px;">No</th><th>Kunci & Pembahasan</th><th style="width: 60px;">Skor</th></tr>
          ${soalList.map((s: any) => `
            <tr>
              <td style="text-align:center;">${s.no}</td>
              <td>
                <strong>Kunci:</strong> <span style="white-space:pre-wrap;">${s.kunci}</span><br/><br/>
                ${s.pembahasan ? `<strong>Pembahasan:</strong><br/><span style="white-space:pre-wrap;">${s.pembahasan}</span>` : ''}
              </td>
              <td style="text-align:center;">${s.skor}</td>
            </tr>
          `).join('')}
        </table>
        
        ${soalABKList.length > 0 ? `
          <h3 style="margin-top: 30px;">KUNCI JAWABAN & PEMBAHASAN - SOAL INKLUSI (ABK)</h3>
          <table style="width: 100%;">
            <tr><th style="width: 50px;">No</th><th>Kunci & Pembahasan</th><th style="width: 60px;">Skor</th></tr>
            ${soalABKList.map((s: any) => `
              <tr>
                <td style="text-align:center;">${s.no}</td>
                <td>
                  <strong>Kunci:</strong> <span style="white-space:pre-wrap;">${s.kunci}</span><br/><br/>
                  ${s.pembahasan ? `<strong>Pembahasan:</strong><br/><span style="white-space:pre-wrap;">${s.pembahasan}</span>` : ''}
                </td>
                <td style="text-align:center;">${s.skor}</td>
              </tr>
            `).join('')}
          </table>
        ` : ''}
      `;
    }

    return `
      <h2>NASKAH SOAL</h2>
      ${printHeader}
      ${soalList.map((s: any) => `
        <div style="margin-bottom: 20px; page-break-inside: avoid;">
          <div style="display: flex;">
            <div style="width: 30px; font-weight: bold;">${s.no}.</div>
            <div style="flex: 1;">
              <div style="white-space: pre-wrap; margin-bottom: 10px;">${s.pertanyaan}</div>
              
              ${s.gambarUrl ? `<div style="margin-top: 10px; margin-bottom: 10px;"><img src="${s.gambarUrl}" style="max-width: 8cm; max-height: 8cm; border: 1px solid #ccc; display: block;" /></div>` : ''}

              ${s.opsiTambahan && s.opsiTambahan.length > 0 ? `
                <div style="margin-left: 10px;">
                  ${s.opsiTambahan.map((o: string) => `<div>${o}</div>`).join('')}
                </div>
              ` : ''}
              ${s.pasanganMenjodohkan && s.pasanganMenjodohkan.length > 0 ? `
                <table style="width: 60%; border: none; margin-bottom: 10px;">
                  ${s.pasanganMenjodohkan.map((p: any) => `<tr><td style="border:none;">${p.kiri}</td><td style="border:none;width:30px;text-align:center;">.........</td><td style="border:none;">${p.kanan}</td></tr>`).join('')}
                </table>
              ` : ''}
            </div>
          </div>
        </div>
      `).join('')}
      
      ${soalABKList.length > 0 ? `
        <div style="page-break-before: always;"></div>
        <h2>NASKAH SOAL - ADAPTASI ABK (INKLUSI)</h2>
        ${printHeader}
        ${soalABKList.map((s: any) => `
        <div style="margin-bottom: 20px; page-break-inside: avoid;">
          <div style="display: flex;">
            <div style="width: 30px; font-weight: bold;">${s.no}.</div>
            <div style="flex: 1;">
              <div style="white-space: pre-wrap; margin-bottom: 10px;">${s.pertanyaan}</div>

              ${s.gambarUrl ? `<div style="margin-top: 10px; margin-bottom: 10px;"><img src="${s.gambarUrl}" style="max-width: 8cm; max-height: 8cm; border: 1px solid #ccc; display: block;" /></div>` : ''}

              ${s.opsiTambahan && s.opsiTambahan.length > 0 ? `
                <div style="margin-left: 10px;">
                  ${s.opsiTambahan.map((o: string) => `<div>${o}</div>`).join('')}
                </div>
              ` : ''}
              ${s.pasanganMenjodohkan && s.pasanganMenjodohkan.length > 0 ? `
                <table style="width: 60%; border: none; margin-bottom: 10px;">
                  ${s.pasanganMenjodohkan.map((p: any) => `<tr><td style="border:none;">${p.kiri}</td><td style="border:none;width:30px;text-align:center;">.........</td><td style="border:none;">${p.kanan}</td></tr>`).join('')}
                </table>
              ` : ''}
            </div>
          </div>
        </div>
        `).join('')}
      ` : ''}
    `;
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 text-gray-900">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 border border-blue-200 shadow-sm">
            <FileText size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-wide">Buat Soal & Kisi-kisi</h1>
            <p className="text-sm text-blue-500">Generator asesmen berbasis Kurikulum Merdeka</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6">
        <div className="max-w-7xl mx-auto flex flex-col gap-6">
          
          {/* Form Section (Top Panel) */}
          <div className="w-full flex flex-col gap-4">
            <h2 className="font-bold text-gray-900 flex items-center gap-2 px-1 mb-2">
              <List size={18} className="text-blue-600" /> Parameter Soal
            </h2>
                
                {/* Section 1: Informasi Ujian & Kelas */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col gap-5">
                  <h3 className="font-bold text-gray-800 text-sm border-b border-gray-100 pb-2">1. Informasi Ujian & Kelas</h3>
                  
                  {/* Row 1: Tipe Ujian */}
                  <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">Tipe Ujian</label>
                      <div className="flex flex-wrap gap-2">
                        {['Ujian Biasa', 'Asesmen Nasional', 'Olimpiade', 'Live Quiz', 'Other'].map(tipe => (
                          <button
                            key={tipe}
                            onClick={() => setFormData({...formData, tipeUjian: tipe})}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${formData.tipeUjian === tipe ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 border border-gray-300 hover:border-blue-200'}`}
                          >
                            {tipe}
                          </button>
                        ))}
                      </div>
                    </div>

                    {formData.tipeUjian === 'Other' && (
                      <div className="flex-1 w-full min-w-[200px] animate-in fade-in slide-in-from-top-1 duration-200">
                        <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">Sub-Tipe Ujian (TKA / Try Out)</label>
                        <select
                          value={formData.subTipeUjian}
                          onChange={e => setFormData({...formData, subTipeUjian: e.target.value})}
                          className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-gray-50 text-gray-900 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                        >
                          <option value="TKA Literasi">TKA: Literasi</option>
                          <option value="TKA Numerasi">TKA: Numerasi</option>
                          <option value="TKA Survei Lingkungan Belajar">TKA: Survei Lingkungan Belajar (Sulingjar)</option>
                          <option value="TKA Survei Karakter">TKA: Survei Karakter</option>
                          <option value="Try Out">Try Out</option>
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Row 2: Selects */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">Jenjang</label>
                      <select 
                        value={formData.jenjang}
                        onChange={e => setFormData({...formData, jenjang: e.target.value})}
                        className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-gray-50 text-gray-900 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                      >
                        {educationLevels.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">Fase</label>
                      <select 
                        value={formData.fase}
                        onChange={e => setFormData({...formData, fase: e.target.value})}
                        className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-gray-50 text-gray-900 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                      >
                        <option value="" disabled>Pilih Fase</option>
                        {phaseClassMap[formData.jenjang]?.phases?.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">Kelas</label>
                      <select 
                        value={formData.kelas}
                        onChange={e => setFormData({...formData, kelas: e.target.value})}
                        className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-gray-50 text-gray-900 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                      >
                        <option value="" disabled>Pilih Kelas</option>
                        {phaseClassMap[formData.jenjang]?.classes?.[formData.fase]?.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">Semester</label>
                      <select 
                        value={formData.semester}
                        onChange={e => setFormData({...formData, semester: e.target.value})}
                        className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-gray-50 text-gray-900 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                      >
                        <option value="1">Ganjil (1)</option>
                        <option value="2">Genap (2)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">Mata Pelajaran</label>
                      <select 
                        value={formData.mapel}
                        onChange={e => setFormData({...formData, mapel: e.target.value})}
                        className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-gray-50 text-gray-900 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                      >
                        {subjectsByLevel[formData.jenjang]?.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                      </select>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <LogoUploader useLogo={useLogo} setUseLogo={setUseLogo} logoUrl={logoUrl} setLogoUrl={setLogoUrl} />
                  </div>
                </div>

                {/* Section 2: Materi & Indikator */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col">
                  <h3 className="font-bold text-gray-800 text-sm border-b border-gray-100 pb-2 mb-4">2. Materi & Indikator</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">Capaian Pembelajaran (Otomatis)</label>
                    <div className="p-3 bg-gray-50 rounded-lg text-xs text-gray-700 h-24 overflow-y-auto border border-gray-300">
                      {getCP()}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">Materi Esensial / Konteks</label>
                    <AIAssistedInput type="text"
                      value={formData.materi}
                      onChange={e => setFormData({...formData, materi: e.target.value})}
                      placeholder="Contoh: Pecahan, Ekosistem, dll."
                      className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-gray-50 text-gray-900 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">Indikator Asesmen</label>
                      <AIAssistedTextarea value={formData.indikator}
                        onChange={e => setFormData({...formData, indikator: e.target.value})}
                        placeholder="Contoh: Peserta didik dapat menganalisis..."
                        className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-gray-50 text-gray-900 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all h-24" />
                    </div>
                  </div>
                </div></div>

                {/* Section 3: Struktur & Level Kognitif */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col gap-5">
                  <h3 className="font-bold text-gray-800 text-sm border-b border-gray-100 pb-2">3. Struktur & Level Kognitif</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                    
                    {/* Kolom Kiri: Bentuk Soal */}
                    <div className="flex flex-col gap-5">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wider">Bentuk Soal</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {['Pilihan Ganda', 'Pilihan Ganda Kompleks', 'Benar Salah', 'Menjodohkan', 'Isian Singkat', 'Uraian', 'Essay', 'Kombinasi'].map(bentuk => (
                          <div key={bentuk} className="flex flex-col gap-2">
                            <label className="flex items-center gap-3 cursor-pointer bg-gray-50 p-2.5 rounded-lg border border-gray-200 hover:border-blue-300 transition-all min-h-[46px]">
                              <input
                                type="checkbox"
                                checked={formData.bentukSoal.includes(bentuk)}
                                onChange={() => handleBentukSoalChange(bentuk)}
                                className="w-4 h-4 rounded border-slate-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-white bg-white flex-shrink-0"
                              />
                              <span className="text-[11px] text-gray-700 leading-tight">{bentuk}</span>
                            </label>
                            {formData.bentukSoal.includes(bentuk) && bentuk !== 'Kombinasi' && (
                              <input 
                                type="number" 
                                min="1" 
                                value={formData.jumlahSoalPerBentuk[bentuk] || ''} 
                                onChange={e => setFormData({...formData, jumlahSoalPerBentuk: {...formData.jumlahSoalPerBentuk, [bentuk]: parseInt(e.target.value) || 0}})} 
                                placeholder="Jumlah Soal"
                                className="w-full p-2 text-xs border border-gray-300 rounded-lg bg-gray-50 text-gray-900 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" 
                              />
                            )}
                          </div>
                        ))}
                        </div>
                      </div>

                      {formData.bentukSoal.includes('Kombinasi') && (
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">Total Jumlah Soal (Kombinasi)</label>
                          <input type="number" min="1" max="100" value={formData.jumlahSoalTotal} onChange={e => setFormData({...formData, jumlahSoalTotal: parseInt(e.target.value) || 1})} className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-gray-50 text-gray-900 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" />
                        </div>
                      )}
                    </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">Kerangka Taksonomi</label>
                    <div className="flex bg-slate-50 p-1 rounded-full border border-slate-100 mb-4 w-full">
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({
                            ...formData, 
                            kerangkaTaksonomi: 'Bloom', 
                            levelKognitif: formData.levelKognitif.filter(l => l.startsWith('C') || l === 'HOTS' || l === 'Kombinasi')
                          });
                        }}
                        className={`flex-1 py-2 text-xs font-bold rounded-full transition-all ${formData.kerangkaTaksonomi === 'Bloom' ? 'bg-white text-indigo-900 shadow-sm border border-slate-200' : 'text-indigo-800/70 hover:text-indigo-900 hover:bg-white/50'}`}
                      >
                        Taksonomi Bloom
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({
                            ...formData, 
                            kerangkaTaksonomi: 'SOLO', 
                            levelKognitif: []
                          });
                        }}
                        className={`flex-1 py-2 text-xs font-bold rounded-full transition-all ${formData.kerangkaTaksonomi === 'SOLO' ? 'bg-white text-indigo-900 shadow-sm border border-slate-200' : 'text-indigo-800/70 hover:text-indigo-900 hover:bg-white/50'}`}
                      >
                        Taksonomi SOLO
                      </button>
                    </div>

                    <label className="block text-[10px] font-semibold text-gray-500 mb-2 uppercase tracking-wider">Level Yang Digunakan</label>
                    <div className="flex flex-wrap gap-2">
                      {(formData.kerangkaTaksonomi === 'Bloom' 
                        ? ['C1 - Mengingat', 'C2 - Memahami', 'C3 - Mengaplikasikan', 'C4 - Menganalisis', 'C5 - Mengevaluasi', 'C6 - Mencipta', 'HOTS', 'Kombinasi']
                        : ['Pra-struktural', 'Uni-struktural', 'Multi-struktural', 'Relasional', 'Abstrak Diperluas']
                      ).map(lvl => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => handleLevelKognitifChange(lvl)}
                          className={`px-3 py-1.5 text-[11px] font-bold rounded-full border transition-all ${formData.levelKognitif.includes(lvl) ? 'bg-indigo-50 border-indigo-200 text-indigo-900 shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:bg-indigo-50/50'}`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                </div>

                {/* Section 4: Opsi Tambahan */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                  <h3 className="font-bold text-gray-800 text-sm border-b border-gray-100 pb-2 mb-4">4. Opsi Tambahan</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Opsi Inklusi */}
                    <div className="flex flex-col gap-3">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={formData.hasInklusi}
                          onChange={(e) => setFormData({...formData, hasInklusi: e.target.checked})}
                          className="w-4 h-4 rounded border-slate-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-white bg-white"
                        />
                        <span className="text-sm font-medium text-gray-700">Terdapat Anak Inklusi</span>
                      </label>
                      
                      {formData.hasInklusi && (
                        <div className="pl-7 animate-in fade-in duration-200">
                          <label className="block text-[10px] font-semibold text-gray-500 mb-1 uppercase tracking-wider">Jumlah Siswa Inklusi</label>
                          <input 
                            type="number"
                            min="1"
                            className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-gray-50 text-gray-900 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                            placeholder="Masukkan jumlah siswa inklusi..."
                            value={formData.jumlahInklusi === 0 ? '' : formData.jumlahInklusi}
                            onChange={(e) => setFormData({...formData, jumlahInklusi: parseInt(e.target.value) || 0})}
                          />
                        </div>
                      )}
                    </div>

                    {/* Opsi Gambar */}
                    <div className="flex flex-col gap-3">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={formData.terdapatSoalBergambar}
                          onChange={(e) => setFormData({...formData, terdapatSoalBergambar: e.target.checked})}
                          className="w-4 h-4 rounded border-slate-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-white bg-white"
                        />
                        <span className="text-sm font-medium text-gray-700">Terdapat Soal Bergambar</span>
                      </label>
                      
                      {formData.terdapatSoalBergambar && (
                        <div className="pl-7 animate-in fade-in duration-200">
                          <label className="block text-[10px] font-semibold text-gray-500 mb-1 uppercase tracking-wider">Jumlah Soal Bergambar</label>
                          <input 
                            type="number"
                            min="1"
                            max="20"
                            className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-gray-50 text-gray-900 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                            placeholder="Masukkan jumlah soal bergambar..."
                            value={formData.jumlahSoalBergambar === 0 ? '' : formData.jumlahSoalBergambar}
                            onChange={(e) => setFormData({...formData, jumlahSoalBergambar: parseInt(e.target.value) || 0})}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section 5: Tips */}
                <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100 relative overflow-hidden shadow-sm flex flex-col md:flex-row gap-6 justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-blue-600 flex items-center gap-2 mb-2 relative z-10">
                      <Lightbulb size={16} /> Tips Menyusun Kisi-Kisi
                    </h3>
                    <ul className="text-[11px] text-gray-700 space-y-1 pl-4 list-disc relative z-10 leading-tight">
                      <li>Selaraskan dengan CP → ATP → TP</li>
                      <li>Gunakan indikator yang mencerminkan proses berpikir tingkat tinggi (HOTS)</li>
                      <li>Kaitkan soal dengan konteks nyata (meaningful learning)</li>
                      <li>Variasikan level kognitif (tidak hanya mengingat)</li>
                    </ul>
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-red-500 flex items-center gap-2 mb-2 relative z-10">
                      <AlertTriangle size={16} /> Hindari Kesalahan Umum
                    </h3>
                    <ul className="text-[11px] text-gray-700 space-y-1 pl-4 list-disc relative z-10 leading-tight">
                      <li>Indikator hanya pada level mengingat (C1)</li>
                      <li>Tidak mencerminkan pembelajaran kontekstual</li>
                      <li>Soal tidak mengukur pemahaman mendalam</li>
                      <li>Distribusi level kognitif tidak seimbang</li>
                    </ul>
                  </div>
                </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-2">
            <ModelSelector modality="text" label="Model Teks AI" value={selectedModel} onChange={setSelectedModel} disabled={isGenerating} />
            <ModelSelector modality="image" label="Model Gambar AI" value={selectedImageModel} onChange={setSelectedImageModel} disabled={isGenerating} />
          </div>
          
          <div className="flex flex-wrap gap-2 mt-4 w-full">
            <button 
              onClick={saveProgress}
              className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-black rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
              title="Simpan Progress"
            >
              <Save size={18} /> Simpan
            </button>
            <button 
              onClick={resetProgress}
              className="px-4 py-3 bg-red-100 hover:bg-red-200 text-black rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
              title="Reset Data"
            >
              <Trash2 size={18} /> Reset
            </button>
            <button
              onClick={() => generateContent(activeSubTab === 'kisi-kisi' ? 'kisi-kisi' : 'soal')}
              disabled={isGenerating}
              className={`flex-1 py-4 text-white rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 ${
                isGenerating ? 'bg-slate-400' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90'
              }`}
            >
              {isGenerating ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
              Generate {activeSubTab === 'kisi-kisi' ? 'Kisi-kisi' : 'Soal'}
            </button>
          </div>

          {/* Result Section (Bottom Panel) */}
          <div className="w-full flex flex-col h-[800px]">
            <div className="bg-white rounded-t-2xl border-x border-t border-gray-200 p-2 flex gap-2 relative overflow-hidden flex-wrap">
              <button
                onClick={() => setActiveSubTab('kisi-kisi')}
                className={`flex-1 min-w-[120px] py-3 px-2 rounded-xl text-[11px] lg:text-sm font-bold transition-all relative z-10 ${activeSubTab === 'kisi-kisi' ? 'bg-blue-100 text-blue-600 border border-blue-200 shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                Kisi-kisi
              </button>
              <button
                onClick={() => setActiveSubTab('naskah')}
                className={`flex-1 min-w-[120px] py-3 px-2 rounded-xl text-[11px] lg:text-sm font-bold transition-all relative z-10 ${activeSubTab === 'naskah' ? 'bg-indigo-100 text-indigo-600 border border-indigo-200 shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                Naskah Soal
              </button>
              <button
                onClick={() => setActiveSubTab('kunci')}
                className={`flex-1 min-w-[120px] py-3 px-2 rounded-xl text-[11px] lg:text-sm font-bold transition-all relative z-10 ${activeSubTab === 'kunci' ? 'bg-emerald-100 text-emerald-600 border border-emerald-200 shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                Kunci & Bahas
              </button>
              <button
                onClick={() => setActiveSubTab('kartu')}
                className={`flex-1 min-w-[120px] py-3 px-2 rounded-xl text-[11px] lg:text-sm font-bold transition-all relative z-10 ${activeSubTab === 'kartu' ? 'bg-amber-100 text-amber-600 border border-amber-200 shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                Kartu Soal
              </button>
              <button
                onClick={() => { setActiveSubTab('live-quiz'); setLiveQuizIndex(0); setLiveQuizAnswers({}); setLiveQuizFinished(false); }}
                className={`flex-1 min-w-[120px] py-3 px-2 rounded-xl text-[11px] lg:text-sm font-bold transition-all relative z-10 ${activeSubTab === 'live-quiz' ? 'bg-purple-100 text-purple-600 border border-purple-200 shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                Live Quiz
              </button>
            </div>

            <div className="bg-white border border-gray-200 rounded-b-2xl p-6 flex-1 overflow-y-auto relative">
              {error && (
                <div className="mb-4 p-4 bg-red-900/30 text-red-400 rounded-xl text-sm border border-red-900/50 flex items-start gap-3">
                  <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}

              <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6">
                <h2 className="text-lg font-bold text-gray-900 tracking-wide shrink-0">
                  Pratinjau {activeSubTab === 'kisi-kisi' ? 'Kisi-kisi' : activeSubTab === 'naskah' ? 'Naskah Soal' : activeSubTab === 'kunci' ? 'Kunci Jawaban' : 'Kartu Soal'}
                </h2>
                <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 w-full xl:w-auto">
                  {((activeSubTab === 'kisi-kisi' && resultKisiKisi) || (activeSubTab !== 'kisi-kisi' && resultSoal)) && (
                    <button
                      onClick={() => handlePrintClick(activeSubTab as 'kisi-kisi' | 'naskah' | 'kunci' | 'kartu')}
                      className="px-4 py-2 bg-gray-100 text-gray-900 border border-gray-300 rounded-lg text-sm font-bold hover:bg-slate-200 transition-colors flex items-center gap-2"
                    >
                      <Printer size={16} /> Cetak
                    </button>
                  )}
                </div>
              </div>

              {activeSubTab === 'kisi-kisi' && (
                resultKisiKisi ? (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-gray-100 p-4 rounded-xl border border-gray-300">
                      <p className="text-sm font-bold text-blue-600 mb-1 uppercase tracking-wider">Tujuan Pembelajaran:</p>
                      <p className="text-sm text-gray-700">{resultKisiKisi.tujuanPembelajaran}</p>
                    </div>
                    <div className="overflow-x-auto rounded-xl border border-gray-300">
                      <table className="w-full text-sm text-left border-collapse">
                        <thead className="bg-gray-100 text-gray-700">
                          <tr>
                            <th className="border-b border-gray-300 p-3 font-semibold">No</th>
                            <th className="border-b border-gray-300 p-3 font-semibold">Elemen</th>
                            <th className="border-b border-gray-300 p-3 font-semibold">Tujuan Pembelajaran</th>
                            <th className="border-b border-gray-300 p-3 font-semibold">Materi</th>
                            <th className="border-b border-gray-300 p-3 font-semibold text-center">Level Kognitif</th>
                            <th className="border-b border-gray-300 p-3 font-semibold">Indikator Soal</th>
                            <th className="border-b border-gray-300 p-3 font-semibold text-center">Jenis Soal</th>
                            <th className="border-b border-gray-300 p-3 font-semibold text-center">No Soal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {resultKisiKisi.kisiKisi?.map((k: any, i: number) => (
                            <tr key={i} className="hover:bg-gray-100 transition-colors">
                              <td className="p-3 text-center text-gray-600">{i + 1}</td>
                              <td className="p-3 text-gray-700">{k.elemen}</td>
                              <td className="p-3 text-gray-700">{k.tujuanPembelajaran}</td>
                              <td className="p-3 text-gray-700">{k.materi}</td>
                              <td className="p-3 text-center text-blue-600 font-medium">{k.levelKognitif}</td>
                              <td className="p-3 text-gray-700">{k.indikatorSoal}</td>
                              <td className="p-3 text-center text-indigo-600 font-medium">{k.jenisSoal}</td>
                              <td className="p-3 text-center text-gray-600">{k.noSoal}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-500">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4 border border-gray-300">
                      <List size={32} className="text-slate-600" />
                    </div>
                    <p className="text-sm">Klik Generate untuk membuat Kisi-kisi Soal</p>
                  </div>
                )
              )}

              {activeSubTab === 'naskah' && (
                resultSoal && resultSoal.soalList ? (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h3 className="font-bold text-indigo-600 text-lg border-b border-indigo-200 pb-2 mb-4 mt-8">A. NASKAH SOAL (REGULER)</h3>
                    {resultSoal.soalList.map((s: any, i: number) => (
                      <div key={i} className="p-5 border border-gray-200 bg-gray-100/30 rounded-xl animate-in fade-in duration-200">
                        <p className="font-medium text-gray-900 mb-4 flex gap-3">
                          <span className="text-gray-500 shrink-0">{s.no}.</span>
                          <span className="whitespace-pre-wrap">{s.pertanyaan}</span>
                        </p>

                        {s.gambarDeskripsi && (
                          <div className="pl-8 mb-4">
                            {s.gambarUrl ? (
                              <div className="relative group max-w-xs">
                                <img src={s.gambarUrl} alt={`Soal ${s.no}`} className="w-full h-auto rounded-lg border border-gray-300 shadow-sm bg-white" />
                                <button 
                                  onClick={() => handleGenerateImageForQuestion(i, s.gambarDeskripsi, false)}
                                  disabled={generatingImageIndex?.index === i && !generatingImageIndex?.isABK}
                                  className="absolute top-2 right-2 bg-black/60 hover:bg-black text-white p-1.5 rounded-full text-xs font-bold transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center min-w-[28px] min-h-[28px]"
                                  title="Regenerate Gambar"
                                >
                                  {generatingImageIndex?.index === i && !generatingImageIndex?.isABK ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                                  ) : (
                                    <span>🔄</span>
                                  )}
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleGenerateImageForQuestion(i, s.gambarDeskripsi, false)}
                                disabled={generatingImageIndex?.index === i && !generatingImageIndex?.isABK}
                                className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
                              >
                                {generatingImageIndex?.index === i && !generatingImageIndex?.isABK ? (
                                  <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    <span>Memproses...</span>
                                  </>
                                ) : (
                                  <>
                                    <span>🎨 Generate Gambar Ilustrasi</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        )}
                        
                        {s.opsiTambahan && s.opsiTambahan.length > 0 && (
                          <div className="pl-8 space-y-2">
                            {s.opsiTambahan.map((o: string, j: number) => (
                              <div key={j} className="text-sm text-gray-600">{o}</div>
                            ))}
                          </div>
                        )}
                        
                        {s.pasanganMenjodohkan && s.pasanganMenjodohkan.length > 0 && (
                          <div className="pl-8 mt-2">
                            <table className="w-full max-w-md text-sm text-gray-700">
                              <tbody>
                                {s.pasanganMenjodohkan.map((p: any, idx: number) => (
                                  <tr key={idx}>
                                    <td className="py-1">{p.kiri}</td>
                                    <td className="py-1 text-center w-8">...</td>
                                    <td className="py-1">{p.kanan}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                        <div className="mt-4 flex justify-end">
                          <span className="text-xs bg-gray-100 border border-gray-300 px-2 py-1 rounded text-gray-500">{s.jenisSoal}</span>
                        </div>
                      </div>
                    ))}

                    {resultSoal.soalABKList && resultSoal.soalABKList.length > 0 && (
                      <div className="mt-12 pt-8 border-t border-gray-300">
                        <h3 className="font-bold text-blue-600 text-lg border-b border-blue-200 pb-2 mb-4">NASKAH SOAL - ADAPTASI INKLUSI (ABK)</h3>
                        {resultSoal.soalABKList.map((s: any, i: number) => (
                          <div key={i} className="p-5 border border-blue-200 bg-blue-50 rounded-xl mb-6 animate-in fade-in duration-200">
                            <p className="font-medium text-gray-900 mb-4 flex gap-3">
                              <span className="text-blue-600 shrink-0">{s.no}.</span>
                              <span className="whitespace-pre-wrap">{s.pertanyaan}</span>
                            </p>

                            {s.gambarDeskripsi && (
                              <div className="pl-8 mb-4">
                                {s.gambarUrl ? (
                                  <div className="relative group max-w-xs">
                                    <img src={s.gambarUrl} alt={`Soal ABK ${s.no}`} className="w-full h-auto rounded-lg border border-gray-300 shadow-sm bg-white" />
                                    <button 
                                      onClick={() => handleGenerateImageForQuestion(i, s.gambarDeskripsi, true)}
                                      disabled={generatingImageIndex?.index === i && generatingImageIndex?.isABK}
                                      className="absolute top-2 right-2 bg-black/60 hover:bg-black text-white p-1.5 rounded-full text-xs font-bold transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center min-w-[28px] min-h-[28px]"
                                      title="Regenerate Gambar"
                                    >
                                      {generatingImageIndex?.index === i && generatingImageIndex?.isABK ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                                      ) : (
                                        <span>🔄</span>
                                      )}
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => handleGenerateImageForQuestion(i, s.gambarDeskripsi, true)}
                                    disabled={generatingImageIndex?.index === i && generatingImageIndex?.isABK}
                                    className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
                                  >
                                    {generatingImageIndex?.index === i && generatingImageIndex?.isABK ? (
                                      <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        <span>Memproses...</span>
                                      </>
                                    ) : (
                                      <>
                                        <span>🎨 Generate Gambar Ilustrasi</span>
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>
                            )}
                            
                            {s.opsiTambahan && s.opsiTambahan.length > 0 && (
                              <div className="pl-8 space-y-2">
                                {s.opsiTambahan.map((o: string, j: number) => (
                                  <div key={j} className="text-sm text-gray-600">{o}</div>
                                ))}
                              </div>
                            )}
                            
                            {s.pasanganMenjodohkan && s.pasanganMenjodohkan.length > 0 && (
                              <div className="pl-8 mt-2">
                                <table className="w-full max-w-md text-sm text-gray-700">
                                  <tbody>
                                    {s.pasanganMenjodohkan.map((p: any, idx: number) => (
                                      <tr key={idx}>
                                        <td className="py-1">{p.kiri}</td>
                                        <td className="py-1 text-center w-8">...</td>
                                        <td className="py-1">{p.kanan}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                            <div className="mt-4 flex justify-end">
                              <span className="text-xs bg-gray-100 border border-blue-200 px-2 py-1 rounded text-blue-500">{s.jenisSoal}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-500">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4 border border-gray-300">
                      <List size={32} className="text-slate-600" />
                    </div>
                    <p className="text-sm">Klik Generate untuk membuat Soal</p>
                  </div>
                )
              )}

              {activeSubTab === 'kunci' && (
                resultSoal && resultSoal.soalList ? (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h3 className="font-bold text-emerald-600 text-lg border-b border-emerald-500/30 pb-2 mb-4 mt-8">B. KUNCI JAWABAN & PEMBAHASAN (REGULER)</h3>
                    {resultSoal.soalList.map((s: any, i: number) => (
                      <div key={i} className="p-5 border border-gray-200 bg-gray-100/30 rounded-xl mb-6">
                        <div className="mb-3 text-sm text-gray-600"><strong>Soal No. {s.no}</strong> ({s.jenisSoal})</div>
                        <p className="text-gray-700 mb-4 italic pl-4 border-l-2 border-gray-300 line-clamp-2">{s.pertanyaan}</p>
                        
                        {s.gambarDeskripsi && (
                          <div className="pl-4 mb-4">
                            {s.gambarUrl ? (
                              <div className="relative group max-w-[200px]">
                                <img src={s.gambarUrl} alt={`Soal ${s.no}`} className="w-full h-auto rounded-lg border border-gray-300 shadow-sm bg-white" />
                                <button 
                                  onClick={() => handleGenerateImageForQuestion(i, s.gambarDeskripsi, false)}
                                  disabled={generatingImageIndex?.index === i && !generatingImageIndex?.isABK}
                                  className="absolute top-2 right-2 bg-black/60 hover:bg-black text-white p-1.5 rounded-full text-xs font-bold transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center min-w-[28px] min-h-[28px]"
                                  title="Regenerate Gambar"
                                >
                                  {generatingImageIndex?.index === i && !generatingImageIndex?.isABK ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                                  ) : (
                                    <span>🔄</span>
                                  )}
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleGenerateImageForQuestion(i, s.gambarDeskripsi, false)}
                                disabled={generatingImageIndex?.index === i && !generatingImageIndex?.isABK}
                                className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
                              >
                                {generatingImageIndex?.index === i && !generatingImageIndex?.isABK ? (
                                  <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    <span>Memproses...</span>
                                  </>
                                ) : (
                                  <>
                                    <span>🎨 Generate Gambar Ilustrasi</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        )}
                        
                        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-lg">
                          <div className="flex gap-2">
                            <span className="text-emerald-700 font-bold shrink-0">Kunci:</span>
                            <div className="text-emerald-900 whitespace-pre-wrap flex-1 leading-relaxed">{s.kunci}</div>
                          </div>
                          
                          {s.pembahasan && (
                            <div className="mt-3 text-sm">
                              <span className="text-gray-700 font-bold block mb-1">Pembahasan:</span>
                              <div className="text-gray-800 whitespace-pre-wrap leading-relaxed">{s.pembahasan}</div>
                            </div>
                          )}
                          
                          <div className="mt-3 text-xs flex justify-end">
                            <span className="bg-emerald-100 px-2 py-1 rounded text-emerald-700 font-medium">Skor: {s.skor}</span>
                          </div>
                        </div>
                      </div>
                    ))}

                    {resultSoal.soalABKList && resultSoal.soalABKList.length > 0 && (
                      <div className="mt-12 pt-8 border-t border-gray-300">
                        <h3 className="font-bold text-blue-600 text-lg border-b border-blue-200 pb-2 mb-4">KUNCI JAWABAN & PEMBAHASAN (INKLUSI / ABK)</h3>
                        {resultSoal.soalABKList.map((s: any, i: number) => (
                          <div key={i} className="p-5 border border-blue-200 bg-blue-50 rounded-xl mb-6">
                            <div className="mb-3 text-sm text-blue-500"><strong>Soal No. {s.no}</strong> ({s.jenisSoal})</div>
                            <p className="text-gray-700 mb-4 italic pl-4 border-l-2 border-blue-200 line-clamp-2">{s.pertanyaan}</p>
                            
                            {s.gambarDeskripsi && (
                              <div className="pl-4 mb-4">
                                {s.gambarUrl ? (
                                  <div className="relative group max-w-[200px]">
                                    <img src={s.gambarUrl} alt={`Soal ABK ${s.no}`} className="w-full h-auto rounded-lg border border-gray-300 shadow-sm bg-white" />
                                    <button 
                                      onClick={() => handleGenerateImageForQuestion(i, s.gambarDeskripsi, true)}
                                      disabled={generatingImageIndex?.index === i && generatingImageIndex?.isABK}
                                      className="absolute top-2 right-2 bg-black/60 hover:bg-black text-white p-1.5 rounded-full text-xs font-bold transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center min-w-[28px] min-h-[28px]"
                                      title="Regenerate Gambar"
                                    >
                                      {generatingImageIndex?.index === i && generatingImageIndex?.isABK ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                                      ) : (
                                        <span>🔄</span>
                                      )}
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => handleGenerateImageForQuestion(i, s.gambarDeskripsi, true)}
                                    disabled={generatingImageIndex?.index === i && generatingImageIndex?.isABK}
                                    className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
                                  >
                                    {generatingImageIndex?.index === i && generatingImageIndex?.isABK ? (
                                      <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        <span>Memproses...</span>
                                      </>
                                    ) : (
                                      <>
                                        <span>🎨 Generate Gambar Ilustrasi</span>
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>
                            )}
                            
                            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-lg">
                              <div className="flex gap-2">
                                <span className="text-emerald-700 font-bold shrink-0">Kunci:</span>
                                <div className="text-emerald-900 whitespace-pre-wrap flex-1 leading-relaxed">{s.kunci}</div>
                              </div>
                              
                              {s.pembahasan && (
                                <div className="mt-3 text-sm">
                                  <span className="text-gray-700 font-bold block mb-1">Pembahasan:</span>
                                  <div className="text-gray-800 whitespace-pre-wrap leading-relaxed">{s.pembahasan}</div>
                                </div>
                              )}
                              
                              <div className="mt-3 text-xs flex justify-end">
                                <span className="bg-emerald-100 px-2 py-1 rounded text-emerald-700 font-medium">Skor: {s.skor}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-500">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4 border border-gray-300">
                      <List size={32} className="text-slate-600" />
                    </div>
                    <p className="text-sm">Klik Generate untuk melihat Kunci & Pembahasan</p>
                  </div>
                )
              )}

              {activeSubTab === 'kartu' && (
                resultSoal && resultSoal.soalList ? (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h3 className="font-bold text-amber-600 text-lg border-b border-amber-500/30 pb-2 mb-4 mt-8">C. KARTU SOAL (REGULER)</h3>
                    {resultSoal.soalList.map((s: any, i: number) => (
                      <details key={i} className="p-0 border border-gray-300 bg-gray-50 rounded-xl overflow-hidden mb-8 shadow-lg group" open>
                         <summary className="bg-gray-100 border-b border-gray-300 p-4 text-center font-bold text-gray-900 tracking-wider flex justify-between items-center cursor-pointer list-none">
                           <span>KARTU SOAL NOMOR {s.no}</span>
                           <div className="flex items-center gap-3">
                             <span className="bg-amber-500 text-slate-900 px-2 py-0.5 rounded text-xs">Level: {s.levelKognitif}</span>
                             <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" />
                           </div>
                         </summary>
                         <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-200">
                           <div className="p-4 space-y-4 md:col-span-1 text-sm">
                             <div>
                               <div className="text-[10px] text-gray-500 font-bold uppercase mb-1">Mata Pelajaran</div>
                               <div className="text-gray-700">{resultSoal.meta?.mapelLabel} / Kelas {resultSoal.meta?.kelas}</div>
                             </div>
                             <div>
                               <div className="text-[10px] text-gray-500 font-bold uppercase mb-1">Materi</div>
                               <div className="text-gray-700">{s.materi}</div>
                             </div>
                             <div>
                               <div className="text-[10px] text-gray-500 font-bold uppercase mb-1">Indikator Soal</div>
                               <div className="text-gray-700">{s.indikatorSoal}</div>
                             </div>
                           </div>
                           
                           <div className="p-4 md:col-span-2 flex flex-col">
                             <div className="text-[10px] text-gray-500 font-bold uppercase mb-2">Buku Sumber / Rumusan Soal:</div>
                             <div className="text-gray-900 mb-4 flex-1 whitespace-pre-wrap">{s.pertanyaan}</div>
                             
                             {s.opsiTambahan && s.opsiTambahan.length > 0 && (
                               <div className="space-y-1 mb-4 text-sm text-gray-700">
                                 {s.opsiTambahan.map((o: string, j: number) => (
                                   <div key={j}>{o}</div>
                                 ))}
                               </div>
                             )}

                             {s.pasanganMenjodohkan && s.pasanganMenjodohkan.length > 0 && (
                               <div className="pl-8 mb-4">
                                 <table className="w-full text-sm text-gray-700">
                                   <tbody>
                                     {s.pasanganMenjodohkan.map((p: any, idx: number) => (
                                       <tr key={idx}>
                                         <td className="py-1">{p.kiri}</td>
                                         <td className="py-1 text-center w-8">...</td>
                                         <td className="py-1">{p.kanan}</td>
                                       </tr>
                                     ))}
                                   </tbody>
                                 </table>
                               </div>
                             )}

                             <div className="pt-4 mt-auto border-t border-gray-300 grid grid-cols-2 gap-4">
                               <div>
                                 <div className="text-[10px] text-emerald-500 font-bold uppercase mb-1">Kunci Jawaban</div>
                                 <div className="text-emerald-600 font-medium text-sm whitespace-pre-wrap">{s.kunci}</div>
                               </div>
                               <div>
                                 <div className="text-[10px] text-blue-600 font-bold uppercase mb-1">Jenis & Skor</div>
                                 <div className="text-blue-600 text-sm">{s.jenisSoal} | Skor: {s.skor}</div>
                               </div>
                             </div>
                           </div>
                         </div>
                      </details>
                    ))}

                    {resultSoal.soalABKList && resultSoal.soalABKList.length > 0 && (
                      <div className="mt-12 pt-8 border-t border-gray-300">
                        <h3 className="font-bold text-blue-600 text-lg border-b border-blue-200 pb-2 mb-4">KARTU SOAL - ADAPTASI INKLUSI (ABK)</h3>
                        {resultSoal.soalABKList.map((s: any, i: number) => (
                          <details key={i} className="p-0 border border-blue-200 bg-gray-50 rounded-xl overflow-hidden mb-8 shadow-lg shadow-sm group" open>
                             <summary className="bg-gray-100 border-b border-blue-200 p-4 text-center font-bold text-gray-900 tracking-wider flex justify-between items-center cursor-pointer list-none">
                               <span className="text-blue-600">KARTU SOAL NOMOR {s.no} (ABK)</span>
                               <div className="flex items-center gap-3">
                                 <span className="bg-blue-600 text-white px-2 py-0.5 rounded text-xs">Level: {s.levelKognitif}</span>
                                 <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" />
                               </div>
                             </summary>
                             <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-200">
                               <div className="p-4 space-y-4 md:col-span-1 text-sm bg-blue-50">
                                 <div>
                                   <div className="text-[10px] text-gray-500 font-bold uppercase mb-1">Mata Pelajaran</div>
                                   <div className="text-gray-700">{resultSoal.meta?.mapelLabel} / Kelas {resultSoal.meta?.kelas}</div>
                                 </div>
                                 <div>
                                   <div className="text-[10px] text-gray-500 font-bold uppercase mb-1">Materi</div>
                                   <div className="text-gray-700">{s.materi}</div>
                                 </div>
                                 <div>
                                   <div className="text-[10px] text-gray-500 font-bold uppercase mb-1">Indikator Soal</div>
                                   <div className="text-gray-700">{s.indikatorSoal}</div>
                                 </div>
                               </div>
                               
                               <div className="p-4 md:col-span-2 flex flex-col">
                                 <div className="text-[10px] text-gray-500 font-bold uppercase mb-2">Buku Sumber / Rumusan Soal:</div>
                                 <div className="text-gray-900 mb-4 flex-1 whitespace-pre-wrap">{s.pertanyaan}</div>
                                 
                                 {s.gambarDeskripsi && (
                                   <div className="mb-4">
                                     {s.gambarUrl ? (
                                       <div className="relative group max-w-xs">
                                         <img src={s.gambarUrl} alt={`Soal ABK ${s.no}`} className="w-full h-auto rounded-lg border border-gray-300 shadow-sm bg-white" />
                                         <button 
                                           onClick={() => handleGenerateImageForQuestion(i, s.gambarDeskripsi, true)}
                                           disabled={generatingImageIndex?.index === i && generatingImageIndex?.isABK}
                                           className="absolute top-2 right-2 bg-black/60 hover:bg-black text-white p-1.5 rounded-full text-xs font-bold transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center min-w-[28px] min-h-[28px]"
                                           title="Regenerate Gambar"
                                         >
                                           {generatingImageIndex?.index === i && generatingImageIndex?.isABK ? (
                                             <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                                           ) : (
                                             <span>🔄</span>
                                           )}
                                         </button>
                                       </div>
                                     ) : (
                                       <button
                                         onClick={() => handleGenerateImageForQuestion(i, s.gambarDeskripsi, true)}
                                         disabled={generatingImageIndex?.index === i && generatingImageIndex?.isABK}
                                         className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
                                       >
                                         {generatingImageIndex?.index === i && generatingImageIndex?.isABK ? (
                                           <>
                                             <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                             <span>Memproses...</span>
                                           </>
                                         ) : (
                                           <>
                                             <span>🎨 Generate Gambar Ilustrasi</span>
                                           </>
                                         )}
                                       </button>
                                     )}
                                   </div>
                                 )}
                                 
                                 {s.opsiTambahan && s.opsiTambahan.length > 0 && (
                                   <div className="space-y-1 mb-4 text-sm text-gray-700">
                                     {s.opsiTambahan.map((o: string, j: number) => (
                                       <div key={j}>{o}</div>
                                     ))}
                                   </div>
                                 )}
    
                                 {s.pasanganMenjodohkan && s.pasanganMenjodohkan.length > 0 && (
                                   <div className="pl-8 mb-4">
                                     <table className="w-full text-sm text-gray-700">
                                       <tbody>
                                         {s.pasanganMenjodohkan.map((p: any, idx: number) => (
                                           <tr key={idx}>
                                             <td className="py-1">{p.kiri}</td>
                                             <td className="py-1 text-center w-8">...</td>
                                             <td className="py-1">{p.kanan}</td>
                                           </tr>
                                         ))}
                                       </tbody>
                                     </table>
                                   </div>
                                 )}
    
                                 <div className="pt-4 mt-auto border-t border-gray-300 grid grid-cols-2 gap-4">
                                   <div>
                                     <div className="text-[10px] text-emerald-500 font-bold uppercase mb-1">Kunci Jawaban</div>
                                     <div className="text-emerald-600 font-medium text-sm whitespace-pre-wrap">{s.kunci}</div>
                                   </div>
                                   <div>
                                     <div className="text-[10px] text-blue-600 font-bold uppercase mb-1">Jenis & Skor</div>
                                     <div className="text-blue-600 text-sm">{s.jenisSoal} | Skor: {s.skor}</div>
                                   </div>
                                 </div>
                               </div>
                             </div>
                          </details>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-500">
                     <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4 border border-gray-300">
                      <List size={32} className="text-slate-600" />
                    </div>
                    <p className="text-sm">Klik Generate untuk membuat Kartu Soal</p>
                  </div>
                )
              )}

              {activeSubTab === 'live-quiz' && (
                resultSoal?.soalList ? (
                  <div className="h-full flex flex-col p-4 animate-in fade-in zoom-in-95 duration-300">
                    {!liveQuizFinished ? (
                      <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 p-6 overflow-y-auto relative">
                        <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
                          <h3 className="font-bold text-xl text-purple-700 flex items-center gap-2"><Sparkles className="w-5 h-5"/> Live Quiz</h3>
                          <span className="bg-purple-100 text-purple-800 text-sm font-bold px-3 py-1 rounded-full">Soal {liveQuizIndex + 1} dari {resultSoal.soalList.length}</span>
                        </div>
                        <div className="mb-6 flex-1">
                          <div className="flex items-start gap-4">
                            <div className="bg-purple-100 text-purple-800 font-bold w-10 h-10 flex items-center justify-center rounded-lg flex-shrink-0 text-xl">{liveQuizIndex + 1}</div>
                            <div className="flex-1">
                              {resultSoal.soalList[liveQuizIndex].gambarUrl && (
                                <img src={resultSoal.soalList[liveQuizIndex].gambarUrl} alt="Ilustrasi" className="mb-4 max-w-sm w-full object-contain rounded border border-gray-200" />
                              )}
                              <p className="text-lg text-gray-800 mb-6 whitespace-pre-wrap">{resultSoal.soalList[liveQuizIndex].pertanyaan}</p>
                              
                              {resultSoal.soalList[liveQuizIndex].opsiTambahan && resultSoal.soalList[liveQuizIndex].opsiTambahan.length > 0 && (
                                <div className="space-y-3">
                                  {resultSoal.soalList[liveQuizIndex].opsiTambahan.map((opt: string, i: number) => {
                                    const optionLetter = opt.substring(0, 2).trim(); // e.g. "A."
                                    const isSelected = liveQuizAnswers[liveQuizIndex] === optionLetter;
                                    return (
                                      <button
                                        key={i}
                                        onClick={() => setLiveQuizAnswers({...liveQuizAnswers, [liveQuizIndex]: optionLetter})}
                                        className={`w-full text-left p-4 rounded-xl border-2 transition-all group ${isSelected ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/50'}`}
                                      >
                                        <div className="flex items-center gap-3">
                                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'border-purple-500 bg-purple-500' : 'border-gray-300 group-hover:border-purple-400'}`}>
                                            {isSelected && <div className="w-2.5 h-2.5 bg-white rounded-full"></div>}
                                          </div>
                                          <span className={`${isSelected ? 'text-purple-900 font-medium' : 'text-gray-700'}`}>{opt}</span>
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-between mt-auto pt-4 border-t border-gray-200 bg-white sticky bottom-0">
                          <button
                            onClick={() => setLiveQuizIndex(Math.max(0, liveQuizIndex - 1))}
                            disabled={liveQuizIndex === 0}
                            className="px-6 py-2.5 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 transition-colors"
                          >
                            Sebelumnya
                          </button>
                          {liveQuizIndex < resultSoal.soalList.length - 1 ? (
                            <button
                              onClick={() => setLiveQuizIndex(liveQuizIndex + 1)}
                              className="px-6 py-2.5 rounded-xl font-bold bg-purple-600 text-white hover:bg-purple-700 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                            >
                              Selanjutnya
                            </button>
                          ) : (
                            <button
                              onClick={() => setLiveQuizFinished(true)}
                              className="px-6 py-2.5 rounded-xl font-bold bg-green-600 text-white hover:bg-green-700 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                            >
                              Selesai
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center animate-in zoom-in-95 duration-500">
                        <div className="w-28 h-28 bg-green-100 rounded-full flex items-center justify-center mb-6">
                          <CheckCircle size={56} className="text-green-600" />
                        </div>
                        <h2 className="text-4xl font-black text-gray-800 mb-3 tracking-tight">Quiz Selesai!</h2>
                        <p className="text-gray-600 mb-8 max-w-md text-lg">Anda telah menyelesaikan kuis ini. (Penilaian otomatis memerlukan integrasi validasi kunci lebih lanjut).</p>
                        <button
                          onClick={() => { setLiveQuizIndex(0); setLiveQuizAnswers({}); setLiveQuizFinished(false); }}
                          className="px-8 py-3.5 rounded-xl font-bold bg-purple-600 text-white hover:bg-purple-700 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
                        >
                          Coba Lagi
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-500 animate-in fade-in">
                    <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mb-4 border border-purple-100">
                      <Sparkles size={32} className="text-purple-400" />
                    </div>
                    <p className="text-sm font-medium">Klik Generate untuk memulai Live Quiz</p>
                  </div>
                )
              )}

            </div>
          </div>

        </div>
      </div>
      <PrintSupportModal 
        isOpen={showPrintModal} 
        onClose={() => setShowPrintModal(false)}
        onConfirm={() => {
          setShowPrintModal(false);
          if (printTypeToProceed) executePrint(printTypeToProceed);
        }}
      />
    </div>
  );
}
