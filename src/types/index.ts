export type UserRole = 'moderator' | 'member';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  role: UserRole;
  city?: string;
  country?: string;
}

export type Frequency = 'daily' | 'weekly' | 'monthly';
export type GroupStatus = 'active' | 'pending' | 'completed' | 'paused';
export type PaymentStatus = 'paid' | 'pending' | 'late';
export type PaymentMethod = 'Orange Money' | 'MTN MoMo' | 'Wave' | 'Moov Money' | 'Espèces' | 'Virement';

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
}

export interface Member {
  id: string;
  name: string;
  phone: string;
  email: string;
  avatarUrl?: string;
  city: string;
  trustScore: number; // 0 to 100
  joinedDate: string;
  groupsCount: number;
  totalContributed: number;
  totalReceived: number;
  status: 'active' | 'inactive' | 'flagged';
  notes?: string;
}

export interface TontineGroup {
  id: string;
  name: string;
  description: string;
  moderatorId: string;
  contributionAmount: number; // e.g. 1100 FCFA
  moderatorCommission: number; // e.g. 50 FCFA
  commissionType: 'fixed' | 'percentage';
  frequency: Frequency;
  currency: string; // 'FCFA'
  totalMembersCount: number;
  currentCycle: number;
  currentDay: number; // e.g. Day 5 out of 10
  status: GroupStatus;
  startDate: string;
  endDate: string;
  members: {
    memberId: string;
    turnOrder: number;
    hasPaidToday: boolean;
    totalContributedInGroup: number;
  }[];
  beneficiarySchedule: BeneficiaryTurn[];
  category?: string;
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
  method: PaymentMethod;
  transactionRef: string;
  verifiedByModerator: boolean;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'payment' | 'round' | 'reminder' | 'system';
  link?: string;
}

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'error' | 'info' | 'warning';
}
