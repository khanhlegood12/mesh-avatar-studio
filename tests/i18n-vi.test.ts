import { describe, expect, test } from 'vitest';
import { dictionaries, fieldTitle } from '../src/editor/i18n';
import { archiveText } from '../src/editor/archive-i18n';
import { lipSyncText } from '../src/editor/LipSyncSettings';
import { liveText } from '../src/live/i18n';
import { lightingText } from '../src/lighting/Controls';
import { playerText } from '../site/src/player/text';

describe('Vietnamese translations', () => {
  test('cover every key across editor, live, lighting, archive, lip sync and player dictionaries', () => {
    const sets: [string, Record<string, string>, Record<string, string>][] = [
      ['editor', dictionaries.en, dictionaries.vi],
      ['archive', archiveText.en, archiveText.vi],
      ['lipSync', lipSyncText.en, lipSyncText.vi],
      ['live', liveText.en, liveText.vi],
      ['lighting', lightingText.en, lightingText.vi],
      ['player', playerText.en, playerText.vi],
    ];
    for (const [name, en, vi] of sets) {
      expect(Object.keys(vi).sort(), name).toEqual(Object.keys(en).sort());
      for (const [key, value] of Object.entries(vi)) {
        expect(value.trim().length, `${name}.${key}`).toBeGreaterThan(0);
      }
    }
  });

  test('format rig field paths in Vietnamese', () => {
    expect(fieldTitle('head.cx', 'vi')).toBe('Xoay đầu · Tâm X');
    expect(fieldTitle('eyes.0.opening', 'vi')).toBe('Mắt · 1 · Đường mở mắt');
    expect(fieldTitle('arms.left.shoulder', 'vi')).toBe('Cánh tay · Tay trái (theo ảnh) · Vai');
    expect(fieldTitle('legs.split', 'vi')).toBe('Chân · Đường phân tách hai chân');
  });
});
