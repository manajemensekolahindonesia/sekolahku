import React, { useState } from 'react';
import { GoogleGenAI } from '@/lib/genai';
import { Upload, Loader2, FileText, Printer, ChevronUp, ChevronDown, CheckCircle2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function LaporanKegiatan() {
  const [file, setFile] = useState<File | null>(null);
  const [base64Image, setBase64Image] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState('');
  const [error, setError] = useState('');
  const [prompt, setPrompt] = useState('berikan perintah untuk mengisi agar memperoleh jawaban');
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        setBase64Image(base64String);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleGenerateReport = async () => {
    if (!base64Image || !file) return;
    setLoading(true);
    setError('');
    setReport('');

    try {
      const backendPrompt = "Buat laporan kegiatan sekolah (Intrakurikuler, Kokurikuler, atau Ekstrakurikuler) berdasarkan foto kegiatan ini. Laporan harus profesional, terstruktur, dan menggunakan gaya bahasa formal. Lakukan pencarian relevan jika diperlukan. Tambahan dari user: " + prompt;

      const ai = new GoogleGenAI({});
      const response = await ai.models.generateContent({
        model: 'openai',
        contents: [
          { role: 'user', parts: [
            { text: backendPrompt },
            { inlineData: { data: base64Image, mimeType: file.type } }
          ]}
        ]
      });

      setReport(response.text);
      setExpandedSections(prev => ({ ...prev, result: true }));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto font-sans h-full text-gray-900 flex flex-col">
      <header className="mb-10 border-b border-gray-100 pb-6 flex justify-between items-baseline shrink-0">
        <div>
           <div className="text-sm text-blue-600 font-semibold mb-2">Penyusunan Berbasis AI</div>
           <h1 className="text-3xl font-bold text-gray-900 mt-2">ACTIVITY REPORT</h1>
        </div>
      </header>

      <div className="space-y-6 flex-1 overflow-auto pb-12">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-4">
          <button 
            onClick={() => toggleSection('input')}
            className="w-full flex items-center justify-between p-6 bg-white text-gray-900 hover:bg-gray-50 border-b border-gray-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <FileText size={20} />
              <h2 className="font-semibold text-gray-900">A. Data & Foto Kegiatan</h2>
            </div>
            {expandedSections.input ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          
          {expandedSections.input && (
            <div className="p-6 md:p-8 space-y-6 border-t border-gray-100">
              <p className="text-sm text-gray-500 font-sans border-l-2 border-blue-600 pl-3">
                Unggah foto kegiatan untuk menyusun laporan kegiatan (Intra, Koku, maupun Ekstrakurikuler). 
                Mesin AI akan menggunakan pencarian yang relevan untuk memastikan laporan terstruktur dengan tepat.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6 no-print">
                  <div className="border border-gray-200 border-dashed p-10 flex flex-col items-center justify-center text-center hover:bg-blue-50 transition-colors bg-white">
                    <Upload size={32} className="text-blue-600 mb-4" />
                    <p className="text-sm text-gray-900 font-bold mb-2">Klik untuk unggah foto</p>
                    <p className="text-[11px] uppercase tracking-widest text-gray-500 mb-6 font-bold">PNG, JPG</p>
                    <input type="file" accept="image/*" className="hidden" id="upload-image" onChange={handleImageChange} />
                    <label htmlFor="upload-image" className="cursor-pointer bg-gray-900 text-white px-6 py-2 text-sm font-medium hover:bg-blue-600 hover:text-gray-900 transition-colors border border-gray-200">
                      Pilih File
                    </label>
                  </div>
                  {file && <p className="text-[11px] text-safe font-bold uppercase tracking-wider pl-1 truncate">Dipilih: {file.name}</p>}
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest block mb-2">Instruksi Laporan (Opsional)</label>
                  <textarea
                    className="w-full border border-gray-200 p-3 font-sans text-sm focus:border-blue-600 resize-none h-32"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                  />
                  
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleGenerateReport}
                      disabled={!base64Image || loading}
                      className="bg-gray-900 hover:bg-blue-600 text-white hover:text-gray-900 font-bold uppercase tracking-widest text-[11px] px-8 py-4 transition-colors flex items-center justify-center gap-3 disabled:opacity-50 border border-gray-200 shadow-sm"
                    >
                      {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                      {loading ? 'Menyusun Laporan...' : 'Buat Laporan'}
                    </button>
                  </div>
                  {error && <p className="text-[10px] uppercase tracking-wider text-danger font-bold mt-2">{error}</p>}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-4">
          <button 
            onClick={() => toggleSection('result')}
            className="w-full flex items-center justify-between p-6 bg-white text-gray-900 hover:bg-gray-50 border-b border-gray-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Printer size={20} />
              <h2 className="font-semibold text-gray-900">B. Hasil Laporan</h2>
            </div>
            {expandedSections.result ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          
          {expandedSections.result && (
            <div className="p-6 md:p-8 space-y-6 border-t border-gray-100">
              {report && (
                <div className="no-print flex justify-end mb-4">
                  <button onClick={() => window.print()} className="flex items-center gap-2 bg-white text-gray-900 border border-gray-200 px-4 py-2 text-[10px] uppercase font-bold tracking-widest hover:bg-gray-900 hover:text-white transition-colors">
                    <Printer size={14} /> Cetak Laporan
                  </button>
                </div>
              )}
              {report ? (
                <div id="printArea" className="prose prose-sm prose-slate max-w-none prose-headings:font-sans prose-headings:text-gray-900 prose-a:text-blue-600 prose-p:font-sans prose-p:leading-[1.8] prose-p:text-sm markdown-body print-area">
                  <ReactMarkdown>{report}</ReactMarkdown>
                </div>
               ) : (
                <div className="m-auto text-center text-gray-500 flex flex-col items-center p-12 bg-blue-50 border border-gray-100">
                  <FileText size={48} className="mb-4 opacity-50" />
                  <p className="text-[11px] uppercase font-bold tracking-widest">Dokumen Kosong</p>
                  <p className="text-[12px] font-sans  mt-2">Hasil laporan AI akan muncul di sini setelah Anda mengisi data.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
