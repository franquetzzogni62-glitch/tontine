import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  Users2,
  UserCheck,
  CreditCard,
  BarChart3,
  Settings,
  Sparkles,
  X,
  Plus,
  LogOut,
} from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { currentUser, logout, groups } = useApp();
  const navigate = useNavigate();

  const navLinks = [
    { to: '/dashboard', label: 'Tableau de bord', icon: <LayoutDashboard size={19} />, end: true },
    { to: '/dashboard/groups', label: 'Mes groupes', icon: <Users2 size={19} />, badge: groups.length },
    { to: '/dashboard/members', label: 'Membres', icon: <UserCheck size={19} /> },
    { to: '/dashboard/payments', label: 'Paiements', icon: <CreditCard size={19} /> },
    {
      to: '/dashboard/subscription',
      label: 'Mon Abonnement',
      icon: <Sparkles size={19} />,
      badge: currentUser?.subscription?.planName ? 'Actif' : undefined,
    },
    { to: '/dashboard/reports', label: 'Rapports & Stats', icon: <BarChart3 size={19} /> },
    { to: '/dashboard/settings', label: 'Paramètres', icon: <Settings size={19} /> },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-xs lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200/90 dark:border-slate-800 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="h-16 px-5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-base shadow-sm shadow-emerald-600/30">
              TF
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Tonti<span className="text-emerald-500">Flow</span>
            </span>
          </Link>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg lg:hidden"
            aria-label="Fermer le menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Action Button: Create New Group */}
        <div className="p-4 pb-2">
          <Link to="/dashboard/groups/new" onClick={onClose}>
            <Button
              variant="emerald"
              size="md"
              className="w-full shadow-sm shadow-emerald-600/20"
              leftIcon={<Plus size={17} />}
            >
              Créer une tontine
            </Button>
          </Link>
        </div>

        {/* Navigation links */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          <div className="px-3 pb-1 text-[11px] font-semibold text-slate-400 tracking-wider">
            GESTION & PILOTAGE
          </div>
          {navLinks.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <span className="shrink-0">{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                    item.badge === 'Actif'
                      ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </div>

        {/* User Card at bottom */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2">
          <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60">
            <div className="flex items-center gap-2.5 min-w-0">
              <Avatar
                name={currentUser?.name || 'Modérateur'}
                src={currentUser?.avatarUrl}
                size="sm"
              />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                  {currentUser?.name || 'Modérateur'}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {currentUser?.organizationName || 'Espace Modérateur'}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer shrink-0"
              title="Déconnexion"
            >
              <LogOut size={16} />
            </button>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-xs font-medium text-slate-600 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50/60 dark:hover:bg-rose-950/20 transition-colors cursor-pointer border border-transparent hover:border-rose-200 dark:hover:border-rose-900/40"
          >
            <LogOut size={14} />
            <span>Se déconnecter</span>
          </button>
        </div>
      </aside>
    </>
  );
};
