import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  User,
  Member,
  TontineGroup,
  PaymentTransaction,
  AppNotification,
  ToastMessage,
  KycStatus,
  PenaltyTopupPayload,
  PenaltyTopupResult,
  SubscriptionPlanId,
} from '../types';
import { api } from '../services/api';
import { generate6DigitCode } from '../utils/formatters';

const GUEST_USER: User = {
  id: '',
  name: '',
  email: '',
  phone: '',
  role: 'moderator',
  trustScore: 100,
  kycStatus: 'unverified',
};

interface AppContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  currentUser: User;
  isAuthenticated: boolean;
  setCurrentUser: (user: User) => void;
  isAuthChecking: boolean;
  logout: () => Promise<void>;
  currentMemberGroupId: string | null;
  setCurrentMemberGroupId: (id: string | null) => void;

  loginModerator: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginMemberWithCode: (
    phone: string,
    accessCode: string
  ) => Promise<{ success: boolean; group?: TontineGroup; member?: Member; error?: string }>;
  registerModerator: (data: {
    name: string;
    organizationName?: string;
    email: string;
    phone: string;
    password: string;
    planId?: SubscriptionPlanId;
  }) => Promise<User>;

  updateSubscription: (planId: SubscriptionPlanId, paymentMethod?: string) => Promise<void>;
  updateUserKyc: (userId: string, kycStatus: KycStatus) => Promise<void>;
  updateUserTrustScore: (userId: string, trustScore: number) => Promise<void>;

  groups: TontineGroup[];
  addGroup: (group: Omit<TontineGroup, 'id'>) => Promise<TontineGroup>;
  updateGroup: (id: string, updates: Partial<TontineGroup>) => Promise<void>;
  deleteGroup: (id: string) => Promise<void>;
  enrollMemberInGroup: (
    groupId: string,
    data: {
      memberId?: string;
      name: string;
      phone: string;
      city?: string;
      turnOrder?: number;
    }
  ) => Promise<{ member: Member; accessCode: string; group: TontineGroup }>;
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

