import { useState } from 'react';
import { LiveProvider, LivePreview as ReactLivePreview, LiveError } from 'react-live';
import { VIEWPORT_WIDTHS, VIEWPORT_LABELS, getAllViewports, type Viewport } from './viewport';

interface LivePreviewProps {
  code: string;
}

export function LivePreview({ code }: LivePreviewProps) {
  const [viewport, setViewport] = useState<Viewport>('desktop');

  return (
    <div className="preview-panel">
      <div className="panel-header">
        <h3>미리보기</h3>
        <div className="viewport-selector">
          {getAllViewports().map((size) => (
            <button
              key={size}
              className={`viewport-btn ${viewport === size ? 'viewport-btn--active' : ''}`}
              onClick={() => setViewport(size)}
              title={`${VIEWPORT_WIDTHS[size]}px`}
            >
              {VIEWPORT_LABELS[size]}
            </button>
          ))}
        </div>
      </div>
      <div className="preview-content">
        <LiveProvider code={code} noInline>
          <div
            className="preview-render"
            style={{
              maxWidth: `${VIEWPORT_WIDTHS[viewport]}px`,
              margin: '0 auto',
            }}
          >
            <ReactLivePreview />
          </div>
          <LiveError className="preview-error" />
        </LiveProvider>
      </div>
    </div>
  );
}
