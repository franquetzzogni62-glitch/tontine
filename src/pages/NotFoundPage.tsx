import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Home, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-mono font-bold text-2xl mb-4">
        404
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
        Page non trouvée
      </h1>

      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mt-2 mb-6">
        La page que vous recherchez n'existe pas ou a été déplacée.
      </p>

      <div className="flex items-center gap-3">
        <Link to="/">
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft size={15} />}>
            Retour à l'accueil
          </Button>
        </Link>
        <Link to="/dashboard">
          <Button variant="emerald" size="sm" leftIcon={<Home size={15} />}>
            Tableau de bord
          </Button>
        </Link>
      </div>
    </div>
  );
};
