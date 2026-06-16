import React, { useState } from 'react';
import { Image, Download, Loader2, FileText, Layout, Map, CreditCard } from 'lucide-react';
import { useToken } from '@/lib/api';
import ModelSelector from '@/components/ModelSelector';

interface AIVisualGeneratorProps {
  context: {
    subject: string;
    topic: string;
    level: string;
    phase: string;
    class: string;
  };
}

type VisualType = 'poster' | 'infographic' | 'mindmap' | 'flashcard';

interface ModelInfo {
  name: string;
  description: string;
}

const VISUAL_TYPES: { id: VisualType; label: string; icon: any; description: string }[] = [
  { id: 'poster', label: 'Poster', icon: Layout, description: 'Poster edukatif yang menarik' },
  { id: 'infographic', label: 'Infografis', icon: FileText, description: 'Visualisasi data dan informasi' },
  { id: 'mindmap', label: 'Mind Map', icon: Map, description: 'Peta konsep materi pembelajaran' },
  { id: 'flashcard', label: 'Flashcard', icon: CreditCard, description: 'Kartu belajar interaktif' },
];

export default function AIVisualGenerator({ context }: AIVisualGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<VisualType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>('flux');

  const generateVisual = async (type: VisualType) => {
    setIsGenerating(true);
    setError(null);
    setSelectedType(type);

    try {
      await useToken(); // Potong token

      const prompt = `Educational ${type} about ${context.subject}: ${context.topic} for ${context.level} students. High quality, clear, modern style. Vibrant colors, no text overlay.`;
      const encodedPrompt = encodeURIComponent(prompt);
      const randomSeed = Math.floor(Math.random() * 1000000);

      const imageUrlStr = `/api/generate-image?prompt=${encodedPrompt}&model=${selectedModel}&seed=${randomSeed}`;

      const imageResponse = await fetch(imageUrlStr);
      if (!imageResponse.ok) {
        throw new Error('Gagal menghasilkan gambar. Silakan coba lagi.');
      }

      const blob = await imageResponse.blob();
      const objectUrl = URL.createObjectURL(blob);
      setGeneratedImage(objectUrl);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Terjadi kesalahan saat menghasilkan gambar.');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `${selectedType}-${context.topic.replace(/\s+/g, '-').toLowerCase()}.png`;
    link.click();
  };


  return (
    <div className="gen-card bg-red-50 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-black">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-red-100 border border-black rounded-xl">
          <Image className="w-6 h-6 text-red-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-black">Media Pembelajaran AI</h2>
          <p className="text-sm text-gray-600">Hasilkan media visual otomatis untuk materi {context.topic}</p>
        </div>
      </div>

      {/* Model Selector */}
      <div className="mb-6">
        <ModelSelector label="Model Gambar AI" modality="image" value={selectedModel} onChange={setSelectedModel} disabled={isGenerating} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {VISUAL_TYPES.map((type) => (
          <button
            key={type.id}
            onClick={() => generateVisual(type.id)}
            disabled={isGenerating}
            className={`flex flex-col items-center gap-3 p-4 rounded-xl border transition-all ${
              selectedType === type.id && !generatedImage
                ? 'bg-red-100 border border-black border-black text-black'
                : 'bg-white border-black text-gray-600 hover:border-slate-500 hover:text-black'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <type.icon className="w-8 h-8" />
            <div className="text-center">
              <div className="text-sm font-semibold">{type.label}</div>
              <div className="text-[10px] opacity-60">{type.description}</div>
            </div>
          </button>
        ))}
      </div>

      {isGenerating && (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <Loader2 className="w-12 h-12 text-red-600 animate-spin" />
          <p className="text-gray-700 animate-pulse">Sedang merancang {selectedType} terbaik untuk Anda...</p>
          <p className="text-xs text-gray-500">Model: {selectedModel}</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400 text-sm text-center">
          {error}
        </div>
      )}

      {generatedImage && !isGenerating && (
        <div className="space-y-4">
          <div className="relative group rounded-2xl overflow-hidden border border-black shadow-2xl">
            <img
              src={generatedImage}
              alt="Generated Visual"
              className="w-full h-auto"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button
                onClick={downloadImage}
                className="p-4 bg-white text-gray-900 rounded-full shadow-xl hover:scale-110 transition-transform"
              >
                <Download className="w-6 h-6" />
              </button>
            </div>
          </div>
          <div className="flex justify-center gap-4">
            <button
              onClick={downloadImage}
              className="flex items-center gap-2 px-6 py-3 bg-red-500 border border-black hover:bg-red-600 text-black rounded-xl font-semibold transition-all shadow-lg shadow-red-500/20"
            >
              <Download className="w-5 h-5" />
              Unduh {selectedType}
            </button>
            <button
              onClick={() => setGeneratedImage(null)}
              className="px-6 py-3 bg-red-100 hover:bg-slate-600 text-black rounded-xl font-semibold transition-all"
            >
              Buat Baru
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
