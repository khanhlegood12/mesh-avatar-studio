import { LIVE_EXPRESSIONS, loadMeshAvatar, type LiveExpression, type MeshAvatar } from 'mesh-avatar';
import { highlightCodeSamples } from './highlight';
import { copy, language } from './messages';
import { mountCurrentUrlQr } from './qr';
import { checkGeminiNanoAvailability, GeminiNanoClient, speakWithBrowserVoice } from './gemini-nano';
import { toSpeakableKana } from './vietnamese-lip-sync';
import overviewImage from '../../docs/images/en/01-overview.png';
import handlesImage from '../../docs/images/en/02-edit-handles.png';
import lipSyncImage from '../../docs/images/en/03-lip-sync.png';
import variantsImage from '../../docs/images/en/05-variants.png';
import liveImage from '../../docs/images/en/07-live.png';
import streamImage from '../../docs/images/en/08-stream.png';
import overviewImageJa from '../../docs/images/ja/01-overview.png';
import handlesImageJa from '../../docs/images/ja/02-edit-handles.png';
import lipSyncImageJa from '../../docs/images/ja/03-lip-sync.png';
import variantsImageJa from '../../docs/images/ja/05-variants.png';
import liveImageJa from '../../docs/images/ja/07-live.png';
import streamImageJa from '../../docs/images/ja/08-stream.png';
import './style.css';

const englishScreenshots = {
  overview: overviewImage, handles: handlesImage, lipSync: lipSyncImage,
  variants: variantsImage, live: liveImage, stream: streamImage,
};
const screenshots: Record<string, string> = {
  en: englishScreenshots,
  vi: englishScreenshots,
  ja: {
    overview: overviewImageJa, handles: handlesImageJa, lipSync: lipSyncImageJa,
    variants: variantsImageJa, live: liveImageJa, stream: streamImageJa,
  },
}[language];
for (const image of document.querySelectorAll<HTMLImageElement>('img[data-screenshot]')) {
  image.src = screenshots[image.dataset.screenshot!];
  const link = image.closest('a');
  if (link) link.href = image.src;
}

highlightCodeSamples();

// Render the live QR code of the current browser URL for scanning on a phone.
mountCurrentUrlQr(
  document.querySelector<HTMLElement>('#qr-code'),
  document.querySelector<HTMLElement>('#qr-url'),
  document.querySelector<HTMLButtonElement>('#qr-copy'),
  document.querySelector<HTMLElement>('#qr-feedback'),
  {
    ariaLabel: copy.qrAriaLabel,
    copy: copy.qrCopyLink,
    copied: copy.qrCopiedLink,
    copySucceeded: copy.copySucceeded,
    copyFailed: copy.copyFailed,
  },
);

for (const opener of document.querySelectorAll<HTMLButtonElement>('[data-open-dialog]')) {
  const dialog = document.getElementById(opener.dataset.openDialog!) as HTMLDialogElement;
  opener.addEventListener('click', () => dialog.showModal());
  dialog.querySelector('[data-close-dialog]')?.addEventListener('click', () => dialog.close());
  // A click on the backdrop lands on the dialog element itself.
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
}

for (const button of document.querySelectorAll<HTMLButtonElement>('button[data-copy]')) {
  const code = document.getElementById(button.dataset.copy!)!;
  const feedback = document.getElementById(button.getAttribute('aria-describedby')!)!;
  let resetTimer = 0;
  button.disabled = false;
  button.textContent = copy.copy;
  button.addEventListener('click', async () => {
    window.clearTimeout(resetTimer);
    button.disabled = true;
    button.textContent = copy.copy;
    feedback.textContent = '';
    try {
      await navigator.clipboard.writeText(code.textContent ?? '');
      button.textContent = copy.copied;
      feedback.textContent = copy.copySucceeded;
    } catch {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(code);
      selection?.removeAllRanges();
      selection?.addRange(range);
      feedback.textContent = copy.copyFailed;
    } finally {
      button.disabled = false;
      resetTimer = window.setTimeout(() => { button.textContent = copy.copy; }, 2500);
    }
  });
}

