import type { LiveExpression } from 'mesh-avatar';

interface Messages {
  expressions: Record<LiveExpression, string>;
  mouthStyle: string;
  mouthStyleHint: string;
  customMouthStyle: string;
  mouthStyles: Record<'calm' | 'default' | 'lively' | 'subtle' | 'big', string>;
  pointerHint: string;
  expressionHint: string;
  loading: string;
  loadFailed: string;
  copy: string;
  copied: string;
  copySucceeded: string;
  copyFailed: string;
}

const messages: Record<'en' | 'ja' | 'vi', Messages> = {
  en: {
    expressions: {
      neutral: 'Neutral', smile: 'Smile', shy: 'Shy', surprise: 'Surprise',
      halfLidded: 'Half-lidded', angry: 'Angry', sad: 'Sad', wink: 'Wink',
    },
    mouthStyle: 'Mouth style',
    mouthStyleHint: 'Choose a style, then animate the text below to compare.',
    customMouthStyle: 'Custom',
    mouthStyles: { calm: 'Relaxed', default: 'Standard', lively: 'Snappy', subtle: 'Subtle', big: 'Expressive' },
    pointerHint: 'Move your pointer and she turns to face it.',
    expressionHint: 'Pick an expression to try it.',
    loading: 'Loading the live preview…',
    loadFailed: 'The live preview couldn’t load. Try reloading in a browser with WebGL enabled. You can still explore the project on GitHub or npm.',
    copy: 'Copy',
    copied: 'Copied',
    copySucceeded: 'Copied to clipboard.',
    copyFailed: 'Copy wasn’t available. The code is selected; use your browser’s copy command.',
  },
  ja: {
    expressions: {
      neutral: '通常', smile: '笑顔', shy: '照れ', surprise: '驚き',
      halfLidded: '半目', angry: '怒り', sad: '悲しみ', wink: 'ウインク',
    },
    mouthStyle: '口の動きのタイプ',
    mouthStyleHint: 'タイプを選んで、下の文章で口の動きを試せます。',
    customMouthStyle: 'カスタム',
    mouthStyles: { calm: 'ゆったり', default: '標準', lively: 'キビキビ', subtle: '控えめ', big: 'はっきり' },
    pointerHint: 'ポインターを動かすと、その方向へ顔を向けます。',
    expressionHint: 'ボタンで表情を切り替えられます。',
    loading: 'プレビューを読み込んでいます…',
    loadFailed: 'プレビューを読み込めませんでした。WebGL が使えるブラウザで再読み込みしてください。プロジェクトの詳細は GitHub や npm でも確認できます。',
    copy: 'コピー',
    copied: 'コピー済み',
    copySucceeded: 'クリップボードにコピーしました。',
    copyFailed: 'コピーできませんでした。コードを選択したので、ブラウザのコピー操作を使ってください。',
  },
  vi: {
    expressions: {
      neutral: 'Bình thường', smile: 'Cười', shy: 'Ngại ngùng', surprise: 'Ngạc nhiên',
      halfLidded: 'Nửa nhắm mắt', angry: 'Tức giận', sad: 'Buồn', wink: 'Nháy mắt',
    },
    mouthStyle: 'Kiểu chuyển động miệng',
    mouthStyleHint: 'Chọn một kiểu rồi chạy văn bản bên dưới để so sánh.',
    customMouthStyle: 'Tùy chỉnh',
    mouthStyles: { calm: 'Nhẹ nhàng', default: 'Tiêu chuẩn', lively: 'Nhanh gọn', subtle: 'Tinh tế', big: 'Biểu cảm' },
    pointerHint: 'Di chuyển con trỏ chuột và nhân vật sẽ quay mặt nhìn theo.',
    expressionHint: 'Chọn một biểu cảm để dùng thử.',
    loading: 'Đang tải bản xem trước trực tiếp…',
    loadFailed: 'Không thể tải bản xem trước trực tiếp. Hãy thử tải lại bằng trình duyệt có bật WebGL. Bạn vẫn có thể xem dự án trên GitHub hoặc npm.',
    copy: 'Sao chép',
    copied: 'Đã sao chép',
    copySucceeded: 'Đã sao chép vào bộ nhớ tạm.',
    copyFailed: 'Không thể tự động sao chép. Đoạn mã đã được chọn; hãy dùng lệnh sao chép của trình duyệt.',
  },
};

const documentLanguage = document.documentElement.lang.split('-')[0];
export const language: 'en' | 'ja' | 'vi' = documentLanguage === 'ja' || documentLanguage === 'vi' ? documentLanguage : 'en';
export const copy = messages[language];
