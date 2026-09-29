import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { formatFCFA, formatDateTime } from '../../utils/formatters';
import { PaymentTransaction } from '../../types';
import { CheckCircle2, Download, Printer, ShieldCheck, QrCode } from 'lucide-react';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: PaymentTransaction | null;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  transaction,
}) => {
  if (!transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reçu Officiel de Cotisation" maxWidth="md">
      <div className="space-y-4 text-left print:p-0">
        {/* Receipt Header Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white relative overflow-hidden shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-[11px] font-semibold tracking-wide uppercase backdrop-blur-xs mb-2">
                <ShieldCheck size={13} /> Reçu Certifié TontiFlow
              </div>
              <h3 className="text-xl font-black tracking-tight">{transaction.groupName}</h3>
              <p className="text-xs text-emerald-100 mt-0.5">
                Tour actuel #{transaction.roundNumber || 1} · Cycle #{transaction.cycleNumber || 1}
              </p>
            </div>

            <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
              <QrCode size={26} className="text-white" />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/20 flex items-baseline justify-between">
            <span className="text-xs text-emerald-100">Montant versé :</span>
            <span className="font-mono text-2xl font-black tracking-tight">
              {formatFCFA(transaction.amount)}
            </span>
          </div>
        </div>

        {/* Receipt Details Table */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-2.5">
          <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-800">
            <span className="text-slate-500">Numéro de reçu :</span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
              {transaction.receiptNumber || `REC-${transaction.transactionRef}`}
            </span>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-800">
            <span className="text-slate-500">Réf. Passerelle (TxID) :</span>
            <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
              {transaction.transactionRef}
            </span>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-800">
            <span className="text-slate-500">Membre cotisant :</span>
            <span className="font-semibold text-slate-900 dark:text-white">
              {transaction.memberName}
            </span>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-800">
            <span className="text-slate-500">Téléphone Mobile Money :</span>
            <span className="font-mono text-slate-700 dark:text-slate-300">
              {transaction.memberPhone}
            </span>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-800">
            <span className="text-slate-500">Opérateur / Moyen :</span>
            <span className="font-medium text-slate-800 dark:text-slate-200">
              {transaction.method}
            </span>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-800">
            <span className="text-slate-500">Date & Heure d'enregistrement :</span>
            <span className="font-mono text-slate-700 dark:text-slate-300">
              {formatDateTime(transaction.date)}
            </span>
          </div>

          <div className="flex justify-between items-center py-1">
            <span className="text-slate-500">Statut de validation :</span>
            <Badge variant="success">
              <span className="flex items-center gap-1">
                <CheckCircle2 size={12} /> Confirmé & Encaissé
              </span>
            </Badge>
          </div>
        </div>

        {/* Security seal note */}
        <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
          <ShieldCheck size={16} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>
            Preuve numérique immuable générée par le protocole sécurisé TontiFlow. Ce reçu fait foi devant l'assemblée du groupe.
          </span>
        </div>

        {/* Actions */}
        <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-200 dark:border-slate-800">
          <Button variant="outline" size="sm" onClick={onClose}>
            Fermer
          </Button>
          <Button variant="emerald" size="sm" onClick={handlePrint} leftIcon={<Printer size={14} />}>
            Imprimer le reçu
          </Button>
        </div>
      </div>
    </Modal>
  );
};
