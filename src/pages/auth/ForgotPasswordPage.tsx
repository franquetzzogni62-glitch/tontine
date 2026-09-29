import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ForgotPasswordPage: React.FC = () => {
  const { addToast } = useApp();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    addToast('Lien envoyé', 'Vérifiez votre boîte de réception ou vos spams.', 'info');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center p-4">
      <Link to="/" className="flex items-center gap-2 mb-8 group">
        <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
          TF
        </div>
        <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Tonti<span className="text-emerald-500">Flow</span>
        </span>
      </Link>

      <Card className="w-full max-w-md shadow-xl text-left">
        {!sent ? (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Mot de passe oublié ?
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Entrez votre adresse email pour recevoir les instructions de réinitialisation sécurisée.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Adresse email de votre compte"
                type="email"
                placeholder="nom@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail size={16} />}
                required
              />

              <Button
                type="submit"
                variant="emerald"
                size="md"
                className="w-full"
              >
                Envoyer le lien de réinitialisation
              </Button>
            </form>
          </>
        ) : (
          <div className="py-4 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto">
              <CheckCircle2 size={28} />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Email envoyé !
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Si un compte existe pour <strong>{email}</strong>, un lien sécurisé a été transmis.
            </p>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            <ArrowLeft size={14} /> Retour à la connexion
          </Link>
        </div>
      </Card>
    </div>
  );
};
