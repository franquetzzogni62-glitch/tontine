import { User, Member, TontineGroup, PaymentTransaction, AppNotification } from '../types';

export const CURRENT_MODERATOR: User = {
  id: 'user_mod_1',
  name: 'Mme Claire Mballa',
  firstName: 'Claire',
  lastName: 'Mballa',
  email: 'claire.mballa@tontiflow.africa',
  phone: '+237 6 99 45 22 10',
  whatsappNumber: '+237 6 99 45 22 10',
  avatarUrl: '/src/assets/images/avatar_claire_moderator_1790600689069.jpg',
  role: 'moderator',
  trustScore: 100,
  kycStatus: 'verified',
  city: 'Douala',
  country: 'Cameroun',
};

export const CURRENT_MEMBER: User = {
  id: 'mem_2',
  name: 'Amadou Bello',
  firstName: 'Amadou',
  lastName: 'Bello',
  email: 'amadou.bello@gmail.com',
  phone: '+237 6 75 12 34 56',
  whatsappNumber: '+237 6 75 12 34 56',
  role: 'member',
  trustScore: 96,
  kycStatus: 'verified',
  city: 'Garoua',
  country: 'Cameroun',
};

const RAW_MEMBERS = [
  {
    id: 'mem_1',
    name: 'Mélanie Ngo Bassong',
    phone: '+237 6 94 33 21 00',
    email: 'melanie.ngo@gmail.com',
    city: 'Douala (Akwa)',
    trustScore: 98,
    joinedDate: '2026-01-15',
    groupsCount: 3,
    totalContributed: 440000,
    totalReceived: 400000,
    status: 'active',
    notes: 'Excellente payeuse, toujours ponctuelle à 08h00.',
  },
  {
    id: 'mem_2',
    name: 'Amadou Bello',
    phone: '+237 6 75 12 34 56',
    email: 'amadou.bello@gmail.com',
    city: 'Garoua',
    trustScore: 96,
    joinedDate: '2026-02-01',
    groupsCount: 2,
    totalContributed: 220000,
    totalReceived: 200000,
    status: 'active',
    notes: 'Commerçant de bétail et céréales.',
  },
  {
    id: 'mem_3',
    name: 'Ibrahim Diallo',
    phone: '+237 6 50 88 77 66',
    email: 'ibrahim.diallo@pro.cm',
    city: 'Yaoundé (Bastos)',
    trustScore: 92,
    joinedDate: '2026-02-10',
    groupsCount: 2,
    totalContributed: 198000,
    totalReceived: 180000,
    status: 'active',
  },
  {
    id: 'mem_4',
    name: 'Fanta Camara',
    phone: '+237 6 98 44 55 12',
    email: 'fanta.camara@couture.ci',
    city: 'Douala (Bonapriso)',
    trustScore: 95,
    joinedDate: '2026-01-20',
    groupsCount: 3,
    totalContributed: 330000,
    totalReceived: 300000,
    status: 'active',
  },
  {
    id: 'mem_5',
    name: 'Kouassi Jean-Marc',
    phone: '+237 6 77 65 43 21',
    email: 'kouassi.jm@orange.cm',
    city: 'Douala (Deïdo)',
    trustScore: 88,
    joinedDate: '2026-03-01',
    groupsCount: 1,
    totalContributed: 88000,
    totalReceived: 0,
    status: 'active',
  },
  {
    id: 'mem_6',
    name: 'Aïssatou Sow',
    phone: '+237 6 91 22 33 44',
    email: 'aissatou.sow@afrique-eco.cm',
    city: 'Bafoussam',
    trustScore: 99,
    joinedDate: '2025-11-10',
    groupsCount: 4,
    totalContributed: 660000,
    totalReceived: 600000,
    status: 'active',
  },
  {
    id: 'mem_7',
    name: 'Samuel Eto\'o Mbida',
    phone: '+237 6 79 00 11 22',
    email: 'samuel.mbida@sport-invest.cm',
    city: 'Yaoundé',
    trustScore: 94,
    joinedDate: '2026-02-15',
    groupsCount: 2,
    totalContributed: 220000,
    totalReceived: 0,
    status: 'active',
  },
  {
    id: 'mem_8',
    name: 'Grace Makoun',
    phone: '+237 6 96 55 44 33',
    email: 'grace.makoun@pharmacie.cm',
    city: 'Douala (Bonamoussadi)',
    trustScore: 97,
    joinedDate: '2026-01-05',
    groupsCount: 3,
    totalContributed: 396000,
    totalReceived: 360000,
    status: 'active',
  },
  {
    id: 'mem_9',
    name: 'Christian Nganou',
    phone: '+237 6 74 33 88 99',
    email: 'christian.nganou@tech.cm',
    city: 'Douala (Bali)',
    trustScore: 84,
    joinedDate: '2026-03-05',
    groupsCount: 1,
    totalContributed: 55000,
    totalReceived: 0,
    status: 'active',
    notes: 'A eu un léger retard lors du tour 3, régularisé le soir même.',
  },
  {
    id: 'mem_10',
    name: 'Béatrice Kemajou',
    phone: '+237 6 93 11 22 77',
    email: 'beatrice.kemajou@agro.cm',
    city: 'Nkongsamba',
    trustScore: 91,
    joinedDate: '2026-02-18',
    groupsCount: 2,
    totalContributed: 165000,
    totalReceived: 150000,
    status: 'active',
  },
  {
    id: 'mem_11',
    name: 'Patrick Tientcheu',
    phone: '+237 6 78 99 00 11',
    email: 'patrick.tientcheu@gmail.com',
    city: 'Douala',
    trustScore: 89,
    joinedDate: '2026-03-12',
    groupsCount: 1,
    totalContributed: 66000,
    totalReceived: 0,
    status: 'active',
  },
  {
    id: 'mem_12',
    name: 'Pauline Njié',
    phone: '+237 6 90 44 33 22',
    email: 'pauline.njie@educ.cm',
    city: 'Buea',
    trustScore: 93,
    joinedDate: '2026-01-28',
    groupsCount: 2,
    totalContributed: 187000,
    totalReceived: 170000,
    status: 'active',
  },
  {
    id: 'mem_13',
    name: 'Yves Kamdem',
    phone: '+237 6 71 88 99 00',
    email: 'yves.kamdem@btp.cm',
    city: 'Bafoussam',
    trustScore: 86,
    joinedDate: '2026-02-25',
    groupsCount: 1,
    totalContributed: 77000,
    totalReceived: 0,
    status: 'active',
  },
  {
    id: 'mem_14',
    name: 'Fatou Ndiaye',
    phone: '+237 6 95 66 77 88',
    email: 'fatou.ndiaye@dakar-mode.com',
    city: 'Yaoundé',
    trustScore: 96,
    joinedDate: '2026-01-10',
    groupsCount: 2,
    totalContributed: 264000,
    totalReceived: 240000,
    status: 'active',
  },
  {
    id: 'mem_15',
    name: 'Moussa Traoré',
    phone: '+237 6 76 55 44 22',
    email: 'moussa.traore@logistique.cm',
    city: 'Kribi',
    trustScore: 90,
    joinedDate: '2026-03-02',
    groupsCount: 1,
    totalContributed: 55000,
    totalReceived: 0,
    status: 'active',
  },
  {
    id: 'mem_16',
    name: 'Esther Nguemo',
    phone: '+237 6 92 11 00 44',
    email: 'esther.nguemo@sante.cm',
    city: 'Yaoundé',
    trustScore: 95,
    joinedDate: '2026-02-14',
    groupsCount: 2,
    totalContributed: 176000,
    totalReceived: 0,
    status: 'active',
  },
  {
    id: 'mem_17',
    name: 'David Mbe',
    phone: '+237 6 73 22 11 99',
    email: 'david.mbe@marche.cm',
    city: 'Douala (New-Bell)',
    trustScore: 78,
    joinedDate: '2026-03-15',
    groupsCount: 1,
    totalContributed: 33000,
    totalReceived: 0,
    status: 'active',
    notes: 'Relances fréquentes nécessaires par SMS.',
  },
  {
    id: 'mem_18',
    name: 'Rose Fotso',
    phone: '+237 6 97 88 55 33',
    email: 'rose.fotso@restaurant.cm',
    city: 'Douala (Akwa)',
    trustScore: 98,
    joinedDate: '2025-12-01',
    groupsCount: 3,
    totalContributed: 450000,
    totalReceived: 420000,
    status: 'active',
  },
  {
    id: 'mem_19',
    name: 'Alain Tchinda',
    phone: '+237 6 70 33 22 11',
    email: 'alain.tchinda@import.cm',
    city: 'Douala (Bonabéri)',
    trustScore: 93,
    joinedDate: '2026-02-05',
    groupsCount: 2,
    totalContributed: 240000,
    totalReceived: 210000,
    status: 'active',
  },
  {
    id: 'mem_20',
    name: 'Chantal Biya Mbarga',
    phone: '+237 6 99 77 66 55',
    email: 'chantal.mbarga@coiffure.cm',
    city: 'Yaoundé (Mokolo)',
    trustScore: 97,
    joinedDate: '2026-01-18',
    groupsCount: 2,
    totalContributed: 275000,
    totalReceived: 250000,
    status: 'active',
  },
];

