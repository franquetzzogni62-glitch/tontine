import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Lock, Mail, ArrowRight, UserCheck, Shield } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { switchRole, addToast } = useApp();
  const navigate = useNavigate();

  const [email, setEmail] = useState('claire.mballa@tontiflow.africa');
  const [password, setPassword] = useState('••••••••');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      switchRole('moderator');
      addToast('Connexion réussie', 'Bienvenue sur votre espace de gestion TontiFlow.', 'success');
      navigate('/dashboard');
    }, 400);
  };

  const handleQuickLogin = (role: 'moderator' | 'member') => {
    switchRole(role);
    if (role === 'moderator') {
      navigate('/dashboard');
    } else {
      navigate('/member');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center p-4">
      {/* Brand logo */}
      <Link to="/" className="flex items-center gap-2 mb-8 group">
        <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
          TF
        </div>
        <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Tonti<span className="text-emerald-500">Flow</span>
        </span>
      </Link>

      <Card className="w-full max-w-md shadow-xl">
        <div className="text-left mb-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Connexion à votre compte
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Gérez vos tontines ou suivez vos cotisations en toute sérénité.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Adresse email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail size={16} />}
            required
          />

          <div>
            <Input
              label="Mot de passe"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            isLoading={isLoading}
            rightIcon={<ArrowRight size={16} />}
          >
            Se connecter
          </Button>
        </form>

        {/* Quick Demo Switchers */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block text-center mb-3">
            Accès démo rapide (1 clic)
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('moderator')}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-700 dark:text-slate-200 flex flex-col items-center gap-1 cursor-pointer transition-colors"
            >
              <Shield size={16} className="text-emerald-500" />
              <span>Vue Modérateur</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('member')}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-700 dark:text-slate-200 flex flex-col items-center gap-1 cursor-pointer transition-colors"
            >
              <UserCheck size={16} className="text-amber-500" />
              <span>Vue Membre</span>
            </button>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-slate-500">
          Pas encore de compte ?{' '}
          <Link
            to="/register"
            className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            Créer un compte
          </Link>
        </div>
      </Card>
    </div>
  );
};