const hero = document.querySelector<HTMLElement>('.hero')!;
const canvas = document.querySelector<HTMLCanvasElement>('#avatar')!;
const stage = document.querySelector<HTMLElement>('.avatar-stage')!;
const status = document.querySelector<HTMLElement>('#avatar-status')!;
const controls = document.querySelector<HTMLFieldSetElement>('#avatar-controls')!;
const expressions = document.querySelector<HTMLElement>('#expressions')!;
const talk = document.querySelector<HTMLButtonElement>('#talk')!;
const hint = document.querySelector<HTMLElement>('#demo-hint')!;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = window.matchMedia('(any-hover: hover) and (any-pointer: fine)');
const shownExpressions: LiveExpression[] = ['neutral', 'smile', 'surprise', 'wink'];

let avatar: MeshAvatar | undefined;
let speaking = false;
let inView = false;
let pageVisible = true;
let disposed = false;
let frameId = 0;
let lastFrame = 0;
let elapsed = 0;
const pointer = { active: false, x: 0, y: 0, smoothX: 0, smoothY: 0, weight: 0 };

function setActiveExpression(name: LiveExpression) {
  avatar?.setExpression(name);
  for (const chip of expressions.querySelectorAll('button')) {
    chip.setAttribute('aria-pressed', String(chip.dataset.expression === name));
  }
}

for (const name of shownExpressions.filter(name => LIVE_EXPRESSIONS.includes(name))) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = copy.expressions[name];
  button.dataset.expression = name;
  button.setAttribute('aria-pressed', String(name === 'neutral'));
  button.addEventListener('click', () => setActiveExpression(name));
  expressions.append(button);
}

function updateMotionPreference() {
  avatar?.setAutoIdle(!reducedMotion.matches);
  avatar?.setAutoMotion(!reducedMotion.matches);
  avatar?.setSwayGain(reducedMotion.matches ? 0.35 : 1);
  pointer.active = false;
  pointer.weight = 0;
  avatar?.setParameters({});
  hint.textContent = reducedMotion.matches || !finePointer.matches
    ? copy.expressionHint
    : copy.pointerHint;
}
reducedMotion.addEventListener('change', updateMotionPreference);
finePointer.addEventListener('change', updateMotionPreference);
updateMotionPreference();

function aimFromRect(rect: DOMRect, clientX: number, clientY: number) {
  pointer.x = Math.max(-1, Math.min(1, (clientX - rect.left) / rect.width * 2 - 1));
  pointer.y = Math.max(-1, Math.min(1, 1 - (clientY - rect.top) / rect.height * 2));
  pointer.active = true;
}

hero.addEventListener('pointermove', event => {
  if (event.pointerType === 'touch' || reducedMotion.matches || !finePointer.matches) return;
  aimFromRect(hero.getBoundingClientRect(), event.clientX, event.clientY);
});
// Touch interaction on mobile phones (when opened via QR code).
stage.addEventListener('pointerdown', event => {
  if (event.pointerType !== 'touch' || reducedMotion.matches) return;
  aimFromRect(stage.getBoundingClientRect(), event.clientX, event.clientY);
});
stage.addEventListener('pointermove', event => {
  if (event.pointerType !== 'touch' || reducedMotion.matches || !pointer.active) return;
  aimFromRect(stage.getBoundingClientRect(), event.clientX, event.clientY);
});
const releasePointer = () => { pointer.active = false; };
hero.addEventListener('pointerleave', releasePointer);
hero.addEventListener('pointercancel', releasePointer);
stage.addEventListener('pointerup', releasePointer);
stage.addEventListener('pointercancel', releasePointer);
window.addEventListener('blur', releasePointer);

talk.addEventListener('click', () => {
  speaking = !speaking;
  talk.setAttribute('aria-pressed', String(speaking));
  if (speaking) avatar?.stopLipSync();
  avatar?.setSpeaking(speaking);
  if (!speaking) avatar?.setVoiceLevel(0);
});

