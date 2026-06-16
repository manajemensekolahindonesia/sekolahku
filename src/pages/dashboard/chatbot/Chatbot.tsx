import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@/lib/genai';
import Markdown from 'react-markdown';
import Logo from '@/components/Logo';
import { useAuth } from '@/context/AuthContext';
import { loginWithGoogle } from '@/lib/api';

interface Message {
  role: 'user' | 'model';
  text: string;
}

export default function Chatbot({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Halo! 👋 Saya **Pemuryadi Bot**, asisten AI Anda di **Pemuryadi Generator & RuangRiung**. \n\nSaya siap membantu Anda merancang administrasi (Modul Ajar, RPM, dll), merencanakan game edukasi, atau berdiskusi seputar Kurikulum Merdeka.\n\nApa yang ingin kita buat hari ini?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (text: string = input) => {
    if (!text.trim()) return;

    const userMessage = text.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({});
      
      const historyText = messages.map(m => `${m.role === 'user' ? 'User' : 'Bot'}: ${m.text}`).join('\n\n');
      const prompt = `${historyText}\n\nUser: ${userMessage}\n\nBot:`;

      const response = await ai.models.generateContent({
        model: 'openai',
        contents: prompt,
        config: {
          systemInstruction: 'Anda adalah asisten AI resmi dari Pemuryadi Generator & RuangRiung (Cyber Education Workspace). Anda ahli membantu guru di Indonesia dalam menyusun administrasi (Modul Ajar, RPM, Kalender Pendidikan, Prota, Promes, KKTP), membuat game edukatif (Word Search, Crossword, Ranking 1), dan memahami Kurikulum Merdeka. PENTING: Perhatikan konteks singkatan di website ini. RPM adalah "Rencana Pembelajaran Mendalam", BUKAN "Rencana Pekerjaan Mingguan" atau singkatan lain. Prota = Program Tahunan, Promes = Program Semester, KKTP = Kriteria Ketercapaian Tujuan Pembelajaran. Jawab dengan ramah, suportif, informatif, dan selalu arahkan mereka untuk menggunakan fitur-fitur yang tersedia di aplikasi Pemuryadi Generator jika relevan. Gunakan Markdown.',
        }
      });
      
      setMessages(prev => [...prev, { role: 'model', text: response.text || 'Maaf, saya tidak dapat merespons saat ini.' }]);
    } catch (error: any) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { role: 'model', text: error.message || 'Maaf, terjadi kesalahan saat menghubungi server AI.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/60 " onClick={onClose}></div>
      <div className="gen-card relative w-full max-w-md h-[600px] max-h-[80vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 duration-300">
        
        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 p-4 flex items-center justify-between shadow-md z-10">
          <div className="flex items-center gap-3">
            <Logo className="w-10 h-10 rounded-full" />
            <div>
              <h3 className="font-bold text-white">Pemuryadi Bot</h3>
              <p className="text-xs text-blue-100">Cyber Education Assistant</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors">
            ✕
          </button>
        </div>
        
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm'
              }`}>
                <div className={`prose prose-sm max-w-none ${msg.role === 'user' ? 'prose-invert text-white' : 'text-gray-800'}`}>
                  <Markdown>{msg.text}</Markdown>
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-100 text-gray-700 p-3 rounded-2xl rounded-tl-sm flex items-center gap-2 shadow-sm">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm font-medium">Sedang mengetik...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="p-4 border-t border-gray-200 bg-white">
          {!user ? (
            <div className="text-center py-2">
              <p className="text-sm text-gray-600 mb-3">Silakan Login untuk mulai mengobrol dengan AI.</p>
              <button 
                onClick={loginWithGoogle}
                className="w-full py-3 px-4 bg-white border border-gray-300 text-gray-700 rounded-xl flex items-center justify-center gap-2 font-medium shadow-sm hover:bg-gray-50 transition-all hover:shadow-md"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                Login via Google
              </button>
            </div>
          ) : (
            <>
              <div className="flex gap-2 mb-3 overflow-x-auto pb-2 scrollbar-hide">
                {['Ide Game Edukasi', 'Bantu Buat Modul', 'Apa itu RPM?'].map(topic => (
                  <button 
                    key={topic}
                    onClick={() => handleSend(topic)}
                    className="whitespace-nowrap px-3 py-1.5 text-xs rounded-full bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors font-medium"
                  >
                    {topic}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  className="flex-1 bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none" 
                  placeholder="Tanya seputar pendidikan..." 
                />
                <button 
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isLoading}
                  className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition-all shadow-md"
                >
                  Kirim
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
