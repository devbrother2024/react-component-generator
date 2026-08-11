// Anthropic/Google이 반환하는 Server-Sent Events 스트림을 파싱하는 순수 함수들.
// 부수효과가 없어 단위 테스트가 가능하다.

/**
 * SSE 텍스트 버퍼를 완결된 이벤트 블록(빈 줄로 구분)들과
 * 아직 완결되지 않은 나머지(rest)로 분리한다.
 */
export function splitSSEEvents(buffer: string): { events: string[]; rest: string } {
  const parts = buffer.split('\n\n');
  const rest = parts.pop() ?? '';
  return { events: parts, rest };
}

/** 이벤트 블록에서 `data:` 라인들의 값만 추출해 개행으로 합친다. */
export function extractSSEData(eventBlock: string): string | null {
  const dataLines = eventBlock
    .split('\n')
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice('data:'.length).trimStart());

  if (dataLines.length === 0) return null;
  return dataLines.join('\n');
}

/** Anthropic 스트리밍 이벤트에서 텍스트 델타를 추출한다. text_delta가 아니면 null. */
export function extractAnthropicDeltaText(eventData: unknown): string | null {
  if (typeof eventData !== 'object' || eventData === null) return null;

  const event = eventData as { type?: string; delta?: { type?: string; text?: string } };
  if (event.type !== 'content_block_delta') return null;
  if (event.delta?.type !== 'text_delta') return null;

  return event.delta.text ?? null;
}

/** Google 스트리밍 이벤트에서 candidates[0].content.parts의 텍스트를 이어붙여 반환한다. */
export function extractGoogleDeltaText(eventData: unknown): string | null {
  if (typeof eventData !== 'object' || eventData === null) return null;

  const event = eventData as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const parts = event.candidates?.[0]?.content?.parts;
  if (!parts || parts.length === 0) return null;

  const text = parts.map((part) => part.text ?? '').join('');
  return text.length > 0 ? text : null;
}

/** Google 스트리밍 이벤트가 토큰 한도 초과로 종료됐는지 확인한다. */
export function isGoogleMaxTokensFinish(eventData: unknown): boolean {
  if (typeof eventData !== 'object' || eventData === null) return false;

  const event = eventData as { candidates?: Array<{ finishReason?: string }> };
  return event.candidates?.[0]?.finishReason === 'MAX_TOKENS';
}
