import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useComponentGenerator } from './useComponentGenerator';

const STORAGE_KEY = 'rcg:components';

function createStreamResponse(lines: string[]) {
  const encoder = new TextEncoder();
  let index = 0;

  return {
    ok: true,
    body: {
      getReader: () => ({
        read: async () => {
          if (index >= lines.length) return { done: true, value: undefined };
          const value = encoder.encode(`${lines[index]}\n`);
          index += 1;
          return { done: false, value };
        },
      }),
    },
  };
}

function stubStreamFetch(events: Array<Record<string, unknown>>) {
  const lines = events.map((event) => JSON.stringify(event));
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(createStreamResponse(lines)));
}

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
    stubStreamFetch([
      { type: 'delta', text: 'const Card = () => null;' },
      { type: 'done', code: 'render(<Card />)' },
    ]);

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
    stubStreamFetch([{ type: 'done', code: 'render(<Card />)' }]);
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

  it('로컬스토리지 저장이 실패해도 앱은 죽지 않고 경고를 남긴다', async () => {
    stubStreamFetch([{ type: 'done', code: 'render(<Card />)' }]);
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { result } = renderHook(() => useComponentGenerator());

    await act(async () => {
      await result.current.generate('카드', undefined, 'anthropic');
    });

    expect(result.current.components).toHaveLength(1);
    expect(warnSpy).toHaveBeenCalled();

    setItemSpy.mockRestore();
    warnSpy.mockRestore();
  });

  it('clearAll을 호출하면 로컬스토리지도 비워진다', async () => {
    stubStreamFetch([{ type: 'done', code: 'render(<Card />)' }]);
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

describe('useComponentGenerator - 스트리밍', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('generate 호출 직후 스트리밍 placeholder를 생성하고 isLoading을 true로 만든다', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise(() => {})),
    );

    const { result } = renderHook(() => useComponentGenerator());

    act(() => {
      void result.current.generate('버튼', undefined, 'anthropic');
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.streamingComponent).not.toBeNull();
    expect(result.current.streamingComponent?.prompt).toBe('버튼');
    expect(result.current.streamingComponent?.code).toBe('');
  });

  it('델타 이벤트들이 누적된 뒤 done 이벤트의 code로 최종 컴포넌트가 만들어진다', async () => {
    stubStreamFetch([
      { type: 'delta', text: 'const A = () => null;' },
      { type: 'delta', text: '\nrender(<A />);' },
      { type: 'done', code: 'const A = () => null;\nrender(<A />);' },
    ]);

    const { result } = renderHook(() => useComponentGenerator());

    await act(async () => {
      await result.current.generate('버튼', undefined, 'anthropic');
    });

    expect(result.current.streamingComponent).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.components[0].code).toBe('const A = () => null;\nrender(<A />);');
  });

  it('스트림 중 error 이벤트를 받으면 error 상태로 설정되고 components에는 반영되지 않는다', async () => {
    stubStreamFetch([
      { type: 'delta', text: 'const A' },
      { type: 'error', message: '생성 중 오류가 발생했습니다.' },
    ]);

    const { result } = renderHook(() => useComponentGenerator());

    await act(async () => {
      await result.current.generate('버튼', undefined, 'anthropic');
    });

    expect(result.current.error).toBe('생성 중 오류가 발생했습니다.');
    expect(result.current.components).toEqual([]);
    expect(result.current.streamingComponent).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('done/error 없이 스트림이 끝나면 에러로 처리한다', async () => {
    stubStreamFetch([{ type: 'delta', text: 'const A' }]);

    const { result } = renderHook(() => useComponentGenerator());

    await act(async () => {
      await result.current.generate('버튼', undefined, 'anthropic');
    });

    expect(result.current.error).not.toBeNull();
    expect(result.current.components).toEqual([]);
    expect(result.current.streamingComponent).toBeNull();
  });

  it('done 이벤트에 code 필드가 없으면 무시하고 에러로 처리한다', async () => {
    stubStreamFetch([{ type: 'delta', text: 'const A' }, { type: 'done' }]);

    const { result } = renderHook(() => useComponentGenerator());

    await act(async () => {
      await result.current.generate('버튼', undefined, 'anthropic');
    });

    expect(result.current.error).not.toBeNull();
    expect(result.current.components).toEqual([]);
  });

  it('delta 이벤트에 text 필드가 없으면 무시한다', async () => {
    stubStreamFetch([
      { type: 'delta' },
      { type: 'done', code: 'render(<A />)' },
    ]);

    const { result } = renderHook(() => useComponentGenerator());

    await act(async () => {
      await result.current.generate('버튼', undefined, 'anthropic');
    });

    expect(result.current.error).toBeNull();
    expect(result.current.components[0].code).toBe('render(<A />)');
  });

  it('응답이 실패(ok: false)면 JSON 본문의 에러 메시지를 사용한다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'API 키가 필요합니다.' }),
      }),
    );

    const { result } = renderHook(() => useComponentGenerator());

    await act(async () => {
      await result.current.generate('버튼', undefined, 'anthropic');
    });

    expect(result.current.error).toBe('API 키가 필요합니다.');
    expect(result.current.components).toEqual([]);
  });
});
