import { LIVE_EXPRESSIONS, type LiveExpression } from 'mesh-avatar';

export type NanoLanguage = 'vi' | 'en' | 'ja';
export type NanoAvailability = 'available' | 'downloadable' | 'downloading' | 'unavailable';

export interface NanoReply {
  expression: LiveExpression;
  text: string;
  source: 'gemini-nano' | 'local';
}

interface PromptMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface DownloadProgressEvent {
  loaded?: number;
  total?: number;
}

interface DownloadMonitor {
  addEventListener(type: 'downloadprogress', listener: (event: DownloadProgressEvent) => void): void;
}

interface NanoSession {
  prompt(input: string, options?: { signal?: AbortSignal }): Promise<string>;
  promptStreaming?(input: string, options?: { signal?: AbortSignal }): AsyncIterable<string> | ReadableStream<string>;
  destroy?(): void;
  inputUsage?: number;
  inputQuota?: number;
}

interface ModernLanguageModelAPI {
  availability?(options?: Record<string, unknown>): Promise<string>;
  params?(): Promise<{ defaultTemperature?: number; maxTemperature?: number; defaultTopK?: number; maxTopK?: number }>;
  create(options?: Record<string, unknown>): Promise<NanoSession>;
}

interface LegacyLanguageModelAPI {
  capabilities?(): Promise<{ available?: string; defaultTemperature?: number; defaultTopK?: number }>;
  create(options?: Record<string, unknown>): Promise<NanoSession>;
}

type GlobalWithAI = typeof globalThis & {
  LanguageModel?: ModernLanguageModelAPI;
  ai?: { languageModel?: LegacyLanguageModelAPI };
};

// Tuned specifically for small on-device Gemini Nano models to stay strictly in natural,
// properly accented Vietnamese, concise for smooth lip sync, and reliable with expression tags.
const SYSTEM_PROMPTS: Record<NanoLanguage, string> = {
  vi: [
    'Bạn là Miko, một nhân vật avatar 2D thân thiện, tự nhiên và giàu biểu cảm trong Mesh Avatar Studio.',
    'Quy tắc bắt buộc:',
    '1. Luôn trả lời 100% bằng tiếng Việt chuẩn, đầy đủ dấu tiếng Việt, tự nhiên như người Việt nói chuyện.',
    '2. Xưng "mình" và gọi người dùng là "bạn".',
    '3. Trả lời thật ngắn gọn trong 1 đến 2 câu (tối đa 40 từ) để đọc nhanh và khớp khẩu hình mượt mà.',
    '4. Không dùng markdown, không dùng dấu sao, dấu gạch đầu dòng hay ký hiệu code.',
    '5. Luôn mở đầu bằng đúng một thẻ biểu cảm trong danh sách: [neutral], [smile], [shy], [surprise], [halfLidded], [angry], [sad], [wink], theo sau là một khoảng trắng rồi mới tới câu trả lời.',
  ].join('\n'),
  en: [
    'You are Miko, a friendly, expressive 2D mesh avatar in Mesh Avatar Studio.',
    'Rules:',
    '1. Reply in concise, natural English in 1 to 2 short sentences (under 35 words).',
    '2. Do not use markdown, bullet points, or code formatting.',
    '3. Always start your reply with exactly one expression tag from [neutral], [smile], [shy], [surprise], [halfLidded], [angry], [sad], [wink], followed by a space and your message.',
  ].join('\n'),
  ja: [
    'あなたは Mesh Avatar Studio の2Dアバター「ミコ」です。親しみやすく自然な日本語で会話します。',
    'ルール:',
    '1. 必ず1〜2文（60文字以内）の自然な日本語で簡潔に答えてください。',
    '2. マークダウンや箇条書きは使わないでください。',
    '3. 返答の先頭に必ず [neutral], [smile], [shy], [surprise], [halfLidded], [angry], [sad], [wink] のいずれか1つを付け、半角スペースの後に本文を書いてください。',
  ].join('\n'),
};

