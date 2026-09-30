import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { useApp } from '../../context/AppContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { TontineGroup, Member } from '../../types';
import {
  UserPlus,
  KeyRound,
  CheckCircle2,
  Copy,
  Share2,
  MessageSquare,
  ShieldCheck,
  Users2,
  Sparkles,
  ArrowRight,
  Smartphone,
  Building,
} from 'lucide-react';
import { formatFCFA, formatAccessCode, generate6DigitCode } from '../../utils/formatters';

interface EnrollMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: TontineGroup;
  onEnrolled?: (newMember: Member, code: string) => void;
}

export const EnrollMemberModal: React.FC<EnrollMemberModalProps> = ({
  isOpen,
  onClose,
  group,
  onEnrolled,
}) => {
  const { members, enrollMemberInGroup, addToast } = useApp();

  const [mode, setMode] = useState<'existing' | 'new'>('existing');
  const [selectedExistingMemberId, setSelectedExistingMemberId] = useState<string>('');

  // New member fields
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('+237 6 ');
  const [newCity, setNewCity] = useState('Douala');

  // Turn order
  const nextOrder = (group.members?.length || 0) + 1;
  const [turnOrder, setTurnOrder] = useState<number>(nextOrder);

  // Preview access code
  const [previewCode] = useState(() => generate6DigitCode(`preview_${Date.now()}`));

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successResult, setSuccessResult] = useState<{
    member: Member;
    accessCode: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Existing members not yet in this group
  const existingMembersNotInGroup = members.filter(
    (m) => !group.members.some((gm) => gm.memberId === m.id)
  );

  const handleReset = () => {
    setSuccessResult(null);
    setNewName('');
    setNewPhone('+237 6 ');
    setSelectedExistingMemberId('');
    setTurnOrder((group.members?.length || 0) + 1);
    setCopied(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'existing') {
      if (!selectedExistingMemberId) {
        addToast('Veuillez sélectionner un membre', 'Choisissez un membre existant dans la liste.', 'warning');
        return;
      }
      const existing = members.find((m) => m.id === selectedExistingMemberId);
      if (!existing) return;

      setIsSubmitting(true);
      try {
        const result = await enrollMemberInGroup(group.id, {
          memberId: existing.id,
          name: existing.name,
          phone: existing.phone,
          city: existing.city,
          turnOrder: Number(turnOrder) || nextOrder,
        });

        setSuccessResult({
          member: result.member,
          accessCode: result.accessCode,
        });

        try {
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.6 },
            colors: ['#10B981', '#F59E0B', '#3B82F6'],
          });
        } catch {
          // ignore
        }

        if (onEnrolled) onEnrolled(result.member, result.accessCode);
      } catch (err: any) {
        addToast('Erreur lors de l\'inscription', err.message || 'Impossible d\'inscrire le membre', 'error');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // New member mode
      if (!newName.trim()) {
        addToast('Nom requis', 'Veuillez saisir le nom complet du membre.', 'warning');
        return;
      }
      if (!newPhone.trim() || newPhone.trim() === '+237 6') {
        addToast('Numéro requis', 'Veuillez saisir le numéro Mobile Money du membre.', 'warning');
        return;
      }

      setIsSubmitting(true);
      try {
        const result = await enrollMemberInGroup(group.id, {
          name: newName.trim(),
          phone: newPhone.trim(),
          city: newCity.trim(),
          turnOrder: Number(turnOrder) || nextOrder,
        });

        setSuccessResult({
          member: result.member,
          accessCode: result.accessCode,
        });

        try {
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.6 },
            colors: ['#10B981', '#F59E0B', '#3B82F6'],
          });
        } catch {
          // ignore
        }

        if (onEnrolled) onEnrolled(result.member, result.accessCode);
      } catch (err: any) {
        addToast('Erreur lors de l\'inscription', err.message || 'Impossible d\'inscrire le membre', 'error');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopied(true);
    addToast('Code secret copié !', `Le code à 6 chiffres ${code} est copié dans le presse-papiers.`, 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsApp = (member: Member, code: string) => {
    const text = encodeURIComponent(
      `Bonjour ${member.name},\n` +
      `Vous avez été inscrit(e) par le modérateur à la tontine « ${group.name} » sur TontiFlow.\n\n` +
      `🔑 Votre CODE SECRET PERSONNEL à 6 chiffres est : ${code}\n\n` +
      `📲 Pour accéder à votre tableau de bord cotisant (suivi du pot, ordre des tours et reçus) :\n` +
      `1. Rendez-vous sur : ${window.location.origin}/login\n` +
      `2. Saisissez votre numéro (${member.phone})\n` +
      `3. Entrez votre code secret (${code})\n\n` +
      `Montant de votre cotisation : ${formatFCFA(group.contributionAmount)}.\n` +
      `Bienvenue dans la communauté !`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={successResult ? "Code d'accès généré avec succès !" : "Inscrire un membre à la tontine"}
      description={`Tontine : ${group.name} · Cotisation : ${formatFCFA(group.contributionAmount)}`}
      maxWidth="md"
    >
      {!successResult ? (
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {/* Informative notice */}
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2.5">
            <ShieldCheck size={17} className="shrink-0 mt-0.5 text-emerald-600" />
            <div>
              <span className="font-bold block">Accès membre 100% simplifié</span>
              <span>
                Le membre n'a aucun compte complexe à créer. Vous lui attribuez un{' '}
                <strong>code unique à 6 chiffres</strong>. Il l'utilise simplement avec son numéro de
                téléphone pour consulter son tableau de bord.
              </span>
            </div>
          </div>

          {/* Mode Selector */}
          <div className="grid grid-cols-2 p-1 gap-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl">
            <button
              type="button"
              onClick={() => setMode('existing')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mode === 'existing'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Membre existant ({existingMembersNotInGroup.length})
            </button>
            <button
              type="button"
              onClick={() => setMode('new')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mode === 'new'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Nouveau membre
            </button>
          </div>

          {/* Mode 1: Existing Member */}
          {mode === 'existing' && (
            <div className="space-y-3">
              {existingMembersNotInGroup.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2">
                  <p className="text-xs text-slate-500">
                    Tous vos membres enregistrés participent déjà à cette tontine.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setMode('new')}
                    leftIcon={<UserPlus size={14} />}
                  >
                    Créer un nouveau membre
                  </Button>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Sélectionner un membre du répertoire
                  </label>
                  <select
                    value={selectedExistingMemberId}
                    onChange={(e) => setSelectedExistingMemberId(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium"
                    required
                  >
                    <option value="">-- Choisir un membre --</option>
                    {existingMembersNotInGroup.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.phone}) - {m.city}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Mode 2: New Member Form */}
          {mode === 'new' && (
            <div className="space-y-3">
              <Input
                label="Nom & Prénom du membre"
                placeholder="Ex: Fatouma Ndiaye"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Numéro Mobile Money (WhatsApp)"
                  type="tel"
                  placeholder="+237 6 xx xx xx xx"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  leftIcon={<Smartphone size={15} />}
                  required
                />

                <Select
                  label="Ville de résidence"
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value)}
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
              </div>
            </div>
          )}

          {/* Turn order in rotation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Input
              label="Position / Tour dans la rotation"
              type="number"
              min={1}
              value={turnOrder}
              onChange={(e) => setTurnOrder(Number(e.target.value))}
              helperText={`Prochaine position libre : #${nextOrder}`}
              required
            />

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Code secret à 6 chiffres attribué
              </label>
              <div className="h-[42px] px-3.5 rounded-xl border border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-950/40 flex items-center justify-between">
                <span className="font-mono text-base font-black tracking-widest text-emerald-700 dark:text-emerald-400">
                  {formatAccessCode(previewCode)}
                </span>
                <span className="text-[10px] text-emerald-600 font-bold bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded shadow-2xs">
                  Généré auto
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" size="sm" type="button" onClick={handleClose} disabled={isSubmitting}>
              Annuler
            </Button>
            <Button
              variant="emerald"
              size="md"
              type="submit"
              isLoading={isSubmitting}
              leftIcon={<KeyRound size={16} />}
            >
              Inscrire et générer le code
            </Button>
          </div>
        </form>
      ) : (
        /* SUCCESS STEP: REVEAL CODE AND EASY WHATSAPP / COPY ACTIONS */
        <div className="space-y-5 text-left py-1">
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700/60 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 size={26} />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {successResult.member.name} est inscrit(e) !
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                {successResult.member.phone} · Tontine : {group.name}
              </p>
            </div>

            {/* BIG CODE CARD */}
            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-500/40 shadow-xs max-w-xs mx-auto">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                Code secret d'accès à 6 chiffres
              </span>
              <div className="font-mono text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-wider">
                {formatAccessCode(successResult.accessCode)}
              </div>
              <span className="text-[10px] text-slate-500 block mt-1">
                À transmettre exclusivement à ce membre
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-2">
            <Button
              variant="emerald"
              size="md"
              className="w-full justify-center bg-[#25D366] hover:bg-[#20bd5a] text-white border-transparent"
              onClick={() => handleShareWhatsApp(successResult.member, successResult.accessCode)}
              leftIcon={<Share2 size={16} />}
            >
              Envoyer les identifiants par WhatsApp
            </Button>

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-center"
                onClick={() => handleCopyCode(successResult.accessCode)}
                leftIcon={copied ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Copy size={14} />}
              >
                {copied ? 'Code copié !' : 'Copier le code'}
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="w-full justify-center"
                onClick={() => {
                  addToast(
                    'SMS simulé',
                    `SMS envoyé à ${successResult.member.phone} avec le code ${successResult.accessCode}.`,
                    'info'
                  );
                }}
                leftIcon={<MessageSquare size={14} />}
              >
                Simuler envoi SMS
              </Button>
            </div>
          </div>

          <div className="pt-3 flex justify-between items-center border-t border-slate-100 dark:border-slate-800">
            <Button variant="ghost" size="sm" onClick={handleReset}>
              Inscrire un autre membre
            </Button>
            <Button variant="emerald" size="sm" onClick={handleClose}>
              Terminer
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
