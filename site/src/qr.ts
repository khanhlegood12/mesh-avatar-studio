import { encode } from 'uqr';

const SVG_NS = 'http://www.w3.org/2000/svg';

export function createQrMatrix(text: string): boolean[][] {
  return encode(text, { ecc: 'M', border: 3 }).data;
}

export function buildQrPath(matrix: boolean[][]): string {
  const size = matrix.length;
  const segments: string[] = [];
  for (let y = 0; y < size; y++) {
    const row = matrix[y];
    let x = 0;
    while (x < size) {
      if (!row[x]) { x++; continue; }
      const start = x;
      while (x < size && row[x]) x++;
      segments.push(`M${start},${y}h${x - start}v1h-${x - start}z`);
    }
  }
  return segments.join('');
}

/** Build a high-contrast, camera-ready SVG QR code without innerHTML or external requests. */
export function buildQrSvg(text: string, ariaLabel: string): SVGSVGElement {
  const matrix = createQrMatrix(text);
  const size = matrix.length;
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', ariaLabel);
  svg.setAttribute('shape-rendering', 'crispEdges');
  svg.classList.add('qr-svg');

  const bg = document.createElementNS(SVG_NS, 'rect');
  bg.setAttribute('width', String(size));
  bg.setAttribute('height', String(size));
  bg.setAttribute('fill', '#ffffff');
  svg.append(bg);

  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('fill', '#111827');
  path.setAttribute('d', buildQrPath(matrix));
  svg.append(path);
  return svg;
}

export function mountCurrentUrlQr(
  container: HTMLElement | null,
  urlLabel: HTMLElement | null,
  copyButton: HTMLButtonElement | null,
  feedback: HTMLElement | null,
  labels: { ariaLabel: string; copy: string; copied: string; copySucceeded: string; copyFailed: string },
) {
  if (!container) return;

  const render = () => {
    const currentUrl = window.location.href;
    container.replaceChildren(buildQrSvg(currentUrl, `${labels.ariaLabel}: ${currentUrl}`));
    if (urlLabel) urlLabel.textContent = currentUrl;
  };

  render();
  window.addEventListener('hashchange', render);
  window.addEventListener('popstate', render);

  if (copyButton) {
    let timer = 0;
    copyButton.disabled = false;
    copyButton.textContent = labels.copy;
    copyButton.addEventListener('click', async () => {
      window.clearTimeout(timer);
      const currentUrl = window.location.href;
      try {
        await navigator.clipboard.writeText(currentUrl);
        copyButton.textContent = labels.copied;
        if (feedback) feedback.textContent = labels.copySucceeded;
      } catch {
        if (feedback) feedback.textContent = labels.copyFailed;
      } finally {
        timer = window.setTimeout(() => { copyButton.textContent = labels.copy; }, 2500);
      }
    });
  }
}