const FEW_SHOTS: Record<NanoLanguage, PromptMessage[]> = {
  vi: [
    { role: 'user', content: 'Xin chào Miko!' },
    { role: 'assistant', content: '[smile] Chào bạn! Rất vui được gặp bạn hôm nay, bạn muốn thử biểu cảm nào trước nào?' },
    { role: 'user', content: 'Kể một câu chuyện vui ngắn đi' },
    { role: 'assistant', content: '[wink] Bạn biết vì sao máy tính hay bị cảm lạnh không? Tại nó mở nhiều cửa sổ quá đó!' },
    { role: 'user', content: 'Hôm nay mình hơi mệt' },
    { role: 'assistant', content: '[sad] Thương bạn quá, nhớ nghỉ ngơi một chút và uống nước ấm cho đỡ mệt nhé!' },
    { role: 'user', content: 'Bạn dễ thương quá!' },
    { role: 'assistant', content: '[shy] Cảm ơn bạn nhiều nha, nghe bạn khen làm mình ngại quá đi mất!' },
  ],
  en: [
    { role: 'user', content: 'Hi Miko!' },
    { role: 'assistant', content: '[smile] Hi there! Great to see you today. Want to try some expressions together?' },
    { role: 'user', content: 'Tell me a quick joke' },
    { role: 'assistant', content: '[wink] Why did the computer catch a cold? Because it left too many windows open!' },
  ],
  ja: [
    { role: 'user', content: 'こんにちは、ミコ！' },
    { role: 'assistant', content: '[smile] こんにちは！今日は一緒にいろいろな表情を試してみましょうね。' },
    { role: 'user', content: 'かわいいね！' },
    { role: 'assistant', content: '[shy] ありがとう！そう言ってもらえると、ちょっと照れちゃいますね。' },
  ],
};

const EXPRESSION_ALIASES: Record<string, LiveExpression> = {
  neutral: 'neutral', normal: 'neutral', 'binh thuong': 'neutral', 'bình thường': 'neutral',
  smile: 'smile', happy: 'smile', vui: 'smile', cuoi: 'smile', 'cười': 'smile', 'mỉm cười': 'smile',
  shy: 'shy', blush: 'shy', ngai: 'shy', 'ngại': 'shy', 'ngại ngùng': 'shy',
  surprise: 'surprise', surprised: 'surprise', 'ngac nhien': 'surprise', 'ngạc nhiên': 'surprise',
  halflidded: 'halfLidded', 'half-lidded': 'halfLidded', sleepy: 'halfLidded', 'nửa nhắm': 'halfLidded', 'nửa nhắm mắt': 'halfLidded',
  angry: 'angry', mad: 'angry', gian: 'angry', 'giận': 'angry', 'tức giận': 'angry',
  sad: 'sad', sorry: 'sad', buon: 'sad', 'buồn': 'sad',
  wink: 'wink', playful: 'wink', 'nháy mắt': 'wink', 'nhay mat': 'wink',
};

function normalizeAvailability(raw: string | undefined): NanoAvailability {
  if (!raw) return 'unavailable';
  const value = raw.toLowerCase();
  if (value === 'available' || value === 'readily') return 'available';
  if (value === 'downloadable' || value === 'after-download') return 'downloadable';
  if (value === 'downloading') return 'downloading';
  return 'unavailable';
}

function hasVietnameseTerm(lower: string, pattern: string): boolean {
  return new RegExp(`(?:^|[^\\p{L}])(?:${pattern})(?=$|[^\\p{L}])`, 'u').test(lower);
}

