import React, { useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface LogoUploaderProps {
  useLogo: boolean;
  setUseLogo: (val: boolean) => void;
  logoUrl: string | null;
  setLogoUrl: (val: string | null) => void;
}

export default function LogoUploader({ useLogo, setUseLogo, logoUrl, setLogoUrl }: LogoUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Mohon upload file gambar yang valid.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-3 mt-4 mb-2">
      <label className="flex items-center gap-2 cursor-pointer">
        <input 
          type="checkbox" 
          checked={useLogo}
          onChange={(e) => setUseLogo(e.target.checked)}
          className="w-4 h-4 rounded border-gray-300 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-white bg-white"
        />
        <span className="text-sm font-medium text-gray-700">Gunakan Logo Sekolah</span>
      </label>

      {useLogo && (
        <div className="p-4 border border-dashed border-cyan-300 bg-cyan-50/50 rounded-xl relative overflow-hidden transition-all">
          {!logoUrl ? (
            <div className="flex flex-col items-center justify-center text-center py-4">
              <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center text-cyan-600 mb-3">
                <Upload size={24} />
              </div>
              <p className="text-sm font-medium text-gray-700 mb-1">Upload Logo Sekolah</p>
              <p className="text-xs text-gray-500 mb-4">Format: JPG, PNG, atau SVG (Maks. 2MB)</p>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-cyan-600 font-medium text-sm rounded-lg transition-colors flex items-center gap-2 shadow-sm"
              >
                <ImageIcon size={16} /> Pilih File
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white border border-gray-200 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center p-1">
                <img src={logoUrl} alt="Logo Sekolah" className="max-w-full max-h-full object-contain" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700">Logo berhasil diupload</p>
                <p className="text-xs text-gray-500 mt-1">Logo ini akan ditampilkan di kop dokumen saat dicetak.</p>
              </div>
              <button 
                onClick={() => { setLogoUrl(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Hapus Logo"
              >
                <X size={20} />
              </button>
            </div>
          )}
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
        </div>
      )}
    </div>
  );
}
