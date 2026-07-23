import { useState, useCallback, useEffect } from 'react';
import type { GeneratedComponent, Provider } from '../types';
import { HISTORY_KEY, parseHistory, capHistory } from '../lib/history';

interface UseComponentGeneratorReturn {
  components: GeneratedComponent[];
  isLoading: boolean;
  error: string | null;
  generate: (prompt: string, apiKey: string | undefined, provider: Provider) => Promise<void>;
  removeComponent: (id: string) => void;
  clearAll: () => void;
}

export function useComponentGenerator(): UseComponentGeneratorReturn {
  const [components, setComponents] = useState<GeneratedComponent[]>(() =>
    capHistory(parseHistory(localStorage.getItem(HISTORY_KEY)))
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 히스토리가 바뀔 때마다 localStorage에 반영한다.
  // 용량 초과·프라이빗 모드 등으로 저장이 실패해도 앱 동작을 막지 않는다.
  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(components));
    } catch {
      // 저장 실패는 무시한다.
    }
  }, [components]);

  const generate = useCallback(async (prompt: string, apiKey: string | undefined, provider: Provider) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, ...(apiKey && { apiKey }), provider }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate component');
      }

      const newComponent: GeneratedComponent = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        prompt,
        code: data.code,
        createdAt: new Date(),
      };

      setComponents((prev) => capHistory([newComponent, ...prev]));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const removeComponent = useCallback((id: string) => {
    setComponents((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setComponents([]);
  }, []);

  return { components, isLoading, error, generate, removeComponent, clearAll };
}
