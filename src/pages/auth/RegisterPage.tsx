import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Lock, Mail, User as UserIcon, Phone, ArrowRight, Shield, UserCheck } from 'lucide-react';
import { UserRole } from '../../types';

export const RegisterPage: React.FC = () => {
  const { switchRole, setCurrentUser, addToast } = useApp();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+237 6 ');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('moderator');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setCurrentUser({
        id: `user_${Date.now()}`,
        name: name || 'Nouveau Modérateur',
        email: email || 'user@tontiflow.africa',
        phone: phone || '+237 6 00 00 00 00',
        role,
        city: 'Douala',
        country: 'Cameroun',
      });
      addToast('Compte créé avec succès', 'Bienvenue sur la plateforme TontiFlow !', 'success');

      if (role === 'moderator') {
        navigate('/dashboard');
      } else {
        navigate('/member');
      }
    }, 400);
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

      <Card className="w-full max-w-md shadow-xl">
        <div className="text-left mb-5">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Créer un compte TontiFlow
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Rejoignez des centaines de tontines modernisées en Afrique.
          </p>
        </div>

        {/* Role selection toggle */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 text-left">
            Vous souhaitez utiliser TontiFlow en tant que :
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setRole('moderator')}
              className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                role === 'moderator'
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-emerald-500" />
                <span className="text-xs font-bold">Modérateur</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                Je crée des groupes et perçois des commissions.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setRole('member')}
              className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                role === 'member'
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <UserCheck size={16} className="text-amber-500" />
                <span className="text-xs font-bold">Membre</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                Je cotise et reçois mon pot à mon tour.
              </p>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <Input
            label="Nom complet ou raison sociale"
            placeholder="Ex: Kouamé Serge"
            value={name}
            onChange={(e) => setName(e.target.value)}
            leftIcon={<UserIcon size={16} />}
            required
          />

          <Input
            label="Adresse email"
            type="email"
            placeholder="nom@exemple.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail size={16} />}
            required
          />

          <Input
            label="Numéro de téléphone (Mobile Money)"
            placeholder="+237 6 xx xx xx xx"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            leftIcon={<Phone size={16} />}
            required
            helperText="Nécessaire pour les notifications et les transferts."
          />

          <Input
            label="Mot de passe"
            type="password"
            placeholder="Minimum 8 caractères"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock size={16} />}
            required
          />

          <Button
            type="submit"
            variant="emerald"
            size="md"
            className="w-full mt-2"
            isLoading={isLoading}
            rightIcon={<ArrowRight size={16} />}
          >
            Créer mon compte ({role === 'moderator' ? 'Modérateur' : 'Membre'})
          </Button>
        </form>

        <div className="mt-5 text-center text-xs text-slate-500">
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
