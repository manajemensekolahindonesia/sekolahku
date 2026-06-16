import type { AIModel } from "@/types";

export interface GenerateModulRequest {
  text_model: string;
  image_model: string;
  topic: string;
  time_allocation: string;
  kelas?: string;
  mapel?: string;
}

export interface ModulResponse {
  success: boolean;
  model_used: string;
  modul: {
    identitas?: { topik: string; alokasi_waktu: string; kelas?: string };
    kompetensi_dasar?: string;
    tujuan_pembelajaran?: string[];
    kegiatan_pembelajaran?: {
      pendahuluan: string[];
      inti: string[];
      penutup: string[];
    };
    media_dan_sumber?: string[];
    penilaian?: { teknik: string; instrumen: string };
    image_prompts?: string[];
    raw?: string;
    note?: string;
  };
  image_prompts: string[];
  image_urls: string[];
}

export interface ModelsResponse {
  success: boolean;
  models: AIModel[];
}

const API_BASE = "/api";

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error((err as { error: string }).error || `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export async function fetchTextModels(): Promise<AIModel[]> {
  const data = await request<ModelsResponse>("/models-text");
  return data.models || [];
}

export async function fetchImageModels(): Promise<AIModel[]> {
  const data = await request<ModelsResponse>("/models-image");
  return data.models || [];
}

export async function generateModul(payload: GenerateModulRequest): Promise<ModulResponse> {
  return request<ModulResponse>("/generate-modul", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getImageUrl(prompt: string, model: string): string {
  return `https://gen.pollinations.ai/image/${encodeURIComponent(prompt)}?model=${model}`;
}
