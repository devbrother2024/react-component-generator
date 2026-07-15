import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { loadHistory, saveHistory, clearHistory, MAX_HISTORY_SIZE } from './componentHistory';
import type { GeneratedComponent } from '../types';

const STORAGE_KEY = 'rcg:components';

function makeComponent(overrides: Partial<GeneratedComponent> = {}): GeneratedComponent {
  return {
    id: '1',
    prompt: '프로필 카드',
    code: 'const A = () => null;',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('componentHistory', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('loadHistory', () => {
    it('저장된 값이 없으면 빈 배열을 반환한다', () => {
      expect(loadHistory()).toEqual([]);
    });

    it('손상된 JSON이 저장되어 있으면 빈 배열을 반환한다', () => {
      localStorage.setItem(STORAGE_KEY, '{ 이것은 유효한 JSON이 아님');
      expect(loadHistory()).toEqual([]);
    });

    it('배열이 아닌 값이 저장되어 있으면 빈 배열을 반환한다', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ not: 'an array' }));
      expect(loadHistory()).toEqual([]);
    });

    it('필수 필드가 빠진 항목이 있으면 빈 배열을 반환한다', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([{ id: '1', prompt: '설명 없음' }]));
      expect(loadHistory()).toEqual([]);
    });

    it('localStorage 접근 자체가 예외를 던져도 빈 배열을 반환한다', () => {
      const getItemSpy = vi
        .spyOn(Storage.prototype, 'getItem')
        .mockImplementation(() => {
          throw new Error('SecurityError: storage access denied');
        });

      expect(() => loadHistory()).not.toThrow();
      expect(loadHistory()).toEqual([]);

      getItemSpy.mockRestore();
    });
  });

  describe('saveHistory / loadHistory 라운드트립', () => {
    it('저장한 컴포넌트를 그대로 복원한다 (createdAt은 Date 인스턴스로)', () => {
      const component = makeComponent();
      saveHistory([component]);

      const loaded = loadHistory();

      expect(loaded).toHaveLength(1);
      expect(loaded[0].id).toBe(component.id);
      expect(loaded[0].prompt).toBe(component.prompt);
      expect(loaded[0].code).toBe(component.code);
      expect(loaded[0].createdAt).toBeInstanceOf(Date);
      expect(loaded[0].createdAt.toISOString()).toBe(component.createdAt.toISOString());
    });

    it('MAX_HISTORY_SIZE를 초과하는 목록을 저장하면 앞에서부터 MAX_HISTORY_SIZE개만 유지한다', () => {
      const components = Array.from({ length: MAX_HISTORY_SIZE + 5 }, (_, i) =>
        makeComponent({ id: String(i), prompt: `프롬프트-${i}` }),
      );

      saveHistory(components);
      const loaded = loadHistory();

      expect(loaded).toHaveLength(MAX_HISTORY_SIZE);
      expect(loaded[0].id).toBe('0');
      expect(loaded[MAX_HISTORY_SIZE - 1].id).toBe(String(MAX_HISTORY_SIZE - 1));
    });
  });

  describe('clearHistory', () => {
    it('저장된 히스토리를 비운다', () => {
      saveHistory([makeComponent()]);
      clearHistory();
      expect(loadHistory()).toEqual([]);
    });
  });

  describe('saveHistory 예외 처리', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('localStorage.setItem이 예외(용량 초과 등)를 던져도 saveHistory는 예외를 전파하지 않는다', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      expect(() => saveHistory([makeComponent()])).not.toThrow();
    });
  });
});
