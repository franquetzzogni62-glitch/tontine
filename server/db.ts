import fs from 'fs';
import path from 'path';
import {
  User,
  Member,
  TontineGroup,
  PaymentTransaction,
  PayoutTransaction,
  TontineFinancialSummary,
  AppNotification,
  BeneficiaryTurn,
  KycStatus,
  UserRole,
} from '../src/types/index.js';
import {
  CURRENT_MODERATOR,
  CURRENT_MEMBER,
  MOCK_MEMBERS,
  MOCK_GROUPS,
  generateMockTransactions,
  MOCK_NOTIFICATIONS,
} from '../src/mocks/data.js';

export interface DatabaseSchema {
  users: User[];
  groups: TontineGroup[];
  members: Member[];
  payments: PaymentTransaction[];
  payouts: PayoutTransaction[];
  notifications: AppNotification[];
}

const DB_FILE_PATH = path.resolve(process.cwd(), 'server', 'data.json');

export interface PotStatusReport {
  groupId: string;
  groupName: string;
  roundNumber: number;
  totalMembers: number;
  paidMembersCount: number;
  pendingMembersCount: number;
  contributionPerMember: number;
  totalPotExpected: number;
  totalPotCollected: number;
  remainingPotNeeded: number;
  isFullyFunded: boolean;
  beneficiary: BeneficiaryTurn | undefined;
  missingMembers: {
    memberId: string;
    memberName: string;
    phone: string;
  }[];
  paidMembers: {
    memberId: string;
    memberName: string;
    phone: string;
  }[];
}

