import React, { useState, useEffect } from 'react';
import { User, Shield, Save, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { updateProfile } from '@/lib/api';
import AIAssistedInput from '@/components/AIAssistedInput';
import LogoUploader from '@/components/LogoUploader';

export default function QuickProfile() {
  const { user, profile, refreshProfile } = useAuth();
  const [isExpanded, setIsExpanded] = useState(true);
  const [formData, setFormData] = useState({
    displayName: '',
    nip: '',
    jenjang: 'SD',
    tahunPelajaran: '2025/2026',
    namaSekolah: '',
    kepalaSekolah: '',
    jenisNipKepalaSekolah: 'NIP',
    nipKepalaSekolah: '',
    logoUrl: null as string | null
  });
  const [useLogo, setUseLogo] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        displayName: profile.displayName || '',
        nip: profile.nip || '',
        jenjang: profile.jenjang || 'SD',
        tahunPelajaran: profile.tahunPelajaran || '2025/2026',
        namaSekolah: profile.namaSekolah || '',
        kepalaSekolah: profile.kepalaSekolah || '',
        jenisNipKepalaSekolah: profile.jenisNipKepalaSekolah || 'NIP',
        nipKepalaSekolah: profile.nipKepalaSekolah || '',
        logoUrl: profile.logoUrl || null
      });
      if (profile.logoUrl) {
        setUseLogo(true);
      }
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user) {
      alert('Silakan login terlebih dahulu untuk menyimpan profil.');
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile(user.uid, formData);
      if (typeof refreshProfile === 'function') {
        await refreshProfile();
      }
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error(error);
      alert('Gagal menyimpan profil.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white border border-red-100 shadow-sm rounded-2xl w-full flex flex-col transition-all">
      <div 
        className="flex items-center gap-2 p-5 cursor-pointer hover:bg-red-50/50 transition-colors shrink-0"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <User size={18} className="text-red-500" />
        <h3 className="text-sm font-bold text-red-500 uppercase tracking-widest">Identitas Profil</h3>
        {['owner', 'admin'].includes(profile?.role?.toLowerCase()) && <Shield size={14} className="text-red-200 ml-2" />}
        <div className="ml-auto">
          {isExpanded ? <ChevronUp size={18} className="text-red-400" /> : <ChevronDown size={18} className="text-red-400" />}
        </div>
      </div>

      {isExpanded && (
        <div className="p-6 pt-0 flex flex-col flex-1 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-[10px] text-gray-500 uppercase font-bold mb-1.5">Nama Lengkap Guru</label>
                <AIAssistedInput type="text" 
                  value={formData.displayName}
                  onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-black focus:border-red-500 focus:bg-white outline-none transition-all"
                  placeholder="Nama Lengkap"
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-500 uppercase font-bold mb-1.5">NIP / NUPTK</label>
                <AIAssistedInput type="text" 
                  value={formData.nip}
                  onChange={(e) => setFormData({...formData, nip: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-black focus:border-red-500 focus:bg-white outline-none transition-all"
                  placeholder="NIP"
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-500 uppercase font-bold mb-1.5">Tahun Pelajaran</label>
                <AIAssistedInput type="text" 
                  value={formData.tahunPelajaran}
                  onChange={(e) => setFormData({...formData, tahunPelajaran: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-black focus:border-red-500 focus:bg-white outline-none transition-all"
                  placeholder="2025/2026"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] text-gray-500 uppercase font-bold mb-1.5">Nama Sekolah</label>
                <AIAssistedInput type="text" 
                  value={formData.namaSekolah}
                  onChange={(e) => setFormData({...formData, namaSekolah: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-black focus:border-red-500 focus:bg-white outline-none transition-all"
                  placeholder="Contoh: SDN 1 Gresik"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] text-gray-500 uppercase font-bold mb-1.5">Kepala Sekolah</label>
                <AIAssistedInput type="text" 
                  value={formData.kepalaSekolah}
                  onChange={(e) => setFormData({...formData, kepalaSekolah: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-black focus:border-red-500 focus:bg-white outline-none transition-all"
                  placeholder="Nama Lengkap Kepala Sekolah"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] text-gray-500 uppercase font-bold mb-1.5">Nomor Induk Kepala Sekolah</label>
                <div className="flex gap-2">
                  <select 
                    value={formData.jenisNipKepalaSekolah}
                    onChange={(e) => setFormData({...formData, jenisNipKepalaSekolah: e.target.value})}
                    className="w-1/3 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-black focus:border-red-500 focus:bg-white outline-none transition-all"
                  >
                    <option value="NIP">NIP</option>
                    <option value="NUPTK">NUPTK</option>
                    <option value="NIY">NIY</option>
                    <option value="NRG">NRG</option>
                    <option value="NPK">NPK</option>
                  </select>
                  <AIAssistedInput type="text" 
                    value={formData.nipKepalaSekolah}
                    onChange={(e) => setFormData({...formData, nipKepalaSekolah: e.target.value})}
                    className="w-2/3 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-black focus:border-red-500 focus:bg-white outline-none transition-all"
                    placeholder="Nomor Induk"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-gray-500 uppercase font-bold mb-1.5">Jenjang</label>
                <select 
                  value={formData.jenjang}
                  onChange={(e) => setFormData({...formData, jenjang: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-black focus:border-red-500 focus:bg-white outline-none transition-all"
                >
                  <option value="PAUD/TK">PAUD/TK</option>
                  <option value="SD">SD</option>
                  <option value="SMP">SMP</option>
                  <option value="SMA">SMA</option>
                  <option value="SMK">SMK</option>
                </select>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-2">
              <LogoUploader 
                useLogo={useLogo} 
                setUseLogo={(val) => {
                  setUseLogo(val);
                  if (!val) setFormData({...formData, logoUrl: null});
                }} 
                logoUrl={formData.logoUrl} 
                setLogoUrl={(val) => setFormData({...formData, logoUrl: val})} 
              />
            </div>
          </div>

          <div className="flex flex-col mt-4 pt-4 border-t border-red-500/10 shrink-0">
            <button 
              onClick={handleSave}
              disabled={isSaving || !user}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                showSuccess 
                  ? 'bg-red-300 text-black' 
                  : 'bg-red-50 text-red-600 hover:bg-red-500 hover:text-white border border-red-200'
              } ${(!user || isSaving) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isSaving ? (
                <span className="animate-spin">⏳</span>
              ) : showSuccess ? (
                <><CheckCircle size={14} /> Tersimpan</>
              ) : (
                <><Save size={14} /> Simpan</>
              )}
            </button>
            {!user && (
              <p className="text-[9px] text-red-400 mt-2 italic text-center animate-pulse">
                Silakan login untuk menyimpan identitas secara permanen.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
