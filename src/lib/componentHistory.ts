import type { GeneratedComponent } from '../types';

const STORAGE_KEY = 'rcg:components';
export const MAX_HISTORY_SIZE = 20;

function parseStoredComponent(value: unknown): GeneratedComponent | null {
  if (typeof value !== 'object' || value === null) return null;
  const candidate = value as Record<string, unknown>;

  if (
    typeof candidate.id !== 'string' ||
    typeof candidate.prompt !== 'string' ||
    typeof candidate.code !== 'string' ||
    typeof candidate.createdAt !== 'string'
  ) {
    return null;
  }

  const createdAt = new Date(candidate.createdAt);
  if (Number.isNaN(createdAt.getTime())) return null;

  return { id: candidate.id, prompt: candidate.prompt, code: candidate.code, createdAt };
}

export function loadHistory(): GeneratedComponent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const components = parsed.map(parseStoredComponent);
    if (components.some((component) => component === null)) return [];

    return components as GeneratedComponent[];
  } catch {
    return [];
  }
}

export function saveHistory(components: GeneratedComponent[]): void {
  const capped = components.slice(0, MAX_HISTORY_SIZE);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(capped));
  } catch {
    // localStorage 접근 불가/용량 초과 등은 히스토리를 저장하지 못할 뿐 앱 동작에는 영향이 없어야 한다.
  }
}

export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}
