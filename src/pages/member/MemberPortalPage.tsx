import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Avatar } from '../../components/ui/Avatar';
import { MemberPayModal } from '../../components/modals/MemberPayModal';
import { TontineGroup } from '../../types';
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
} from 'lucide-react';
import { formatFCFA, formatDate, formatDateTime } from '../../utils/formatters';

export const MemberPortalPage: React.FC = () => {
  const { currentUser, switchRole, groups, payments, theme, toggleTheme } = useApp();

  const [selectedGroupToPay, setSelectedGroupToPay] = useState<TontineGroup | null>(null);
  const [payModalOpen, setPayModalOpen] = useState(false);

  // Find groups where this user is participating
  const myGroups = groups.filter((g) =>
    g.members.some((m) => m.memberId === currentUser.id || m.memberId === 'mem_2')
  );

  // Fallback to first two active groups if newly created user
  const displayGroups = myGroups.length > 0 ? myGroups : groups.slice(0, 2);

  // Find user's turn in first group
  const primaryGroup = displayGroups[0];
  const myTurnInfo = primaryGroup?.beneficiarySchedule.find(
    (b) => b.memberId === currentUser.id || b.memberId === 'mem_2'
  );

  const myPayments = payments.filter(
    (p) => p.memberId === currentUser.id || p.memberId === 'mem_2'
  );

  const totalIContributed = myPayments
    .filter((p) => p.status === 'paid')
    .reduce((acc, p) => acc + p.amount, 0);

  const handleOpenPay = (group: TontineGroup) => {
    setSelectedGroupToPay(group);
    setPayModalOpen(true);
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
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <Award size={11} /> Score de confiance : 96%
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick role toggle */}
          <button
            onClick={() => switchRole(currentUser.role === 'moderator' ? 'member' : 'moderator')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-emerald-600 transition-colors cursor-pointer"
            title="Passer en vue modérateur"
          >
            <ArrowRightLeft size={13} className="text-emerald-500" />
            <span className="hidden sm:inline">Vue</span> Modérateur
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
        {/* Next Pot Banner (Card with big countdown & reward) */}
        {myTurnInfo && (
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
                    : myTurnInfo.order === primaryGroup.currentDay
                    ? 'Aujourd\'hui !'
                    : 'À venir'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Daily Contributions Due (Action Cards) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Mes cotisations en cours
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              {displayGroups.length} groupe{displayGroups.length > 1 ? 's' : ''}
            </span>
          </div>

          {displayGroups.map((group) => {
            const memberRecord = group.members.find(
              (m) => m.memberId === currentUser.id || m.memberId === 'mem_2'
            );
            const hasPaid = memberRecord?.hasPaidToday ?? false;

            return (
              <Card key={group.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {group.name}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Tour #{group.currentDay} / {group.totalMembersCount} · Modérateur : Mme Claire Mballa
                    </p>
                  </div>

                  <Badge variant={hasPaid ? 'success' : 'warning'}>
                    {hasPaid ? 'À jour' : 'À cotiser'}
                  </Badge>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Cotisation du jour</span>
                    <span className="font-mono text-base font-bold text-slate-900 dark:text-white">
                      {formatFCFA(group.contributionAmount)}
                    </span>
                  </div>

                  {!hasPaid ? (
                    <Button
                      variant="emerald"
                      size="sm"
                      onClick={() => handleOpenPay(group)}
                      leftIcon={<Smartphone size={15} />}
                    >
                      Payer par Mobile Money
                    </Button>
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
          })}
        </div>

        {/* Member Stats Summary */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4">
            <span className="text-xs text-slate-400 block mb-1">Total cotisé par moi</span>
            <span className="font-mono text-lg font-bold text-slate-900 dark:text-white block">
              {formatFCFA(totalIContributed || 220000)}
            </span>
            <span className="text-[10px] text-emerald-600 font-semibold mt-1 block">
              100% à l'heure
            </span>
          </Card>

          <Card className="p-4">
            <span className="text-xs text-slate-400 block mb-1">Cagnottes reçues</span>
            <span className="font-mono text-lg font-bold text-emerald-600 dark:text-emerald-400 block">
              {formatFCFA(200000)}
            </span>
            <span className="text-[10px] text-slate-400 block mt-1">
              Sur 2 cycles terminés
            </span>
          </Card>
        </div>

        {/* Payment History */}
        <Card className="p-4">
          <CardHeader className="px-0 pt-0 pb-3">
            <CardTitle>Historique de mes versements</CardTitle>
          </CardHeader>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {myPayments.slice(0, 5).map((p) => (
              <div key={p.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                    {p.groupName}
                  </h5>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {formatDateTime(p.date)} · {p.method}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-xs font-bold text-slate-900 dark:text-white block">
                    {formatFCFA(p.amount)}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-semibold">
                    Validé
                  </span>
                </div>
              </div>
            ))}
          </div>
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
    </div>
  );
};