// Nettoyage définitif de toutes les clés de test legacy dans localStorage
if (typeof window !== 'undefined') {
  const legacyKeys = [
    'tontiflow_groups',
    'tontiflow_members',
    'tontiflow_payments',
    'tontiflow_current_user',
    'tontiflow_app_version',
  ];
  for (const key of legacyKeys) {
    localStorage.removeItem(key);
  }
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

  // User & Authentication State
  const [authenticatedUser, setAuthenticatedUser] = useState<User | null>(() => {
    try {
      const savedSession = localStorage.getItem('tontiflow_user_session');
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        return parsed?.user || null;
      }
    } catch {
      // ignore
    }
    return null;
  });

  const [currentMemberGroupId, setCurrentMemberGroupId] = useState<string | null>(() => {
    return localStorage.getItem('tontiflow_member_group_id') || null;
  });

  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(true);

  // Entities state (100% production : initialisé vide)
  const [groups, setGroups] = useState<TontineGroup[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const isAuthenticated = Boolean(authenticatedUser && api.getToken());
  const currentUser: User = authenticatedUser || GUEST_USER;

  const setCurrentUser = (user: User) => {
    setAuthenticatedUser(user);
    localStorage.setItem(
      'tontiflow_user_session',
      JSON.stringify({ role: user.role, user })
    );
  };

  const addToast = useCallback((
    title: string,
    description?: string,
    type: 'success' | 'error' | 'info' | 'warning' = 'success'
  ) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    setToasts((prev) => [...prev, { id, title, description, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Synchronisation des données depuis l'API backend
  const refreshData = useCallback(async () => {
    if (!api.getToken()) {
      setGroups([]);
      setMembers([]);
      setPayments([]);
      setNotifications([]);
      return;
    }

    try {
      const [fetchedGroups, fetchedMembers, fetchedPayments, fetchedNotifications] = await Promise.all([
        api.getGroups().catch(() => []),
        api.getMembers().catch(() => []),
        api.getPayments().catch(() => []),
        api.getNotifications().catch(() => []),
      ]);

      if (Array.isArray(fetchedGroups)) setGroups(fetchedGroups);
      if (Array.isArray(fetchedMembers)) setMembers(fetchedMembers);
      if (Array.isArray(fetchedPayments)) setPayments(fetchedPayments);
      if (Array.isArray(fetchedNotifications)) setNotifications(fetchedNotifications);

      setIsBackendConnected(true);
    } catch {
      setIsBackendConnected(false);
    }
  }, []);

  // Validation de la session au démarrage
  useEffect(() => {
    const verifySession = async () => {
      const token = api.getToken();
      if (!token) {
        setAuthenticatedUser(null);
        setIsAuthChecking(false);
        return;
      }

      try {
        const res = await api.checkCurrentSession();
        if (res.success && res.user) {
          setAuthenticatedUser(res.user);
          await refreshData();
        } else {
          setAuthenticatedUser(null);
          api.clearToken();
        }
      } catch {
        const savedSession = localStorage.getItem('tontiflow_user_session');
        if (savedSession) {
          try {
            const parsed = JSON.parse(savedSession);
            setAuthenticatedUser(parsed?.user || null);
          } catch {
            setAuthenticatedUser(null);
          }
        }
      } finally {
        setIsAuthChecking(false);
      }
    };

    verifySession();
  }, [refreshData]);

  // Écoute des expirations de session 401
  useEffect(() => {
    const handleUnauthorized = () => {
      setAuthenticatedUser(null);
      setCurrentMemberGroupId(null);
      setGroups([]);
      setMembers([]);
      setPayments([]);
      setNotifications([]);
      addToast('Session expirée', 'Veuillez vous reconnecter à votre compte.', 'warning');
    };

    window.addEventListener('tontiflow_unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('tontiflow_unauthorized', handleUnauthorized);
    };
  }, [addToast]);

  // Connexion Modérateur
  const loginModerator = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await api.loginModerator(email, password);
      if (res.success && res.user) {
        setAuthenticatedUser(res.user);
        localStorage.setItem(
          'tontiflow_user_session',
          JSON.stringify({ role: 'moderator', user: res.user })
        );
        addToast('Connexion réussie', `Bienvenue sur votre espace de gestion, ${res.user.name}.`, 'success');
        await refreshData();
        return { success: true };
      }
      return { success: false, error: 'Identifiants invalides.' };
    } catch (err: any) {
      const msg = err.message || 'Erreur lors de la connexion.';
      return { success: false, error: msg };
    }
  };

  // Connexion Membre avec code 6 chiffres
  const loginMemberWithCode = async (
    phone: string,
    code: string
  ): Promise<{ success: boolean; group?: TontineGroup; member?: Member; error?: string }> => {
    try {
      const res = await api.loginMember(phone, code);
      if (res.success && res.user && res.group) {
        setAuthenticatedUser(res.user);
        setCurrentMemberGroupId(res.groupId);
        localStorage.setItem('tontiflow_member_group_id', res.groupId);
        localStorage.setItem(
          'tontiflow_user_session',
          JSON.stringify({ role: 'member', user: res.user, groupId: res.groupId })
        );

        addToast(
          'Accès autorisé',
          `Bienvenue ${res.member.name} dans la tontine « ${res.group.name} » !`,
          'success'
        );
        await refreshData();
        return { success: true, group: res.group, member: res.member };
      }
      return {
        success: false,
        error: 'Numéro de téléphone ou code d\'accès à 6 chiffres incorrect pour cette tontine.',
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Numéro ou code à 6 chiffres incorrect.',
      };
    }
  };

  // Inscription Modérateur
  const registerModerator = async (data: {
    name: string;
    organizationName?: string;
    email: string;
    phone: string;
    password: string;
    planId?: SubscriptionPlanId;
  }): Promise<User> => {
    try {
      const res = await api.registerModerator(data);
      if (res.success && res.user) {
        setAuthenticatedUser(res.user);
        localStorage.setItem(
          'tontiflow_user_session',
          JSON.stringify({ role: 'moderator', user: res.user })
        );
        addToast(
          'Compte créé avec succès !',
          `Bienvenue ${res.user.name}, votre espace de modération est actif.`,
          'success'
        );
        await refreshData();
        return res.user;
      }
      throw new Error('Échec de la création de compte.');
    } catch (err: any) {
      addToast('Erreur d\'inscription', err.message || 'Impossible de créer le compte.', 'error');
      throw err;
    }
  };

  // Déconnexion
  const logout = async () => {
    await api.logout();
    setAuthenticatedUser(null);
    setCurrentMemberGroupId(null);
    setGroups([]);
    setMembers([]);
    setPayments([]);
    setNotifications([]);
    addToast('Déconnexion réussie', 'Vous avez été déconnecté de votre compte.', 'info');
  };

  // Mise à jour de l'abonnement
  const updateSubscription = async (planId: SubscriptionPlanId, paymentMethod = 'SasPay Mobile Money') => {
    if (!authenticatedUser) return;
    try {
      const res = await fetch('/api/subscriptions/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${api.getToken()}`,
        },
        body: JSON.stringify({ userId: authenticatedUser.id, planId, paymentMethod }),
      });
      const data = await res.json();
      if (data.user) {
        setAuthenticatedUser(data.user);
        localStorage.setItem(
          'tontiflow_user_session',
          JSON.stringify({ role: authenticatedUser.role, user: data.user })
        );
      }
      addToast('Abonnement activé', `Votre forfait ${planId.toUpperCase()} est opérationnel.`, 'success');
    } catch {
      addToast('Erreur', 'Impossible de mettre à jour l\'abonnement.', 'error');
    }
  };

  const updateUserKyc = async (userId: string, kycStatus: KycStatus) => {
    try {
      await api.updateKycStatus(userId, kycStatus);
      if (authenticatedUser && authenticatedUser.id === userId) {
        setAuthenticatedUser({ ...authenticatedUser, kycStatus });
      }
      setMembers((prev) =>
        prev.map((m) => (m.id === userId ? { ...m, kycStatus } : m))
      );
      addToast('Statut KYC mis à jour', `Le statut de vérification est : ${kycStatus}`, 'info');
    } catch {
      // ignore
    }
  };

  const updateUserTrustScore = async (userId: string, trustScore: number) => {
    try {
      await api.updateTrustScore(userId, trustScore);
      if (authenticatedUser && authenticatedUser.id === userId) {
        setAuthenticatedUser({ ...authenticatedUser, trustScore });
      }
      setMembers((prev) =>
        prev.map((m) => (m.id === userId ? { ...m, trustScore } : m))
      );
      addToast('Score de Confiance', `Score ajusté à ${trustScore}/100.`, 'info');
    } catch {
      // ignore
    }
  };

  // Groupes
  const addGroup = async (groupData: Omit<TontineGroup, 'id'>): Promise<TontineGroup> => {
    const created = await api.createGroup(groupData);
    setGroups((prev) => [created, ...prev]);
    addToast('Tontine créée avec succès !', `La tontine « ${created.name} » est prête.`, 'success');
    return created;
  };

  const updateGroup = async (id: string, updates: Partial<TontineGroup>) => {
    const updated = await api.updateGroup(id, updates);
    setGroups((prev) => prev.map((g) => (g.id === id ? { ...g, ...updated } : g)));
    addToast('Tontine modifiée', 'Les modifications ont été enregistrées.', 'info');
  };

  const deleteGroup = async (id: string) => {
    await api.deleteGroup(id);
    setGroups((prev) => prev.filter((g) => g.id !== id));
    addToast('Tontine supprimée', 'Le groupe a été retiré.', 'info');
  };

  // Inscription d'un membre dans un groupe
  const enrollMemberInGroup = async (
    groupId: string,
    data: {
      memberId?: string;
      name: string;
      phone: string;
      city?: string;
      turnOrder?: number;
    }
  ): Promise<{ member: Member; accessCode: string; group: TontineGroup }> => {
    const targetGroup = groups.find((g) => g.id === groupId);
    if (!targetGroup) {
      throw new Error('Tontine introuvable');
    }

    let member: Member;
    if (data.memberId) {
      const found = members.find((m) => m.id === data.memberId);
      if (!found) throw new Error('Membre introuvable');
      member = found;
    } else {
      const cleanInputPhone = data.phone.replace(/\D/g, '');
      const existingByPhone = members.find(
        (m) => m.phone.replace(/\D/g, '').endsWith(cleanInputPhone.slice(-8))
      );
      if (existingByPhone) {
        member = existingByPhone;
      } else {
        const parts = data.name.trim().split(' ');
        const newMem = await api.createMember({
          name: data.name.trim(),
          firstName: parts[0] || data.name,
          lastName: parts.slice(1).join(' ') || '',
          phone: data.phone.trim(),
          email: `${parts[0].toLowerCase()}_${Date.now().toString().slice(-4)}@tontine.africa`,
          city: data.city || 'Douala',
          trustScore: 95,
          kycStatus: 'verified',
          joinedDate: new Date().toISOString().split('T')[0],
          groupsCount: 1,
          totalContributed: 0,
          totalReceived: 0,
          status: 'active',
          presenceValidated: true,
        });
        member = newMem;
        setMembers((prev) => [newMem, ...prev]);
      }
    }

    const accessCode = generate6DigitCode(`${member.id}_${groupId}_${Date.now()}`);
    const turnOrder = data.turnOrder || targetGroup.members.length + 1;
    const newTotalMembers = targetGroup.members.length + 1;
    const netPerMember = targetGroup.contributionAmount - targetGroup.moderatorCommission;
    const newPotAmount = netPerMember * newTotalMembers;

    const newGroupMember = {
      memberId: member.id,
      turnOrder,
      accessCode,
      hasPaidToday: false,
      totalContributedInGroup: 0,
      presenceValidated: true,
      status: 'active' as const,
    };

    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + (turnOrder - 1));
    const newTurn = {
      order: turnOrder,
      memberId: member.id,
      memberName: member.name,
      memberPhone: member.phone,
      scheduledDate: nextDate.toISOString().split('T')[0],
      potAmount: newPotAmount,
      status: 'upcoming' as const,
      accessCode,
    };

    const updatedMembers = [...targetGroup.members, newGroupMember];
    const updatedSchedule = [...targetGroup.beneficiarySchedule, newTurn].map((b) => ({
      ...b,
      potAmount: newPotAmount,
    }));

    const updatedGroupData: Partial<TontineGroup> = {
      totalMembersCount: newTotalMembers,
      potAmount: newPotAmount,
      members: updatedMembers,
      beneficiarySchedule: updatedSchedule,
    };

    await api.updateGroup(groupId, updatedGroupData);

    const fullUpdatedGroup: TontineGroup = {
      ...targetGroup,
      ...updatedGroupData,
    };

    setGroups((prev) => prev.map((g) => (g.id === groupId ? fullUpdatedGroup : g)));

    addToast(
      'Membre inscrit à la tontine !',
      `Code secret : ${accessCode} transmis pour ${member.name}.`,
      'success'
    );

    return { member, accessCode, group: fullUpdatedGroup };
  };

  const advanceGroupRound = async (groupId: string) => {
    const res = await api.advanceGroupRound(groupId);
    if (res.group) {
      setGroups((prev) => prev.map((g) => (g.id === groupId ? res.group : g)));
    }
    addToast('Tour clôturé', 'La tontine est passée au tour suivant.', 'info');
  };

  const payoutPot = async (groupId: string, force = false, notes?: string) => {
    const res = await api.payoutPot(groupId, { force, notes });
    await refreshData();
    addToast('Versement effectué', res.message || 'Le pot a été distribué.', 'success');
    return res;
  };

  const reorderTurns = async (groupId: string, turns: { memberId: string; order: number }[]) => {
    const res = await api.reorderTurns(groupId, turns);
    if (res.group) {
      setGroups((prev) => prev.map((g) => (g.id === groupId ? res.group : g)));
    }
    addToast('Calendrier réorganisé', 'L\'ordre de passage a été mis à jour.', 'info');
  };

  const verifyMemberPresence = async (groupId: string, memberId: string, validated = true) => {
    const res = await api.verifyMemberPresence(groupId, memberId, validated);
    if (res.group) {
      setGroups((prev) => prev.map((g) => (g.id === groupId ? res.group : g)));
    }
  };

  const payPenaltyAndTopup = async (payload: PenaltyTopupPayload): Promise<PenaltyTopupResult> => {
    const res = await api.payPenaltyAndTopup(payload);
    await refreshData();
    addToast('Pénalité régularisée', res.message, 'success');
    return res;
  };

  // Membres
  const addMember = async (memberData: Omit<Member, 'id'>): Promise<Member> => {
    const created = await api.createMember(memberData);
    setMembers((prev) => [created, ...prev]);
    addToast('Membre ajouté', `${created.name} a été enregistré avec succès.`, 'success');
    return created;
  };

  const updateMember = async (id: string, updates: Partial<Member>) => {
    const updated = await api.updateMember(id, updates);
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, ...updated } : m)));
    addToast('Membre mis à jour', 'Les informations ont été modifiées.', 'info');
  };

  // Paiements
  const recordPayment = async (
    paymentData: Omit<PaymentTransaction, 'id' | 'transactionRef'>
  ): Promise<PaymentTransaction> => {
    const newTx = await api.recordPayment(paymentData);
    setPayments((prev) => [newTx, ...prev.filter((p) => p.id !== newTx.id)]);
    await refreshData();
    addToast('Paiement enregistré', `${newTx.amount.toLocaleString()} FCFA de ${newTx.memberName} synchronisé.`, 'success');
    return newTx;
  };

  const verifyPayment = async (id: string) => {
    await api.verifyPayment(id);
    setPayments((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: 'paid', verifiedByModerator: true } : p))
    );
    addToast('Paiement validé', 'La transaction est confirmée et horodatée.', 'success');
  };

  // Notifications
  const markNotificationAsRead = async (id: string) => {
    await api.markNotificationRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllNotificationsAsRead = async () => {
    await api.markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    addToast('Notifications', 'Toutes les notifications sont marquées comme lues.', 'info');
  };

  return (
    <AppContext.Provider
      value={{
        theme,
        toggleTheme,
        currentUser,
        isAuthenticated,
        setCurrentUser,
        isAuthChecking,
        logout,
        currentMemberGroupId,
        setCurrentMemberGroupId,
        loginModerator,
        loginMemberWithCode,
        registerModerator,
        updateSubscription,
        updateUserKyc,
        updateUserTrustScore,
        groups,
        addGroup,
        updateGroup,
        deleteGroup,
        enrollMemberInGroup,
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