// Gemini Nano on-device Vietnamese chat wired directly to Miko's expressions and Vietnamese lip sync.
const nanoClient = new GeminiNanoClient(language);
const nanoBadge = document.querySelector<HTMLElement>('#nano-status');
const nanoForm = document.querySelector<HTMLFormElement>('#nano-form');
const nanoInput = document.querySelector<HTMLInputElement>('#nano-input');
const nanoSend = document.querySelector<HTMLButtonElement>('#nano-send');
const nanoDownload = document.querySelector<HTMLButtonElement>('#nano-download');
const nanoVoiceButton = document.querySelector<HTMLButtonElement>('#nano-voice');
const nanoReplyBox = document.querySelector<HTMLElement>('#nano-reply');
const nanoReplyText = document.querySelector<HTMLElement>('#nano-reply-text');
const nanoReplyMeta = document.querySelector<HTMLElement>('#nano-reply-meta');
const nanoGuide = document.querySelector<HTMLDetailsElement>('#nano-guide');

let voiceEnabled = false;
let nanoBusy = false;

function setNanoStatus(state: 'checking' | 'available' | 'downloadable' | 'downloading' | 'unavailable', detail?: string) {
  if (!nanoBadge) return;
  nanoBadge.dataset.state = state;
  const labelMap = {
    checking: copy.nanoChecking,
    available: copy.nanoAvailable,
    downloadable: copy.nanoDownloadable,
    downloading: copy.nanoDownloading,
    unavailable: copy.nanoUnavailable,
  };
  nanoBadge.textContent = detail ?? labelMap[state];
  if (nanoDownload) nanoDownload.hidden = state !== 'downloadable';
  if (nanoGuide) nanoGuide.hidden = state === 'available' || state === 'downloading';
}

if (nanoVoiceButton) {
  nanoVoiceButton.addEventListener('click', () => {
    voiceEnabled = !voiceEnabled;
    nanoVoiceButton.setAttribute('aria-pressed', String(voiceEnabled));
    nanoVoiceButton.textContent = voiceEnabled ? copy.nanoVoiceOn : copy.nanoVoiceOff;
    if (!voiceEnabled && 'speechSynthesis' in window) window.speechSynthesis.cancel();
  });
}

if (nanoDownload) {
  nanoDownload.textContent = copy.nanoDownloadButton;
  nanoDownload.addEventListener('click', async () => {
    nanoDownload.disabled = true;
    setNanoStatus('downloading');
    try {
      const ok = await nanoClient.ensureSession(percent => {
        setNanoStatus('downloading', copy.nanoDownloadProgress.replace('{percent}', String(percent)));
      });
      setNanoStatus(ok ? 'available' : 'unavailable');
    } catch {
      setNanoStatus('unavailable');
    } finally {
      nanoDownload.disabled = false;
    }
  });
}

async function submitNanoPrompt(promptText: string) {
  const clean = promptText.trim();
  if (!clean || nanoBusy) return;
  nanoBusy = true;
  if (nanoSend) nanoSend.disabled = true;
  if (nanoReplyBox) nanoReplyBox.hidden = false;
  if (nanoReplyText) nanoReplyText.textContent = copy.nanoThinking;
  if (nanoReplyMeta) nanoReplyMeta.textContent = '';

  // Stop looping Talk button so Vietnamese phonetic lip sync drives the mouth cleanly.
  if (speaking) {
    speaking = false;
    talk.setAttribute('aria-pressed', 'false');
    avatar?.setSpeaking(false);
    avatar?.setVoiceLevel(0);
  }

  try {
    const reply = await nanoClient.ask(clean, {
      onChunk: partial => {
        if (nanoReplyText) nanoReplyText.textContent = partial;
      },
      onProgress: percent => {
        setNanoStatus('downloading', copy.nanoDownloadProgress.replace('{percent}', String(percent)));
      },
    });
    if (reply.source === 'gemini-nano') setNanoStatus('available');
    if (nanoReplyText) nanoReplyText.textContent = reply.text;
    if (nanoReplyMeta) {
      nanoReplyMeta.textContent = `${copy.expressions[reply.expression]} · ${reply.source === 'gemini-nano' ? copy.nanoSourceGemini : copy.nanoSourceLocal}`;
    }
    setActiveExpression(reply.expression);
    const kana = toSpeakableKana(reply.text);
    if (kana && avatar) avatar.speakKana(kana, { speed: language === 'vi' ? 8.5 : 7.5 });
    if (voiceEnabled) speakWithBrowserVoice(reply.text, language);
  } finally {
    nanoBusy = false;
    if (nanoSend) nanoSend.disabled = false;
  }
}

