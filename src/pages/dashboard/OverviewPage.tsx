import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Avatar } from '../../components/ui/Avatar';
import { RecordPaymentModal } from '../../components/modals/RecordPaymentModal';
import {
  TrendingUp,
  Users2,
  UserCheck,
  CreditCard,
  Plus,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Calendar,
  Wallet,
  Sparkles,
} from 'lucide-react';
import { formatFCFA, formatDate, formatDateTime } from '../../utils/formatters';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

export const OverviewPage: React.FC = () => {
  const { groups, members, payments, currentUser, advanceGroupRound } = useApp();
  const [recordModalOpen, setRecordModalOpen] = useState(false);

  // Calculate KPIs
  const activeGroups = groups.filter((g) => g.status === 'active');
  const totalMembers = members.length;

  // Total collected & total commission earned in the last 30 days
  const totalCommissionEarned = payments.reduce(
    (acc, p) => (p.status === 'paid' ? acc + p.commission : acc),
    0
  );

  const totalCollected = payments.reduce(
    (acc, p) => (p.status === 'paid' ? acc + p.amount : acc),
    0
  );

  // Recovery rate
  const paidPayments = payments.filter((p) => p.status === 'paid').length;
  const recoveryRate = payments.length > 0 ? Math.round((paidPayments / payments.length) * 100) : 98;

  // Chart data: Contributions per 5-day intervals over 30 days
  const chartData = [
    { period: '1-5 Sep', total: 145000, commission: 12500 },
    { period: '6-10 Sep', total: 182000, commission: 16000 },
    { period: '11-15 Sep', total: 210000, commission: 18500 },
    { period: '16-20 Sep', total: 195000, commission: 17000 },
    { period: '21-25 Sep', total: 245000, commission: 21500 },
    { period: '26-28 Sep', total: 285000, commission: 24500 },
  ];

  // Pie chart data: Members distribution
  const memberDistribution = [
    { name: 'À jour (Cotisés)', value: 16, color: '#10B981' },
    { name: 'En attente', value: 3, color: '#F59E0B' },
    { name: 'En retard', value: 1, color: '#EF4444' },
  ];

  // Recent 6 payments
  const recentPayments = payments.slice(0, 6);

  return (
    <div className="space-y-6 text-left">
      {/* Welcome banner & primary action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Bonjour, {currentUser.name} 👋
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Voici la synthèse de vos {activeGroups.length} tontines actives aujourd'hui (28 septembre 2026).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRecordModalOpen(true)}
            leftIcon={<CreditCard size={15} />}
          >
            Encaisser une cotisation
          </Button>
          <Link to="/dashboard/groups/new">
            <Button
              variant="emerald"
              size="sm"
              leftIcon={<Plus size={15} />}
            >
              Nouveau groupe
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Commissions modérateur */}
        <Card className="relative overflow-hidden">
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Commissions modérateur
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Wallet size={16} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              {formatFCFA(totalCommissionEarned)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              <TrendingUp size={13} />
              <span>+14.5% vs mois précédent</span>
            </div>
          </div>
        </Card>

        {/* KPI 2: Groupes actifs */}
        <Card className="relative overflow-hidden">
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Groupes actifs
            </span>
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Users2 size={16} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              {activeGroups.length}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Sur un total de {groups.length} groupes créés
            </div>
          </div>
        </Card>

        {/* KPI 3: Membres participants */}
        <Card className="relative overflow-hidden">
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Membres au total
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <UserCheck size={16} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              {totalMembers}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Score confiance moyen : <strong className="text-emerald-600">93%</strong>
            </div>
          </div>
        </Card>

        {/* KPI 4: Taux de recouvrement */}
        <Card className="relative overflow-hidden">
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Taux de recouvrement
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              {recoveryRate}%
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              {payments.length} transactions vérifiées
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Line / Area Chart: 30 days evolution */}
        <Card className="lg:col-span-8 flex flex-col justify-between">
          <CardHeader>
            <div>
              <CardTitle>Évolution des cotisations collectées</CardTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Volume brut collecté et commissions perçues au fil du mois
              </p>
            </div>
            <span className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded-md">
              Total 30j : {formatFCFA(totalCollected)}
            </span>
          </CardHeader>
          <div className="h-64 sm:h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="period" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <Tooltip
                  formatter={(val: any) => [formatFCFA(Number(val) || 0), 'Montant']}
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorTotal)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Pie Chart: Members status */}
        <Card className="lg:col-span-4 flex flex-col justify-between">
          <CardHeader>
            <div>
              <CardTitle>Statut des membres</CardTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ponctualité sur les tours du jour
              </p>
            </div>
          </CardHeader>
          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={memberDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {memberDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [`${val} membres`, 'Quantité']}
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-1 pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
            {memberDistribution.map((item) => (
              <div key={item.name} className="text-left">
                <span className="text-[10px] text-slate-500 block truncate">{item.name}</span>
                <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Active Groups Progression Section */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Groupes en cours de rotation</CardTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Progression des cycles et bénéficiaires du jour
            </p>
          </div>
          <Link to="/dashboard/groups">
            <Button variant="ghost" size="sm" rightIcon={<ArrowUpRight size={14} />}>
              Voir tous les groupes
            </Button>
          </Link>
        </CardHeader>

        <div className="space-y-4">
          {activeGroups.map((group) => {
            const currentBeneficiary = group.beneficiarySchedule.find(
              (b) => b.order === group.currentDay
            );
            const paidCount = group.members.filter((m) => m.hasPaidToday).length;

            return (
              <div
                key={group.id}
                className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/60 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Group info & current day */}
                <div className="space-y-1.5 md:w-1/3">
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/dashboard/groups/${group.id}`}
                      className="font-bold text-sm text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                    >
                      {group.name}
                    </Link>
                    <Badge variant="emerald">
                      Jour {group.currentDay}/{group.totalMembersCount}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Cotisation : <strong className="font-mono text-slate-700 dark:text-slate-300">{formatFCFA(group.contributionAmount)}</strong> / jour · Commission : <span className="font-mono">{group.moderatorCommission} FCFA</span>
                  </p>
                </div>

                {/* Beneficiary of the day */}
                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 md:w-1/3 text-left">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                    Bénéficiaire du jour (Tour #{group.currentDay})
                  </span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {currentBeneficiary?.memberName || 'Cycle terminé'}
                    </span>
                    <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      {formatFCFA(currentBeneficiary?.potAmount || 0)}
                    </span>
                  </div>
                </div>

                {/* Progress bar & action */}
                <div className="space-y-2 md:w-1/4">
                  <ProgressBar
                    value={group.currentDay}
                    max={group.totalMembersCount}
                    showLabel
                    label={`Cycle #${group.currentCycle}`}
                    size="sm"
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>{paidCount}/{group.totalMembersCount} cotisations reçues</span>
                    <button
                      onClick={() => advanceGroupRound(group.id)}
                      className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline cursor-pointer"
                    >
                      Clôturer tour
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Latest Payments List */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Dernières cotisations encaissées</CardTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Flux en direct des versements enregistrés
            </p>
          </div>
          <Link to="/dashboard/payments">
            <Button variant="ghost" size="sm" rightIcon={<ArrowUpRight size={14} />}>
              Historique complet
            </Button>
          </Link>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold">
                <th className="pb-3 px-2">Membre</th>
                <th className="pb-3 px-2">Groupe</th>
                <th className="pb-3 px-2">Date & Heure</th>
                <th className="pb-3 px-2">Moyen</th>
                <th className="pb-3 px-2 text-right">Montant</th>
                <th className="pb-3 px-2 text-right">Commission</th>
                <th className="pb-3 px-2 text-center">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentPayments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-2 font-medium text-slate-900 dark:text-white flex items-center gap-2">
                    <Avatar name={p.memberName} size="xs" />
                    <span>{p.memberName}</span>
                  </td>
                  <td className="py-3 px-2 text-slate-500 dark:text-slate-400 truncate max-w-[150px]">
                    {p.groupName}
                  </td>
                  <td className="py-3 px-2 text-slate-500 dark:text-slate-400 font-mono">
                    {formatDateTime(p.date)}
                  </td>
                  <td className="py-3 px-2">
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {p.method}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-right font-mono font-bold tabular-nums text-slate-900 dark:text-white">
                    {formatFCFA(p.amount)}
                  </td>
                  <td className="py-3 px-2 text-right font-mono font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                    +{formatFCFA(p.commission)}
                  </td>
                  <td className="py-3 px-2 text-center">
                    <Badge variant={p.status === 'paid' ? 'success' : p.status === 'late' ? 'danger' : 'warning'}>
                      {p.status === 'paid' ? 'Payé' : p.status === 'late' ? 'En retard' : 'En attente'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={recordModalOpen}
        onClose={() => setRecordModalOpen(false)}
      />
    </div>
  );
};
