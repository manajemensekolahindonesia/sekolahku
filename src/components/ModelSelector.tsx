import React, { useState, useEffect } from 'react';
import { Sparkles, ChevronDown } from 'lucide-react';

interface ModelInfo {
  name: string;
  description: string;
}

interface ModelSelectorProps {
  modality?: 'text' | 'image';
  value: string;
  onChange: (model: string) => void;
  disabled?: boolean;
  label?: string;
}

export default function ModelSelector({ modality = 'text', value, onChange, disabled, label = 'Model AI' }: ModelSelectorProps) {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [loading, setLoading] = useState(true);

  // Default fallback models
  const defaultTextModels: ModelInfo[] = [
    { name: 'openai', description: 'GPT-5.4 Nano - Fast & Balanced' },
    { name: 'openai-large', description: 'GPT-5.4 - Most Powerful & Intelligent' },
    { name: 'deepseek', description: 'DeepSeek V4 Flash - Fast Reasoning' },
    { name: 'gemma', description: 'Gemma 4 26B - Open-source, fast inference' },
    { name: 'mistral', description: 'Mistral Small 3.2 - Multilingual' },
    { name: 'claude-fast', description: 'Claude Haiku 4.5 - Fast & Intelligent' },
    { name: 'qwen-large', description: 'Qwen3.6 Plus - 396B MoE Flagship' },
  ];

  const defaultImageModels: ModelInfo[] = [
    { name: 'flux', description: 'Flux Schnell - Fast high-quality image generation' },
    { name: 'zimage', description: 'Z-Image Turbo - Fast 6B Flux with 2x upscaling' },
    { name: 'gptimage', description: 'GPT Image 1 Mini - Fast & affordable' },
    { name: 'gptimage-large', description: 'GPT Image 1.5 - High-fidelity generation' },
    { name: 'klein', description: 'FLUX.2 Klein 4B - Fast generation and editing' },
    { name: 'qwen-image', description: 'Qwen Image Plus - Text-to-image and editing' },
    { name: 'nova-canvas', description: 'Nova Canvas - Image generation & inpainting' },
    { name: 'wan-image', description: 'Wan 2.7 Image - Text-to-image up to 2K' },
  ];

  const valueRef = React.useRef(value);
  
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    let isMounted = true;
    const defaults = modality === 'image' ? defaultImageModels : defaultTextModels;
    setModels(defaults);

    fetch(`https://gen.pollinations.ai/models`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data: any[]) => {
        if (!isMounted || !Array.isArray(data)) return;
        
        // Filter out by category ('text' or 'image')
        const filteredData = data.filter(m => m.category === modality || (modality === 'text' && !m.category));
        
        const mapped = filteredData.map(m => {
          if (typeof m === 'string') {
            return { name: m, description: m };
          }
          return { name: m?.name || '', description: m?.description || m?.name || '' };
        }).filter(m => m.name);

        if (mapped.length > 0) {
          setModels(mapped);
          // Set default to first if current not in list using fresh value
          if (!mapped.some(m => m.name === valueRef.current)) {
            onChange(mapped[0].name);
          }
        }
      })
      .catch((e) => {
        if (isMounted) {
          console.error("Failed to fetch models from", `https://gen.pollinations.ai/models`, e);
          // Defaults are already set
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [modality]);

  const selectedInfo = models.find(m => m.name === value);

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-gray-600 flex items-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5 text-red-500" />
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled || loading}
          className="w-full appearance-none bg-white text-black text-sm rounded-lg px-3 py-2 pr-8 border border-black outline-none focus:border-black transition-colors disabled:opacity-50 cursor-pointer"
        >
          {models.map(m => (
            <option key={m.name} value={m.name}>{m.name}</option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
      </div>
      {selectedInfo && (
        <p className="text-[11px] text-gray-500 italic truncate">{selectedInfo.description}</p>
      )}
    </div>
  );
}
