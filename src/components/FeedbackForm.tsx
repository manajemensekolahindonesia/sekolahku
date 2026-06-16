import React, { useState } from 'react';
import { Star, Send, MessageSquarePlus, X } from 'lucide-react';
import AIAssistedTextarea from '@/components/AIAssistedTextarea';
import { useAuth } from '@/context/AuthContext';

interface FeedbackFormProps {
  inline?: boolean;
}

export default function FeedbackForm({ inline = false }: FeedbackFormProps) {
  const { profile } = useAuth();
  const [isOpen, setIsOpen] = useState(inline);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0 && !feedback.trim()) return;
    
    const userName = profile?.nama || profile?.displayName || profile?.email || 'Guest';
    const message = `Hallo Admin Pemuryadi Generator,\n\nSaya ingin memberikan Masukan & Saran:\n\n*Nama:* ${userName}\n*Rating:* ${rating} dari 5 Bintang\n*Pesan:* ${feedback.trim()}`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/6281347697809?text=${encodedMessage}`, '_blank');
    
    setSubmitted(true);
    setRating(0);
    setFeedback('');
  };

  if (!isOpen && !inline) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg hover:shadow-blue-500/25 transition-all hover:-translate-y-1 flex items-center gap-2"
        title="Beri Masukan"
      >
        <MessageSquarePlus size={20} />
      </button>
    );
  }

  const containerClasses = inline 
    ? "w-full bg-transparent" 
    : "fixed bottom-4 right-4 z-50 w-[260px] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200";

  return (
    <div className={containerClasses}>
      {!inline && (
        <div className="bg-slate-800 px-3 py-2 flex items-center justify-between border-b border-slate-700">
          <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
            <MessageSquarePlus size={14} className="text-blue-400" />
            Beri Masukan
          </h3>
          <button 
            onClick={() => setIsOpen(false)}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {inline && (
        <h3 className="text-lg font-bold text-cyber-blue mb-4 flex items-center gap-2">
          <MessageSquarePlus size={20} className="text-cyber-blue" />
          Feedback & Suggestions
        </h3>
      )}

      <div className={inline ? "" : "p-3"}>
        {submitted ? (
          <div className="text-center py-3">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-emerald-400 text-lg">✓</span>
            </div>
            <h4 className="text-xs font-bold text-white mb-1">Terima Kasih!</h4>
            <p className="text-[10px] text-slate-400 mb-3">Masukan Anda sangat berharga bagi kami.</p>
            <button 
              onClick={() => setSubmitted(false)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-medium rounded-lg transition-colors w-full"
            >
              Kirim Lagi
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
            <div className="flex flex-col items-center gap-1 mb-1">
              <span className="text-[10px] text-slate-400">Bagaimana pengalaman Anda?</span>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className="focus:outline-none transition-transform hover:scale-110 p-0.5"
                    onMouseEnter={() => setHover(star)}
                    onMouseLeave={() => setHover(0)}
                    onClick={() => setRating(star)}
                  >
                    <Star 
                      size={20} 
                      strokeWidth={1.5}
                      className={`transition-colors duration-200 ${
                        star <= (hover || rating) 
                          ? 'fill-amber-400 text-amber-400' 
                          : 'fill-slate-800 text-slate-600 hover:text-slate-500'
                      }`} 
                    />
                  </button>
                ))}
              </div>
            </div>

            <AIAssistedTextarea
              rows={3}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Tambahkan masukan atau saran..."
              contextPrompt="Berikan contoh kalimat masukan (feedback) atau saran dari seorang guru/pengguna terkait fitur atau desain aplikasi pendidikan ini."
              className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2 text-black placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-y min-h-[80px] text-[11px] leading-relaxed transition-colors"
            />

            <button
              type="submit"
              disabled={rating === 0 && !feedback.trim()}
              className="w-full flex items-center justify-center gap-1.5 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white text-[11px] font-bold rounded-xl transition-all"
            >
              <Send size={12} />
              Kirim Masukan
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
