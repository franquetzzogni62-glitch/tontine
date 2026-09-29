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
  WebhookSimulationPayload,
} from '../types';

const BASE_URL = '/api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || `Erreur serveur HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Auth & Users
  async getUsers(): Promise<User[]> {
    const res = await fetch(`${BASE_URL}/users`);
    return handleResponse(res);
  },

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

  async updateKycStatus(userId: string, kycStatus: KycStatus): Promise<{ success: boolean; user: User }> {
    const res = await fetch(`${BASE_URL}/users/${userId}/kyc`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kycStatus }),
    });
    return handleResponse(res);
  },

  async updateTrustScore(userId: string, trustScore: number): Promise<{ success: boolean; user: User }> {
    const res = await fetch(`${BASE_URL}/users/${userId}/trust-score`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
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

    const res = await fetch(`${BASE_URL}/tontines${query}`);
    return handleResponse(res);
  },

  async getGroup(id: string): Promise<TontineGroup> {
    const res = await fetch(`${BASE_URL}/tontines/${id}`);
    return handleResponse(res);
  },

  async createGroup(groupData: Omit<TontineGroup, 'id'>): Promise<TontineGroup> {
    const res = await fetch(`${BASE_URL}/tontines`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(groupData),
    });
    return handleResponse(res);
  },

  async updateGroup(id: string, updates: Partial<TontineGroup>): Promise<TontineGroup> {
    const res = await fetch(`${BASE_URL}/tontines/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return handleResponse(res);
  },

  async deleteGroup(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${BASE_URL}/tontines/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(res);
  },

  async getPotStatus(groupId: string) {
    const res = await fetch(`${BASE_URL}/tontines/${groupId}/pot-status`);
    return handleResponse(res);
  },

  /**
   * Récupère le résumé financier du tour actuel avec la commission SaaS de 5%
   * Route requise: GET /api/tontine/summary/:groupId
   */
  async getTontineSummary(groupId: string): Promise<TontineFinancialSummary> {
    const res = await fetch(`${BASE_URL}/tontine/summary/${groupId}`);
    return handleResponse<TontineFinancialSummary>(res);
  },

  /**
   * Exécute le versement (Payout) avec déduction de la commission de 5%
   * et simulation Mobile Money
   * Route requise: POST /api/tontine/payout
   */
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
    simulatedPayoutCall: any;
    payoutRef: string;
  }> {
    const res = await fetch(`${BASE_URL}/tontine/payout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupId, ...(options || {}) }),
    });
    return handleResponse(res);
  },

  /**
   * Régularise le retard d'un membre avec top-up caution et ventilation 50/50 de la pénalité
   * Route requise: POST /api/tontine/pay-penalty-and-topup
   */
  async payPenaltyAndTopup(payload: PenaltyTopupPayload): Promise<PenaltyTopupResult> {
    const res = await fetch(`${BASE_URL}/tontine/pay-penalty-and-topup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse<PenaltyTopupResult>(res);
  },

  async advanceGroupRound(id: string): Promise<{ success: boolean; group: TontineGroup }> {
    const res = await fetch(`${BASE_URL}/tontines/${id}/advance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse(res);
  },

  async reorderTurns(groupId: string, turns: { memberId: string; order: number }[]): Promise<{ success: boolean; group: TontineGroup }> {
    const res = await fetch(`${BASE_URL}/tontines/${groupId}/reorder-turns`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ turns }),
    });
    return handleResponse(res);
  },

  async verifyMemberPresence(groupId: string, memberId: string, presenceValidated = true): Promise<{ success: boolean; group: TontineGroup }> {
    const res = await fetch(`${BASE_URL}/tontines/${groupId}/members/verify`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId, presenceValidated }),
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

  async getReceipt(id: string) {
    const res = await fetch(`${BASE_URL}/payments/${id}/receipt`);
    return handleResponse(res);
  },

  // Webhooks
  async simulateWebhook(payload: WebhookSimulationPayload): Promise<{
    simulation: boolean;
    success: boolean;
    operator: string;
    transaction: PaymentTransaction;
    receiptNumber: string;
    groupReport: any;
    message: string;
  }> {
    const res = await fetch(`${BASE_URL}/payments/webhook-test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
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
