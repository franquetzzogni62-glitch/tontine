export type UserRole = 'admin' | 'moderator' | 'member';
export type KycStatus = 'unverified' | 'pending' | 'verified';
export type TontineType = 'rotative' | 'enchere' | 'sociale';

export type SubscriptionPlanId = 'starter' | 'pro' | 'enterprise';

export interface ModeratorSubscription {
  planId: SubscriptionPlanId;
  planName: string;
  pricePerMonth: number;
  status: 'active' | 'trial' | 'expired';
  startedAt: string; // ISO date
  expiresAt: string; // ISO date
  paymentMethod?: string;
  autoRenew: boolean;
  maxGroups: number;
}

export interface User {
  id: string;
  name: string;
  organizationName?: string; // Nom de l'organisation / réseau de tontines
  firstName?: string;
  lastName?: string;
  email: string;
  phone: string;
  passwordHash?: string;
  salt?: string;
  whatsappNumber?: string;
  avatarUrl?: string;
  role: UserRole;
  trustScore: number; // 0 to 100
  kycStatus: KycStatus;
  city?: string;
  country?: string;
  subscription?: ModeratorSubscription;
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
  accessCode?: string; // Code à 6 chiffres attribué au membre pour cette tontine
}

export interface Member {
  id: string;
  name: string;
  moderatorId?: string; // ID du modérateur propriétaire
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
  guaranteeBalance?: number; // Caution / Dépôt de garantie
  status: 'active' | 'inactive' | 'flagged' | 'GUARANTEE_DEPLETED' | 'guarantee_depleted';
  presenceValidated?: boolean;
  notes?: string;
}

export interface TontineGroupMember {
  memberId: string;
  turnOrder: number;
  accessCode?: string; // Code unique à 6 chiffres pour accéder à ce groupe
  hasPaidToday: boolean;
  paidToursAdvance?: number; // Nombre de tours payés d'avance
  paidUntilRound?: number; // Jusqu'à quel tour le membre a déjà réglé ses cotisations
  totalContributedInGroup: number;
  presenceValidated?: boolean;
  guaranteeBalance?: number;
  status?: 'ACTIVE' | 'GUARANTEE_DEPLETED' | 'LATE' | 'active' | 'late' | 'guarantee_depleted';
}

export interface TontineGroup {
  id: string;
  name: string;
  description: string;
  type: TontineType; // Rotative fixe, Enchères, Sociale
  moderatorId: string;
  contributionAmount: number; // e.g. 25000 FCFA
  moderatorCommission: number; // e.g. 500 FCFA
  customPenaltyAmount: number; // Montant de la pénalité de retard défini par l'admin (ex: 1000 FCFA)
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
  turnsCovered?: number; // Nombre de réunions/tours payés (ex: 1, 3, etc.)
  coveredRounds?: string; // Ex: "Tours #2 à #4"
  receiptNumber?: string;
  verifiedByModerator: boolean;
  webhookReceivedAt?: string;
  notes?: string;
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

export interface PenaltyTopupPayload {
  groupId: string;
  memberId: string;
  operator?: 'Orange Money' | 'MTN MoMo' | 'Wave' | string;
  phoneNumber?: string;
  notes?: string;
}

export interface PenaltyTopupResult {
  success: boolean;
  message: string;
  groupId: string;
  groupName: string;
  roundNumber: number;
  memberId: string;
  memberName: string;
  missingContribution: number;
  customPenaltyAmount: number;
  totalPaid: number;
  saasPenaltyShare: number; // 50%
  beneficiaryPenaltyShare: number; // 50%
  beneficiaryId: string;
  beneficiaryName: string;
  beneficiaryPhone: string;
  memberNewStatus: 'ACTIVE';
  guaranteeBalance: number;
  transactionRef: string;
  receiptNumber: string;
  simulatedPayoutCall: {
    provider: string;
    recipientPhone: string;
    amountSent: number;
    description: string;
    status: string;
    gatewayRef: string;
    timestamp: string;
  };
}

