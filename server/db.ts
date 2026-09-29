import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  CURRENT_MODERATOR,
  CURRENT_MEMBER,
  MOCK_MEMBERS,
  MOCK_GROUPS,
  generateMockTransactions,
  MOCK_NOTIFICATIONS,
} from '../src/mocks/data.js';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  role: 'moderator' | 'member';
  city?: string;
  country?: string;
}

export interface BeneficiaryTurn {
  order: number;
  memberId: string;
  memberName: string;
  memberPhone: string;
  memberAvatar?: string;
  scheduledDate: string;
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
  trustScore: number;
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
  contributionAmount: number;
  moderatorCommission: number;
  commissionType: 'fixed' | 'percentage';
  frequency: 'daily' | 'weekly' | 'monthly';
  currency: string;
  totalMembersCount: number;
  currentCycle: number;
  currentDay: number;
  status: 'active' | 'pending' | 'completed' | 'paused';
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
  amount: number;
  baseAmount: number;
  commission: number;
  date: string;
  status: 'paid' | 'pending' | 'late';
  method: string;
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
}

interface DatabaseSchema {
  users: User[];
  groups: TontineGroup[];
  members: Member[];
  payments: PaymentTransaction[];
  notifications: AppNotification[];
}

const DB_FILE_PATH = path.resolve(process.cwd(), 'server', 'data.json');

