const BASE = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, '');
const KEY = 'swiftdispatch-token';
export const tokenStore = {
  get: () => sessionStorage.getItem(KEY) || localStorage.getItem(KEY),
  set: (token: string, remember = false) => {
    tokenStore.clear();
    (remember ? localStorage : sessionStorage).setItem(KEY, token);
  },
  clear: () => {
    sessionStorage.removeItem(KEY);
    localStorage.removeItem(KEY);
  },
};
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = tokenStore.get();
  let response: Response;
  try {
    response = await fetch(BASE + path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new ApiError(
      0,
      'Unable to reach SwiftDispatch. Check that the backend is running on port 8000.',
    );
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    if (
      response.status === 401 &&
      token &&
      token === tokenStore.get() &&
      !path.startsWith('/auth/login')
    )
      window.dispatchEvent(new Event('auth-expired'));
    const detail = data?.detail;
    throw new ApiError(
      response.status,
      typeof detail === 'string'
        ? detail
        : Array.isArray(detail)
          ? detail
              .map((d: { loc: string[]; msg: string }) => `${d.loc.slice(1).join('.')}: ${d.msg}`)
              .join('; ')
          : 'Something went wrong. Please try again.',
    );
  }
  return data as T;
}
export const post = <T>(path: string, body?: unknown) =>
  api<T>(path, { method: 'POST', ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
export const patch = <T>(path: string, body: unknown) =>
  api<T>(path, { method: 'PATCH', body: JSON.stringify(body) });
export async function allPages<T>(path: string): Promise<T[]> {
  const result: T[] = [];
  for (let offset = 0; offset < 10000; offset += 100) {
    const rows = await api<T[]>(
      `${path}${path.includes('?') ? '&' : '?'}limit=100&offset=${offset}`,
    );
    result.push(...rows);
    if (rows.length < 100) return result;
  }
  throw new Error('Too many records. Narrow the selection.');
}
