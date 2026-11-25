export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, body?: unknown) {
    super(`Request failed (${status})`);
    this.status = status;
    this.body = body;
  }
}

async function parse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => undefined);
    throw new ApiError(res.status, body);
  }
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export async function get<T>(path: string): Promise<T> {
  return parse<T>(await fetch(path));
}

export async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  return parse<T>(res);
}

export async function put<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  return parse<T>(res);
}

export function conversationPath(contact: string, action = '') {
  return `/api/conversations/${encodeURIComponent(contact)}${action}`;
}

export function errorText(err: unknown) {
  if (err instanceof ApiError) return `The server returned an error (${err.status}).`;
  return 'Could not reach the server. Check your connection.';
}
