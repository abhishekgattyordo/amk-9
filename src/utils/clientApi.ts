/**
 * Utility functions for making authenticated client-side API requests.
 */

export function getAuthHeaders(customHeaders?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };

  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('erp_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const userStr = localStorage.getItem('erp_currentUser');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user?.email) headers['x-user-email'] = user.email;
        if (user?.role) headers['x-user-role'] = typeof user.role === 'object' ? user.role.name : user.role;
        if (user?.id) headers['x-user-id'] = user.id;
      } catch {}
    } else {
      // Default to administrator session if no local storage override
      headers['x-user-email'] = 'rajesh.sharma@amkerp.com';
      headers['x-user-role'] = 'Administrator';
      headers['x-user-id'] = 'USR-001';
    }
  }

  return headers;
}

export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = getAuthHeaders(options.headers as Record<string, string>);
  return fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });
}
