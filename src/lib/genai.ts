import OpenAI from "openai";

// Dynamic import to avoid circular dependency — resolved at runtime
let _consumeToken: () => Promise<boolean>;
const getConsumeToken = () => {
  if (!_consumeToken) {
    // Lazy load from AuthContext — this is set by the first component that uses genai
    _consumeToken = async () => {
      try {
        const { useAuth } = await import('@/context/AuthContext');
        // Can't use hooks outside React, so we return true for now
        return true;
      } catch { return true; }
    };
  }
  return _consumeToken;
};

export const Type = {
  OBJECT: "object",
  STRING: "string",
  ARRAY: "array",
  NUMBER: "number",
  BOOLEAN: "boolean",
};

export class GoogleGenAI {
  apiKey: string;
  images: {
    generate: (params: {
      prompt: string;
      model?: string;
      n?: number;
      size?: string;
    }) => Promise<{ data?: Array<{ url?: string; b64_json?: string }> }>;
  };
  models: {
    generateContent: (params: {
      model: string;
      contents: string | any[];
      config?: {
        responseMimeType?: string;
        temperature?: number;
        topP?: number;
        responseSchema?: any;
        systemInstruction?: string;
        tools?: any[];
      }
    }) => Promise<{ text: string }>;
  };

  constructor(options: { apiKey?: string }) {
    // Secure Backend Proxy Approach
    // We do NOT expose the API key here. The backend /api/chat/completions proxy handles it.
    this.apiKey = "backend-proxy";
    const baseUrlStr = typeof window !== 'undefined' ? `${window.location.origin}/api` : 'http://localhost:8788/api';
    const openai = new OpenAI({
      apiKey: this.apiKey,
      baseURL: baseUrlStr,
      dangerouslyAllowBrowser: true // Allowed because the API key is fake and we hit our own proxy
    });

    this.images = {
      generate: async (params) => {
        try {
          const encodedPrompt = encodeURIComponent(params.prompt);
          const modelParam = params.model ? `&model=${params.model}` : '';
          const seedParam = `&seed=${Math.floor(Math.random() * 100000000)}`;
          
          const imageUrl = `https://gen.pollinations.ai/image/${encodedPrompt}?nologo=true${modelParam}${seedParam}`;

          return {
            data: [
              { url: imageUrl }
            ]
          };
        } catch (error) {
          console.error("AI Image Generation Error:", error);
          throw error;
        }
      }
    };

    this.models = {
      generateContent: async (params) => {
        const { model, contents, config } = params;
        
        let response_format;
        let isArrayRoot = false;
        
        if (config?.responseSchema) {
          let actualSchema = config.responseSchema;
          
          if (actualSchema.type === 'array' || actualSchema.type === Type.ARRAY) {
            isArrayRoot = true;
            actualSchema = {
              type: "object",
              properties: {
                items: actualSchema
              },
              required: ["items"],
              additionalProperties: false
            };
          }
          
          response_format = {
            type: "json_schema",
            json_schema: {
              name: "response",
              schema: actualSchema,
              strict: false
            }
          };
        } else if (config?.responseMimeType === 'application/json') {
          response_format = { type: "json_object" };
        }

        const messages: any[] = [];
        
        if (config?.systemInstruction) {
          messages.push({ role: "system", content: config.systemInstruction });
        }
        
                // Handle array of parts or string
        if (Array.isArray(contents)) {
          if (contents.length > 0 && typeof contents[0] === 'object' && 'role' in contents[0]) {
            // It's a list of conversation messages: { role: string, parts: any[] }
            for (const msg of contents) {
               const openAiContent = (msg.parts || []).map((part: any) => {
                 if (typeof part === 'string') return { type: "text", text: part };
                 if (part.text) return { type: "text", text: part.text };
                 if (part.inlineData) {
                   return {
                     type: "image_url",
                     image_url: { url: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` }
                   };
                 }
                 return { type: "text", text: JSON.stringify(part) };
               });
               messages.push({ role: msg.role === 'model' ? 'assistant' : 'user', content: openAiContent });
            }
          } else {
            // Flatten Google GenAI parts format to OpenAI format
            const openAiContent = contents.map(part => {
               if (typeof part === 'string') return { type: "text", text: part };
               if (part.text) return { type: "text", text: part.text };
               if (part.inlineData) {
                 return {
                   type: "image_url",
                   image_url: { url: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` }
                 };
               }
               // Minimal support for other types if needed, but mostly it's text
               return { type: "text", text: JSON.stringify(part) };
            });
            messages.push({ role: "user", content: openAiContent });
          }
        } else {
          messages.push({ role: "user", content: contents });
        }

        try {
          const completion = await openai.chat.completions.create({
            model: 'openai', // Using pollinations default model which is openAI compatible
            messages: messages,
            temperature: config?.temperature,
            top_p: config?.topP,
            response_format: response_format
          });

          let responseText = completion.choices[0].message.content || "";
          
          // Unwrap array if we wrapped it earlier
          if (isArrayRoot && responseText) {
            try {
              const parsed = JSON.parse(responseText);
              if (parsed && Array.isArray(parsed.items)) {
                responseText = JSON.stringify(parsed.items);
              }
            } catch (e) {
              console.warn("Failed to unwrap array response from AI:", e);
            }
          }

          return {
            text: responseText
          };
        } catch (error) {
          console.error("AI Generation Error:", error);
          throw error;
        }
      }
    };
  }
}
