import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Member, TontineGroup, PaymentTransaction, AppNotification, ToastMessage, UserRole } from '../types';
import { CURRENT_MODERATOR, CURRENT_MEMBER, MOCK_MEMBERS, MOCK_GROUPS, generateMockTransactions, MOCK_NOTIFICATIONS } from '../mocks/data';
import { api } from '../services/api';

interface AppContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  currentUser: User;
  switchRole: (role: UserRole) => void;
  setCurrentUser: (user: User) => void;

  groups: TontineGroup[];
  addGroup: (group: Omit<TontineGroup, 'id'>) => Promise<TontineGroup>;
  updateGroup: (id: string, updates: Partial<TontineGroup>) => Promise<void>;
  deleteGroup: (id: string) => Promise<void>;
  advanceGroupRound: (groupId: string) => Promise<void>;

  members: Member[];
  addMember: (member: Omit<Member, 'id'>) => Promise<Member>;
  updateMember: (id: string, updates: Partial<Member>) => Promise<void>;

  payments: PaymentTransaction[];
  recordPayment: (payment: Omit<PaymentTransaction, 'id' | 'transactionRef'>) => Promise<PaymentTransaction>;
  verifyPayment: (id: string) => Promise<void>;

  notifications: AppNotification[];
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;

  toasts: ToastMessage[];
  addToast: (title: string, description?: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  removeToast: (id: string) => void;

  isBackendConnected: boolean;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('tontiflow_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    localStorage.setItem('tontiflow_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // User state
  const [currentUser, setCurrentUser] = useState<User>(CURRENT_MODERATOR);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(true);

  // Groups state
  const [groups, setGroups] = useState<TontineGroup[]>(() => {
    const saved = localStorage.getItem('tontiflow_groups');
    return saved ? JSON.parse(saved) : MOCK_GROUPS;
  });

  // Members state
  const [members, setMembers] = useState<Member[]>(() => {
    const saved = localStorage.getItem('tontiflow_members');
    return saved ? JSON.parse(saved) : MOCK_MEMBERS;
  });

  // Payments state
  const [payments, setPayments] = useState<PaymentTransaction[]>(() => {
    const saved = localStorage.getItem('tontiflow_payments');
    return saved ? JSON.parse(saved) : generateMockTransactions();
  });

  // Notifications state
  const [notifications, setNotifications] = useState<AppNotification[]>(MOCK_NOTIFICATIONS);

  // Toasts state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (
    title: string,
    description?: string,
    type: 'success' | 'error' | 'info' | 'warning' = 'success'
  ) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    setToasts((prev) => [...prev, { id, title, description, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Sync from backend
  const refreshData = useCallback(async () => {
    try {
      const [fetchedGroups, fetchedMembers, fetchedPayments, fetchedNotifications] = await Promise.all([
        api.getGroups(),
        api.getMembers(),
        api.getPayments(),
        api.getNotifications(),
      ]);

      if (fetchedGroups && fetchedGroups.length > 0) {
        setGroups(fetchedGroups);
        localStorage.setItem('tontiflow_groups', JSON.stringify(fetchedGroups));
      }
      if (fetchedMembers && fetchedMembers.length > 0) {
        setMembers(fetchedMembers);
        localStorage.setItem('tontiflow_members', JSON.stringify(fetchedMembers));
      }
      if (fetchedPayments && fetchedPayments.length > 0) {
        setPayments(fetchedPayments);
        localStorage.setItem('tontiflow_payments', JSON.stringify(fetchedPayments));
      }
      if (fetchedNotifications && fetchedNotifications.length > 0) {
        setNotifications(fetchedNotifications);
      }
      setIsBackendConnected(true);
    } catch (err) {
      console.warn('Backend sync note: operating with active local cache', err);
      // Still connected or fallback mode
      setIsBackendConnected(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Persist locally as fallback
  useEffect(() => {
    localStorage.setItem('tontiflow_groups', JSON.stringify(groups));
  }, [groups]);

  useEffect(() => {
    localStorage.setItem('tontiflow_members', JSON.stringify(members));
  }, [members]);

  useEffect(() => {
    localStorage.setItem('tontiflow_payments', JSON.stringify(payments));
  }, [payments]);

  const switchRole = (role: UserRole) => {
    if (role === 'moderator') {
      setCurrentUser(CURRENT_MODERATOR);
      addToast('Mode Modérateur activé', 'Vous gérez vos groupes et encaissez les cotisations.', 'info');
    } else {
      setCurrentUser(CURRENT_MEMBER);
      addToast('Mode Membre activé', 'Vous êtes connecté en tant que Amadou Bello.', 'info');
    }
  };

  // Group methods connected to Backend API
  const addGroup = async (groupData: Omit<TontineGroup, 'id'>): Promise<TontineGroup> => {
    try {
      const serverGroup = await api.createGroup(groupData);
      setGroups((prev) => [serverGroup, ...prev.filter((g) => g.id !== serverGroup.id)]);
      addToast('Groupe créé avec succès', `${serverGroup.name} enregistré sur le serveur.`, 'success');
      return serverGroup;
    } catch {
      // Fallback
      const newId = `grp_${Date.now()}`;
      const newGroup: TontineGroup = { ...groupData, id: newId };
      setGroups((prev) => [newGroup, ...prev]);
      addToast('Groupe créé (mode local)', `${newGroup.name} enregistré.`, 'success');
      return newGroup;
    }
  };

  const updateGroup = async (id: string, updates: Partial<TontineGroup>) => {
    try {
      const updated = await api.updateGroup(id, updates);
      setGroups((prev) => prev.map((g) => (g.id === id ? updated : g)));
      addToast('Groupe mis à jour', 'Modifications enregistrées sur le serveur.', 'success');
    } catch {
      setGroups((prev) => prev.map((g) => (g.id === id ? { ...g, ...updates } : g)));
      addToast('Groupe mis à jour', 'Modifications enregistrées.', 'success');
    }
  };

  const deleteGroup = async (id: string) => {
    try {
      await api.deleteGroup(id);
    } catch {
      // ignore
    }
    setGroups((prev) => prev.filter((g) => g.id !== id));
    addToast('Groupe archivé', 'Le groupe a été supprimé de la liste active.', 'info');
  };

  const advanceGroupRound = async (groupId: string) => {
    try {
      const res = await api.advanceGroupRound(groupId);
      if (res && res.group) {
        setGroups((prev) => prev.map((g) => (g.id === groupId ? res.group : g)));
      }
      addToast('Tour clôturé avec succès', 'La cagnotte a été remise et le tour suivant est ouvert !', 'success');
    } catch {
      // Local fallback
      setGroups((prev) =>
        prev.map((g) => {
          if (g.id !== groupId) return g;
          const nextDay = g.currentDay + 1;
          const updatedSchedule = g.beneficiarySchedule.map((b) => {
            if (b.order < nextDay) return { ...b, status: 'completed' as const };
            if (b.order === nextDay) return { ...b, status: 'current' as const };
            return { ...b, status: 'upcoming' as const };
          });
          const isFinished = nextDay > g.totalMembersCount;
          return {
            ...g,
            currentDay: isFinished ? g.totalMembersCount : nextDay,
            status: isFinished ? ('completed' as const) : g.status,
            beneficiarySchedule: updatedSchedule,
            members: g.members.map((m) => ({ ...m, hasPaidToday: false })),
          };
        })
      );
      addToast('Tour clôturé avec succès', 'La cagnotte a été remise et le tour suivant est ouvert !', 'success');
    }
  };

  // Member methods connected to Backend API
  const addMember = async (memberData: Omit<Member, 'id'>): Promise<Member> => {
    try {
      const serverMember = await api.createMember(memberData);
      setMembers((prev) => [serverMember, ...prev.filter((m) => m.id !== serverMember.id)]);
      addToast('Nouveau membre ajouté', `${serverMember.name} ajouté sur le serveur backend.`, 'success');
      return serverMember;
    } catch {
      const newId = `mem_${Date.now()}`;
      const newMember: Member = { ...memberData, id: newId };
      setMembers((prev) => [newMember, ...prev]);
      addToast('Nouveau membre ajouté', `${newMember.name} a été ajouté à la communauté.`, 'success');
      return newMember;
    }
  };

  const updateMember = async (id: string, updates: Partial<Member>) => {
    try {
      const updated = await api.updateMember(id, updates);
      setMembers((prev) => prev.map((m) => (m.id === id ? updated : m)));
      addToast('Membre actualisé', 'Profil mis à jour sur le serveur.', 'success');
    } catch {
      setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m)));
      addToast('Membre actualisé', 'Profil mis à jour avec succès.', 'success');
    }
  };

  // Payment methods connected to Backend API
  const recordPayment = async (paymentData: Omit<PaymentTransaction, 'id' | 'transactionRef'>): Promise<PaymentTransaction> => {
    try {
      const newTx = await api.createPayment(paymentData);
      setPayments((prev) => [newTx, ...prev.filter((p) => p.id !== newTx.id)]);

      // Update group and member states locally
      setGroups((prev) =>
        prev.map((g) => {
          if (g.id === newTx.groupId) {
            return {
              ...g,
              members: g.members.map((m) =>
                m.memberId === newTx.memberId
                  ? {
                      ...m,
                      hasPaidToday: true,
                      totalContributedInGroup: m.totalContributedInGroup + newTx.amount,
                    }
                  : m
              ),
            };
          }
          return g;
        })
      );

      setMembers((prev) =>
        prev.map((m) =>
          m.id === newTx.memberId
            ? { ...m, totalContributed: m.totalContributed + newTx.amount }
            : m
        )
      );

      addToast('Paiement enregistré', `${newTx.amount.toLocaleString()} FCFA de ${newTx.memberName} synchronisé.`, 'success');
      return newTx;
    } catch {
      const newId = `tx_${Date.now()}`;
      const ref = `TRX-${Math.floor(100000 + Math.random() * 900000)}`;
      const newTx: PaymentTransaction = {
        ...paymentData,
        id: newId,
        transactionRef: ref,
      };

      setPayments((prev) => [newTx, ...prev]);

      setGroups((prev) =>
        prev.map((g) => {
          if (g.id === newTx.groupId) {
            return {
              ...g,
              members: g.members.map((m) =>
                m.memberId === newTx.memberId
                  ? {
                      ...m,
                      hasPaidToday: true,
                      totalContributedInGroup: m.totalContributedInGroup + newTx.amount,
                    }
                  : m
              ),
            };
          }
          return g;
        })
      );

      setMembers((prev) =>
        prev.map((m) =>
          m.id === newTx.memberId
            ? { ...m, totalContributed: m.totalContributed + newTx.amount }
            : m
        )
      );

      addToast('Paiement enregistré', `${newTx.amount.toLocaleString()} FCFA de ${newTx.memberName}`, 'success');
      return newTx;
    }
  };

  const verifyPayment = async (id: string) => {
    try {
      await api.verifyPayment(id);
    } catch {
      // ignore
    }
    setPayments((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, status: 'paid', verifiedByModerator: true } : p
      )
    );
    addToast('Paiement validé', 'La transaction est confirmée.', 'success');
  };

  // Notifications methods
  const markNotificationAsRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
    } catch {
      // ignore
    }
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsAsRead = async () => {
    try {
      await api.markAllNotificationsRead();
    } catch {
      // ignore
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    addToast('Notifications', 'Toutes les notifications sont marquées comme lues.', 'info');
  };

  return (
    <AppContext.Provider
      value={{
        theme,
        toggleTheme,
        currentUser,
        switchRole,
        setCurrentUser,
        groups,
        addGroup,
        updateGroup,
        deleteGroup,
        advanceGroupRound,
        members,
        addMember,
        updateMember,
        payments,
        recordPayment,
        verifyPayment,
        notifications,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        toasts,
        addToast,
        removeToast,
        isBackendConnected,
        refreshData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
