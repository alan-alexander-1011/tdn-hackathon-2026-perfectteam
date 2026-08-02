import { GoogleGenAI } from '@google/genai';

// Reads the key from Vercel env var GEMINI_API_KEY at request time -- never
// hardcode a key in source (the old main.py had one hardcoded, which is why
// it was removed during this migration; rotate that key if it was ever real).
let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY environment variable');
  }
  if (!client) {
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

// gemini-3.5-flash (used in the original main.py) does not exist as a public
// model name -- gemini-2.5-flash is the current fast/cheap model. Override
// with the GEMINI_MODEL env var if you want to point at a different one.
export const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

// Calls Gemini asking for strict JSON output (equivalent to main.py's
// generation_config={"response_mime_type": "application/json"}) and parses it.
export async function generateJSON<T = any>(prompt: string): Promise<T> {
  const ai = getClient();

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error('Gemini trả về phản hồi rỗng');
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error('Không thể phân tích phản hồi JSON từ Gemini: ' + text.slice(0, 300));
  }
}
