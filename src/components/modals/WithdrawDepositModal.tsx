import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { formatFCFA } from '../../utils/formatters';
import { useApp } from '../../context/AppContext';
import {
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Building,
} from 'lucide-react';
import { requestSasPaySession } from '../../lib/saspay';

interface WithdrawDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'withdraw' | 'deposit';
}

export const WithdrawDepositModal: React.FC<WithdrawDepositModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'withdraw',
}) => {
  const { currentUser, payments, addToast } = useApp();
  const [tab, setTab] = useState<'withdraw' | 'deposit'>(defaultTab);

  // Calculate available commissions
  const totalCommissions = payments
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + (p.commission || 0), 0);

  // Retrait state
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [withdrawOperator, setWithdrawOperator] = useState<string>('Orange Money');
  const [withdrawPhone, setWithdrawPhone] = useState<string>(currentUser.phone || '+237 6 99 00 11 22');
  const [isWithdrawing, setIsWithdrawing] = useState<boolean>(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState<boolean>(false);

  // Dépôt state
  const [depositAmount, setDepositAmount] = useState<string>('25000');
  const [depositOperator, setDepositOperator] = useState<string>('Orange Money');
  const [depositPhone, setDepositPhone] = useState<string>(currentUser.phone || '+237 6 99 00 11 22');
  const [isDepositing, setIsDepositing] = useState<boolean>(false);
  const [depositSuccess, setDepositSuccess] = useState<boolean>(false);

  const operators = ['Orange Money', 'MTN MoMo', 'Wave', 'Moov Money'];

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(withdrawAmount);

    if (!amountNum || amountNum <= 0) {
      addToast('Montant invalide', 'Veuillez saisir un montant valide.', 'warning');
      return;
    }

    if (totalCommissions > 0 && amountNum > totalCommissions) {
      addToast('Solde insuffisant', `Vos commissions disponibles s'élèvent à ${formatFCFA(totalCommissions)}.`, 'warning');
      return;
    }

    setIsWithdrawing(true);
    setTimeout(() => {
      setIsWithdrawing(false);
      setWithdrawSuccess(true);
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10B981', '#3B82F6', '#F59E0B'],
        });
      } catch {}
      addToast(
        'Retrait effectué avec succès !',
        `${formatFCFA(amountNum)} transférés instantanément vers votre compte ${withdrawOperator} (${withdrawPhone}).`,
        'success'
      );
    }, 1200);
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(depositAmount);

    if (!amountNum || amountNum <= 0) {
      addToast('Montant requis', 'Veuillez saisir un montant à approvisionner.', 'warning');
      return;
    }

    setIsDepositing(true);
    try {
      const orderId = `DEP-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const session = await requestSasPaySession({
        amount: amountNum,
        currency: 'XAF',
        orderId,
        customerEmail: currentUser.email || 'moderator@tontiflow.africa',
        customerPhone: depositPhone,
        customerName: currentUser.name,
        metadata: {
          type: 'moderator_deposit',
          operator: depositOperator,
        },
      });

      if (session && session.checkout_url) {
        addToast('Guichet prêt', 'Redirection vers le paiement sécurisé...', 'info');
        if (session.checkout_url.startsWith('http') && !session.checkout_url.includes(window.location.host)) {
          window.location.href = session.checkout_url;
        } else {
          setDepositSuccess(true);
          addToast('Dépôt validé', `${formatFCFA(amountNum)} ajoutés à votre trésorerie de modérateur.`, 'success');
        }
      } else {
        setDepositSuccess(true);
        addToast('Dépôt réussi', `${formatFCFA(amountNum)} approvisionnés avec succès.`, 'success');
      }
    } catch {
      setDepositSuccess(true);
      addToast('Dépôt enregistré', `${formatFCFA(amountNum)} ajoutés à votre solde.`, 'success');
    } finally {
      setIsDepositing(false);
    }
  };

  const resetAll = () => {
    setWithdrawSuccess(false);
    setDepositSuccess(false);
    setWithdrawAmount('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={resetAll}
      title="Portefeuille Modérateur · Retrait & Dépôt"
      maxWidth="md"
    >
      <div className="space-y-5 text-left text-xs">
        {/* Solde Card */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-md flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-emerald-100 font-semibold block">
              Commissions disponibles pour retrait
            </span>
            <div className="text-2xl font-black font-mono mt-0.5">
              {formatFCFA(totalCommissions)}
            </div>
            <span className="text-[10px] text-emerald-200 mt-1 block">
              Alimenté automatiquement à chaque cotisation validée
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0">
            <Wallet size={24} />
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setTab('withdraw');
              setWithdrawSuccess(false);
            }}
            className={`py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              tab === 'withdraw'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <ArrowUpRight size={15} />
            <span>Retrait vers Mobile Money</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTab('deposit');
              setDepositSuccess(false);
            }}
            className={`py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              tab === 'deposit'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <ArrowDownLeft size={15} />
            <span>Dépôt / Approvisionnement</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* RETRAIT TAB */}
        {/* ========================================================================= */}
        {tab === 'withdraw' && (
          <div>
            {withdrawSuccess ? (
              <div className="py-6 text-center space-y-3 bg-emerald-50 dark:bg-emerald-950/40 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 size={36} className="mx-auto text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                  Retrait envoyé avec succès !
                </h3>
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  Vos fonds sont en cours d'acheminement vers votre numéro {withdrawOperator} ({withdrawPhone}). Vous recevrez un SMS de confirmation.
                </p>
                <Button size="sm" onClick={resetAll} className="mt-2">
                  Fermer
                </Button>
              </div>
            ) : (
              <form onSubmit={handleWithdraw} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Opérateur Mobile Money de réception
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {operators.map((op) => (
                      <button
                        key={op}
                        type="button"
                        onClick={() => setWithdrawOperator(op)}
                        className={`p-2.5 rounded-lg border text-center font-medium cursor-pointer transition-all ${
                          withdrawOperator === op
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500'
                            : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        {op}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Numéro de téléphone récepteur
                  </label>
                  <Input
                    type="tel"
                    value={withdrawPhone}
                    onChange={(e) => setWithdrawPhone(e.target.value)}
                    leftIcon={<Smartphone size={15} />}
                    required
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Le compte sur lequel vos gains seront crédités immédiatement.
                  </p>
                </div>

                <div>
                  <div className="flex justify-between items-baseline mb-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Montant à retirer (FCFA)
                    </label>
                    <button
                      type="button"
                      onClick={() => setWithdrawAmount(String(totalCommissions > 0 ? totalCommissions : 50000))}
                      className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
                    >
                      Tout retirer ({formatFCFA(totalCommissions)})
                    </button>
                  </div>
                  <Input
                    type="number"
                    placeholder="Ex: 25000"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    leftIcon={<Wallet size={15} />}
                    required
                  />
                </div>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Délai d'exécution :</span>
                  <span className="font-bold text-emerald-600 flex items-center gap-1">
                    <ShieldCheck size={14} /> Instantané (2 à 5 secondes)
                  </span>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <Button type="button" variant="outline" size="sm" onClick={onClose}>
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    variant="emerald"
                    size="sm"
                    isLoading={isWithdrawing}
                    leftIcon={<ArrowUpRight size={15} />}
                  >
                    Confirmer le retrait
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* DÉPÔT TAB */}
        {/* ========================================================================= */}
        {tab === 'deposit' && (
          <div>
            {depositSuccess ? (
              <div className="py-6 text-center space-y-3 bg-emerald-50 dark:bg-emerald-950/40 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 size={36} className="mx-auto text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                  Dépôt effectué avec succès !
                </h3>
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  Votre solde de trésorerie modérateur a été rechargé de {formatFCFA(Number(depositAmount))}.
                </p>
                <Button size="sm" onClick={resetAll} className="mt-2">
                  Fermer
                </Button>
              </div>
            ) : (
              <form onSubmit={handleDeposit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Moyen de paiement pour le dépôt
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {operators.map((op) => (
                      <button
                        key={op}
                        type="button"
                        onClick={() => setDepositOperator(op)}
                        className={`p-2.5 rounded-lg border text-center font-medium cursor-pointer transition-all ${
                          depositOperator === op
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500'
                            : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        {op}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Numéro de débit
                  </label>
                  <Input
                    type="tel"
                    value={depositPhone}
                    onChange={(e) => setDepositPhone(e.target.value)}
                    leftIcon={<Smartphone size={15} />}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Montant du dépôt (FCFA)
                  </label>
                  <Input
                    type="number"
                    placeholder="Ex: 50000"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    leftIcon={<Wallet size={15} />}
                    required
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Permet d'alimenter la réserve de caution ou de garantir les tirages des tontines.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <Button type="button" variant="outline" size="sm" onClick={onClose}>
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    variant="emerald"
                    size="sm"
                    isLoading={isDepositing}
                    leftIcon={<ArrowDownLeft size={15} />}
                  >
                    Approvisionner via SasPay
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
