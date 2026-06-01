export function getResponseItems<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];

  if (!payload || typeof payload !== 'object') return [];

  const value = payload as {
    items?: unknown;
    data?: unknown;
    results?: unknown;
  };

  if (Array.isArray(value.items)) return value.items as T[];
  if (Array.isArray(value.data)) return value.data as T[];
  if (Array.isArray(value.results)) return value.results as T[];

  return [];
}
