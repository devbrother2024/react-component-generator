import { useState, useCallback, useEffect } from 'react';
import type { GeneratedComponent, Provider } from '../types';
import { splitNdjsonLines } from '../lib/ndjson';

interface UseComponentGeneratorReturn {
  components: GeneratedComponent[];
  streamingComponent: GeneratedComponent | null;
  isLoading: boolean;
  error: string | null;
  generate: (prompt: string, apiKey: string | undefined, provider: Provider) => Promise<void>;
  removeComponent: (id: string) => void;
  clearAll: () => void;
}

type GenerateStreamEvent =
  | { type: 'delta'; text: string }
  | { type: 'done'; code: string }
  | { type: 'error'; message: string };

const STORAGE_KEY = 'rcg:components';

function loadStoredComponents(): GeneratedComponent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.map((item) => ({ ...item, createdAt: new Date(item.createdAt) }));
  } catch {
    return [];
  }
}

function createComponentId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function isGenerateStreamEvent(value: unknown): value is GenerateStreamEvent {
  if (typeof value !== 'object' || value === null || !('type' in value)) return false;

  const event = value as { type: unknown; text?: unknown; code?: unknown; message?: unknown };

  if (event.type === 'delta') return typeof event.text === 'string';
  if (event.type === 'done') return typeof event.code === 'string';
  if (event.type === 'error') return typeof event.message === 'string';
  return false;
}

async function consumeGenerateStream(
  body: ReadableStream<Uint8Array>,
  onEvent: (event: GenerateStreamEvent) => void,
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const { lines, rest } = splitNdjsonLines(buffer);
    buffer = rest;

    for (const line of lines) {
      const parsed: unknown = JSON.parse(line);
      if (isGenerateStreamEvent(parsed)) onEvent(parsed);
    }
  }

  if (buffer.trim()) {
    const parsed: unknown = JSON.parse(buffer);
    if (isGenerateStreamEvent(parsed)) onEvent(parsed);
  }
}

export function useComponentGenerator(): UseComponentGeneratorReturn {
  const [components, setComponents] = useState<GeneratedComponent[]>(loadStoredComponents);
  const [streamingComponent, setStreamingComponent] = useState<GeneratedComponent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(components));
    } catch (err) {
      // 저장 공간 초과 등으로 영속화에 실패해도 앱 동작에는 영향을 주지 않되,
      // 다음 새로고침 시 최근 컴포넌트가 사라질 수 있다는 걸 콘솔로는 알린다.
      console.warn('컴포넌트를 localStorage에 저장하지 못했습니다.', err);
    }
  }, [components]);

  const generate = useCallback(async (prompt: string, apiKey: string | undefined, provider: Provider) => {
    setIsLoading(true);
    setError(null);

    const id = createComponentId();
    const createdAt = new Date();
    setStreamingComponent({ id, prompt, code: '', createdAt });

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, ...(apiKey && { apiKey }), provider }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to generate component');
      }

      if (!res.body) {
        throw new Error('스트리밍 응답을 받지 못했습니다.');
      }

      let finalCode: string | null = null;
      let streamErrorMessage: string | null = null;

      await consumeGenerateStream(res.body, (event) => {
        if (event.type === 'delta') {
          setStreamingComponent((prev) => (prev ? { ...prev, code: prev.code + event.text } : prev));
        } else if (event.type === 'done') {
          finalCode = event.code;
        } else if (event.type === 'error') {
          streamErrorMessage = event.message;
        }
      });

      if (streamErrorMessage) {
        throw new Error(streamErrorMessage);
      }

      if (finalCode === null) {
        throw new Error('생성된 코드를 받지 못했습니다.');
      }

      const newComponent: GeneratedComponent = { id, prompt, code: finalCode, createdAt };
      setComponents((prev) => [newComponent, ...prev]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    } finally {
      setStreamingComponent(null);
      setIsLoading(false);
    }
  }, []);

  const removeComponent = useCallback((id: string) => {
    setComponents((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setComponents([]);
  }, []);

  return { components, streamingComponent, isLoading, error, generate, removeComponent, clearAll };
}