export const MOCK_MEMBERS: Member[] = RAW_MEMBERS.map((m) => {
  const parts = m.name.split(' ');
  const firstName = parts[0] || m.name;
  const lastName = parts.slice(1).join(' ') || '';
  const kycStatus = (m.trustScore >= 92 ? 'verified' : m.trustScore >= 80 ? 'pending' : 'unverified') as any;
  return {
    ...m,
    status: m.status as any,
    firstName,
    lastName,
    kycStatus,
    presenceValidated: true,
  };
});

// Helper to generate schedule
function generateSchedule(
  membersList: { id: string; name: string; phone: string }[],
  startDateStr: string,
  potAmount: number,
  completedUpTo: number
): { schedule: any[]; currentDay: number } {
  const schedule = membersList.map((m, index) => {
    const d = new Date(startDateStr);
    d.setDate(d.getDate() + index);
    const dateStr = d.toISOString().split('T')[0];
    const order = index + 1;
    let status: 'completed' | 'current' | 'upcoming' = 'upcoming';
    if (order < completedUpTo) status = 'completed';
    else if (order === completedUpTo) status = 'current';

    return {
      order,
      memberId: m.id,
      memberName: m.name,
      memberPhone: m.phone,
      scheduledDate: dateStr,
      potAmount,
      status,
      payoutReference: status === 'completed' ? `PAY-TF-${1000 + order}` : undefined,
    };
  });

  return { schedule, currentDay: completedUpTo };
}

