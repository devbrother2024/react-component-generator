import { describe, it, expect } from 'bun:test';

describe('Viewport Configuration', () => {
  it('VIEWPORT_WIDTHS에 mobile, tablet, desktop이 정의되어야 함', async () => {
    const { VIEWPORT_WIDTHS } = await import('./viewport');
    expect(VIEWPORT_WIDTHS).toBeDefined();
    expect(VIEWPORT_WIDTHS.mobile).toBe(375);
    expect(VIEWPORT_WIDTHS.tablet).toBe(768);
    expect(VIEWPORT_WIDTHS.desktop).toBe(1280);
  });

  it('VIEWPORT_LABELS에 모든 뷰포트 라벨이 정의되어야 함', async () => {
    const { VIEWPORT_LABELS } = await import('./viewport');
    expect(VIEWPORT_LABELS).toBeDefined();
    expect(VIEWPORT_LABELS.mobile).toContain('모바일');
    expect(VIEWPORT_LABELS.tablet).toContain('태블릿');
    expect(VIEWPORT_LABELS.desktop).toContain('데스크탑');
  });

  it('라벨과 너비 설정의 키가 일치해야 함', async () => {
    const { VIEWPORT_WIDTHS, VIEWPORT_LABELS } = await import('./viewport');
    const widthKeys = Object.keys(VIEWPORT_WIDTHS).sort();
    const labelKeys = Object.keys(VIEWPORT_LABELS).sort();

    expect(widthKeys).toEqual(labelKeys);
  });

  it('getAllViewports()는 모든 뷰포트를 배열로 반환해야 함', async () => {
    const { getAllViewports } = await import('./viewport');
    const viewports = getAllViewports();

    expect(viewports).toContain('mobile');
    expect(viewports).toContain('tablet');
    expect(viewports).toContain('desktop');
    expect(viewports.length).toBe(3);
  });
});

describe('LivePreview Component', () => {
  it('LivePreview 컴포넌트가 렌더링 가능해야 함', async () => {
    const { LivePreview } = await import('./LivePreview');
    expect(LivePreview).toBeDefined();
    expect(typeof LivePreview).toBe('function');
  });
});
