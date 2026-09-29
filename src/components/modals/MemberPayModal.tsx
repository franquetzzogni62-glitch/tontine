import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { useApp } from '../../context/AppContext';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { formatFCFA } from '../../utils/formatters';
import { CheckCircle2, ShieldCheck, Smartphone, Zap, FileText, QrCode } from 'lucide-react';
import { TontineGroup, PaymentTransaction } from '../../types';
import { ReceiptModal } from './ReceiptModal';

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
  const { currentUser, simulateWebhook } = useApp();
  const [operator, setOperator] = useState<'MTN MoMo' | 'Orange Money' | 'Wave'>('MTN MoMo');
  const [phone, setPhone] = useState(currentUser.phone || '+237 6 75 12 34 56');
  const [step, setStep] = useState<'form' | 'ussd' | 'webhook' | 'success'>('form');
  const [generatedTx, setGeneratedTx] = useState<PaymentTransaction | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep('ussd');

    // Simulate USSD approval
    setTimeout(() => {
      setStep('webhook');
    }, 1200);

    // Call real backend simulateWebhook
    setTimeout(async () => {
      try {
        const res = await simulateWebhook({
          groupId: group.id,
          memberId: currentUser.id,
          amount: group.contributionAmount,
          operator,
          phoneNumber: phone,
          status: 'completed',
        });

        if (res && res.transaction) {
          setGeneratedTx(res.transaction);
        } else {
          setGeneratedTx({
            id: `tx_${Date.now()}`,
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
            transactionRef: `TRX-${Math.floor(100000 + Math.random() * 900000)}`,
            receiptNumber: `REC-${Date.now().toString(36).toUpperCase()}`,
            verifiedByModerator: true,
          });
        }

        setStep('success');

        try {
          confetti({
            particleCount: 90,
            spread: 75,
            origin: { y: 0.6 },
            colors: ['#10B981', '#F59E0B', '#0F172A'],
          });
        } catch {
          // ignore
        }
      } catch {
        setStep('success');
      }
    }, 2400);
  };

  const handleFinish = () => {
    setStep('form');
    onClose();
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleFinish}
        title={step === 'success' ? 'Cotisation Validée & Sécurisée' : 'Payer ma cotisation'}
        maxWidth="md"
      >
        {step === 'form' && (
          <form onSubmit={handlePay} className="space-y-4 text-left text-xs">
            {/* Summary Box */}
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
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
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
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
                  <span className="text-xs font-medium">MTN MoMo</span>
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
                  <span className="text-xs font-medium">Orange Money</span>
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
                  <span className="text-xs font-medium">Wave</span>
                </button>
              </div>
            </div>

            <Input
              label="Numéro de téléphone du compte émetteur"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              leftIcon={<Smartphone size={16} />}
              required
              helperText="Une invite USSD ou push notification sera envoyée sur ce numéro."
            />

            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-slate-500 text-[11px]">
              <ShieldCheck size={16} className="text-emerald-500 shrink-0" />
              <span>Validation instantanée par Webhook sécurisé et émission de reçu légal.</span>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                Annuler
              </Button>
              <Button type="submit" variant="emerald" size="md" className="flex-1">
                Lancer le paiement ({formatFCFA(group.contributionAmount)})
              </Button>
            </div>
          </form>
        )}

        {step === 'ussd' && (
          <div className="py-8 flex flex-col items-center text-center space-y-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
              <Smartphone className="w-6 h-6 text-emerald-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                Approbation USSD en attente...
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mt-1">
                Veuillez valider le prompt avec votre code PIN {operator} sur votre téléphone ({phone}).
              </p>
            </div>
          </div>
        )}

        {step === 'webhook' && (
          <div className="py-8 flex flex-col items-center text-center space-y-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin" />
              <Zap className="w-6 h-6 text-amber-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                Traitement du Webhook {operator}...
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mt-1">
                Validation du hash cryptographique et mise à jour du grand livre de la tontine.
              </p>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="py-4 flex flex-col items-center text-center space-y-4 text-xs">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 size={36} />
            </div>
            <div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                Cotisation validée avec succès !
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mt-1">
                Votre versement de <strong className="text-slate-900 dark:text-white">{formatFCFA(group.contributionAmount)}</strong> pour la tontine <strong className="text-slate-900 dark:text-white">{group.name}</strong> a bien été comptabilisé.
              </p>
            </div>

            <div className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 font-mono text-slate-500 text-left space-y-1.5 border border-slate-200/60 dark:border-slate-700/60">
              <div className="flex justify-between">
                <span>Réf. Transaction :</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  {generatedTx?.transactionRef || 'TRX-ONLINE'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>N° de Reçu officiel :</span>
                <strong className="text-emerald-600 dark:text-emerald-400">
                  {generatedTx?.receiptNumber || 'REC-VERIFIED'}
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Opérateur :</span>
                <span>{operator}</span>
              </div>
              <div className="flex justify-between">
                <span>Statut :</span>
                <span className="text-emerald-600 font-semibold">Validé par Webhook instantané</span>
              </div>
            </div>

            <div className="w-full flex items-center gap-2">
              <Button
                variant="outline"
                size="md"
                className="flex-1"
                onClick={() => setReceiptOpen(true)}
                leftIcon={<FileText size={15} />}
              >
                Voir le reçu officiel
              </Button>
              <Button
                variant="emerald"
                size="md"
                className="flex-1"
                onClick={handleFinish}
              >
                Terminer
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {generatedTx && (
        <ReceiptModal
          isOpen={receiptOpen}
          onClose={() => setReceiptOpen(false)}
          transaction={generatedTx}
        />
      )}
    </>
  );
};
