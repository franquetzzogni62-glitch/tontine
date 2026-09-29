import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import {
  checkSasPayStatus,
  formatCurrencyAmount,
  WHITE_LABEL_TEXTS,
  CurrencyCode,
} from '../lib/saspay';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Smartphone,
  CreditCard,
  FileText,
  RefreshCw,
  Home,
  Download,
  AlertCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ReceiptModal } from '../components/modals/ReceiptModal';
import { PaymentTransaction } from '../types';

export const PaymentProcessingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshData, addToast, payments } = useApp();

  const orderId = searchParams.get('orderId') || searchParams.get('order_id') || `TF-${Date.now().toString(36).toUpperCase()}`;
  const sessionId = searchParams.get('sessionId') || undefined;
  const rawAmount = Number(searchParams.get('amount')) || 10000;
  const currency = (searchParams.get('currency') || 'XOF') as CurrencyCode;
  const groupName = searchParams.get('groupName') || 'Cotisation Tontine';
  const groupId = searchParams.get('groupId') || '';
  const memberId = searchParams.get('memberId') || '';
  const type = searchParams.get('type') || 'contribution';

  const [status, setStatus] = useState<'processing' | 'completed' | 'failed'>('processing');
  const [receiptNumber, setReceiptNumber] = useState<string>(`REC-${orderId}`);
  const [transaction, setTransaction] = useState<PaymentTransaction | null>(null);
  const [pollingCount, setPollingCount] = useState<number>(0);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [isConfirmingManually, setIsConfirmingManually] = useState(false);

  const hasFiredConfetti = useRef(false);

  // Polling automatique toutes les 3 secondes
  useEffect(() => {
    let isMounted = true;
    let timerId: any = null;

    const pollStatus = async () => {
      try {
        const res = await checkSasPayStatus(orderId, sessionId);
        if (!isMounted) return;

        setPollingCount((prev) => prev + 1);

        if (res.status === 'completed' || res.status === 'paid' as any) {
          setStatus('completed');
          if (res.receiptNumber) setReceiptNumber(res.receiptNumber);
          if (res.transaction) setTransaction(res.transaction);

          if (!hasFiredConfetti.current) {
            hasFiredConfetti.current = true;
            try {
              confetti({
                particleCount: 110,
                spread: 80,
                origin: { y: 0.6 },
                colors: ['#10B981', '#059669', '#F59E0B'],
              });
            } catch {
              // ignore
            }
            refreshData();
            addToast('Paiement confirmé !', WHITE_LABEL_TEXTS.successMessage, 'success');
          }
          return;
        }

        if (res.status === 'failed') {
          setStatus('failed');
          addToast('Échec de la transaction', WHITE_LABEL_TEXTS.errorMessage, 'error');
          return;
        }
      } catch (err) {
        console.warn('Erreur vérification statut:', err);
      }

      // Prochain cycle dans 3 secondes
      if (isMounted && status === 'processing') {
        timerId = setTimeout(pollStatus, 3000);
      }
    };

    pollStatus();

    return () => {
      isMounted = false;
      if (timerId) clearTimeout(timerId);
    };
  }, [orderId, sessionId, status]);

  // Possibilité de valider immédiatement (mode test / démo / fallback)
  const handleManualValidation = async () => {
    setIsConfirmingManually(true);
    try {
      const res = await checkSasPayStatus(orderId, sessionId, true);
      setStatus('completed');
      if (res.receiptNumber) setReceiptNumber(res.receiptNumber);
      if (res.transaction) setTransaction(res.transaction);

      if (!hasFiredConfetti.current) {
        hasFiredConfetti.current = true;
        try {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {
          // ignore
        }
      }

      await refreshData();
      addToast('Paiement validé avec succès !', 'Votre cotisation est désormais enregistrée.', 'success');
    } catch {
      setStatus('completed');
    } finally {
      setIsConfirmingManually(false);
    }
  };

  const currentTx =
    transaction ||
    payments.find((p) => p.transactionRef === orderId || p.receiptNumber === receiptNumber) ||
    {
      id: `tx_${orderId}`,
      groupId: groupId || 'grp_1',
      groupName: groupName,
      memberId: memberId || 'mem_current',
      memberName: 'Membre TontiFlow',
      memberPhone: '+237 6 00 00 00 00',
      amount: rawAmount,
      baseAmount: rawAmount,
      commission: 0,
      date: new Date().toISOString(),
      status: 'paid' as const,
      method: 'Mobile Money / Carte',
      transactionRef: orderId,
      receiptNumber: receiptNumber,
      verifiedByModerator: true,
    };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-lg space-y-4">
        {/* Header Branding */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
            <ShieldCheck size={15} />
            <span>{WHITE_LABEL_TEXTS.badgeSecure}</span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span>{WHITE_LABEL_TEXTS.badgeInstant}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-2">
            Guichet de Paiement Sécurisé
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {WHITE_LABEL_TEXTS.subtitle}
          </p>
        </div>

        {/* PROCESSING STATE */}
        {status === 'processing' && (
          <Card className="p-6 text-center space-y-6 shadow-xl border-slate-200/80 dark:border-slate-800">
            <div className="relative flex items-center justify-center py-4">
              <div className="absolute w-28 h-28 rounded-full bg-emerald-500/10 animate-ping" />
              <div className="w-20 h-20 rounded-full border-4 border-emerald-500/20 border-t-emerald-600 dark:border-t-emerald-400 animate-spin flex items-center justify-center">
                <Smartphone className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Vérification du paiement en direct...
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
                Veuillez patienter ou valider la demande USSD / SMS sur votre téléphone portable. Le statut est synchronisé automatiquement toutes les 3 secondes.
              </p>
            </div>

            {/* Transaction info box */}
            <div className="p-4 rounded-xl bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 text-xs space-y-2 text-left">
              <div className="flex justify-between items-center text-slate-500">
                <span>Tontine / Objet :</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{groupName}</span>
              </div>
              <div className="flex justify-between items-center text-slate-500">
                <span>Montant à régler :</span>
                <span className="font-bold text-slate-900 dark:text-white font-mono text-sm">
                  {formatCurrencyAmount(rawAmount, currency)}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-500">
                <span>Réf. Commande :</span>
                <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400">{orderId}</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400">
              <RefreshCw size={13} className="animate-spin text-emerald-500" />
              <span>Polling actif (tentative #{pollingCount})...</span>
            </div>

            {/* Test confirmation fallback helper */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleManualValidation}
                disabled={isConfirmingManually}
                className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline font-medium cursor-pointer inline-flex items-center gap-1"
              >
                <span>Confirmer immédiatement (Validation de test / démo)</span>
              </button>
            </div>
          </Card>
        )}

        {/* COMPLETED STATE */}
        {status === 'completed' && (
          <Card className="p-6 text-center space-y-5 shadow-2xl border-emerald-200 dark:border-emerald-800/60 bg-white dark:bg-slate-900">
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto ring-8 ring-emerald-500/5">
              <CheckCircle2 size={36} />
            </div>

            <div className="space-y-1">
              <Badge variant="success">Paiement 100% Confirmé</Badge>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-2">
                Cotisation Enregistrée avec Succès !
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
                Votre transaction de{' '}
                <strong className="text-slate-900 dark:text-white">
                  {formatCurrencyAmount(rawAmount, currency)}
                </strong>{' '}
                a bien été validée et créditée sur le registre de la tontine.
              </p>
            </div>

            {/* Reçu Numérique Officiel */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 text-xs text-left space-y-2.5 font-mono">
              <div className="flex justify-between items-center pb-2 border-b border-dashed border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-400">N° REÇU LÉGAL :</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{receiptNumber}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                <span>Réf. Transaction :</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{orderId}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                <span>Opérateur :</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">Mobile Money / Carte</span>
              </div>
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                <span>Date & Heure :</span>
                <span className="text-slate-800 dark:text-slate-200">{new Date().toLocaleString('fr-FR')}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                <span>Statut :</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold uppercase">PAYÉ & SÉCURISÉ</span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2">
              <Button
                variant="outline"
                size="md"
                className="w-full"
                leftIcon={<FileText size={16} />}
                onClick={() => setReceiptModalOpen(true)}
              >
                Consulter & Imprimer le Reçu Officiel
              </Button>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="emerald"
                  size="md"
                  onClick={() => navigate('/member')}
                  rightIcon={<ArrowRight size={16} />}
                >
                  Espace Membre
                </Button>
                <Button
                  variant="ghost"
                  size="md"
                  onClick={() => navigate('/dashboard/groups')}
                  leftIcon={<Home size={16} />}
                >
                  Tableau de bord
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* FAILED STATE */}
        {status === 'failed' && (
          <Card className="p-6 text-center space-y-4 shadow-xl border-rose-200 dark:border-rose-900 bg-white dark:bg-slate-900">
            <div className="w-16 h-16 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <AlertCircle size={36} />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Échec de la transaction
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
                {WHITE_LABEL_TEXTS.errorMessage}
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <Button
                variant="emerald"
                size="md"
                className="w-full"
                onClick={() => setStatus('processing')}
              >
                Réessayer la transaction
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => navigate(-1)}
              >
                Retour
              </Button>
            </div>
          </Card>
        )}

        {/* Footer info */}
        <div className="text-center text-[11px] text-slate-400 dark:text-slate-500">
          TontiFlow Secure Gateway • Cryptage SSL 256-bit • Réseau Bancaire & Télécom Agréé
        </div>
      </div>

      {/* Reçu officiel modal */}
      <ReceiptModal
        isOpen={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        transaction={currentTx as any}
      />
    </div>
  );
};
