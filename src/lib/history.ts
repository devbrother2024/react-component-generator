import type { GeneratedComponent } from '../types';

export const HISTORY_KEY = 'react-component-generator:history';
export const MAX_HISTORY = 20;

interface StoredRecord {
  id: string;
  prompt: string;
  code: string;
  createdAt: string;
}

function isStoredRecord(value: unknown): value is StoredRecord {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === 'string' &&
    typeof record.prompt === 'string' &&
    typeof record.code === 'string'
  );
}

/**
 * localStorage에서 읽은 원문을 히스토리 배열로 복원한다.
 * JSON 직렬화로 문자열이 된 createdAt을 Date로 되살리고,
 * 손상되었거나 형식이 맞지 않는 데이터는 앱을 죽이지 않도록 조용히 걸러낸다.
 */
export function parseHistory(raw: string | null): GeneratedComponent[] {
  if (!raw) return [];

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return [];
  }

  if (!Array.isArray(data)) return [];

  return data.filter(isStoredRecord).map((record) => ({
    id: record.id,
    prompt: record.prompt,
    code: record.code,
    createdAt: new Date(record.createdAt),
  }));
}

/** 최근 MAX_HISTORY개만 유지한다(항목은 최신순 정렬 가정). */
export function capHistory(components: GeneratedComponent[]): GeneratedComponent[] {
  return components.slice(0, MAX_HISTORY);
}
