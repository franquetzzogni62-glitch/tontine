import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  User,
  Member,
  TontineGroup,
  PaymentTransaction,
  AppNotification,
  ToastMessage,
  UserRole,
  KycStatus,
  WebhookSimulationPayload,
  PenaltyTopupPayload,
  PenaltyTopupResult,
} from '../types';
import {
  CURRENT_MODERATOR,
  CURRENT_MEMBER,
  MOCK_MEMBERS,
  MOCK_GROUPS,
  generateMockTransactions,
  MOCK_NOTIFICATIONS,
} from '../mocks/data';
import { api } from '../services/api';

interface AppContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  currentUser: User;
  switchRole: (role: UserRole) => void;
  setCurrentUser: (user: User) => void;
  logout: () => void;
  updateUserKyc: (userId: string, kycStatus: KycStatus) => Promise<void>;
  updateUserTrustScore: (userId: string, trustScore: number) => Promise<void>;

  groups: TontineGroup[];
  addGroup: (group: Omit<TontineGroup, 'id'>) => Promise<TontineGroup>;
  updateGroup: (id: string, updates: Partial<TontineGroup>) => Promise<void>;
  deleteGroup: (id: string) => Promise<void>;
  advanceGroupRound: (groupId: string) => Promise<void>;
  payoutPot: (groupId: string, force?: boolean, notes?: string) => Promise<any>;
  reorderTurns: (groupId: string, turns: { memberId: string; order: number }[]) => Promise<void>;
  verifyMemberPresence: (groupId: string, memberId: string, validated?: boolean) => Promise<void>;
  payPenaltyAndTopup: (payload: PenaltyTopupPayload) => Promise<PenaltyTopupResult>;

  members: Member[];
  addMember: (member: Omit<Member, 'id'>) => Promise<Member>;
  updateMember: (id: string, updates: Partial<Member>) => Promise<void>;

  payments: PaymentTransaction[];
  recordPayment: (payment: Omit<PaymentTransaction, 'id' | 'transactionRef'>) => Promise<PaymentTransaction>;
  verifyPayment: (id: string) => Promise<void>;
  simulateWebhook: (payload: WebhookSimulationPayload) => Promise<any>;

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

