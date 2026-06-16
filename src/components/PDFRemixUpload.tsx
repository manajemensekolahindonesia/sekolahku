import React, { useState, useRef } from 'react';
import { Upload, FileText, X, Loader2, RefreshCw } from 'lucide-react';
import { extractTextFromPDF } from '@/lib/pdf';

interface PDFRemixUploadProps {
  onTextExtracted: (text: string) => void;
  label?: string;
}

export default function PDFRemixUpload({ onTextExtracted, label = "Remix dari PDF" }: PDFRemixUploadProps) {
  const [isExtracting, setIsExtracting] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Hanya file PDF yang didukung.');
      return;
    }

    setIsExtracting(true);
    setError(null);
    setFileName(file.name);

    try {
      const text = await extractTextFromPDF(file);
      if (text.length < 50) {
        throw new Error('Teks yang diekstrak terlalu pendek atau tidak terbaca.');
      }
      onTextExtracted(text);
    } catch (err: any) {
      setError(err.message || 'Gagal membaca PDF');
      setFileName(null);
    } finally {
      setIsExtracting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest">{label}</label>
        {fileName && (
          <button 
            onClick={() => {
              setFileName(null);
              setError(null);
            }}
            className="text-red-400 hover:text-red-300 transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>
      
      <div 
        onClick={() => !isExtracting && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-4 transition-all cursor-pointer flex flex-col items-center justify-center gap-2
          ${isExtracting ? 'border-red-500/50 bg-red-500/5' : 'border-black hover:border-red-500/50 hover:bg-white/5'}
          ${error ? 'border-red-500/50 bg-red-500/5' : ''}
        `}
      >
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf"
          className="hidden"
        />
        
        {isExtracting ? (
          <>
            <Loader2 className="animate-spin text-red-500" size={24} />
            <span className="text-xs text-red-500 font-bold animate-pulse">Mengekstrak Teks...</span>
          </>
        ) : fileName ? (
          <>
            <FileText className="text-red-300" size={24} />
            <span className="text-xs text-gray-700 font-medium truncate max-w-full px-2">{fileName}</span>
            <span className="text-[10px] text-red-300 font-bold flex items-center gap-1">
              <RefreshCw size={10} /> Siap untuk di-Remix
            </span>
          </>
        ) : (
          <>
            <Upload className="text-gray-500" size={24} />
            <span className="text-xs text-gray-600 font-medium">Klik untuk Upload PDF</span>
            <span className="text-[10px] text-gray-500">Sistem akan membaca & memberikan Remix AI</span>
          </>
        )}
      </div>
      
      {error && (
        <p className="text-[10px] text-red-400 font-medium">{error}</p>
      )}
    </div>
  );
}
