import { useEffect, useRef, useState } from 'react';

interface Size {
  width: number;
  height: number;
}

export function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState<Size | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      const next = { width: Math.round(width), height: Math.round(height) };
      setSize((prev) => (prev && prev.width === next.width && prev.height === next.height ? prev : next));
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return { ref, size };
}