class DatabaseService {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE_PATH)) {
        const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
        const parsed = JSON.parse(raw);
        // Ensure minimal sanity
        if (parsed.users && parsed.groups && parsed.members) {
          if (!parsed.payouts) parsed.payouts = [];
          return parsed;
        }
      }
    } catch (err) {
      console.warn('Failed reading existing database file, re-seeding:', err);
    }

    // Seed data
    const initialData: DatabaseSchema = {
      users: [CURRENT_MODERATOR, CURRENT_MEMBER],
      groups: MOCK_GROUPS,
      members: MOCK_MEMBERS,
      payments: generateMockTransactions(),
      payouts: [],
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

  updateUser(id: string, updates: Partial<User>): User | null {
    const idx = this.data.users.findIndex((u) => u.id === id);
    if (idx === -1) return null;
    this.data.users[idx] = { ...this.data.users[idx], ...updates };
    this.persist();
    return this.data.users[idx];
  }

  updateKycStatus(userId: string, kycStatus: KycStatus): User | null {
    const user = this.updateUser(userId, { kycStatus });
    // Also sync corresponding member record if exists
    const memberIdx = this.data.members.findIndex((m) => m.id === userId || m.phone === user?.phone);
    if (memberIdx !== -1) {
      this.data.members[memberIdx].kycStatus = kycStatus;
      this.persist();
    }
    return user;
  }

  updateTrustScore(userId: string, trustScore: number): User | null {
    const user = this.updateUser(userId, { trustScore: Math.max(0, Math.min(100, trustScore)) });
    const memberIdx = this.data.members.findIndex((m) => m.id === userId || m.phone === user?.phone);
    if (memberIdx !== -1) {
      this.data.members[memberIdx].trustScore = Math.max(0, Math.min(100, trustScore));
      this.persist();
    }
    return user;
  }

  // --- Date Calculation Helper ---
  calculateNextTurnDate(startDateStr: string, currentDay: number, frequency: string, drawDay?: string): string {
    const d = new Date(startDateStr);
    if (frequency === 'daily') {
      d.setDate(d.getDate() + currentDay);
    } else if (frequency === 'weekly') {
      d.setDate(d.getDate() + currentDay * 7);
    } else if (frequency === 'monthly') {
      d.setMonth(d.getMonth() + currentDay);
    } else {
      d.setDate(d.getDate() + currentDay);
    }
    return d.toISOString().split('T')[0];
  }

  // --- Groups / Tontines ---
  getGroups(): TontineGroup[] {
    return this.data.groups.map((g) => {
      const nextTurnDate = this.calculateNextTurnDate(g.startDate, g.currentDay, g.frequency, g.drawDay);
      const potAmount = (g.contributionAmount - g.moderatorCommission) * g.totalMembersCount;
      return {
        ...g,
        nextTurnDate,
        potAmount: g.potAmount || potAmount,
      };
    });
  }

  getGroupById(id: string): TontineGroup | undefined {
    const g = this.data.groups.find((group) => group.id === id);
    if (!g) return undefined;
    const nextTurnDate = this.calculateNextTurnDate(g.startDate, g.currentDay, g.frequency, g.drawDay);
    const potAmount = (g.contributionAmount - g.moderatorCommission) * g.totalMembersCount;
    return {
      ...g,
      nextTurnDate,
      potAmount: g.potAmount || potAmount,
    };
  }

  createGroup(groupData: Omit<TontineGroup, 'id'>): TontineGroup {
    const newId = `grp_${Date.now()}`;
    const potAmount = (groupData.contributionAmount - groupData.moderatorCommission) * groupData.totalMembersCount;
    const nextTurnDate = this.calculateNextTurnDate(groupData.startDate, groupData.currentDay || 1, groupData.frequency, groupData.drawDay);

    const newGroup: TontineGroup = {
      ...groupData,
      id: newId,
      potAmount,
      nextTurnDate,
      type: groupData.type || 'rotative',
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

  // --- Logic: Check Pot Funding Status for Round ---
  checkPotFundedStatus(groupId: string): PotStatusReport | null {
    const group = this.getGroupById(groupId);
    if (!group) return null;

    const roundNumber = group.currentDay;
    const beneficiary = group.beneficiarySchedule.find((b) => b.order === roundNumber);
    const totalMembers = group.members.length;

    const paidMembers: { memberId: string; memberName: string; phone: string }[] = [];
    const missingMembers: { memberId: string; memberName: string; phone: string }[] = [];

    group.members.forEach((m) => {
      const memberInfo = this.getMemberById(m.memberId);
      const name = memberInfo?.name || `Membre #${m.turnOrder}`;
      const phone = memberInfo?.phone || '';
      if (m.hasPaidToday) {
        paidMembers.push({ memberId: m.memberId, memberName: name, phone });
      } else {
        missingMembers.push({ memberId: m.memberId, memberName: name, phone });
      }
    });

    const netContributionPerMember = group.contributionAmount - group.moderatorCommission;
    const totalPotExpected = netContributionPerMember * totalMembers;
    const totalPotCollected = netContributionPerMember * paidMembers.length;
    const remainingPotNeeded = totalPotExpected - totalPotCollected;
    const isFullyFunded = missingMembers.length === 0;

    return {
      groupId: group.id,
      groupName: group.name,
      roundNumber,
      totalMembers,
      paidMembersCount: paidMembers.length,
      pendingMembersCount: missingMembers.length,
      contributionPerMember: group.contributionAmount,
      totalPotExpected,
      totalPotCollected,
      remainingPotNeeded,
      isFullyFunded,
      beneficiary,
      missingMembers,
      paidMembers,
    };
  }

  // --- Logic: Financial Summary with 5% SaaS Commission ---
  getTontineSummary(groupId: string): TontineFinancialSummary | null {
    const group = this.getGroupById(groupId);
    if (!group) return null;

    const roundId = group.currentDay;
    const totalMembersCount = group.members.length;
    const paidMembers: { memberId: string; memberName: string; phone: string }[] = [];
    const missingMembers: { memberId: string; memberName: string; phone: string }[] = [];

    group.members.forEach((m) => {
      const memberInfo = this.getMemberById(m.memberId);
      const name = memberInfo?.name || `Membre #${m.turnOrder}`;
      const phone = memberInfo?.phone || '';
      if (m.hasPaidToday) {
        paidMembers.push({ memberId: m.memberId, memberName: name, phone });
      } else {
        missingMembers.push({ memberId: m.memberId, memberName: name, phone });
      }
    });

    const paidMembersCount = paidMembers.length;
    const missingMembersCount = missingMembers.length;
    const isFullyFunded = missingMembersCount === 0;

    // 5% Commission calculation rule:
    // totalPotAmount = Nombre de membres ayant payé * Montant de la cotisation
    const totalPotAmount = paidMembersCount * group.contributionAmount;
    const commissionRate = 0.05;
    const commissionAmount = Math.round(totalPotAmount * commissionRate);
    const netBeneficiaryAmount = totalPotAmount - commissionAmount;

    const beneficiaryTurn = group.beneficiarySchedule.find((b) => b.order === roundId);
    const beneficiary = beneficiaryTurn
      ? {
          memberId: beneficiaryTurn.memberId,
          memberName: beneficiaryTurn.memberName,
          memberPhone: beneficiaryTurn.memberPhone,
          order: beneficiaryTurn.order,
          scheduledDate: beneficiaryTurn.scheduledDate,
          payoutReference: beneficiaryTurn.payoutReference,
        }
      : undefined;

    return {
      groupId: group.id,
      groupName: group.name,
      roundId,
      contributionAmount: group.contributionAmount,
      totalMembersCount,
      paidMembersCount,
      missingMembersCount,
      isFullyFunded,
      totalPotAmount,
      commissionRate,
      commissionAmount,
      netBeneficiaryAmount,
      currency: group.currency || 'FCFA',
      beneficiary,
      paidMembers,
      missingMembers,
    };
  }

  // --- Logic: Process Tontine Payout (5% Commission & Mobile Money Payout API simulation) ---
  processTontinePayout(
    groupId: string,
    roundId?: number,
    options: { force?: boolean; operator?: string; notes?: string } = {}
  ): {
    success: boolean;
    message: string;
    payout: PayoutTransaction;
    summary: TontineFinancialSummary;
    updatedGroup: TontineGroup;
    simulatedPayoutCall: any;
    payoutRef: string;
  } {
    const group = this.getGroupById(groupId);
    if (!group) {
      throw new Error('Groupe de tontine non trouvé.');
    }

    const targetRound = roundId ?? group.currentDay;
    const summary = this.getTontineSummary(groupId);
    if (!summary) {
      throw new Error('Impossible de générer le résumé financier du tour.');
    }

    // 1. Vérifie si tous les membres du tour ont cotisé
    if (!summary.isFullyFunded && !options.force) {
      throw new Error(
        `Déblocage impossible : ${summary.missingMembersCount} membre(s) n'ont pas encore cotisé pour le tour #${targetRound}. Tous les membres doivent avoir payé pour libérer la cagnotte (ou activez le forçage manuel).`
      );
    }

    // 2. Calcul de la commission de 5% et du montant net
    const totalPotAmount = summary.totalPotAmount;
    const commissionAmount = summary.commissionAmount;
    const netBeneficiaryAmount = summary.netBeneficiaryAmount;

    const beneficiaryTurn = group.beneficiarySchedule.find((b) => b.order === targetRound);
    const beneficiaryMember = beneficiaryTurn ? this.getMemberById(beneficiaryTurn.memberId) : undefined;
    const beneficiaryName = beneficiaryTurn?.memberName || beneficiaryMember?.name || 'Bénéficiaire du Tour';
    const beneficiaryPhone = beneficiaryTurn?.memberPhone || beneficiaryMember?.phone || '+237 6 00 00 00 00';

    const operator = options.operator || 'Orange Money';
    const payoutRef = `PAYOUT-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const providerTxRef = `GW-DISB-${operator.substring(0, 3).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;

    // 3. Simule l'appel à l'API Payout du provider Mobile Money (Orange, MTN, Wave)
    const simulatedPayoutCall = {
      provider: operator,
      endpoint: `https://api.${operator.toLowerCase().replace(/\s+/g, '')}.com/v2/disbursements`,
      recipientPhone: beneficiaryPhone,
      amountSent: netBeneficiaryAmount,
      currency: 'XAF',
      status: 'SUCCESS',
      gatewayRef: providerTxRef,
      notes: options.notes || `Versement cagnotte tontine tour #${targetRound}`,
      timestamp: new Date().toISOString(),
    };

    // 4. Enregistre la transaction dans le schéma de la base de données avec le détail exact
    const payoutTx: PayoutTransaction = {
      id: `payout_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      groupId: group.id,
      groupName: group.name,
      roundId: targetRound,
      beneficiaryId: beneficiaryTurn?.memberId || '',
      beneficiaryName,
      beneficiaryPhone,
      gross_amount: totalPotAmount,
      'commission_fee_5%': commissionAmount,
      commission_fee_5: commissionAmount,
      net_payout: netBeneficiaryAmount,
      provider: operator,
      payoutReference: payoutRef,
      providerTxId: providerTxRef,
      status: 'completed',
      date: new Date().toISOString(),
      receiptNumber: `REC-${payoutRef}`,
      simulatedPayoutCall,
    };

    if (!this.data.payouts) {
      this.data.payouts = [];
    }
    this.data.payouts.unshift(payoutTx);

    // Également consigné dans le journal des paiements
    this.data.payments.unshift({
      id: payoutTx.id,
      groupId: group.id,
      groupName: group.name,
      memberId: payoutTx.beneficiaryId,
      memberName: payoutTx.beneficiaryName,
      memberPhone: payoutTx.beneficiaryPhone,
      amount: netBeneficiaryAmount,
      baseAmount: totalPotAmount,
      commission: commissionAmount,
      date: payoutTx.date,
      status: 'paid',
      method: `${operator} Payout`,
      transactionRef: payoutRef,
      providerTxId: providerTxRef,
      roundNumber: targetRound,
      receiptNumber: payoutTx.receiptNumber,
      verifiedByModerator: true,
    });

    // Mise à jour de l'échéancier des bénéficiaires
    const updatedSchedule = group.beneficiarySchedule.map((b) => {
      if (b.order === targetRound) {
        return {
          ...b,
          status: 'completed' as const,
          payoutReference: payoutRef,
          paidOutAt: new Date().toISOString(),
        };
      }
      return b;
    });

    // Mise à jour totalReceived du membre bénéficiaire
    if (beneficiaryMember) {
      this.updateMember(beneficiaryMember.id, {
        totalReceived: (beneficiaryMember.totalReceived || 0) + netBeneficiaryAmount,
      });
    }

    // Passage au tour suivant
    const nextDay = group.currentDay + 1;
    const isFinished = nextDay > group.totalMembersCount;

    const finalSchedule = updatedSchedule.map((b) => {
      if (b.order < nextDay) return { ...b, status: 'completed' as const };
      if (b.order === nextDay) return { ...b, status: 'current' as const };
      return { ...b, status: 'upcoming' as const };
    });

    const updatedGroup: TontineGroup = {
      ...group,
      currentDay: isFinished ? group.totalMembersCount : nextDay,
      status: isFinished ? 'completed' : group.status,
      beneficiarySchedule: finalSchedule,
      members: group.members.map((m) => ({ ...m, hasPaidToday: false })),
    };

    this.updateGroup(groupId, updatedGroup);

    // Notification système
    this.createNotification({
      title: `💰 Payout ${operator} Débloqué : ${group.name}`,
      message: `Pot brut: ${totalPotAmount.toLocaleString()} FCFA | Frais service SaaS 5%: -${commissionAmount.toLocaleString()} FCFA | Net versé à ${beneficiaryName}: ${netBeneficiaryAmount.toLocaleString()} FCFA.`,
      type: 'payout',
    });

    if (!isFinished) {
      const nextBeneficiary = finalSchedule.find((b) => b.order === nextDay);
      if (nextBeneficiary) {
        this.createNotification({
          title: `Tour #${nextDay} ouvert : ${group.name}`,
          message: `C'est maintenant au tour de ${nextBeneficiary.memberName} de recevoir la cagnotte.`,
          type: 'round',
        });
      }
    }

    this.persist();

    return {
      success: true,
      message: `Versement de ${netBeneficiaryAmount.toLocaleString()} FCFA exécuté avec succès vers ${beneficiaryName} (${operator}) après prélèvement de la commission SaaS de 5% (${commissionAmount.toLocaleString()} FCFA).`,
      payout: payoutTx,
      summary,
      updatedGroup,
      simulatedPayoutCall,
      payoutRef,
    };
  }

  // --- Logic: Payout Pot (Backward compatible alias) ---
  payoutPot(
    groupId: string,
    options: { force?: boolean; notes?: string; operator?: string } = {}
  ): {
    success: boolean;
    message: string;
    report: PotStatusReport;
    updatedGroup: TontineGroup;
    payoutRef: string;
    payout?: PayoutTransaction;
  } {
    const res = this.processTontinePayout(groupId, undefined, options);
    const report = this.checkPotFundedStatus(groupId) || ({} as PotStatusReport);
    return {
      success: res.success,
      message: res.message,
      report,
      updatedGroup: res.updatedGroup,
      payoutRef: res.payoutRef,
      payout: res.payout,
    };
  }


  // --- Logic: Reorder Turns ---
  reorderTurns(groupId: string, newTurnOrders: { memberId: string; order: number }[]): TontineGroup {
    const group = this.getGroupById(groupId);
    if (!group) throw new Error('Groupe non trouvé');

    // Update group.members
    const updatedMembers = group.members.map((m) => {
      const found = newTurnOrders.find((to) => to.memberId === m.memberId);
      return found ? { ...m, turnOrder: found.order } : m;
    });

    // Update beneficiarySchedule
    const updatedSchedule = group.beneficiarySchedule.map((b) => {
      const found = newTurnOrders.find((to) => to.memberId === b.memberId);
      if (!found) return b;
      const memberInfo = this.getMemberById(b.memberId);
      return {
        ...b,
        order: found.order,
        memberName: memberInfo?.name || b.memberName,
        memberPhone: memberInfo?.phone || b.memberPhone,
      };
    }).sort((a, b) => a.order - b.order);

    const updated = this.updateGroup(groupId, {
      members: updatedMembers,
      beneficiarySchedule: updatedSchedule,
    });

    this.createNotification({
      title: `Ordre des tours modifié : ${group.name}`,
      message: 'La configuration des positions de rotation a été mise à jour par l\'administrateur.',
      type: 'system',
    });

    return updated!;
  }

  // --- Logic: Verify Member Presence / Approval ---
  verifyMemberPresence(groupId: string, memberId: string, presenceValidated = true): TontineGroup {
    const group = this.getGroupById(groupId);
    if (!group) throw new Error('Groupe non trouvé');

    const updatedMembers = group.members.map((m) =>
      m.memberId === memberId ? { ...m, presenceValidated } : m
    );

    const member = this.getMemberById(memberId);
    if (member) {
      this.updateMember(memberId, { presenceValidated });
    }

    const updated = this.updateGroup(groupId, { members: updatedMembers });
    return updated!;
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
      kycStatus: memberData.kycStatus || 'pending',
      trustScore: memberData.trustScore || 90,
      presenceValidated: memberData.presenceValidated ?? true,
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
    const receiptNumber = `REC-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newPayment: PaymentTransaction = {
      ...paymentData,
      id,
      transactionRef,
      receiptNumber,
      status: paymentData.status || 'paid',
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

    // Update member total and trust score
    const member = this.getMemberById(newPayment.memberId);
    if (member) {
      this.updateMember(member.id, {
        totalContributed: member.totalContributed + newPayment.amount,
        trustScore: Math.min(100, (member.trustScore || 90) + 1),
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
    if (!tx.receiptNumber) {
      tx.receiptNumber = `REC-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    }
    this.persist();
    return tx;
  }

  // --- Webhook Processing (Real & Simulation) ---
  processWebhook(payload: {
    transactionId?: string;
    groupId?: string;
    memberId?: string;
    amount?: number;
    operator?: string;
    phoneNumber?: string;
    status: 'completed' | 'failed';
    providerTxId?: string;
  }): {
    success: boolean;
    transaction: PaymentTransaction;
    receiptNumber: string;
    groupReport: PotStatusReport | null;
  } {
    let tx: PaymentTransaction | undefined;

    // Find existing or create new transaction
    if (payload.transactionId) {
      tx = this.data.payments.find((p) => p.id === payload.transactionId);
    }

    const operatorName = payload.operator || 'Mobile Money';
    const providerRef = payload.providerTxId || `GW-${operatorName.slice(0, 2).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

    if (!tx) {
      // Find matching group and member
      const group = payload.groupId ? this.getGroupById(payload.groupId) : this.data.groups[0];
      const member = payload.memberId ? this.getMemberById(payload.memberId) : this.data.members[0];

      if (!group || !member) {
        throw new Error('Groupe ou membre introuvable pour ce webhook.');
      }

      const id = `tx_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const amount = payload.amount || group.contributionAmount;
      const comm = group.moderatorCommission;

      tx = {
        id,
        groupId: group.id,
        groupName: group.name,
        memberId: member.id,
        memberName: member.name,
        memberPhone: payload.phoneNumber || member.phone,
        amount,
        baseAmount: amount - comm,
        commission: comm,
        date: new Date().toISOString(),
        status: payload.status === 'completed' ? 'paid' : 'failed',
        method: operatorName,
        transactionRef: `TRX-${Math.floor(100000 + Math.random() * 900000)}`,
        providerTxId: providerRef,
        verifiedByModerator: true,
        webhookReceivedAt: new Date().toISOString(),
        receiptNumber: `REC-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
      };
      this.data.payments.unshift(tx);
    } else {
      tx.status = payload.status === 'completed' ? 'paid' : 'failed';
      tx.providerTxId = providerRef;
      tx.verifiedByModerator = true;
      tx.webhookReceivedAt = new Date().toISOString();
      if (!tx.receiptNumber) {
        tx.receiptNumber = `REC-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
      }
    }

    if (payload.status === 'completed') {
      // Update group
      const group = this.getGroupById(tx.groupId);
      if (group) {
        const updatedMembers = group.members.map((m) => {
          if (m.memberId === tx!.memberId) {
            return {
              ...m,
              hasPaidToday: true,
              totalContributedInGroup: m.totalContributedInGroup + tx!.amount,
            };
          }
          return m;
        });
        this.updateGroup(group.id, { members: updatedMembers });
      }

      // Update member trust score (+2 for on-time mobile payment)
      const member = this.getMemberById(tx.memberId);
      if (member) {
        this.updateMember(member.id, {
          totalContributed: member.totalContributed + tx.amount,
          trustScore: Math.min(100, (member.trustScore || 90) + 2),
        });
      }

      this.createNotification({
        title: `✅ Webhook ${operatorName} : Paiement validé`,
        message: `Cotisation de ${tx.amount.toLocaleString()} FCFA confirmée pour ${tx.memberName} (${tx.groupName}). Reçu N° ${tx.receiptNumber}.`,
        type: 'payment',
      });
    } else {
      this.createNotification({
        title: `❌ Webhook ${operatorName} : Paiement échoué`,
        message: `La transaction de ${tx.amount.toLocaleString()} FCFA pour ${tx.memberName} n'a pas abouti.`,
        type: 'reminder',
      });
    }

    this.persist();
    const groupReport = this.checkPotFundedStatus(tx.groupId);

    return {
      success: payload.status === 'completed',
      transaction: tx,
      receiptNumber: tx.receiptNumber || 'REC-DEFAULT',
      groupReport,
    };
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

function formatFCFACurrency(amount: number): string {
  return `${amount.toLocaleString()} FCFA`;
}

export const db = new DatabaseService();

export function processTontinePayout(
  groupId: string,
  roundId?: number,
  options?: { force?: boolean; operator?: string; notes?: string }
) {
  return db.processTontinePayout(groupId, roundId, options);
}

export function getTontineSummary(groupId: string) {
  return db.getTontineSummary(groupId);
}
