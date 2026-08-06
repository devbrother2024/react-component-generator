// 서버가 보내는 NDJSON(줄바꿈으로 구분된 JSON) 스트림을 파싱하는 순수 함수.

/**
 * 버퍼를 완결된 라인들과 아직 완결되지 않은 나머지(rest)로 분리한다.
 * 빈 줄은 결과에서 제외한다.
 */
export function splitNdjsonLines(buffer: string): { lines: string[]; rest: string } {
  const parts = buffer.split('\n');
  const rest = parts.pop() ?? '';
  const lines = parts.filter((line) => line.trim().length > 0);
  return { lines, rest };
}
