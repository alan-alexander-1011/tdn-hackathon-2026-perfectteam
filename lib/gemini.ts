import { GoogleGenAI } from '@google/genai';

// Reads the key from Vercel env var GEMINI_API_KEY at request time -- never
// hardcode a key in source (the old main.py had one hardcoded and checked
// into git, which is a real leaked credential -- rotate/delete that key in
// Google AI Studio regardless of whether it currently works).
let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new GeminiError(
      'MISSING_KEY',
      'Chưa cấu hình GEMINI_API_KEY trên server (Vercel/env local).'
    );
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

export type GeminiErrorCode = 'MISSING_KEY' | 'BAD_KEY_TYPE' | 'UPSTREAM' | 'EMPTY' | 'PARSE';

export class GeminiError extends Error {
  code: GeminiErrorCode;
  constructor(code: GeminiErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = 'GeminiError';
  }
}

// Turns whatever the SDK/fetch throws into a GeminiError with a message that
// actually tells you what to do next, instead of a raw stack trace.
function normalizeError(err: any): GeminiError {
  const raw = typeof err?.message === 'string' ? err.message : String(err);

  // This is the specific failure currently being reported: Google AI Studio
  // has been issuing "AQ."-prefixed keys (instead of the classic "AIza..."
  // format) that the generativelanguage.googleapis.com REST API rejects with
  // 401 ACCESS_TOKEN_TYPE_UNSUPPORTED, as if an OAuth token were expected
  // instead of an API key. This is a known, currently-unresolved issue on
  // Google's side (see https://discuss.ai.google.dev, search
  // "ACCESS_TOKEN_TYPE_UNSUPPORTED AQ"), not a bug in this app's code.
  if (raw.includes('ACCESS_TOKEN_TYPE_UNSUPPORTED') || raw.includes('Expected OAuth 2 access token')) {
    return new GeminiError(
      'BAD_KEY_TYPE',
      'Gemini API key bị Google từ chối (lỗi ACCESS_TOKEN_TYPE_UNSUPPORTED). ' +
        'Đây thường là do khoá được cấp ở định dạng mới "AQ." — hiện đang bị lỗi phía Google ' +
        'với endpoint generativelanguage.googleapis.com. Cách khắc phục: vào https://aistudio.google.com/apikey, ' +
        'tạo lại khoá (Create API key) ở một project khác/mới, kiểm tra khoá có bắt đầu bằng "AIza"; ' +
        'nếu khoá mới vẫn ra "AQ." và vẫn lỗi, đây là sự cố tài khoản/Google đang được nhiều người báo cáo, ' +
        'cần chờ Google xử lý hoặc liên hệ Google AI Studio support.'
    );
  }

  return new GeminiError('UPSTREAM', raw || 'Gemini API request failed');
}

// Calls Gemini asking for strict JSON output (equivalent to main.py's
// generation_config={"response_mime_type": "application/json"}) and parses it.
// Throws GeminiError on any failure -- callers should catch this and degrade
// gracefully (AI insights are a nice-to-have, not a hard dependency for
// routing/reporting to work).
export async function generateJSON<T = any>(prompt: string): Promise<T> {
  const ai = getClient();

  let response;
  try {
    response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });
  } catch (err) {
    throw normalizeError(err);
  }

  const text = response.text;
  if (!text) {
    throw new GeminiError('EMPTY', 'Gemini trả về phản hồi rỗng');
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new GeminiError('PARSE', 'Không thể phân tích phản hồi JSON từ Gemini: ' + text.slice(0, 300));
  }
}
