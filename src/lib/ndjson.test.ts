import { describe, it, expect } from 'vitest';
import { splitNdjsonLines } from './ndjson';

describe('splitNdjsonLines', () => {
  it('빈 문자열이면 라인 없이 그대로 반환한다', () => {
    expect(splitNdjsonLines('')).toEqual({ lines: [], rest: '' });
  });

  it('완결된 라인들을 분리하고 미완결 나머지를 rest로 남긴다', () => {
    const buffer = '{"a":1}\n{"b":2}\n{"c":3';

    const result = splitNdjsonLines(buffer);

    expect(result.lines).toEqual(['{"a":1}', '{"b":2}']);
    expect(result.rest).toBe('{"c":3');
  });

  it('버퍼가 개행으로 끝나면 rest는 빈 문자열이다', () => {
    const buffer = '{"a":1}\n{"b":2}\n';

    const result = splitNdjsonLines(buffer);

    expect(result.lines).toEqual(['{"a":1}', '{"b":2}']);
    expect(result.rest).toBe('');
  });

  it('빈 줄은 결과 라인에서 제외한다', () => {
    const buffer = '{"a":1}\n\n{"b":2}\n';

    const result = splitNdjsonLines(buffer);

    expect(result.lines).toEqual(['{"a":1}', '{"b":2}']);
  });
});
