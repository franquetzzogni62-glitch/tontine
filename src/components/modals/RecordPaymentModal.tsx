import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { PaymentMethod } from '../../types';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultGroupId?: string;
  defaultMemberId?: string;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  onClose,
  defaultGroupId,
  defaultMemberId,
}) => {
  const { groups, members, recordPayment } = useApp();

  const [selectedGroupId, setSelectedGroupId] = useState(
    defaultGroupId || (groups[0]?.id ?? '')
  );
  const selectedGroup = groups.find((g) => g.id === selectedGroupId) || groups[0];

  const [selectedMemberId, setSelectedMemberId] = useState(
    defaultMemberId || (members[0]?.id ?? '')
  );
  const selectedMember = members.find((m) => m.id === selectedMemberId) || members[0];

  const [amount, setAmount] = useState<number>(
    selectedGroup ? selectedGroup.contributionAmount : 1100
  );
  const [method, setMethod] = useState<PaymentMethod>('MTN MoMo');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update amount when group changes
  const handleGroupChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const gId = e.target.value;
    setSelectedGroupId(gId);
    const grp = groups.find((g) => g.id === gId);
    if (grp) setAmount(grp.contributionAmount);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup || !selectedMember) return;

    setIsSubmitting(true);
    try {
      const comm = selectedGroup.moderatorCommission;
      await recordPayment({
        groupId: selectedGroup.id,
        groupName: selectedGroup.name,
        memberId: selectedMember.id,
        memberName: selectedMember.name,
        memberPhone: selectedMember.phone,
        amount: Number(amount),
        baseAmount: Number(amount) - comm,
        commission: comm,
        date: new Date().toISOString(),
        status: 'paid',
        method,
        verifiedByModerator: true,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Enregistrer une cotisation"
      description="Saisissez un versement reçu par Mobile Money ou en espèces."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Groupe de tontine"
          value={selectedGroupId}
          onChange={handleGroupChange}
          options={groups.map((g) => ({
            value: g.id,
            label: `${g.name} (${g.contributionAmount} FCFA)`,
          }))}
        />

        <Select
          label="Membre cotisant"
          value={selectedMemberId}
          onChange={(e) => setSelectedMemberId(e.target.value)}
          options={members.map((m) => ({
            value: m.id,
            label: `${m.name} - ${m.phone}`,
          }))}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Montant total (FCFA)"
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            required
            helperText={`Dont ${selectedGroup?.moderatorCommission || 0} FCFA commission`}
          />

          <Select
            label="Moyen de paiement"
            value={method}
            onChange={(e) => setMethod(e.target.value as PaymentMethod)}
            options={[
              { value: 'MTN MoMo', label: 'MTN Mobile Money' },
              { value: 'Orange Money', label: 'Orange Money' },
              { value: 'Wave', label: 'Wave Money' },
              { value: 'Espèces', label: 'Espèces (Main à main)' },
              { value: 'Virement', label: 'Virement Bancaire' },
            ]}
          />
        </div>

        <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Annuler
          </Button>
          <Button
            type="submit"
            variant="emerald"
            size="sm"
            isLoading={isSubmitting}
          >
            Valider l'encaissement
          </Button>
        </div>
      </form>
    </Modal>
  );
};
