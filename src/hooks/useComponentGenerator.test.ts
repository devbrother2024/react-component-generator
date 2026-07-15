import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useComponentGenerator } from './useComponentGenerator';
import { loadHistory, saveHistory, MAX_HISTORY_SIZE } from '../lib/componentHistory';
import type { GeneratedComponent } from '../types';

function mockFetchOk(code = 'const A = () => null;') {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ code }),
    }),
  );
}

function makeComponent(overrides: Partial<GeneratedComponent> = {}): GeneratedComponent {
  return {
    id: '1',
    prompt: '기존 프롬프트',
    code: 'const A = () => null;',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('useComponentGenerator - 히스토리 영속성', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('마운트 시 localStorage에 저장된 히스토리를 불러온다', () => {
    saveHistory([makeComponent()]);

    const { result } = renderHook(() => useComponentGenerator());

    expect(result.current.components).toHaveLength(1);
    expect(result.current.components[0].prompt).toBe('기존 프롬프트');
  });

  it('컴포넌트를 생성하면 localStorage에도 저장된다', async () => {
    mockFetchOk();
    const { result } = renderHook(() => useComponentGenerator());

    await act(async () => {
      await result.current.generate('새 프롬프트', 'key', 'google');
    });

    expect(result.current.components).toHaveLength(1);
    expect(loadHistory()).toHaveLength(1);
    expect(loadHistory()[0].prompt).toBe('새 프롬프트');
  });

  it('개별 삭제 후에도 localStorage에 반영된다', async () => {
    mockFetchOk();
    const { result } = renderHook(() => useComponentGenerator());

    await act(async () => {
      await result.current.generate('프롬프트', 'key', 'google');
    });
    const [{ id }] = result.current.components;

    act(() => {
      result.current.removeComponent(id);
    });

    expect(result.current.components).toHaveLength(0);
    expect(loadHistory()).toHaveLength(0);
  });

  it('clearAll을 호출하면 localStorage도 비워진다', async () => {
    mockFetchOk();
    const { result } = renderHook(() => useComponentGenerator());

    await act(async () => {
      await result.current.generate('프롬프트', 'key', 'google');
    });

    act(() => {
      result.current.clearAll();
    });

    expect(loadHistory()).toHaveLength(0);
  });

  it('마운트 시 이미 저장된 히스토리와 동일한 데이터를 다시 저장하지 않는다', () => {
    saveHistory([makeComponent()]);
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

    renderHook(() => useComponentGenerator());

    expect(setItemSpy).not.toHaveBeenCalled();
  });

  it('clearAll을 호출하면 localStorage.removeItem으로 히스토리를 명시적으로 비운다', async () => {
    mockFetchOk();
    const { result } = renderHook(() => useComponentGenerator());

    await act(async () => {
      await result.current.generate('프롬프트', 'key', 'google');
    });

    const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem');

    act(() => {
      result.current.clearAll();
    });

    expect(removeItemSpy).toHaveBeenCalledWith('rcg:components');
  });

  it(`${MAX_HISTORY_SIZE}개를 초과해 생성하면 가장 오래된 항목부터 제거되어 최근 ${MAX_HISTORY_SIZE}개만 유지한다`, async () => {
    mockFetchOk();
    const { result } = renderHook(() => useComponentGenerator());

    for (let i = 0; i < MAX_HISTORY_SIZE + 1; i++) {
      await act(async () => {
        await result.current.generate(`프롬프트-${i}`, 'key', 'google');
      });
    }

    expect(result.current.components).toHaveLength(MAX_HISTORY_SIZE);
    expect(result.current.components[0].prompt).toBe(`프롬프트-${MAX_HISTORY_SIZE}`);
    expect(result.current.components.some((c) => c.prompt === '프롬프트-0')).toBe(false);
    expect(loadHistory()).toHaveLength(MAX_HISTORY_SIZE);
  });
});
