import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { useApp } from '../../context/AppContext';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { formatFCFA } from '../../utils/formatters';
import { CheckCircle2, ShieldCheck, Smartphone } from 'lucide-react';
import { TontineGroup } from '../../types';

interface MemberPayModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: TontineGroup;
}

export const MemberPayModal: React.FC<MemberPayModalProps> = ({
  isOpen,
  onClose,
  group,
}) => {
  const { currentUser, recordPayment, addToast } = useApp();
  const [operator, setOperator] = useState<'MTN MoMo' | 'Orange Money' | 'Wave'>('MTN MoMo');
  const [phone, setPhone] = useState(currentUser.phone || '+237 6 75 12 34 56');
  const [step, setStep] = useState<'form' | 'processing' | 'success'>('form');

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('processing');

    setTimeout(() => {
      // Record payment
      recordPayment({
        groupId: group.id,
        groupName: group.name,
        memberId: currentUser.id,
        memberName: currentUser.name,
        memberPhone: phone,
        amount: group.contributionAmount,
        baseAmount: group.contributionAmount - group.moderatorCommission,
        commission: group.moderatorCommission,
        date: new Date().toISOString(),
        status: 'paid',
        method: operator,
        verifiedByModerator: true,
      });

      setStep('success');

      // Trigger celebratory confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10B981', '#F97316', '#0F172A'],
        });
      } catch (err) {
        // Safe fallback
      }
    }, 1500);
  };

  const handleFinish = () => {
    setStep('form');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleFinish}
      title={step === 'success' ? 'Paiement confirmé !' : 'Cotiser à la tontine'}
      maxWidth="md"
    >
      {step === 'form' && (
        <form onSubmit={handlePay} className="space-y-4">
          {/* Summary Box */}
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-left">
            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
              {group.name}
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                {formatFCFA(group.contributionAmount)}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Tour #{group.currentDay} sur {group.totalMembersCount}
              </span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 text-left">
              Choisissez votre moyen de paiement Mobile Money
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setOperator('MTN MoMo')}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                  operator === 'MTN MoMo'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-semibold ring-2 ring-amber-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-bold text-xs">
                  MoMo
                </div>
                <span className="text-xs">MTN MoMo</span>
              </button>

              <button
                type="button"
                onClick={() => setOperator('Orange Money')}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                  operator === 'Orange Money'
                    ? 'border-orange-500 bg-orange-500/10 text-orange-700 dark:text-orange-300 font-semibold ring-2 ring-orange-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-xs">
                  OM
                </div>
                <span className="text-xs">Orange Money</span>
              </button>

              <button
                type="button"
                onClick={() => setOperator('Wave')}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                  operator === 'Wave'
                    ? 'border-sky-500 bg-sky-500/10 text-sky-700 dark:text-sky-300 font-semibold ring-2 ring-sky-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center font-bold text-xs">
                  Wave
                </div>
                <span className="text-xs">Wave</span>
              </button>
            </div>
          </div>

          <Input
            label="Numéro de téléphone du compte"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            leftIcon={<Smartphone size={16} />}
            required
            helperText="Une notification USSD de confirmation sera envoyée sur ce numéro."
          />

          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-slate-500 text-[11px]">
            <ShieldCheck size={16} className="text-emerald-500 shrink-0" />
            <span>Paiement 100% sécurisé et instantanément consigné au groupe.</span>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" variant="emerald" size="md" className="flex-1">
              Confirmer le versement ({formatFCFA(group.contributionAmount)})
            </Button>
          </div>
        </form>
      )}

      {step === 'processing' && (
        <div className="py-8 flex flex-col items-center text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
            <Smartphone className="w-6 h-6 text-emerald-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              Approbation USSD en cours...
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mt-1">
              Veuillez valider le prompt avec votre code PIN {operator} sur votre téléphone ({phone}).
            </p>
          </div>
        </div>
      )}

      {step === 'success' && (
        <div className="py-4 flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
            <CheckCircle2 size={36} />
          </div>
          <div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">
              Cotisation enregistrée avec succès !
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mt-1">
              Votre versement de <strong className="text-slate-900 dark:text-white">{formatFCFA(group.contributionAmount)}</strong> pour le groupe <strong className="text-slate-900 dark:text-white">{group.name}</strong> a bien été crédité.
            </p>
          </div>

          <div className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs font-mono text-slate-500 text-left space-y-1">
            <div className="flex justify-between">
              <span>Référence:</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">TRX-{Math.floor(100000 + Math.random() * 900000)}</span>
            </div>
            <div className="flex justify-between">
              <span>Opérateur:</span>
              <span>{operator}</span>
            </div>
            <div className="flex justify-between">
              <span>Statut:</span>
              <span className="text-emerald-600 font-semibold">Validé & Sécurisé</span>
            </div>
          </div>

          <Button variant="emerald" size="md" className="w-full" onClick={handleFinish}>
            Retour à mes tontines
          </Button>
        </div>
      )}
    </Modal>
  );
};
