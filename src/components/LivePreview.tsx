import { LiveProvider, LivePreview as ReactLivePreview, LiveError } from 'react-live';
import { useElementSize } from '../hooks/useElementSize';

interface LivePreviewProps {
  code: string;
}

export function LivePreview({ code }: LivePreviewProps) {
  const { ref, size } = useElementSize<HTMLDivElement>();

  return (
    <div className="preview-panel">
      <div className="panel-header">
        <h3>미리보기</h3>
      </div>
      <div className="preview-content">
        <LiveProvider code={code} noInline>
          <div className="preview-render" ref={ref}>
            <ReactLivePreview />
          </div>
          <LiveError className="preview-error" />
        </LiveProvider>
        <div className="dimension-line" aria-hidden={!size}>
          <span className="dimension-tick" />
          <span className="dimension-value">
            {size ? `${size.width} × ${size.height}` : '— × —'}
          </span>
          <span className="dimension-tick" />
        </div>
      </div>
    </div>
  );
}
