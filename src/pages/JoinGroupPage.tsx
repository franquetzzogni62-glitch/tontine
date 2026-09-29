import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { formatFCFA, formatDate } from '../utils/formatters';
import {
  Users2,
  Calendar,
  Coins,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  UserPlus,
  Phone,
  User as UserIcon,
  Sparkles,
} from 'lucide-react';

export const JoinGroupPage: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { groups, currentUser, setCurrentUser, addMember, updateGroup, addToast } = useApp();

  const group = groups.find((g) => g.id === groupId) || groups[0];

  const [fullName, setFullName] = useState(currentUser?.name !== 'Nouveau Modérateur' ? currentUser?.name || '' : '');
  const [phone, setPhone] = useState(currentUser?.phone || '+237 6 ');
  const [city, setCity] = useState(currentUser?.city || 'Douala');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if member already in group
  const isAlreadyMember = group?.members.some(
    (m) => m.memberId === currentUser?.id || (currentUser?.phone && m.memberId === currentUser?.id)
  );

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!group) return;

    if (!fullName.trim()) {
      addToast('Nom requis', 'Veuillez saisir votre nom complet.', 'warning');
      return;
    }
    if (!phone.trim() || phone.trim() === '+237 6') {
      addToast('Numéro Mobile Money requis', 'Renseignez votre numéro pour recevoir vos fonds.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const newUserId = currentUser?.id && currentUser.id !== 'mod_1' ? currentUser.id : `mem_${Date.now()}`;

      // Register or update member in global state
      const newMember = await addMember({
        name: fullName.trim(),
        phone: phone.trim(),
        email: `${fullName.toLowerCase().replace(/\s+/g, '.')}@tontiflow.africa`,
        city: city.trim() || 'Douala',
        trustScore: 90,
        kycStatus: 'pending',
        joinedDate: new Date().toISOString().split('T')[0],
        groupsCount: 1,
        totalContributed: 0,
        totalReceived: 0,
        status: 'active',
        presenceValidated: true,
      });

      // Update current user session to this member
      setCurrentUser({
        id: newMember.id || newUserId,
        name: fullName.trim(),
        email: newMember.email,
        phone: phone.trim(),
        role: 'member',
        trustScore: 90,
        kycStatus: 'pending',
        city: city.trim() || 'Douala',
        country: 'Cameroun',
      });

      // Add to group's members & beneficiarySchedule if not already there
      const currentMembers = group.members || [];
      const newOrder = currentMembers.length + 1;

      const updatedMembers = [
        ...currentMembers,
        {
          memberId: newMember.id || newUserId,
          turnOrder: newOrder,
          hasPaidToday: false,
          totalContributedInGroup: 0,
          presenceValidated: true,
          status: 'ACTIVE' as const,
        },
      ];

      const updatedSchedule = [
        ...(group.beneficiarySchedule || []),
        {
          order: newOrder,
          memberId: newMember.id || newUserId,
          memberName: fullName.trim(),
          memberPhone: phone.trim(),
          scheduledDate: new Date(Date.now() + newOrder * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          potAmount: (group.contributionAmount - group.moderatorCommission) * updatedMembers.length,
          status: 'upcoming' as const,
        },
      ];

      await updateGroup(group.id, {
        totalMembersCount: updatedMembers.length,
        members: updatedMembers,
        beneficiarySchedule: updatedSchedule,
      });

      addToast(
        'Félicitations ! 🎉',
        `Vous avez rejoint la tontine "${group.name}". Votre tour est le N°${newOrder}.`,
        'success'
      );

      navigate('/member');
    } catch (err: any) {
      addToast('Erreur', err?.message || "Impossible d'intégrer le groupe.", 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!group) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Tontine introuvable</h2>
          <p className="text-sm text-slate-500 mb-4">Ce lien d'invitation est invalide ou a expiré.</p>
          <Link to="/">
            <Button>Retour à l'accueil</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const potEstimate = (group.contributionAmount - group.moderatorCommission) * (group.totalMembersCount || 10);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-center items-center p-4 py-10">
      {/* Brand logo */}
      <Link to="/" className="flex items-center gap-2 mb-6">
        <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
          TF
        </div>
        <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Tonti<span className="text-emerald-500">Flow</span>
        </span>
      </Link>

      <Card className="w-full max-w-lg shadow-2xl border-slate-200/90 dark:border-slate-800">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center justify-between">
            <Badge variant="success" className="text-xs">
              Invitation officielle
            </Badge>
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <ShieldCheck size={14} className="text-emerald-500" /> Sécurisé par SasPay
            </span>
          </div>
          <CardTitle className="text-xl sm:text-2xl font-bold mt-2 text-slate-900 dark:text-white">
            Rejoindre "{group.name}"
          </CardTitle>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {group.description || 'Tontine solidaire automatisée sur TontiFlow.'}
          </p>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {/* Key figures grid */}
          <div className="grid grid-cols-3 gap-2.5 p-3.5 bg-slate-100/70 dark:bg-slate-900/60 rounded-xl border border-slate-200/70 dark:border-slate-800 text-center">
            <div>
              <p className="text-[10px] uppercase font-semibold text-slate-500">Cotisation</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                {formatFCFA(group.contributionAmount)}
              </p>
              <p className="text-[10px] text-slate-400 capitalize">{group.frequency}</p>
            </div>
            <div className="border-x border-slate-200 dark:border-slate-800 px-1">
              <p className="text-[10px] uppercase font-semibold text-emerald-600 dark:text-emerald-400">
                Cagnotte Pot
              </p>
              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {formatFCFA(potEstimate)}
              </p>
              <p className="text-[10px] text-slate-400">À remporter</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-semibold text-slate-500">Membres</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                {group.members.length} / {group.totalMembersCount}
              </p>
              <p className="text-[10px] text-slate-400">Inscrits</p>
            </div>
          </div>

          {isAlreadyMember ? (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-3">
              <CheckCircle2 size={32} className="mx-auto text-emerald-600 dark:text-emerald-400" />
              <div>
                <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                  Vous participez déjà à cette tontine !
                </h3>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">
                  Accédez à votre espace pour voir votre calendrier de passage et effectuer vos paiements.
                </p>
              </div>
              <Button
                className="w-full"
                onClick={() => navigate('/member')}
                rightIcon={<ArrowRight size={16} />}
              >
                Aller sur mon portail membre
              </Button>
            </div>
          ) : (
            <form onSubmit={handleJoin} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Votre nom complet
                </label>
                <Input
                  placeholder="Ex: Paul Biya, Fatou Diallo..."
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  leftIcon={<UserIcon size={16} className="text-slate-400" />}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Numéro Mobile Money (pour recevoir la cagnotte)
                </label>
                <Input
                  type="tel"
                  placeholder="+237 6 99 00 11 22"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  leftIcon={<Phone size={16} className="text-slate-400" />}
                  required
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Orange Money, MTN MoMo ou Wave. Utilisé pour vos encaissements et versements.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Ville de résidence
                </label>
                <Input
                  placeholder="Ex: Douala, Yaoundé, Dakar..."
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  isLoading={isSubmitting}
                  className="w-full h-12 text-sm font-bold shadow-md shadow-emerald-600/20"
                  rightIcon={<ArrowRight size={16} />}
                >
                  Confirmer et rejoindre la tontine
                </Button>
              </div>

              <p className="text-[11px] text-center text-slate-500 dark:text-slate-400">
                En rejoignant, vous acceptez le règlement du groupe et l'engagement de cotisation solidaire.
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
