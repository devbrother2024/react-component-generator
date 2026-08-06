import { describe, it, expect } from 'vitest';
import { stripCodeFences, ensureRenderCall, toFriendlyErrorMessage } from './generator';

describe('stripCodeFences', () => {
  it('언어 태그가 붙은 코드펜스를 제거한다', () => {
    const input = '```tsx\nconst A = () => null;\n```';
    expect(stripCodeFences(input)).toBe('const A = () => null;');
  });

  it('언어 태그 없는 코드펜스도 제거한다', () => {
    const input = '```\nconst A = 1;\n```';
    expect(stripCodeFences(input)).toBe('const A = 1;');
  });

  it('펜스가 없으면 앞뒤 공백만 정리해 그대로 반환한다', () => {
    expect(stripCodeFences('  const A = 1;  ')).toBe('const A = 1;');
  });
});

describe('ensureRenderCall', () => {
  it('이미 render() 호출이 있으면 그대로 둔다', () => {
    const code = 'const Card = () => null;\nrender(<Card />);';
    expect(ensureRenderCall(code)).toBe(code);
  });

  it('const 컴포넌트 선언에 render 호출을 주입한다', () => {
    const code = 'const Card = () => null;';
    expect(ensureRenderCall(code)).toBe(`${code}\n\nrender(<Card />);`);
  });

  it('function 선언 컴포넌트에도 render 호출을 주입한다', () => {
    const code = 'function Widget() { return null; }';
    expect(ensureRenderCall(code)).toContain('render(<Widget />);');
  });

  it('대문자로 시작하는 컴포넌트 선언이 없으면 원본을 그대로 반환한다', () => {
    const code = 'const value = 42;';
    expect(ensureRenderCall(code)).toBe(code);
  });
});

describe('toFriendlyErrorMessage', () => {
  it('503을 포함한 메시지는 과부하 안내 문구로 바꾼다', () => {
    expect(toFriendlyErrorMessage('Claude API error: 503')).toBe(
      'API 서버가 일시적으로 과부하 상태입니다. 잠시 후 다시 시도해주세요.',
    );
  });

  it('429를 포함한 메시지는 요청 과다 안내 문구로 바꾼다', () => {
    expect(toFriendlyErrorMessage('Gemini API error: 429')).toBe(
      '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
    );
  });

  it('해당하지 않는 메시지는 그대로 반환한다', () => {
    expect(toFriendlyErrorMessage('네트워크 오류')).toBe('네트워크 오류');
  });
});
