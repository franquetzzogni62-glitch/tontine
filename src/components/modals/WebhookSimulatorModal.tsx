import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { formatFCFA } from '../../utils/formatters';
import {
  Zap,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Terminal,
  RefreshCw,
  Send,
} from 'lucide-react';

interface WebhookSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultGroupId?: string;
}

export const WebhookSimulatorModal: React.FC<WebhookSimulatorModalProps> = ({
  isOpen,
  onClose,
  defaultGroupId,
}) => {
  const { groups, members, simulateWebhook, addToast } = useApp();

  const [selectedGroupId, setSelectedGroupId] = useState(defaultGroupId || groups[0]?.id || '');
  const selectedGroup = groups.find((g) => g.id === selectedGroupId) || groups[0];

  const [selectedMemberId, setSelectedMemberId] = useState(
    selectedGroup?.members[0]?.memberId || members[0]?.id || ''
  );
  const selectedMember = members.find((m) => m.id === selectedMemberId) || members[0];

  const [operator, setOperator] = useState<'Orange Money' | 'MTN MoMo' | 'Wave'>('MTN MoMo');
  const [phoneNumber, setPhoneNumber] = useState(selectedMember?.phone || '+237 6 75 12 34 56');
  const [amount, setAmount] = useState<number>(selectedGroup?.contributionAmount || 25000);
  const [status, setStatus] = useState<'completed' | 'failed'>('completed');

  const [isLoading, setIsLoading] = useState(false);
  const [responseLog, setResponseLog] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  // When group changes, update amount and member
  const handleGroupChange = (grpId: string) => {
    setSelectedGroupId(grpId);
    const grp = groups.find((g) => g.id === grpId);
    if (grp) {
      setAmount(grp.contributionAmount);
      if (grp.members.length > 0) {
        setSelectedMemberId(grp.members[0].memberId);
        const m = members.find((x) => x.id === grp.members[0].memberId);
        if (m) setPhoneNumber(m.phone);
      }
    }
  };

  const handleMemberChange = (mId: string) => {
    setSelectedMemberId(mId);
    const m = members.find((x) => x.id === mId);
    if (m) setPhoneNumber(m.phone);
  };

  const simulatedPayload = {
    event: 'PAYMENT.COMPLETED',
    gateway: operator,
    transaction_id: `GW-${operator.slice(0, 2).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`,
    phone_number: phoneNumber,
    amount,
    currency: 'XAF',
    group_id: selectedGroup?.id,
    member_id: selectedMember?.id,
    status: status === 'completed' ? 'SUCCESS' : 'FAILED',
    timestamp: new Date().toISOString(),
  };

  const handleRunWebhook = async () => {
    setIsLoading(true);
    setResponseLog(null);

    try {
      const res = await simulateWebhook({
        groupId: selectedGroup?.id,
        memberId: selectedMember?.id,
        amount: Number(amount),
        operator,
        phoneNumber,
        status,
      });

      setResponseLog(res);
    } catch (err: any) {
      setResponseLog({ error: err.message || 'Erreur lors de la simulation' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(JSON.stringify(simulatedPayload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    addToast('Payload copié', 'Le JSON du webhook est dans le presse-papier.', 'info');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Simulateur de Webhook Mobile Money"
      maxWidth="lg"
    >
      <div className="space-y-5 text-left text-xs">
        {/* Banner Explainer */}
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-transparent border border-amber-500/20 text-slate-700 dark:text-slate-300">
          <div className="flex items-center gap-2 mb-1">
            <Zap size={16} className="text-amber-500" />
            <h4 className="font-bold text-slate-900 dark:text-white text-xs">
              Test d'intégration Webhook instantané
            </h4>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Ce simulateur invoque la route backend <code className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[10px] text-emerald-600 dark:text-emerald-400">POST /api/payments/webhook-test</code>. Il modifie en temps réel le statut de la cotisation, génère un reçu numérique et recalcule la cagnotte du tour.
          </p>
        </div>

        {/* Configuration Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Group & Member selector */}
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tontine cible
              </label>
              <select
                value={selectedGroupId}
                onChange={(e) => handleGroupChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500"
              >
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} (Tour #{g.currentDay} - {formatFCFA(g.contributionAmount)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Membre cotisant
              </label>
              <select
                value={selectedMemberId}
                onChange={(e) => handleMemberChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500"
              >
                {selectedGroup?.members.map((gm) => {
                  const m = members.find((x) => x.id === gm.memberId);
                  return (
                    <option key={gm.memberId} value={gm.memberId}>
                      Tour #{gm.turnOrder} : {m?.name || 'Membre'} {gm.hasPaidToday ? '(Déjà cotisé)' : '(En attente)'}
                    </option>
                  );
                })}
              </select>
            </div>

            <Input
              label="Numéro de téléphone émetteur"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              leftIcon={<Smartphone size={15} />}
            />
          </div>

          {/* Operator, Amount & Status */}
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Opérateur Mobile Money
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['MTN MoMo', 'Orange Money', 'Wave'] as const).map((op) => (
                  <button
                    key={op}
                    type="button"
                    onClick={() => setOperator(op)}
                    className={`py-2 px-1 text-center rounded-xl border font-semibold text-xs transition-all cursor-pointer ${
                      operator === op
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {op}
                  </button>
                ))}
              </div>
            </div>

            <Input
              label="Montant reçu (FCFA)"
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
            />

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Résultat simulé du Webhook
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setStatus('completed')}
                  className={`py-2 px-3 rounded-xl border text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    status === 'completed'
                      ? 'border-emerald-500 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold'
                      : 'border-slate-200 dark:border-slate-800 text-slate-500'
                  }`}
                >
                  <CheckCircle2 size={14} /> Completed (Succès)
                </button>

                <button
                  type="button"
                  onClick={() => setStatus('failed')}
                  className={`py-2 px-3 rounded-xl border text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    status === 'failed'
                      ? 'border-rose-500 bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold'
                      : 'border-slate-200 dark:border-slate-800 text-slate-500'
                  }`}
                >
                  <AlertCircle size={14} /> Failed (Échec)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Live Payload Preview */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Terminal size={14} className="text-emerald-500" /> Payload JSON transmis
            </span>
            <button
              onClick={handleCopyPayload}
              className="text-[11px] text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 cursor-pointer"
            >
              {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
              {copied ? 'Copié' : 'Copier JSON'}
            </button>
          </div>
          <pre className="p-3 rounded-xl bg-slate-900 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-36">
            {JSON.stringify(simulatedPayload, null, 2)}
          </pre>
        </div>

        {/* Response Box if Triggered */}
        {responseLog && (
          <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <CheckCircle2 size={15} className="text-emerald-500" /> Réponse du serveur (HTTP 200 OK)
              </span>
              <Badge variant={responseLog.success ? 'success' : 'danger'}>
                {responseLog.success ? 'Cotisation Validée' : 'Échec transaction'}
              </Badge>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              {responseLog.message}
            </p>

            {responseLog.receiptNumber && (
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-mono text-[11px] flex justify-between">
                <span>N° de Reçu généré :</span>
                <strong>{responseLog.receiptNumber}</strong>
              </div>
            )}
          </div>
        )}

        {/* Submit Action */}
        <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
          <Button variant="outline" size="sm" onClick={onClose}>
            Fermer
          </Button>

          <Button
            variant="emerald"
            size="md"
            onClick={handleRunWebhook}
            isLoading={isLoading}
            leftIcon={<Send size={15} />}
          >
            Déclencher le Webhook ({operator})
          </Button>
        </div>
      </div>
    </Modal>
  );
};
