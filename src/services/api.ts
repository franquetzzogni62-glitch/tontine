import {
  TontineGroup,
  Member,
  PaymentTransaction,
  PayoutTransaction,
  TontineFinancialSummary,
  PenaltyTopupPayload,
  PenaltyTopupResult,
  AppNotification,
  User,
  KycStatus,
} from '../types';

const BASE_URL = '/api';

function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('tontiflow_auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    if (res.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('tontiflow_auth_token');
        localStorage.removeItem('tontiflow_user_session');
        window.dispatchEvent(new CustomEvent('tontiflow_unauthorized'));
      }
    }
    throw new Error(errorBody.error || `Erreur serveur HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Auth & Token management
  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('tontiflow_auth_token');
  },

  setToken(token: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('tontiflow_auth_token', token);
    }
  },

  clearToken() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tontiflow_auth_token');
      localStorage.removeItem('tontiflow_user_session');
      localStorage.removeItem('tontiflow_member_group_id');
    }
  },

  async loginModerator(email: string, password: string): Promise<{ success: boolean; token: string; user: User }> {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await handleResponse<{ success: boolean; token: string; user: User }>(res);
    if (data.token) {
      this.setToken(data.token);
    }
    return data;
  },

  async loginMember(phone: string, accessCode: string): Promise<{
    success: boolean;
    token: string;
    user: User;
    member: Member;
    group: TontineGroup;
    groupId: string;
  }> {
    const res = await fetch(`${BASE_URL}/auth/member-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, accessCode }),
    });
    const data = await handleResponse<any>(res);
    if (data.token) {
      this.setToken(data.token);
    }
    return data;
  },

  async registerModerator(userData: {
    name: string;
    organizationName?: string;
    email: string;
    phone: string;
    password: string;
    planId?: string;
  }): Promise<{ success: boolean; token: string; user: User }> {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    const data = await handleResponse<{ success: boolean; token: string; user: User }>(res);
    if (data.token) {
      this.setToken(data.token);
    }
    return data;
  },

  async logout(): Promise<void> {
    const headers = getAuthHeaders();
    this.clearToken();
    try {
      await fetch(`${BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
      });
    } catch {
      // offline cleanup
    }
  },

  async checkCurrentSession(): Promise<{ success: boolean; user: User }> {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async getPublicGroup(groupId: string): Promise<any> {
    const res = await fetch(`${BASE_URL}/public/groups/${groupId}`);
    return handleResponse(res);
  },

  // Users profile management
  async getUser(id: string): Promise<User> {
    const res = await fetch(`${BASE_URL}/users/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async updateKycStatus(userId: string, kycStatus: KycStatus): Promise<{ success: boolean; user: User }> {
    const res = await fetch(`${BASE_URL}/users/${userId}/kyc`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ kycStatus }),
    });
    return handleResponse(res);
  },

  async updateTrustScore(userId: string, trustScore: number): Promise<{ success: boolean; user: User }> {
    const res = await fetch(`${BASE_URL}/users/${userId}/trust-score`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ trustScore }),
    });
    return handleResponse(res);
  },

  // Groups / Tontines
  async getGroups(status?: string, type?: string): Promise<TontineGroup[]> {
    const params = new URLSearchParams();
    if (status && status !== 'all') params.append('status', status);
    if (type && type !== 'all') params.append('type', type);
    const query = params.toString() ? `?${params.toString()}` : '';

    const res = await fetch(`${BASE_URL}/tontines${query}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async getGroup(id: string): Promise<TontineGroup> {
    const res = await fetch(`${BASE_URL}/tontines/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async createGroup(groupData: Omit<TontineGroup, 'id'>): Promise<TontineGroup> {
    const res = await fetch(`${BASE_URL}/tontines`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(groupData),
    });
    return handleResponse(res);
  },

  async updateGroup(id: string, updates: Partial<TontineGroup>): Promise<TontineGroup> {
    const res = await fetch(`${BASE_URL}/tontines/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(updates),
    });
    return handleResponse(res);
  },

  async deleteGroup(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${BASE_URL}/tontines/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async getPotStatus(groupId: string) {
    const res = await fetch(`${BASE_URL}/tontines/${groupId}/pot-status`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async getTontineSummary(groupId: string): Promise<TontineFinancialSummary> {
    const res = await fetch(`${BASE_URL}/tontine/summary/${groupId}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<TontineFinancialSummary>(res);
  },

  async processTontinePayout(payload: {
    groupId: string;
    roundId?: number;
    operator?: string;
    force?: boolean;
    notes?: string;
  }): Promise<{
    success: boolean;
    message: string;
    payout: PayoutTransaction;
    summary: TontineFinancialSummary;
    updatedGroup: TontineGroup;
    payoutRef: string;
  }> {
    const res = await fetch(`${BASE_URL}/tontine/payout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async payoutPot(
    groupId: string,
    options?: { force?: boolean; notes?: string; operator?: string }
  ): Promise<{
    success: boolean;
    message: string;
    report: any;
    updatedGroup: TontineGroup;
    payoutRef: string;
    payout?: PayoutTransaction;
  }> {
    const res = await fetch(`${BASE_URL}/tontine/payout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ groupId, ...(options || {}) }),
    });
    return handleResponse(res);
  },

  async payPenaltyAndTopup(payload: PenaltyTopupPayload): Promise<PenaltyTopupResult> {
    const res = await fetch(`${BASE_URL}/tontine/pay-penalty-and-topup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(payload),
    });
    return handleResponse<PenaltyTopupResult>(res);
  },

  async advanceGroupRound(id: string): Promise<{ success: boolean; group: TontineGroup }> {
    const res = await fetch(`${BASE_URL}/tontines/${id}/advance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    });
    return handleResponse(res);
  },

  async reorderTurns(groupId: string, turns: { memberId: string; order: number }[]): Promise<{ success: boolean; group: TontineGroup }> {
    const res = await fetch(`${BASE_URL}/tontines/${groupId}/reorder-turns`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ turns }),
    });
    return handleResponse(res);
  },

  async verifyMemberPresence(groupId: string, memberId: string, presenceValidated = true): Promise<{ success: boolean; group: TontineGroup }> {
    const res = await fetch(`${BASE_URL}/tontines/${groupId}/members/verify`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ memberId, presenceValidated }),
    });
    return handleResponse(res);
  },

  // Members
  async getMembers(): Promise<Member[]> {
    const res = await fetch(`${BASE_URL}/members`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async getMember(id: string): Promise<Member> {
    const res = await fetch(`${BASE_URL}/members/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async createMember(memberData: Omit<Member, 'id'>): Promise<Member> {
    const res = await fetch(`${BASE_URL}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(memberData),
    });
    return handleResponse(res);
  },

  async updateMember(id: string, updates: Partial<Member>): Promise<Member> {
    const res = await fetch(`${BASE_URL}/members/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(updates),
    });
    return handleResponse(res);
  },

  async deleteMember(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${BASE_URL}/members/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
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

    const res = await fetch(`${BASE_URL}/payments${query}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async recordPayment(paymentData: Omit<PaymentTransaction, 'id' | 'transactionRef'>): Promise<PaymentTransaction> {
    const res = await fetch(`${BASE_URL}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(paymentData),
    });
    return handleResponse(res);
  },

  async verifyPayment(id: string): Promise<PaymentTransaction> {
    const res = await fetch(`${BASE_URL}/payments/${id}/verify`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    });
    return handleResponse(res);
  },

  async getReceipt(id: string): Promise<any> {
    const res = await fetch(`${BASE_URL}/payments/${id}/receipt`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // Notifications
  async getNotifications(): Promise<AppNotification[]> {
    const res = await fetch(`${BASE_URL}/notifications`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async markNotificationRead(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${BASE_URL}/notifications/${id}/read`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async markAllNotificationsRead(): Promise<{ success: boolean }> {
    const res = await fetch(`${BASE_URL}/notifications/read-all`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // Stats
  async getStatsOverview() {
    const res = await fetch(`${BASE_URL}/stats/overview`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // SasaPay Gateway (Mobile Money & Carte)
  async createSasPaySession(payload: {
    amount: number;
    currency?: string;
    orderId?: string;
    customerEmail?: string;
    customerPhone?: string;
    customerName?: string;
    metadata?: Record<string, any>;
  }): Promise<{ success: boolean; checkout_url: string; sessionId: string; orderId: string }> {
    const res = await fetch(`${BASE_URL}/saspay/create-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async getSasPayStatus(orderId: string, sessionId?: string): Promise<{
    success: boolean;
    status: 'completed' | 'pending' | 'failed';
    orderId: string;
    receiptNumber?: string;
    transaction?: PaymentTransaction;
    message?: string;
  }> {
    const params = new URLSearchParams();
    if (orderId) params.append('orderId', orderId);
    if (sessionId) params.append('sessionId', sessionId);
    const res = await fetch(`${BASE_URL}/saspay/status?${params.toString()}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async createSasPaySubscriptionSession(payload: {
    planId: string;
    planName?: string;
    price?: number;
    userId?: string;
    userName?: string;
    userEmail?: string;
    userPhone?: string;
    operator?: string;
    returnUrl?: string;
  }): Promise<{
    success: boolean;
    checkout_url: string;
    sessionId: string;
    orderId: string;
    upstreamId?: string;
  }> {
    const res = await fetch(`${BASE_URL}/saspay/create-subscription-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async testSasPayConnection(): Promise<{
    success: boolean;
    connected: boolean;
    gateway: string;
    baseUrl: string;
    documentation: string;
    apiKeyMasked: string;
    latencyMs: number;
    merchantId?: string;
    message?: string;
    error?: string;
  }> {
    const res = await fetch(`${BASE_URL}/saspay/test-connection`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async getSubscriptionInvoices(userId?: string): Promise<any[]> {
    const params = userId ? `?userId=${encodeURIComponent(userId)}` : '';
    const res = await fetch(`${BASE_URL}/subscriptions/invoices${params}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },
};
