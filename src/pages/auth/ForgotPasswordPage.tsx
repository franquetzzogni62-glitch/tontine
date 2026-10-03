import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import {
  Mail,
  Smartphone,
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  Shield,
  Users,
  Copy,
  Lock,
  ArrowRight,
  RefreshCw,
  Building,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { formatAccessCode, formatFCFA } from '../../utils/formatters';

export const ForgotPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToast } = useApp();

  // 'moderator' or 'member'
  const initialRole = searchParams.get('tab') === 'member' ? 'member' : 'moderator';
  const [role, setRole] = useState<'moderator' | 'member'>(initialRole);

  // Moderator state
  const [modEmail, setModEmail] = useState('');
  const [modStep, setModStep] = useState<'request' | 'verify' | 'success'>('request');
  const [modOtp, setModOtp] = useState('');
  const [modOtpPreview, setModOtpPreview] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isModLoading, setIsModLoading] = useState(false);

  // Member state
  const [memPhone, setMemPhone] = useState('');
  const [memStep, setMemStep] = useState<'request' | 'verify' | 'result'>('request');
  const [memOtp, setMemOtp] = useState('');
  const [memOtpPreview, setMemOtpPreview] = useState<string | null>(null);
  const [isMemLoading, setIsMemLoading] = useState(false);
  const [memberTontines, setMemberTontines] = useState<
    Array<{
      groupId: string;
      groupName: string;
      contributionAmount: number;
      accessCode: string;
      moderatorName?: string;
    }>
  >([]);

  // Modification optionnelle de code secret membre
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [newMemberCode, setNewMemberCode] = useState('');
  const [isChangingCode, setIsChangingCode] = useState(false);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'member') setRole('member');
    else if (tab === 'moderator') setRole('moderator');
  }, [searchParams]);

  // --- Handlers Modérateur ---
  const handleRequestModeratorOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsModLoading(true);
    try {
      const res = await api.requestPasswordReset('moderator', modEmail);
      setModOtpPreview(res.otpPreview || null);
      if (res.otpPreview) setModOtp(res.otpPreview);
      setModStep('verify');
      addToast('Code généré', res.message, 'info');
    } catch (err: any) {
      addToast('Erreur', err.message || 'Impossible d\'envoyer le code.', 'error');
    } finally {
      setIsModLoading(false);
    }
  };

  const handleResetModeratorPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      addToast('Attention', 'Le mot de passe doit comporter au moins 6 caractères.', 'warning');
      return;
    }
    if (newPassword !== confirmPassword) {
      addToast('Attention', 'Les deux mots de passe ne correspondent pas.', 'warning');
      return;
    }

    setIsModLoading(true);
    try {
      const res = await api.resetModeratorPassword(modEmail, modOtp, newPassword);
      setModStep('success');
      addToast('Succès !', res.message, 'success');
    } catch (err: any) {
      addToast('Erreur', err.message || 'Échec de la réinitialisation.', 'error');
    } finally {
      setIsModLoading(false);
    }
  };

  // --- Handlers Membre ---
  const handleRequestMemberOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsMemLoading(true);
    try {
      const res = await api.requestPasswordReset('member', memPhone);
      setMemOtpPreview(res.otpPreview || null);
      if (res.otpPreview) setMemOtp(res.otpPreview);
      setMemStep('verify');
      addToast('Code SMS transmis', res.message, 'info');
    } catch (err: any) {
      addToast('Erreur', err.message || 'Numéro introuvable dans les tontines.', 'error');
    } finally {
      setIsMemLoading(false);
    }
  };

  const handleVerifyMemberOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsMemLoading(true);
    try {
      const res = await api.verifyResetOtp(memPhone, memOtp);
      if (res.tontines && res.tontines.length > 0) {
        setMemberTontines(res.tontines);
        setMemStep('result');
        addToast('Vérification réussie', 'Vos codes d\'accès secrets sont disponibles ci-dessous.', 'success');
      } else {
        throw new Error('Aucune tontine active trouvée pour ce numéro.');
      }
    } catch (err: any) {
      addToast('Erreur', err.message || 'Code de vérification invalide.', 'error');
    } finally {
      setIsMemLoading(false);
    }
  };

  const handleUpdateMemberCode = async (groupId: string) => {
    const clean = newMemberCode.replace(/\D/g, '');
    if (clean.length !== 6) {
      addToast('Erreur', 'Le nouveau code doit comporter exactement 6 chiffres.', 'warning');
      return;
    }

    setIsChangingCode(true);
    try {
      const res = await api.resetMemberAccessCode(memPhone, memOtp, groupId, clean);
      setMemberTontines((prev) =>
        prev.map((t) => (t.groupId === groupId ? { ...t, accessCode: clean } : t))
      );
      setEditingGroupId(null);
      setNewMemberCode('');
      addToast('Code mis à jour !', res.message, 'success');
    } catch (err: any) {
      addToast('Erreur', err.message || 'Impossible de mettre à jour le code.', 'error');
    } finally {
      setIsChangingCode(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center p-4">
      {/* Brand Header */}
      <Link to="/" className="flex items-center gap-2 mb-6 group">
        <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
          TF
        </div>
        <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Tonti<span className="text-emerald-500">Flow</span>
        </span>
      </Link>

      <Card className="w-full max-w-lg shadow-xl text-left p-6 sm:p-7">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6">
          <button
            type="button"
            onClick={() => {
              setRole('moderator');
              setModStep('request');
            }}
            className={`flex-1 py-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors cursor-pointer ${
              role === 'moderator'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            <Shield size={16} />
            <span>Modérateur (Mot de passe)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setRole('member');
              setMemStep('request');
            }}
            className={`flex-1 py-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors cursor-pointer ${
              role === 'member'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            <Users size={16} />
            <span>Membre (Code d'accès)</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1 : RÉCUPÉRATION DU MOT DE PASSE MODÉRATEUR */}
        {/* ========================================================================= */}
        {role === 'moderator' && (
          <div className="space-y-4">
            {modStep === 'request' && (
              <>
                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Réinitialiser mon mot de passe Modérateur
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Indiquez votre adresse email de connexion pour recevoir un code de vérification sécurisé à 6 chiffres.
                  </p>
                </div>

                <form onSubmit={handleRequestModeratorOtp} className="space-y-4 pt-2">
                  <Input
                    label="Adresse email modérateur"
                    type="email"
                    placeholder="amadou@exemple.com"
                    value={modEmail}
                    onChange={(e) => setModEmail(e.target.value)}
                    leftIcon={<Mail size={16} />}
                    required
                  />

                  <Button
                    type="submit"
                    variant="emerald"
                    size="md"
                    className="w-full font-bold text-xs"
                    isLoading={isModLoading}
                  >
                    Obtenir le code de réinitialisation
                  </Button>
                </form>
              </>
            )}

            {modStep === 'verify' && (
              <>
                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Nouveau mot de passe modérateur
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Saisissez le code de vérification transmis à <strong>{modEmail}</strong> et choisissez votre nouveau mot de passe.
                  </p>
                </div>

                {modOtpPreview && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-emerald-600 block">Code de vérification :</span>
                      <strong className="font-mono text-base font-black tracking-widest">{modOtpPreview}</strong>
                    </div>
                    <span className="text-[10px] text-emerald-600 font-medium">Valide 15 min</span>
                  </div>
                )}

                <form onSubmit={handleResetModeratorPassword} className="space-y-3.5 pt-1">
                  <Input
                    label="Code de vérification à 6 chiffres"
                    placeholder="Ex: 582910"
                    maxLength={6}
                    value={modOtp}
                    onChange={(e) => setModOtp(e.target.value.replace(/\D/g, ''))}
                    leftIcon={<KeyRound size={16} />}
                    className="font-mono tracking-widest font-bold"
                    required
                  />

                  <Input
                    label="Nouveau mot de passe (min 6 caractères)"
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    leftIcon={<Lock size={16} />}
                    required
                  />

                  <Input
                    label="Confirmer le nouveau mot de passe"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    leftIcon={<Lock size={16} />}
                    required
                  />

                  <div className="pt-2 flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="md"
                      onClick={() => setModStep('request')}
                    >
                      Retour
                    </Button>
                    <Button
                      type="submit"
                      variant="emerald"
                      size="md"
                      className="flex-1 font-bold text-xs"
                      isLoading={isModLoading}
                    >
                      Enregistrer mon nouveau mot de passe
                    </Button>
                  </div>
                </form>
              </>
            )}

            {modStep === 'success' && (
              <div className="py-6 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 size={32} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Mot de passe réinitialisé !
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                    Votre mot de passe modérateur a été mis à jour avec succès. Vous pouvez maintenant vous connecter à votre tableau de bord.
                  </p>
                </div>

                <Button
                  variant="emerald"
                  size="md"
                  className="w-full font-bold text-xs"
                  onClick={() => navigate('/login?tab=moderator')}
                  rightIcon={<ArrowRight size={16} />}
                >
                  Me connecter à l'Espace Modérateur
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2 : RÉCUPÉRATION DU CODE D'ACCÈS MEMBRE */}
        {/* ========================================================================= */}
        {role === 'member' && (
          <div className="space-y-4">
            {memStep === 'request' && (
              <>
                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Retrouver mon code secret Membre
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Saisissez votre numéro de téléphone Mobile Money pour récupérer vos codes secrets d'accès à vos tontines actives.
                  </p>
                </div>

                <form onSubmit={handleRequestMemberOtp} className="space-y-4 pt-2">
                  <Input
                    label="Numéro de téléphone Mobile Money"
                    type="tel"
                    placeholder="+237 6 xx xx xx xx"
                    value={memPhone}
                    onChange={(e) => setMemPhone(e.target.value)}
                    leftIcon={<Smartphone size={16} />}
                    required
                  />

                  <Button
                    type="submit"
                    variant="emerald"
                    size="md"
                    className="w-full font-bold text-xs"
                    isLoading={isMemLoading}
                  >
                    Vérifier mon numéro & Retrouver mes codes
                  </Button>
                </form>
              </>
            )}

            {memStep === 'verify' && (
              <>
                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Vérification par SMS
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Entrez le code de sécurité transmis au <strong>{memPhone}</strong> pour déverrouiller vos codes d'accès.
                  </p>
                </div>

                {memOtpPreview && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-emerald-600 block">Code SMS de validation :</span>
                      <strong className="font-mono text-base font-black tracking-widest">{memOtpPreview}</strong>
                    </div>
                    <span className="text-[10px] text-emerald-600 font-medium">Instantané</span>
                  </div>
                )}

                <form onSubmit={handleVerifyMemberOtp} className="space-y-4 pt-1">
                  <Input
                    label="Code de confirmation"
                    placeholder="Ex: 849201"
                    maxLength={6}
                    value={memOtp}
                    onChange={(e) => setMemOtp(e.target.value.replace(/\D/g, ''))}
                    leftIcon={<KeyRound size={16} />}
                    className="font-mono tracking-widest font-bold"
                    required
                  />

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="md"
                      onClick={() => setMemStep('request')}
                    >
                      Retour
                    </Button>
                    <Button
                      type="submit"
                      variant="emerald"
                      size="md"
                      className="flex-1 font-bold text-xs"
                      isLoading={isMemLoading}
                    >
                      Afficher mes codes secrets
                    </Button>
                  </div>
                </form>
              </>
            )}

            {memStep === 'result' && (
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 flex items-center gap-2.5">
                  <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                      Identité validée pour {memPhone}
                    </h4>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                      Voici les codes d'accès secrets associés à vos tontines :
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {memberTontines.map((t) => {
                    const isEditing = editingGroupId === t.groupId;

                    return (
                      <div
                        key={t.groupId}
                        className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2.5 shadow-2xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                              <Building size={16} />
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                                {t.groupName}
                              </h4>
                              <p className="text-[10px] text-slate-400">
                                Cotisation : {formatFCFA(t.contributionAmount)} · Modérateur : {t.moderatorName || 'Responsable'}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              if (isEditing) {
                                setEditingGroupId(null);
                              } else {
                                setEditingGroupId(t.groupId);
                                setNewMemberCode('');
                              }
                            }}
                            className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 underline cursor-pointer"
                          >
                            {isEditing ? 'Annuler' : 'Changer ce code'}
                          </button>
                        </div>

                        {!isEditing ? (
                          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between">
                            <div>
                              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Votre code secret d'accès :</span>
                              <strong className="font-mono text-base font-black text-emerald-600 dark:text-emerald-400 tracking-widest">
                                {formatAccessCode(t.accessCode)}
                              </strong>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard?.writeText(t.accessCode.replace(/\D/g, ''));
                                  addToast('Code copié !', `Code ${t.accessCode} copié dans votre presse-papier.`, 'success');
                                }}
                                className="p-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:text-emerald-600 transition-colors cursor-pointer"
                                title="Copier mon code"
                              >
                                <Copy size={13} />
                              </button>

                              <Button
                                size="sm"
                                variant="emerald"
                                className="text-xs font-bold px-2.5"
                                onClick={() => {
                                  navigate(`/login?tab=member&phone=${encodeURIComponent(memPhone)}&code=${encodeURIComponent(t.accessCode.replace(/\D/g, ''))}`);
                                }}
                                rightIcon={<ArrowRight size={13} />}
                              >
                                Me connecter
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-emerald-500/40 space-y-2">
                            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block">
                              Définir un nouveau code secret personnel (6 chiffres) :
                            </span>
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                maxLength={6}
                                placeholder="Ex: 940215"
                                value={newMemberCode}
                                onChange={(e) => setNewMemberCode(e.target.value.replace(/\D/g, ''))}
                                className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-bold tracking-widest"
                              />
                              <Button
                                size="sm"
                                variant="emerald"
                                className="text-xs font-bold"
                                isLoading={isChangingCode}
                                onClick={() => handleUpdateMemberCode(t.groupId)}
                              >
                                Valider
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="md"
                    className="w-full text-xs font-bold"
                    onClick={() => navigate('/login?tab=member')}
                  >
                    Retour à la page de connexion
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Back Link */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            <ArrowLeft size={14} /> Retour à l'accueil de connexion
          </Link>
        </div>
      </Card>
    </div>
  );
};
