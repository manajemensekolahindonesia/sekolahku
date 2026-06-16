import React, { useState } from 'react';
import { GoogleGenAI } from '@/lib/genai';
import { Sparkles, Loader2 } from 'lucide-react';

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  onValueChange?: (value: string) => void;
  contextPrompt?: string;
}

export default function AIAssistedInput({ onValueChange, contextPrompt, className = '', placeholder, onChange, ...props }: Props) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    
    try {
      const ai = new GoogleGenAI({});
      const promptContext = contextPrompt || placeholder || 'ide acak yang sesuai untuk form pendidikan';
      
      const randomSeed = Math.floor(Math.random() * 10000);
      const prompt = `Berikan 1 contoh isian acak, unik, kreatif, dan relevan untuk input dengan konteks: "${promptContext}". 
Pastikan ide ini berbeda dari yang biasa muncul (Seed: ${randomSeed}).
Jawab LANGSUNG dengan isinya saja (maksimal 5-7 kata), tanpa tanda kutip, tanpa kata pengantar, tanpa penjelasan.`;

      const response = await ai.models.generateContent({
        model: 'openai',
        contents: prompt,
        config: {
          temperature: 0.9,
          systemInstruction: 'Anda adalah asisten pendidikan pembuat ide kreatif. Berikan ide yang selalu bervariasi, super singkat, dan langsung pada intinya.',
        }
      });
      
      let result = response.text?.trim() || '';
      // Clean up common AI artifacts
      result = result.replace(/^["']|["']$/g, '');
      
      if (onValueChange) {
        onValueChange(result);
      } else if (onChange) {
        // Fallback if no explicit onValueChange is provided, we try to trigger onChange directly
        // Note: In React, directly calling onChange with a fake event is tricky.
        // It's highly recommended to pass onValueChange for custom components.
        const e = {
          target: { value: result }
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(e);
      }
    } catch (error) {
      console.error('Error generating AI suggestion:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="relative w-full group">
      <input 
        className={`w-full ${className} pr-12`} 
        placeholder={placeholder}
        onChange={(e) => {
          if (onValueChange) onValueChange(e.target.value);
          if (onChange) onChange(e);
        }}
        {...props} 
      />
      <button
        type="button"
        onClick={handleGenerate}
        disabled={isGenerating}
        title="Bantu isi dengan AI"
        className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 hover:text-blue-600 disabled:opacity-50 transition-all opacity-70 hover:opacity-100 bg-white/80 rounded-full p-1 shadow-sm border border-blue-100 hover:scale-110 active:scale-95"
      >
        {isGenerating ? (
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
        ) : (
          <Sparkles className="w-4 h-4" />
        )}
      </button>
    </div>
  );
}
