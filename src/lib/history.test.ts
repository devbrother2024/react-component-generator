import { describe, it, expect } from 'vitest';
import { parseHistory, capHistory, MAX_HISTORY } from './history';
import type { GeneratedComponent } from '../types';

function makeComponent(id: string): GeneratedComponent {
  return {
    id,
    prompt: `prompt-${id}`,
    code: `const C = () => null;`,
    createdAt: new Date('2026-07-23T10:00:00.000Z'),
  };
}

describe('parseHistory', () => {
  it('null이면 빈 배열을 반환한다', () => {
    expect(parseHistory(null)).toEqual([]);
  });

  it('유효한 JSON 배열을 파싱하고 createdAt을 Date로 되살린다', () => {
    const stored = JSON.stringify([
      {
        id: 'a',
        prompt: '버튼',
        code: 'const A = () => null;',
        createdAt: '2026-07-23T10:00:00.000Z',
      },
    ]);

    const result = parseHistory(stored);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('a');
    expect(result[0].createdAt).toBeInstanceOf(Date);
    expect(result[0].createdAt.toISOString()).toBe('2026-07-23T10:00:00.000Z');
  });

  it('파싱할 수 없는 손상된 문자열이면 빈 배열을 반환한다', () => {
    expect(parseHistory('{not valid json')).toEqual([]);
  });

  it('배열이 아닌 JSON이면 빈 배열을 반환한다', () => {
    expect(parseHistory('{"id":"a"}')).toEqual([]);
  });

  it('필수 필드가 빠진 항목은 제외한다', () => {
    const stored = JSON.stringify([
      { id: 'a', prompt: '정상', code: 'const A = () => null;', createdAt: '2026-07-23T10:00:00.000Z' },
      { id: 'b', prompt: 'code 없음', createdAt: '2026-07-23T10:00:00.000Z' },
    ]);

    const result = parseHistory(stored);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('a');
  });
});

describe('capHistory', () => {
  it(`${MAX_HISTORY}개를 초과하면 앞에서부터 ${MAX_HISTORY}개만 남긴다`, () => {
    const components = Array.from({ length: MAX_HISTORY + 5 }, (_, i) => makeComponent(String(i)));

    const result = capHistory(components);

    expect(result).toHaveLength(MAX_HISTORY);
    expect(result[0].id).toBe('0');
    expect(result[MAX_HISTORY - 1].id).toBe(String(MAX_HISTORY - 1));
  });

  it(`${MAX_HISTORY}개 이하이면 그대로 반환한다`, () => {
    const components = Array.from({ length: 3 }, (_, i) => makeComponent(String(i)));

    expect(capHistory(components)).toHaveLength(3);
  });
});
