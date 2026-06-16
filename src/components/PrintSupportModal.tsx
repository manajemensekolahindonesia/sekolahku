import React from 'react';
import { FaHeart, FaCoffee, FaFacebook, FaInstagram, FaTiktok } from 'react-icons/fa';

interface PrintSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function PrintSupportModal({ isOpen, onClose, onConfirm }: PrintSupportModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 " onClick={onClose}></div>
      <div className="gen-card relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <div className="absolute top-[-10%] left-[-10%] w-40 h-40 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-40 h-40 bg-blue-400 rounded-full blur-3xl"></div>
          </div>
          
          <div className="relative z-10">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3 shadow-inner ">
              🖨️
            </div>
            <h2 className="text-2xl font-bold text-black mb-1">Siap untuk Mencetak?</h2>
            <p className="text-blue-100 text-xs">Terima kasih telah menggunakan layanan Pemuryadi!</p>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div className="gen-card bg-red-50 rounded-2xl p-3 space-y-2">
            <div className="flex items-center gap-2 text-pink-400">
              <FaHeart className="fill-current" size={18} />
              <h3 className="font-bold text-sm">Dukung Pemuryadi</h3>
            </div>
            <p className="text-gray-700 text-[10px] leading-relaxed">
              Website ini dikembangkan secara mandiri untuk membantu rekan-rekan guru di seluruh Indonesia. 
              Dukungan Anda sangat berarti agar saya bisa terus merawat dan meningkatkan fitur-fitur di sini.
            </p>
            
            <a 
              href="https://saweria.co/pemuryadi" 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-400 hover:to-yellow-400 text-black font-bold rounded-xl transition-all shadow-lg shadow-orange-500/20 group text-xs"
            >
              <FaCoffee size={16} className="group-hover:animate-bounce" />
              <span>Dukung via Saweria</span>
            </a>
          </div>

          <div className="space-y-2">
            <p className="text-center text-[9px] text-gray-500 uppercase tracking-widest font-bold">Ikuti Media Sosial Kami</p>
            <div className="flex justify-center gap-2">
              <a href="https://www.facebook.com/p.e.muryadi" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-black hover:scale-110 transition-transform shadow-md">
                <FaFacebook size={16} />
              </a>
              <a href="https://www.instagram.com/p.e.muryadi" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-black hover:scale-110 transition-transform shadow-md">
                <FaInstagram size={16} />
              </a>
              <a href="https://www.tiktok.com/@p.e.muryadi" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg bg-black border border-black flex items-center justify-center text-black hover:scale-110 transition-transform shadow-md">
                <FaTiktok size={16} />
              </a>
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button 
              onClick={onClose}
              className="flex-1 py-2 px-4 rounded-xl border border-black text-gray-600 font-medium hover:bg-red-50 transition-colors text-xs"
            >
              Batal
            </button>
            <button 
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="flex-[2] py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-black font-bold transition-all shadow-lg shadow-blue-600/20 text-xs"
            >
              Lanjutkan Mencetak
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
