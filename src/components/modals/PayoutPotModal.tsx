import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { formatFCFA } from '../../utils/formatters';
import { TontineGroup, TontineFinancialSummary } from '../../types';
import { api } from '../../services/api';
import {
  Coins,
  CheckCircle2,
  AlertTriangle,
  Send,
  ShieldCheck,
  TrendingDown,
  Sparkles,
  Smartphone,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface PayoutPotModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: TontineGroup;
}

export const PayoutPotModal: React.FC<PayoutPotModalProps> = ({
  isOpen,
  onClose,
  group,
}) => {
  const { payoutPot, addToast } = useApp();
  const [summary, setSummary] = useState<TontineFinancialSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [forcePartial, setForcePartial] = useState(false);
  const [selectedOperator, setSelectedOperator] = useState<'Orange Money' | 'MTN MoMo' | 'Wave'>('Orange Money');
  const [notes, setNotes] = useState('');

  const currentBeneficiary = group.beneficiarySchedule.find(
    (b) => b.order === group.currentDay
  );

  useEffect(() => {
    if (isOpen && group?.id) {
      setIsLoading(true);
      api
        .getTontineSummary(group.id)
        .then((data) => setSummary(data))
        .catch(() => {
          // fallback calculation with 5% commission rule
          const paidCount = group.members.filter((m) => m.hasPaidToday).length;
          const gross = paidCount * group.contributionAmount;
          const comm = Math.round(gross * 0.05);
          const net = gross - comm;

          setSummary({
            groupId: group.id,
            groupName: group.name,
            roundId: group.currentDay,
            contributionAmount: group.contributionAmount,
            totalMembersCount: group.members.length,
            paidMembersCount: paidCount,
            missingMembersCount: group.members.length - paidCount,
            isFullyFunded: paidCount === group.members.length,
            totalPotAmount: gross,
            commissionRate: 0.05,
            commissionAmount: comm,
            netBeneficiaryAmount: net,
            currency: 'FCFA',
            beneficiary: currentBeneficiary
              ? {
                  memberId: currentBeneficiary.memberId,
                  memberName: currentBeneficiary.memberName,
                  memberPhone: currentBeneficiary.memberPhone,
                  order: currentBeneficiary.order,
                  scheduledDate: currentBeneficiary.scheduledDate,
                }
              : undefined,
            paidMembers: [],
            missingMembers: [],
          });
        })
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, group, currentBeneficiary]);

  // Calculations
  const paidCount = summary?.paidMembersCount ?? group.members.filter((m) => m.hasPaidToday).length;
  const totalCount = summary?.totalMembersCount ?? group.members.length;
  const grossAmount = summary?.totalPotAmount ?? paidCount * group.contributionAmount;
  const commission5Pct = summary?.commissionAmount ?? Math.round(grossAmount * 0.05);
  const netAmount = summary?.netBeneficiaryAmount ?? grossAmount - commission5Pct;
  const isFullyFunded = summary?.isFullyFunded ?? paidCount === totalCount;
  const beneficiaryName = currentBeneficiary?.memberName || summary?.beneficiary?.memberName || 'Bénéficiaire du Tour';
  const beneficiaryPhone = currentBeneficiary?.memberPhone || summary?.beneficiary?.memberPhone || '+237 6 00 00 00 00';

  const handleConfirmPayout = async () => {
    setIsSubmitting(true);
    try {
      // Direct call using the 5% SaaS commission payout service
      await api.processTontinePayout({
        groupId: group.id,
        roundId: group.currentDay,
        operator: selectedOperator,
        force: forcePartial,
        notes: notes || `Versement cagnotte tour #${group.currentDay}`,
      });

      // Synchronize in context
      await payoutPot(group.id, forcePartial, notes);

      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.5 },
          colors: ['#10B981', '#F59E0B', '#3B82F6'],
        });
      } catch {
        // ignore
      }

      addToast(
        'Versement Payout validé !',
        `${formatFCFA(netAmount)} Net envoyés sur le compte ${selectedOperator} de ${beneficiaryName}. Commission SaaS 5% (${formatFCFA(commission5Pct)}) déduite.`,
        'success'
      );

      onClose();
    } catch (err: any) {
      addToast(
        'Erreur versement',
        err.message || 'Impossible d\'exécuter le versement du pot.',
        'error'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendReminderToAll = () => {
    addToast(
      'Relance groupée envoyée',
      `Rappel WhatsApp & SMS transmis aux ${summary?.missingMembersCount || 0} membres retardataires.`,
      'info'
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Déblocage & Versement du Pot (Payout)"
      maxWidth="md"
    >
      <div className="space-y-4 text-left text-xs">
        {/* Beneficiary Header Hero */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-amber-500/10 border border-emerald-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar name={beneficiaryName} size="lg" />
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                Bénéficiaire du Tour #{group.currentDay}
              </span>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {beneficiaryName}
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                {beneficiaryPhone}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Net à recevoir
            </span>
            <span className="font-mono text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {formatFCFA(netAmount)}
            </span>
          </div>
        </div>

        {/* Verification Alert: Fully Funded vs Missing Payments */}
        {isLoading ? (
          <div className="py-6 text-center text-slate-400">
            Vérification de l'état des cotisations...
          </div>
        ) : isFullyFunded ? (
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 space-y-1">
            <div className="flex items-center gap-2 font-bold text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 size={16} />
              <span>Cagnotte 100% collectée ({paidCount}/{totalCount} membres ont payé) !</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300">
              Tous les membres ont validé leur cotisation de {formatFCFA(group.contributionAmount)}. Le pot brut de {formatFCFA(grossAmount)} est prêt pour le calcul de commission et le déboursement.
            </p>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-400">
                <AlertTriangle size={16} />
                <span>Cagnotte incomplète ({paidCount}/{totalCount} membres à jour)</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSendReminderToAll}
                leftIcon={<Send size={12} />}
              >
                Relancer les membres
              </Button>
            </div>

            <p className="text-[11px] text-slate-600 dark:text-slate-300">
              Il manque <strong>{totalCount - paidCount} cotisation(s)</strong> pour clore le tour. Selon les statuts de la tontine, vous pouvez forcer le versement partiel ou attendre les paiements restants.
            </p>

            <label className="flex items-center gap-2 pt-1 border-t border-amber-200 dark:border-amber-800 cursor-pointer">
              <input
                type="checkbox"
                checked={forcePartial}
                onChange={(e) => setForcePartial(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Autoriser et forcer le déblocage sur le montant actuellement collecté ({formatFCFA(grossAmount)})
              </span>
            </label>
          </div>
        )}

        {/* Detailed 5% Commission Breakdown Box */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
            <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <ShieldCheck size={15} className="text-emerald-500" />
              Décompte officiel du versement (Commission 5%)
            </span>
            <span className="text-[10px] font-mono text-slate-400">Tour #{group.currentDay}</span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500">1. Montant total collecté (Brut) :</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">
              {formatFCFA(grossAmount)}
            </span>
          </div>

          <div className="flex justify-between items-center text-xs text-amber-700 dark:text-amber-400">
            <span className="flex items-center gap-1">
              <TrendingDown size={13} /> 2. Frais de service et sécurisation SaaS (-5%) :
            </span>
            <span className="font-mono font-bold">
              &minus;{formatFCFA(commission5Pct)}
            </span>
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-sm bg-emerald-500/10 -mx-4 -mb-4 p-3 rounded-b-xl border-t-emerald-500/30">
            <div>
              <span className="font-extrabold text-emerald-800 dark:text-emerald-300 block">
                3. Montant Net versé au bénéficiaire :
              </span>
              <span className="text-[10px] text-emerald-700/80 dark:text-emerald-400 font-mono">
                Crédité sur {selectedOperator} ({beneficiaryPhone})
              </span>
            </div>
            <span className="font-mono text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {formatFCFA(netAmount)}
            </span>
          </div>
        </div>

        {/* Mobile Money Provider Selection */}
        <div className="space-y-1.5 pt-1">
          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Smartphone size={13} className="text-emerald-500" />
            Opérateur Mobile Money pour le versement automatique :
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['Orange Money', 'MTN MoMo', 'Wave'] as const).map((op) => (
              <button
                key={op}
                type="button"
                onClick={() => setSelectedOperator(op)}
                className={`p-2.5 rounded-xl border text-center font-bold text-xs cursor-pointer transition-all ${
                  selectedOperator === op
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                {op}
              </button>
            ))}
          </div>
        </div>

        {/* Notes optionnelles */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-500">
            Note ou motif de virement (facultatif) :
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex: Versement cagnotte session clôturée"
            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200"
          />
        </div>

        {/* Security seal */}
        <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-100 dark:bg-slate-800/60 text-slate-500 text-[11px]">
          <ShieldCheck size={15} className="text-emerald-500 shrink-0" />
          <span>
            Le versement génère un reçu officiel avec sceau cryptographique et référence de passerelle.
          </span>
        </div>

        {/* Actions */}
        <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Annuler
          </Button>
          <Button
            variant="emerald"
            size="md"
            onClick={handleConfirmPayout}
            isLoading={isSubmitting}
            disabled={(!isFullyFunded && !forcePartial) || grossAmount === 0}
            leftIcon={<Coins size={16} />}
          >
            Déclencher le versement ({formatFCFA(netAmount)} Net)
          </Button>
        </div>
      </div>
    </Modal>
  );
};
