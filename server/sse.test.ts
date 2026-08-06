import { describe, it, expect } from 'vitest';
import {
  splitSSEEvents,
  extractSSEData,
  extractAnthropicDeltaText,
  extractGoogleDeltaText,
  isGoogleMaxTokensFinish,
} from './sse';

describe('splitSSEEvents', () => {
  it('빈 문자열이면 이벤트 없이 그대로 반환한다', () => {
    expect(splitSSEEvents('')).toEqual({ events: [], rest: '' });
  });

  it('완결된 이벤트 블록들을 분리하고 미완결 나머지를 rest로 남긴다', () => {
    const buffer = 'event: a\ndata: 1\n\nevent: b\ndata: 2\n\nevent: c\ndata: 3';

    const result = splitSSEEvents(buffer);

    expect(result.events).toEqual(['event: a\ndata: 1', 'event: b\ndata: 2']);
    expect(result.rest).toBe('event: c\ndata: 3');
  });

  it('버퍼가 이벤트 구분자로 끝나면 rest는 빈 문자열이다', () => {
    const buffer = 'data: 1\n\ndata: 2\n\n';

    const result = splitSSEEvents(buffer);

    expect(result.events).toEqual(['data: 1', 'data: 2']);
    expect(result.rest).toBe('');
  });
});

describe('extractSSEData', () => {
  it('data: 라인의 값을 추출한다', () => {
    expect(extractSSEData('event: content_block_delta\ndata: {"foo":1}')).toBe('{"foo":1}');
  });

  it('여러 줄의 data: 라인은 개행으로 합쳐 반환한다', () => {
    expect(extractSSEData('data: line1\ndata: line2')).toBe('line1\nline2');
  });

  it('data 라인이 없으면 null을 반환한다', () => {
    expect(extractSSEData('event: ping')).toBeNull();
  });

  it('주석(:으로 시작)만 있으면 null을 반환한다', () => {
    expect(extractSSEData(': heartbeat')).toBeNull();
  });
});

describe('extractAnthropicDeltaText', () => {
  it('content_block_delta의 text_delta에서 텍스트를 추출한다', () => {
    const event = {
      type: 'content_block_delta',
      delta: { type: 'text_delta', text: '안녕' },
    };
    expect(extractAnthropicDeltaText(event)).toBe('안녕');
  });

  it('text_delta가 아닌 delta 타입이면 null을 반환한다', () => {
    const event = {
      type: 'content_block_delta',
      delta: { type: 'input_json_delta', partial_json: '{}' },
    };
    expect(extractAnthropicDeltaText(event)).toBeNull();
  });

  it('content_block_delta가 아닌 이벤트면 null을 반환한다', () => {
    expect(extractAnthropicDeltaText({ type: 'message_stop' })).toBeNull();
  });

  it('형식에 맞지 않는 값이면 null을 반환한다', () => {
    expect(extractAnthropicDeltaText(null)).toBeNull();
    expect(extractAnthropicDeltaText('not an object')).toBeNull();
  });
});

describe('extractGoogleDeltaText', () => {
  it('candidates의 parts 텍스트를 이어붙여 반환한다', () => {
    const event = {
      candidates: [
        { content: { parts: [{ text: '안' }, { text: '녕' }] } },
      ],
    };
    expect(extractGoogleDeltaText(event)).toBe('안녕');
  });

  it('parts가 없으면 null을 반환한다', () => {
    expect(extractGoogleDeltaText({ candidates: [{ content: {} }] })).toBeNull();
  });

  it('candidates가 없으면 null을 반환한다', () => {
    expect(extractGoogleDeltaText({})).toBeNull();
  });

  it('형식에 맞지 않는 값이면 null을 반환한다', () => {
    expect(extractGoogleDeltaText(null)).toBeNull();
    expect(extractGoogleDeltaText('not an object')).toBeNull();
  });
});

describe('isGoogleMaxTokensFinish', () => {
  it('finishReason이 MAX_TOKENS이면 true를 반환한다', () => {
    const event = { candidates: [{ finishReason: 'MAX_TOKENS' }] };
    expect(isGoogleMaxTokensFinish(event)).toBe(true);
  });

  it('finishReason이 다른 값이면 false를 반환한다', () => {
    const event = { candidates: [{ finishReason: 'STOP' }] };
    expect(isGoogleMaxTokensFinish(event)).toBe(false);
  });

  it('candidates가 없으면 false를 반환한다', () => {
    expect(isGoogleMaxTokensFinish({})).toBe(false);
  });

  it('형식에 맞지 않는 값이면 false를 반환한다', () => {
    expect(isGoogleMaxTokensFinish(null)).toBe(false);
    expect(isGoogleMaxTokensFinish('not an object')).toBe(false);
  });
});
