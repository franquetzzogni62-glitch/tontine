import React, { useState, useEffect } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { formatFCFA } from '../utils/formatters';
import { TontineGroup, TontineFinancialSummary } from '../types';
import { api } from '../services/api';
import {
  Coins,
  ShieldCheck,
  TrendingDown,
  Sparkles,
  ArrowRight,
  AlertCircle,
  HelpCircle,
  Smartphone,
  CheckCircle2,
} from 'lucide-react';

interface FinancialSummaryWidgetProps {
  group: TontineGroup;
  onOpenPayoutModal: () => void;
  isAdmin?: boolean;
  className?: string;
}

export const FinancialSummaryWidget: React.FC<FinancialSummaryWidgetProps> = ({
  group,
  onOpenPayoutModal,
  isAdmin = true,
  className = '',
}) => {
  const [summary, setSummary] = useState<TontineFinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showExplanation, setShowExplanation] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    api
      .getTontineSummary(group.id)
      .then((data) => {
        if (isMounted) setSummary(data);
      })
      .catch(() => {
        // Local calculation fallback matching exact 5% rule
        if (isMounted) {
          const paidCount = group.members.filter((m) => m.hasPaidToday).length;
          const gross = paidCount * group.contributionAmount;
          const comm = Math.round(gross * 0.05);
          const net = gross - comm;
          const currentBen = group.beneficiarySchedule.find(
            (b) => b.order === group.currentDay
          );

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
            beneficiary: currentBen
              ? {
                  memberId: currentBen.memberId,
                  memberName: currentBen.memberName,
                  memberPhone: currentBen.memberPhone,
                  order: currentBen.order,
                  scheduledDate: currentBen.scheduledDate,
                }
              : undefined,
            paidMembers: [],
            missingMembers: [],
          });
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [group]);

  // Fallback defaults
  const paidCount = summary?.paidMembersCount ?? group.members.filter((m) => m.hasPaidToday).length;
  const totalCount = summary?.totalMembersCount ?? group.members.length;
  const grossAmount = summary?.totalPotAmount ?? paidCount * group.contributionAmount;
  const commissionAmount = summary?.commissionAmount ?? Math.round(grossAmount * 0.05);
  const netAmount = summary?.netBeneficiaryAmount ?? grossAmount - commissionAmount;
  const isFullyFunded = summary?.isFullyFunded ?? paidCount === totalCount;
  const beneficiaryName =
    summary?.beneficiary?.memberName ||
    group.beneficiarySchedule.find((b) => b.order === group.currentDay)?.memberName ||
    'Bénéficiaire du Tour';

  return (
    <Card className={`p-5 overflow-hidden border-2 border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.04] via-transparent to-amber-500/[0.04] shadow-sm relative ${className}`}>
      {/* Decorative top accent line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-500" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Coins size={16} />
            </span>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
              Récapitulatif Financier & Décompte du Pot (Tour #{group.currentDay})
            </h3>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
              Commission 5% SaaS
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Bénéficiaire désigné ce tour : <strong className="text-slate-800 dark:text-slate-200">{beneficiaryName}</strong> · Cotisation : {formatFCFA(group.contributionAmount)}/membre
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowExplanation(!showExplanation)}
          className="text-[11px] text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 inline-flex items-center gap-1 self-start sm:self-auto cursor-pointer transition-colors"
        >
          <HelpCircle size={13} />
          <span>{showExplanation ? 'Masquer la règle' : 'Voir règle de calcul'}</span>
        </button>
      </div>

      {/* Explanation Banner */}
      {showExplanation && (
        <div className="mt-3 p-3 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 space-y-1.5 animate-fadeIn">
          <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-white">
            <ShieldCheck size={14} className="text-emerald-500" />
            <span>Règle de gestion officielle de la plateforme :</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            1. <strong>Montant total collecté (Brut)</strong> = Nombre de membres ayant cotisé × Montant de la cotisation.
            <br />
            2. <strong>Frais SaaS (5%)</strong> = Montant total collecté × 0.05 (Couvre la sécurisation des fonds, l'infrastructure API et les passerelles Mobile Money).
            <br />
            3. <strong>Montant net bénéficiaire</strong> = Montant total collecté − Commission de 5%.
          </p>
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-800 dark:text-emerald-300 font-mono">
            Exemple de référence : 10 membres cotisant 1 050 FCFA = <strong>10 500 FCFA</strong> brut &minus; 5% (<strong>525 FCFA</strong> SaaS) = <strong className="text-emerald-600 dark:text-emerald-400">9 975 FCFA Net</strong> envoyé sur le Mobile Money.
          </div>
        </div>
      )}

      {/* 3 Main Figures Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mt-4">
        {/* 1. Total Collecté */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              Montant total collecté (Brut)
            </span>
            <Badge variant={isFullyFunded ? 'success' : 'warning'} className="text-[10px]">
              {paidCount}/{totalCount} cotisations
            </Badge>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black font-mono text-slate-900 dark:text-white">
              {formatFCFA(grossAmount)}
            </span>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              {paidCount} membre(s) &times; {formatFCFA(group.contributionAmount)}
            </span>
          </div>
        </div>

        {/* 2. Frais SaaS 5% */}
        <div className="p-4 rounded-xl bg-amber-500/[0.06] border border-amber-500/20 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-amber-700 dark:text-amber-400">
            <span className="font-semibold uppercase tracking-wider text-[10px] flex items-center gap-1">
              <TrendingDown size={12} /> Frais SaaS & Sécurisation (-5%)
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-800 dark:text-amber-300">
              5.0%
            </span>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400">
              &minus;{formatFCFA(commissionAmount)}
            </span>
            <span className="text-[11px] text-amber-700/70 dark:text-amber-400/70 block mt-0.5">
              Revenu plateforme TontiFlow
            </span>
          </div>
        </div>

        {/* 3. Montant Net Bénéficiaire (Mise en évidence en VERT) */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/15 via-emerald-500/10 to-teal-500/20 border-2 border-emerald-500/40 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
            <span className="font-bold uppercase tracking-wider text-[10px] flex items-center gap-1">
              <Sparkles size={12} className="text-emerald-500" /> Montant net à recevoir (Bénéficiaire)
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500 text-white">
              Net MoMo
            </span>
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400 tracking-tight">
              {formatFCFA(netAmount)}
            </span>
            <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300 block mt-0.5">
              Envoyé sur le Mobile Money de {beneficiaryName.split(' ')[0]}
            </span>
          </div>
        </div>
      </div>

      {/* Footer / Trigger Action */}
      <div className="mt-4 pt-3.5 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Smartphone size={15} className="text-emerald-500 shrink-0" />
          <span>
            Compatible virements instantanés : <strong>Orange Money</strong>, <strong>MTN MoMo</strong>, <strong>Wave</strong>.
          </span>
        </div>

        {isAdmin && group.status === 'active' && (
          <div className="flex items-center gap-2">
            <Button
              variant="emerald"
              size="sm"
              onClick={onOpenPayoutModal}
              leftIcon={<Coins size={15} />}
              className="w-full sm:w-auto shadow-md"
            >
              Déclencher le versement du pot ({formatFCFA(netAmount)} Net)
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};
