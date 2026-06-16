import React, { useState, useEffect } from 'react';
import ModelSelector from '@/components/ModelSelector';
import { supervisionIndicators, educationLevels, phaseClassMap, subjectsByLevel } from '@/lib/constants';
import { GoogleGenAI, Type } from '@/lib/genai';
import PrintSupportModal from '@/components/PrintSupportModal';
import { useAuth } from '@/context/AuthContext';
import { getWatermarkHtml, getSignatureHtml, createPrintWindow } from '@/lib/print';
import { Sparkles, FileText, BookOpen, Layout, AlertCircle, Loader2, Save, ClipboardList, Download, Upload, Target, BarChart, MessageCircle, Calculator, Printer, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import AIAssistedInput from '@/components/AIAssistedInput';
import AIAssistedTextarea from '@/components/AIAssistedTextarea';
import { useLocalStorage } from '@/hooks/useLocalStorage';

export default function Supervisi() {
  const { profile } = useAuth();
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useLocalStorage<string>('Supervision_selectedModel', 'openai');
  const [isGenerating, setIsGenerating] = useState(false);

  const saveProgress = () => {
    alert('Progress otomatis disimpan saat Anda mengetik!');
  };

  const resetProgress = () => {
    if (confirm('Apakah Anda yakin ingin mereset semua data di halaman ini? Data yang belum di-export akan hilang.')) {
      localStorage.removeItem('SupervisionData');
      localStorage.removeItem('Supervision_selectedModel');
      localStorage.removeItem('Supervision_sources');
      localStorage.removeItem('Supervision_eduLevel');
      localStorage.removeItem('Supervision_fase');
      localStorage.removeItem('Supervision_kelas');
      localStorage.removeItem('Supervision_subject');
      localStorage.removeItem('Supervision_scores');
      window.location.reload();
    }
  };

  const [error, setError] = useState('');
  
  const [formData, setFormData] = useLocalStorage('SupervisionData', {
    guru: '', nipGuru: '', supervisor: '', nipSupervisor: '', 
    sekolah: '', tanggal: new Date().toISOString().split('T')[0], catatan: ''
  });

  const [sources, setSources] = useLocalStorage('Supervision_sources', {
    rpm: '',
    modulAjar: '',
    modulKokurikuler: ''
  });
  
  const [eduLevel, setEduLevel] = useLocalStorage('Supervision_eduLevel', 'sd');
  const [fase, setFase] = useLocalStorage('supervisi_fase', 'A');
  const [kelas, setKelas] = useLocalStorage('supervisi_kelas', '1');
  const [subject, setSubject] = useLocalStorage('supervisi_subject', 'matematika');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({ planning: true });
  
  const [scores, setScores] = useLocalStorage<Record<string, number>>('Supervision_scores', {});
  const [result, setResult] = useState<{total: number, grade: string, plan: number, exec: number, ass: number, ref: number} | null>(null);

  useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        guru: profile.displayName || prev.guru,
        nipGuru: profile.nip || prev.nipGuru,
        sekolah: profile.namaSekolah || prev.sekolah
      }));
      const level = profile.jenjang?.toLowerCase() || 'sd';
      if (['sd', 'smp', 'sma', 'paud'].includes(level)) {
        setEduLevel(level as any);
      }
    }
  }, [profile]);

  useEffect(() => {
    const phases = phaseClassMap[eduLevel]?.phases || [];
    const firstPhase = phases[0]?.id || '';
    setFase(firstPhase);
    
    const classes = phaseClassMap[eduLevel]?.classes[firstPhase] || [];
    setKelas(classes[0]?.id || '');

    const subjects = subjectsByLevel[eduLevel] || [];
    setSubject(subjects[0]?.id || '');
  }, [eduLevel]);

  useEffect(() => {
    const classes = phaseClassMap[eduLevel]?.classes[fase] || [];
    setKelas(classes[0]?.id || '');
  }, [fase, eduLevel]);

  const handleScoreChange = (section: string, index: number, value: number) => {
    setScores(prev => ({ ...prev, [`${section}_${index}`]: value }));
  };

  const calculateScore = () => {
    const sections = ['planning', 'execution', 'assessment', 'reflection'];
    const weights: Record<string, number> = { planning: 25, execution: 35, assessment: 25, reflection: 15 };
    
    let totalWeighted = 0;
    const sectionScores: Record<string, number> = {};

    sections.forEach(section => {
      let sectionTotal = 0;
      const items = supervisionIndicators[section as keyof typeof supervisionIndicators];
      const itemCount = items.length;
      const maxScore = itemCount * 4;

      for (let i = 0; i < itemCount; i++) {
        sectionTotal += scores[`${section}_${i}`] || 0;
      }

      const sectionPercentage = maxScore > 0 ? (sectionTotal / maxScore) * 100 : 0;
      sectionScores[section] = sectionPercentage;
      totalWeighted += (sectionPercentage * weights[section]) / 100;
    });

    const finalScore = Math.round(totalWeighted);
    
    let grade = 'D (Kurang)';
    if (finalScore >= 90) grade = 'A (Amat Baik)';
    else if (finalScore >= 80) grade = 'B (Baik)';
    else if (finalScore >= 70) grade = 'C (Cukup)';

    setResult({
      total: finalScore,
      grade,
      plan: sectionScores.planning,
      exec: sectionScores.execution,
      ass: sectionScores.assessment,
      ref: sectionScores.reflection
    });
  };

  const exportJSON = () => {
    const dataStr = JSON.stringify({
      formData,
      sources,
      eduLevel,
      fase,
      kelas,
      subject,
      scores,
      result
    }, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `Supervisi_${formData.guru || 'Guru'}_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = event => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed.formData) setFormData(parsed.formData);
          if (parsed.sources) setSources(parsed.sources);
          if (parsed.eduLevel) setEduLevel(parsed.eduLevel);
          if (parsed.fase) setFase(parsed.fase);
          if (parsed.kelas) setKelas(parsed.kelas);
          if (parsed.subject) setSubject(parsed.subject);
          if (parsed.scores) setScores(parsed.scores);
          if (parsed.result) setResult(parsed.result);
          
          alert('Data Supervisi berhasil di-import!');
        } catch (error) {
          alert('Gagal meng-import file JSON. Format file tidak valid.');
        }
      };
    }
  };

  const generateWithAI = async () => {
    if (!sources.rpm && !sources.modulAjar && !sources.modulKokurikuler) {
      setError('Silakan masukkan setidaknya satu sumber data (RPM, Modul Ajar, atau Modul Kokurikuler) untuk dianalisis oleh AI.');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const ai = new GoogleGenAI({});
      
      const prompt = `Pastikan dokumen ini disusun sesuai standar terbaru Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi (Kemendikbudristek) serta Kementerian Agama (Kemenag) Republik Indonesia, mengikuti panduan Kurikulum Merdeka yang mengikat.


        Anda adalah seorang Supervisor Pendidikan ahli. Tugas Anda adalah melakukan analisis supervisi pembelajaran berdasarkan dokumen yang disediakan.
        
        SUMBER DATA:
        1. Alur RPM: ${sources.rpm || 'Tidak disediakan'}
        2. Modul Ajar: ${sources.modulAjar || 'Tidak disediakan'}
        3. Modul Kokurikuler: ${sources.modulKokurikuler || 'Tidak disediakan'}

        INSTRUMEN SUPERVISI (Poin-poin yang harus dinilai):
        A. Perencanaan: ${supervisionIndicators.planning.join(', ')}
        B. Pelaksanaan: ${supervisionIndicators.execution.join(', ')}
        C. Asesmen: ${supervisionIndicators.assessment.join(', ')}
        D. Refleksi: ${supervisionIndicators.reflection.join(', ')}

        TUGAS ANDA:
        1. Berikan skor (1-4) untuk setiap poin instrumen di atas berdasarkan analisis dokumen.
           Skor 4: Sangat Baik/Lengkap
           Skor 3: Baik/Cukup Lengkap
           Skor 2: Kurang/Perlu Perbaikan
           Skor 1: Tidak Ada/Sangat Kurang
        2. Berikan "Catatan Supervisor" yang berisi kesimpulan, saran, dan rekomendasi tindak lanjut yang konkret.

        FORMAT OUTPUT (JSON):
        {
          "scores": {
            "planning": [skor_poin_1, skor_poin_2, ...],
            "execution": [skor_poin_1, skor_poin_2, ...],
            "assessment": [skor_poin_1, skor_poin_2, ...],
            "reflection": [skor_poin_1, skor_poin_2, ...]
          },
          "catatan": "Teks catatan supervisor..."
        }
      `;

      const response = await ai.models.generateContent({
        model: selectedModel,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.7,
        }
      });

      const aiResult = JSON.parse(response.text || '{}');

      const newScores: Record<string, number> = {};
      
      ['planning', 'execution', 'assessment', 'reflection'].forEach(section => {
        const sectionScores = aiResult.scores[section];
        if (Array.isArray(sectionScores)) {
          sectionScores.forEach((score, index) => {
            newScores[`${section}_${index}`] = Number(score);
          });
        }
      });

      setScores(newScores);
      setFormData(prev => ({ ...prev, catatan: aiResult.catatan }));
      
      setTimeout(() => {
        const sections = ['planning', 'execution', 'assessment', 'reflection'];
        const weights: Record<string, number> = { planning: 25, execution: 35, assessment: 25, reflection: 15 };
        
        let totalWeighted = 0;
        const sectionScores: Record<string, number> = {};

        sections.forEach(section => {
          let sectionTotal = 0;
          const items = supervisionIndicators[section as keyof typeof supervisionIndicators];
          const itemCount = items.length;
          const maxScore = itemCount * 4;

          for (let i = 0; i < itemCount; i++) {
            sectionTotal += newScores[`${section}_${i}`] || 0;
          }

          const sectionPercentage = maxScore > 0 ? (sectionTotal / maxScore) * 100 : 0;
          sectionScores[section] = sectionPercentage;
          totalWeighted += (sectionPercentage * weights[section]) / 100;
        });

        const finalScore = Math.round(totalWeighted);
        
        let grade = 'D (Kurang)';
        if (finalScore >= 90) grade = 'A (Amat Baik)';
        else if (finalScore >= 80) grade = 'B (Baik)';
        else if (finalScore >= 70) grade = 'C (Cukup)';

        setResult({
          total: finalScore,
          grade,
          plan: sectionScores.planning,
          exec: sectionScores.execution,
          ass: sectionScores.assessment,
          ref: sectionScores.reflection
        });
      }, 100);

    } catch (err: any) {
      console.error(err);
      setError('Gagal menghasilkan analisis AI. Pastikan API Key valid dan format dokumen benar.');
    } finally {
      setIsGenerating(false);
    }
  };

  const printSupervision = () => {
    if (!result) return;
    
    const subjectLabel = subjectsByLevel[eduLevel]?.find(s => s.id === subject)?.label || subject;
    const levelLabel = educationLevels.find(l => l.id === eduLevel)?.label || eduLevel;
    const faseLabel = phaseClassMap[eduLevel]?.phases.find(p => p.id === fase)?.label || fase;
    const kelasLabel = phaseClassMap[eduLevel]?.classes[fase]?.find(c => c.id === kelas)?.label || kelas;
    
    const printWindow = createPrintWindow();
    if (!printWindow) return;

    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]')).map(el => el.outerHTML).join('\n');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
          <title>Instrumen Supervisi Pembelajaran</title>
          
          <style>
              @page {
                size: A4;
                margin: 0;
              }
              @media print {
                  body { 
                    -webkit-print-color-adjust: exact; 
                    print-color-adjust: exact; 
                    margin: 0;
                    padding: 10mm;
                  }
                  .no-print { display: none; }
                  .content-wrapper {
                    max-width: 100% !important;
                    padding: 5mm !important;
                    margin: 0 !important;
                  }
              }
              body {
                font-family: 'Inter', sans-serif;
                background: white;
                position: relative;
                min-height: 100vh;
                margin: 0;
                padding: 0;
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
              h1, h2, h3 { text-align: center; }
              table { width: 100%; border-collapse: collapse; margin: 15px 0; }
              th, td { border: 1px solid #333; padding: 8px; text-align: left; font-size: 12px; }
              th { background: #f0f0f0; font-weight: bold; }
              .header { background: #1e40af; color: white; padding: 20px; text-align: center; margin: -15mm -15mm 20px -15mm; }
              .score-section { background: #f9f9f9; padding: 15px; margin: 15px 0; }
              .row { display: flex; margin: 8px 0; font-size: 12px; }
              .label { width: 35%; font-weight: bold; }
              .value { width: 65%; }
              .signatures { display: flex; justify-content: space-between; margin-top: 50px; text-align: center; font-size: 12px; }
              .signature-box { width: 40%; }
              .signature-line { margin-top: 60px; border-top: 1px solid #000; padding-top: 5px; font-weight: bold; }
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
          <div class="watermark">PEMURYADI - MAJU PENDIDIKAN INDONESIA</div>
          <div class="content-wrapper">
              <div class="header">
                  <h1 style="margin: 0; font-size: 20px;">INSTRUMEN SUPERVISI PEMBELAJARAN</h1>
                  <p style="margin: 5px 0 0 0; font-size: 12px;">Permendikdasmen No. 1 Tahun 2026</p>
              </div>

              <h3 style="font-size: 14px; text-align: left; border-bottom: 2px solid #1e40af; padding-bottom: 5px;">I. DATA UMUM</h3>
              <div class="row"><div class="label">Nama Sekolah:</div><div class="value">${formData.sekolah || '-'}</div></div>
              <div class="row"><div class="label">Nama Guru:</div><div class="value">${formData.guru || '-'}</div></div>
              <div class="row"><div class="label">NIP/NUPTK/NIY/NRG/NPK Guru:</div><div class="value">${formData.nipGuru || '-'}</div></div>
              <div class="row"><div class="label">Mata Pelajaran:</div><div class="value">${subjectLabel}</div></div>
              <div class="row"><div class="label">Jenjang / Kelas / Fase:</div><div class="value">${levelLabel} / ${kelasLabel} / ${faseLabel}</div></div>
              <div class="row"><div class="label">Nama Supervisor:</div><div class="value">${formData.supervisor || '-'}</div></div>
              <div class="row"><div class="label">Tanggal Supervisi:</div><div class="value">${formData.tanggal || new Date().toLocaleDateString('id-ID')}</div></div>

              <h3 style="font-size: 14px; text-align: left; border-bottom: 2px solid #1e40af; padding-bottom: 5px; margin-top: 20px;">II. HASIL SUPERVISI</h3>
              <div class="score-section">
                  <table>
                      <tr><th>Aspek Penilaian</th><th>Skor (%)</th><th>Bobot</th><th>Nilai Terbobot</th></tr>
                      <tr><td>A. Perencanaan Pembelajaran</td><td>${result.plan.toFixed(1)}</td><td>25%</td><td>${(result.plan * 0.25).toFixed(1)}</td></tr>
                      <tr><td>B. Pelaksanaan Pembelajaran</td><td>${result.exec.toFixed(1)}</td><td>35%</td><td>${(result.exec * 0.35).toFixed(1)}</td></tr>
                      <tr><td>C. Asesmen dan Evaluasi</td><td>${result.ass.toFixed(1)}</td><td>25%</td><td>${(result.ass * 0.25).toFixed(1)}</td></tr>
                      <tr><td>D. Refleksi dan Tindak Lanjut</td><td>${result.ref.toFixed(1)}</td><td>15%</td><td>${(result.ref * 0.15).toFixed(1)}</td></tr>
                      <tr style="background: #f0f0f0; font-weight: bold;"><td colspan="3">NILAI TOTAL</td><td>${result.total}</td></tr>
                  </table>
              </div>

              <div class="score-section" style="margin-top: 10px;">
                  <div class="row"><div class="label">Nilai Akhir:</div><div class="value"><strong>${result.total} / 100</strong></div></div>
                  <div class="row"><div class="label">Grade:</div><div class="value"><strong>${result.grade}</strong></div></div>
              </div>

              <h3 style="font-size: 14px; text-align: left; border-bottom: 2px solid #1e40af; padding-bottom: 5px; margin-top: 20px;">III. CATATAN SUPERVISOR</h3>
              <div style="border: 1px solid #ddd; padding: 10px; min-height: 60px; white-space: pre-wrap; font-size: 12px;">${formData.catatan || '-'}</div>

              <div style="margin-top: 40px; display: flex; justify-content: space-between; text-align: center; font-size: 12px;">
                  <div style="width: 45%;">
                      <p>Guru yang Disupervisi,</p>
                      <br><br><br><br>
                      <p style="font-weight: bold; text-decoration: underline;">${formData.guru || '...........................................'}</p>
                      <p>${formData.nipGuru || 'NIP'}. ${formData.nipGuru || '...........................................'}</p>
                  </div>
                  <div style="width: 45%;">
                      <p>${formData.tanggal || new Date().toLocaleDateString('id-ID')}</p>
                      <p>Supervisor,</p>
                      <br><br><br><br>
                      <p style="font-weight: bold; text-decoration: underline;">${formData.supervisor || '...........................................'}</p>
                      <p>${formData.nipSupervisor || 'NIP'}. ${formData.nipSupervisor || '...........................................'}</p>
                  </div>
              </div>

              <div class="support-footer">
                  <p>Dokumen ini dihasilkan secara otomatis oleh <strong>Supervisi Generator - Pemuryadi</strong></p>
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

  const toggleSection = (id: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const renderSection = (title: React.ReactNode, id: string, items: string[]) => {
    const isExpanded = expandedSections[id];
    return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-4 overflow-hidden">
      <button 
        onClick={() => toggleSection(id)}
        className="w-full flex items-center justify-between p-6 bg-white hover:bg-gray-50 transition-colors text-left"
      >
        <h3 className="flex items-center gap-2 text-blue-500 font-bold text-lg">{title}</h3>
        {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
      </button>
      
      {isExpanded && (
        <div className="p-6 pt-0 space-y-3 border-t border-gray-100">
          {items.map((item, index) => (
            <div key={index} className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100 transition-colors">
              <span className="text-gray-500 text-sm font-medium w-6">{index + 1}.</span>
              <div className="flex-1">
                <p className="text-sm text-gray-700 mb-3 leading-relaxed">{item}</p>
                <div className="flex gap-4">
                  {[4, 3, 2, 1].map(val => (
                    <label key={val} className="flex items-center gap-2 cursor-pointer group">
                      <input 
                        type="radio" 
                        name={`${id}_${index}`} 
                        value={val}
                        checked={scores[`${id}_${index}`] === val}
                        onChange={() => handleScoreChange(id, index, val)}
                        className="w-4 h-4 text-blue-500 border-gray-300 focus:ring-blue-500 focus:ring-offset-slate-800"
                      />
                      <span className="text-xs text-gray-500 group-hover:text-gray-900 transition-colors">{val}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )};

  return (
    <div className="flex flex-col h-full bg-gray-50 text-gray-900">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 border border-indigo-200 shadow-sm">
            <ClipboardList size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-wide">Instrumen Supervisi Akademik</h1>
            <p className="text-sm text-indigo-600">Berdasarkan Perdirjen GTK No. 7327/B.B1/HK.03.01/2023</p>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-4 md:p-6">
        <div className="max-w-7xl mx-auto flex flex-col gap-6">
          <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <details className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-4 group" open>
            <summary className="flex items-center justify-between p-6 pb-4 border-b border-gray-100 cursor-pointer list-none">
              <h3 className="flex items-center gap-2 text-blue-400 font-semibold"><FileText className="w-5 h-5" /> Data Umum</h3>
              <div className="flex items-center gap-4">
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={exportJSON}
                    className="px-3 py-1.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
                    title="Export Data Supervisi ke JSON"
                  >
                    <Download className="w-4 h-4" /> Export
                  </button>
                  <label className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-sm">
                    <Upload className="w-4 h-4" /> Import
                    <input
                      type="file"
                      accept=".json"
                      onChange={importJSON}
                      className="hidden"
                    />
                  </label>
                </div>
                <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" />
              </div>
            </summary>
            
            <div className="p-6 pt-4">
            
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <AIAssistedInput type="text" placeholder="Nama Sekolah" value={formData.sekolah} onChange={e => setFormData({...formData, sekolah: e.target.value})} className="bg-gray-50 border border-gray-300 rounded-lg p-3 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all" />
              </div>
              
              <AIAssistedInput type="text" placeholder="Nama Guru" value={formData.guru} onChange={e => setFormData({...formData, guru: e.target.value})} className="bg-gray-50 border border-gray-300 rounded-lg p-3 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all" />
              <AIAssistedInput type="text" placeholder="NIP/NUPTK/NIY/NRG/NPK Guru" value={formData.nipGuru} onChange={e => setFormData({...formData, nipGuru: e.target.value})} className="bg-gray-50 border border-gray-300 rounded-lg p-3 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all" />
              
              <AIAssistedInput type="text" placeholder="Nama Supervisor" value={formData.supervisor} onChange={e => setFormData({...formData, supervisor: e.target.value})} className="bg-gray-50 border border-gray-300 rounded-lg p-3 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all" />
              <AIAssistedInput type="text" placeholder="NIP/NUPTK/NIY/NRG/NPK Supervisor" value={formData.nipSupervisor} onChange={e => setFormData({...formData, nipSupervisor: e.target.value})} className="bg-gray-50 border border-gray-300 rounded-lg p-3 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all" />
              
              <select 
                value={eduLevel}
                onChange={(e) => setEduLevel(e.target.value)}
                className="bg-gray-50 border border-gray-300 rounded-lg p-3 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              >
                {educationLevels.map(level => (
                  <option key={level.id} value={level.id}>{level.label}</option>
                ))}
              </select>
              
              <div className="grid grid-cols-2 gap-2">
                <select 
                  value={fase}
                  onChange={(e) => setFase(e.target.value)}
                  className="bg-gray-50 border border-gray-300 rounded-lg p-3 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                >
                  {phaseClassMap[eduLevel]?.phases.map(p => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
                <select 
                  value={kelas}
                  onChange={(e) => setKelas(e.target.value)}
                  className="bg-gray-50 border border-gray-300 rounded-lg p-3 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                >
                  {phaseClassMap[eduLevel]?.classes[fase]?.map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>

              <select 
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="bg-gray-50 border border-gray-300 rounded-lg p-3 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              >
                {subjectsByLevel[eduLevel]?.map(sub => (
                  <option key={sub.id} value={sub.id}>{sub.label}</option>
                ))}
              </select>

              <AIAssistedInput type="date" value={formData.tanggal} onChange={e => setFormData({...formData, tanggal: e.target.value})} className="bg-gray-50 border border-gray-300 rounded-lg p-3 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all" />
            </div>
            </div>
          </details>

          <details className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-4 group" open>
            <summary className="flex items-center justify-between p-6 pb-4 border-b border-gray-100 cursor-pointer list-none">
              <h3 className="flex items-center gap-2 text-blue-400 font-semibold">
                <Sparkles className="w-5 h-5 text-amber-600" />
                AI Supervision Generator (Sumber Data)
              </h3>
              <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" />
            </summary>
            <div className="p-6 pt-4">
            <p className="text-xs text-gray-500 mb-4 italic">
              Masukkan konten dokumen Anda di bawah ini agar AI dapat menganalisis dan mengisi instrumen secara otomatis.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  <div className="flex items-center gap-1">
                    <Layout className="w-3 h-3" /> Alur RPM (Rencana Pembelajaran Mendalam)
                  </div>
                  <div className="text-[10px] text-red-500 mt-0.5 ml-4">(Deep Learning Plan)</div>
                </label>
                <AIAssistedTextarea rows={2}
                  value={sources.rpm}
                  onChange={e => setSources({...sources, rpm: e.target.value})}
                  className="w-full bg-white border border-gray-300 rounded-lg p-2 text-xs text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  placeholder="Paste konten RPM di sini..." />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                  <BookOpen className="w-3 h-3" /> Modul Ajar
                </label>
                <AIAssistedTextarea rows={2}
                  value={sources.modulAjar}
                  onChange={e => setSources({...sources, modulAjar: e.target.value})}
                  className="w-full bg-white border border-gray-300 rounded-lg p-2 text-xs text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  placeholder="Paste konten Modul Ajar di sini..." />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                  <FileText className="w-3 h-3" /> Modul Kokurikuler
                </label>
                <AIAssistedTextarea rows={2}
                  value={sources.modulKokurikuler}
                  onChange={e => setSources({...sources, modulKokurikuler: e.target.value})}
                  className="w-full bg-white border border-gray-300 rounded-lg p-2 text-xs text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  placeholder="Paste konten Modul Kokurikuler di sini..." />
              </div>
              <div className="mb-4">
            <ModelSelector modality="text" value={selectedModel} onChange={setSelectedModel} disabled={isGenerating} />
          </div>
          <div className="flex flex-wrap gap-2 mt-4 w-full">
              <button 
                onClick={saveProgress}
                className="px-4 py-3 bg-red-100 hover:bg-slate-600 text-gray-900 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                title="Simpan Progress"
              >
                <Save size={18} /> Simpan
              </button>
              <button 
                onClick={resetProgress}
                className="px-4 py-3 bg-red-100 hover:bg-slate-600 text-gray-900 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                title="Reset Data"
              >
                <Trash2 size={18} /> Reset
              </button>
              <button 
                onClick={generateWithAI}
                disabled={isGenerating}
                className="flex-1 py-3 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 font-bold text-gray-900 hover:opacity-90 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Menganalisis Dokumen...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate Analisis Supervisi (AI)
                  </>
                )}
              </button>
            </div>
              </div>
            </div>
          </details>

          {renderSection(<><BookOpen className="w-5 h-5 text-blue-400" /> A. Perencanaan Pembelajaran (Modul Ajar/RPP)</>, 'planning', supervisionIndicators.planning)}
          {renderSection(<><Target className="w-5 h-5 text-green-400" /> B. Pelaksanaan Pembelajaran</>, 'execution', supervisionIndicators.execution)}
          {renderSection(<><BarChart className="w-5 h-5 text-purple-400" /> C. Asesmen dan Evaluasi</>, 'assessment', supervisionIndicators.assessment)}
          {renderSection(<><MessageCircle className="w-5 h-5 text-amber-400" /> D. Refleksi dan Tindak Lanjut</>, 'reflection', supervisionIndicators.reflection)}

          <details className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-4 group" open>
            <summary className="flex items-center justify-between p-6 pb-4 border-b border-gray-100 cursor-pointer list-none">
              <h3 className="flex items-center gap-2 text-blue-400 font-semibold"><FileText className="w-5 h-5" /> Catatan Supervisor</h3>
              <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" />
            </summary>
            <div className="p-6 pt-4">
            <AIAssistedTextarea rows={4} 
              value={formData.catatan}
              onChange={e => setFormData({...formData, catatan: e.target.value})}
              className="w-full h-40 bg-slate-50 border border-slate-300 rounded-lg p-4 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all resize-none font-mono text-sm leading-relaxed"
              placeholder="Catatan, saran, dan rekomendasi..." 
              contextPrompt="Berikan contoh paragraf catatan kesimpulan, saran, dan rekomendasi konkret dari seorang supervisor pendidikan kepada guru setelah melakukan supervisi akademik di kelas."
              />
            </div>
          </details>
          
          <div className="flex flex-col gap-4">
            <div className="flex gap-4">
              <button onClick={calculateScore} className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 font-bold text-lg text-gray-900 hover:opacity-90 transition-all shadow-lg hover:shadow-red-500/20 btn-generate-animated">
                <Calculator className="w-6 h-6" /> Hitung Nilai
              </button>
              <button onClick={() => setIsPrintModalOpen(true)} disabled={!result} className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-lg text-gray-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg">
                <Printer className="w-6 h-6" /> Print
              </button>
            </div>
            <p className="text-[10px] text-gray-500 italic text-center">
              * Gunakan Chrome di Desktop untuk hasil terbaik. Di mobile, gunakan "Simpan sebagai PDF".<br/>
              * Jangan lupa support saya agar makin berusaha dalam memperbaiki website ini.
            </p>
          </div>
        </div>
        
        <div className="space-y-4">
          <details className="bg-white rounded-2xl border border-gray-200 shadow-sm sticky top-6 group" open>
            <summary className="flex items-center justify-between p-6 pb-4 border-b border-gray-100 cursor-pointer list-none">
              <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2"><BarChart className="w-6 h-6 text-blue-500" /> Hasil Supervisi</h4>
              <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" />
            </summary>
            <div className="p-6 pt-4">
            
            <div className="flex justify-center mb-8">
              <div 
                className="w-[140px] h-[140px] rounded-full flex flex-col items-center justify-center relative shadow-inner"
                style={{ background: `conic-gradient(#3b82f6 ${result ? result.total * 3.6 : 0}deg, #1e293b 0)` }}
              >
                <div className="w-[120px] h-[120px] rounded-full bg-white flex flex-col items-center justify-center absolute shadow-lg">
                  <span className="text-4xl font-bold text-gray-900">{result ? result.total : 0}</span>
                  <span className="text-xs text-gray-500 mt-1">dari 100</span>
                </div>
              </div>
            </div>
            
            <div className={`text-center text-2xl font-bold mb-6 ${result ? (result.total >= 90 ? 'text-green-500' : result.total >= 80 ? 'text-blue-500' : result.total >= 70 ? 'text-yellow-500' : 'text-red-500') : 'text-gray-500'}`}>
              {result ? result.grade : '-'}
            </div>
            
            <div className="space-y-3 text-sm bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Perencanaan:</span>
                <span className="font-semibold text-gray-900 bg-red-50 px-2 py-1 rounded">{result ? result.plan.toFixed(1) : 0}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Pelaksanaan:</span>
                <span className="font-semibold text-gray-900 bg-red-50 px-2 py-1 rounded">{result ? result.exec.toFixed(1) : 0}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Asesmen:</span>
                <span className="font-semibold text-gray-900 bg-red-50 px-2 py-1 rounded">{result ? result.ass.toFixed(1) : 0}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Refleksi:</span>
                <span className="font-semibold text-gray-900 bg-red-50 px-2 py-1 rounded">{result ? result.ref.toFixed(1) : 0}%</span>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-500">
              <p className="font-semibold text-gray-700 mb-2">Keterangan Nilai:</p>
              <ul className="space-y-1">
                <li className="flex justify-between"><span className="text-green-400">A (Amat Baik)</span> <span>90-100</span></li>
                <li className="flex justify-between"><span className="text-blue-400">B (Baik)</span> <span>80-89</span></li>
                <li className="flex justify-between"><span className="text-yellow-400">C (Cukup)</span> <span>70-79</span></li>
                <li className="flex justify-between"><span className="text-red-400">D (Kurang)</span> <span>&lt;70</span></li>
              </ul>
              </div>
            </div>
          </details>
        </div>
      </div>

      </div></div><PrintSupportModal 
        isOpen={isPrintModalOpen} 
        onClose={() => setIsPrintModalOpen(false)} 
        onConfirm={printSupervision} 
      />
    </div>
  );
}
