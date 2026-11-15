import { readFile } from 'node:fs/promises';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { kanaToMoras } from '../packages/runtime/src/engine/kana.js';
import {
  checkGeminiNanoAvailability,
  fallbackReply,
  GeminiNanoClient,
  inferVietnameseExpression,
  parseNanoReply,
} from '../site/src/gemini-nano';
import { buildQrPath, createQrMatrix } from '../site/src/qr';
import { hasKana, toSpeakableKana } from '../site/src/vietnamese-lip-sync';

describe('Vietnamese default routing across all 3 web pages', () => {
  it('serves Vietnamese by default on /, /play/, and /embed/', async () => {
    const landing = await readFile(new URL('../site/index.html', import.meta.url), 'utf8');
    const play = await readFile(new URL('../site/play/index.html', import.meta.url), 'utf8');
    const embed = await readFile(new URL('../site/embed/index.html', import.meta.url), 'utf8');

    expect(landing).toContain('<html lang="vi">');
    expect(landing).toContain('href="./en/"');
    expect(landing).toContain('href="./ja/"');
    expect(landing).toContain('id="qr-code"');
    expect(landing).toContain('id="nano-chat"');

    expect(play).toContain('<html lang="vi">');
    expect(play).toContain('hreflang="x-default" href="https://khanhlegood12.github.io/mesh-avatar-studio/play/"');

    expect(embed).toContain('<html lang="vi">');
    expect(embed).toContain('href="../en/embed/"');
    expect(embed).toContain('href="../ja/embed/"');
    expect(embed).toContain('Xin chào, rất vui được gặp bạn!');
  });

  it('serves English at /en/*, Japanese at /ja/*, and redirects legacy /vi/* without 404', async () => {
    const enLanding = await readFile(new URL('../site/en/index.html', import.meta.url), 'utf8');
    const enPlay = await readFile(new URL('../site/en/play/index.html', import.meta.url), 'utf8');
    const enEmbed = await readFile(new URL('../site/en/embed/index.html', import.meta.url), 'utf8');
    const jaLanding = await readFile(new URL('../site/ja/index.html', import.meta.url), 'utf8');
    const viRedirect = await readFile(new URL('../site/vi/index.html', import.meta.url), 'utf8');
    const viPlayRedirect = await readFile(new URL('../site/vi/play/index.html', import.meta.url), 'utf8');
    const viEmbedRedirect = await readFile(new URL('../site/vi/embed/index.html', import.meta.url), 'utf8');

    expect(enLanding).toContain('<html lang="en">');
    expect(enLanding).toContain('href="../" lang="vi"');
    expect(enPlay).toContain('<html lang="en">');
    expect(enEmbed).toContain('<html lang="en">');
    expect(jaLanding).toContain('<html lang="ja">');
    expect(jaLanding).toContain('href="../" lang="vi"');
    expect(jaLanding).toContain('href="../en/" lang="en"');

    expect(viRedirect).toContain('url=../');
    expect(viPlayRedirect).toContain('url=../../play/');
    expect(viEmbedRedirect).toContain('url=../../embed/');
  });
});

