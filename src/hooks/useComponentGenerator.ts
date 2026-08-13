import { useState, useCallback, useEffect } from 'react';
import type { GeneratedComponent, Provider } from '../types';

const STORAGE_KEY = 'componentHistory';
const MAX_COMPONENTS = 20;

interface StoredComponent {
  id: string;
  prompt: string;
  code: string;
  createdAt: string;
}

interface UseComponentGeneratorReturn {
  components: GeneratedComponent[];
  isLoading: boolean;
  error: string | null;
  generate: (prompt: string, apiKey: string | undefined, provider: Provider) => Promise<void>;
  removeComponent: (id: string) => void;
  clearAll: () => void;
  saveToLocalStorage: () => void;
}

function serializeComponent(component: GeneratedComponent): StoredComponent {
  return {
    ...component,
    createdAt: component.createdAt.toISOString(),
  };
}

function deserializeComponent(stored: StoredComponent): GeneratedComponent {
  return {
    ...stored,
    createdAt: new Date(stored.createdAt),
  };
}

export function useComponentGenerator(): UseComponentGeneratorReturn {
  const [components, setComponents] = useState<GeneratedComponent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: StoredComponent[] = JSON.parse(stored);
        const deserialized = parsed.map(deserializeComponent);
        setComponents(deserialized);
      }
    } catch {
      // Ignore localStorage errors on init
    }
  }, []);

  const saveToLocalStorage = useCallback(() => {
    try {
      const toSave = components.slice(0, MAX_COMPONENTS);
      const serialized = toSave.map(serializeComponent);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save';
      setError(message);
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

      setComponents((prev) => [newComponent, ...prev]);
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

  return { components, isLoading, error, generate, removeComponent, clearAll, saveToLocalStorage };
}
