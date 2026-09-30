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
import { EnrollMemberModal } from '../../components/modals/EnrollMemberModal';
import { PayoutPotModal } from '../../components/modals/PayoutPotModal';
import { ReceiptModal } from '../../components/modals/ReceiptModal';
import { FinancialSummaryWidget } from '../../components/FinancialSummaryWidget';
import { RegularizePenaltyModal } from '../../components/modals/RegularizePenaltyModal';
import { PaymentTransaction, Member } from '../../types';
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
  Coins,
  Zap,
  ArrowUp,
  ArrowDown,
  ShieldCheck,
  FileText,
  AlertTriangle,
  RotateCw,
  Copy,
  KeyRound,
  UserPlus,
} from 'lucide-react';
import {
  formatFCFA,
  formatDate,
  formatDateTime,
  formatAccessCode,
  generate6DigitCode,
} from '../../utils/formatters';

export const GroupDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    groups,
    members,
    payments,
    advanceGroupRound,
    recordPayment,
    deleteGroup,
    reorderTurns,
    verifyMemberPresence,
    addToast,
  } = useApp();

  const group = groups.find((g) => g.id === id);

  const [activeTab, setActiveTab] = useState<'overview' | 'register' | 'admin' | 'calendar' | 'payments' | 'settings'>('overview');
  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [payoutModalOpen, setPayoutModalOpen] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [regularizeModalOpen, setRegularizeModalOpen] = useState(false);
  const [selectedMemberForPenalty, setSelectedMemberForPenalty] = useState<Member | undefined>(undefined);
  const [selectedTxForReceipt, setSelectedTxForReceipt] = useState<PaymentTransaction | null>(null);
  const [selectedMemberForPayment, setSelectedMemberForPayment] = useState<string | undefined>(undefined);

  if (!group) {
    return (
      <div className="text-center py-16 space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Tontine introuvable</h2>
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

  const netPerMember = group.contributionAmount - group.moderatorCommission;
  const totalPotExpected = netPerMember * group.totalMembersCount;

  // Filter payments for this group
  const groupPayments = payments.filter((p) => p.groupId === group.id);

  // Pot statistics
  const paidMembersCount = group.members.filter((m) => m.hasPaidToday).length;
  const paidMembersAmount = paidMembersCount * netPerMember;
  const remainingPotNeeded = totalPotExpected - paidMembersAmount;
  const potPercentage = Math.round((paidMembersCount / group.totalMembersCount) * 100);
  const isPotFullyFunded = paidMembersCount === group.totalMembersCount;

  const handleMarkPaid = (memberId: string, memberName: string, memberPhone: string) => {
    recordPayment({
      groupId: group.id,
      groupName: group.name,
      memberId,
      memberName,
      memberPhone,
      amount: group.contributionAmount,
      baseAmount: netPerMember,
      commission: group.moderatorCommission,
      date: new Date().toISOString(),
      status: 'paid',
      method: 'Orange Money',
      verifiedByModerator: true,
      roundNumber: group.currentDay,
      cycleNumber: group.currentCycle,
    });
  };

  const handleSendReminder = (phone: string, name: string) => {
    addToast('Relance envoyée', `Un SMS & message WhatsApp de relance ont été envoyés à ${name} (${phone}).`, 'info');
  };

  const handleCopyAccessCode = (code: string, memberName: string) => {
    navigator.clipboard?.writeText(code);
    addToast('Code secret copié !', `Code à 6 chiffres de ${memberName} (${code}) copié dans le presse-papiers.`, 'success');
  };

  const handleShareWhatsApp = (phone: string, name: string, code: string, groupTitle: string) => {
    const text = encodeURIComponent(
      `Bonjour ${name},\nVous avez été inscrit(e) à la tontine « ${groupTitle} » sur TontiFlow.\n\n` +
      `🔑 Votre CODE PERSONNEL à 6 chiffres pour accéder à votre tableau de bord cotisant est : ${code}\n\n` +
      `Connectez-vous avec votre numéro (${phone}) et votre code sur : ${window.location.origin}/login`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleArchive = () => {
    deleteGroup(group.id);
    navigate('/dashboard/groups');
  };

  const handleViewReceipt = (tx: PaymentTransaction) => {
    setSelectedTxForReceipt(tx);
    setReceiptModalOpen(true);
  };

  // Reorder turns handlers
  const handleMoveTurn = (memberId: string, direction: 'up' | 'down') => {
    const currentOrder = group.members.find((m) => m.memberId === memberId)?.turnOrder;
    if (!currentOrder) return;

    const targetOrder = direction === 'up' ? currentOrder - 1 : currentOrder + 1;
    if (targetOrder < 1 || targetOrder > group.members.length) return;

    // Swap
    const otherMember = group.members.find((m) => m.turnOrder === targetOrder);
    if (!otherMember) return;

    const newTurns = group.members.map((m) => {
      if (m.memberId === memberId) return { memberId: m.memberId, order: targetOrder };
      if (m.memberId === otherMember.memberId) return { memberId: m.memberId, order: currentOrder };
      return { memberId: m.memberId, order: m.turnOrder };
    });

    reorderTurns(group.id, newTurns);
  };

  const tabsList = [
    { id: 'overview', label: 'Tableau du Pot' },
    { id: 'register', label: 'Registre des Cotisations', count: group.members.length },
    { id: 'admin', label: 'Espace Administration' },
    { id: 'calendar', label: 'Ordre de Passage' },
    { id: 'payments', label: 'Grand Livre', count: groupPayments.length },
    { id: 'settings', label: 'Paramètres' },
  ];

  return (
    <div className="space-y-6 text-left">
      {/* Top Header & Fast Actions */}
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
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                {group.name}
              </h2>
              <Badge variant={group.status === 'active' ? 'success' : 'neutral'}>
                {group.status === 'active' ? 'En cours' : group.status}
              </Badge>
              <Badge variant="neutral" className="capitalize text-[10px]">
                {group.type === 'rotative' ? 'Tontine Rotative Fixe' : group.type}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Cotisation : <strong className="font-mono text-slate-800 dark:text-slate-200">{formatFCFA(group.contributionAmount)}</strong> · Fréquence : <span className="capitalize">{group.frequency === 'daily' ? 'Quotidienne' : group.frequency}</span> · Tirage : {group.drawDay || 'Tous les jours à 18h'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="emerald"
            size="sm"
            onClick={() => setEnrollModalOpen(true)}
            leftIcon={<UserPlus size={14} />}
          >
            Inscrire un membre
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setInviteModalOpen(true)}
            leftIcon={<Share2 size={14} />}
          >
            Inviter
          </Button>

          {/* Payout pot action */}
          {group.status === 'active' && (
            <Button
              variant="emerald"
              size="sm"
              onClick={() => setPayoutModalOpen(true)}
              leftIcon={<Coins size={15} />}
            >
              Déclencher le Payout (Tour #{group.currentDay})
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

      {/* ========================================================================= */}
      {/* TAB 1: TABLEAU DE BORD DU POT & VUE D'ENSEMBLE */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Widget Récapitulatif Financier avec Déduction SaaS 5% */}
          <FinancialSummaryWidget
            group={group}
            onOpenPayoutModal={() => setPayoutModalOpen(true)}
            isAdmin={true}
          />

          {/* Key Metrics row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Tableau de bord du Pot Actuel */}
            <Card className="p-5 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-teal-500/10 border-emerald-500/30 relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                  <Coins size={14} /> Tableau de Bord du Pot (Tour #{group.currentDay})
                </span>
                <Badge variant={isPotFullyFunded ? 'success' : 'warning'}>
                  {isPotFullyFunded ? '100% Récolté' : `${potPercentage}% Collecté`}
                </Badge>
              </div>

              <div className="mt-2">
                <span className="text-xs text-slate-500 dark:text-slate-400 block">Total collecté ce tour :</span>
                <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                  {formatFCFA(paidMembersAmount)}
                </div>
                <div className="flex justify-between items-baseline text-xs text-slate-500 mt-1">
                  <span>Objectif : <strong className="font-mono text-slate-700 dark:text-slate-300">{formatFCFA(totalPotExpected)}</strong></span>
                  <span>Restant : <strong className="font-mono text-amber-600 dark:text-amber-400">{formatFCFA(remainingPotNeeded)}</strong></span>
                </div>
              </div>

              <div className="mt-3.5 space-y-1">
                <ProgressBar
                  value={paidMembersCount}
                  max={group.totalMembersCount}
                  size="md"
                  color={isPotFullyFunded ? 'emerald' : 'amber'}
                />
                <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                  <span>{paidMembersCount} ont cotisé</span>
                  <span>{group.totalMembersCount - paidMembersCount} en retard/attente</span>
                </div>
              </div>
            </Card>

            {/* Bénéficiaire du Tour Actuel */}
            <Card className="p-5 border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Bénéficiaire désigné ce tour
              </span>

              <div className="flex items-center gap-3">
                <Avatar name={currentBeneficiary?.memberName || 'Bénéficiaire'} size="lg" />
                <div className="min-w-0">
                  <h4 className="text-base font-extrabold text-slate-900 dark:text-white truncate">
                    {currentBeneficiary?.memberName || 'Non assigné'}
                  </h4>
                  <p className="text-xs font-mono text-slate-500 truncate">
                    {currentBeneficiary?.memberPhone}
                  </p>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-1">
                    <Sparkles size={12} /> Ramassage Tour #{group.currentDay}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-500">Échéance programmée :</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {formatDate(currentBeneficiary?.scheduledDate || group.startDate)}
                </span>
              </div>
            </Card>

            {/* Progression Globale du Cycle */}
            <Card className="p-5 border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Progression du Cycle (#{group.currentCycle})
              </span>

              <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                Tour {group.currentDay} sur {group.totalMembersCount}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Du {formatDate(group.startDate)} au {formatDate(group.endDate)}
              </p>

              <div className="mt-4 space-y-1">
                <ProgressBar
                  value={group.currentDay}
                  max={group.totalMembersCount}
                  size="md"
                  color="emerald"
                />
                <span className="text-[11px] text-slate-400 block">
                  {Math.round((group.currentDay / group.totalMembersCount) * 100)}% des tours complétés
                </span>
              </div>
            </Card>
          </div>

          {/* Ordre de Passage Visuel (Déjà reçu, Bénéficiaire en cours, À venir) */}
          <Card className="p-5">
            <CardHeader className="px-0 pt-0 pb-4">
              <div className="flex items-center justify-between w-full">
                <div>
                  <CardTitle>Ordre de passage & Rotation de la cagnotte</CardTitle>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Visualisation chronologique des bénéficiaires et état de déboursement
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab('admin')}
                  leftIcon={<Settings size={13} />}
                >
                  Gérer l'ordre
                </Button>
              </div>
            </CardHeader>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {group.beneficiarySchedule.map((item) => {
                const isCurrent = item.order === group.currentDay;
                const isCompleted = item.status === 'completed';

                return (
                  <div
                    key={item.order}
                    className={`p-3.5 rounded-2xl border transition-all relative ${
                      isCurrent
                        ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 ring-2 ring-emerald-500/30 shadow-md'
                        : isCompleted
                        ? 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar name={item.memberName} size="sm" />
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {item.memberName}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-mono block">
                            Tour #{item.order} · {formatDate(item.scheduledDate)}
                          </span>
                        </div>
                      </div>

                      {isCurrent ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-white animate-pulse">
                          En cours
                        </span>
                      ) : isCompleted ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          Déjà reçu
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                          À venir
                        </span>
                      )}
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400 text-[11px]">Cagnotte :</span>
                      <strong className="text-slate-900 dark:text-white">
                        {formatFCFA(item.potAmount)}
                      </strong>
                    </div>

                    {item.payoutReference && (
                      <span className="text-[10px] text-emerald-600 font-mono block mt-1">
                        Réf: {item.payoutReference}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: REGISTRE DES COTISATIONS DU TOUR EN COURS */}
      {/* ========================================================================= */}
      {activeTab === 'register' && (
        <Card className="p-5">
          <CardHeader className="px-0 pt-0 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
              <div>
                <CardTitle>Registre des Cotisations · Tour #{group.currentDay}</CardTitle>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Pointage interactif en temps réel : {paidMembersCount} payés, {group.members.length - paidMembersCount} en retard / attente
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEnrollModalOpen(true)}
                  leftIcon={<UserPlus size={15} />}
                >
                  Inscrire un membre
                </Button>

                <Button
                  variant="emerald"
                  size="sm"
                  onClick={() => {
                    setSelectedMemberForPayment(undefined);
                    setRecordModalOpen(true);
                  }}
                  leftIcon={<CreditCard size={15} />}
                >
                  Encaisser versement
                </Button>
              </div>
            </div>
          </CardHeader>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="pb-3 px-3">Tour</th>
                  <th className="pb-3 px-3">Membre participant</th>
                  <th className="pb-3 px-3">Téléphone</th>
                  <th className="pb-3 px-3">Code 6 chiffres</th>
                  <th className="pb-3 px-3">Score Confiance</th>
                  <th className="pb-3 px-3 text-center">Statut Cotisation Tour #{group.currentDay}</th>
                  <th className="pb-3 px-3 text-right">Cotisé ce tour</th>
                  <th className="pb-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {group.members.map((gm) => {
                  const memberInfo = members.find((m) => m.id === gm.memberId);
                  const isCurrentTourBeneficiary = gm.turnOrder === group.currentDay;
                  const hasPaid = gm.hasPaidToday;

                  // Find matching payment transaction for this tour if paid
                  const tx = groupPayments.find((p) => p.memberId === gm.memberId);

                  return (
                    <tr
                      key={gm.memberId}
                      className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors ${
                        isCurrentTourBeneficiary ? 'bg-emerald-50/20 dark:bg-emerald-950/15' : ''
                      }`}
                    >
                      <td className="py-3.5 px-3 font-mono font-bold text-slate-500">
                        #{gm.turnOrder}
                      </td>

                      <td className="py-3.5 px-3 font-medium text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={memberInfo?.name || 'Membre'} size="sm" />
                          <div>
                            <span className="font-bold block">{memberInfo?.name}</span>
                            {memberInfo?.status === 'GUARANTEE_DEPLETED' && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 inline-block mt-0.5">
                                Caution Épuisée
                              </span>
                            )}
                            {isCurrentTourBeneficiary && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block">
                                <Sparkles size={11} /> Bénéficiaire du tour
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-3 font-mono text-slate-500">
                        {memberInfo?.phone}
                      </td>

                      <td className="py-3.5 px-3">
                        {(() => {
                          const schedTurn = group.beneficiarySchedule.find((b) => b.memberId === gm.memberId);
                          const memberAccessCode =
                            gm.accessCode ||
                            schedTurn?.accessCode ||
                            generate6DigitCode(gm.memberId + group.id);
                          return (
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs border border-slate-200 dark:border-slate-700">
                                {formatAccessCode(memberAccessCode)}
                              </span>
                              <button
                                onClick={() =>
                                  handleCopyAccessCode(memberAccessCode, memberInfo?.name || '')
                                }
                                className="p-1 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer"
                                title="Copier le code à 6 chiffres"
                              >
                                <Copy size={13} />
                              </button>
                              <button
                                onClick={() =>
                                  handleShareWhatsApp(
                                    memberInfo?.phone || '',
                                    memberInfo?.name || '',
                                    memberAccessCode,
                                    group.name
                                  )
                                }
                                className="p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded transition-colors cursor-pointer"
                                title="Envoyer le code au membre par WhatsApp"
                              >
                                <Share2 size={13} />
                              </button>
                            </div>
                          );
                        })()}
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                          {memberInfo?.trustScore || 90}% ⭐
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        {hasPaid ? (
                          <Badge variant="success">
                            <span className="flex items-center gap-1">
                              <CheckCircle2 size={12} /> Payé
                            </span>
                          </Badge>
                        ) : (
                          <Badge variant="danger">
                            <span className="flex items-center gap-1">
                              <Clock size={12} /> En retard / Attente
                            </span>
                          </Badge>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {hasPaid ? formatFCFA(group.contributionAmount) : '0 FCFA'}
                      </td>

                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!hasPaid ? (
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
                                Valider versement
                              </Button>

                              <Button
                                variant="outline"
                                size="sm"
                                className="border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10 text-[11px]"
                                onClick={() => {
                                  if (memberInfo) {
                                    setSelectedMemberForPenalty(memberInfo);
                                    setRegularizeModalOpen(true);
                                  }
                                }}
                                title="Régulariser retard et pénalité (50% SaaS / 50% Bénéficiaire)"
                              >
                                Pénalité ({formatFCFA(group.customPenaltyAmount || 1000)})
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
                                title="Relancer via WhatsApp/SMS"
                              >
                                <Send size={13} />
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (tx) {
                                  handleViewReceipt(tx);
                                } else {
                                  // Synthesize transaction for receipt
                                  handleViewReceipt({
                                    id: `tx_${gm.memberId}`,
                                    groupId: group.id,
                                    groupName: group.name,
                                    memberId: gm.memberId,
                                    memberName: memberInfo?.name || '',
                                    memberPhone: memberInfo?.phone || '',
                                    amount: group.contributionAmount,
                                    baseAmount: netPerMember,
                                    commission: group.moderatorCommission,
                                    date: new Date().toISOString(),
                                    status: 'paid',
                                    method: 'Orange Money',
                                    transactionRef: `TRX-${Math.floor(100000 + Math.random() * 900000)}`,
                                    receiptNumber: `REC-${group.id.slice(0, 4).toUpperCase()}-${gm.turnOrder}`,
                                    verifiedByModerator: true,
                                  });
                                }
                              }}
                              leftIcon={<FileText size={13} />}
                            >
                              Reçu
                            </Button>
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

      {/* ========================================================================= */}
      {/* TAB 3: ESPACE ADMINISTRATION DU GROUPE */}
      {/* ========================================================================= */}
      {activeTab === 'admin' && (
        <div className="space-y-6">
          {/* Inscription Membres & Remise de code secret à 6 chiffres */}
          <Card className="p-5 border-emerald-500/20 bg-emerald-50/20 dark:bg-emerald-950/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <KeyRound className="text-emerald-500" size={18} />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Inscrire un membre & Générer son code d'accès à 6 chiffres
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl">
                  Seul le modérateur inscrit les membres de sa tontine et leur remet leur code secret à 6 chiffres personnel. Le membre utilise son numéro et ce code unique pour se connecter et voir son tableau de bord cotisant.
                </p>
              </div>

              <Button
                variant="emerald"
                size="md"
                onClick={() => setEnrollModalOpen(true)}
                leftIcon={<UserPlus size={16} />}
              >
                Inscrire un membre
              </Button>
            </div>
          </Card>

          {/* Quick Payout Disbursement Section */}
          <Card className="p-5 border-emerald-500/30 bg-gradient-to-r from-emerald-50/40 dark:from-emerald-950/20 to-transparent">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Coins className="text-emerald-500" size={18} />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Versement du pot (Payout) au bénéficiaire de la session
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
                  Vérifie automatiquement si tous les membres ont payé ({paidMembersCount}/{group.members.length} cotisations). Débloque et vire la cagnotte à {currentBeneficiary?.memberName || 'le bénéficiaire'}.
                </p>
              </div>

              <Button
                variant="emerald"
                size="md"
                onClick={() => setPayoutModalOpen(true)}
                leftIcon={<Coins size={16} />}
              >
                Déclencher le Payout ({formatFCFA(paidMembersAmount)})
              </Button>
            </div>
          </Card>

          {/* Reconfigure Turns Order */}
          <Card className="p-5">
            <CardHeader className="px-0 pt-0 pb-4">
              <div>
                <CardTitle>Reconfiguration de l'ordre des tours</CardTitle>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Ajustez les positions de rotation des membres à l'aide des boutons fléchés
                </p>
              </div>
            </CardHeader>

            <div className="space-y-2">
              {group.members
                .slice()
                .sort((a, b) => a.turnOrder - b.turnOrder)
                .map((gm, idx) => {
                  const m = members.find((x) => x.id === gm.memberId);
                  const isCurrent = gm.turnOrder === group.currentDay;

                  return (
                    <div
                      key={gm.memberId}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                        isCurrent
                          ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-xs w-6 text-slate-400">
                          #{gm.turnOrder}
                        </span>
                        <Avatar name={m?.name || 'Membre'} size="sm" />
                        <div>
                          <span className="font-bold text-xs text-slate-900 dark:text-white block">
                            {m?.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {m?.phone} · KYC : {m?.kycStatus || 'Vérifié'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Member Presence Validation toggle */}
                        <button
                          onClick={() => verifyMemberPresence(group.id, gm.memberId, !gm.presenceValidated)}
                          className={`px-2 py-1 rounded-md text-[10px] font-semibold border cursor-pointer transition-colors ${
                            gm.presenceValidated ?? true
                              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                              : 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                          }`}
                          title="Valider la présence du membre"
                        >
                          <ShieldCheck size={11} className="inline mr-1" />
                          {gm.presenceValidated ?? true ? 'Présence Validée' : 'En attente présence'}
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleMoveTurn(gm.memberId, 'up')}
                            disabled={idx === 0}
                            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
                            title="Monter la position"
                          >
                            <ArrowUp size={14} />
                          </button>
                          <button
                            onClick={() => handleMoveTurn(gm.memberId, 'down')}
                            disabled={idx === group.members.length - 1}
                            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
                            title="Descendre la position"
                          >
                            <ArrowDown size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: CALENDRIER COMPLET */}
      {/* ========================================================================= */}
      {activeTab === 'calendar' && (
        <Card className="p-5">
          <CardHeader className="px-0 pt-0 pb-4">
            <CardTitle>Calendrier prévisionnel de rotation</CardTitle>
          </CardHeader>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {group.beneficiarySchedule.map((b) => (
              <div key={b.order} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-xs text-slate-400">#{b.order}</span>
                  <Avatar name={b.memberName} size="sm" />
                  <div>
                    <h5 className="font-bold text-xs text-slate-900 dark:text-white">{b.memberName}</h5>
                    <span className="text-[10px] text-slate-400 font-mono">Date prévue : {formatDate(b.scheduledDate)}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono font-bold text-xs text-slate-900 dark:text-white block">
                    {formatFCFA(b.potAmount)}
                  </span>
                  <Badge variant={b.status === 'completed' ? 'neutral' : b.status === 'current' ? 'success' : 'neutral'}>
                    {b.status === 'completed' ? 'Déjà encaissé' : b.status === 'current' ? 'En cours' : 'À venir'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: GRAND LIVRE DES PAIEMENTS */}
      {/* ========================================================================= */}
      {activeTab === 'payments' && (
        <Card className="p-5">
          <CardHeader className="px-0 pt-0 pb-4">
            <div className="flex items-center justify-between w-full">
              <div>
                <CardTitle>Grand Livre des Paiements ({groupPayments.length})</CardTitle>
                <p className="text-xs text-slate-500">Traçabilité complète et reçus officiels</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRecordModalOpen(true)}
                leftIcon={<CreditCard size={14} />}
              >
                Nouveau versement
              </Button>
            </div>
          </CardHeader>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="pb-3 px-3">Réf. TxID</th>
                  <th className="pb-3 px-3">Date</th>
                  <th className="pb-3 px-3">Membre</th>
                  <th className="pb-3 px-3">Moyen</th>
                  <th className="pb-3 px-3 text-right">Montant</th>
                  <th className="pb-3 px-3 text-center">Statut</th>
                  <th className="pb-3 px-3 text-right">Preuve</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {groupPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-3 font-mono text-slate-500">{p.transactionRef}</td>
                    <td className="py-3 px-3 font-mono text-slate-500">{formatDateTime(p.date)}</td>
                    <td className="py-3 px-3 font-medium text-slate-900 dark:text-white">{p.memberName}</td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300">{p.method}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {formatFCFA(p.amount)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <Badge variant={p.status === 'paid' ? 'success' : 'warning'}>
                        {p.status === 'paid' ? 'Validé' : 'En attente'}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleViewReceipt(p)}>
                        <FileText size={14} className="text-emerald-600" /> Reçu
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: SETTINGS */}
      {/* ========================================================================= */}
      {activeTab === 'settings' && (
        <Card className="max-w-xl p-5">
          <CardHeader className="px-0 pt-0 pb-4">
            <CardTitle>Paramètres de la tontine</CardTitle>
          </CardHeader>

          <div className="space-y-4 text-xs">
            <Input label="Nom de la tontine" defaultValue={group.name} />
            <Input label="Montant par cotisation (FCFA)" type="number" defaultValue={group.contributionAmount} />
            <Input label="Commission modérateur (FCFA)" type="number" defaultValue={group.moderatorCommission} />

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div>
                <h4 className="font-bold text-rose-600 text-xs">Archiver ce groupe</h4>
                <p className="text-[11px] text-slate-400">Retirer cette tontine de la liste active</p>
              </div>

              <Button variant="danger" size="sm" onClick={handleArchive} leftIcon={<Archive size={14} />}>
                Archiver
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

      <EnrollMemberModal
        isOpen={enrollModalOpen}
        onClose={() => setEnrollModalOpen(false)}
        group={group}
      />

      <PayoutPotModal
        isOpen={payoutModalOpen}
        onClose={() => setPayoutModalOpen(false)}
        group={group}
      />

      <ReceiptModal
        isOpen={receiptModalOpen}
        onClose={() => {
          setReceiptModalOpen(false);
          setSelectedTxForReceipt(null);
        }}
        transaction={selectedTxForReceipt}
      />

      <RegularizePenaltyModal
        isOpen={regularizeModalOpen}
        onClose={() => {
          setRegularizeModalOpen(false);
          setSelectedMemberForPenalty(undefined);
        }}
        group={group}
        member={selectedMemberForPenalty}
      />
    </div>
  );
};
