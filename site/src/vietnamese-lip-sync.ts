// Convert Vietnamese (and general Latin) text into kana mora strings playable by
// mesh-avatar's speakKana(), while leaving existing Japanese kana segments intact.

const HAS_KANA = /[\u3040-\u309F\u30A0-\u30FF]/;
const TONE_MARKS = /[\u0300\u0301\u0303\u0309\u0323]/g;
const VOWEL_CHARS = new Set([...'aăâeêioôơuưy']);
const BILABIAL_INITIALS = new Set(['m', 'b', 'p']);
const BILABIAL_CODAS = new Set(['m', 'p']);
const STOP_CODAS = new Set(['n', 'ng', 'nh', 'c', 'ch', 't']);
const PUNCTUATION = new Set([...'.,!?;:…—–\n、。！？']);

const KANA_PLAIN = { a: 'あ', i: 'い', u: 'う', e: 'え', o: 'お' } as const;
const KANA_CONSONANT = { a: 'か', i: 'き', u: 'く', e: 'け', o: 'こ' } as const;
const KANA_LIPS = { a: 'ま', i: 'み', u: 'む', e: 'め', o: 'も' } as const;

type MouthVowel = keyof typeof KANA_PLAIN;

function mapVietnameseVowel(ch: string): MouthVowel | null {
  if (ch === 'a' || ch === 'ă' || ch === 'â') return 'a';
  if (ch === 'i' || ch === 'y') return 'i';
  if (ch === 'u' || ch === 'ư') return 'u';
  if (ch === 'e' || ch === 'ê') return 'e';
  if (ch === 'o' || ch === 'ô' || ch === 'ơ') return 'o';
  return null;
}

/** Strip Vietnamese tone marks while preserving vowel quality marks (ă, â, ê, ô, ơ, ư) and đ. */
function stripTones(word: string): string {
  return word.toLowerCase().normalize('NFD').replace(TONE_MARKS, '').normalize('NFC');
}

function syllableToKana(rawWord: string): string {
  const word = stripTones(rawWord);
  if (!word) return '';

  // Identify initial consonant cluster, handling Vietnamese digraphs/trigraphs cleanly.
  let idx = 0;
  let extraRoundedGlide = false;

  if (word.startsWith('qu') && word.length > 2 && VOWEL_CHARS.has(word[2])) {
    idx = 2;
    extraRoundedGlide = true;
  } else if (word.startsWith('gi') && word.length > 2 && VOWEL_CHARS.has(word[2])) {
    // "gi" acts as initial consonant /z/ before another vowel (e.g. gia, giờ, giữ).
    idx = 2;
  } else {
    while (idx < word.length && !VOWEL_CHARS.has(word[idx])) idx++;
  }

  const initial = word.slice(0, idx);
  let rest = word.slice(idx);

  // Extract vowel nucleus (up to end of contiguous vowels) and optional coda.
  let vEnd = 0;
  while (vEnd < rest.length && VOWEL_CHARS.has(rest[vEnd])) vEnd++;
  const nucleus = rest.slice(0, vEnd);
  const coda = rest.slice(vEnd);

  if (!nucleus) {
    // Acronym or consonant-only token (e.g. "OBS", "AI" handled above, "km")
    if (BILABIAL_INITIALS.has(initial[0])) return 'ん';
    return '';
  }

  const vowels: MouthVowel[] = [];
  if (extraRoundedGlide) vowels.push('u');
  for (const ch of nucleus) {
    const mapped = mapVietnameseVowel(ch);
    if (mapped && vowels[vowels.length - 1] !== mapped) vowels.push(mapped);
  }
  if (!vowels.length) return '';

  // Keep at most 2 distinct vowel shapes per syllable so Vietnamese diphthongs stay crisp.
  const shapes = vowels.length > 2 ? [vowels[0], vowels[vowels.length - 1]] : vowels;

  // Choose onset table: bilabials (m/b/p, excluding "ph") press lips closed first.
  const isBilabial = initial.length === 1 && BILABIAL_INITIALS.has(initial);
  const firstTable = !initial ? KANA_PLAIN : isBilabial ? KANA_LIPS : KANA_CONSONANT;

  let out = firstTable[shapes[0]];
  if (shapes.length > 1) out += KANA_PLAIN[shapes[1]];

  // Coda shaping: bilabial finals (-m, -p) close lips cleanly; short stop codas add subtle dip.
  if (BILABIAL_CODAS.has(coda)) out += 'ん';
  else if (STOP_CODAS.has(coda) && shapes.length === 1 && nucleus.length === 1) out += 'っ';

  // Handle multi-syllable loanwords / English words embedded in Vietnamese sentences (e.g. "camera", "avatar").
  rest = coda;
  const remainingVowels = [...rest].findIndex(ch => VOWEL_CHARS.has(ch));
  if (remainingVowels > 0) {
    out += syllableToKana(rest);
  }

  return out;
}

export function hasKana(text: string): boolean {
  return HAS_KANA.test(text);
}

/**
 * Convert Vietnamese (and mixed Vietnamese/Japanese/English) text into a kana timeline
 * suitable for `avatar.speakKana()`. Pure Japanese kana input is returned unchanged.
 */
export function toSpeakableKana(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return '';
  // If there are no Latin/Vietnamese letters at all, return as-is for native Japanese kana playback.
  if (!/[A-Za-zÀ-ỹđĐ]/.test(trimmed)) return trimmed;

  let result = '';
  const tokens = trimmed.match(/[\u3040-\u309F\u30A0-\u30FFーっん]+|[A-Za-zÀ-ỹđĐ]+|[.,!?;:…—–\n、。！？]+|\s+/g) ?? [];
  for (const token of tokens) {
    if (/^\s+$/.test(token)) continue;
    if (HAS_KANA.test(token)) {
      result += token;
    } else if (PUNCTUATION.has(token[0])) {
      if (result && !result.endsWith('、')) result += '、';
    } else {
      result += syllableToKana(token);
    }
  }
  return result;
}
