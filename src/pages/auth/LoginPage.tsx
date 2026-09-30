import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  CheckCircle2,
  Building,
} from 'lucide-react';
import { formatAccessCode } from '../../utils/formatters';

export const LoginPage: React.FC = () => {
  const { loginMemberWithCode, switchRole, addToast } = useApp();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'member' | 'moderator'>('member');

  // Member login state
  const [memberPhone, setMemberPhone] = useState('+237 6 75 12 34 56');
  const [memberCode, setMemberCode] = useState('482 910');
  const [isMemberLoading, setIsMemberLoading] = useState(false);
  const [memberError, setMemberError] = useState<string | null>(null);

  // Moderator login state
  const [moderatorEmail, setModeratorEmail] = useState('claire.mballa@tontiflow.africa');
  const [moderatorPassword, setModeratorPassword] = useState('••••••••');
  const [isModLoading, setIsModLoading] = useState(false);

  const handleMemberLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMemberError(null);
    setIsMemberLoading(true);

    try {
      const result = await loginMemberWithCode(memberPhone, memberCode);
      if (result.success) {
        navigate('/member');
      } else {
        setMemberError(
          result.error ||
            'Numéro ou code à 6 chiffres incorrect. Veuillez vérifier auprès de votre modérateur.'
        );
      }
    } catch (err: any) {
      setMemberError('Erreur de connexion. Veuillez réessayer.');
    } finally {
      setIsMemberLoading(false);
    }
  };

  const handleModeratorLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsModLoading(true);

    setTimeout(() => {
      setIsModLoading(false);
      switchRole('moderator');
      addToast(
        'Connexion Modérateur réussie',
        'Bienvenue sur votre espace de gestion TontiFlow.',
        'success'
      );
      navigate('/dashboard');
    }, 400);
  };

  const fillMemberDemo = (phone: string, code: string) => {
    setMemberPhone(phone);
    setMemberCode(formatAccessCode(code));
    setMemberError(null);
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
            onClick={() => setActiveTab('member')}
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
            onClick={() => setActiveTab('moderator')}
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
                  Seul votre modérateur vous inscrit et vous remet votre code secret à 6 chiffres.
                </p>
              </div>

              {/* Informative alert */}
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2.5">
                <Info size={16} className="shrink-0 mt-0.5 text-emerald-600" />
                <span>
                  Vous appartenez à plusieurs tontines avec le même numéro ? Saisissez le code à 6
                  chiffres de la tontine à consulter.
                </span>
              </div>

              {memberError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300">
                  {memberError}
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
                    Code unique à 6 chiffres remis par le promoteur / modérateur du groupe.
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

              {/* Quick Multi-Group Demo chips */}
              <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Tester le multi-groupes (même numéro, 2 codes distincts) :
                </span>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => fillMemberDemo('+237 6 75 12 34 56', '482910')}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 bg-slate-50 dark:bg-slate-800/40 text-left text-xs transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">
                        Tontine 1 : Solidarité Douala
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Amadou Bello (+237 6 75 12 34 56)
                      </span>
                    </div>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20">
                      Code : 482 910
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fillMemberDemo('+237 6 75 12 34 56', '739150')}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 bg-slate-50 dark:bg-slate-800/40 text-left text-xs transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">
                        Tontine 2 : Commerçants Bonanjo
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Même numéro (+237 6 75 12 34 56)
                      </span>
                    </div>
                    <span className="font-mono font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-2 py-0.5 rounded border border-teal-500/20">
                      Code : 739 150
                    </span>
                  </button>
                </div>
              </div>
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
                  Accédez à votre tableau de bord, gérez vos tontines et encaissez vos commissions.
                </p>
              </div>

              <form onSubmit={handleModeratorLogin} className="space-y-4">
                <Input
                  label="Email ou Numéro du modérateur"
                  type="text"
                  value={moderatorEmail}
                  onChange={(e) => setModeratorEmail(e.target.value)}
                  leftIcon={<Mail size={16} />}
                  required
                />

                <div>
                  <Input
                    label="Mot de passe"
                    type="password"
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

              {/* Call to register new moderator */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
                <p className="text-xs text-slate-500 mb-2">
                  Vous souhaitez créer et modérer vos propres tontines ?
                </p>
                <Link to="/register">
                  <Button variant="outline" size="sm" className="w-full" leftIcon={<Building size={14} />}>
                    Créer mon compte Modérateur (14 jours d'essai)
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
