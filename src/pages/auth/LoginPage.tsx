import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import {
  Lock,
  Mail,
  ArrowRight,
  UserCheck,
  Shield,
  Smartphone,
  KeyRound,
  Info,
  Building,
  AlertCircle,
} from 'lucide-react';
import { formatAccessCode } from '../../utils/formatters';

export const LoginPage: React.FC = () => {
  const { loginMemberWithCode, loginModerator } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState<'member' | 'moderator'>('member');

  // Member login state (100% production : initialisé vide)
  const [memberPhone, setMemberPhone] = useState('');
  const [memberCode, setMemberCode] = useState('');
  const [isMemberLoading, setIsMemberLoading] = useState(false);
  const [memberError, setMemberError] = useState<string | null>(null);

  // Moderator login state (100% production : initialisé vide)
  const [moderatorEmail, setModeratorEmail] = useState('');
  const [moderatorPassword, setModeratorPassword] = useState('');
  const [isModLoading, setIsModLoading] = useState(false);
  const [modError, setModError] = useState<string | null>(null);

  const handleMemberLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMemberError(null);

    const cleanPhone = memberPhone.trim();
    const cleanCode = memberCode.replace(/\s+/g, '');

    if (!cleanPhone || !cleanCode) {
      setMemberError('Veuillez renseigner votre numéro de téléphone et votre code à 6 chiffres.');
      return;
    }

    setIsMemberLoading(true);

    try {
      const result = await loginMemberWithCode(cleanPhone, cleanCode);
      if (result.success) {
        const from = (location.state as any)?.from?.pathname || '/member';
        navigate(from, { replace: true });
      } else {
        setMemberError(
          result.error ||
            'Numéro ou code à 6 chiffres incorrect. Veuillez vérifier auprès de votre modérateur.'
        );
      }
    } catch (err: any) {
      setMemberError(err.message || 'Erreur de connexion. Veuillez réessayer.');
    } finally {
      setIsMemberLoading(false);
    }
  };

  const handleModeratorLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setModError(null);

    const cleanEmail = moderatorEmail.trim();
    const cleanPassword = moderatorPassword;

    if (!cleanEmail || !cleanPassword) {
      setModError('Veuillez renseigner votre adresse email et votre mot de passe.');
      return;
    }

    setIsModLoading(true);

    try {
      const result = await loginModerator(cleanEmail, cleanPassword);
      if (result.success) {
        const from = (location.state as any)?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      } else {
        setModError(result.error || 'Email ou mot de passe incorrect.');
      }
    } catch (err: any) {
      setModError(err.message || 'Erreur lors de la connexion modérateur.');
    } finally {
      setIsModLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center p-4 py-8">
      {/* Brand logo */}
      <Link to="/" className="flex items-center gap-2 mb-6 group">
        <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
          TF
        </div>
        <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Tonti<span className="text-emerald-500">Flow</span>
        </span>
      </Link>

      <Card className="w-full max-w-md shadow-xl overflow-hidden p-0 border border-slate-200 dark:border-slate-800">
        {/* Tab switch header */}
        <div className="grid grid-cols-2 border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/60 p-1.5 gap-1.5">
          <button
            type="button"
            onClick={() => {
              setActiveTab('member');
              setMemberError(null);
            }}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'member'
                ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <UserCheck size={16} />
            <span>Membre (Code 6 chiffres)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('moderator');
              setModError(null);
            }}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'moderator'
                ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Shield size={16} />
            <span>Modérateur SaaS</span>
          </button>
        </div>

        <div className="p-6">
          {/* ========================================================================= */}
          {/* TAB 1: MEMBRE LOGIN (PHONE + 6-DIGIT CODE) */}
          {/* ========================================================================= */}
          {activeTab === 'member' && (
            <div className="space-y-4 text-left">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Connexion Membre Cotisant
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Connectez-vous avec votre numéro et le code secret à 6 chiffres attribué par votre modérateur.
                </p>
              </div>

              {/* Informative alert */}
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2.5">
                <Info size={16} className="shrink-0 mt-0.5 text-emerald-600" />
                <span>
                  Vous appartenez à plusieurs tontines ? Saisissez le code à 6 chiffres unique de la tontine à consulter.
                </span>
              </div>

              {memberError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  <span>{memberError}</span>
                </div>
              )}

              <form onSubmit={handleMemberLogin} className="space-y-4">
                <Input
                  label="Numéro de téléphone Mobile Money"
                  type="tel"
                  placeholder="+237 6 xx xx xx xx"
                  value={memberPhone}
                  onChange={(e) => setMemberPhone(e.target.value)}
                  leftIcon={<Smartphone size={16} />}
                  required
                />

                <div>
                  <Input
                    label="Code secret d'accès à 6 chiffres"
                    placeholder="Ex: 482 910"
                    maxLength={7}
                    value={memberCode}
                    onChange={(e) => setMemberCode(formatAccessCode(e.target.value))}
                    leftIcon={<KeyRound size={16} />}
                    className="font-mono text-base tracking-widest font-bold"
                    required
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Code confidentiel à 6 chiffres remis lors de votre inscription par le modérateur.
                  </p>
                </div>

                <Button
                  type="submit"
                  variant="emerald"
                  size="md"
                  className="w-full mt-2"
                  isLoading={isMemberLoading}
                  rightIcon={<ArrowRight size={16} />}
                >
                  Accéder à ma tontine
                </Button>
              </form>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: MODÉRATEUR LOGIN (EMAIL + PASSWORD) */}
          {/* ========================================================================= */}
          {activeTab === 'moderator' && (
            <div className="space-y-4 text-left">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Connexion Espace Modérateur
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Accédez à votre tableau de bord, gérez vos tontines et encaissez vos cotisations.
                </p>
              </div>

              {modError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  <span>{modError}</span>
                </div>
              )}

              <form onSubmit={handleModeratorLogin} className="space-y-4">
                <Input
                  label="Adresse email du modérateur"
                  type="email"
                  placeholder="modérateur@exemple.com"
                  value={moderatorEmail}
                  onChange={(e) => setModeratorEmail(e.target.value)}
                  leftIcon={<Mail size={16} />}
                  required
                />

                <div>
                  <Input
                    label="Mot de passe"
                    type="password"
                    placeholder="••••••••"
                    value={moderatorPassword}
                    onChange={(e) => setModeratorPassword(e.target.value)}
                    leftIcon={<Lock size={16} />}
                    required
                  />
                  <div className="text-right mt-1.5">
                    <Link
                      to="/forgot-password"
                      className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                      Mot de passe oublié ?
                    </Link>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="emerald"
                  size="md"
                  className="w-full mt-2"
                  isLoading={isModLoading}
                  rightIcon={<ArrowRight size={16} />}
                >
                  Se connecter à mon tableau de bord
                </Button>
              </form>

              {/* Inscription nouveau modérateur */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
                <p className="text-xs text-slate-500 mb-2">
                  Vous souhaitez créer et modérer vos propres tontines ?
                </p>
                <Link to="/register">
                  <Button variant="outline" size="sm" className="w-full" leftIcon={<Building size={14} />}>
                    Créer mon compte Modérateur
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
