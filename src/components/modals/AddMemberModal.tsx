import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { useApp } from '../../context/AppContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import {
  UserPlus,
  ShieldCheck,
  KeyRound,
  CheckCircle2,
  Copy,
  Share2,
  Sparkles,
  Smartphone,
} from 'lucide-react';
import { formatFCFA, formatAccessCode } from '../../utils/formatters';
import { Member } from '../../types';

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
  const { addMember, groups, enrollMemberInGroup, addToast } = useApp();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+237 6 ');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('Douala');
  const [guaranteeBalance, setGuaranteeBalance] = useState(0);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Result state
  const [enrolledResult, setEnrolledResult] = useState<{
    member: Member;
    groupName: string;
    accessCode: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleReset = () => {
    setName('');
    setPhone('+237 6 ');
    setEmail('');
    setCity('Douala');
    setGuaranteeBalance(0);
    setSelectedGroupId('');
    setNotes('');
    setEnrolledResult(null);
    setCopied(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

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

      if (selectedGroupId) {
        // Enroll directly in selected group with unique 6-digit access code
        const enrolled = await enrollMemberInGroup(selectedGroupId, {
          name: name.trim(),
          phone: phone.trim(),
          city: city.trim(),
        });

        const targetGroup = groups.find((g) => g.id === selectedGroupId);

        setEnrolledResult({
          member: enrolled.member,
          groupName: targetGroup?.name || 'Tontine',
          accessCode: enrolled.accessCode,
        });

        try {
          confetti({
            particleCount: 70,
            spread: 60,
            origin: { y: 0.6 },
          });
        } catch {
          // ignore
        }
      } else {
        // Simply add to community members
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

        if (onMemberAdded) onMemberAdded();
        handleClose();
      }
    } catch {
      // Toast handled by context
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShareWhatsApp = () => {
    if (!enrolledResult) return;
    const text = encodeURIComponent(
      `Bonjour ${enrolledResult.member.name},\n` +
      `Votre inscription à la tontine « ${enrolledResult.groupName} » a été validée par votre modérateur.\n\n` +
      `🔑 Votre CODE SECRET PERSONNEL à 6 chiffres est : ${enrolledResult.accessCode}\n\n` +
      `Connectez-vous avec votre numéro (${enrolledResult.member.phone}) et ce code sur : ${window.location.origin}/login\n` +
      `pour consulter votre calendrier de rotation, la cagnotte et vos reçus officiels.`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={enrolledResult ? "Code secret d'accès généré !" : "Ajouter un membre à la communauté"}
      maxWidth="md"
    >
      {!enrolledResult ? (
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
              helperText="Pour réceptions Payouts & connexion"
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

            {/* Optional Immediate Group Assignment */}
            <Select
              label="Inscrire immédiatement à un groupe (Optionnel)"
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              options={[
                { value: '', label: '-- Enregistrer sans groupe pour l\'instant --' },
                ...groups.map((g) => ({
                  value: g.id,
                  label: `${g.name} (${formatFCFA(g.contributionAmount)})`,
                })),
              ]}
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
            <span>
              {selectedGroupId
                ? 'Un code unique à 6 chiffres sera immédiatement généré pour ce groupe.'
                : 'Le membre sera enregistré dans votre répertoire et disponible pour vos tontines.'}
            </span>
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" size="sm" type="button" onClick={handleClose} disabled={isSubmitting}>
              Annuler
            </Button>
            <Button
              variant="emerald"
              size="md"
              type="submit"
              isLoading={isSubmitting}
              leftIcon={<UserPlus size={16} />}
            >
              {selectedGroupId ? 'Inscrire & Générer le code' : 'Enregistrer le membre'}
            </Button>
          </div>
        </form>
      ) : (
        /* Success Screen with 6-digit access code and WhatsApp Share */
        <div className="space-y-4 text-left py-2">
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700/60 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 size={26} />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {enrolledResult.member.name} est inscrit(e) !
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Tontine : <strong className="text-slate-800 dark:text-slate-200">{enrolledResult.groupName}</strong> · Numéro : {enrolledResult.member.phone}
              </p>
            </div>

            {/* BIG CODE BOX */}
            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-500/40 shadow-xs max-w-xs mx-auto">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                Code secret d'accès à 6 chiffres
              </span>
              <div className="font-mono text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-wider">
                {formatAccessCode(enrolledResult.accessCode)}
              </div>
              <span className="text-[10px] text-slate-500 block mt-1">
                Le membre utilise ce code avec son numéro pour se connecter
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Button
              variant="emerald"
              size="md"
              className="w-full justify-center bg-[#25D366] hover:bg-[#20bd5a] text-white border-transparent"
              onClick={handleShareWhatsApp}
              leftIcon={<Share2 size={16} />}
            >
              Envoyer les identifiants par WhatsApp
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="w-full justify-center"
              onClick={() => {
                navigator.clipboard?.writeText(enrolledResult.accessCode);
                setCopied(true);
                addToast('Code copié !', `Code ${enrolledResult.accessCode} copié.`, 'success');
                setTimeout(() => setCopied(false), 2000);
              }}
              leftIcon={copied ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Copy size={14} />}
            >
              {copied ? 'Code copié !' : 'Copier le code à 6 chiffres'}
            </Button>
          </div>

          <div className="pt-2 flex justify-end border-t border-slate-100 dark:border-slate-800">
            <Button variant="emerald" size="sm" onClick={handleClose}>
              Terminer
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
