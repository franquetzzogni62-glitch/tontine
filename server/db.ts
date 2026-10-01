import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  User,
  Member,
  TontineGroup,
  PaymentTransaction,
  PayoutTransaction,
  TontineFinancialSummary,
  PenaltyTopupPayload,
  PenaltyTopupResult,
  AppNotification,
  BeneficiaryTurn,
  KycStatus,
  UserRole,
  TontineGroupMember,
} from '../src/types/index.js';

export interface DatabaseSchema {
  users: User[];
  groups: TontineGroup[];
  members: Member[];
  payments: PaymentTransaction[];
  payouts: PayoutTransaction[];
  notifications: AppNotification[];
  subscriptionInvoices?: any[];
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

    // Production clean initial data (empty database)
    const initialData: DatabaseSchema = {
      users: [],
      groups: [],
      members: [],
      payments: [],
      payouts: [],
      notifications: [],
      subscriptionInvoices: [],
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

  getUserByEmail(email: string): User | undefined {
    const clean = (email || '').trim().toLowerCase();
    return this.data.users.find((u) => (u.email || '').trim().toLowerCase() === clean);
  }

  hashPassword(password: string, salt = crypto.randomBytes(16).toString('hex')): { hash: string; salt: string } {
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return { hash, salt };
  }

  verifyPassword(password: string, hash: string, salt: string): boolean {
    const checkHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return checkHash === hash;
  }

  findMemberByPhoneAndCode(
    phone: string,
    accessCode: string
  ): { member: Member; group: TontineGroup; groupMember: TontineGroupMember } | null {
    const cleanPhone = (phone || '').replace(/[\s\-\(\)\+]/g, '');
    const cleanCode = (accessCode || '').replace(/\D/g, '');

    if (!cleanPhone || !cleanCode) return null;

    for (const group of this.data.groups) {
      for (const gm of group.members) {
        const storedCode = (gm.accessCode || '').replace(/\D/g, '');
        if (storedCode === cleanCode) {
          const member = this.getMemberById(gm.memberId);
          const mPhone = (member?.phone || '').replace(/[\s\-\(\)\+]/g, '');
          if (
            mPhone &&
            cleanPhone &&
            (mPhone.endsWith(cleanPhone.slice(-8)) || cleanPhone.endsWith(mPhone.slice(-8)))
          ) {
            return { member: member!, group, groupMember: gm };
          }
        }
      }
    }
    return null;
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

  // --- Subscriptions & Invoices ---
  getSubscriptionInvoices(userId?: string): any[] {
    if (!this.data.subscriptionInvoices) {
      this.data.subscriptionInvoices = [];
    }
    if (userId) {
      return this.data.subscriptionInvoices.filter((inv) => inv.userId === userId);
    }
    return this.data.subscriptionInvoices;
  }

  createSubscriptionInvoice(invoice: any): any {
    if (!this.data.subscriptionInvoices) {
      this.data.subscriptionInvoices = [];
    }
    this.data.subscriptionInvoices.unshift(invoice);
    this.persist();
    return invoice;
  }

  updateSubscription(
    userId: string,
    planId: 'starter' | 'pro' | 'enterprise',
    paymentMethod = 'SasPay Mobile Money'
  ): User | null {
    const prices: Record<string, number> = {
      starter: 5000,
      pro: 15000,
      enterprise: 30000,
    };
    const names: Record<string, string> = {
      starter: 'Formule Starter',
      pro: 'Formule Pro',
      enterprise: 'Formule Entreprise',
    };

    let user = this.getUserById(userId);
    if (!user) {
      // Fallback to first moderator user if not found
      user = this.data.users.find((u) => u.role === 'moderator') || this.data.users[0];
    }
    if (!user) return null;

    const newSub = {
      planId,
      planName: names[planId] || 'Formule Pro',
      pricePerMonth: prices[planId] || 15000,
      status: 'active' as const,
      startedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      paymentMethod,
      autoRenew: true,
      maxGroups: planId === 'starter' ? 3 : 999,
    };

    user.subscription = newSub;
    this.persist();

    // Generate invoice record
    const invoice = {
      id: `inv_${Date.now()}`,
      orderId: `TF-SUB-${Date.now()}`,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      planId,
      planName: names[planId] || 'Formule Pro',
      amount: prices[planId] || 15000,
      currency: 'XAF',
      date: new Date().toISOString(),
      status: 'paid',
      paymentMethod,
      receiptNumber: `REC-SUB-${Date.now().toString(36).toUpperCase()}`,
    };
    this.createSubscriptionInvoice(invoice);

    this.createNotification({
      title: '🌟 Abonnement SaaS Modérateur activé',
      message: `Votre abonnement ${names[planId]} a été validé avec succès via ${paymentMethod} pour 30 jours supplémentaires.`,
      type: 'payment',
    });

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
        customPenaltyAmount: g.customPenaltyAmount ?? 1000,
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
      customPenaltyAmount: g.customPenaltyAmount ?? 1000,
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
      customPenaltyAmount: Number(groupData.customPenaltyAmount) || 1000,
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


  // --- Logic: Pay Late Penalty and Guarantee Top-up (50/50 Split) ---
  payPenaltyAndTopup(payload: {
    groupId: string;
    memberId: string;
    operator?: string;
    phoneNumber?: string;
    notes?: string;
  }): PenaltyTopupResult {
    const group = this.getGroupById(payload.groupId);
    if (!group) {
      throw new Error('Groupe de tontine non trouvé.');
    }

    const member = this.getMemberById(payload.memberId);
    if (!member) {
      throw new Error('Membre non trouvé.');
    }

    const groupMember = group.members.find((m) => m.memberId === payload.memberId);
    if (!groupMember) {
      throw new Error('Ce membre ne fait pas partie de ce groupe de tontine.');
    }

    // Calculs financiers
    const missingContribution = group.contributionAmount;
    const customPenaltyAmount = group.customPenaltyAmount || 1000;
    const totalPaid = missingContribution + customPenaltyAmount;

    // Ventilation automatique 50% SaaS / 50% Bénéficiaire
    const saasPenaltyShare = Math.round(customPenaltyAmount * 0.5);
    const beneficiaryPenaltyShare = customPenaltyAmount - saasPenaltyShare;

    // Bénéficiaire du tour impacté
    const roundNumber = group.currentDay;
    const beneficiaryTurn =
      group.beneficiarySchedule.find((b) => b.order === roundNumber) ||
      group.beneficiarySchedule[0];
    const beneficiaryMember = beneficiaryTurn
      ? this.getMemberById(beneficiaryTurn.memberId)
      : undefined;

    const beneficiaryId = beneficiaryTurn?.memberId || 'ben_unknown';
    const beneficiaryName =
      beneficiaryTurn?.memberName || beneficiaryMember?.name || 'Bénéficiaire du Tour';
    const beneficiaryPhone =
      beneficiaryTurn?.memberPhone || beneficiaryMember?.phone || '+237 6 00 00 00 00';

    const operator = payload.operator || 'Orange Money';
    const txRef = `PEN-TOPUP-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const payoutGatewayRef = `GW-PEN-BEN-${Math.floor(100000 + Math.random() * 900000)}`;

    // 1. Réapprovisionner la caution du membre (guaranteeBalance)
    const currentGuarantee = member.guaranteeBalance || 0;
    const newGuaranteeBalance = currentGuarantee + missingContribution;

    // 2. Mettre à jour le statut du membre de GUARANTEE_DEPLETED vers ACTIVE
    this.updateMember(member.id, {
      status: 'active',
      guaranteeBalance: newGuaranteeBalance,
      trustScore: Math.min(100, (member.trustScore || 85) + 3), // Bonus de régularisation
      totalContributed: (member.totalContributed || 0) + missingContribution,
    });

    // Mettre à jour dans le groupe
    const updatedMembers = group.members.map((m) => {
      if (m.memberId === member.id) {
        return {
          ...m,
          hasPaidToday: true,
          status: 'ACTIVE' as const,
          guaranteeBalance: newGuaranteeBalance,
          totalContributedInGroup: (m.totalContributedInGroup || 0) + missingContribution,
        };
      }
      return m;
    });

    this.updateGroup(group.id, { members: updatedMembers });

    // 3. Simuler le versement (Payout) automatique des 50% de pénalité vers le Mobile Money du bénéficiaire
    const simulatedPayoutCall = {
      provider: operator,
      recipientPhone: beneficiaryPhone,
      amountSent: beneficiaryPenaltyShare,
      description: `Dédommagement retard (50% de pénalité de ${customPenaltyAmount.toLocaleString()} FCFA) régularisé par ${member.name} pour le Tour #${roundNumber}`,
      currency: 'XAF',
      status: 'SUCCESS',
      gatewayRef: payoutGatewayRef,
      timestamp: new Date().toISOString(),
    };

    // 4. Enregistrer la transaction globale dans le compte de la plateforme
    const receiptNumber = `REC-${txRef}`;
    this.data.payments.unshift({
      id: `tx_pen_${Date.now()}`,
      groupId: group.id,
      groupName: group.name,
      memberId: member.id,
      memberName: member.name,
      memberPhone: payload.phoneNumber || member.phone,
      amount: totalPaid,
      baseAmount: missingContribution,
      commission: saasPenaltyShare, // Part de revenu 50% conservée par le SaaS
      date: new Date().toISOString(),
      status: 'paid',
      method: `${operator} Régularisation Retard`,
      transactionRef: txRef,
      receiptNumber,
      verifiedByModerator: true,
      roundNumber,
    });

    // 5. Notifications
    // Notification pour le bénéficiaire dédommagé
    this.createNotification({
      title: `💰 Dédommagement retard reçu : ${beneficiaryPenaltyShare.toLocaleString()} FCFA`,
      message: `${beneficiaryName}, vous venez de recevoir ${beneficiaryPenaltyShare.toLocaleString()} FCFA sur votre compte ${operator} (${beneficiaryPhone}), représentant 50% de la pénalité de retard payée par ${member.name} sur la tontine ${group.name}.`,
      type: 'payout',
    });

    // Notification générale pour le groupe
    this.createNotification({
      title: `✅ Régularisation réussie : ${member.name}`,
      message: `${member.name} a régularisé son retard avec paiement de ${totalPaid.toLocaleString()} FCFA (${missingContribution.toLocaleString()} FCFA de caution restaurée + ${customPenaltyAmount.toLocaleString()} FCFA de pénalité). Statut rétabli en ACTIVE.`,
      type: 'payment',
    });

    this.persist();

    return {
      success: true,
      message: `Régularisation effectuée avec succès ! ${totalPaid.toLocaleString()} FCFA encaissés. Caution restaurée à ${newGuaranteeBalance.toLocaleString()} FCFA, ${beneficiaryPenaltyShare.toLocaleString()} FCFA versés au bénéficiaire (${beneficiaryName}) et ${saasPenaltyShare.toLocaleString()} FCFA alloués aux revenus SaaS.`,
      groupId: group.id,
      groupName: group.name,
      roundNumber,
      memberId: member.id,
      memberName: member.name,
      missingContribution,
      customPenaltyAmount,
      totalPaid,
      saasPenaltyShare,
      beneficiaryPenaltyShare,
      beneficiaryId,
      beneficiaryName,
      beneficiaryPhone,
      memberNewStatus: 'ACTIVE',
      guaranteeBalance: newGuaranteeBalance,
      transactionRef: txRef,
      receiptNumber,
      simulatedPayoutCall,
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
      members: group.members.map((m) => ({
        ...m,
        hasPaidToday: Boolean(m.paidUntilRound && m.paidUntilRound >= nextDay),
      })),
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
      const turns = newPayment.turnsCovered || 1;
      const endTurn = Math.min(group.totalMembersCount, group.currentDay + turns - 1);

      const updatedMembers = group.members.map((m) => {
        if (m.memberId === newPayment.memberId) {
          return {
            ...m,
            hasPaidToday: true,
            paidUntilRound: endTurn,
            paidToursAdvance: (m.paidToursAdvance || 0) + (turns > 1 ? turns - 1 : 0),
            totalContributedInGroup: (m.totalContributedInGroup || 0) + newPayment.amount,
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
        totalContributed: (member.totalContributed || 0) + newPayment.amount,
        trustScore: Math.min(100, (member.trustScore || 90) + 1),
      });
    }

    // Add notification
    this.createNotification({
      title: 'Cotisation enregistrée',
      message: `${newPayment.memberName} a versé ${newPayment.amount.toLocaleString()} FCFA pour ${newPayment.groupName}${newPayment.coveredRounds ? ` (${newPayment.coveredRounds})` : ''}.`,
      type: 'payment',
    });

    this.persist();
    return newPayment;
  }

  recordTurnPayment(payload: {
    groupId: string;
    memberId: string;
    turnsCount?: number;
    operator?: string;
    phoneNumber?: string;
    notes?: string;
  }): { payment: PaymentTransaction; group: TontineGroup } {
    const group = this.getGroupById(payload.groupId);
    if (!group) throw new Error('Tontine introuvable.');

    const member = this.getMemberById(payload.memberId);
    if (!member) throw new Error('Membre introuvable.');

    const gmIndex = group.members.findIndex((m) => m.memberId === payload.memberId);
    if (gmIndex === -1) throw new Error('Le membre ne fait pas partie de cette tontine.');

    const turnsCount = Math.max(1, Number(payload.turnsCount) || 1);
    const totalAmount = group.contributionAmount * turnsCount;
    const moderatorCommission = (group.moderatorCommission || 0) * turnsCount;
    const baseAmount = totalAmount - moderatorCommission;

    const startTurn = group.currentDay;
    const endTurn = Math.min(group.totalMembersCount, group.currentDay + turnsCount - 1);
    const coveredRounds = turnsCount > 1 ? `Tours #${startTurn} à #${endTurn}` : `Tour #${startTurn}`;

    const txId = `tx_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`;
    const tx: PaymentTransaction = {
      id: txId,
      groupId: group.id,
      groupName: group.name,
      memberId: member.id,
      memberName: member.name,
      memberPhone: payload.phoneNumber || member.phone,
      amount: totalAmount,
      baseAmount,
      commission: moderatorCommission,
      date: new Date().toISOString(),
      status: 'paid',
      method: payload.operator || 'Mobile Money',
      transactionRef: `TRX-${Date.now().toString().slice(-6)}`,
      receiptNumber: `REC-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
      verifiedByModerator: true,
      turnsCovered: turnsCount,
      coveredRounds,
      notes: payload.notes || `Règlement de ${turnsCount} tour(s) (${coveredRounds})`,
    };

    this.createPayment(tx);

    const updatedGroup = this.getGroupById(group.id)!;
    return { payment: tx, group: updatedGroup };
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

  // --- Stats (Multi-tenant isolated) ---
  getStatsOverview(moderatorId?: string) {
    const relevantGroups = moderatorId
      ? this.data.groups.filter((g) => g.moderatorId === moderatorId)
      : this.data.groups;

    const groupIds = new Set(relevantGroups.map((g) => g.id));
    const activeGroups = relevantGroups.filter((g) => g.status === 'active');

    // Distinct members enrolled in moderator's groups
    const enrolledMemberIds = new Set<string>();
    for (const g of relevantGroups) {
      for (const m of g.members || []) {
        enrolledMemberIds.add(m.memberId);
      }
    }
    const totalMembers = enrolledMemberIds.size;

    const relevantPayments = this.data.payments.filter((p) => groupIds.has(p.groupId));

    const totalCollected = relevantPayments.reduce(
      (acc, p) => (p.status === 'paid' ? acc + p.amount : acc),
      0
    );

    const totalCommissions = relevantPayments.reduce(
      (acc, p) => (p.status === 'paid' ? acc + p.commission : acc),
      0
    );

    const paidCount = relevantPayments.filter((p) => p.status === 'paid').length;
    const recoveryRate =
      relevantPayments.length > 0
        ? Math.round((paidCount / relevantPayments.length) * 100)
        : 100;

    return {
      activeGroupsCount: activeGroups.length,
      totalGroupsCount: relevantGroups.length,
      totalMembersCount: totalMembers,
      totalCollected,
      totalCommissions,
      recoveryRate,
      paymentsCount: relevantPayments.length,
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

export function payPenaltyAndTopup(payload: PenaltyTopupPayload) {
  return db.payPenaltyAndTopup(payload);
}

