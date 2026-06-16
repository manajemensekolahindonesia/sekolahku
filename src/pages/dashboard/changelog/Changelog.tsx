import React, { JSX, useState } from 'react';
import { History, GitCommit, Calendar, Rocket, Sparkles, CheckCircle2, ChevronDown, Lock, Eye, EyeOff, Key } from 'lucide-react';
import changelogData from '@/data/changelog.json';

export default function Changelog() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [visibleCount, setVisibleCount] = useState(5);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    setIsVerifying(true);
    setError(false);

    try {
      const response = await fetch('/api/verify-dev-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      const data = (await response.json()) as { success?: boolean };
      if (response.ok && data.success) {
        setIsAuthenticated(true);
        setError(false);
      } else {
        setError(true);
        setTimeout(() => setError(false), 3000);
      }
    } catch (err) {
      setError(true);
      setTimeout(() => setError(false), 3000);
    } finally {
      setIsVerifying(false);
    }
  };

  const iconMap: Record<string, JSX.Element> = {
    'Rocket': <Rocket className="w-5 h-5 text-blue-600" />,
    'CheckCircle2': <CheckCircle2 className="w-5 h-5 text-gray-500" />,
    'Sparkles': <Sparkles className="w-5 h-5 text-gray-500" />
  };

  const versions = changelogData.map((v) => ({
    ...v,
    icon: iconMap[v.icon] || <CheckCircle2 className="w-5 h-5 text-gray-500" />
  }));

  if (!isAuthenticated) {
    return (
      <div className="max-w-lg mx-auto pb-12 pt-16 px-4 animate-in fade-in zoom-in-95 duration-500">
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
          <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner border border-blue-100 transform rotate-3">
            <Lock size={36} strokeWidth={2.5} className="-rotate-3" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2 tracking-tight">Akses Terkunci</h2>
          <p className="text-gray-500 mb-8 text-sm sm:text-base font-medium">Halaman Riwayat Versi ini dikhususkan untuk tim pengembang. Masukkan sandi keamanan untuk melihat changelog.</p>
          
          <form onSubmit={handleLogin} className="space-y-5 text-left">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Key size={20} className={`transition-colors ${error ? 'text-red-400' : 'text-gray-400 group-focus-within:text-blue-500'}`} />
              </div>
              <input 
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi..."
                className={`w-full pl-12 pr-12 py-3.5 rounded-2xl border-2 ${error ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-100' : 'border-gray-100 bg-gray-50 focus:border-blue-500 focus:bg-white focus:ring-blue-100'} focus:ring-4 transition-all outline-none font-bold text-gray-800 placeholder:font-normal placeholder:text-gray-400`}
                autoFocus
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {error && <p className="text-red-500 text-xs font-bold px-1 animate-pulse">Kata sandi yang Anda masukkan salah!</p>}
            <button 
              type="submit"
              disabled={isVerifying || !password}
              className="w-full bg-gray-900 hover:bg-black text-white font-black py-3.5 rounded-2xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 flex justify-center items-center gap-2 tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isVerifying ? 'Memverifikasi...' : 'Buka Akses'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-12">
      {/* Header Section - Clean & Lightweight */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-100 p-6 sm:p-8 rounded-t-3xl sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <History size={26} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900">Riwayat Versi</h1>
            <p className="text-sm text-gray-500 mt-1 font-medium">Catatan rilis resmi yang mendokumentasikan pembaruan fitur, optimalisasi, dan perbaikan sistem <a href="https://digen.id" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-semibold transition-colors">digen.id</a>.</p>
          </div>
        </div>
      </div>

      {/* Timeline Section */}
      <div className="bg-white px-6 sm:px-10 py-8 rounded-b-3xl border border-t-0 border-gray-100 shadow-sm">
        <div className="relative border-l-2 border-gray-100/80 ml-3 sm:ml-4 space-y-12 pb-8">
          
          {versions.slice(0, visibleCount).map((ver, idx) => {
            const isLatest = idx === 0;
            return (
              <div key={ver.version} className="relative group pl-8 sm:pl-10">
                {/* Timeline Icon / Dot */}
                <div className={`absolute -left-[17px] top-0 flex items-center justify-center w-8 h-8 rounded-full border-[3px] bg-white transition-transform duration-300 ${isLatest ? 'border-blue-100 scale-110' : 'border-gray-50 group-hover:scale-110'}`}>
                  {ver.icon}
                </div>
                
                {/* Version Title & Meta */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-4">
                  <h2 className={`text-xl sm:text-2xl font-extrabold tracking-tight ${isLatest ? 'text-blue-700' : 'text-gray-800'}`}>
                    Versi {ver.version}
                  </h2>
                  <div className="flex items-center gap-3">
                    {ver.badge && (
                      <span className="text-[10px] uppercase tracking-widest font-bold px-2.5 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-sm">
                        {ver.badge}
                      </span>
                    )}
                    <span className="text-xs sm:text-sm font-semibold text-gray-400 flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-md">
                      <Calendar size={14} className="text-gray-400" /> {ver.date}
                    </span>
                  </div>
                </div>

                {/* Commits List */}
                <div className="space-y-3">
                  {ver.commits.map((commit, cIdx) => {
                    // Parse markdown link syntax: [text](url)
                    const renderText = (text: string) => {
                      const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
                      const parts = [];
                      let lastIndex = 0;
                      let match;
                      
                      while ((match = linkRegex.exec(text)) !== null) {
                        if (match.index > lastIndex) {
                          parts.push(text.substring(lastIndex, match.index));
                        }
                        parts.push(
                          <a key={`${cIdx}-${match.index}`} href={match[2]} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 hover:underline font-semibold transition-colors">
                            {match[1]}
                          </a>
                        );
                        lastIndex = match.index + match[0].length;
                      }
                      
                      if (lastIndex < text.length) {
                        parts.push(text.substring(lastIndex));
                      }
                      
                      return parts.length > 0 ? parts : text;
                    };

                    return (
                      <div key={cIdx} className="flex gap-3 items-start">
                        <GitCommit size={18} className={`mt-0.5 shrink-0 ${isLatest ? 'text-blue-400' : 'text-gray-300'}`} />
                        <p className={`text-sm leading-relaxed ${isLatest ? 'text-gray-700 font-medium' : 'text-gray-600'}`}>
                          {renderText(commit)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

        </div>

        {/* Load More Button */}
        {visibleCount < versions.length && (
          <div className="flex justify-center mt-8 pt-4">
            <button 
              onClick={() => setVisibleCount(prev => prev + 5)}
              className="px-6 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold rounded-full transition-colors duration-200 flex items-center gap-2 group"
            >
              Muat Lebih Banyak
              <ChevronDown size={18} className="group-hover:translate-y-0.5 transition-transform" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
