import { useState } from 'react';
import { LiveProvider, LivePreview as ReactLivePreview, LiveError } from 'react-live';

interface LivePreviewProps {
  code: string;
}

const VIEWPORTS = [
  { id: 'mobile', label: '모바일', width: 375 },
  { id: 'tablet', label: '태블릿', width: 768 },
  { id: 'desktop', label: '데스크탑', width: null },
] as const;

type ViewportId = (typeof VIEWPORTS)[number]['id'];

export function LivePreview({ code }: LivePreviewProps) {
  const [viewport, setViewport] = useState<ViewportId>('desktop');
  const activeWidth = VIEWPORTS.find((v) => v.id === viewport)?.width ?? null;

  return (
    <div className="preview-panel">
      <div className="panel-header">
        <h3>미리보기</h3>
        <div className="viewport-toggle">
          {VIEWPORTS.map((v) => (
            <button
              key={v.id}
              className={`viewport-btn ${viewport === v.id ? 'viewport-btn--active' : ''}`}
              onClick={() => setViewport(v.id)}
              aria-pressed={viewport === v.id}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>
      <div className="preview-content">
        <LiveProvider code={code} noInline>
          <div
            className="preview-render"
            style={activeWidth ? { maxWidth: activeWidth } : undefined}
          >
            <ReactLivePreview />
          </div>
          <LiveError className="preview-error" />
        </LiveProvider>
      </div>
    </div>
  );
}
