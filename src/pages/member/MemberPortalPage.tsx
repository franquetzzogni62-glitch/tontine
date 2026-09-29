import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Avatar } from '../../components/ui/Avatar';
import { MemberPayModal } from '../../components/modals/MemberPayModal';
import { ReceiptModal } from '../../components/modals/ReceiptModal';
import { WebhookSimulatorModal } from '../../components/modals/WebhookSimulatorModal';
import { RegularizePenaltyModal } from '../../components/modals/RegularizePenaltyModal';
import { TontineGroup, PaymentTransaction, Member } from '../../types';
import {
  Sparkles,
  Smartphone,
  Calendar,
  CreditCard,
  CheckCircle2,
  Clock,
  ArrowRightLeft,
  Sun,
  Moon,
  ChevronRight,
  TrendingUp,
  Award,
  Wallet,
  Zap,
  FileText,
  ShieldCheck,
  AlertCircle,
  Coins,
  Users2,
} from 'lucide-react';
import { formatFCFA, formatDate, formatDateTime } from '../../utils/formatters';

export const MemberPortalPage: React.FC = () => {
  const { currentUser, switchRole, groups, members, payments, theme, toggleTheme } = useApp();

  const [selectedGroupToPay, setSelectedGroupToPay] = useState<TontineGroup | null>(null);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [penaltyModalOpen, setPenaltyModalOpen] = useState(false);
  const [selectedGroupForPenalty, setSelectedGroupForPenalty] = useState<TontineGroup | null>(null);
  const [webhookModalOpen, setWebhookModalOpen] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [selectedTxForReceipt, setSelectedTxForReceipt] = useState<PaymentTransaction | null>(null);

  // Live countdown timer towards end of day / next round draw
  const [countdown, setCountdown] = useState({ hours: 4, minutes: 28, seconds: 45 });

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 23, minutes: 59, seconds: 59 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Find groups where this user is participating
  const myGroups = groups.filter((g) =>
    g.members.some((m) => m.memberId === currentUser.id || m.memberId === 'mem_2')
  );

  const displayGroups = myGroups.length > 0 ? myGroups : groups.slice(0, 2);

  // Check if it's "MY TURN" in any of the groups
  const myActivePotTurn = displayGroups.find((g) => {
    const myTurn = g.beneficiarySchedule.find(
      (b) => b.memberId === currentUser.id || b.memberId === 'mem_2'
    );
    return myTurn && myTurn.order === g.currentDay && myTurn.status !== 'completed';
  });

  const myTurnInfo = myActivePotTurn
    ? myActivePotTurn.beneficiarySchedule.find(
        (b) => b.memberId === currentUser.id || b.memberId === 'mem_2'
      )
    : displayGroups[0]?.beneficiarySchedule.find(
        (b) => b.memberId === currentUser.id || b.memberId === 'mem_2'
      );

  const primaryGroup = myActivePotTurn || displayGroups[0];

  const myPayments = payments.filter(
    (p) => p.memberId === currentUser.id || p.memberId === 'mem_2'
  );

  const currentMember = members.find((m) => m.id === currentUser.id || m.id === 'mem_2') || members[0];
  const isGuaranteeDepleted = currentMember?.status === 'GUARANTEE_DEPLETED' || (currentMember?.status as string) === 'guarantee_depleted';

  const totalIContributed = myPayments
    .filter((p) => p.status === 'paid')
    .reduce((acc, p) => acc + p.amount, 0);

  const handleOpenPay = (group: TontineGroup) => {
    setSelectedGroupToPay(group);
    setPayModalOpen(true);
  };

  const handleOpenPenalty = (group: TontineGroup) => {
    setSelectedGroupForPenalty(group);
    setPenaltyModalOpen(true);
  };

  const handleOpenReceipt = (tx: PaymentTransaction) => {
    setSelectedTxForReceipt(tx);
    setReceiptModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col pb-20">
      {/* Top Mobile-First Header */}
      <header className="sticky top-0 z-30 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/90 dark:border-slate-800 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Avatar name={currentUser.name} size="sm" />
          <div className="text-left">
            <h2 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
              {currentUser.name}
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <Award size={11} /> Score : {currentUser.trustScore || 96}%
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 font-bold border border-emerald-500/20">
                KYC Vérifié
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Webhook test quick modal */}
          <button
            onClick={() => setWebhookModalOpen(true)}
            className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-500/10 transition-colors cursor-pointer"
            title="Tester le Webhook Mobile Money"
          >
            <Zap size={16} />
          </button>

          {/* Quick role toggle */}
          <button
            onClick={() => switchRole(currentUser.role === 'moderator' ? 'member' : 'moderator')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-emerald-600 transition-colors cursor-pointer"
            title="Passer en vue administrateur"
          >
            <ArrowRightLeft size={13} className="text-emerald-500" />
            <span className="hidden sm:inline">Vue</span> Admin
          </button>

          <button
            onClick={toggleTheme}
            className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Basculer le thème"
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-xl w-full mx-auto p-4 space-y-5 text-left">
        {/* ========================================================================= */}
        {/* SPECIAL HIGHLIGHT BANNER: C'EST MON TOUR DE RECEVOIR LE POT ! */}
        {/* ========================================================================= */}
        {myActivePotTurn ? (
          <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-600 text-white shadow-xl shadow-amber-500/20 relative overflow-hidden animate-pulse">
            <div className="relative z-10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider bg-white/25 px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                  <Sparkles size={14} /> C'est Mon Tour de recevoir le pot !
                </span>
                <span className="font-mono text-xs text-white/90">
                  {myActivePotTurn.name}
                </span>
              </div>

              <div>
                <p className="text-xs text-white/90 font-medium">Montant net de votre cagnotte à encaisser :</p>
                <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight mt-0.5">
                  {formatFCFA(Math.round((myTurnInfo?.potAmount || 250000) * 0.95))}
                </div>
                <span className="text-[11px] text-emerald-100 font-mono block mt-0.5">
                  Pot brut : {formatFCFA(myTurnInfo?.potAmount || 250000)} &minus; Frais SaaS 5% ({formatFCFA(Math.round((myTurnInfo?.potAmount || 250000) * 0.05))})
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-black/20 backdrop-blur-xs text-xs space-y-1">
                <div className="flex justify-between">
                  <span>Cotisations collectées aujourd'hui :</span>
                  <strong>
                    {myActivePotTurn.members.filter((m) => m.hasPaidToday).length} / {myActivePotTurn.totalMembersCount} membres
                  </strong>
                </div>
                <div className="flex justify-between text-[11px] text-amber-100">
                  <span>Statut :</span>
                  <span>En attente de versement direct sur votre Mobile Money</span>
                </div>
              </div>
            </div>
          </div>
        ) : myTurnInfo ? (
          <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-lg shadow-emerald-600/20 relative overflow-hidden">
            <div className="relative z-10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-md backdrop-blur-xs">
                  <Sparkles size={13} /> Mon prochain ramassage
                </span>
                <span className="font-mono text-xs text-emerald-100">
                  {primaryGroup.name}
                </span>
              </div>

              <div>
                <p className="text-xs text-emerald-100">Montant total de ma cagnotte :</p>
                <div className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight mt-0.5">
                  {formatFCFA(myTurnInfo.potAmount)}
                </div>
              </div>

              <div className="pt-2 border-t border-white/20 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <Calendar size={14} className="text-emerald-200" />
                  <span>Tour #{myTurnInfo.order} · Prévu le {formatDate(myTurnInfo.scheduledDate)}</span>
                </div>
                <span className="font-bold text-emerald-200">
                  {myTurnInfo.status === 'completed'
                    ? 'Déjà encaissé'
                    : 'À venir'}
                </span>
              </div>
            </div>
          </div>
        ) : null}

        {/* ========================================================================= */}
        {/* COMPTE À REBOURS DE PROCHAINE ÉCHÉANCE */}
        {/* ========================================================================= */}
        <div className="p-4 rounded-2xl bg-slate-900 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Clock size={20} />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold block">
                Prochaine Échéance de Tirage
              </span>
              <span className="text-xs text-slate-300">
                Aujourd'hui à 18h00 · Clôture dans :
              </span>
            </div>
          </div>

          <div className="font-mono font-black text-lg text-emerald-400 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
            {String(countdown.hours).padStart(2, '0')}:{String(countdown.minutes).padStart(2, '0')}:{String(countdown.seconds).padStart(2, '0')}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* BANNER RETARD & CAUTION ÉPUISÉE SI APPLICABLE */}
        {/* ========================================================================= */}
        {isGuaranteeDepleted && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-500/30 text-rose-900 dark:text-rose-200 space-y-2.5">
            <div className="flex items-center gap-2 font-bold text-sm text-rose-700 dark:text-rose-300">
              <AlertCircle size={18} className="shrink-0" />
              <span>Votre dépôt de garantie est épuisé (Statut : Caution Épuisée)</span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              Pour débloquer vos tours et réactiver votre compte en statut <strong>ACTIVE</strong>, vous devez régulariser votre cotisation manquante majorée de la <strong>pénalité de retard</strong> fixée par l'administrateur. Les pénalités collectées sont réparties automatiquement à <strong>50% pour le bénéficiaire lésé</strong> et <strong>50% pour la plateforme SaaS</strong>.
            </p>
            <div className="pt-1 flex items-center gap-2">
              <Button
                variant="emerald"
                size="sm"
                onClick={() => handleOpenPenalty(displayGroups[0])}
                leftIcon={<ShieldCheck size={15} />}
              >
                Régulariser mon retard (Top-up & Pénalité)
              </Button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MES COTISATIONS EN COURS (Action Cards avec Bouton Payer) */}
        {/* ========================================================================= */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Mes cotisations actives
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              {displayGroups.length} groupe{displayGroups.length > 1 ? 's' : ''}
            </span>
          </div>

          {displayGroups.length === 0 ? (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <Users2 size={24} />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Aucune tontine active
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Vous n'êtes inscrit à aucune tontine pour le moment. Vous recevrez une invitation par WhatsApp ou SMS dès qu'un groupe sera lancé.
                </p>
              </div>
            </div>
          ) : (
            displayGroups.map((group) => {
              const memberRecord = group.members.find(
                (m) => m.memberId === currentUser.id || m.memberId === 'mem_2'
              );
              const hasPaid = memberRecord?.hasPaidToday ?? false;
              const isMemberDepleted = memberRecord?.status === 'GUARANTEE_DEPLETED' || isGuaranteeDepleted;

              return (
                <Card key={group.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {group.name}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Tour #{group.currentDay} / {group.totalMembersCount} · {group.type === 'rotative' ? 'Rotative Fixe' : group.type}
                      </p>
                    </div>

                    <Badge variant={hasPaid ? 'success' : isMemberDepleted ? 'danger' : 'warning'}>
                      {hasPaid ? 'À jour' : isMemberDepleted ? 'Caution épuisée' : 'Cotisation due'}
                    </Badge>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-slate-400 block">Montant du versement</span>
                      <span className="font-mono text-base font-bold text-slate-900 dark:text-white">
                        {formatFCFA(group.contributionAmount)}
                      </span>
                    </div>

                    {!hasPaid ? (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="emerald"
                          size="sm"
                          onClick={() => handleOpenPay(group)}
                          leftIcon={<Smartphone size={15} />}
                        >
                          Payer
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-amber-700 dark:text-amber-300 border-amber-500/40 text-[11px]"
                          onClick={() => handleOpenPenalty(group)}
                          title="Régulariser avec pénalité 50/50"
                        >
                          Pénalité ({formatFCFA(group.customPenaltyAmount || 1000)})
                        </Button>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                        <CheckCircle2 size={16} /> Versement validé
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <ProgressBar
                      value={group.currentDay}
                      max={group.totalMembersCount}
                      showLabel
                      label="Avancement du cycle"
                      size="sm"
                    />
                  </div>
                </Card>
              );
            })
          )}
        </div>

        {/* Member Stats Summary */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4">
            <span className="text-xs text-slate-400 block mb-1">Total cotisé par moi</span>
            <span className="font-mono text-lg font-bold text-slate-900 dark:text-white block">
              {formatFCFA(totalIContributed || 220000)}
            </span>
            <span className="text-[10px] text-emerald-600 font-semibold mt-1 block">
              Score de ponctualité : 98%
            </span>
          </Card>

          <Card className="p-4">
            <span className="text-xs text-slate-400 block mb-1">Cagnottes encaissées</span>
            <span className="font-mono text-lg font-bold text-emerald-600 dark:text-emerald-400 block">
              {formatFCFA(200000)}
            </span>
            <span className="text-[10px] text-slate-400 block mt-1">
              Sur 2 cycles terminés
            </span>
          </Card>
        </div>

        {/* Payment History & Receipts */}
        <Card className="p-4">
          <CardHeader className="px-0 pt-0 pb-3">
            <div className="flex items-center justify-between w-full">
              <CardTitle>Historique des versements & Reçus</CardTitle>
              <span className="text-xs text-slate-400">{myPayments.length} transactions</span>
            </div>
          </CardHeader>

          {myPayments.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-400">
              Aucun versement effectué pour le moment. Vos reçus numériques apparaîtront ici.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {myPayments.slice(0, 6).map((p) => (
                <div key={p.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                      {p.groupName}
                    </h5>
                    <p className="text-[11px] text-slate-400 font-mono">
                      {formatDateTime(p.date)} · {p.method}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <span className="font-mono text-xs font-bold text-slate-900 dark:text-white block">
                        {formatFCFA(p.amount)}
                      </span>
                      <span className="text-[10px] text-emerald-600 font-semibold">
                        Validé
                      </span>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenReceipt(p)}
                      title="Voir le reçu de paiement"
                    >
                      <FileText size={14} className="text-emerald-600" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </main>

      {/* Pay Modal */}
      {selectedGroupToPay && (
        <MemberPayModal
          isOpen={payModalOpen}
          onClose={() => setPayModalOpen(false)}
          group={selectedGroupToPay}
        />
      )}

      {/* Webhook simulator */}
      <WebhookSimulatorModal
        isOpen={webhookModalOpen}
        onClose={() => setWebhookModalOpen(false)}
        defaultGroupId={primaryGroup?.id}
      />

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={receiptModalOpen}
        onClose={() => {
          setReceiptModalOpen(false);
          setSelectedTxForReceipt(null);
        }}
        transaction={selectedTxForReceipt}
      />

      {/* Regularize Penalty Modal */}
      {selectedGroupForPenalty && (
        <RegularizePenaltyModal
          isOpen={penaltyModalOpen}
          onClose={() => {
            setPenaltyModalOpen(false);
            setSelectedGroupForPenalty(null);
          }}
          group={selectedGroupForPenalty}
          member={currentMember}
        />
      )}
    </div>
  );
};
