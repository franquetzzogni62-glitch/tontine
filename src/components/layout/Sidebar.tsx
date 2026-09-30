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
  ArrowRightLeft,
  X,
  ExternalLink,
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
  const { currentUser, switchRole, logout, groups } = useApp();
  const navigate = useNavigate();

  const navLinks = [
    { to: '/dashboard', label: 'Tableau de bord', icon: <LayoutDashboard size={19} />, end: true },
    { to: '/dashboard/groups', label: 'Mes groupes', icon: <Users2 size={19} />, badge: groups.length },
    { to: '/dashboard/members', label: 'Membres', icon: <UserCheck size={19} /> },
    { to: '/dashboard/payments', label: 'Paiements', icon: <CreditCard size={19} /> },
    { to: '/dashboard/reports', label: 'Rapports & Stats', icon: <BarChart3 size={19} /> },
    { to: '/dashboard/settings', label: 'Paramètres', icon: <Settings size={19} /> },
  ];

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
        <div className="h-16 px-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-base shadow-xs">
              TF
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white leading-none block">
                Tonti<span className="text-emerald-500">Flow</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium tracking-wide">
                Espace Modérateur
              </span>
            </div>
          </Link>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 lg:hidden cursor-pointer"
            aria-label="Fermer la navigation"
          >
            <X size={20} />
          </button>
        </div>

        {/* Action Button */}
        <div className="p-4 pb-2">
          <Link to="/dashboard/groups/new" onClick={() => onClose()}>
            <Button
              variant="emerald"
              size="sm"
              className="w-full justify-center shadow-xs"
              leftIcon={<Plus size={16} />}
            >
              Nouveau groupe
            </Button>
          </Link>
        </div>

        {/* Navigation list */}
        <div className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 tracking-wider">
            GESTION
          </div>
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              onClick={() => onClose()}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group select-none ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-emerald-500/15 dark:text-emerald-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <span className="shrink-0">{link.icon}</span>
                <span>{link.label}</span>
              </div>
              {link.badge !== undefined && (
                <span className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {link.badge}
                </span>
              )}
            </NavLink>
          ))}

          {/* Quick link to Member view */}
          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80">
            <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 tracking-wider">
              VUE APPRENANT / PARTICIPANT
            </div>
            <Link
              to="/member"
              onClick={() => {
                switchRole('member');
                onClose();
              }}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Sparkles size={16} />
                <span>Portail Membre</span>
              </div>
              <ExternalLink size={13} />
            </Link>
          </div>
        </div>

        {/* User Card at bottom */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2">
          <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60">
            <div className="flex items-center gap-2.5 min-w-0">
              <Avatar
                name={currentUser.name}
                src={currentUser.avatarUrl}
                size="sm"
              />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                  {currentUser.name}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {currentUser.role === 'moderator' ? 'Modérateur' : 'Membre'} · {currentUser.city}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => switchRole(currentUser.role === 'moderator' ? 'member' : 'moderator')}
                className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                title="Basculer vers la vue Membre"
              >
                <ArrowRightLeft size={15} />
              </button>
              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                title="Déconnexion"
              >
                <LogOut size={15} />
              </button>
            </div>
          </div>

          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-xs font-medium text-slate-600 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50/60 dark:hover:bg-rose-950/20 transition-colors cursor-pointer border border-transparent hover:border-rose-200 dark:hover:border-rose-900/40"
          >
            <LogOut size={13} />
            <span>Se déconnecter</span>
          </button>
        </div>
      </aside>
    </>
  );
};
