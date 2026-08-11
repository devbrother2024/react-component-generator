import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { useElementSize } from './useElementSize';

type MockResizeCallback = (entries: [{ contentRect: { width: number; height: number } }]) => void;

class MockResizeObserver {
  static instances: MockResizeObserver[] = [];
  callback: MockResizeCallback;

  constructor(callback: MockResizeCallback) {
    this.callback = callback;
    MockResizeObserver.instances.push(this);
  }

  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

function fireResize(instance: MockResizeObserver, width: number, height: number) {
  instance.callback([{ contentRect: { width, height } }]);
}

function Probe({ onSize }: { onSize: (size: { width: number; height: number } | null) => void }) {
  const { ref, size } = useElementSize<HTMLDivElement>();
  onSize(size);
  return (
    <div ref={ref} data-testid="probe">
      {size ? `${size.width}x${size.height}` : 'null'}
    </div>
  );
}

describe('useElementSize', () => {
  beforeEach(() => {
    MockResizeObserver.instances = [];
    vi.stubGlobal('ResizeObserver', MockResizeObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('마운트 직후 size는 null이다', () => {
    render(<Probe onSize={() => {}} />);
    expect(screen.getByTestId('probe').textContent).toBe('null');
  });

  it('ResizeObserver 콜백이 발생하면 반올림한 크기로 갱신한다', () => {
    render(<Probe onSize={() => {}} />);
    const [instance] = MockResizeObserver.instances;

    act(() => {
      fireResize(instance, 100.4, 200.6);
    });

    expect(screen.getByTestId('probe').textContent).toBe('100x201');
  });

  it('반올림 결과가 이전 값과 같으면 size 참조를 그대로 유지한다 (불필요한 리렌더 유발 방지)', () => {
    const sizes: Array<{ width: number; height: number } | null> = [];
    render(<Probe onSize={(size) => sizes.push(size)} />);
    const [instance] = MockResizeObserver.instances;

    act(() => {
      fireResize(instance, 100, 200);
    });
    const sizeAfterFirstFire = sizes[sizes.length - 1];

    act(() => {
      fireResize(instance, 100.4, 200.2);
    });
    const sizeAfterSecondFire = sizes[sizes.length - 1];

    expect(sizeAfterSecondFire).toBe(sizeAfterFirstFire);
  });

  it('반올림 결과가 실제로 달라지면 size 참조도 새로 만든다', () => {
    const sizes: Array<{ width: number; height: number } | null> = [];
    render(<Probe onSize={(size) => sizes.push(size)} />);
    const [instance] = MockResizeObserver.instances;

    act(() => {
      fireResize(instance, 100, 200);
    });
    const sizeAfterFirstFire = sizes[sizes.length - 1];

    act(() => {
      fireResize(instance, 150, 200);
    });
    const sizeAfterSecondFire = sizes[sizes.length - 1];

    expect(sizeAfterSecondFire).not.toBe(sizeAfterFirstFire);
    expect(sizeAfterSecondFire).toEqual({ width: 150, height: 200 });
  });

  it('unmount 시 ResizeObserver를 disconnect한다', () => {
    const { unmount } = render(<Probe onSize={() => {}} />);
    const [instance] = MockResizeObserver.instances;

    unmount();

    expect(instance.disconnect).toHaveBeenCalledTimes(1);
  });
});
