export type UserRole = 'admin' | 'moderator' | 'member';
export type KycStatus = 'unverified' | 'pending' | 'verified';
export type TontineType = 'rotative' | 'enchere' | 'sociale';

export interface User {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone: string;
  whatsappNumber?: string;
  avatarUrl?: string;
  role: UserRole;
  trustScore: number; // 0 to 100
  kycStatus: KycStatus;
  city?: string;
  country?: string;
}

export type Frequency = 'daily' | 'weekly' | 'monthly';
export type GroupStatus = 'created' | 'active' | 'pending' | 'completed' | 'paused';
export type PaymentStatus = 'paid' | 'completed' | 'pending' | 'late' | 'failed';
export type PaymentMethod =
  | 'Orange Money'
  | 'MTN MoMo'
  | 'Wave'
  | 'Moov Money'
  | 'Espèces'
  | 'Virement'
  | 'Carte/Crypto';

export interface BeneficiaryTurn {
  order: number;
  memberId: string;
  memberName: string;
  memberPhone: string;
  memberAvatar?: string;
  scheduledDate: string; // ISO or YYYY-MM-DD
  potAmount: number;
  status: 'completed' | 'current' | 'upcoming';
  payoutReference?: string;
  paidOutAt?: string;
}

export interface Member {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  phone: string;
  email: string;
  avatarUrl?: string;
  city: string;
  trustScore: number; // 0 to 100
  kycStatus: KycStatus;
  joinedDate: string;
  groupsCount: number;
  totalContributed: number;
  totalReceived: number;
  status: 'active' | 'inactive' | 'flagged';
  presenceValidated?: boolean;
  notes?: string;
}

export interface TontineGroupMember {
  memberId: string;
  turnOrder: number;
  hasPaidToday: boolean;
  totalContributedInGroup: number;
  presenceValidated?: boolean;
}

export interface TontineGroup {
  id: string;
  name: string;
  description: string;
  type: TontineType; // Rotative fixe, Enchères, Sociale
  moderatorId: string;
  contributionAmount: number; // e.g. 25000 FCFA
  moderatorCommission: number; // e.g. 500 FCFA
  commissionType: 'fixed' | 'percentage';
  frequency: Frequency; // 'daily' | 'weekly' | 'monthly'
  currency: string; // 'FCFA' or 'XAF' or 'XOF'
  totalMembersCount: number;
  currentCycle: number;
  currentDay: number; // e.g. Tour 3 out of 10
  status: GroupStatus;
  startDate: string;
  endDate: string;
  drawDay?: string; // e.g. 'Vendredi' ou '15 du mois'
  members: TontineGroupMember[];
  beneficiarySchedule: BeneficiaryTurn[];
  category?: string;
  potAmount?: number; // Total pot for one round
  nextTurnDate?: string;
}

export interface PaymentTransaction {
  id: string;
  groupId: string;
  groupName: string;
  memberId: string;
  memberName: string;
  memberPhone: string;
  amount: number; // Total amount paid (including commission)
  baseAmount: number;
  commission: number;
  date: string; // ISO datetime
  status: PaymentStatus;
  method: PaymentMethod | string;
  transactionRef: string;
  providerTxId?: string;
  cycleNumber?: number;
  roundNumber?: number;
  receiptNumber?: string;
  verifiedByModerator: boolean;
  webhookReceivedAt?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'payment' | 'round' | 'reminder' | 'system' | 'payout';
  link?: string;
}

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

export interface WebhookSimulationPayload {
  transactionId?: string;
  groupId?: string;
  memberId?: string;
  amount: number;
  operator: 'Orange Money' | 'MTN MoMo' | 'Wave';
  phoneNumber: string;
  status: 'completed' | 'failed';
  delayMs?: number;
}

export interface PayoutTransaction {
  id: string;
  groupId: string;
  groupName: string;
  roundId: number;
  beneficiaryId: string;
  beneficiaryName: string;
  beneficiaryPhone: string;
  gross_amount: number;
  'commission_fee_5%': number;
  commission_fee_5: number;
  net_payout: number;
  provider: string;
  payoutReference: string;
  providerTxId: string;
  status: 'completed' | 'pending' | 'failed';
  date: string;
  receiptNumber?: string;
  simulatedPayoutCall?: {
    provider: string;
    recipientPhone: string;
    amountSent: number;
    currency: string;
    status: string;
    gatewayRef: string;
    timestamp: string;
  };
}

export interface TontineFinancialSummary {
  groupId: string;
  groupName: string;
  roundId: number;
  contributionAmount: number;
  totalMembersCount: number;
  paidMembersCount: number;
  missingMembersCount: number;
  isFullyFunded: boolean;
  totalPotAmount: number; // Gross amount
  commissionRate: number; // 0.05
  commissionAmount: number; // 5%
  netBeneficiaryAmount: number; // Net amount received by beneficiary
  currency: string;
  beneficiary?: {
    memberId: string;
    memberName: string;
    memberPhone: string;
    order: number;
    scheduledDate: string;
    payoutReference?: string;
  };
  paidMembers: { memberId: string; memberName: string; phone: string }[];
  missingMembers: { memberId: string; memberName: string; phone: string }[];
}
