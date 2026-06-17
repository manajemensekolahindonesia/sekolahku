import React, { useState, useEffect } from 'react';
import ModelSelector from '@/components/ModelSelector';
import { GoogleGenAI, Type } from '@/lib/genai';
import { educationLevels, phaseClassMap } from '@/lib/constants';
import { Loader2, Star, List, Printer, Trash2, Info, Lightbulb, CheckCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getWatermarkHtml, createPrintWindow } from '@/lib/print';
import PrintSupportModal from '@/components/PrintSupportModal';
import AIAssistedInput from '@/components/AIAssistedInput';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import LogoUploader from '@/components/LogoUploader';

export default function ModulP5() {
  const { consumeToken } = useAuth();
  const { profile } = useAuth();
  const [selectedModel, setSelectedModel] = useState<string>('openai');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [error, setError] = useState('');
  
  const temaP5List = [
    'Gaya Hidup Berkelanjutan',
    'Kearifan Lokal',
    'Bhinneka Tunggal Ika',
    'Bangunlah Jiwa dan Raganya',
    'Suara Demokrasi',
    'Berekayasa dan Berteknologi untuk Membanguan NKRI',
    'Kewirausahaan'
  ];

  const [formData, setFormData] = useLocalStorage<{
    jenjang: string;
    fase: string;
    kelas: string;
    tema: string;
    topik: string;
    alokasiWaktu: string;
  }>('ModulP5Data', {
    jenjang: '',
    fase: '',
    kelas: '',
    tema: temaP5List[0],
    topik: '',
    alokasiWaktu: '120 JP'
  });

  const [useLogo, setUseLogo] = useLocalStorage<boolean>('ModulP5_useLogo', false);
  const [logoUrl, setLogoUrl] = useLocalStorage<string | null>('ModulP5_logoUrl', null);

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
      setFormData(prev => ({ ...prev, fase: firstPhase, kelas: firstClass }));
    } else {
      const classes = phaseClassMap[formData.jenjang]?.classes[formData.fase] || [];
      if (!classes.find(c => c.id === formData.kelas)) {
        setFormData(prev => ({ ...prev, kelas: classes[0]?.id || '' }));
      }
    }
  }, [formData.jenjang, formData.fase]);

  const generateContent = async () => {
    if (!formData.topik) {
      setError('Topik Spesifik Projek harus diisi!');
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

      const prompt = `Pastikan dokumen ini disusun sesuai standar terbaru Kurikulum Merdeka Kemendikbudristek untuk Projek Penguatan Profil Pelajar Pancasila (P5).

Buatkan Rancangan Modul P5 untuk:
Jenjang: ${jenjangLabel}
Fase/Kelas: ${formData.fase} / ${formData.kelas}
Tema P5: ${formData.tema}
Topik Spesifik: ${formData.topik}
Alokasi Waktu: ${formData.alokasiWaktu}

Buatkan elemen yang mendalam:
1. Tujuan umum projek dan relevansi tema dengan sekolah.
2. Dimensi, Elemen, dan Sub-Elemen Pancasila yang disasar (maks 3 Dimensi utama).
3. Alur kegiatan (Tahap Pengenalan, Kontekstualisasi, Aksi, Refleksi/Tindak Lanjut) yang jelas dan aplikatif.
4. Rubrik penilaian P5 dengan kriteria pencapaian (Mulai Berkembang, Sedang Berkembang, Berkembang Sesuai Harapan, Sangat Berkembang).

Format output harus JSON murni:
{
  "judulProjek": "...",
  "tujuanProjek": "...",
  "relevansiTema": "...",
  "dimensi": [
    {
      "nama": "...",
      "elemen": "...",
      "subElemen": "...",
      "targetPencapaian": "..."
    }
  ],
  "alurKegiatan": [
    {
      "tahap": "...",
      "aktivitas": ["...", "..."],
      "keterangan": "..."
    }
  ],
  "rubrikPenilaian": [
    {
      "dimensi": "...",
      "kriteria": [
        { "level": "Mulai Berkembang", "deskripsi": "..." },
        { "level": "Sedang Berkembang", "deskripsi": "..." },
        { "level": "Berkembang Sesuai Harapan", "deskripsi": "..." },
        { "level": "Sangat Berkembang", "deskripsi": "..." }
      ]
    }
  ]
}`;

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          judulProjek: { type: Type.STRING },
          tujuanProjek: { type: Type.STRING },
          relevansiTema: { type: Type.STRING },
          dimensi: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                nama: { type: Type.STRING },
                elemen: { type: Type.STRING },
                subElemen: { type: Type.STRING },
                targetPencapaian: { type: Type.STRING }
              }
            }
          },
          alurKegiatan: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                tahap: { type: Type.STRING },
                aktivitas: { type: Type.ARRAY, items: { type: Type.STRING } },
                keterangan: { type: Type.STRING }
              }
            }
          },
          rubrikPenilaian: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                dimensi: { type: Type.STRING },
                kriteria: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      level: { type: Type.STRING },
                      deskripsi: { type: Type.STRING }
                    }
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
      setResult({ ...generatedData, meta: { jenjangLabel, ...formData } });

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Terjadi kesalahan saat menghasilkan konten.');
    } finally {
      setIsGenerating(false);
    }
  };

  const resetProgress = () => {
    if (confirm('Apakah Anda yakin ingin mereset semua data di halaman ini?')) {
      localStorage.removeItem('ModulP5Data');
      window.location.reload();
    }
  };

  const executePrint = () => {
    const printWindow = createPrintWindow();
    if (!printWindow) return;

    if (!result) return;
    const { meta, judulProjek, tujuanProjek, relevansiTema, dimensi, alurKegiatan, rubrikPenilaian } = result;

    const content = `
      ${useLogo && logoUrl ? `<div style="text-align: center; margin-bottom: 20px;"><img src="${logoUrl}" style="height: 80px; width: auto;" alt="Logo"/></div>` : ''}
      <h2>MODUL PROJEK PENGUATAN PROFIL PELAJAR PANCASILA (P5)</h2>
      <h3 style="margin-top: 5px;">${judulProjek}</h3>
      <div style="margin-bottom: 20px;">
        <table style="width: 100%; border: none;">
          <tr><td style="width: 150px; border: none; padding: 2px;">Jenjang</td><td style="border: none; padding: 2px;">: ${meta.jenjangLabel}</td></tr>
          <tr><td style="border: none; padding: 2px;">Kelas/Fase</td><td style="border: none; padding: 2px;">: ${meta.kelas} / ${meta.fase}</td></tr>
          <tr><td style="border: none; padding: 2px;">Tema Projek</td><td style="border: none; padding: 2px;">: ${meta.tema}</td></tr>
          <tr><td style="border: none; padding: 2px;">Topik Spesifik</td><td style="border: none; padding: 2px;">: ${meta.topik}</td></tr>
          <tr><td style="border: none; padding: 2px;">Alokasi Waktu</td><td style="border: none; padding: 2px;">: ${meta.alokasiWaktu}</td></tr>
        </table>
      </div>

      <h4>A. Tujuan & Relevansi Projek</h4>
      <p><strong>Tujuan:</strong> ${tujuanProjek}</p>
      <p><strong>Relevansi Tema:</strong> ${relevansiTema}</p>

      <h4>B. Dimensi, Elemen, dan Sub-Elemen Profil Pelajar Pancasila</h4>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr>
            <th style="border: 1px solid black; padding: 8px;">Dimensi</th>
            <th style="border: 1px solid black; padding: 8px;">Elemen</th>
            <th style="border: 1px solid black; padding: 8px;">Sub-Elemen</th>
            <th style="border: 1px solid black; padding: 8px;">Target Pencapaian</th>
          </tr>
        </thead>
        <tbody>
          ${dimensi?.map((d: any) => `
            <tr>
              <td style="border: 1px solid black; padding: 8px;">${d.nama}</td>
              <td style="border: 1px solid black; padding: 8px;">${d.elemen}</td>
              <td style="border: 1px solid black; padding: 8px;">${d.subElemen}</td>
              <td style="border: 1px solid black; padding: 8px;">${d.targetPencapaian}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <h4>C. Alur Kegiatan Projek</h4>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr>
            <th style="border: 1px solid black; padding: 8px; width: 25%;">Tahap</th>
            <th style="border: 1px solid black; padding: 8px;">Aktivitas Utama</th>
            <th style="border: 1px solid black; padding: 8px; width: 30%;">Keterangan</th>
          </tr>
        </thead>
        <tbody>
          ${alurKegiatan?.map((a: any) => `
            <tr>
              <td style="border: 1px solid black; padding: 8px; font-weight: bold;">${a.tahap}</td>
              <td style="border: 1px solid black; padding: 8px;">
                <ul style="margin: 0; padding-left: 15px;">
                  ${a.aktivitas?.map((act: string) => `<li>${act}</li>`).join('')}
                </ul>
              </td>
              <td style="border: 1px solid black; padding: 8px;">${a.keterangan}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <h4>D. Rubrik Penilaian</h4>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr>
            <th style="border: 1px solid black; padding: 8px; width: 20%;">Dimensi</th>
            <th style="border: 1px solid black; padding: 8px;">Mulai Berkembang (MB)</th>
            <th style="border: 1px solid black; padding: 8px;">Sedang Berkembang (SB)</th>
            <th style="border: 1px solid black; padding: 8px;">Berkembang Sesuai Harapan (BSH)</th>
            <th style="border: 1px solid black; padding: 8px;">Sangat Berkembang (SAB)</th>
          </tr>
        </thead>
        <tbody>
          ${rubrikPenilaian?.map((r: any) => `
            <tr>
              <td style="border: 1px solid black; padding: 8px; font-weight: bold;">${r.dimensi}</td>
              ${r.kriteria?.map((k: any) => `<td style="border: 1px solid black; padding: 8px; font-size: 11px;">${k.deskripsi}</td>`).join('')}
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
              <p>Koordinator P5 / Guru</p>
              <br><br><br><br>
              <p style="font-weight: bold; text-decoration: underline;">${profile?.nama || profile?.displayName || '................................'}</p>
              <p>${profile?.jenisNipGuru || 'NIP'}. ${profile?.nip || '................................'}</p>
          </div>
      </div>` : ''}
      
      <div style="margin-top: 30px; border-top: 1px solid #ccc; padding-top: 20px; text-align: center; font-size: 11px; color: #666; page-break-inside: avoid;">
        <p>Dokumen ini dihasilkan secara otomatis oleh <b>Generator Modul P5 - Pemuryadi</b></p>
        <p>Maju Pendidikan Indonesia &copy; ${new Date().getFullYear()}</p>
      </div>
    `;

    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]')).map(el => el.outerHTML).join('\n');
    printWindow.document.write(`
      <html>
        <head>
          <title>Cetak Modul P5</title>
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
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 border border-amber-200 shadow-sm">
            <Star size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-wide">Modul P5 (Kokurikuler)</h1>
            <p className="text-sm text-amber-600">Generate Modul Projek Penguatan Profil Pelajar Pancasila</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6">
        <div className="max-w-7xl mx-auto flex flex-col gap-6">
          
          <div className="w-full flex flex-col gap-4">
            <h2 className="font-bold text-gray-900 flex items-center gap-2 px-1 mb-2">
              <List size={18} className="text-amber-600" /> Parameter Projek
            </h2>
                
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col gap-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">Jenjang</label>
                  <select 
                    value={formData.jenjang} 
                    onChange={(e) => setFormData({...formData, jenjang: e.target.value})}
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors"
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
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors"
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
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors"
                  >
                    {formData.jenjang && formData.fase && phaseClassMap[formData.jenjang]?.classes[formData.fase]?.map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">Tema P5</label>
                  <select 
                    value={formData.tema} 
                    onChange={(e) => setFormData({...formData, tema: e.target.value})}
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors"
                  >
                    {temaP5List.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">Alokasi Waktu</label>
                  <input 
                    type="text"
                    value={formData.alokasiWaktu} 
                    onChange={(e) => setFormData({...formData, alokasiWaktu: e.target.value})}
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors"
                    placeholder="Contoh: 120 JP atau 3 Minggu"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">
                  Topik Spesifik Projek <span className="text-red-500">*</span>
                </label>
                <AIAssistedInput
                  type="text"
                  value={formData.topik}
                  onChange={(e) => setFormData({...formData, topik: e.target.value})}
                  className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors"
                  placeholder="Contoh: Mengolah sampah plastik menjadi kerajinan ecobrick"
                  contextPrompt={`Berikan ide Topik Spesifik Projek P5 yang menarik untuk anak ${educationLevels.find(l => l.id === formData.jenjang)?.label} dengan Tema '${formData.tema}'.`}
                />
              </div>

              <LogoUploader useLogo={useLogo} setUseLogo={setUseLogo} logoUrl={logoUrl} setLogoUrl={setLogoUrl} />
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col gap-4">
              <ModelSelector value={selectedModel} onChange={setSelectedModel} />
              
              <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-100">
                <button 
                  onClick={generateContent}
                  disabled={isGenerating}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow"
                >
                  {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Star size={20} />}
                  {isGenerating ? 'Menyusun Modul...' : 'Buat Modul P5'}
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
                  <CheckCircle size={18} className="text-amber-600" /> Hasil Modul P5
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
                <div className="p-8 prose prose-slate max-w-none prose-h3:text-amber-700 prose-h4:text-amber-600">
                  <h2 className="text-center text-xl font-bold mb-6 border-b pb-4">MODUL PROJEK PENGUATAN PROFIL PELAJAR PANCASILA (P5)</h2>
                  
                  <div className="bg-gray-50 p-4 rounded-xl mb-6 text-sm border border-gray-100">
                    <div className="grid grid-cols-2 gap-y-2">
                      <div className="font-semibold text-gray-500">Judul Projek:</div><div className="font-bold">{result.judulProjek}</div>
                      <div className="font-semibold text-gray-500">Jenjang/Kelas:</div><div>{result.meta.jenjangLabel} - Kelas {result.meta.kelas} (Fase {result.meta.fase})</div>
                      <div className="font-semibold text-gray-500">Tema:</div><div>{result.meta.tema}</div>
                      <div className="font-semibold text-gray-500">Topik Spesifik:</div><div>{result.meta.topik}</div>
                      <div className="font-semibold text-gray-500">Alokasi Waktu:</div><div>{result.meta.alokasiWaktu}</div>
                    </div>
                  </div>

                  <h4>A. Tujuan & Relevansi Projek</h4>
                  <p><strong>Tujuan:</strong> {result.tujuanProjek}</p>
                  <p><strong>Relevansi Tema dengan Sekolah:</strong> {result.relevansiTema}</p>

                  <h4>B. Dimensi & Sub-Elemen Profil Pelajar Pancasila</h4>
                  <div className="overflow-x-auto mb-6">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-amber-50">
                        <tr>
                          <th className="p-3 border">Dimensi</th>
                          <th className="p-3 border">Elemen</th>
                          <th className="p-3 border">Sub-Elemen</th>
                          <th className="p-3 border">Target Pencapaian</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.dimensi?.map((d: any, idx: number) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="p-3 border font-medium">{d.nama}</td>
                            <td className="p-3 border">{d.elemen}</td>
                            <td className="p-3 border">{d.subElemen}</td>
                            <td className="p-3 border text-gray-600">{d.targetPencapaian}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <h4>C. Alur Kegiatan Projek</h4>
                  <div className="flex flex-col gap-4 mb-6">
                    {result.alurKegiatan?.map((a: any, idx: number) => (
                      <div key={idx} className="bg-white border rounded-xl p-4 shadow-sm">
                        <h5 className="text-amber-700 font-bold mb-2">Tahap: {a.tahap}</h5>
                        <ul className="list-disc pl-5 mb-3 text-sm text-gray-700">
                          {a.aktivitas?.map((act: string, i: number) => <li key={i}>{act}</li>)}
                        </ul>
                        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                          <strong>Keterangan:</strong> {a.keterangan}
                        </div>
                      </div>
                    ))}
                  </div>

                  <h4>D. Rubrik Penilaian</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-amber-50">
                        <tr>
                          <th className="p-3 border w-1/4">Dimensi</th>
                          <th className="p-3 border">Mulai Berkembang</th>
                          <th className="p-3 border">Sedang Berkembang</th>
                          <th className="p-3 border">Sesuai Harapan</th>
                          <th className="p-3 border">Sangat Berkembang</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.rubrikPenilaian?.map((r: any, idx: number) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="p-3 border font-bold text-amber-800">{r.dimensi}</td>
                            {r.kriteria?.map((k: any, i: number) => (
                              <td key={i} className="p-3 border text-xs text-gray-600">{k.deskripsi}</td>
                            ))}
                          </tr>
                        ))}
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
