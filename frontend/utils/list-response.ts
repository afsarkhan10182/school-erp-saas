/**
 * Normalize list payloads from APIs that return either:
 * - { data: [...] }
 * - { data: { students: [...] } } / { records, classes, ... }
 */
export function extractList<T = any>(
  response: any,
  keys: string[] = ['items', 'records', 'students', 'classes', 'users', 'rows', 'categories', 'suppliers', 'stores', 'issues', 'routes', 'vehicles', 'allocations', 'hostels', 'roomTypes', 'rooms', 'events', 'accounts', 'expenses', 'incomes', 'transactions', 'fines', 'homeworks', 'books', 'templates', 'seatings', 'exams', 'parents']
): T[] {
  if (!response) return [];
  if (Array.isArray(response)) return response as T[];
  const data = response?.data ?? response;
  if (Array.isArray(data)) return data as T[];
  if (!data || typeof data !== 'object') return [];

  for (const key of keys) {
    if (Array.isArray(data[key])) return data[key] as T[];
  }

  // Find any array property in data
  for (const val of Object.values(data)) {
    if (Array.isArray(val)) return val as T[];
  }

  if (data.data && data.data !== data) return extractList<T>(data.data, keys);
  return [];
}

export function apiErrorMessage(error: any, fallback = 'Request failed'): string {
  return (
    error?.response?.data?.message || error?.response?.data?.error || error?.message || fallback
  );
}