describe('Vietnamese phonetic lip-sync conversion', () => {
  it('passes pure Japanese kana through unchanged', () => {
    expect(hasKana('こんにちは、よろしくお願いします。')).toBe(true);
    expect(toSpeakableKana('こんにちは、よろしくお願いします。')).toBe('こんにちは、よろしくお願いします。');
  });

  it('converts accented Vietnamese sentences into valid runtime lip-sync moras', () => {
    const kana = toSpeakableKana('Xin chào, rất vui được gặp bạn!');
    // Punctuation creates speech pauses and bilabial final (-p in gặp) inserts 'ん'.
    expect(kana).toContain('、');
    expect(kana).toContain('ん');

    const moras = kanaToMoras(kana);
    expect(moras.length).toBeGreaterThan(8);
    expect(moras.some(m => m.vowel === 'a')).toBe(true);
    expect(moras.some(m => m.vowel === 'i')).toBe(true);
    expect(moras.some(m => m.vowel === 'u')).toBe(true);
    expect(moras.some(m => m.vowel === 'o')).toBe(true);
    expect(moras.some(m => m.vowel === 'n')).toBe(true);
    expect(moras.some(m => m.vowel === 'n' && m.dur > 0.25)).toBe(true);
    // Bilabial initial 'b' in 'bạn' triggers lips-closed onset.
    expect(moras.some(m => m.onset === 'lips')).toBe(true);
  });

  it('maps Vietnamese diacritic vowels accurately (ă, â, ê, ô, ơ, ư, đ)', () => {
    expect(toSpeakableKana('ăn')).toBe('あっ');
    expect(toSpeakableKana('tôi')).toBe('こい');
    expect(toSpeakableKana('tiếng')).toBe('きえ');
    expect(toSpeakableKana('nước')).toBe('くお');
    expect(toSpeakableKana('mười')).toBe('むい');
    expect(toSpeakableKana('đẹp')).toBe('けん');
    expect(toSpeakableKana('bạn')).toBe('まっ');
  });
});

describe('Gemini Nano Vietnamese optimization', () => {
  afterEach(() => {
    Reflect.deleteProperty(globalThis, 'LanguageModel');
    Reflect.deleteProperty(globalThis, 'ai');
  });

  it('parses structured expression tags and cleans formatting artifacts', () => {
    const parsed = parseNanoReply('[smile] Xin chào bạn! Hôm nay trời đẹp quá.');
    expect(parsed.expression).toBe('smile');
    expect(parsed.text).toBe('Xin chào bạn! Hôm nay trời đẹp quá.');

    const fenced = parseNanoReply('```text\n[wink] **Mẹo nhỏ**: thử nháy mắt nhé!\n```');
    expect(fenced.expression).toBe('wink');
    expect(fenced.text).toBe('Mẹo nhỏ: thử nháy mắt nhé!');
  });

  it('infers natural Vietnamese expressions without false substring matches', () => {
    // "chào" must not falsely match "chà" -> surprise, and "rồi/đồng" must not falsely match "ồ".
    expect(inferVietnameseExpression('Chào bạn, rất vui được gặp bạn!')).toBe('smile');
    expect(inferVietnameseExpression('Được rồi, mình đồng ý ngay!')).toBe('smile');
    expect(inferVietnameseExpression('Ồ, thật bất ngờ quá đi!')).toBe('surprise');
    expect(inferVietnameseExpression('Xin lỗi bạn nha, mình buồn một chút.')).toBe('sad');
    expect(inferVietnameseExpression('Hihi ngại quá đi mất!')).toBe('shy');
    expect(inferVietnameseExpression('Mẹo nhỏ bí mật nha 😉')).toBe('wink');
  });

  it('provides natural Vietnamese local fallback replies when Gemini Nano is unavailable', async () => {
    expect(await checkGeminiNanoAvailability()).toBe('unavailable');
    const client = new GeminiNanoClient('vi');
    const greeting = await client.ask('Chào Miko!');
    expect(greeting.source).toBe('local');
    expect(greeting.expression).toBe('smile');
    expect(greeting.text).toMatch(/Chào bạn|Miko/);

    const fallback = fallbackReply('Kể chuyện vui ngắn đi', 'vi');
    expect(fallback.expression).toBe('wink');
    expect(fallback.text.length).toBeGreaterThan(10);
  });

  it('streams and parses replies from on-device Chrome LanguageModel API', async () => {
    const promptStreaming = vi.fn(() => (async function* () {
      yield '[surprise] ';
      yield 'Ồ, chào bạn! ';
      yield 'Miko đang chạy Gemini Nano trực tiếp trên máy bạn đó!';
    })());
    const create = vi.fn(async () => ({
      prompt: vi.fn(),
      promptStreaming,
      destroy: vi.fn(),
      inputUsage: 100,
      inputQuota: 4096,
    }));
    Reflect.set(globalThis, 'LanguageModel', {
      availability: vi.fn(async () => 'available'),
      create,
    });

    expect(await checkGeminiNanoAvailability()).toBe('available');
    const chunks: string[] = [];
    const client = new GeminiNanoClient('vi');
    const reply = await client.ask('Bạn chạy bằng gì thế?', { onChunk: chunk => chunks.push(chunk) });

    expect(reply.source).toBe('gemini-nano');
    expect(reply.expression).toBe('surprise');
    expect(reply.text).toContain('Gemini Nano');
    expect(chunks.length).toBeGreaterThan(0);
    // Must not force expectedOutputs with 'vi' that throws NotSupportedError on older Chrome builds.
    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      initialPrompts: expect.arrayContaining([
        expect.objectContaining({ role: 'system', content: expect.stringContaining('tiếng Việt') }),
      ]),
    }));
    client.destroy();
  });
});

