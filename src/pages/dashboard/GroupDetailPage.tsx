import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Tabs } from '../../components/ui/Tabs';
import { Avatar } from '../../components/ui/Avatar';
import { Input } from '../../components/ui/Input';
import { RecordPaymentModal } from '../../components/modals/RecordPaymentModal';
import { InviteModal } from '../../components/modals/InviteModal';
import {
  ArrowLeft,
  Users2,
  Calendar,
  CreditCard,
  Settings,
  Share2,
  CheckCircle2,
  Clock,
  Send,
  AlertCircle,
  Archive,
  Phone,
  Wallet,
  Sparkles,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { formatFCFA, formatDate, formatDateTime } from '../../utils/formatters';

export const GroupDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { groups, members, payments, advanceGroupRound, recordPayment, deleteGroup, addToast } = useApp();

  const group = groups.find((g) => g.id === id);

  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'calendar' | 'payments' | 'settings'>('overview');
  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [selectedMemberForPayment, setSelectedMemberForPayment] = useState<string | undefined>(undefined);

  if (!group) {
    return (
      <div className="text-center py-16 space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Groupe introuvable</h2>
        <p className="text-xs text-slate-500">Ce groupe n'existe pas ou a été archivé.</p>
        <Link to="/dashboard/groups">
          <Button variant="emerald" size="sm">
            Retour aux groupes
          </Button>
        </Link>
      </div>
    );
  }

  const currentBeneficiary = group.beneficiarySchedule.find(
    (b) => b.order === group.currentDay
  );

  const totalPot = (group.contributionAmount - group.moderatorCommission) * group.totalMembersCount;
  const expectedToday = group.contributionAmount * group.totalMembersCount;
  const collectedTodayCount = group.members.filter((m) => m.hasPaidToday).length;
  const collectedTodayAmount = collectedTodayCount * group.contributionAmount;

  // Filter payments for this group
  const groupPayments = payments.filter((p) => p.groupId === group.id);

  const handleMarkPaid = (memberId: string, memberName: string, memberPhone: string) => {
    recordPayment({
      groupId: group.id,
      groupName: group.name,
      memberId,
      memberName,
      memberPhone,
      amount: group.contributionAmount,
      baseAmount: group.contributionAmount - group.moderatorCommission,
      commission: group.moderatorCommission,
      date: new Date().toISOString(),
      status: 'paid',
      method: 'Orange Money',
      verifiedByModerator: true,
    });
  };

  const handleSendReminder = (phone: string, name: string) => {
    addToast('Relance envoyée', `Un SMS de relance a été envoyé au ${phone} (${name}).`, 'info');
  };

  const handleArchive = () => {
    deleteGroup(group.id);
    navigate('/dashboard/groups');
  };

  const tabsList = [
    { id: 'overview', label: 'Vue d\'ensemble' },
    { id: 'members', label: 'Membres', count: group.members.length },
    { id: 'calendar', label: 'Calendrier des tours' },
    { id: 'payments', label: 'Paiements', count: groupPayments.length },
    { id: 'settings', label: 'Paramètres' },
  ];

  return (
    <div className="space-y-6 text-left">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard/groups"
            className="p-2 -ml-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {group.name}
              </h2>
              <Badge variant={group.status === 'active' ? 'success' : 'neutral'}>
                {group.status === 'active' ? 'Actif' : 'Terminé'}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Cotisation : <strong className="font-mono text-slate-800 dark:text-slate-200">{formatFCFA(group.contributionAmount)}</strong> / jour · Commission modérateur : <span className="font-mono">{group.moderatorCommission} FCFA</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInviteModalOpen(true)}
            leftIcon={<Share2 size={15} />}
          >
            Inviter
          </Button>

          {group.status === 'active' && (
            <Button
              variant="emerald"
              size="sm"
              onClick={() => advanceGroupRound(group.id)}
              leftIcon={<CheckCircle2 size={15} />}
            >
              Clôturer le tour #{group.currentDay}
            </Button>
          )}
        </div>
      </div>

      {/* Navigation tabs */}
      <Tabs
        tabs={tabsList}
        activeTab={activeTab}
        onChange={(tabId) => setActiveTab(tabId as any)}
        variant="underline"
      />

      {/* Tab 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Beneficiary of the day */}
            <Card className="bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/30 dark:to-slate-900 border-emerald-200/80 dark:border-emerald-800/60">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block mb-1">
                Bénéficiaire du jour (Tour #{group.currentDay})
              </span>
              <div className="flex items-center gap-3 mt-2">
                <Avatar name={currentBeneficiary?.memberName || 'Membre'} size="md" />
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {currentBeneficiary?.memberName || 'Aucun'}
                  </h4>
                  <p className="text-xs font-mono text-slate-500 truncate">
                    {currentBeneficiary?.memberPhone}
                  </p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-emerald-200/60 dark:border-emerald-800/40 flex justify-between items-baseline">
                <span className="text-xs text-slate-600 dark:text-slate-400">Montant du pot :</span>
                <span className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  {formatFCFA(currentBeneficiary?.potAmount || totalPot)}
                </span>
              </div>
            </Card>

            {/* Collected today vs Expected */}
            <Card>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Collecte du jour
              </span>
              <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                {formatFCFA(collectedTodayAmount)}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Sur {formatFCFA(expectedToday)} attendus ({collectedTodayCount}/{group.totalMembersCount} membres)
              </p>
              <div className="mt-3">
                <ProgressBar
                  value={collectedTodayCount}
                  max={group.totalMembersCount}
                  size="sm"
                />
              </div>
            </Card>

            {/* Cycle Progress */}
            <Card>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Progression du cycle
              </span>
              <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                Jour {group.currentDay} / {group.totalMembersCount}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Cycle #{group.currentCycle} · Du {formatDate(group.startDate)} au {formatDate(group.endDate)}
              </p>
              <div className="mt-3">
                <ProgressBar
                  value={group.currentDay}
                  max={group.totalMembersCount}
                  size="sm"
                  color="amber"
                />
              </div>
            </Card>
          </div>

          {/* Chronological Beneficiary Schedule */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Ordre chronologique des bénéficiaires</CardTitle>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Calendrier de rotation prédéfini et statut des cagnottes
                </p>
              </div>
            </CardHeader>

            <div className="space-y-2.5">
              {group.beneficiarySchedule.map((item) => {
                const isCurrent = item.order === group.currentDay;
                const isCompleted = item.status === 'completed';

                return (
                  <div
                    key={item.order}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                      isCurrent
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 ring-1 ring-emerald-500/20'
                        : isCompleted
                        ? 'border-slate-200/60 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/40 opacity-80'
                        : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold font-mono shrink-0 ${
                          isCompleted
                            ? 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            : isCurrent
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        #{item.order}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {item.memberName}
                          </span>
                          {isCurrent && (
                            <Badge variant="emerald" showDot={false}>
                              Aujourd'hui
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                          <Calendar size={12} /> {formatDate(item.scheduledDate)} · {item.memberPhone}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-mono text-xs font-bold text-slate-900 dark:text-white block">
                        {formatFCFA(item.potAmount)}
                      </span>
                      <span
                        className={`text-[10px] font-semibold ${
                          isCompleted
                            ? 'text-slate-400'
                            : isCurrent
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-amber-500'
                        }`}
                      >
                        {isCompleted
                          ? `Remis (${item.payoutReference || 'Validé'})`
                          : isCurrent
                          ? 'En cours de collecte'
                          : 'À venir'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* Tab 2: MEMBERS */}
      {activeTab === 'members' && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Membres participants ({group.members.length})</CardTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Statut de paiement du jour et historique des cotisations
              </p>
            </div>

            <Button
              variant="emerald"
              size="sm"
              onClick={() => {
                setSelectedMemberForPayment(undefined);
                setRecordModalOpen(true);
              }}
              leftIcon={<CreditCard size={15} />}
            >
              Enregistrer un versement
            </Button>
          </CardHeader>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold">
                  <th className="pb-3 px-2">Tour</th>
                  <th className="pb-3 px-2">Membre</th>
                  <th className="pb-3 px-2">Téléphone</th>
                  <th className="pb-3 px-2">Cotisation du jour</th>
                  <th className="pb-3 px-2 text-right">Total cotisé dans ce groupe</th>
                  <th className="pb-3 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {group.members.map((gm) => {
                  const memberInfo = members.find((m) => m.id === gm.memberId);
                  const isCurrentTour = gm.turnOrder === group.currentDay;

                  return (
                    <tr
                      key={gm.memberId}
                      className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors ${
                        isCurrentTour ? 'bg-emerald-50/20 dark:bg-emerald-950/10' : ''
                      }`}
                    >
                      <td className="py-3 px-2 font-mono font-bold text-slate-500">
                        #{gm.turnOrder}
                      </td>
                      <td className="py-3 px-2 font-medium text-slate-900 dark:text-white flex items-center gap-2">
                        <Avatar name={memberInfo?.name || 'Membre'} size="xs" />
                        <div>
                          <span>{memberInfo?.name}</span>
                          {isCurrentTour && (
                            <span className="block text-[10px] text-emerald-600 font-semibold">
                              Bénéficiaire du jour
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-slate-500 font-mono">
                        {memberInfo?.phone}
                      </td>
                      <td className="py-3 px-2">
                        {gm.hasPaidToday ? (
                          <Badge variant="success">Cotisé aujourd'hui</Badge>
                        ) : (
                          <Badge variant="warning">En attente</Badge>
                        )}
                      </td>
                      <td className="py-3 px-2 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {formatFCFA(gm.totalContributedInGroup)}
                      </td>
                      <td className="py-3 px-2 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!gm.hasPaidToday && (
                            <>
                              <Button
                                variant="emerald"
                                size="sm"
                                onClick={() =>
                                  handleMarkPaid(
                                    gm.memberId,
                                    memberInfo?.name || '',
                                    memberInfo?.phone || ''
                                  )
                                }
                              >
                                Marquer payé
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleSendReminder(
                                    memberInfo?.phone || '',
                                    memberInfo?.name || ''
                                  )
                                }
                                title="Envoyer rappel SMS"
                              >
                                <Send size={14} />
                              </Button>
                            </>
                          )}
                          {gm.hasPaidToday && (
                            <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                              <CheckCircle2 size={14} /> Validé
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab 3: CALENDAR */}
      {activeTab === 'calendar' && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Calendrier de rotation sur 30 jours</CardTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Visualisez chaque date de versement et le récipiendaire désigné
              </p>
            </div>
          </CardHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {group.beneficiarySchedule.map((item) => {
              const isToday = item.order === group.currentDay;
              const isPast = item.order < group.currentDay;

              return (
                <div
                  key={item.order}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    isToday
                      ? 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/20'
                      : isPast
                      ? 'border-slate-200/60 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/30 opacity-75'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1">
                    <span>Tour #{item.order}</span>
                    <span>{formatDate(item.scheduledDate)}</span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {item.memberName}
                  </h4>

                  <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-baseline">
                    <span className="text-[10px] text-slate-500">Cagnotte :</span>
                    <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      {formatFCFA(item.potAmount)}
                    </span>
                  </div>

                  <div className="mt-1">
                    {isToday ? (
                      <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">
                        ● Aujourd'hui
                      </span>
                    ) : isPast ? (
                      <span className="text-[10px] text-slate-400">Terminé</span>
                    ) : (
                      <span className="text-[10px] text-amber-500">Prévu</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Tab 4: PAYMENTS */}
      {activeTab === 'payments' && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Historique des paiements ({groupPayments.length})</CardTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Toutes les cotisations reçues et vérifiées pour ce groupe
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRecordModalOpen(true)}
              leftIcon={<CreditCard size={15} />}
            >
              Nouveau versement
            </Button>
          </CardHeader>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold">
                  <th className="pb-3 px-2">Réf</th>
                  <th className="pb-3 px-2">Date</th>
                  <th className="pb-3 px-2">Membre</th>
                  <th className="pb-3 px-2">Moyen</th>
                  <th className="pb-3 px-2 text-right">Montant</th>
                  <th className="pb-3 px-2 text-right">Commission</th>
                  <th className="pb-3 px-2 text-center">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {groupPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-2 font-mono text-slate-400">
                      {p.transactionRef}
                    </td>
                    <td className="py-3 px-2 text-slate-500 font-mono">
                      {formatDateTime(p.date)}
                    </td>
                    <td className="py-3 px-2 font-medium text-slate-900 dark:text-white">
                      {p.memberName}
                    </td>
                    <td className="py-3 px-2 text-slate-600 dark:text-slate-300">
                      {p.method}
                    </td>
                    <td className="py-3 px-2 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {formatFCFA(p.amount)}
                    </td>
                    <td className="py-3 px-2 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                      +{formatFCFA(p.commission)}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <Badge variant={p.status === 'paid' ? 'success' : 'warning'}>
                        {p.status === 'paid' ? 'Payé' : 'En attente'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab 5: SETTINGS */}
      {activeTab === 'settings' && (
        <Card className="max-w-xl">
          <CardHeader>
            <div>
              <CardTitle>Paramètres de la tontine</CardTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Modifier les règles ou archiver ce groupe
              </p>
            </div>
          </CardHeader>

          <div className="space-y-4 text-xs">
            <Input
              label="Nom du groupe"
              defaultValue={group.name}
            />

            <Input
              label="Montant cotisation par tour (FCFA)"
              type="number"
              defaultValue={group.contributionAmount}
            />

            <Input
              label="Commission modérateur (FCFA)"
              type="number"
              defaultValue={group.moderatorCommission}
            />

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div>
                <h4 className="font-bold text-rose-600 text-xs">Zone de danger</h4>
                <p className="text-[11px] text-slate-400">Archiver ou clôturer définitivement ce groupe</p>
              </div>

              <Button
                variant="danger"
                size="sm"
                onClick={handleArchive}
                leftIcon={<Archive size={14} />}
              >
                Archiver le groupe
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Modals */}
      <RecordPaymentModal
        isOpen={recordModalOpen}
        onClose={() => setRecordModalOpen(false)}
        defaultGroupId={group.id}
        defaultMemberId={selectedMemberForPayment}
      />

      <InviteModal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        groupId={group.id}
        groupName={group.name}
      />
    </div>
  );
};
