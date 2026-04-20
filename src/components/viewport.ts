export type Viewport = 'mobile' | 'tablet' | 'desktop';

export const VIEWPORT_WIDTHS: Record<Viewport, number> = {
  mobile: 375,
  tablet: 768,
  desktop: 1280,
};

export const VIEWPORT_LABELS: Record<Viewport, string> = {
  mobile: '📱 모바일',
  tablet: '📱 태블릿',
  desktop: '🖥️ 데스크탑',
};

export const getViewportSize = (viewport: Viewport): number => VIEWPORT_WIDTHS[viewport];

export const getViewportLabel = (viewport: Viewport): string => VIEWPORT_LABELS[viewport];

export const getAllViewports = (): Viewport[] =>
  Object.keys(VIEWPORT_LABELS) as Viewport[];