describe('Current-URL QR Code generator', () => {
  it('encodes the active browser URL into a crisp local QR matrix and SVG path', () => {
    const url = 'https://khanhlegood12.github.io/mesh-avatar-studio/?demo=1#live';
    const matrix = createQrMatrix(url);
    expect(matrix.length).toBeGreaterThanOrEqual(27);
    expect(matrix.every(row => row.length === matrix.length)).toBe(true);
    // Quiet zone border = 3 white modules on all 4 sides.
    expect(matrix[0].every(cell => cell === false)).toBe(true);
    expect(matrix[matrix.length - 1].every(cell => cell === false)).toBe(true);

    const path = buildQrPath(matrix);
    expect(path.startsWith('M')).toBe(true);
    expect(path).toContain('v1h-');
  });
});

describe('Phone and tablet responsive styles across site and Studio', () => {
  it('defines tablet, phone, small-phone, and touch-safe rules across all stylesheets', async () => {
    const landingCss = await readFile(new URL('../site/src/style.css', import.meta.url), 'utf8');
    const embedCss = await readFile(new URL('../site/src/embed/style.css', import.meta.url), 'utf8');
    const playerCss = await readFile(new URL('../site/src/player/player.css', import.meta.url), 'utf8');
    const liveCss = await readFile(new URL('../src/live/live.css', import.meta.url), 'utf8');
    const lightingCss = await readFile(new URL('../src/lighting/lighting.css', import.meta.url), 'utf8');
    const editorCss = await readFile(new URL('../src/editor/style.css', import.meta.url), 'utf8');

    // Overflow prevention and iOS-safe input sizing (16px avoids Safari auto-zoom).
    expect(landingCss).toContain('overflow-x: clip');
    expect(landingCss).toContain('@media (max-width: 1080px)');
    expect(landingCss).toContain('@media (max-width: 900px)');
    expect(landingCss).toContain('@media (max-width: 760px)');
    expect(landingCss).toContain('@media (max-width: 480px)');
    expect(landingCss).toContain('.nano-form input { font-size: 16px; min-height: 44px; }');

    expect(embedCss).toContain('@media (max-width: 1024px)');
    expect(embedCss).toContain('@media (max-width: 860px)');
    expect(embedCss).toContain('@media (max-width: 760px)');
    expect(embedCss).toContain('@media (max-width: 480px)');

    expect(liveCss).toContain('overflow-x: clip');
    expect(liveCss).toContain('@media (max-width: 1080px)');
    expect(liveCss).toContain('@media (max-width: 920px)');
    expect(liveCss).toContain('@media (max-width: 640px)');
    expect(liveCss).toContain('@media (max-width: 420px)');
    expect(liveCss).toContain('@media (pointer: coarse)');

    expect(playerCss).toContain('@media (max-width: 920px)');
    expect(playerCss).toContain('@media (max-width: 640px)');
    expect(playerCss).toContain('@media (max-width: 420px)');

    expect(lightingCss).toContain('@media (max-width: 480px)');
    expect(lightingCss).toContain('@media (pointer: coarse)');

    expect(editorCss).toContain('overflow-x: clip');
    expect(editorCss).toContain('@media (max-width: 960px)');
    expect(editorCss).toContain('@media (max-width: 760px)');
    expect(editorCss).toContain('@media (max-width: 480px)');
    expect(editorCss).toContain('@media (pointer: coarse)');
  });
});
