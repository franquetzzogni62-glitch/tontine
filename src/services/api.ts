import { TontineGroup, Member, PaymentTransaction, AppNotification, User } from '../types';

const BASE_URL = '/api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || `Erreur serveur HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Auth
  async login(email: string, role?: string): Promise<{ success: boolean; user: User }> {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role }),
    });
    return handleResponse(res);
  },

  async register(userData: Partial<User>): Promise<{ success: boolean; user: User }> {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    return handleResponse(res);
  },

  // Groups
  async getGroups(status?: string): Promise<TontineGroup[]> {
    const query = status && status !== 'all' ? `?status=${encodeURIComponent(status)}` : '';
    const res = await fetch(`${BASE_URL}/groups${query}`);
    return handleResponse(res);
  },

  async getGroup(id: string): Promise<TontineGroup> {
    const res = await fetch(`${BASE_URL}/groups/${id}`);
    return handleResponse(res);
  },

  async createGroup(groupData: Omit<TontineGroup, 'id'>): Promise<TontineGroup> {
    const res = await fetch(`${BASE_URL}/groups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(groupData),
    });
    return handleResponse(res);
  },

  async updateGroup(id: string, updates: Partial<TontineGroup>): Promise<TontineGroup> {
    const res = await fetch(`${BASE_URL}/groups/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return handleResponse(res);
  },

  async deleteGroup(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${BASE_URL}/groups/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(res);
  },

  async advanceGroupRound(id: string): Promise<{ success: boolean; group: TontineGroup }> {
    const res = await fetch(`${BASE_URL}/groups/${id}/advance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse(res);
  },

  // Members
  async getMembers(): Promise<Member[]> {
    const res = await fetch(`${BASE_URL}/members`);
    return handleResponse(res);
  },

  async getMember(id: string): Promise<Member> {
    const res = await fetch(`${BASE_URL}/members/${id}`);
    return handleResponse(res);
  },

  async createMember(memberData: Omit<Member, 'id'>): Promise<Member> {
    const res = await fetch(`${BASE_URL}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(memberData),
    });
    return handleResponse(res);
  },

  async updateMember(id: string, updates: Partial<Member>): Promise<Member> {
    const res = await fetch(`${BASE_URL}/members/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return handleResponse(res);
  },

  async deleteMember(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${BASE_URL}/members/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(res);
  },

  // Payments
  async getPayments(filters?: { groupId?: string; memberId?: string; status?: string }): Promise<PaymentTransaction[]> {
    const params = new URLSearchParams();
    if (filters?.groupId) params.append('groupId', filters.groupId);
    if (filters?.memberId) params.append('memberId', filters.memberId);
    if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
    const query = params.toString() ? `?${params.toString()}` : '';

    const res = await fetch(`${BASE_URL}/payments${query}`);
    return handleResponse(res);
  },

  async createPayment(paymentData: Omit<PaymentTransaction, 'id' | 'transactionRef'>): Promise<PaymentTransaction> {
    const res = await fetch(`${BASE_URL}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData),
    });
    return handleResponse(res);
  },

  async verifyPayment(id: string): Promise<PaymentTransaction> {
    const res = await fetch(`${BASE_URL}/payments/${id}/verify`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse(res);
  },

  // Notifications
  async getNotifications(): Promise<AppNotification[]> {
    const res = await fetch(`${BASE_URL}/notifications`);
    return handleResponse(res);
  },

  async markNotificationRead(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${BASE_URL}/notifications/${id}/read`, {
      method: 'PUT',
    });
    return handleResponse(res);
  },

  async markAllNotificationsRead(): Promise<{ success: boolean }> {
    const res = await fetch(`${BASE_URL}/notifications/read-all`, {
      method: 'PUT',
    });
    return handleResponse(res);
  },

  // Stats
  async getStatsOverview() {
    const res = await fetch(`${BASE_URL}/stats/overview`);
    return handleResponse(res);
  },
};
