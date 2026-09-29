import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { useApp } from '../../context/AppContext';
import { Stepper } from '../../components/ui/Stepper';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { Avatar } from '../../components/ui/Avatar';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Users2,
  Coins,
  ShieldCheck,
  Share2,
} from 'lucide-react';
import { formatFCFA } from '../../utils/formatters';
import { Frequency } from '../../types';

export const CreateGroupPage: React.FC = () => {
  const navigate = useNavigate();
  const { addGroup, members: availableMembers, currentUser, addToast } = useApp();

  const [currentStep, setCurrentStep] = useState(1);

  // Form State
  // Step 1: Info de base
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [contributionAmount, setContributionAmount] = useState(1100);
  const [frequency, setFrequency] = useState<Frequency>('daily');
  const [category, setCategory] = useState('Commerce & Négoce');

  // Step 2: Commission modérateur
  const [commissionType, setCommissionType] = useState<'fixed' | 'percentage'>('fixed');
  const [commissionValue, setCommissionValue] = useState(50); // 50 FCFA

  // Step 3: Nombre de membres & Ordre des tours
  const [selectedMembers, setSelectedMembers] = useState<
    { id: string; name: string; phone: string; turnOrder: number }[]
  >(() => {
    return availableMembers.slice(0, 8).map((m, idx) => ({
      id: m.id,
      name: m.name,
      phone: m.phone,
      turnOrder: idx + 1,
    }));
  });

  // Step 4: Invitations
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('+237 6 ');

  const handleAddCustomMember = () => {
    if (!newMemberName || !newMemberPhone) return;
    const newId = `custom_${Date.now()}`;
    setSelectedMembers((prev) => [
      ...prev,
      {
        id: newId,
        name: newMemberName,
        phone: newMemberPhone,
        turnOrder: prev.length + 1,
      },
    ]);
    setNewMemberName('');
    setNewMemberPhone('+237 6 ');
    addToast('Membre ajouté', `${newMemberName} a été ajouté à la liste des tours.`, 'info');
  };

  const handleMoveOrder = (index: number, direction: 'up' | 'down') => {
    const newArr = [...selectedMembers];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newArr.length) return;

    const temp = newArr[index];
    newArr[index] = newArr[targetIndex];
    newArr[targetIndex] = temp;

    // re-assign turnOrders
    const reordered = newArr.map((m, idx) => ({ ...m, turnOrder: idx + 1 }));
    setSelectedMembers(reordered);
  };

  const handleRemoveMember = (id: string) => {
    const filtered = selectedMembers
      .filter((m) => m.id !== id)
      .map((m, idx) => ({ ...m, turnOrder: idx + 1 }));
    setSelectedMembers(filtered);
  };

  // Calculations
  const calculatedCommission =
    commissionType === 'fixed'
      ? commissionValue
      : Math.round((contributionAmount * commissionValue) / 100);

  const netPotAmount = (contributionAmount - calculatedCommission) * selectedMembers.length;
  const totalModDailyEarnings = calculatedCommission * selectedMembers.length;

  // Final Submit
  const handleFinalSubmit = async () => {
    const startDate = new Date().toISOString().split('T')[0];
    const endDateObj = new Date();
    endDateObj.setDate(endDateObj.getDate() + selectedMembers.length);
    const endDate = endDateObj.toISOString().split('T')[0];

    const schedule = selectedMembers.map((m, idx) => {
      const d = new Date();
      d.setDate(d.getDate() + idx);
      return {
        order: m.turnOrder,
        memberId: m.id,
        memberName: m.name,
        memberPhone: m.phone,
        scheduledDate: d.toISOString().split('T')[0],
        potAmount: netPotAmount,
        status: idx === 0 ? ('current' as const) : ('upcoming' as const),
      };
    });

    const newGroup = await addGroup({
      name: name || 'Nouvelle Tontine Express',
      description: description || 'Tontine rotative d\'épargne collective.',
      type: 'rotative',
      drawDay: 'Tous les jours à 18h',
      potAmount: netPotAmount,
      nextTurnDate: startDate,
      moderatorId: currentUser.id,
      contributionAmount: Number(contributionAmount),
      moderatorCommission: calculatedCommission,
      commissionType,
      frequency,
      currency: 'FCFA',
      totalMembersCount: selectedMembers.length,
      currentCycle: 1,
      currentDay: 1,
      status: 'active',
      startDate,
      endDate,
      category,
      members: selectedMembers.map((m) => ({
        memberId: m.id,
        turnOrder: m.turnOrder,
        hasPaidToday: false,
        totalContributedInGroup: 0,
      })),
      beneficiarySchedule: schedule,
    });

    // Launch Confetti
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10B981', '#F97316', '#0F172A'],
      });
    } catch (e) {
      // Safe fallback
    }

    navigate(`/dashboard/groups/${newGroup.id}`);
  };

  const steps = [
    { title: 'Informations', description: 'Nom & Cotisation' },
    { title: 'Commission', description: 'Gains modérateur' },
    { title: 'Ordre des tours', description: 'Attribution du pot' },
    { title: 'Invitations', description: 'Membres & liens' },
    { title: 'Confirmation', description: 'Lancement du cycle' },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6 text-left pb-12">
      {/* Top breadcrumb */}
      <div className="flex items-center gap-3 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <Link
          to="/dashboard/groups"
          className="p-2 -ml-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Créer un nouveau groupe de tontine
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Paramétrez les cotisations, commissions et la rotation des bénéficiaires en 5 étapes.
          </p>
        </div>
      </div>

      {/* Stepper */}
      <Stepper
        steps={steps}
        currentStep={currentStep}
        onStepClick={(step) => setCurrentStep(step)}
      />

      {/* STEP 1: INFOS DE BASE */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Étape 1 : Informations de base</CardTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Donnez un nom clair à votre groupe et fixez le montant de chaque versement.
              </p>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <Input
              label="Nom du groupe de tontine"
              placeholder="Ex: Tontine Mélanie Akwa, Cercle Entrepreneures..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <Textarea
              label="Description et règles spécifiques"
              placeholder="Ex: Cotisations versées avant 18h00. Pot remis le soir même par Orange Money..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Montant de la cotisation (FCFA)"
                type="number"
                placeholder="1100"
                value={contributionAmount}
                onChange={(e) => setContributionAmount(Number(e.target.value))}
                required
                helperText="Montant total versé par chaque membre à chaque tour."
              />

              <Select
                label="Fréquence de cotisation"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as Frequency)}
                options={[
                  { value: 'daily', label: 'Quotidienne (Chaque jour)' },
                  { value: 'weekly', label: 'Hebdomadaire (Chaque semaine)' },
                  { value: 'monthly', label: 'Mensuelle (Chaque mois)' },
                ]}
              />
            </div>

            <Select
              label="Secteur / Catégorie de membres"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              options={[
                { value: 'Commerce & Négoce', label: 'Commerce & Négoce (Marchés)' },
                { value: 'Femmes Entrepreneures', label: 'Femmes Entrepreneures' },
                { value: 'Transport & Logistique', label: 'Transport & Logistique (Taxis, Motos)' },
                { value: 'Famille & Solidarité', label: 'Famille & Solidarité locale' },
                { value: 'Agrobusiness', label: 'Agrobusiness & Vivres frais' },
                { value: 'Autre', label: 'Autre secteur' },
              ]}
            />
          </CardContent>

          <CardFooter className="justify-end">
            <Button
              variant="emerald"
              size="md"
              onClick={() => {
                if (!name) {
                  addToast('Nom requis', 'Veuillez saisir un nom pour le groupe.', 'warning');
                  return;
                }
                setCurrentStep(2);
              }}
              rightIcon={<ArrowRight size={16} />}
            >
              Étape suivante : Commission
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* STEP 2: COMMISSION MODÉRATEUR */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Étape 2 : Commission du modérateur</CardTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Fixez votre rémunération légitime pour la gestion du groupe et le suivi des caisses.
              </p>
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Type de commission
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setCommissionType('fixed');
                    setCommissionValue(50);
                  }}
                  className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                    commissionType === 'fixed'
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Montant fixe par cotisation
                  </span>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Ex: 50 FCFA retenus sur chaque 1 100 FCFA
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCommissionType('percentage');
                    setCommissionValue(5);
                  }}
                  className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                    commissionType === 'percentage'
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Pourcentage (%)
                  </span>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Ex: 5% sur chaque cotisation versée
                  </span>
                </button>
              </div>
            </div>

            <Input
              label={
                commissionType === 'fixed'
                  ? 'Montant de la commission par membre (FCFA)'
                  : 'Pourcentage de la commission (%)'
              }
              type="number"
              value={commissionValue}
              onChange={(e) => setCommissionValue(Number(e.target.value))}
              required
            />

            {/* Simulation Box */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                Simulation financière en direct
              </span>
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div>
                  <span className="text-xs text-slate-500">Montant net du pot remis au bénéficiaire :</span>
                  <p className="font-mono text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    {formatFCFA(netPotAmount)}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Votre gain de modérateur par tour :</span>
                  <p className="font-mono text-lg font-bold text-slate-900 dark:text-white">
                    +{formatFCFA(totalModDailyEarnings)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="justify-between">
            <Button
              variant="outline"
              size="md"
              onClick={() => setCurrentStep(1)}
              leftIcon={<ArrowLeft size={16} />}
            >
              Précédent
            </Button>
            <Button
              variant="emerald"
              size="md"
              onClick={() => setCurrentStep(3)}
              rightIcon={<ArrowRight size={16} />}
            >
              Étape suivante : Ordre des tours
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* STEP 3: ORDRE DES TOURS */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Étape 3 : Ordre d'attribution des pots ({selectedMembers.length} membres)</CardTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Organisez l'ordre de passage des participants en utilisant les flèches monter / descendre.
              </p>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              {selectedMembers.map((member, idx) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold font-mono text-xs flex items-center justify-center shrink-0">
                      #{member.turnOrder}
                    </span>
                    <Avatar name={member.name} size="xs" />
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                        {member.name}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400 truncate">
                        {member.phone}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveOrder(idx, 'up')}
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 cursor-pointer"
                      title="Monter"
                    >
                      <ArrowUp size={16} />
                    </button>
                    <button
                      type="button"
                      disabled={idx === selectedMembers.length - 1}
                      onClick={() => handleMoveOrder(idx, 'down')}
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 cursor-pointer"
                      title="Descendre"
                    >
                      <ArrowDown size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(member.id)}
                      className="p-1.5 text-rose-400 hover:text-rose-600 cursor-pointer ml-1"
                      title="Retirer"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>

          <CardFooter className="justify-between">
            <Button
              variant="outline"
              size="md"
              onClick={() => setCurrentStep(2)}
              leftIcon={<ArrowLeft size={16} />}
            >
              Précédent
            </Button>
            <Button
              variant="emerald"
              size="md"
              onClick={() => setCurrentStep(4)}
              rightIcon={<ArrowRight size={16} />}
            >
              Étape suivante : Invitations
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* STEP 4: INVITATIONS */}
      {currentStep === 4 && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Étape 4 : Invitation des participants</CardTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ajoutez d'autres membres par téléphone ou préparez le lien WhatsApp.
              </p>
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* Quick add form */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                Ajouter manuellement un participant
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Nom du membre"
                  placeholder="Ex: Marc Ndjock"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                />
                <Input
                  label="Numéro WhatsApp / Mobile Money"
                  placeholder="+237 6 xx xx xx xx"
                  value={newMemberPhone}
                  onChange={(e) => setNewMemberPhone(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddCustomMember}
                leftIcon={<Plus size={15} />}
              >
                Ajouter ce participant
              </Button>
            </div>

            {/* Share link snippet */}
            <div className="p-4 rounded-xl border border-dashed border-emerald-500/40 bg-emerald-50/20 dark:bg-emerald-950/20 space-y-2">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold text-xs">
                <Share2 size={16} />
                <span>Lien d'invitation prêt à l'emploi</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Dès la création, un lien direct sera généré pour que vos membres s'inscrivent et confirment leur tour depuis leur téléphone.
              </p>
            </div>
          </CardContent>

          <CardFooter className="justify-between">
            <Button
              variant="outline"
              size="md"
              onClick={() => setCurrentStep(3)}
              leftIcon={<ArrowLeft size={16} />}
            >
              Précédent
            </Button>
            <Button
              variant="emerald"
              size="md"
              onClick={() => setCurrentStep(5)}
              rightIcon={<ArrowRight size={16} />}
            >
              Étape suivante : Récapitulatif
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* STEP 5: RÉCAPITULATIF & CONFIRMATION */}
      {currentStep === 5 && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Étape 5 : Récapitulatif et lancement</CardTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Vérifiez tous les paramètres avant d'ouvrir officiellement les cotisations.
              </p>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                <span className="text-xs text-slate-500">Nom du groupe :</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">{name}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                <span className="text-xs text-slate-500">Cotisation par membre :</span>
                <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                  {formatFCFA(contributionAmount)} / tour
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                <span className="text-xs text-slate-500">Commission du modérateur :</span>
                <span className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {formatFCFA(calculatedCommission)} / membre ({formatFCFA(totalModDailyEarnings)} / tour)
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                <span className="text-xs text-slate-500">Nombre de participants :</span>
                <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                  {selectedMembers.length} membres
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Montant net du pot par bénéficiaire :</span>
                <span className="font-mono text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                  {formatFCFA(netPotAmount)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 text-xs">
              <ShieldCheck size={18} className="shrink-0" />
              <span>
                Le premier tour s'ouvrira immédiatement avec <strong>{selectedMembers[0]?.name}</strong> comme premier bénéficiaire.
              </span>
            </div>
          </CardContent>

          <CardFooter className="justify-between">
            <Button
              variant="outline"
              size="md"
              onClick={() => setCurrentStep(4)}
              leftIcon={<ArrowLeft size={16} />}
            >
              Précédent
            </Button>
            <Button
              variant="emerald"
              size="lg"
              onClick={handleFinalSubmit}
              rightIcon={<Sparkles size={18} />}
            >
              Lancer officiellement la tontine
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};