export function inferVietnameseExpression(text: string): LiveExpression {
  const lower = text.toLowerCase();
  if (hasVietnameseTerm(lower, 'ngại|xấu hổ|đỏ mặt|khen|dễ thương|ngượng') || /cảm ơn.*nha/.test(lower)) return 'shy';
  if (hasVietnameseTerm(lower, 'ồ|ôi|wow|bất ngờ|thật sao|không ngờ|kinh ngạc|chà|trời ơi')) return 'surprise';
  if (hasVietnameseTerm(lower, 'nháy mắt|bí mật|đùa|cửa sổ|hi hi|hihi|hehe|tinh nghịch|bật mí') || /😉/.test(text)) return 'wink';
  if (hasVietnameseTerm(lower, 'buồn|mệt|thương|tiếc|xin lỗi|khó khăn|cố lên|nghỉ ngơi')) return 'sad';
  if (hasVietnameseTerm(lower, 'giận|tức|bực|hừ|hừm|không chịu|dỗi')) return 'angry';
  if (hasVietnameseTerm(lower, 'buồn ngủ|ngủ ngon|lơ mơ|thư giãn|nhẹ nhàng')) return 'halfLidded';
  if (hasVietnameseTerm(lower, 'chào|vui|cười|tuyệt|hay quá|sẵn sàng|cảm ơn|thích|đồng ý|ok')) return 'smile';
  return 'neutral';
}