class DatabaseService {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE_PATH)) {
        const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.warn('Failed reading database file, re-initializing seed data:', err);
    }

    // Initialize with rich realistic seed data
    const initialData: DatabaseSchema = {
      users: [CURRENT_MODERATOR, CURRENT_MEMBER],
      groups: MOCK_GROUPS,
      members: MOCK_MEMBERS,
      payments: generateMockTransactions(),
      notifications: MOCK_NOTIFICATIONS,
    };

    this.persist(initialData);
    return initialData;
  }

  private persist(dataToSave = this.data) {
    try {
      const dir = path.dirname(DB_FILE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(dataToSave, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error persisting database:', err);
    }
  }

  // --- Users ---
  getUsers(): User[] {
    return this.data.users;
  }

  getUserById(id: string): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  createUser(user: User): User {
    this.data.users.push(user);
    this.persist();
    return user;
  }

  // --- Groups ---
  getGroups(): TontineGroup[] {
    return this.data.groups;
  }

  getGroupById(id: string): TontineGroup | undefined {
    return this.data.groups.find((g) => g.id === id);
  }

  createGroup(groupData: Omit<TontineGroup, 'id'>): TontineGroup {
    const newId = `grp_${Date.now()}`;
    const newGroup: TontineGroup = {
      ...groupData,
      id: newId,
    };
    this.data.groups.unshift(newGroup);
    this.persist();
    return newGroup;
  }

  updateGroup(id: string, updates: Partial<TontineGroup>): TontineGroup | null {
    const index = this.data.groups.findIndex((g) => g.id === id);
    if (index === -1) return null;
    this.data.groups[index] = { ...this.data.groups[index], ...updates };
    this.persist();
    return this.data.groups[index];
  }

  deleteGroup(id: string): boolean {
    const initialLength = this.data.groups.length;
    this.data.groups = this.data.groups.filter((g) => g.id !== id);
    if (this.data.groups.length !== initialLength) {
      this.persist();
      return true;
    }
    return false;
  }

  advanceGroupRound(groupId: string): TontineGroup | null {
    const group = this.getGroupById(groupId);
    if (!group) return null;

    const nextDay = group.currentDay + 1;
    const isFinished = nextDay > group.totalMembersCount;

    const updatedSchedule = group.beneficiarySchedule.map((b) => {
      if (b.order < nextDay) return { ...b, status: 'completed' as const };
      if (b.order === nextDay) return { ...b, status: 'current' as const };
      return { ...b, status: 'upcoming' as const };
    });

    const updatedGroup: TontineGroup = {
      ...group,
      currentDay: isFinished ? group.totalMembersCount : nextDay,
      status: isFinished ? 'completed' : group.status,
      beneficiarySchedule: updatedSchedule,
      members: group.members.map((m) => ({ ...m, hasPaidToday: false })),
    };

    // Add notification
    const recipient = updatedSchedule.find((b) => b.order === nextDay);
    if (recipient && !isFinished) {
      this.createNotification({
        title: `Nouveau tour ouvert : ${group.name}`,
        message: `C'est maintenant au tour de ${recipient.memberName} de recevoir la cagnotte de ${recipient.potAmount.toLocaleString()} FCFA.`,
        type: 'round',
      });
    }

    return this.updateGroup(groupId, updatedGroup);
  }

  // --- Members ---
  getMembers(): Member[] {
    return this.data.members;
  }

  getMemberById(id: string): Member | undefined {
    return this.data.members.find((m) => m.id === id);
  }

  createMember(memberData: Omit<Member, 'id'>): Member {
    const newMember: Member = {
      ...memberData,
      id: `mem_${Date.now()}`,
    };
    this.data.members.unshift(newMember);
    this.persist();
    return newMember;
  }

  updateMember(id: string, updates: Partial<Member>): Member | null {
    const index = this.data.members.findIndex((m) => m.id === id);
    if (index === -1) return null;
    this.data.members[index] = { ...this.data.members[index], ...updates };
    this.persist();
    return this.data.members[index];
  }

  deleteMember(id: string): boolean {
    const initialLen = this.data.members.length;
    this.data.members = this.data.members.filter((m) => m.id !== id);
    if (this.data.members.length !== initialLen) {
      this.persist();
      return true;
    }
    return false;
  }

  // --- Payments ---
  getPayments(filters?: { groupId?: string; memberId?: string; status?: string }): PaymentTransaction[] {
    let result = [...this.data.payments];
    if (filters?.groupId) {
      result = result.filter((p) => p.groupId === filters.groupId);
    }
    if (filters?.memberId) {
      result = result.filter((p) => p.memberId === filters.memberId);
    }
    if (filters?.status && filters.status !== 'all') {
      result = result.filter((p) => p.status === filters.status);
    }
    return result;
  }

  createPayment(paymentData: Omit<PaymentTransaction, 'id' | 'transactionRef'>): PaymentTransaction {
    const id = `tx_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const transactionRef = `TRX-${Math.floor(100000 + Math.random() * 900000)}`;
    const newPayment: PaymentTransaction = {
      ...paymentData,
      id,
      transactionRef,
    };

    this.data.payments.unshift(newPayment);

    // Update group member status
    const group = this.getGroupById(newPayment.groupId);
    if (group) {
      const updatedMembers = group.members.map((m) => {
        if (m.memberId === newPayment.memberId) {
          return {
            ...m,
            hasPaidToday: true,
            totalContributedInGroup: m.totalContributedInGroup + newPayment.amount,
          };
        }
        return m;
      });
      this.updateGroup(group.id, { members: updatedMembers });
    }

    // Update member total
    const member = this.getMemberById(newPayment.memberId);
    if (member) {
      this.updateMember(member.id, {
        totalContributed: member.totalContributed + newPayment.amount,
      });
    }

    // Add notification
    this.createNotification({
      title: 'Cotisation enregistrée',
      message: `${newPayment.memberName} a versé ${newPayment.amount.toLocaleString()} FCFA pour ${newPayment.groupName}.`,
      type: 'payment',
    });

    this.persist();
    return newPayment;
  }

  verifyPayment(id: string): PaymentTransaction | null {
    const tx = this.data.payments.find((p) => p.id === id);
    if (!tx) return null;
    tx.status = 'paid';
    tx.verifiedByModerator = true;
    this.persist();
    return tx;
  }

  // --- Notifications ---
  getNotifications(): AppNotification[] {
    return this.data.notifications;
  }

  createNotification(notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>): AppNotification {
    const newNotif: AppNotification = {
      ...notif,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    this.data.notifications.unshift(newNotif);
    this.persist();
    return newNotif;
  }

  markNotificationRead(id: string): boolean {
    const notif = this.data.notifications.find((n) => n.id === id);
    if (notif) {
      notif.read = true;
      this.persist();
      return true;
    }
    return false;
  }

  markAllNotificationsRead(): void {
    this.data.notifications.forEach((n) => {
      n.read = true;
    });
    this.persist();
  }

  // --- Stats ---
  getStatsOverview() {
    const activeGroups = this.data.groups.filter((g) => g.status === 'active');
    const totalMembers = this.data.members.length;

    const totalCollected = this.data.payments.reduce(
      (acc, p) => (p.status === 'paid' ? acc + p.amount : acc),
      0
    );

    const totalCommissions = this.data.payments.reduce(
      (acc, p) => (p.status === 'paid' ? acc + p.commission : acc),
      0
    );

    const paidCount = this.data.payments.filter((p) => p.status === 'paid').length;
    const recoveryRate =
      this.data.payments.length > 0
        ? Math.round((paidCount / this.data.payments.length) * 100)
        : 100;

    return {
      activeGroupsCount: activeGroups.length,
      totalGroupsCount: this.data.groups.length,
      totalMembersCount: totalMembers,
      totalCollected,
      totalCommissions,
      recoveryRate,
      paymentsCount: this.data.payments.length,
    };
  }
}

export const db = new DatabaseService();