const PROD_VERSION_KEY = 'tontiflow_prod_v2_clean';
if (typeof window !== 'undefined' && localStorage.getItem('tontiflow_app_version') !== PROD_VERSION_KEY) {
  localStorage.removeItem('tontiflow_groups');
  localStorage.removeItem('tontiflow_members');
  localStorage.removeItem('tontiflow_payments');
  localStorage.setItem('tontiflow_app_version', PROD_VERSION_KEY);
}

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
    return saved ? JSON.parse(saved) : [];
  });

  // Members state
  const [members, setMembers] = useState<Member[]>(() => {
    const saved = localStorage.getItem('tontiflow_members');
    return saved ? JSON.parse(saved) : [];
  });

  // Payments state
  const [payments, setPayments] = useState<PaymentTransaction[]>(() => {
    const saved = localStorage.getItem('tontiflow_payments');
    return saved ? JSON.parse(saved) : [];
  });

  // Notifications state
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

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

      if (Array.isArray(fetchedGroups)) {
        setGroups(fetchedGroups);
        localStorage.setItem('tontiflow_groups', JSON.stringify(fetchedGroups));
      }
      if (Array.isArray(fetchedMembers)) {
        setMembers(fetchedMembers);
        localStorage.setItem('tontiflow_members', JSON.stringify(fetchedMembers));
      }
      if (Array.isArray(fetchedPayments)) {
        setPayments(fetchedPayments);
        localStorage.setItem('tontiflow_payments', JSON.stringify(fetchedPayments));
      }
      if (Array.isArray(fetchedNotifications)) {
        setNotifications(fetchedNotifications);
      }
      setIsBackendConnected(true);
    } catch (err) {
      console.warn('Backend sync note: operating with active local cache', err);
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
    if (role === 'moderator' || role === 'admin') {
      setCurrentUser(CURRENT_MODERATOR);
      addToast('Mode Administrateur activé', 'Vous gérez vos tontines, les membres et encaissez les cotisations.', 'info');
    } else {
      setCurrentUser(CURRENT_MEMBER);
      addToast('Mode Membre activé', 'Connecté en tant que Amadou Bello.', 'info');
    }
  };

  const logout = () => {
    localStorage.removeItem('tontiflow_user_session');
    addToast('Déconnexion réussie', 'Vous avez été déconnecté de votre compte.', 'info');
  };

  const updateUserKyc = async (userId: string, kycStatus: KycStatus) => {
    try {
      const res = await api.updateKycStatus(userId, kycStatus);
      if (currentUser.id === userId) {
        setCurrentUser(res.user);
      }
      setMembers((prev) => prev.map((m) => (m.id === userId ? { ...m, kycStatus } : m)));
      addToast('Statut KYC mis à jour', `Nouveau statut : ${kycStatus}`, 'success');
    } catch {
      setMembers((prev) => prev.map((m) => (m.id === userId ? { ...m, kycStatus } : m)));
      addToast('Statut KYC mis à jour (local)', `Nouveau statut : ${kycStatus}`, 'info');
    }
  };

  const updateUserTrustScore = async (userId: string, trustScore: number) => {
    try {
      const res = await api.updateTrustScore(userId, trustScore);
      if (currentUser.id === userId) {
        setCurrentUser(res.user);
      }
      setMembers((prev) => prev.map((m) => (m.id === userId ? { ...m, trustScore } : m)));
      addToast('Score actualisé', `Score de confiance : ${trustScore}%`, 'success');
    } catch {
      setMembers((prev) => prev.map((m) => (m.id === userId ? { ...m, trustScore } : m)));
    }
  };

  // Group methods connected to Backend API
  const addGroup = async (groupData: Omit<TontineGroup, 'id'>): Promise<TontineGroup> => {
    try {
      const serverGroup = await api.createGroup(groupData);
      setGroups((prev) => [serverGroup, ...prev.filter((g) => g.id !== serverGroup.id)]);
      addToast('Tontine créée avec succès', `${serverGroup.name} enregistrée sur le serveur backend.`, 'success');
      return serverGroup;
    } catch {
      const newId = `grp_${Date.now()}`;
      const newGroup: TontineGroup = { ...groupData, id: newId };
      setGroups((prev) => [newGroup, ...prev]);
      addToast('Tontine créée (mode local)', `${newGroup.name} enregistrée.`, 'success');
      return newGroup;
    }
  };

  const updateGroup = async (id: string, updates: Partial<TontineGroup>) => {
    try {
      const updated = await api.updateGroup(id, updates);
      setGroups((prev) => prev.map((g) => (g.id === id ? updated : g)));
      addToast('Tontine mise à jour', 'Modifications enregistrées sur le serveur.', 'success');
    } catch {
      setGroups((prev) => prev.map((g) => (g.id === id ? { ...g, ...updates } : g)));
      addToast('Tontine mise à jour', 'Modifications enregistrées.', 'success');
    }
  };

  const deleteGroup = async (id: string) => {
    try {
      await api.deleteGroup(id);
    } catch {
      // ignore
    }
    setGroups((prev) => prev.filter((g) => g.id !== id));
    addToast('Tontine archivée', 'Le groupe a été retiré de la liste active.', 'info');
  };

  const advanceGroupRound = async (groupId: string) => {
    try {
      const res = await api.advanceGroupRound(groupId);
      if (res && res.group) {
        setGroups((prev) => prev.map((g) => (g.id === groupId ? res.group : g)));
      }
      addToast('Tour clôturé avec succès', 'La cagnotte a été remise et le tour suivant est ouvert !', 'success');
    } catch {
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
      addToast('Tour clôturé avec succès', 'Le tour suivant est maintenant ouvert !', 'success');
    }
  };

  // Payout pot disbursement with backend validation
  const payoutPot = async (groupId: string, force = false, notes?: string) => {
    try {
      const result = await api.payoutPot(groupId, { force, notes });
      if (result.updatedGroup) {
        setGroups((prev) => prev.map((g) => (g.id === groupId ? result.updatedGroup : g)));
      }
      await refreshData();
      addToast('Pot débloqué et versé !', result.message, 'success');
      return result;
    } catch (err: any) {
      addToast('Erreur déblocage cagnotte', err.message || 'Impossible de verser le pot', 'error');
      throw err;
    }
  };

  // Reorder turns
  const reorderTurns = async (groupId: string, turns: { memberId: string; order: number }[]) => {
    try {
      const res = await api.reorderTurns(groupId, turns);
      if (res.group) {
        setGroups((prev) => prev.map((g) => (g.id === groupId ? res.group : g)));
      }
      addToast('Ordre des tours reconfiguré', 'Nouvel ordre de passage enregistré.', 'success');
    } catch {
      // Local fallback
      setGroups((prev) =>
        prev.map((g) => {
          if (g.id !== groupId) return g;
          const updatedMembers = g.members.map((m) => {
            const found = turns.find((t) => t.memberId === m.memberId);
            return found ? { ...m, turnOrder: found.order } : m;
          });
          const updatedSchedule = g.beneficiarySchedule.map((b) => {
            const found = turns.find((t) => t.memberId === b.memberId);
            return found ? { ...b, order: found.order } : b;
          }).sort((a, b) => a.order - b.order);

          return { ...g, members: updatedMembers, beneficiarySchedule: updatedSchedule };
        })
      );
      addToast('Ordre des tours modifié', 'Nouvel ordre de passage appliqué.', 'success');
    }
  };

  // Verify member presence
  const verifyMemberPresence = async (groupId: string, memberId: string, presenceValidated = true) => {
    try {
      const res = await api.verifyMemberPresence(groupId, memberId, presenceValidated);
      if (res.group) {
        setGroups((prev) => prev.map((g) => (g.id === groupId ? res.group : g)));
      }
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, presenceValidated } : m))
      );
      addToast('Présence membre validée', 'Le statut du membre a été mis à jour.', 'success');
    } catch {
      setGroups((prev) =>
        prev.map((g) => {
          if (g.id !== groupId) return g;
          return {
            ...g,
            members: g.members.map((m) => (m.memberId === memberId ? { ...m, presenceValidated } : m)),
          };
        })
      );
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, presenceValidated } : m))
      );
      addToast('Présence membre validée', 'Mis à jour en mode local.', 'info');
    }
  };

  // Penalty top-up and regularization with 50/50 split
  const payPenaltyAndTopup = async (payload: PenaltyTopupPayload): Promise<PenaltyTopupResult> => {
    try {
      const res = await api.payPenaltyAndTopup(payload);
      await refreshData();
      addToast(
        'Régularisation effectuée !',
        `${res.totalPaid.toLocaleString()} FCFA encaissés. Statut de ${res.memberName} rétabli en ACTIVE. ${res.beneficiaryPenaltyShare.toLocaleString()} FCFA reversés au bénéficiaire (50%).`,
        'success'
      );
      return res;
    } catch (err: any) {
      addToast('Erreur régularisation', err.message || 'Échec du traitement de la pénalité', 'error');
      throw err;
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
      const newMember: Member = {
        ...memberData,
        id: newId,
        kycStatus: memberData.kycStatus || 'pending',
        presenceValidated: true,
      };
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
        receiptNumber: `REC-${ref}`,
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

  // Webhook Simulator
  const simulateWebhook = async (payload: WebhookSimulationPayload) => {
    try {
      const result = await api.simulateWebhook(payload);
      await refreshData();
      if (result.success) {
        addToast(
          `Webhook ${payload.operator} validé !`,
          `Reçu N° ${result.receiptNumber} généré. Montant : ${payload.amount.toLocaleString()} FCFA`,
          'success'
        );
      } else {
        addToast(`Webhook ${payload.operator} : Paiement échoué`, 'Le statut de la transaction est passé à échoué.', 'warning');
      }
      return result;
    } catch (err: any) {
      addToast('Erreur Webhook', err.message || 'Échec de la simulation', 'error');
      throw err;
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
    addToast('Paiement validé', 'La transaction est confirmée et horodatée.', 'success');
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
        logout,
        updateUserKyc,
        updateUserTrustScore,
        groups,
        addGroup,
        updateGroup,
        deleteGroup,
        advanceGroupRound,
        payoutPot,
        reorderTurns,
        verifyMemberPresence,
        payPenaltyAndTopup,
        members,
        addMember,
        updateMember,
        payments,
        recordPayment,
        verifyPayment,
        simulateWebhook,
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
