import React, { useState, useEffect } from 'react';
import ModelSelector from '@/components/ModelSelector';
import { GoogleGenAI, Type } from '@/lib/genai';
import { educationLevels, phaseClassMap, subjectsByLevel } from '@/lib/constants';
import { Loader2, FileCheck, List, Printer, Trash2, Info, Lightbulb, CheckCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getWatermarkHtml, createPrintWindow } from '@/lib/print';
import PrintSupportModal from '@/components/PrintSupportModal';
import AIAssistedInput from '@/components/AIAssistedInput';
import AIAssistedTextarea from '@/components/AIAssistedTextarea';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import PDFRemixUpload from '@/components/PDFRemixUpload';

export default function RubrikPenilaian() {
  const { consumeToken } = useAuth();
  const { profile } = useAuth();
  const [selectedModel, setSelectedModel] = useState<string>('openai');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [error, setError] = useState('');
  
  const jenisAsesmenList = [
    'Formatif (Observasi/Tanya Jawab)',
    'Sumatif (Tes Tertulis/Lisan)',
    'Praktik / Kinerja',
    'Proyek',
    'Portofolio',
    'Sikap / Observasi Karakter'
  ];

  const skalaList = [
    '1 - 4 (Mulai, Sedang, Sesuai Harapan, Sangat)',
    'Kurang, Cukup, Baik, Sangat Baik',
    'Belum Berkembang, Mulai Berkembang, Berkembang, Membudaya'
  ];

  const [formData, setFormData] = useLocalStorage<{
    jenjang: string;
    fase: string;
    kelas: string;
    mapel: string;
    jenisAsesmen: string;
    skala: string;
    tujuanPembelajaran: string;
  }>('RubrikPenilaianData', {
    jenjang: '',
    fase: '',
    kelas: '',
    mapel: '',
    jenisAsesmen: jenisAsesmenList[0],
    skala: skalaList[0],
    tujuanPembelajaran: ''
  });

  const [result, setResult] = useState<any>(null);

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
      const subjects = subjectsByLevel[formData.jenjang] || [];
      if (!subjects.find(s => s.id === formData.mapel)) {
        setFormData(prev => ({ ...prev, mapel: subjects[0]?.id || '' }));
      }
    }
  }, [formData.jenjang, formData.fase]);

  const generateContent = async () => {
    if (!formData.tujuanPembelajaran) {
      setError('Tujuan Pembelajaran atau Materi harus diisi!');
      return;
    }
    
    setIsGenerating(true);
    const canGenerate = await consumeToken();
    if (!canGenerate) {
      setIsGenerating(false);
      return;
    }
setError('');
    
    try {
      const ai = new GoogleGenAI({});
      const jenjangLabel = educationLevels.find(l => l.id === formData.jenjang)?.label || formData.jenjang;
      const mapelLabel = subjectsByLevel[formData.jenjang]?.find(s => s.id === formData.mapel)?.label || formData.mapel;

      const prompt = `Buatkan Rubrik Penilaian & Asesmen Kurikulum Merdeka dengan spesifikasi:
Mata Pelajaran: ${mapelLabel}
Jenjang: ${jenjangLabel}
Fase/Kelas: ${formData.fase} / ${formData.kelas}
Jenis Asesmen: ${formData.jenisAsesmen}
Skala Penilaian: ${formData.skala}
Tujuan Pembelajaran / Materi: ${formData.tujuanPembelajaran}

Tugas Anda:
1. Buatkan penjelasan singkat tentang instrumen penilaian ini.
2. Buatkan minimal 3 s.d 5 kriteria utama (aspek yang dinilai) yang sangat relevan dengan tujuan pembelajaran tersebut.
3. Buatkan rubrik penilaian yang sangat detail untuk setiap kriteria berdasarkan skala: ${formData.skala}. Deskripsikan tingkah laku atau kompetensi konkret di setiap skala.
4. Buatkan format Lembar Observasi (kosong) dengan 3 contoh baris kosong agar guru tinggal mengisi nama siswa dan centang.

Format output JSON murni:
{
  "judulInstrumen": "...",
  "deskripsiInstrumen": "...",
  "kriteriaUtama": [
    {
      "aspek": "...",
      "skor1": "...",
      "skor2": "...",
      "skor3": "...",
      "skor4": "..."
    }
  ],
  "lembarObservasi": {
    "headerKolom": ["Nama Siswa", "Aspek 1", "Aspek 2", "Aspek 3", "Catatan/Tindak Lanjut"],
    "barisContoh": [
      {"nama": "", "nilai": ["", "", ""], "catatan": ""},
      {"nama": "", "nilai": ["", "", ""], "catatan": ""}
    ]
  }
}
Catatan: skor1 sampai skor4 merepresentasikan level dari paling rendah ke paling tinggi sesuai skala yang dipilih. Jika skala hanya 3, kosongkan skor4.
`;

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          judulInstrumen: { type: Type.STRING },
          deskripsiInstrumen: { type: Type.STRING },
          kriteriaUtama: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                aspek: { type: Type.STRING },
                skor1: { type: Type.STRING },
                skor2: { type: Type.STRING },
                skor3: { type: Type.STRING },
                skor4: { type: Type.STRING }
              }
            }
          },
          lembarObservasi: {
            type: Type.OBJECT,
            properties: {
              headerKolom: { type: Type.ARRAY, items: { type: Type.STRING } },
              barisContoh: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    nama: { type: Type.STRING },
                    nilai: { type: Type.ARRAY, items: { type: Type.STRING } },
                    catatan: { type: Type.STRING }
                  }
                }
              }
            }
          }
        }
      };

      const response = await ai.models.generateContent({
        model: selectedModel,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
        }
      });

      let responseText = response.text || '{}';
      responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      const generatedData = JSON.parse(responseText);
      setResult({ ...generatedData, meta: { mapelLabel, jenjangLabel, ...formData } });

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Terjadi kesalahan saat menghasilkan konten.');
    } finally {
      setIsGenerating(false);
    }
  };

  const resetProgress = () => {
    if (confirm('Apakah Anda yakin ingin mereset semua data di halaman ini?')) {
      localStorage.removeItem('RubrikPenilaianData');
      window.location.reload();
    }
  };

  const executePrint = () => {
    const printWindow = createPrintWindow();
    if (!printWindow) return;

    if (!result) return;
    const { meta, judulInstrumen, deskripsiInstrumen, kriteriaUtama, lembarObservasi } = result;

    const scaleLabels = meta.skala.split(',').map((s: string) => s.trim().replace(/[\(\)]/g, ''));
    let headerSkor = ['Skor 1', 'Skor 2', 'Skor 3', 'Skor 4'];
    
    // Attempt to extract better labels from the selected scale string
    if (meta.skala.includes('1 - 4')) {
      headerSkor = ['Mulai (1)', 'Sedang (2)', 'Sesuai Harapan (3)', 'Sangat (4)'];
    } else if (meta.skala.includes('Kurang, Cukup')) {
      headerSkor = ['Kurang', 'Cukup', 'Baik', 'Sangat Baik'];
    } else if (meta.skala.includes('Belum Berkembang')) {
      headerSkor = ['Belum Berkembang', 'Mulai Berkembang', 'Berkembang', 'Membudaya'];
    }

    const content = `
      <h2>${judulInstrumen}</h2>
      <div style="margin-bottom: 20px;">
        <table style="width: 100%; border: none;">
          <tr><td style="width: 150px; border: none; padding: 2px;">Mata Pelajaran</td><td style="border: none; padding: 2px;">: ${meta.mapelLabel}</td></tr>
          <tr><td style="border: none; padding: 2px;">Kelas/Semester</td><td style="border: none; padding: 2px;">: ${meta.kelas} / ${meta.fase}</td></tr>
          <tr><td style="border: none; padding: 2px;">Jenis Asesmen</td><td style="border: none; padding: 2px;">: ${meta.jenisAsesmen}</td></tr>
          <tr><td style="border: none; padding: 2px; vertical-align: top;">Tujuan</td><td style="border: none; padding: 2px;">: ${meta.tujuanPembelajaran}</td></tr>
        </table>
      </div>

      <p style="margin-bottom: 20px; font-style: italic;">${deskripsiInstrumen}</p>

      <h4>A. Rubrik Kriteria Penilaian</h4>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
        <thead>
          <tr>
            <th style="border: 1px solid black; padding: 8px; width: 20%;">Aspek Penilaian</th>
            <th style="border: 1px solid black; padding: 8px; width: 20%;">${headerSkor[0]}</th>
            <th style="border: 1px solid black; padding: 8px; width: 20%;">${headerSkor[1]}</th>
            <th style="border: 1px solid black; padding: 8px; width: 20%;">${headerSkor[2]}</th>
            ${kriteriaUtama[0]?.skor4 ? `<th style="border: 1px solid black; padding: 8px; width: 20%;">${headerSkor[3]}</th>` : ''}
          </tr>
        </thead>
        <tbody>
          ${kriteriaUtama?.map((k: any) => `
            <tr>
              <td style="border: 1px solid black; padding: 8px; font-weight: bold;">${k.aspek}</td>
              <td style="border: 1px solid black; padding: 8px; font-size: 12px;">${k.skor1 || '-'}</td>
              <td style="border: 1px solid black; padding: 8px; font-size: 12px;">${k.skor2 || '-'}</td>
              <td style="border: 1px solid black; padding: 8px; font-size: 12px;">${k.skor3 || '-'}</td>
              ${k.skor4 ? `<td style="border: 1px solid black; padding: 8px; font-size: 12px;">${k.skor4}</td>` : ''}
            </tr>
          `).join('')}
        </tbody>
      </table>

      <h4>B. Lembar Observasi / Penilaian</h4>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr>
            <th style="border: 1px solid black; padding: 8px; width: 5%;">No</th>
            ${lembarObservasi?.headerKolom?.map((h: string) => `<th style="border: 1px solid black; padding: 8px;">${h}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${Array.from({ length: 15 }).map((_, i) => `
            <tr>
              <td style="border: 1px solid black; padding: 8px; text-align: center;">${i + 1}</td>
              ${lembarObservasi?.headerKolom?.map(() => `<td style="border: 1px solid black; padding: 12px;"></td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

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
              <p>Guru Mata Pelajaran</p>
              <br><br><br><br>
              <p style="font-weight: bold; text-decoration: underline;">${profile?.nama || profile?.displayName || '................................'}</p>
              <p>${profile?.jenisNipGuru || 'NIP'}. ${profile?.nip || '................................'}</p>
          </div>
      </div>` : ''}
      
      <div style="margin-top: 30px; border-top: 1px solid #ccc; padding-top: 20px; text-align: center; font-size: 11px; color: #666; page-break-inside: avoid;">
        <p>Dokumen ini dihasilkan secara otomatis oleh <b>Generator Asesmen - Pemuryadi</b></p>
        <p>Maju Pendidikan Indonesia &copy; ${new Date().getFullYear()}</p>
      </div>
    `;

    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]')).map(el => el.outerHTML).join('\n');
    printWindow.document.write(`
      <html>
        <head>
          <title>Cetak Rubrik Penilaian</title>
          <style>
            body { font-family: 'Times New Roman', Times, serif; line-height: 1.5; padding: 2cm; color: black; }
            h2, h3, h4 { text-align: center; margin-bottom: 10px; }
            h4 { text-align: left; margin-top: 20px; }
            .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 100px; color: rgba(0,0,0,0.05); z-index: -1; white-space: nowrap; pointer-events: none; }
            @media print {
              @page { margin: 1cm; }
              body { padding: 0; }
              tr { page-break-inside: avoid; }
            }
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

  return (
    <div className="flex flex-col h-full bg-gray-50 text-gray-900">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 border border-indigo-200 shadow-sm">
            <FileCheck size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-wide">Rubrik & Asesmen</h1>
            <p className="text-sm text-indigo-600">Generator Instrumen Penilaian Kurikulum Merdeka</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6">
        <div className="max-w-7xl mx-auto flex flex-col gap-6">
          
          <div className="w-full flex flex-col gap-4">
            <h2 className="font-bold text-gray-900 flex items-center gap-2 px-1 mb-2">
              <List size={18} className="text-indigo-600" /> Parameter Asesmen
            </h2>
                
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col gap-5">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">Jenjang</label>
                  <select 
                    value={formData.jenjang} 
                    onChange={(e) => setFormData({...formData, jenjang: e.target.value})}
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                  >
                    {educationLevels.map(lvl => (
                      <option key={lvl.id} value={lvl.id}>{lvl.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">Fase</label>
                  <select 
                    value={formData.fase} 
                    onChange={(e) => setFormData({...formData, fase: e.target.value})}
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                  >
                    {formData.jenjang && phaseClassMap[formData.jenjang]?.phases.map(p => (
                      <option key={p.id} value={p.id}>{p.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">Kelas</label>
                  <select 
                    value={formData.kelas} 
                    onChange={(e) => setFormData({...formData, kelas: e.target.value})}
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                  >
                    {formData.jenjang && formData.fase && phaseClassMap[formData.jenjang]?.classes[formData.fase]?.map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">Mata Pelajaran</label>
                  <select 
                    value={formData.mapel} 
                    onChange={(e) => setFormData({...formData, mapel: e.target.value})}
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                  >
                    {formData.jenjang && subjectsByLevel[formData.jenjang]?.map(s => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">Jenis Asesmen</label>
                  <select 
                    value={formData.jenisAsesmen} 
                    onChange={(e) => setFormData({...formData, jenisAsesmen: e.target.value})}
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                  >
                    {jenisAsesmenList.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">Skala Penilaian</label>
                  <select 
                    value={formData.skala} 
                    onChange={(e) => setFormData({...formData, skala: e.target.value})}
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                  >
                    {skalaList.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
                <div className="md:col-span-3">
                  <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">
                    Capaian / Tujuan Pembelajaran / Materi Asesmen <span className="text-red-500">*</span>
                  </label>
                  <AIAssistedTextarea
                    value={formData.tujuanPembelajaran}
                    onValueChange={(val) => setFormData({...formData, tujuanPembelajaran: val})}
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                    placeholder="Contoh: Siswa dapat mendeskripsikan ciri-ciri makhluk hidup melalui observasi lapangan..."
                    contextPrompt={`Bantu saya menyusun Tujuan Pembelajaran (TP) untuk Asesmen ${formData.jenisAsesmen} Mapel ${subjectsByLevel[formData.jenjang]?.find(s => s.id === formData.mapel)?.label || ''} Kelas ${formData.kelas}.`}
                    rows={4}
                  />
                </div>
                <div className="md:col-span-1">
                  <PDFRemixUpload 
                    onTextExtracted={(text) => setFormData({...formData, tujuanPembelajaran: text})}
                    label="Ekstrak dari PDF CP/TP"
                  />
                </div>
              </div>

            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col gap-4">
              <ModelSelector value={selectedModel} onChange={setSelectedModel} />
              
              <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-100">
                <button 
                  onClick={generateContent}
                  disabled={isGenerating}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow"
                >
                  {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <FileCheck size={20} />}
                  {isGenerating ? 'Menyusun Instrumen...' : 'Buat Rubrik & Asesmen'}
                </button>
                <button 
                  onClick={resetProgress}
                  className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-all flex items-center gap-2 border border-gray-200"
                >
                  <Trash2 size={20} /> Reset
                </button>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm flex items-start gap-3">
                  <Info className="shrink-0 mt-0.5" size={16} />
                  <span>{error}</span>
                </div>
              )}
            </div>

          </div>

          {/* Result Section */}
          {result && (
            <div className="w-full flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-gray-900 flex items-center gap-2 px-1">
                  <CheckCircle size={18} className="text-indigo-600" /> Hasil Instrumen Penilaian
                </h2>
                <button 
                  onClick={() => {
                    if (profile?.tier === 'Free') setShowPrintModal(true);
                    else executePrint();
                  }}
                  className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-800 text-sm font-bold rounded-xl shadow-sm border border-gray-200 transition-all flex items-center gap-2"
                >
                  <Printer size={16} /> Cetak / PDF
                </button>
              </div>
              
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-8 prose prose-slate max-w-none prose-h3:text-indigo-700 prose-h4:text-indigo-600">
                  <h2 className="text-center text-xl font-bold mb-2">{result.judulInstrumen}</h2>
                  <p className="text-center text-gray-500 italic mb-6 border-b pb-4">{result.deskripsiInstrumen}</p>
                  
                  <div className="bg-gray-50 p-4 rounded-xl mb-6 text-sm border border-gray-100">
                    <div className="grid grid-cols-2 gap-y-2">
                      <div className="font-semibold text-gray-500">Mata Pelajaran:</div><div className="font-bold">{result.meta.mapelLabel}</div>
                      <div className="font-semibold text-gray-500">Jenjang/Kelas:</div><div>{result.meta.jenjangLabel} - Kelas {result.meta.kelas} (Fase {result.meta.fase})</div>
                      <div className="font-semibold text-gray-500">Jenis Asesmen:</div><div>{result.meta.jenisAsesmen}</div>
                      <div className="font-semibold text-gray-500">Tujuan:</div><div>{result.meta.tujuanPembelajaran}</div>
                    </div>
                  </div>

                  <h4>A. Rubrik Kriteria Penilaian</h4>
                  <div className="overflow-x-auto mb-6">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-indigo-50">
                        <tr>
                          <th className="p-3 border w-1/5">Aspek Penilaian</th>
                          <th className="p-3 border">Skor 1</th>
                          <th className="p-3 border">Skor 2</th>
                          <th className="p-3 border">Skor 3</th>
                          {result.kriteriaUtama[0]?.skor4 && <th className="p-3 border">Skor 4</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {result.kriteriaUtama?.map((k: any, idx: number) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="p-3 border font-bold text-indigo-800">{k.aspek}</td>
                            <td className="p-3 border text-xs text-gray-600">{k.skor1 || '-'}</td>
                            <td className="p-3 border text-xs text-gray-600">{k.skor2 || '-'}</td>
                            <td className="p-3 border text-xs text-gray-600">{k.skor3 || '-'}</td>
                            {k.skor4 && <td className="p-3 border text-xs text-gray-600">{k.skor4}</td>}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <h4>B. Format Lembar Observasi</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-indigo-50">
                        <tr>
                          <th className="p-3 border w-12 text-center">No</th>
                          {result.lembarObservasi?.headerKolom?.map((h: string, idx: number) => (
                            <th key={idx} className="p-3 border">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from({ length: 3 }).map((_, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="p-3 border text-center text-gray-400">{i + 1}</td>
                            {result.lembarObservasi?.headerKolom?.map((_: any, idx: number) => (
                              <td key={idx} className="p-3 border"></td>
                            ))}
                          </tr>
                        ))}
                        <tr>
                          <td colSpan={result.lembarObservasi?.headerKolom?.length + 1} className="p-3 border text-center text-gray-400 italic">
                            ... (Tabel ini akan dibuatkan 15 baris kosong saat dicetak) ...
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                </div>
              </div>
            </div>
          )}

        </div>
      </div>
      
      {showPrintModal && (
        <PrintSupportModal 
          isOpen={showPrintModal}
          onClose={() => setShowPrintModal(false)}
          onConfirm={() => {
            setShowPrintModal(false);
            executePrint();
          }}
        />
      )}
    </div>
  );
}
