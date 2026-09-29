import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { formatFCFA } from '../../utils/formatters';
import { TontineGroup, Member } from '../../types';
import { useNavigate } from 'react-router-dom';
import { requestSasPaySession, WHITE_LABEL_TEXTS } from '../../lib/saspay';
import {
  AlertTriangle,
  ShieldCheck,
  Coins,
  ArrowRight,
  Sparkles,
  Smartphone,
  CheckCircle2,
  TrendingDown,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface RegularizePenaltyModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: TontineGroup;
  member?: Member;
  onSuccess?: () => void;
}

export const RegularizePenaltyModal: React.FC<RegularizePenaltyModalProps> = ({
  isOpen,
  onClose,
  group,
  member,
  onSuccess,
}) => {
  const navigate = useNavigate();
  const { payPenaltyAndTopup, addToast } = useApp();
  const [operator, setOperator] = useState<'Orange Money' | 'MTN MoMo' | 'Wave'>('Orange Money');
  const [phoneNumber, setPhoneNumber] = useState(member?.phone || '+237 6 ');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRedirectingGateway, setIsRedirectingGateway] = useState(false);
  const [result, setResult] = useState<any>(null);

  if (!member) return null;

  const missingContribution = group.contributionAmount;
  const customPenalty = group.customPenaltyAmount || 1000;
  const totalAmount = missingContribution + customPenalty;

  const saasShare = Math.round(customPenalty * 0.5);
  const beneficiaryShare = customPenalty - saasShare;

  const currentBeneficiary =
    group.beneficiarySchedule.find((b) => b.order === group.currentDay) ||
    group.beneficiarySchedule[0];

  const handleExecutePayment = async () => {
    setIsSubmitting(true);
    try {
      const res = await payPenaltyAndTopup({
        groupId: group.id,
        memberId: member.id,
        operator,
        phoneNumber,
        notes: `Régularisation retard tour #${group.currentDay}`,
      });

      setResult(res);

      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10B981', '#F59E0B', '#3B82F6'],
        });
      } catch {
        // ignore
      }

      if (onSuccess) onSuccess();
    } catch {
      // Error handled by context toast
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOnlineGatewayCheckout = async () => {
    setIsRedirectingGateway(true);
    try {
      const orderId = `TF-PEN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const session = await requestSasPaySession({
        amount: totalAmount,
        currency: 'XOF',
        orderId,
        customerEmail: member.email || 'client@tontiflow.africa',
        customerPhone: phoneNumber,
        customerName: member.name,
        metadata: {
          groupId: group.id,
          groupName: group.name,
          memberId: member.id,
          operator,
          type: 'penalty_topup',
        },
      });

      if (session && session.checkout_url) {
        addToast(WHITE_LABEL_TEXTS.badgeSecure, 'Ouverture du guichet sécurisé...', 'info');
        onClose();
        if (session.checkout_url.startsWith('http') && !session.checkout_url.includes(window.location.host)) {
          window.location.href = session.checkout_url;
        } else {
          navigate(session.checkout_url);
        }
      }
    } catch {
      addToast('Erreur', WHITE_LABEL_TEXTS.errorMessage, 'error');
    } finally {
      setIsRedirectingGateway(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Régularisation Retard & Caution (Top-up)"
      maxWidth="md"
    >
      <div className="space-y-4 text-left text-xs">
        {result ? (
          // Success View
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 size={24} />
              </div>
              <h3 className="text-base font-extrabold text-emerald-900 dark:text-emerald-200">
                Paiement et régularisation validés !
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Le membre <strong>{result.memberName}</strong> a payé <strong>{formatFCFA(result.totalPaid)}</strong>. Son statut a été rétabli en <Badge variant="success">ACTIVE</Badge>.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 font-mono text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Caution restaurée :</span>
                <strong className="text-emerald-600">{formatFCFA(result.guaranteeBalance)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Reversé au bénéficiaire ({result.beneficiaryName}) :</span>
                <strong className="text-emerald-600">{formatFCFA(result.beneficiaryPenaltyShare)} (50%)</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Revenus SaaS conservés :</span>
                <strong className="text-amber-600">{formatFCFA(result.saasPenaltyShare)} (50%)</strong>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-800">
                <span className="text-slate-500">Réf. Reçu officiel :</span>
                <span className="text-slate-800 dark:text-slate-200">{result.receiptNumber}</span>
              </div>
            </div>

            <Button variant="emerald" size="md" className="w-full" onClick={handleClose}>
              Fermer et actualiser
            </Button>
          </div>
        ) : (
          // Form View
          <>
            {/* Member & Status alert */}
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar name={member.name} size="md" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    {member.name}
                  </h4>
                  <p className="text-[10px] text-slate-500 font-mono">
                    {member.phone} · Tontine {group.name}
                  </p>
                </div>
              </div>

              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30">
                GUARANTEE_DEPLETED
              </span>
            </div>

            {/* Financial breakdown table */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block pb-1 border-b border-slate-200 dark:border-slate-800">
                Décomposition du montant exigé pour régularisation
              </span>

              <div className="flex justify-between items-center">
                <div>
                  <span className="text-slate-700 dark:text-slate-300 font-medium">1. Cotisation manquante (Top-up caution) :</span>
                  <span className="text-[10px] text-slate-400 block">Réapprovisionne la garantie du membre</span>
                </div>
                <strong className="font-mono text-slate-900 dark:text-white">
                  {formatFCFA(missingContribution)}
                </strong>
              </div>

              <div className="flex justify-between items-center text-amber-700 dark:text-amber-400">
                <div>
                  <span className="font-medium">2. Pénalité de retard forfaitaire :</span>
                  <span className="text-[10px] text-amber-600/70 dark:text-amber-400/70 block">Définie par l'admin du groupe</span>
                </div>
                <strong className="font-mono">
                  +{formatFCFA(customPenalty)}
                </strong>
              </div>

              {/* 50/50 Sub-breakdown */}
              <div className="p-2.5 rounded-lg bg-amber-500/[0.07] border border-amber-500/20 text-[11px] space-y-1">
                <span className="font-bold text-amber-800 dark:text-amber-300 block">
                  Ventilation automatique de la pénalité (50/50) :
                </span>
                <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-mono">
                  <span>&bull; Reversé au bénéficiaire lésé ({currentBeneficiary?.memberName.split(' ')[0] || 'Bénéficiaire'}) (50%) :</span>
                  <strong>{formatFCFA(beneficiaryShare)}</strong>
                </div>
                <div className="flex justify-between text-amber-800 dark:text-amber-400 font-mono">
                  <span>&bull; Frais de gestion plateforme SaaS (50%) :</span>
                  <strong>{formatFCFA(saasShare)}</strong>
                </div>
              </div>

              {/* Total required */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-sm font-bold bg-emerald-500/10 -mx-3.5 -mb-3.5 p-3 rounded-b-xl border-t-emerald-500/30">
                <div>
                  <span className="text-slate-900 dark:text-white block">Total à encaisser :</span>
                  <span className="text-[10px] text-emerald-600 font-normal">
                    Statut rétabli en ACTIVE dès validation
                  </span>
                </div>
                <span className="font-mono text-xl font-black text-emerald-600 dark:text-emerald-400">
                  {formatFCFA(totalAmount)}
                </span>
              </div>
            </div>

            {/* Payment provider selector */}
            <div className="space-y-1.5 pt-1">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Smartphone size={13} className="text-emerald-500" />
                Moyen de paiement Mobile Money :
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Orange Money', 'MTN MoMo', 'Wave'] as const).map((op) => (
                  <button
                    key={op}
                    type="button"
                    onClick={() => setOperator(op)}
                    className={`p-2 rounded-xl border text-center font-bold text-xs cursor-pointer transition-all ${
                      operator === op
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {op}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 flex flex-col sm:flex-row items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
              <Button variant="outline" size="sm" onClick={handleClose} disabled={isSubmitting || isRedirectingGateway} className="w-full sm:w-auto">
                Annuler
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExecutePayment}
                isLoading={isSubmitting}
                disabled={isRedirectingGateway}
                leftIcon={<RefreshCw size={14} />}
                className="w-full sm:w-auto text-xs"
              >
                Validation Rapide
              </Button>
              <Button
                variant="emerald"
                size="md"
                onClick={handleOnlineGatewayCheckout}
                isLoading={isRedirectingGateway}
                disabled={isSubmitting}
                rightIcon={<ExternalLink size={15} />}
                className="w-full sm:flex-1 text-xs font-bold"
              >
                {WHITE_LABEL_TEXTS.buttonLabel} ({formatFCFA(totalAmount)})
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};
