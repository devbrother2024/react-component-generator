import { describe, it, expect, vi } from 'vitest';
import { withModelFallbackStream } from './fallback';

describe('withModelFallbackStream', () => {
  it('첫 모델이 성공하면 그 결과를 반환하고 다음 모델은 시도하지 않는다', async () => {
    const attempt = vi.fn(async (model: string) => `ok:${model}`);

    const result = await withModelFallbackStream(['a', 'b'], attempt);

    expect(result).toBe('ok:a');
    expect(attempt).toHaveBeenCalledTimes(1);
  });

  it('아무 델타도 방출하지 않고 실패하면 다음 모델로 폴백한다', async () => {
    const attempt = vi.fn(async (model: string) => {
      if (model === 'a') throw new Error('a 실패');
      return `ok:${model}`;
    });

    const result = await withModelFallbackStream(['a', 'b'], attempt);

    expect(result).toBe('ok:b');
    expect(attempt).toHaveBeenCalledTimes(2);
  });

  it('델타를 이미 방출한 뒤 실패하면 폴백하지 않고 에러를 전파한다', async () => {
    const attempt = vi.fn(async (model: string, onEmit: () => void) => {
      if (model === 'a') {
        onEmit();
        throw new Error('a 스트리밍 중 실패');
      }
      return `ok:${model}`;
    });

    await expect(withModelFallbackStream(['a', 'b'], attempt)).rejects.toThrow(
      'a 스트리밍 중 실패',
    );
    expect(attempt).toHaveBeenCalledTimes(1);
  });

  it('모든 모델이 실패하면 마지막 에러를 던진다', async () => {
    const attempt = vi.fn(async (model: string) => {
      throw new Error(`${model} 실패`);
    });

    await expect(withModelFallbackStream(['a', 'b'], attempt)).rejects.toThrow('b 실패');
    expect(attempt).toHaveBeenCalledTimes(2);
  });

  it('모델 목록이 비어 있으면 에러를 던진다', async () => {
    const attempt = vi.fn();

    await expect(withModelFallbackStream([], attempt)).rejects.toThrow();
    expect(attempt).not.toHaveBeenCalled();
  });
});
