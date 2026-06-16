import { handleOptions, jsonResponse, errorResponse } from "../lib/helpers";
import type { Bindings } from "../lib/db";

export async function onRequest(context: { request: Request; env: Bindings }) {
  const { request, env } = context;

  if (request.method === "OPTIONS") return handleOptions(env);
  if (request.method !== "POST") return errorResponse("Method not allowed", env, 405);

  try {
    const body = await request.json() as {
      text_model?: string;
      image_model?: string;
      topic?: string;
      time_allocation?: string;
      kelas?: string;
      mapel?: string;
    };

    const { text_model, image_model, topic, time_allocation, kelas, mapel } = body;

    if (!topic || !time_allocation) {
      return errorResponse("Topik dan Alokasi Waktu wajib diisi", env, 400);
    }

    const systemPrompt = [
      "Kamu adalah asisten guru profesional yang berpengalaman membuat Modul Ajar Harian sesuai Kurikulum Merdeka.",
      "Format respons HARUS dalam JSON valid dengan struktur berikut:",
      "{",
      '  "identitas": { "topik": "...", "alokasi_waktu": "...", "kelas": "..." },',
      '  "kompetensi_dasar": "...",',
      '  "tujuan_pembelajaran": ["...", "...", "..."],',
      '  "kegiatan_pembelajaran": {',
      '    "pendahuluan": ["langkah 1...", "langkah 2..."],',
      '    "inti": ["langkah 1...", "langkah 2..."],',
      '    "penutup": ["langkah 1...", "langkah 2..."]',
      "  },",
      '  "media_dan_sumber": ["...", "..."],',
      '  "penilaian": { "teknik": "...", "instrumen": "..." },',
      '  "image_prompts": ["prompt 1 in English", "prompt 2 in English"]',
      "}",
      "JANGAN sertakan teks apapun di luar JSON. Hanya kembalikan JSON murni.",
    ].join("\n");

    const userPrompt = [
      `Buatkan Modul Ajar Harian untuk:`,
      `Topik: ${topic}`,
      `Alokasi Waktu: ${time_allocation}`,
      kelas ? `Kelas: ${kelas}` : "",
      mapel ? `Mata Pelajaran: ${mapel}` : "",
      "",
      `Sertakan 3-5 prompt gambar (dalam bahasa Inggris) yang relevan sebagai ilustrasi terkait topik ini di field "image_prompts".`,
    ].filter(Boolean).join("\n");

    const aiResponse = await fetch("https://gen.pollinations.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.POLLINATIONS_API_KEY}`,
      },
      body: JSON.stringify({
        model: text_model || "openai",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2048,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      return errorResponse(`AI service error: ${aiResponse.status} - ${errText.slice(0, 200)}`, env, 502);
    }

    const aiData = await aiResponse.json() as {
      choices?: Array<{ message?: { content?: string } }>;
      error?: { message: string };
    };

    if (aiData.error) {
      return errorResponse(`AI error: ${aiData.error.message}`, env, 502);
    }

    const rawContent = aiData.choices?.[0]?.message?.content || "";

    let parsedModule: Record<string, unknown>;
    try {
      const cleaned = rawContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsedModule = JSON.parse(cleaned);
    } catch {
      parsedModule = { raw: rawContent, note: "AI response was not valid JSON — raw content provided" };
    }

    const imagePrompts: string[] = (parsedModule.image_prompts as string[]) || [];

    const imageUrls = imagePrompts.map(
      (prompt) => `https://gen.pollinations.ai/image/${encodeURIComponent(prompt)}?model=${image_model || "flux"}`
    );

    return jsonResponse({
      success: true,
      model_used: text_model || "openai",
      modul: parsedModule,
      image_prompts: imagePrompts,
      image_urls: imageUrls,
    }, env);
  } catch (err) {
    return errorResponse(`Internal error: ${err instanceof Error ? err.message : "Unknown"}`, env, 500);
  }
}
