import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useComponentGenerator } from './useComponentGenerator';

const STORAGE_KEY = 'rcg:components';

describe('useComponentGenerator - localStorage 영속화', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('로컬스토리지에 저장된 컴포넌트가 있으면 초기 상태로 복원한다', () => {
    const stored = [
      { id: '1', prompt: '버튼', code: 'render(<Button />)', createdAt: '2024-01-01T00:00:00.000Z' },
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));

    const { result } = renderHook(() => useComponentGenerator());

    expect(result.current.components).toHaveLength(1);
    expect(result.current.components[0].prompt).toBe('버튼');
    expect(result.current.components[0].createdAt).toBeInstanceOf(Date);
  });

  it('로컬스토리지 데이터가 손상되어 있으면 빈 배열로 시작한다', () => {
    localStorage.setItem(STORAGE_KEY, '{ invalid json');

    const { result } = renderHook(() => useComponentGenerator());

    expect(result.current.components).toEqual([]);
  });

  it('저장된 값이 배열이 아니면 빈 배열로 시작한다', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ not: 'an array' }));

    const { result } = renderHook(() => useComponentGenerator());

    expect(result.current.components).toEqual([]);
  });

  it('generate로 새 컴포넌트를 추가하면 로컬스토리지에도 반영된다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ code: 'render(<Card />)' }),
      }),
    );

    const { result } = renderHook(() => useComponentGenerator());

    await act(async () => {
      await result.current.generate('카드', undefined, 'anthropic');
    });

    expect(result.current.components).toHaveLength(1);
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    expect(stored).toHaveLength(1);
    expect(stored[0].code).toBe('render(<Card />)');
  });

  it('removeComponent로 삭제하면 로컬스토리지에서도 제거된다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ code: 'render(<Card />)' }),
      }),
    );
    const { result } = renderHook(() => useComponentGenerator());
    await act(async () => {
      await result.current.generate('카드', undefined, 'anthropic');
    });
    const id = result.current.components[0].id;

    act(() => {
      result.current.removeComponent(id);
    });

    expect(result.current.components).toHaveLength(0);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')).toHaveLength(0);
  });

  it('clearAll을 호출하면 로컬스토리지도 비워진다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ code: 'render(<Card />)' }),
      }),
    );
    const { result } = renderHook(() => useComponentGenerator());
    await act(async () => {
      await result.current.generate('카드', undefined, 'anthropic');
    });

    act(() => {
      result.current.clearAll();
    });

    expect(result.current.components).toEqual([]);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')).toEqual([]);
  });
});
