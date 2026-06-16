import React, { useState, useRef } from 'react';
import { Upload, FileText, X, Image as ImageIcon } from 'lucide-react';

export interface UploadedFile {
  data: string;
  mimeType: string;
  name: string;
}

interface DocumentUploadProps {
  onFileUploaded: (file: UploadedFile | null) => void;
  label?: string;
}

export default function DocumentUpload({ onFileUploaded, label = "Upload Dokumen Referensi" }: DocumentUploadProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!allowedTypes.includes(file.type)) {
      setError('Format file tidak didukung. Gunakan PDF, PNG, JPG, Word, atau Excel.');
      return;
    }

    setError(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      onFileUploaded({
        data: base64String,
        mimeType: file.type,
        name: file.name
      });
    };
    reader.onerror = () => {
      setError('Gagal membaca file.');
      setFileName(null);
      onFileUploaded(null);
    };
    reader.readAsDataURL(file);
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
              onFileUploaded(null);
              if (fileInputRef.current) fileInputRef.current.value = '';
            }}
            className="text-red-400 hover:text-red-300 transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>
      
      <div 
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-4 transition-all cursor-pointer flex flex-col items-center justify-center gap-2
          ${fileName ? 'border-red-500/50 bg-red-500/5' : 'border-black hover:border-red-500/50 hover:bg-white/5'}
          ${error ? 'border-red-500/50 bg-red-500/5' : ''}
        `}
      >
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx"
          className="hidden"
        />
        
        {fileName ? (
          <>
            {fileName.endsWith('.pdf') || fileName.includes('.doc') || fileName.includes('.xls') ? (
              <FileText className="text-red-300" size={24} />
            ) : (
              <ImageIcon className="text-red-300" size={24} />
            )}
            <span className="text-xs text-gray-700 font-medium truncate max-w-full px-2">{fileName}</span>
            <span className="text-[10px] text-red-300 font-bold">File siap digunakan</span>
          </>
        ) : (
          <>
            <Upload className="text-gray-500" size={24} />
            <span className="text-xs text-gray-600 font-medium text-center">Klik untuk Upload PDF, Word, Excel, PNG, JPG</span>
          </>
        )}
      </div>
      
      {error && (
        <p className="text-[10px] text-red-400 font-medium">{error}</p>
      )}
    </div>
  );
}
