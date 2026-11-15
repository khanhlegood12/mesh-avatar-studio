import { createRoot } from 'react-dom/client';
import '../../../src/live/live.css';
import './player.css';
import { PlayerApp } from './PlayerApp';

const lang = document.documentElement.lang.split('-')[0];
const language = lang === 'en' || lang === 'ja' ? lang : 'vi';
createRoot(document.getElementById('root')!).render(<PlayerApp language={language} />);