if (nanoForm && nanoInput) {
  nanoForm.addEventListener('submit', event => {
    event.preventDefault();
    const text = nanoInput.value;
    nanoInput.value = '';
    void submitNanoPrompt(text);
  });
  for (const chip of document.querySelectorAll<HTMLButtonElement>('[data-nano-prompt]')) {
    chip.addEventListener('click', () => {
      const prompt = chip.dataset.nanoPrompt ?? '';
      nanoInput.value = '';
      void submitNanoPrompt(prompt);
    });
  }
  setNanoStatus('checking');
  void checkGeminiNanoAvailability().then(state => setNanoStatus(state));
}

function frame(now: number) {
  if (!avatar) return;
  const dt = Math.min(0.05, Math.max(0.001, (now - lastFrame) / 1000));
  lastFrame = now;
  elapsed += dt;
  const ease = 1 - Math.exp(-dt * 9);
  pointer.smoothX += (pointer.x - pointer.smoothX) * ease;
  pointer.smoothY += (pointer.y - pointer.smoothY) * ease;
  pointer.weight += ((pointer.active ? 1 : 0) - pointer.weight) * ease;
  if (pointer.weight > 0.001 && !reducedMotion.matches) {
    avatar.setParameters({
      angleX: pointer.smoothX * 12,
      angleY: pointer.smoothY * 8,
      gazeX: pointer.smoothX * 0.7,
      gazeY: pointer.smoothY * 0.55,
    }, pointer.weight);
  } else {
    avatar.setParameters({});
  }
  if (speaking) {
    const phrase = Math.max(0, Math.sin(elapsed * 2.4));
    const syllable = 0.25 + 0.75 * Math.abs(Math.sin(elapsed * 13) * Math.cos(elapsed * 7));
    avatar.setVoiceLevel(phrase * syllable);
  }
  // One simulation step per visible frame; the renderer also caps devicePixelRatio at 2.
  avatar.advance(dt, 1 / dt);
  frameId = requestAnimationFrame(frame);
}

function updateLoop() {
  const shouldRender = avatar && inView && pageVisible && !document.hidden && !disposed;
  if (shouldRender && !frameId) {
    lastFrame = performance.now();
    frameId = requestAnimationFrame(frame);
  } else if (!shouldRender && frameId) {
    cancelAnimationFrame(frameId);
    frameId = 0;
    pointer.active = false;
  }
}

const visibility = new IntersectionObserver(entries => {
  inView = entries[0].isIntersecting;
  updateLoop();
});
visibility.observe(stage);
document.addEventListener('visibilitychange', updateLoop);
window.addEventListener('pagehide', event => {
  pageVisible = false;
  updateLoop();
  if (!event.persisted) {
    disposed = true;
    visibility.disconnect();
    nanoClient.destroy();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    avatar?.destroy();
  }
});
window.addEventListener('pageshow', () => { pageVisible = true; updateLoop(); });

async function start() {
  status.textContent = copy.loading;
  canvas.dataset.state = 'loading';
  try {
    // Hide the source image's cut top edge while leaving more of the hair visible.
    const loaded = await loadMeshAvatar(canvas, `${import.meta.env.BASE_URL}miko.mavatar`, { manual: true, padTop: -0.04 });
    if (disposed) { loaded.destroy(); return; }
    avatar = loaded;
    avatar.setAutoIdle(true);
    updateMotionPreference();
    avatar.advance(0);
    canvas.dataset.state = 'ready';
    stage.setAttribute('aria-busy', 'false');
    status.hidden = true;
    controls.disabled = false;
    updateLoop();
  } catch {
    canvas.dataset.state = 'error';
    stage.setAttribute('aria-busy', 'false');
    status.textContent = copy.loadFailed;
  }
}

void start();
