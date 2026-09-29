import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { UserPlus, ShieldCheck } from 'lucide-react';
import { formatFCFA } from '../../utils/formatters';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMemberAdded?: () => void;
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({
  isOpen,
  onClose,
  onMemberAdded,
}) => {
  const { addMember, addToast } = useApp();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+237 6 ');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('Douala');
  const [guaranteeBalance, setGuaranteeBalance] = useState(0);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      addToast('Nom requis', 'Veuillez saisir le nom complet du membre.', 'warning');
      return;
    }
    if (!phone.trim() || phone.trim() === '+237 6') {
      addToast('Numéro requis', 'Veuillez renseigner le numéro Mobile Money du membre.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const parts = name.trim().split(' ');
      const firstName = parts[0] || name;
      const lastName = parts.slice(1).join(' ') || '';

      await addMember({
        name: name.trim(),
        firstName,
        lastName,
        phone: phone.trim(),
        email: email.trim() || `${firstName.toLowerCase()}@tontine.africa`,
        city: city.trim() || 'Douala',
        trustScore: 95,
        kycStatus: 'verified',
        joinedDate: new Date().toISOString().split('T')[0],
        groupsCount: 0,
        totalContributed: 0,
        totalReceived: 0,
        guaranteeBalance: Number(guaranteeBalance) || 0,
        status: 'active',
        presenceValidated: true,
        notes: notes.trim(),
      });

      // Reset
      setName('');
      setPhone('+237 6 ');
      setEmail('');
      setGuaranteeBalance(0);
      setNotes('');

      if (onMemberAdded) onMemberAdded();
      onClose();
    } catch {
      // Toast handled by context
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Ajouter un membre à la communauté"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        <Input
          label="Nom complet du membre"
          placeholder="Ex: Samuel Eto'o Mbida"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Numéro Mobile Money (WhatsApp)"
            placeholder="+237 6 xx xx xx xx"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            helperText="Pour réceptions Payouts & notifications SMS"
            required
          />

          <Input
            label="Adresse Email (Optionnelle)"
            type="email"
            placeholder="membre@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="Ville de résidence"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            options={[
              { value: 'Douala', label: 'Douala' },
              { value: 'Yaoundé', label: 'Yaoundé' },
              { value: 'Bafoussam', label: 'Bafoussam' },
              { value: 'Garoua', label: 'Garoua' },
              { value: 'Bamenda', label: 'Bamenda' },
              { value: 'Kribi', label: 'Kribi' },
              { value: 'Autre', label: 'Autre ville' },
            ]}
          />

          <Input
            label="Dépôt de caution initial (FCFA)"
            type="number"
            value={guaranteeBalance}
            onChange={(e) => setGuaranteeBalance(Number(e.target.value))}
            helperText="Fonds de garantie sécurisant les tours"
          />
        </div>

        <Textarea
          label="Notes ou références (Optionnel)"
          placeholder="Ex: Recommandé par la présidente de l'association, commerçant au marché..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
          <ShieldCheck size={16} className="shrink-0 text-emerald-600" />
          <span>Le membre sera automatiquement enregistré et disponible pour rejoindre vos groupes de tontine.</span>
        </div>

        <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
          <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={isSubmitting}>
            Annuler
          </Button>
          <Button
            variant="emerald"
            size="md"
            type="submit"
            isLoading={isSubmitting}
            leftIcon={<UserPlus size={16} />}
          >
            Enregistrer le membre
          </Button>
        </div>
      </form>
    </Modal>
  );
};
