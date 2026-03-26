import type { WireSubscriber, WireVerifyResponse } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function getToken(): string | null {
  return localStorage.getItem('token');
}

export async function request(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.error?.message || data.message || 'Request failed') as Error & { status: number };
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  me: () => request('/auth/me').then((res) => res.data ?? res),

  requestOtp: (phoneNumber: string) =>
    request('/auth/request-otp', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber }),
    }),

  verify: (
    phoneNumber: string,
    otp: string,
    name?: string,
    deviceId?: string,
    deviceType?: string,
  ): Promise<WireVerifyResponse> =>
    request('/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber, otp, name, deviceId, deviceType }),
    }).then((res) => res.data ?? res),

  lookupSubscriber: (phone: string): Promise<WireSubscriber> =>
    request(`/subscribers/lookup?phone=${encodeURIComponent(phone)}`).then((res) => res.data ?? res),

  getPendingMessages: (
    deviceId: string,
    cursor?: string,
    limit = 50,
  ): Promise<{ items: any[]; nextCursor: string | null }> => {
    const params = new URLSearchParams({ deviceId, limit: String(limit) });
    if (cursor) params.set('cursor', cursor);
    return request(`/messages/pending?${params}`).then((res) => res.data ?? res);
  },

  ackPendingMessages: (deviceId: string, ids: string[]): Promise<void> =>
    request('/messages/pending/ack', {
      method: 'POST',
      body: JSON.stringify({ deviceId, ids }),
    }),
};
