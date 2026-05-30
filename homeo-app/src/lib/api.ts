import { auth } from '@/contexts/AuthContext';
import { getAuth } from 'firebase/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface FetchOptions extends RequestInit {
  requireAuth?: boolean;
}

/**
 * Standard API client for calling the FastAPI backend.
 * Automatically attaches the Firebase ID token if requireAuth is true (default).
 */
export async function apiClient<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { requireAuth = true, headers: customHeaders, ...rest } = options;

  const headers = new Headers(customHeaders);
  headers.set('Content-Type', 'application/json');

  if (requireAuth) {
    const firebaseAuth = getAuth();
    const currentUser = firebaseAuth.currentUser;
    if (currentUser) {
      const token = await currentUser.getIdToken();
      headers.set('Authorization', `Bearer ${token}`);
    } else {
      console.warn('API client: requireAuth is true but no user is logged in.');
    }
  }

  const url = `${API_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  try {
    const response = await fetch(url, {
      ...rest,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.detail || errorData?.message || `API Error: ${response.status} ${response.statusText}`
      );
    }

    return (await response.json()) as T;
  } catch (error) {
    console.error(`API Client Error (${url}):`, error);
    throw error;
  }
}
