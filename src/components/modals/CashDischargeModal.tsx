import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { formatFCFA, formatDateTime } from '../../utils/formatters';
import { CheckCircle2, Printer, ShieldCheck, Banknote, UserCheck, FileCheck } from 'lucide-react';

export interface CashDischargeModalProps {
  isOpen: boolean;
  onClose: () => void;
  dischargeData: {
    groupName: string;
    roundNumber: number;
    beneficiaryName: string;
    beneficiaryPhone: string;
    moderatorName: string;
    grossAmount: number;
    commissionAmount: number;
    netAmount: number;
    date: string;
    signatureDataUrl: string;
    witnessName?: string;
    dischargeRef: string;
  } | null;
}

export const CashDischargeModal: React.FC<CashDischargeModalProps> = ({
  isOpen,
  onClose,
  dischargeData,
}) => {
  if (!dischargeData) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Attestation de Décharge - Remise en Espèces"
      maxWidth="md"
    >
      <div className="space-y-4 text-left print:p-0 text-xs">
        {/* Header Hero Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-700 via-teal-800 to-slate-900 text-white shadow-md relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 text-[10px] font-bold uppercase tracking-wider mb-1.5 backdrop-blur-xs">
                <Banknote size={13} className="text-amber-300" />
                <span>Remise de Billets en Main Propre</span>
              </div>
              <h3 className="text-lg font-black tracking-tight">{dischargeData.groupName}</h3>
              <p className="text-xs text-emerald-100">
                Tour #{dischargeData.roundNumber} · Clôture de session physique
              </p>
            </div>

            <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
              <FileCheck size={24} className="text-emerald-300" />
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-white/20 flex items-baseline justify-between">
            <span className="text-xs text-emerald-100">Montant net remis en espèces :</span>
            <span className="font-mono text-2xl font-black text-amber-300">
              {formatFCFA(dischargeData.netAmount)}
            </span>
          </div>
        </div>

        {/* Détail de la transaction */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-800">
            <span className="text-slate-500">Réf. Décharge officielle :</span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
              {dischargeData.dischargeRef}
            </span>
          </div>

          <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-800">
            <span className="text-slate-500">Bénéficiaire (ayant reçu l'enveloppe) :</span>
            <span className="font-bold text-slate-900 dark:text-white">
              {dischargeData.beneficiaryName} ({dischargeData.beneficiaryPhone})
            </span>
          </div>

          <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-800">
            <span className="text-slate-500">Remis par le modérateur :</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {dischargeData.moderatorName}
            </span>
          </div>

          {dischargeData.witnessName && (
            <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-800">
              <span className="text-slate-500">Témoin / Secrétaire de séance :</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {dischargeData.witnessName}
              </span>
            </div>
          )}

          <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-800">
            <span className="text-slate-500">Date et heure de la remise :</span>
            <span className="font-mono text-slate-700 dark:text-slate-300">
              {formatDateTime(dischargeData.date)}
            </span>
          </div>

          <div className="flex justify-between py-1 text-slate-600 dark:text-slate-400">
            <span>Décompte financier :</span>
            <span className="font-mono">
              Brut: {formatFCFA(dischargeData.grossAmount)} &minus; Frais 5%: {formatFCFA(dischargeData.commissionAmount)}
            </span>
          </div>
        </div>

        {/* Zone de signature numérique du bénéficiaire */}
        <div className="p-3.5 rounded-xl border border-emerald-500/40 bg-white dark:bg-slate-900 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <UserCheck size={14} className="text-emerald-600" />
              <span>Signature numérique apposée pour décharge :</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-bold border border-emerald-500/20">
              Certifié conforme
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 flex flex-col items-center justify-center">
            {dischargeData.signatureDataUrl ? (
              <img
                src={dischargeData.signatureDataUrl}
                alt="Signature du bénéficiaire"
                className="max-h-24 object-contain filter dark:brightness-125"
              />
            ) : (
              <span className="font-serif italic text-base text-slate-600">
                Signé numériquement par {dischargeData.beneficiaryName}
              </span>
            )}
            <span className="text-[10px] text-slate-400 mt-1">
              Signé en séance plénière par {dischargeData.beneficiaryName}
            </span>
          </div>
        </div>

        {/* Legal notice */}
        <div className="p-2.5 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/50 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
          <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
          <span>
            Cette quittance numérique constitue une décharge libératoire valable pour l'assemblée générale et dégage toute responsabilité pour les fonds remis.
          </span>
        </div>

        {/* Modal actions */}
        <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
          <Button variant="outline" size="sm" onClick={onClose}>
            Fermer
          </Button>
          <Button variant="emerald" size="sm" onClick={handlePrint} leftIcon={<Printer size={14} />}>
            Imprimer la décharge
          </Button>
        </div>
      </div>
    </Modal>
  );
};
