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
  qrAriaLabel: string;
  qrCopyLink: string;
  qrCopiedLink: string;
  nanoChecking: string;
  nanoAvailable: string;
  nanoDownloadable: string;
  nanoDownloading: string;
  nanoUnavailable: string;
  nanoThinking: string;
  nanoDownloadButton: string;
  nanoDownloadProgress: string;
  nanoSourceGemini: string;
  nanoSourceLocal: string;
  nanoVoiceOn: string;
  nanoVoiceOff: string;
}

const messages: Record<'vi' | 'en' | 'ja', Messages> = {
  vi: {
    expressions: {
      neutral: 'Bình thường', smile: 'Cười', shy: 'Ngại ngùng', surprise: 'Ngạc nhiên',
      halfLidded: 'Nửa nhắm mắt', angry: 'Tức giận', sad: 'Buồn', wink: 'Nháy mắt',
    },
    mouthStyle: 'Kiểu chuyển động miệng',
    mouthStyleHint: 'Chọn một kiểu rồi chạy văn bản bên dưới để so sánh.',
    customMouthStyle: 'Tùy chỉnh',
    mouthStyles: { calm: 'Nhẹ nhàng', default: 'Tiêu chuẩn', lively: 'Nhanh gọn', subtle: 'Tinh tế', big: 'Biểu cảm' },
    pointerHint: 'Di chuyển chuột hoặc chạm vào khung xem trước, nhân vật sẽ quay mặt nhìn theo.',
    expressionHint: 'Chọn biểu cảm hoặc chạm vào nhân vật để tương tác.',
    loading: 'Đang tải bản xem trước trực tiếp…',
    loadFailed: 'Không thể tải bản xem trước trực tiếp. Hãy thử tải lại bằng trình duyệt có bật WebGL. Bạn vẫn có thể xem dự án trên GitHub hoặc npm.',
    copy: 'Sao chép',
    copied: 'Đã sao chép',
    copySucceeded: 'Đã sao chép vào bộ nhớ tạm.',
    copyFailed: 'Không thể tự động sao chép. Đoạn mã đã được chọn; hãy dùng lệnh sao chép của trình duyệt.',
    qrAriaLabel: 'Mã QR mở liên kết trình duyệt hiện tại trên điện thoại',
    qrCopyLink: 'Sao chép link',
    qrCopiedLink: 'Đã sao chép link',
    nanoChecking: 'Đang kiểm tra Gemini Nano…',
    nanoAvailable: 'Gemini Nano sẵn sàng (tối ưu tiếng Việt)',
    nanoDownloadable: 'Có thể tải Gemini Nano trên máy',
    nanoDownloading: 'Đang tải Gemini Nano…',
    nanoUnavailable: 'Chế độ tiếng Việt nhanh (chưa bật Gemini Nano)',
    nanoThinking: 'Miko đang suy nghĩ…',
    nanoDownloadButton: 'Tải Gemini Nano',
    nanoDownloadProgress: 'Đang tải Gemini Nano trên thiết bị: {percent}%…',
    nanoSourceGemini: 'Trả lời bằng Gemini Nano trên thiết bị',
    nanoSourceLocal: 'Phản hồi nhanh tiếng Việt (nội bộ trình duyệt)',
    nanoVoiceOn: 'Đang bật giọng đọc tiếng Việt',
    nanoVoiceOff: 'Đọc giọng tiếng Việt',
  },
  en: {
    expressions: {
      neutral: 'Neutral', smile: 'Smile', shy: 'Shy', surprise: 'Surprise',
      halfLidded: 'Half-lidded', angry: 'Angry', sad: 'Sad', wink: 'Wink',
    },
    mouthStyle: 'Mouth style',
    mouthStyleHint: 'Choose a style, then animate the text below to compare.',
    customMouthStyle: 'Custom',
    mouthStyles: { calm: 'Relaxed', default: 'Standard', lively: 'Snappy', subtle: 'Subtle', big: 'Expressive' },
    pointerHint: 'Move your pointer or touch the preview and she turns to face it.',
    expressionHint: 'Pick an expression or tap the preview to try it.',
    loading: 'Loading the live preview…',
    loadFailed: 'The live preview couldn’t load. Try reloading in a browser with WebGL enabled. You can still explore the project on GitHub or npm.',
    copy: 'Copy',
    copied: 'Copied',
    copySucceeded: 'Copied to clipboard.',
    copyFailed: 'Copy wasn’t available. The code is selected; use your browser’s copy command.',
    qrAriaLabel: 'QR code to open the current browser link on your phone',
    qrCopyLink: 'Copy link',
    qrCopiedLink: 'Link copied',
    nanoChecking: 'Checking Gemini Nano…',
    nanoAvailable: 'Gemini Nano ready on-device',
    nanoDownloadable: 'Gemini Nano downloadable',
    nanoDownloading: 'Downloading Gemini Nano…',
    nanoUnavailable: 'Local quick-reply mode (Gemini Nano off)',
    nanoThinking: 'Miko is thinking…',
    nanoDownloadButton: 'Download Gemini Nano',
    nanoDownloadProgress: 'Downloading Gemini Nano on-device: {percent}%…',
    nanoSourceGemini: 'Replied on-device with Gemini Nano',
    nanoSourceLocal: 'Instant local reply (no network)',
    nanoVoiceOn: 'Browser voice on',
    nanoVoiceOff: 'Read aloud',
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
    pointerHint: 'ポインターを動かすか画面に触れると、その方向へ顔を向けます。',
    expressionHint: 'ボタンで表情を切り替えられます。',
    loading: 'プレビューを読み込んでいます…',
    loadFailed: 'プレビューを読み込めませんでした。WebGL が使えるブラウザで再読み込みしてください。プロジェクトの詳細は GitHub や npm でも確認できます。',
    copy: 'コピー',
    copied: 'コピー済み',
    copySucceeded: 'クリップボードにコピーしました。',
    copyFailed: 'コピーできませんでした。コードを選択したので、ブラウザのコピー操作を使ってください。',
    qrAriaLabel: '現在のURLをスマートフォンで開くQRコード',
    qrCopyLink: 'URLをコピー',
    qrCopiedLink: 'コピー済み',
    nanoChecking: 'Gemini Nano を確認中…',
    nanoAvailable: 'Gemini Nano 利用可能（端末内AI）',
    nanoDownloadable: 'Gemini Nano ダウンロード可能',
    nanoDownloading: 'Gemini Nano をダウンロード中…',
    nanoUnavailable: 'ローカル応答モード（Gemini Nano 未有効）',
    nanoThinking: 'ミコが考えています…',
    nanoDownloadButton: 'Gemini Nano を準備',
    nanoDownloadProgress: 'Gemini Nano を端末にダウンロード中: {percent}%…',
    nanoSourceGemini: '端末内の Gemini Nano が返答',
    nanoSourceLocal: 'ブラウザ内クイック応答',
    nanoVoiceOn: '音声読み上げオン',
    nanoVoiceOff: '音声で読み上げ',
  },
};

const documentLanguage = document.documentElement.lang.split('-')[0];
export const language: 'vi' | 'en' | 'ja' = documentLanguage === 'en' || documentLanguage === 'ja' ? documentLanguage : 'vi';
export const copy = messages[language];
