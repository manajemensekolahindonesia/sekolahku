import React, { useState, useRef } from 'react';
import { 
  Download, Upload, Trash2, Link, FileText, Settings, 
  Image as ImageIcon, CheckCircle, Smartphone, 
  Copy, Check, Share2, ChevronDown, Palette, RefreshCw, 
  Globe, MapPin, MessageCircle
} from 'lucide-react';
import Barcode from 'react-barcode';
import { QRCode } from 'react-qrcode-logo';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocalStorage } from '@/hooks/useLocalStorage';

const PRESETS = [
  { 
    name: 'Digen', 
    url: 'https://digen.id', 
    icon: Globe,
    color: 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20'
  },
  { 
    name: 'WhatsApp', 
    url: 'https://wa.me/6281347697809?text=Halo%20Admin%20Pemuryadi%20Generator!', 
    icon: MessageCircle,
    color: 'bg-green-500/10 text-green-600 hover:bg-green-500/20'
  }
];

const BarcodeGenerator: React.FC = () => {
  const [activeTab, setActiveTab] = useLocalStorage<'qr' | 'barcode'>('BarcodeGenerator_activeTab', 'qr');
  const [inputValue, setInputValue] = useLocalStorage('BarcodeGenerator_inputValue', '');
  const [fgColor, setFgColor] = useLocalStorage('BarcodeGenerator_fgColor', '#000000');
  const [bgColor, setBgColor] = useLocalStorage('BarcodeGenerator_bgColor', '#ffffff');
  const [logoUrl, setLogoUrl] = useLocalStorage<string | null>('BarcodeGenerator_logoUrl', '/favicon.png');
  const [qrStyle, setQrStyle] = useLocalStorage<'squares' | 'dots'>('BarcodeGenerator_qrStyle', 'squares');
  const [eyeRadius, setEyeRadius] = useLocalStorage<number>('BarcodeGenerator_eyeRadius', 0);
  const [isAppearanceOpen, setIsAppearanceOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [logoSize, setLogoSize] = useLocalStorage<number>('BarcodeGenerator_logoSize', 70);

  const containerRef = useRef<HTMLDivElement>(null);

  const defaultValue = "https://digen.id";
  const displayValue = inputValue || defaultValue;

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setLogoUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(displayValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const removeLogo = () => {
    setLogoUrl(null);
  };

  const downloadImage = () => {
    if (!containerRef.current || !inputValue && displayValue === defaultValue) return;
    setIsDownloading(true);
    
    if (activeTab === 'qr') {
      const canvasElement = containerRef.current.querySelector('canvas');
      if (canvasElement) {
        const a = document.createElement("a");
        a.download = `Pemuryadi_QRCode_${Date.now()}.png`;
        a.href = canvasElement.toDataURL("image/png");
        a.click();
      }
    } else {
      const svgElement = containerRef.current.querySelector('svg');
      if (svgElement) {
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();

        const svgSize = svgElement.getBoundingClientRect();
        canvas.width = svgSize.width * 2; // High res
        canvas.height = svgSize.height * 2;

        img.onload = () => {
          if (ctx) {
            ctx.fillStyle = bgColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            const a = document.createElement("a");
            a.download = `Pemuryadi_Barcode_${Date.now()}.png`;
            a.href = canvas.toDataURL("image/png");
            a.click();
          }
        };
        img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
      }
    }
    
    setTimeout(() => setIsDownloading(false), 1000);
  };

  const shareImage = () => {
    if (navigator.share) {
      if (activeTab === 'qr') {
        const canvas = containerRef.current?.querySelector('canvas');
        canvas?.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], "pemuryadi-qr.png", { type: "image/png" });
            navigator.share({
              title: 'QR Code Pemuryadi Generator',
              files: [file],
            }).catch(() => {});
          }
        });
      } else {
        alert("Fitur bagikan otomatis saat ini hanya mendukung QR Code. Silakan unduh Barcode Anda.");
      }
    } else {
      alert("Browser Anda tidak mendukung fitur bagikan otomatis. Silakan unduh gambarnya.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-3xl md:text-4xl font-black mb-3 flex items-center justify-center md:justify-start gap-3 tracking-tight text-gray-900">
          <div className="bg-blue-600 p-2 rounded-xl text-white">
            <Smartphone size={28} />
          </div>
          Generator <span className="text-blue-600 italic">Kode.</span>
        </h1>
        <p className="text-gray-500 max-w-2xl mx-auto md:mx-0">
          Buat QR Code 2D dan Barcode 1D kustom secara gratis. Sesuaikan warna, gaya, hingga logo merek Anda sendiri.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Kolom Kiri: Kontrol (8 grid) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Tabs Navigasi */}
          <div className="flex bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <button
              className={`flex-1 py-4 font-bold flex justify-center items-center gap-2 transition-colors ${activeTab === 'qr' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
              onClick={() => setActiveTab('qr')}
            >
              <Smartphone size={18} />
              QR Code (2D)
            </button>
            <button
              className={`flex-1 py-4 font-bold flex justify-center items-center gap-2 transition-colors ${activeTab === 'barcode' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
              onClick={() => setActiveTab('barcode')}
            >
              <FileText size={18} />
              Barcode (1D)
            </button>
          </div>

          {/* Input Konten */}
          <div className="bg-white border border-gray-100 p-6 sm:p-8 rounded-[2rem] shadow-sm">
            <div className="flex items-center gap-3 mb-6 text-blue-600">
              <div className="bg-blue-50 p-2 rounded-lg">
                <Link size={20} />
              </div>
              <h2 className="font-black uppercase tracking-wider text-sm">Konten {activeTab === 'qr' ? 'QR Code' : 'Barcode'}</h2>
            </div>
            
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Masukkan URL, teks, atau data..."
              className="w-full bg-gray-50 border-2 border-gray-100 p-4 rounded-2xl font-semibold text-gray-800 focus:border-blue-500 outline-none transition-all h-28 resize-none"
            />
            
            <div className="flex flex-wrap items-center justify-between mt-4 gap-4">
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => setInputValue(preset.url)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-transform hover:scale-105 active:scale-95 ${preset.color}`}
                  >
                    <preset.icon size={12} />
                    {preset.name}
                  </button>
                ))}
              </div>
              <button 
                onClick={copyToClipboard}
                className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-gray-700 transition-colors"
              >
                {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                {copied ? 'Tersalin!' : 'Salin Teks'}
              </button>
            </div>
          </div>

          {/* Desain & Warna */}
          <div className="bg-white border border-gray-100 p-6 sm:p-8 rounded-[2rem] shadow-sm overflow-hidden">
            <button 
              onClick={() => setIsAppearanceOpen(!isAppearanceOpen)}
              className="w-full flex items-center justify-between text-blue-600 group"
            >
              <div className="flex items-center gap-3">
                <div className="bg-blue-50 p-2 rounded-lg">
                  <Palette size={20} />
                </div>
                <h2 className="font-black uppercase tracking-wider text-sm">Penampilan & Desain</h2>
              </div>
              <motion.div
                animate={{ rotate: isAppearanceOpen ? 180 : 0 }}
                className="p-1 rounded-full bg-blue-50 group-hover:bg-blue-100 transition-colors"
              >
                <ChevronDown size={18} />
              </motion.div>
            </button>
            
            <AnimatePresence>
              {isAppearanceOpen && (
                <motion.div 
                  initial={{ height: 0, opacity: 0, marginTop: 0 }}
                  animate={{ height: "auto", opacity: 1, marginTop: 24 }}
                  exit={{ height: 0, opacity: 0, marginTop: 0 }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Warna Foreground</label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="color" 
                          value={fgColor} 
                          onChange={(e) => setFgColor(e.target.value)}
                          className="w-12 h-12 rounded-xl cursor-pointer border-0 bg-transparent p-0"
                        />
                        <input 
                          type="text" 
                          value={fgColor} 
                          onChange={(e) => setFgColor(e.target.value)}
                          className="flex-1 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-mono focus:outline-none focus:border-blue-300 font-semibold text-gray-700"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Warna Background</label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="color" 
                          value={bgColor} 
                          onChange={(e) => setBgColor(e.target.value)}
                          className="w-12 h-12 rounded-xl cursor-pointer border-0 bg-transparent p-0"
                        />
                        <input 
                          type="text" 
                          value={bgColor} 
                          onChange={(e) => setBgColor(e.target.value)}
                          className="flex-1 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-mono focus:outline-none focus:border-blue-300 font-semibold text-gray-700"
                        />
                      </div>
                    </div>
                  </div>

                  {activeTab === 'qr' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Gaya Barcode</label>
                        <div className="flex gap-2 bg-gray-50 p-1 rounded-xl border border-gray-100">
                          <button 
                            onClick={() => setQrStyle('squares')}
                            className={`flex-1 py-2 text-xs font-bold transition-all rounded-lg ${qrStyle === 'squares' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                          >
                            Kotak (Squares)
                          </button>
                          <button 
                            onClick={() => setQrStyle('dots')}
                            className={`flex-1 py-2 text-xs font-bold transition-all rounded-lg ${qrStyle === 'dots' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                          >
                            Titik (Dots)
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Kelengkungan Mata</label>
                          <span className="text-[10px] font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">{eyeRadius}px</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" 
                          max="24" 
                          step="4"
                          value={eyeRadius} 
                          onChange={(e) => setEyeRadius(parseInt(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Kustomisasi Logo (Hanya QR) */}
          {activeTab === 'qr' && (
            <div className="bg-white border border-gray-100 p-6 sm:p-8 rounded-[2rem] shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3 text-blue-600">
                  <div className="bg-blue-50 p-2 rounded-lg">
                    <ImageIcon size={20} />
                  </div>
                  <h2 className="font-black uppercase tracking-wider text-sm">Sisipkan Logo</h2>
                </div>
                {logoUrl && (
                  <button 
                    onClick={removeLogo}
                    className="text-xs text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 size={14} /> Hapus Logo
                  </button>
                )}
              </div>

              {!logoUrl ? (
                <div className="border-2 border-dashed border-gray-200 bg-gray-50/50 rounded-2xl p-8 text-center hover:bg-gray-50 hover:border-blue-300 transition-colors group relative">
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/svg+xml"
                    onChange={handleLogoUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="w-14 h-14 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center text-gray-400 group-hover:text-blue-500 transition-colors mx-auto mb-4">
                    <Upload size={24} />
                  </div>
                  <p className="text-sm font-bold text-gray-700">Unggah Gambar Logo</p>
                  <p className="text-xs text-gray-400 mt-2">Mendukung format PNG, JPG, atau SVG</p>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-6 items-center bg-gray-50 p-6 rounded-2xl border border-gray-100">
                  <div className="w-20 h-20 rounded-2xl border border-gray-200 overflow-hidden bg-white shadow-sm flex items-center justify-center p-3 shrink-0">
                    <img src={logoUrl} alt="Logo Preview" className="max-w-full max-h-full object-contain" />
                  </div>
                  <div className="flex-1 w-full space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Ukuran Logo</label>
                      <span className="text-[10px] font-mono bg-white px-2 py-1 rounded shadow-sm text-gray-500">{logoSize}px</span>
                    </div>
                    <input 
                      type="range" 
                      min="40" 
                      max="120" 
                      value={logoSize} 
                      onChange={(e) => setLogoSize(Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <p className="text-[10px] text-amber-500 font-medium">Peringatan: Logo terlalu besar bisa membuat QR sulit dipindai.</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Kolom Kanan: Pratinjau (4 grid) */}
        <div className="lg:col-span-4">
          <div className="sticky top-28 flex flex-col items-center w-full">
            <div className="bg-gray-900 text-white px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-6 shadow-md shadow-gray-900/20">
              Pratinjau Langsung
            </div>

            <motion.div 
              ref={containerRef}
              whileHover={{ scale: 1.02 }}
              className="p-6 sm:p-8 bg-white rounded-[2.5rem] shadow-xl border border-gray-100 relative group overflow-hidden w-full flex justify-center items-center min-h-[300px]"
              style={{ backgroundColor: bgColor }}
            >
              {activeTab === 'qr' ? (
                <QRCode
                  value={displayValue}
                  size={260}
                  fgColor={fgColor}
                  bgColor={bgColor}
                  qrStyle={qrStyle}
                  eyeRadius={eyeRadius}
                  ecLevel="H" 
                  logoImage={logoUrl || undefined}
                  logoWidth={logoUrl ? logoSize : undefined}
                  logoHeight={logoUrl ? logoSize : undefined}
                  removeQrCodeBehindLogo={true}
                />
              ) : (
                <Barcode 
                  value={displayValue} 
                  background={bgColor}
                  lineColor={fgColor}
                  width={2}
                  height={100}
                  fontSize={14}
                  displayValue={true}
                />
              )}
              
              {/* Sudut dekoratif halus */}
              <div className="absolute top-0 left-0 w-16 h-16 border-t-[6px] border-l-[6px] border-gray-100 rounded-tl-[2rem] m-2 pointer-events-none" />
              <div className="absolute bottom-0 right-0 w-16 h-16 border-b-[6px] border-r-[6px] border-gray-100 rounded-br-[2rem] m-2 pointer-events-none" />
            </motion.div>

            <div className="w-full bg-blue-50/50 border border-blue-100 text-blue-700 p-4 rounded-2xl text-xs mt-6 mb-6 leading-relaxed">
              <strong>Info:</strong> Data yang Anda hasilkan tidak disimpan. Anda wajib mengunduh gambar ini karena sistem tidak menyimpannya.
            </div>

            <div className="grid grid-cols-5 gap-3 w-full">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={downloadImage}
                disabled={(!inputValue && displayValue === defaultValue) || isDownloading}
                className="col-span-3 bg-blue-600 text-white py-4 rounded-2xl font-black uppercase text-[11px] tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 disabled:bg-gray-300 disabled:shadow-none"
              >
                {isDownloading ? <RefreshCw size={16} className="animate-spin" /> : <Download size={16} />}
                Unduh Gambar
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={shareImage}
                className="col-span-2 bg-gray-900 text-white py-4 rounded-2xl font-black uppercase text-[11px] tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-gray-900/20"
              >
                <Share2 size={16} />
                Bagikan
              </motion.button>
            </div>
            
          </div>
        </div>

      </div>
    </div>
  );
};

export default BarcodeGenerator;
