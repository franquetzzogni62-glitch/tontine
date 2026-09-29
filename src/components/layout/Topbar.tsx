import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Menu, Sun, Moon, Bell, Check, ArrowRightLeft, Sparkles } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { formatDateTime } from '../../utils/formatters';

interface TopbarProps {
  onOpenSidebar: () => void;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const Topbar: React.FC<TopbarProps> = ({
  onOpenSidebar,
  title,
  subtitle,
  action,
}) => {
  const {
    theme,
    toggleTheme,
    currentUser,
    switchRole,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    isBackendConnected,
  } = useApp();

  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Close notifications dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/90 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between transition-colors">
      {/* Left zone: Mobile trigger & breadcrumb / title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="p-2 -ml-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl lg:hidden cursor-pointer"
          aria-label="Ouvrir le menu"
        >
          <Menu size={20} />
        </button>

        {title && (
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="hidden sm:block text-xs text-slate-500 dark:text-slate-400">
                {subtitle}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Right zone: Actions, notifications, theme toggle, profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {action && <div className="hidden sm:block">{action}</div>}

        {/* Backend live indicator */}
        <div
          className={`hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border ${
            isBackendConnected
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
          }`}
          title={isBackendConnected ? 'Backend Express /api connecté' : 'Mode hors-ligne'}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isBackendConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
            }`}
          />
          <span>{isBackendConnected ? 'Serveur API Connecté' : 'Mode Local'}</span>
        </div>

        {/* Role toggle badge */}
        <button
          onClick={() => switchRole(currentUser.role === 'moderator' ? 'member' : 'moderator')}
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 hover:border-emerald-500 transition-colors cursor-pointer"
          title="Basculer rapidement entre rôle Modérateur et Membre"
        >
          <ArrowRightLeft size={13} className="text-emerald-500" />
          <span>{currentUser.role === 'moderator' ? 'Vue Modérateur' : 'Vue Membre'}</span>
        </button>

        {/* Dark mode button */}
        <button
          onClick={toggleTheme}
          aria-label="Basculer le thème"
          className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            aria-label="Voir les notifications"
            className="relative p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-3 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between px-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                    Notifications
                  </h3>
                  {unreadCount > 0 && (
                    <span className="font-mono text-[10px] px-1.5 py-0.2 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold rounded-md">
                      {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllNotificationsAsRead}
                    className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    Tout marquer comme lu
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">
                    Aucune notification
                  </p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markNotificationAsRead(n.id)}
                      className={`p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${
                        !n.read ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                          {n.title}
                        </h4>
                        {!n.read && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-2">
                        {n.message}
                      </p>
                      <span className="text-[10px] text-slate-400 block mt-1">
                        {formatDateTime(n.timestamp)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
          <Avatar
            name={currentUser.name}
            src={currentUser.avatarUrl}
            size="sm"
          />
          <div className="hidden sm:block text-left">
            <span className="text-xs font-semibold text-slate-900 dark:text-white block leading-tight">
              {currentUser.name}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
              {currentUser.role === 'moderator' ? 'Modérateur' : 'Membre'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