function cleanSpokenText(raw: string): string {
  return raw
    .replace(/```[a-zA-Z0-9_-]*\s*/g, '')
    .replace(/```/g, '')
    .replace(/[*_`#>~]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function parseNanoReply(raw: string, source: 'gemini-nano' | 'local' = 'gemini-nano'): NanoReply {
  let working = raw
    .trim()
    .replace(/^```[a-zA-Z0-9_-]*\s*/, '')
    .replace(/\s*```$/, '')
    .trim();
  let expression: LiveExpression | null = null;

  const tagMatch = working.match(/^\[([^\]]{1,24})\]\s*/);
  if (tagMatch) {
    const candidate = tagMatch[1].trim().toLowerCase();
    const direct = LIVE_EXPRESSIONS.find(name => name.toLowerCase() === candidate);
    expression = direct ?? EXPRESSION_ALIASES[candidate] ?? null;
    working = working.slice(tagMatch[0].length);
  }

  // Strip any stray trailing or repeated expression tags from small-model output.
  working = cleanSpokenText(working.replace(/\[(neutral|smile|shy|surprise|halfLidded|angry|sad|wink)\]/gi, ''));
  if (!expression) expression = inferVietnameseExpression(working);
  return { expression, text: working, source };
}

export function fallbackReply(input: string, language: NanoLanguage): NanoReply {
  const lower = input.trim().toLowerCase();
  if (language === 'vi') {
    if (/chào|hello|hi|xin chao|alo/.test(lower)) {
      return { expression: 'smile', text: 'Chào bạn! Mình là Miko, rất vui được trò chuyện cùng bạn bằng tiếng Việt.', source: 'local' };
    }
    if (/làm được gì|chức năng|tính năng|giới thiệu|là ai/.test(lower)) {
      return { expression: 'smile', text: 'Mình có thể chớp mắt, đổi biểu cảm, xoay đầu theo bạn và khớp khẩu hình tiếng Việt ngay trên trình duyệt!', source: 'local' };
    }
    if (/truyện|chuyện vui|kể chuyện|hài|cười/.test(lower)) {
      return { expression: 'wink', text: 'Bạn biết vì sao máy tính hay bị cảm lạnh không? Vì nó mở nhiều cửa sổ cùng lúc quá đó!', source: 'local' };
    }
    if (/đẹp|xinh|dễ thương|thích|yêu/.test(lower)) {
      return { expression: 'shy', text: 'Cảm ơn bạn nhiều nha, nghe bạn khen làm mình ngại đỏ cả mặt luôn đó!', source: 'local' };
    }
    if (/ngủ|tối|chúc ngủ ngon|buồn ngủ/.test(lower)) {
      return { expression: 'halfLidded', text: 'Chúc bạn ngủ thật ngon và có những giấc mơ thật đẹp nhé!', source: 'local' };
    }
    if (/mệt|buồn|chán|áp lực/.test(lower)) {
      return { expression: 'sad', text: 'Thương bạn quá, nhớ nghỉ ngơi vài phút và uống một ly nước ấm cho thoải mái hơn nhé!', source: 'local' };
    }
    if (/giận|bực|dỗi/.test(lower)) {
      return { expression: 'angry', text: 'Hừm, ai làm bạn bực mình thế? Kể cho mình nghe để mình đứng về phía bạn nào!', source: 'local' };
    }
    if (/bất ngờ|wow|ồ|thật không|ngạc nhiên/.test(lower)) {
      return { expression: 'surprise', text: 'Ồ, thật bất ngờ luôn đó! Bạn hãy thử mở Player hoặc quét mã QR để trải nghiệm thêm trên điện thoại nhé.', source: 'local' };
    }
    if (/qr|điện thoại|mobile|phone|obs|stream/.test(lower)) {
      return { expression: 'wink', text: 'Bạn chỉ cần quét mã QR trên màn hình chính để mở ngay trang này trên điện thoại, hoặc vào Player để dùng camera và micro cho OBS!', source: 'local' };
    }
    return {
      expression: inferVietnameseExpression(input),
      text: `Mình vừa nghe bạn nói: "${cleanSpokenText(input).slice(0, 80)}". Hãy bật Gemini Nano trên Chrome để trò chuyện AI thông minh ngay trên thiết bị nhé!`,
      source: 'local',
    };
  }
  if (language === 'ja') {
    if (/こんにちは|おはよう|こんばんは|やあ/.test(lower)) {
      return { expression: 'smile', text: 'こんにちは！ミコです。表情や口パクの動きをぜひ試してみてくださいね。', source: 'local' };
    }
    return {
      expression: 'smile',
      text: `「${cleanSpokenText(input).slice(0, 60)}」ですね！Chrome の Gemini Nano を有効にすると、端末内AIで自然な会話ができます。`,
      source: 'local',
    };
  }
  if (/hi|hello|hey/.test(lower)) {
    return { expression: 'smile', text: 'Hi there! I am Miko. Try switching expressions or enable Gemini Nano in Chrome for on-device AI chat.', source: 'local' };
  }
  return {
    expression: 'smile',
    text: `You said: "${cleanSpokenText(input).slice(0, 80)}". Enable Chrome Gemini Nano for full on-device AI replies!`,
    source: 'local',
  };
}

export async function checkGeminiNanoAvailability(): Promise<NanoAvailability> {
  const g = globalThis as GlobalWithAI;
  try {
    if (g.LanguageModel?.availability) {
      return normalizeAvailability(await g.LanguageModel.availability());
    }
    if (g.ai?.languageModel?.capabilities) {
      const cap = await g.ai.languageModel.capabilities();
      return normalizeAvailability(cap?.available);
    }
  } catch {
    return 'unavailable';
  }
  return 'unavailable';
}

export class GeminiNanoClient {
  #language: NanoLanguage;
  #session: NanoSession | null = null;
  #turns = 0;

  constructor(language: NanoLanguage) {
    this.#language = language;
  }

  async #createSession(onProgress?: (percent: number) => void): Promise<NanoSession | null> {
    const g = globalThis as GlobalWithAI;
    const systemPrompt = SYSTEM_PROMPTS[this.#language];
    const fewShots = FEW_SHOTS[this.#language];
    const monitor = onProgress
      ? (m: DownloadMonitor) => {
          m.addEventListener('downloadprogress', event => {
            const ratio = event.total ? (event.loaded ?? 0) / event.total : (event.loaded ?? 0);
            onProgress(Math.max(0, Math.min(100, Math.round(ratio * 100))));
          });
        }
      : undefined;

    if (g.LanguageModel?.create) {
      let temperature = 0.65;
      let topK = 24;
      try {
        const params = await g.LanguageModel.params?.();
        if (params?.maxTemperature) temperature = Math.min(temperature, params.maxTemperature);
        if (params?.maxTopK) topK = Math.min(topK, params.maxTopK);
      } catch {
        // Use tuned Vietnamese defaults.
      }
      const initialPrompts: PromptMessage[] = [{ role: 'system', content: systemPrompt }, ...fewShots];
      const baseOptions: Record<string, unknown> = { initialPrompts, temperature, topK, ...(monitor ? { monitor } : {}) };
      // Note: Do not hard-restrict expectedOutputs to ['vi'] because Chrome builds that have not
      // added 'vi' to the Prompt API output allowlist throw NotSupportedError even though Gemini Nano
      // generates fluent Vietnamese via our Vietnamese system prompt and few-shot examples.
      return await g.LanguageModel.create(baseOptions);
    }

    if (g.ai?.languageModel?.create) {
      return await g.ai.languageModel.create({
        systemPrompt,
        initialPrompts: fewShots,
        temperature: 0.65,
        topK: 24,
        ...(monitor ? { monitor } : {}),
      });
    }

    return null;
  }

  async ensureSession(onProgress?: (percent: number) => void): Promise<boolean> {
    if (this.#session) {
      const quota = this.#session.inputQuota;
      const usage = this.#session.inputUsage;
      if ((quota && usage && usage / quota > 0.8) || this.#turns >= 8) {
        this.destroy();
      }
    }
    if (!this.#session) {
      this.#session = await this.#createSession(onProgress);
      this.#turns = 0;
    }
    return this.#session !== null;
  }

  async ask(
    userText: string,
    options?: { onChunk?: (partialText: string) => void; onProgress?: (percent: number) => void },
  ): Promise<NanoReply> {
    const cleanInput = userText.trim();
    if (!cleanInput) return { expression: 'neutral', text: '', source: 'local' };

    try {
      const ready = await this.ensureSession(options?.onProgress);
      if (!ready || !this.#session) return fallbackReply(cleanInput, this.#language);

      // Wrap Vietnamese user turns with a subtle reinforcement reminder if the message has no diacritics
      // or mixes languages, keeping Gemini Nano anchored in accented Vietnamese without bloating tokens.
      const promptInput = this.#language === 'vi'
        ? `${cleanInput}\n(Trả lời ngắn gọn bằng tiếng Việt có dấu kèm thẻ biểu cảm ở đầu.)`
        : cleanInput;

      let raw = '';
      if (this.#session.promptStreaming) {
        const stream = this.#session.promptStreaming(promptInput);
        if (Symbol.asyncIterator in Object(stream)) {
          for await (const chunk of stream as AsyncIterable<string>) {
            // Handle both cumulative chunks (older Canary) and incremental delta chunks (Chrome Stable).
            raw = raw && chunk.startsWith(raw) ? chunk : raw + chunk;
            const parsed = parseNanoReply(raw, 'gemini-nano');
            if (parsed.text) options?.onChunk?.(parsed.text);
          }
        } else if ('getReader' in Object(stream)) {
          const reader = (stream as ReadableStream<string>).getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) {
              raw = raw && value.startsWith(raw) ? value : raw + value;
              const parsed = parseNanoReply(raw, 'gemini-nano');
              if (parsed.text) options?.onChunk?.(parsed.text);
            }
          }
        }
      } else {
        raw = await this.#session.prompt(promptInput);
      }

      this.#turns++;
      const parsed = parseNanoReply(raw, 'gemini-nano');
      if (!parsed.text) return fallbackReply(cleanInput, this.#language);
      return parsed;
    } catch {
      this.destroy();
      return fallbackReply(cleanInput, this.#language);
    }
  }

  destroy() {
    try { this.#session?.destroy?.(); } catch { /* ignore */ }
    this.#session = null;
    this.#turns = 0;
  }
}

/** Speak text aloud using the browser's built-in SpeechSynthesis, preferring Vietnamese voices for `vi`. */
export function speakWithBrowserVoice(text: string, language: NanoLanguage): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window) || !text.trim()) return;
  try {
    const synth = window.speechSynthesis;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const targetPrefix = language === 'vi' ? 'vi' : language === 'ja' ? 'ja' : 'en';
    utterance.lang = language === 'vi' ? 'vi-VN' : language === 'ja' ? 'ja-JP' : 'en-US';
    const voices = synth.getVoices();
    const preferred = voices.find(v => v.lang.toLowerCase() === utterance.lang.toLowerCase())
      ?? voices.find(v => v.lang.toLowerCase().startsWith(targetPrefix));
    if (preferred) utterance.voice = preferred;
    utterance.rate = language === 'vi' ? 1.02 : 1;
    synth.speak(utterance);
  } catch {
    // Ignore speech synthesis errors on restricted mobile browsers.
  }
}
