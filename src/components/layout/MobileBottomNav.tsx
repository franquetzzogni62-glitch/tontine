import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users2, CreditCard, UserCheck, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const MobileBottomNav: React.FC = () => {
  const { currentUser } = useApp();

  const isModerator = currentUser.role === 'moderator';

  return (
    <nav
      aria-label="Navigation mobile"
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 transition-colors safe-area-bottom"
    >
      <div className="grid grid-cols-5 items-center h-15 max-w-md mx-auto px-2">
        <NavLink
          to="/dashboard"
          end
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-1 transition-colors select-none ${
              isActive
                ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`
          }
        >
          <LayoutDashboard size={20} />
          <span className="text-[10px] tracking-tight mt-1">Accueil</span>
        </NavLink>

        <NavLink
          to="/dashboard/groups"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-1 transition-colors select-none ${
              isActive
                ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`
          }
        >
          <Users2 size={20} />
          <span className="text-[10px] tracking-tight mt-1">Groupes</span>
        </NavLink>

        <NavLink
          to="/dashboard/payments"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-1 transition-colors select-none ${
              isActive
                ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`
          }
        >
          <CreditCard size={20} />
          <span className="text-[10px] tracking-tight mt-1">Paiements</span>
        </NavLink>

        <NavLink
          to="/dashboard/members"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-1 transition-colors select-none ${
              isActive
                ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`
          }
        >
          <UserCheck size={20} />
          <span className="text-[10px] tracking-tight mt-1">Membres</span>
        </NavLink>

        <NavLink
          to="/member"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-1 transition-colors select-none ${
              isActive
                ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`
          }
        >
          <Sparkles size={20} />
          <span className="text-[10px] tracking-tight mt-1">Mon Tour</span>
        </NavLink>
      </div>
    </nav>
  );
};
