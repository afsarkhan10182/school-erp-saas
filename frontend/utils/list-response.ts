/**
 * Normalize list payloads from APIs that return either:
 * - { data: [...] }
 * - { data: { students: [...] } } / { records, classes, ... }
 */
export function extractList<T = any>(
  response: any,
  keys: string[] = ['items', 'records', 'students', 'classes', 'users', 'rows']
): T[] {
  const data = response?.data ?? response;
  if (Array.isArray(data)) return data as T[];
  if (!data || typeof data !== 'object') return [];
  for (const key of keys) {
    if (Array.isArray(data[key])) return data[key] as T[];
  }
  if (data.data && data.data !== data) return extractList<T>(data.data, keys);
  return [];
}

export function apiErrorMessage(error: any, fallback = 'Request failed'): string {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}
