import { apiRequest } from './queryClient';

// Override the queryClient to include auth headers
const originalApiRequest = apiRequest;

export async function apiRequestWithAuth(
  method: string,
  url: string,
  data?: unknown
): Promise<Response> {
  const token = localStorage.getItem('accessToken');
  
  const res = await fetch(url, {
    method,
    headers: {
      ...(data ? { "Content-Type": "application/json" } : {}),
      ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    },
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  // Handle token refresh if needed
  if (res.status === 401 && token) {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        const refreshRes = await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        
        if (refreshRes.ok) {
          const { accessToken } = await refreshRes.json();
          localStorage.setItem('accessToken', accessToken);
          
          // Retry original request with new token
          return await fetch(url, {
            method,
            headers: {
              ...(data ? { "Content-Type": "application/json" } : {}),
              "Authorization": `Bearer ${accessToken}`,
            },
            body: data ? JSON.stringify(data) : undefined,
            credentials: "include",
          });
        }
      } catch (error) {
        // Refresh failed, redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }
  }

  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }

  return res;
}

// Override the global apiRequest function
(window as any).apiRequest = apiRequestWithAuth;
