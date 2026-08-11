import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ComponentCard } from './ComponentCard';
import type { GeneratedComponent } from '../types';

const baseComponent: GeneratedComponent = {
  id: '1',
  prompt: '버튼',
  code: 'const A = () => null;\nrender(<A />);',
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
};

describe('ComponentCard - 스트리밍 탭 전환', () => {
  it('isStreaming이 없으면 기본적으로 미리보기 탭을 보여준다', () => {
    render(
      <ComponentCard component={baseComponent} onRemove={vi.fn()} onRegenerate={vi.fn()} isLoading={false} />,
    );

    expect(screen.getByRole('heading', { name: '미리보기' })).toBeInTheDocument();
  });

  it('isStreaming이 true이면 코드 탭을 보여준다', () => {
    render(
      <ComponentCard
        component={baseComponent}
        onRemove={vi.fn()}
        onRegenerate={vi.fn()}
        isLoading={false}
        isStreaming
      />,
    );

    expect(screen.getByRole('heading', { name: '코드' })).toBeInTheDocument();
  });

  it('isStreaming이 true에서 false로 바뀌면 미리보기 탭으로 자동 전환된다', () => {
    const { rerender } = render(
      <ComponentCard
        component={baseComponent}
        onRemove={vi.fn()}
        onRegenerate={vi.fn()}
        isLoading={false}
        isStreaming
      />,
    );

    expect(screen.getByRole('heading', { name: '코드' })).toBeInTheDocument();

    rerender(
      <ComponentCard
        component={baseComponent}
        onRemove={vi.fn()}
        onRegenerate={vi.fn()}
        isLoading={false}
        isStreaming={false}
      />,
    );

    expect(screen.getByRole('heading', { name: '미리보기' })).toBeInTheDocument();
  });
});
