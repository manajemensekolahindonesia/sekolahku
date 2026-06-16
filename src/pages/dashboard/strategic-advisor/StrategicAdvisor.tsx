import React, { useState } from 'react';
import { GoogleGenAI } from '@/lib/genai';
import { BrainCircuit, Loader2, Play, Printer, ChevronUp, ChevronDown, CheckCircle2, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function StrategicAdvisor() {
  const [prompt, setPrompt] = useState('berikan perintah untuk mengisi agar memperoleh jawaban');
  const [responseHtml, setResponseHtml] = useState('');
  const [thinking, setThinking] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    input: true,
    result: false
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setThinking(true);
    setResponseHtml('');

    try {
      const finalPrompt = prompt === 'berikan perintah untuk mengisi agar memperoleh jawaban' 
        ? "Tolong evaluasi pemetaan mutu sekolah berdasarkan data yang ada." 
        : prompt;

      const ai = new GoogleGenAI({});
      const response = await ai.models.generateContent({
        model: 'openai',
        contents: finalPrompt,
        config: {
          systemInstruction: "Anda adalah Analis Strategis Data Senior Kementerian Pendidikan. Tugas utama Anda adalah mengevaluasi pemetaan mutu sekolah dengan fokus pada validitas dan kedalaman data. WAJIB gunakan analisis '5 Why', 'Fishbone Analysis', dan 'Venn Diagram' untuk mengidentifikasi akar masalah (Root Cause) dari setiap indikator mutu yang rendah. Pastikan rekomendasi yang Anda berikan menjamin keterkaitan kuat antara masalah dan program, serta integrasi antar program lintas standar. DILARANG KERAS menggunakan kata pengantar AI (seperti 'Halo', 'Tentu'), dan dilarang menggunakan kata penutup basa-basi. HANYA KELUARKAN KONTEN MARKDOWN MURNI."
        }
      });

      setResponseHtml(response.text || '');
      setExpandedSections(prev => ({ ...prev, result: true }));
    } catch (error: any) {
      setResponseHtml(`**Error:** ${error.message}`);
    } finally {
      setThinking(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto font-sans text-gray-900 h-full flex flex-col">
      <header className="mb-10 border-b border-gray-100 pb-6 flex justify-between items-baseline shrink-0">
        <div>
           <div className="text-sm text-blue-600 font-semibold mb-2">Thinking Level: HIGH</div>
           <h1 className="text-3xl font-bold text-gray-900 mt-2 flex items-center gap-4">
             <BrainCircuit className="text-blue-600 hidden sm:block" size={40} />
             Strategic Advisor
           </h1>
        </div>
      </header>

      <div className="space-y-6 flex-1 overflow-auto pb-12">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-4">
          <button 
            onClick={() => toggleSection('input')}
            className="w-full flex items-center justify-between p-6 bg-white text-gray-900 hover:bg-gray-50 border-b border-gray-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <BrainCircuit size={20} />
              <h2 className="font-semibold text-gray-900">A. Form Permintaan Strategis</h2>
            </div>
            {expandedSections.input ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          
          {expandedSections.input && (
            <div className="p-6 md:p-8 space-y-6 border-t border-gray-100">
              <form onSubmit={handleSubmit} className="relative no-print">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Masukkan pertanyaan strategis atau konteks evaluasi..."
                  className="w-full h-32 w-full bg-gray-50 border border-gray-300 rounded-xl p-4 text-gray-900 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all resize-none"
                />
                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={thinking}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center disabled:opacity-50"
                  >
                    {thinking ? <Loader2 size={16} className="animate-spin mr-3" /> : <Play size={16} className="mr-3" />}
                    {thinking ? 'Synthesis...' : 'Execute Strategy'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-4">
          <button 
            onClick={() => toggleSection('result')}
            className="w-full flex items-center justify-between p-6 bg-white text-gray-900 hover:bg-gray-50 border-b border-gray-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <FileText size={20} />
              <h2 className="font-semibold text-gray-900">B. Sintesis Advisor</h2>
            </div>
            {expandedSections.result ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          
          {expandedSections.result && (
            <div className="p-6 md:p-8 space-y-6 border-t border-gray-100 relative min-h-[300px]">
              {thinking ? (
                <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                  <Loader2 size={48} className="animate-spin text-blue-600 mb-4" />
                  <p className="font-mono text-[11px] uppercase tracking-[3px] text-gray-900 font-bold animate-pulse">
                    Synthesizing Global Strategy...
                  </p>
                  <p className="text-[10px] text-gray-500 mt-2  font-sans">Thinking at HIGH level. This might take a bit longer.</p>
                </div>
              ) : null}

              {responseHtml ? (
                <div className="prose prose-slate max-w-none prose-headings:font-sans prose-headings:text-gray-900 prose-a:text-blue-600 prose-p:font-sans prose-p:leading-[1.8] prose-p:text-sm">
                  <div className="no-print flex justify-end mb-4">
                     <button onClick={() => window.print()} className="flex items-center gap-2 bg-white text-gray-900 border border-gray-200 px-4 py-2 text-[10px] uppercase font-bold tracking-widest hover:bg-gray-900 hover:text-white transition-colors">
                        <Printer size={14} /> Cetak Dokumen
                     </button>
                  </div>
                  <div id="printArea" className="markdown-body print-area">
                    <ReactMarkdown>{responseHtml}</ReactMarkdown>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 p-12 bg-blue-50 border border-gray-100 text-center mt-4">
                   <BrainCircuit size={48} className="mb-4 opacity-50" />
                  <span className="font-sans  text-sm">Ask a strategic question above to initiate deep thinking...</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
