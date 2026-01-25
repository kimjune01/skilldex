/**
 * Base API request function
 *
 * Handles authentication, timeouts, and error parsing for all API calls.
 */

// API base URL - set via environment variable
// Dev: http://localhost:3000, Prod: https://api.skillomatic.technology
export const API_BASE = import.meta.env.VITE_API_URL;

export async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Request timeout. Please try again.');
    }
    if (err instanceof TypeError) {
      throw new Error('Network error. Please check your connection.');
    }
    throw err;
  }
  clearTimeout(timeoutId);

  if (!response.ok) {
    const data = await response.json().catch(() => ({ error: { message: 'Request failed' } }));
    throw new Error(data.error?.message || `Request failed (${response.status})`);
  }

  const data = await response.json();
  return data.data;
}