// 5 Realistic Groups
const RAW_GROUPS = [
  {
    id: 'grp_1',
    name: 'Tontine Mélanie - Express Akwa',
    description: 'Cotisation quotidienne pour commerçants du grand marché Akwa. Pot remis chaque jour à 18h.',
    moderatorId: 'user_mod_1',
    contributionAmount: 1100, // 1 050 FCFA pot + 50 FCFA commission modérateur
    moderatorCommission: 50,
    commissionType: 'fixed',
    frequency: 'daily',
    currency: 'FCFA',
    totalMembersCount: 10,
    currentCycle: 3,
    currentDay: 6, // Day 6 / 10
    status: 'active',
    startDate: '2026-09-23',
    endDate: '2026-10-02',
    category: 'Commerce & Négoce',
    members: [
      { memberId: 'mem_1', turnOrder: 1, hasPaidToday: true, totalContributedInGroup: 6600 },
      { memberId: 'mem_2', turnOrder: 2, hasPaidToday: true, totalContributedInGroup: 6600 },
      { memberId: 'mem_3', turnOrder: 3, hasPaidToday: true, totalContributedInGroup: 6600 },
      { memberId: 'mem_4', turnOrder: 4, hasPaidToday: true, totalContributedInGroup: 6600 },
      { memberId: 'mem_5', turnOrder: 5, hasPaidToday: true, totalContributedInGroup: 6600 },
      { memberId: 'mem_6', turnOrder: 6, hasPaidToday: true, totalContributedInGroup: 6600 }, // Current recipient
      { memberId: 'mem_7', turnOrder: 7, hasPaidToday: false, totalContributedInGroup: 5500 },
      { memberId: 'mem_8', turnOrder: 8, hasPaidToday: true, totalContributedInGroup: 6600 },
      { memberId: 'mem_9', turnOrder: 9, hasPaidToday: false, totalContributedInGroup: 5500 },
      { memberId: 'mem_10', turnOrder: 10, hasPaidToday: true, totalContributedInGroup: 6600 },
    ],
    beneficiarySchedule: [
      { order: 1, memberId: 'mem_1', memberName: 'Mélanie Ngo Bassong', memberPhone: '+237 6 94 33 21 00', scheduledDate: '2026-09-23', potAmount: 10500, status: 'completed', payoutReference: 'PAY-TF-901' },
      { order: 2, memberId: 'mem_2', memberName: 'Amadou Bello', memberPhone: '+237 6 75 12 34 56', scheduledDate: '2026-09-24', potAmount: 10500, status: 'completed', payoutReference: 'PAY-TF-902' },
      { order: 3, memberId: 'mem_3', memberName: 'Ibrahim Diallo', memberPhone: '+237 6 50 88 77 66', scheduledDate: '2026-09-25', potAmount: 10500, status: 'completed', payoutReference: 'PAY-TF-903' },
      { order: 4, memberId: 'mem_4', memberName: 'Fanta Camara', memberPhone: '+237 6 98 44 55 12', scheduledDate: '2026-09-26', potAmount: 10500, status: 'completed', payoutReference: 'PAY-TF-904' },
      { order: 5, memberId: 'mem_5', memberName: 'Kouassi Jean-Marc', memberPhone: '+237 6 77 65 43 21', scheduledDate: '2026-09-27', potAmount: 10500, status: 'completed', payoutReference: 'PAY-TF-905' },
      { order: 6, memberId: 'mem_6', memberName: 'Aïssatou Sow', memberPhone: '+237 6 91 22 33 44', scheduledDate: '2026-09-28', potAmount: 10500, status: 'current' },
      { order: 7, memberId: 'mem_7', memberName: 'Samuel Eto\'o Mbida', memberPhone: '+237 6 79 00 11 22', scheduledDate: '2026-09-29', potAmount: 10500, status: 'upcoming' },
      { order: 8, memberId: 'mem_8', memberName: 'Grace Makoun', memberPhone: '+237 6 96 55 44 33', scheduledDate: '2026-09-30', potAmount: 10500, status: 'upcoming' },
      { order: 9, memberId: 'mem_9', memberName: 'Christian Nganou', memberPhone: '+237 6 74 33 88 99', scheduledDate: '2026-10-01', potAmount: 10500, status: 'upcoming' },
      { order: 10, memberId: 'mem_10', memberName: 'Béatrice Kemajou', memberPhone: '+237 6 93 11 22 77', scheduledDate: '2026-10-02', potAmount: 10500, status: 'upcoming' },
    ],
  },
  {
    id: 'grp_2',
    name: 'Groupe Espoir - Épargne Douala',
    description: 'Tontine solidaire à haute capacité : 5 500 FCFA/jour. Pot de 50 000 FCFA + 500 FCFA commission modérateur par membre.',
    moderatorId: 'user_mod_1',
    contributionAmount: 5500,
    moderatorCommission: 500,
    commissionType: 'fixed',
    frequency: 'daily',
    currency: 'FCFA',
    totalMembersCount: 10,
    currentCycle: 1,
    currentDay: 3, // Day 3 / 10
    status: 'active',
    startDate: '2026-09-26',
    endDate: '2026-10-05',
    category: 'Entrepreneurs',
    members: [
      { memberId: 'mem_11', turnOrder: 1, hasPaidToday: true, totalContributedInGroup: 16500 },
      { memberId: 'mem_12', turnOrder: 2, hasPaidToday: true, totalContributedInGroup: 16500 },
      { memberId: 'mem_14', turnOrder: 3, hasPaidToday: true, totalContributedInGroup: 16500 }, // Current recipient
      { memberId: 'mem_15', turnOrder: 4, hasPaidToday: true, totalContributedInGroup: 16500 },
      { memberId: 'mem_16', turnOrder: 5, hasPaidToday: false, totalContributedInGroup: 11000 },
      { memberId: 'mem_18', turnOrder: 6, hasPaidToday: true, totalContributedInGroup: 16500 },
      { memberId: 'mem_19', turnOrder: 7, hasPaidToday: true, totalContributedInGroup: 16500 },
      { memberId: 'mem_20', turnOrder: 8, hasPaidToday: true, totalContributedInGroup: 16500 },
      { memberId: 'mem_1', turnOrder: 9, hasPaidToday: true, totalContributedInGroup: 16500 },
      { memberId: 'mem_2', turnOrder: 10, hasPaidToday: true, totalContributedInGroup: 16500 },
    ],
    beneficiarySchedule: [
      { order: 1, memberId: 'mem_11', memberName: 'Patrick Tientcheu', memberPhone: '+237 6 78 99 00 11', scheduledDate: '2026-09-26', potAmount: 50000, status: 'completed', payoutReference: 'PAY-TF-801' },
      { order: 2, memberId: 'mem_12', memberName: 'Pauline Njié', memberPhone: '+237 6 90 44 33 22', scheduledDate: '2026-09-27', potAmount: 50000, status: 'completed', payoutReference: 'PAY-TF-802' },
      { order: 3, memberId: 'mem_14', memberName: 'Fatou Ndiaye', memberPhone: '+237 6 95 66 77 88', scheduledDate: '2026-09-28', potAmount: 50000, status: 'current' },
      { order: 4, memberId: 'mem_15', memberName: 'Moussa Traoré', memberPhone: '+237 6 76 55 44 22', scheduledDate: '2026-09-29', potAmount: 50000, status: 'upcoming' },
      { order: 5, memberId: 'mem_16', memberName: 'Esther Nguemo', memberPhone: '+237 6 92 11 00 44', scheduledDate: '2026-09-30', potAmount: 50000, status: 'upcoming' },
      { order: 6, memberId: 'mem_18', memberName: 'Rose Fotso', memberPhone: '+237 6 97 88 55 33', scheduledDate: '2026-10-01', potAmount: 50000, status: 'upcoming' },
      { order: 7, memberId: 'mem_19', memberName: 'Alain Tchinda', memberPhone: '+237 6 70 33 22 11', scheduledDate: '2026-10-02', potAmount: 50000, status: 'upcoming' },
      { order: 8, memberId: 'mem_20', memberName: 'Chantal Biya Mbarga', memberPhone: '+237 6 99 77 66 55', scheduledDate: '2026-10-03', potAmount: 50000, status: 'upcoming' },
      { order: 9, memberId: 'mem_1', memberName: 'Mélanie Ngo Bassong', memberPhone: '+237 6 94 33 21 00', scheduledDate: '2026-10-04', potAmount: 50000, status: 'upcoming' },
      { order: 10, memberId: 'mem_2', memberName: 'Amadou Bello', memberPhone: '+237 6 75 12 34 56', scheduledDate: '2026-10-05', potAmount: 50000, status: 'upcoming' },
    ],
  },
  {
    id: 'grp_3',
    name: 'Cercle Femmes Dynamiques Yaoundé',
    description: 'Groupe d\'entraide et investissement pour commerçantes du marché Mokolo. 2 200 FCFA/jour.',
    moderatorId: 'user_mod_1',
    contributionAmount: 2200,
    moderatorCommission: 200,
    commissionType: 'fixed',
    frequency: 'daily',
    currency: 'FCFA',
    totalMembersCount: 8,
    currentCycle: 2,
    currentDay: 7, // Day 7 / 8
    status: 'active',
    startDate: '2026-09-22',
    endDate: '2026-09-29',
    category: 'Femmes Entrepreneures',
    members: [
      { memberId: 'mem_4', turnOrder: 1, hasPaidToday: true, totalContributedInGroup: 15400 },
      { memberId: 'mem_6', turnOrder: 2, hasPaidToday: true, totalContributedInGroup: 15400 },
      { memberId: 'mem_8', turnOrder: 3, hasPaidToday: true, totalContributedInGroup: 15400 },
      { memberId: 'mem_10', turnOrder: 4, hasPaidToday: true, totalContributedInGroup: 15400 },
      { memberId: 'mem_12', turnOrder: 5, hasPaidToday: true, totalContributedInGroup: 15400 },
      { memberId: 'mem_14', turnOrder: 6, hasPaidToday: true, totalContributedInGroup: 15400 },
      { memberId: 'mem_18', turnOrder: 7, hasPaidToday: true, totalContributedInGroup: 15400 }, // Current recipient
      { memberId: 'mem_20', turnOrder: 8, hasPaidToday: false, totalContributedInGroup: 13200 },
    ],
    beneficiarySchedule: [
      { order: 1, memberId: 'mem_4', memberName: 'Fanta Camara', memberPhone: '+237 6 98 44 55 12', scheduledDate: '2026-09-22', potAmount: 16000, status: 'completed', payoutReference: 'PAY-TF-701' },
      { order: 2, memberId: 'mem_6', memberName: 'Aïssatou Sow', memberPhone: '+237 6 91 22 33 44', scheduledDate: '2026-09-23', potAmount: 16000, status: 'completed', payoutReference: 'PAY-TF-702' },
      { order: 3, memberId: 'mem_8', memberName: 'Grace Makoun', memberPhone: '+237 6 96 55 44 33', scheduledDate: '2026-09-24', potAmount: 16000, status: 'completed', payoutReference: 'PAY-TF-703' },
      { order: 4, memberId: 'mem_10', memberName: 'Béatrice Kemajou', memberPhone: '+237 6 93 11 22 77', scheduledDate: '2026-09-25', potAmount: 16000, status: 'completed', payoutReference: 'PAY-TF-704' },
      { order: 5, memberId: 'mem_12', memberName: 'Pauline Njié', memberPhone: '+237 6 90 44 33 22', scheduledDate: '2026-09-26', potAmount: 16000, status: 'completed', payoutReference: 'PAY-TF-705' },
      { order: 6, memberId: 'mem_14', memberName: 'Fatou Ndiaye', memberPhone: '+237 6 95 66 77 88', scheduledDate: '2026-09-27', potAmount: 16000, status: 'completed', payoutReference: 'PAY-TF-706' },
      { order: 7, memberId: 'mem_18', memberName: 'Rose Fotso', memberPhone: '+237 6 97 88 55 33', scheduledDate: '2026-09-28', potAmount: 16000, status: 'current' },
      { order: 8, memberId: 'mem_20', memberName: 'Chantal Biya Mbarga', memberPhone: '+237 6 99 77 66 55', scheduledDate: '2026-09-29', potAmount: 16000, status: 'upcoming' },
    ],
  },
  {
    id: 'grp_4',
    name: 'Tontine Solidarité Bafoussam',
    description: 'Épargne hebdomadaire pour grossistes en produits vivriers. Montant 11 000 FCFA/semaine.',
    moderatorId: 'user_mod_1',
    contributionAmount: 11000,
    moderatorCommission: 1000,
    commissionType: 'fixed',
    frequency: 'weekly',
    currency: 'FCFA',
    totalMembersCount: 6,
    currentCycle: 1,
    currentDay: 6, // 6 / 6
    status: 'completed',
    startDate: '2026-08-15',
    endDate: '2026-09-19',
    category: 'Agrobusiness',
    members: [
      { memberId: 'mem_6', turnOrder: 1, hasPaidToday: true, totalContributedInGroup: 66000 },
      { memberId: 'mem_10', turnOrder: 2, hasPaidToday: true, totalContributedInGroup: 66000 },
      { memberId: 'mem_13', turnOrder: 3, hasPaidToday: true, totalContributedInGroup: 66000 },
      { memberId: 'mem_17', turnOrder: 4, hasPaidToday: true, totalContributedInGroup: 66000 },
      { memberId: 'mem_18', turnOrder: 5, hasPaidToday: true, totalContributedInGroup: 66000 },
      { memberId: 'mem_19', turnOrder: 6, hasPaidToday: true, totalContributedInGroup: 66000 },
    ],
    beneficiarySchedule: [
      { order: 1, memberId: 'mem_6', memberName: 'Aïssatou Sow', memberPhone: '+237 6 91 22 33 44', scheduledDate: '2026-08-15', potAmount: 60000, status: 'completed', payoutReference: 'PAY-TF-501' },
      { order: 2, memberId: 'mem_10', memberName: 'Béatrice Kemajou', memberPhone: '+237 6 93 11 22 77', scheduledDate: '2026-08-22', potAmount: 60000, status: 'completed', payoutReference: 'PAY-TF-502' },
      { order: 3, memberId: 'mem_13', memberName: 'Yves Kamdem', memberPhone: '+237 6 71 88 99 00', scheduledDate: '2026-08-29', potAmount: 60000, status: 'completed', payoutReference: 'PAY-TF-503' },
      { order: 4, memberId: 'mem_17', memberName: 'David Mbe', memberPhone: '+237 6 73 22 11 99', scheduledDate: '2026-09-05', potAmount: 60000, status: 'completed', payoutReference: 'PAY-TF-504' },
      { order: 5, memberId: 'mem_18', memberName: 'Rose Fotso', memberPhone: '+237 6 97 88 55 33', scheduledDate: '2026-09-12', potAmount: 60000, status: 'completed', payoutReference: 'PAY-TF-505' },
      { order: 6, memberId: 'mem_19', memberName: 'Alain Tchinda', memberPhone: '+237 6 70 33 22 11', scheduledDate: '2026-09-19', potAmount: 60000, status: 'completed', payoutReference: 'PAY-TF-506' },
    ],
  },
  {
    id: 'grp_5',
    name: 'Tontine Moto-Taximen Deïdo',
    description: 'Cotisation quotidienne pour renouvellement et entretien d\'engins à deux roues. 1 100 FCFA/jour.',
    moderatorId: 'user_mod_1',
    contributionAmount: 1100,
    moderatorCommission: 100,
    commissionType: 'fixed',
    frequency: 'daily',
    currency: 'FCFA',
    totalMembersCount: 8,
    currentCycle: 1,
    currentDay: 0,
    status: 'pending',
    startDate: '2026-10-01',
    endDate: '2026-10-08',
    category: 'Transport & Logistique',
    members: [
      { memberId: 'mem_3', turnOrder: 1, hasPaidToday: false, totalContributedInGroup: 0 },
      { memberId: 'mem_5', turnOrder: 2, hasPaidToday: false, totalContributedInGroup: 0 },
      { memberId: 'mem_7', turnOrder: 3, hasPaidToday: false, totalContributedInGroup: 0 },
      { memberId: 'mem_9', turnOrder: 4, hasPaidToday: false, totalContributedInGroup: 0 },
      { memberId: 'mem_11', turnOrder: 5, hasPaidToday: false, totalContributedInGroup: 0 },
      { memberId: 'mem_13', turnOrder: 6, hasPaidToday: false, totalContributedInGroup: 0 },
      { memberId: 'mem_15', turnOrder: 7, hasPaidToday: false, totalContributedInGroup: 0 },
      { memberId: 'mem_17', turnOrder: 8, hasPaidToday: false, totalContributedInGroup: 0 },
    ],
    beneficiarySchedule: [
      { order: 1, memberId: 'mem_3', memberName: 'Ibrahim Diallo', memberPhone: '+237 6 50 88 77 66', scheduledDate: '2026-10-01', potAmount: 8000, status: 'upcoming' },
      { order: 2, memberId: 'mem_5', memberName: 'Kouassi Jean-Marc', memberPhone: '+237 6 77 65 43 21', scheduledDate: '2026-10-02', potAmount: 8000, status: 'upcoming' },
      { order: 3, memberId: 'mem_7', memberName: 'Samuel Eto\'o Mbida', memberPhone: '+237 6 79 00 11 22', scheduledDate: '2026-10-03', potAmount: 8000, status: 'upcoming' },
      { order: 4, memberId: 'mem_9', memberName: 'Christian Nganou', memberPhone: '+237 6 74 33 88 99', scheduledDate: '2026-10-04', potAmount: 8000, status: 'upcoming' },
      { order: 5, memberId: 'mem_11', memberName: 'Patrick Tientcheu', memberPhone: '+237 6 78 99 00 11', scheduledDate: '2026-10-05', potAmount: 8000, status: 'upcoming' },
      { order: 6, memberId: 'mem_13', memberName: 'Yves Kamdem', memberPhone: '+237 6 71 88 99 00', scheduledDate: '2026-10-06', potAmount: 8000, status: 'upcoming' },
      { order: 7, memberId: 'mem_15', memberName: 'Moussa Traoré', memberPhone: '+237 6 76 55 44 22', scheduledDate: '2026-10-07', potAmount: 8000, status: 'upcoming' },
      { order: 8, memberId: 'mem_17', memberName: 'David Mbe', memberPhone: '+237 6 73 22 11 99', scheduledDate: '2026-10-08', potAmount: 8000, status: 'upcoming' },
    ],
  },
];

