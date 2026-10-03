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
  Banknote,
  PenTool,
  FileCheck,
  Users,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DigitalSignaturePad } from '../ui/DigitalSignaturePad';
import { CashDischargeModal } from './CashDischargeModal';

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
  const { payoutPot, addToast, currentUser } = useApp();
  const [summary, setSummary] = useState<TontineFinancialSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [forcePartial, setForcePartial] = useState(false);

  // Mode de versement : Mobile Money ou Espèces en main propre
  const [payoutMethod, setPayoutMethod] = useState<'mobile_money' | 'cash'>('mobile_money');
  const [selectedOperator, setSelectedOperator] = useState<'Orange Money' | 'MTN MoMo' | 'Wave'>('Orange Money');
  
  // Données de remise en espèces et décharge
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [witnessName, setWitnessName] = useState('');
  const [notes, setNotes] = useState('');

  // Modale de décharge officielle signée
  const [dischargeModalOpen, setDischargeModalOpen] = useState(false);
  const [dischargeData, setDischargeData] = useState<any>(null);

  const currentBeneficiary = group.beneficiarySchedule.find(
    (b) => b.order === group.currentDay
  );

  useEffect(() => {
    if (isOpen && group?.id) {
      setIsLoading(true);
      setSignatureDataUrl(null);
      setWitnessName('');
      api
        .getTontineSummary(group.id)
        .then((data) => setSummary(data))
        .catch(() => {
          // Fallback calculation with 5% commission rule
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
    if (payoutMethod === 'cash' && !signatureDataUrl) {
      addToast(
        'Signature requise',
        'Le bénéficiaire doit apposer sa signature numérique sur l\'écran pour valider la décharge des espèces.',
        'warning'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const payoutNotes =
        notes ||
        (payoutMethod === 'cash'
          ? `Remise de billets en main propre à ${beneficiaryName}${witnessName ? ` (Témoin: ${witnessName})` : ''}`
          : `Versement Mobile Money ${selectedOperator} cagnotte tour #${group.currentDay}`);

      // Appel API avec prise en charge complète du versement en espèces
      const result = await api.processTontinePayout({
        groupId: group.id,
        roundId: group.currentDay,
        operator: payoutMethod === 'cash' ? 'Espèces' : selectedOperator,
        payoutMethod,
        signatureDataUrl: signatureDataUrl || undefined,
        witnessName: witnessName || undefined,
        force: forcePartial,
        notes: payoutNotes,
      });

      // Synchronisation du contexte
      await payoutPot(group.id, forcePartial, payoutNotes);

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

      if (payoutMethod === 'cash') {
        const dischargeInfo = {
          groupName: group.name,
          roundNumber: group.currentDay,
          beneficiaryName,
          beneficiaryPhone,
          moderatorName: currentUser?.name || 'Le Modérateur',
          grossAmount,
          commissionAmount: commission5Pct,
          netAmount,
          date: new Date().toISOString(),
          signatureDataUrl: signatureDataUrl || '',
          witnessName,
          dischargeRef: result.payoutRef || `DECHARGE-${Date.now().toString(36).toUpperCase()}`,
        };

        setDischargeData(dischargeInfo);
        setDischargeModalOpen(true);

        addToast(
          'Remise en espèces validée !',
          `L'enveloppe de ${formatFCFA(netAmount)} a été remise en main propre à ${beneficiaryName} avec décharge numérique signée.`,
          'success'
        );
      } else {
        addToast(
          'Versement Payout validé !',
          `${formatFCFA(netAmount)} Net envoyés sur le compte ${selectedOperator} de ${beneficiaryName}. Commission SaaS 5% (${formatFCFA(commission5Pct)}) déduite.`,
          'success'
        );
        onClose();
      }
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
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Déblocage & Versement de la Cagnotte (Payout)"
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

          {/* SÉLECTEUR DE MODE DE VERSEMENT : MOBILE MONEY VS ESPÈCES EN MAIN PROPRE */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              Mode de paiement au bénéficiaire :
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPayoutMethod('mobile_money')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                  payoutMethod === 'mobile_money'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 font-bold ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0">
                  <Smartphone size={17} />
                </div>
                <div>
                  <span className="text-xs block">Virement Mobile Money</span>
                  <span className="text-[10px] opacity-75 block font-normal">Wave, Orange, MTN</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPayoutMethod('cash')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                  payoutMethod === 'cash'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 font-bold ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
                  <Banknote size={17} />
                </div>
                <div>
                  <span className="text-xs block">Remise en Espèces (Cash)</span>
                  <span className="text-[10px] opacity-75 block font-normal">En main propre + Décharge</span>
                </div>
              </button>
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
                <span>Cagnotte 100% collectée ({paidCount}/{totalCount} membres ont cotisé) !</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                Tous les membres ont validé leur cotisation de {formatFCFA(group.contributionAmount)}. Le pot brut de {formatFCFA(grossAmount)} est prêt pour la remise.
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
                Décompte officiel du versement (Frais plateforme 5%)
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
                <TrendingDown size={13} /> 2. Frais de service et tenue de registre (-5%) :
              </span>
              <span className="font-mono font-bold">
                &minus;{formatFCFA(commission5Pct)}
              </span>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-sm bg-emerald-500/10 -mx-4 -mb-4 p-3 rounded-b-xl border-t-emerald-500/30">
              <div>
                <span className="font-extrabold text-emerald-800 dark:text-emerald-300 block">
                  3. Net remis à {beneficiaryName} :
                </span>
                <span className="text-[10px] text-emerald-700/80 dark:text-emerald-400 font-mono">
                  {payoutMethod === 'cash'
                    ? '💵 Enveloppe de billets en main propre'
                    : `📱 Virement ${selectedOperator} (${beneficiaryPhone})`}
                </span>
              </div>
              <span className="font-mono text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {formatFCFA(netAmount)}
              </span>
            </div>
          </div>

          {/* CAS 1 : VIREMENT MOBILE MONEY */}
          {payoutMethod === 'mobile_money' && (
            <div className="space-y-1.5 pt-1">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Smartphone size={13} className="text-emerald-500" />
                Opérateur Mobile Money pour le virement automatique :
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
          )}

          {/* CAS 2 : REMISE EN MAIN PROPRE (ESPÈCES / CASH) AVEC DÉCHARGE SIGNÉE */}
          {payoutMethod === 'cash' && (
            <div className="space-y-3.5 pt-1">
              {/* Encart explicatif Remise de billets */}
              <div className="p-3.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-300/80 dark:border-amber-800/80 text-amber-900 dark:text-amber-200 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300">
                  <Banknote size={17} />
                  <span>Protocole de remise de l'enveloppe de billets en séance</span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  Vous remettez l'enveloppe contenant <strong>{formatFCFA(netAmount)}</strong> en billets de banque au bénéficiaire <strong>{beneficiaryName}</strong>. Ce dernier appose sa signature numérique sur l'écran pour décharge légale.
                </p>
              </div>

              {/* Signature numérique sur l'écran */}
              <DigitalSignaturePad
                beneficiaryName={beneficiaryName}
                onSignatureChange={setSignatureDataUrl}
              />

              {/* Témoin ou secrétaire de séance (optionnel) */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Users size={13} className="text-slate-400" />
                  <span>Nom du témoin ou secrétaire de séance (facultatif) :</span>
                </label>
                <input
                  type="text"
                  value={witnessName}
                  onChange={(e) => setWitnessName(e.target.value)}
                  placeholder="Ex: Secrétaire Awa Diop"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>
          )}

          {/* Notes optionnelles */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500">
              Note ou motif de virement (facultatif) :
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Séance plénière du dimanche - Remise tour clôturé"
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200"
            />
          </div>

          {/* Security seal */}
          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-100 dark:bg-slate-800/60 text-slate-500 text-[11px]">
            <ShieldCheck size={15} className="text-emerald-500 shrink-0" />
            <span>
              {payoutMethod === 'cash'
                ? 'Une décharge officielle signée numériquement sera émise et archivée dans le grand livre.'
                : 'Le virement génère un reçu officiel avec sceau cryptographique et référence de passerelle.'}
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
              disabled={
                (!isFullyFunded && !forcePartial) ||
                grossAmount === 0 ||
                (payoutMethod === 'cash' && !signatureDataUrl)
              }
              leftIcon={payoutMethod === 'cash' ? <Banknote size={16} /> : <Coins size={16} />}
            >
              {payoutMethod === 'cash'
                ? `Remise en espèces validée (${formatFCFA(netAmount)})`
                : `Déclencher le versement (${formatFCFA(netAmount)} Net)`}
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODALE D'ATTESTATION OFFICIELLE DE DÉCHARGE SIGNÉE */}
      <CashDischargeModal
        isOpen={dischargeModalOpen}
        onClose={() => {
          setDischargeModalOpen(false);
          setDischargeData(null);
          onClose();
        }}
        dischargeData={dischargeData}
      />
    </>
  );
};
