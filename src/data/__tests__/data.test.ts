import { describe, expect, it } from 'vitest';
import { ALL_STATIONS, STATIONS } from '../stations';
import { LINES } from '../lines';
import { getFareRule } from '../fareTable';
import { LANDMARKS } from '../../render/sprites/landmarks';

describe('駅レジストリ', () => {
  it('読みがひらがなと長音符だけで構成されている', () => {
    for (const s of ALL_STATIONS) {
      expect(s.kana, `${s.kanji}`).toMatch(/^[ぁ-ゖー]+$/);
    }
  });
  it('駅 id が重複していない', () => {
    expect(STATIONS.size).toBe(ALL_STATIONS.length);
  });
  it('同じ漢字名に複数の id が無い', () => {
    const byKanji = new Map<string, string[]>();
    for (const s of ALL_STATIONS) {
      byKanji.set(s.kanji, [...(byKanji.get(s.kanji) ?? []), s.id]);
    }
    const dup = [...byKanji].filter(([, ids]) => ids.length > 1);
    expect(dup).toEqual([]);
  });
  it('読みが未確認の駅が無い', () => {
    const unverified = ALL_STATIONS.filter((s) => !s.verified).map((s) => s.kanji);
    expect(unverified).toEqual([]);
  });
});

describe('路線', () => {
  it('segments が stops と整合している', () => {
    for (const line of LINES) {
      expect(line.segments.length, line.nameJp).toBe(line.stops.length - 1);
      line.segments.forEach((seg, i) => {
        expect(seg.from).toBe(line.stops[i]);
        expect(seg.to).toBe(line.stops[i + 1]);
      });
    }
  });
  it('すべての停車駅がレジストリに存在する', () => {
    for (const line of LINES) {
      for (const id of line.stops) {
        expect(STATIONS.has(id), `${line.nameJp}: ${id}`).toBe(true);
      }
    }
  });
  it('区間距離がすべて正の値', () => {
    for (const line of LINES) {
      for (const seg of line.segments) {
        expect(seg.km, `${line.nameJp}: ${seg.from}→${seg.to}`).toBeGreaterThan(0);
      }
    }
  });
  it('運賃ルールが解決できる', () => {
    for (const line of LINES) {
      expect(() => getFareRule(line.fareRule)).not.toThrow();
    }
  });
});

describe('名所・特産', () => {
  it('参照しているスプライトが実在する', () => {
    for (const s of ALL_STATIONS) {
      for (const lm of s.landmarks ?? []) {
        expect(LANDMARKS[lm.sprite], `${s.kanji}: ${lm.sprite}`).toBeDefined();
      }
    }
  });
  it('ラベルが空でない', () => {
    for (const s of ALL_STATIONS) {
      for (const lm of s.landmarks ?? []) {
        expect(lm.label.length, `${s.kanji}`).toBeGreaterThan(0);
      }
    }
  });
  it('1駅あたり2件まで（画面に収まる範囲）', () => {
    for (const s of ALL_STATIONS) {
      expect((s.landmarks ?? []).length, `${s.kanji}`).toBeLessThanOrEqual(2);
    }
  });
});

describe('山陽本線の長さ', () => {
  it('岡山県の端から端まで21駅ある', () => {
    const line = LINES.find((l) => l.id === 'sanyo-main-down')!;
    expect(line.stops).toHaveLength(21);
    expect(line.stops[0]).toBe('mitsuishi');
    expect(line.stops.at(-1)).toBe('kasaoka');
  });
  it('岡山駅は途中駅として含まれる', () => {
    const line = LINES.find((l) => l.id === 'sanyo-main-down')!;
    const i = line.stops.indexOf('okayama');
    expect(i).toBeGreaterThan(0);
    expect(i).toBeLessThan(line.stops.length - 1);
  });
  it('全長が60km以上ある（すぐ折り返さない長さ）', () => {
    const line = LINES.find((l) => l.id === 'sanyo-main-down')!;
    const total = line.segments.reduce((a, s) => a + s.km, 0);
    expect(total).toBeGreaterThan(60);
  });
});