export const MOCK_GROUPS: TontineGroup[] = RAW_GROUPS.map((g) => {
  const type = (g.id === 'grp_4' ? 'sociale' : 'rotative') as any;
  const drawDay = g.frequency === 'weekly' ? 'Chaque Samedi' : 'Tous les jours';
  const potAmount = (g.contributionAmount - g.moderatorCommission) * g.totalMembersCount;
  return {
    ...g,
    commissionType: g.commissionType as 'fixed' | 'percentage',
    frequency: g.frequency as any,
    status: g.status as any,
    beneficiarySchedule: g.beneficiarySchedule as any,
    type,
    drawDay,
    potAmount,
    nextTurnDate: '2026-09-29',
  };
});

// Generate 110 realistic transactions over 30 days
export function generateMockTransactions(): PaymentTransaction[] {
  const transactions: PaymentTransaction[] = [];
  const methods: ('Orange Money' | 'MTN MoMo' | 'Wave')[] = ['Orange Money', 'MTN MoMo', 'Wave'];
  const today = new Date('2026-09-28T09:30:00');

  let idCounter = 1000;

  // Recent today transactions
  const todayTxs = [
    { mem: MOCK_MEMBERS[0], grp: MOCK_GROUPS[0], amount: 1100, comm: 50, method: 'MTN MoMo' as const, status: 'paid' as const, time: '07:15' },
    { mem: MOCK_MEMBERS[1], grp: MOCK_GROUPS[0], amount: 1100, comm: 50, method: 'Orange Money' as const, status: 'paid' as const, time: '08:04' },
    { mem: MOCK_MEMBERS[2], grp: MOCK_GROUPS[0], amount: 1100, comm: 50, method: 'Orange Money' as const, status: 'paid' as const, time: '08:42' },
    { mem: MOCK_MEMBERS[3], grp: MOCK_GROUPS[0], amount: 1100, comm: 50, method: 'MTN MoMo' as const, status: 'paid' as const, time: '09:10' },
    { mem: MOCK_MEMBERS[4], grp: MOCK_GROUPS[0], amount: 1100, comm: 50, method: 'Wave' as const, status: 'paid' as const, time: '09:25' },
    { mem: MOCK_MEMBERS[5], grp: MOCK_GROUPS[0], amount: 1100, comm: 50, method: 'Orange Money' as const, status: 'paid' as const, time: '09:32' },
    { mem: MOCK_MEMBERS[6], grp: MOCK_GROUPS[0], amount: 1100, comm: 50, method: 'MTN MoMo' as const, status: 'pending' as const, time: 'En attente' },
    { mem: MOCK_MEMBERS[7], grp: MOCK_GROUPS[0], amount: 1100, comm: 50, method: 'MTN MoMo' as const, status: 'paid' as const, time: '09:45' },
    { mem: MOCK_MEMBERS[8], grp: MOCK_GROUPS[0], amount: 1100, comm: 50, method: 'Wave' as const, status: 'late' as const, time: 'Rappel envoyé' },
    { mem: MOCK_MEMBERS[9], grp: MOCK_GROUPS[0], amount: 1100, comm: 50, method: 'Orange Money' as const, status: 'paid' as const, time: '10:02' },
    // Group 2 today
    { mem: MOCK_MEMBERS[10], grp: MOCK_GROUPS[1], amount: 5500, comm: 500, method: 'Orange Money' as const, status: 'paid' as const, time: '07:30' },
    { mem: MOCK_MEMBERS[11], grp: MOCK_GROUPS[1], amount: 5500, comm: 500, method: 'MTN MoMo' as const, status: 'paid' as const, time: '08:12' },
    { mem: MOCK_MEMBERS[13], grp: MOCK_GROUPS[1], amount: 5500, comm: 500, method: 'Wave' as const, status: 'paid' as const, time: '08:50' },
    { mem: MOCK_MEMBERS[14], grp: MOCK_GROUPS[1], amount: 5500, comm: 500, method: 'Orange Money' as const, status: 'paid' as const, time: '09:15' },
    { mem: MOCK_MEMBERS[15], grp: MOCK_GROUPS[1], amount: 5500, comm: 500, method: 'MTN MoMo' as const, status: 'late' as const, time: 'En retard' },
  ];

  todayTxs.forEach((tx) => {
    idCounter++;
    transactions.push({
      id: `tx_${idCounter}`,
      groupId: tx.grp.id,
      groupName: tx.grp.name,
      memberId: tx.mem.id,
      memberName: tx.mem.name,
      memberPhone: tx.mem.phone,
      amount: tx.amount,
      baseAmount: tx.amount - tx.comm,
      commission: tx.comm,
      date: '2026-09-28T' + (tx.time.includes(':') ? tx.time + ':00' : '10:00:00'),
      status: tx.status,
      method: tx.method,
      transactionRef: `TRX-${idCounter}`,
      verifiedByModerator: tx.status === 'paid',
    });
  });

  // Past 29 days
  for (let dayOffset = 1; dayOffset <= 29; dayOffset++) {
    const d = new Date(today);
    d.setDate(d.getDate() - dayOffset);
    const dateStr = d.toISOString().split('T')[0];

    // Simulate 3-5 payments per past day
    const count = 3 + (dayOffset % 3);
    for (let j = 0; j < count; j++) {
      idCounter++;
      const memIndex = (dayOffset * 3 + j) % MOCK_MEMBERS.length;
      const mem = MOCK_MEMBERS[memIndex];
      const grpIndex = (dayOffset + j) % 3; // grp 1, 2 or 3
      const grp = MOCK_GROUPS[grpIndex];
      const method = methods[(dayOffset + j) % methods.length];
      const isLate = dayOffset === 2 && j === 1;

      transactions.push({
        id: `tx_${idCounter}`,
        groupId: grp.id,
        groupName: grp.name,
        memberId: mem.id,
        memberName: mem.name,
        memberPhone: mem.phone,
        amount: grp.contributionAmount,
        baseAmount: grp.contributionAmount - grp.moderatorCommission,
        commission: grp.moderatorCommission,
        date: `${dateStr}T${String(8 + (j * 2)).padStart(2, '0')}:15:00`,
        status: isLate ? 'late' : 'paid',
        method,
        transactionRef: `TRX-${idCounter}`,
        verifiedByModerator: !isLate,
      });
    }
  }

  return transactions;
}

export const MOCK_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif_1',
    title: 'Cotisation reçue',
    message: 'Mélanie Ngo Bassong a cotisé 1 100 FCFA pour la Tontine Mélanie via MTN MoMo.',
    timestamp: '2026-09-28T07:15:00',
    read: false,
    type: 'payment',
  },
  {
    id: 'notif_2',
    title: 'Tour du jour disponible !',
    message: 'Aujourd\'hui, c\'est le tour de Aïssatou Sow pour recevoir la cagnotte de 10 500 FCFA.',
    timestamp: '2026-09-28T08:00:00',
    read: false,
    type: 'round',
  },
  {
    id: 'notif_3',
    title: 'Rappel automatique envoyé',
    message: '2 membres du Groupe Espoir ont reçu une relance SMS pour leur cotisation du jour.',
    timestamp: '2026-09-28T09:00:00',
    read: false,
    type: 'reminder',
  },
  {
    id: 'notif_4',
    title: 'Cycle achevé avec succès',
    message: 'Le cycle de la Tontine Solidarité Bafoussam s\'est clôturé avec 100% de recouvrement.',
    timestamp: '2026-09-20T18:30:00',
    read: true,
    type: 'system',
  },
];
