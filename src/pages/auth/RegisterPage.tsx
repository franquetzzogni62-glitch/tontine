import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import {
  Lock,
  Mail,
  User as UserIcon,
  Phone,
  ArrowRight,
  Building,
  CheckCircle2,
  Sparkles,
  Info,
  AlertCircle,
} from 'lucide-react';
import { SubscriptionPlanId } from '../../types';
import { formatFCFA } from '../../utils/formatters';

export const RegisterPage: React.FC = () => {
  const { registerModerator } = useApp();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [planId, setPlanId] = useState<SubscriptionPlanId>('pro');
  const [isLoading, setIsLoading] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);

  const plans = [
    {
      id: 'starter' as const,
      name: 'Starter',
      price: 5000,
      description: 'Idéal pour démarrer 1 à 3 tontines familiales ou entre amis.',
      limit: 'Jusqu\'à 3 tontines actives',
    },
    {
      id: 'pro' as const,
      name: 'Pro',
      price: 15000,
      description: 'Pour les promoteurs et gestionnaires actifs de tontines.',
      limit: 'Tontines illimitées',
      badge: 'Recommandé',
    },
    {
      id: 'enterprise' as const,
      name: 'Entreprise',
      price: 30000,
      description: 'Pour associations, mutuelles et grands réseaux de tontines.',
      limit: 'Multi-modérateurs & Marque blanche',
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError(null);

    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanPhone = phone.trim();

    if (!cleanName || !cleanEmail || !password) {
      setRegisterError('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    if (password.length < 6) {
      setRegisterError('Le mot de passe doit comporter au moins 6 caractères.');
      return;
    }

    setIsLoading(true);

    try {
      await registerModerator({
        name: cleanName,
        organizationName: organizationName.trim() || 'Réseau Tontines Indépendant',
        email: cleanEmail,
        phone: cleanPhone || '+237 6 00 00 00 00',
        password,
        planId,
      });

      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setRegisterError(err.message || 'Erreur lors de la création de compte.');
    } finally {
      setIsLoading(false);
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

      <Card className="w-full max-w-lg shadow-xl p-6 border border-slate-200 dark:border-slate-800 text-left">
        <div className="mb-5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold mb-2">
            <Sparkles size={13} />
            <span>Création d'espace Modérateur SaaS</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Créez votre compte Modérateur
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Lancez vos propres tontines, inscrivez vos membres et encaissez vos cotisations
            en toute conformité.
          </p>
        </div>

        {/* Informative notice for members */}
        <div className="p-3 mb-5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
          <Info size={16} className="shrink-0 mt-0.5 text-amber-600" />
          <div>
            <span className="font-bold block">Vous êtes membre / cotisant ?</span>
            <span>
              Vous n'avez pas besoin de créer un compte ici ! Votre modérateur vous remet un{' '}
              <strong>code secret à 6 chiffres</strong>.{' '}
              <Link to="/login" className="underline font-bold text-amber-700 dark:text-amber-200">
                Cliquez ici pour vous connecter avec votre code.
              </Link>
            </span>
          </div>
        </div>

        {registerError && (
          <div className="p-3 mb-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            <span>{registerError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Nom & Prénom du modérateur"
              placeholder="Ex: Jean Dupont"
              value={name}
              onChange={(e) => setName(e.target.value)}
              leftIcon={<UserIcon size={16} />}
              required
            />

            <Input
              label="Nom de votre Organisation / Tontine"
              placeholder="Ex: Club Épargne Solidarité"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              leftIcon={<Building size={16} />}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Téléphone Mobile Money (Réception)"
              type="tel"
              placeholder="+237 6 xx xx xx xx"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              leftIcon={<Phone size={16} />}
              required
            />

            <Input
              label="Adresse Email"
              type="email"
              placeholder="modérateur@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail size={16} />}
              required
            />
          </div>

          <Input
            label="Mot de passe secret"
            type="password"
            placeholder="Min. 6 caractères"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock size={16} />}
            required
          />

          {/* Subscription plan selection */}
          <div className="pt-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Choisissez votre formule d'abonnement mensuel (14 jours d'essai offerts) :
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {plans.map((p) => {
                const isSelected = planId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPlanId(p.id)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all relative ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    {p.badge && (
                      <span className="absolute -top-2 right-2 px-1.5 py-0.2 bg-emerald-600 text-white text-[9px] font-bold rounded-md">
                        {p.badge}
                      </span>
                    )}
                    <span className="text-xs font-bold block">{p.name}</span>
                    <span className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400 block mt-0.5">
                      {formatFCFA(p.price)}
                      <span className="text-[10px] font-normal text-slate-500">/mois</span>
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
                      {p.limit}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
              <CheckCircle2 size={12} className="text-emerald-500" />
              14 jours d'essai gratuit inclus. Aucun prélèvement immédiat requis.
            </p>
          </div>

          <Button
            type="submit"
            variant="emerald"
            size="md"
            className="w-full mt-4"
            isLoading={isLoading}
            rightIcon={<ArrowRight size={16} />}
          >
            Créer mon espace Modérateur
          </Button>
        </form>

        <div className="mt-5 text-center text-xs text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-4">
          Vous avez déjà un compte ?{' '}
          <Link
            to="/login"
            className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            Se connecter
          </Link>
        </div>
      </Card>
    </div>
  );
};
