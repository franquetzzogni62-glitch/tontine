import { Router, Request, Response } from 'express';
import { db } from './db.js';
import {
  createSession,
  deleteSession,
  requireAuth,
  requireModerator,
  requireMember,
} from './auth.js';
import {
  handleCreateSasPaySession,
  handleCreateSubscriptionSession,
  handleGetSasPayStatus,
  handleTestSasPayConnection,
  handleVerifySubscription,
  handleSasPayWebhook,
} from './saspay.js';

export const apiRouter = Router();

// ==========================================
// --- HEALTH & PUBLIC ROUTES ---
// ==========================================

apiRouter.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'TontiFlow Production API - Tontine Africaine Digitalisée',
    version: '2.5.0',
    mode: 'production',
    timestamp: new Date().toISOString(),
  });
});

// Consultation publique restreinte d'une tontine (pour page d'invitation /join/:id)
apiRouter.get('/public/groups/:id', (req: Request, res: Response) => {
  const group = db.getGroupById(req.params.id);
  if (!group) {
    return res.status(404).json({ error: 'Tontine introuvable ou inactive.' });
  }
  // Ne retourne que les métadonnées publiques nécessaires (sans codes secrets ni identifiants privés)
  res.json({
    id: group.id,
    name: group.name,
    description: group.description,
    type: group.type,
    frequency: group.frequency,
    contributionAmount: group.contributionAmount,
    totalMembersCount: group.totalMembersCount || group.members.length,
    status: group.status,
    moderatorName: (group as any).moderatorName || 'Modérateur TontiFlow',
  });
});

// ==========================================
// --- RATE LIMITING HELPER ---
// ==========================================

const loginAttempts = new Map<string, { count: number; firstAttempt: number }>();
function checkRateLimit(key: string, maxAttempts = 5, windowMs = 15 * 60 * 1000): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(key);
  if (!entry || now - entry.firstAttempt > windowMs) {
    loginAttempts.set(key, { count: 1, firstAttempt: now });
    return true;
  }
  if (entry.count >= maxAttempts) {
    return false;
  }
  entry.count++;
  return true;
}

// ==========================================
// --- AUTHENTIFICATION RÉELLE & SESSIONS ---
// ==========================================

/**
 * POST /api/auth/login
 * Connexion réelle Modérateur (Email + Mot de passe sécurisé)
 */
apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const rateKey = `login_${ip}_${(email || '').toLowerCase().trim()}`;

  if (!checkRateLimit(rateKey, 5, 15 * 60 * 1000)) {
    return res.status(429).json({
      error: 'Trop de tentatives de connexion échouées. Veuillez patienter 15 minutes.',
    });
  }

  if (!email || !password) {
    return res.status(400).json({ error: 'Email et mot de passe requis.' });
  }

  const user = db.getUserByEmail(email);
  if (!user || !user.passwordHash || !user.salt) {
    return res.status(401).json({
      error: 'Identifiants invalides. Vérifiez votre adresse email et mot de passe.',
    });
  }

  const isValid = db.verifyPassword(password, user.passwordHash, user.salt);
  if (!isValid) {
    return res.status(401).json({
      error: 'Identifiants invalides. Vérifiez votre adresse email et mot de passe.',
    });
  }

  const { passwordHash: _, salt: __, ...safeUser } = user;
  const session = createSession(safeUser, safeUser.role as any || 'moderator');

  // Enregistrement de log d'audit de connexion
  res.json({
    success: true,
    token: session.token,
    user: safeUser,
  });
});

/**
 * POST /api/auth/member-login
 * Connexion réelle Membre (Numéro Mobile Money + Code secret à 6 chiffres propre à la tontine)
 */
apiRouter.post('/auth/member-login', (req: Request, res: Response) => {
  const { phone, accessCode } = req.body;
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const cleanPhone = (phone || '').replace(/[\s\-\(\)\+]/g, '');
  const rateKey = `member_${ip}_${cleanPhone}`;

  if (!checkRateLimit(rateKey, 6, 15 * 60 * 1000)) {
    return res.status(429).json({
      error: 'Trop de tentatives avec des codes incorrects. Veuillez patienter 15 minutes.',
    });
  }

  if (!phone || !accessCode) {
    return res.status(400).json({
      error: 'Numéro de téléphone et code secret à 6 chiffres obligatoires.',
    });
  }

  const match = db.findMemberByPhoneAndCode(phone, accessCode);
  if (!match) {
    return res.status(401).json({
      error: 'Numéro ou code à 6 chiffres incorrect pour cette tontine. Contactez votre modérateur.',
    });
  }

  const safeMemberUser = {
    id: match.member.id,
    name: match.member.name,
    email: match.member.email || `${match.member.id}@tontiflow.africa`,
    phone: match.member.phone,
    role: 'member' as const,
    trustScore: match.member.trustScore || 95,
    kycStatus: match.member.kycStatus || 'verified',
    city: match.member.city || 'Douala',
    country: 'Cameroun',
  };

  const session = createSession(safeMemberUser, 'member', match.group.id, match.member.id);

  res.json({
    success: true,
    token: session.token,
    user: safeMemberUser,
    member: match.member,
    group: match.group,
    groupId: match.group.id,
  });
});

/**
 * POST /api/auth/register
 * Inscription réelle Modérateur (Nom, Email, Téléphone, Mot de passe fort, Formule)
 */
apiRouter.post('/auth/register', (req: Request, res: Response) => {
  const { name, email, phone, password, organizationName, planId, city, country } = req.body;

  if (!email || !name || !password) {
    return res.status(400).json({
      error: 'Le nom complet, l\'adresse email et le mot de passe sont obligatoires.',
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      error: 'Le mot de passe doit comporter au moins 6 caractères pour des raisons de sécurité.',
    });
  }

  const cleanEmail = email.trim().toLowerCase();
  const existing = db.getUserByEmail(cleanEmail);
  if (existing) {
    return res.status(400).json({
      error: 'Un compte avec cette adresse email existe déjà. Veuillez vous connecter.',
    });
  }

  const { hash, salt } = db.hashPassword(password);
  const plan = planId || 'pro';
  const prices: Record<string, number> = { starter: 5000, pro: 15000, enterprise: 30000 };
  const planNames: Record<string, string> = {
    starter: 'Formule Starter',
    pro: 'Formule Pro',
    enterprise: 'Formule Entreprise',
  };

  const newUser = db.createUser({
    id: `user_mod_${Date.now()}`,
    name: name.trim(),
    organizationName: (organizationName || 'Réseau Tontines Indépendant').trim(),
    email: cleanEmail,
    phone: (phone || '').trim(),
    whatsappNumber: (phone || '').trim(),
    role: 'moderator',
    trustScore: 100,
    kycStatus: 'verified',
    city: city || 'Douala',
    country: country || 'Cameroun',
    passwordHash: hash,
    salt,
    subscription: {
      planId: plan,
      planName: planNames[plan] || 'Formule Pro',
      pricePerMonth: prices[plan] || 15000,
      status: 'active',
      startedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      paymentMethod: 'Orange Money',
      autoRenew: true,
      maxGroups: plan === 'starter' ? 3 : 999,
    },
  });

  const { passwordHash: _, salt: __, ...safeUser } = newUser;
  const session = createSession(safeUser, 'moderator');

  res.status(201).json({
    success: true,
    token: session.token,
    user: safeUser,
  });
});

/**
 * POST /api/auth/logout
 * Déconnexion avec invalidation du token de session
 */
apiRouter.post('/auth/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization || (req.headers['x-session-token'] as string);
  deleteSession(authHeader);
  res.json({ success: true, message: 'Session fermée avec succès.' });
});

/**
 * GET /api/auth/me
 * Vérification de la session en cours
 */
apiRouter.get('/auth/me', requireAuth(), (req: Request, res: Response) => {
  res.json({
    success: true,
    user: req.authenticatedUser,
    session: req.userSession,
  });
});

// ==========================================
// --- USERS MANAGEMENT (Modérateur / Admin) ---
// ==========================================

apiRouter.get('/users/:id', requireAuth(), (req: Request, res: Response) => {
  const session = req.userSession!;
  // Seul le propriétaire ou un modérateur/admin peut consulter le profil
  if (session.userId !== req.params.id && session.role !== 'admin' && session.role !== 'moderator') {
    return res.status(403).json({ error: 'Accès non autorisé.' });
  }

  const user = db.getUserById(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'Utilisateur non trouvé' });
  }
  const { passwordHash: _, salt: __, ...safeUser } = user;
  res.json(safeUser);
});

apiRouter.put('/users/:id/kyc', requireModerator, (req: Request, res: Response) => {
  const { kycStatus } = req.body;
  if (!kycStatus || !['unverified', 'pending', 'verified'].includes(kycStatus)) {
    return res.status(400).json({ error: 'Statut KYC invalide (unverified, pending, verified)' });
  }
  const updated = db.updateKycStatus(req.params.id, kycStatus);
  if (!updated) {
    return res.status(404).json({ error: 'Utilisateur non trouvé' });
  }
  const { passwordHash: _, salt: __, ...safeUser } = updated;
  res.json({ success: true, user: safeUser });
});

apiRouter.put('/users/:id/trust-score', requireModerator, (req: Request, res: Response) => {
  const { trustScore } = req.body;
  if (typeof trustScore !== 'number') {
    return res.status(400).json({ error: 'Score de confiance numérique requis (0-100)' });
  }
  const updated = db.updateTrustScore(req.params.id, trustScore);
  if (!updated) {
    return res.status(404).json({ error: 'Utilisateur non trouvé' });
  }
  const { passwordHash: _, salt: __, ...safeUser } = updated;
  res.json({ success: true, user: safeUser });
});

// ==========================================
// --- TONTINES & GROUPES (Multi-Tenant Isolé) ---
// ==========================================

const handleGetGroups = (req: Request, res: Response) => {
  const session = req.userSession!;
  const { status, type, groupId } = req.query;

  let groups = db.getGroups();

  if (session.role === 'member') {
    // Membre : N'a accès QU'À la tontine pour laquelle il a entré son code à 6 chiffres
    groups = groups.filter((g) => g.id === session.groupId);
  } else {
    // Modérateur : Ne voit QUE ses propres groupes (scoping strict)
    groups = groups.filter((g) => g.moderatorId === session.userId);
  }

  if (groupId && typeof groupId === 'string') {
    groups = groups.filter((g) => g.id === groupId);
  }
  if (status && typeof status === 'string' && status !== 'all') {
    groups = groups.filter((g) => g.status === status);
  }
  if (type && typeof type === 'string' && type !== 'all') {
    groups = groups.filter((g) => g.type === type);
  }

  res.json(groups);
};

const handleGetGroupById = (req: Request, res: Response) => {
  const session = req.userSession!;
  const group = db.getGroupById(req.params.id);

  if (!group) {
    return res.status(404).json({ error: 'Tontine introuvable' });
  }

  // Vérification des droits multi-tenant
  if (session.role === 'member') {
    if (group.id !== session.groupId) {
      return res.status(403).json({ error: 'Accès non autorisé à cette tontine.' });
    }
  } else if (session.role === 'moderator') {
    if (group.moderatorId !== session.userId) {
      return res.status(403).json({ error: 'Accès interdit. Cette tontine appartient à un autre modérateur.' });
    }
  }

  res.json(group);
};

const handleCreateGroup = (req: Request, res: Response) => {
  const session = req.userSession!;
  try {
    // Enforce moderator ownership
    const groupData = {
      ...req.body,
      moderatorId: session.userId,
      moderatorName: session.user?.name || req.body.moderatorName || 'Modérateur',
    };
    const newGroup = db.createGroup(groupData);
    res.status(201).json(newGroup);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Erreur lors de la création de la tontine' });
  }
};

const handleUpdateGroup = (req: Request, res: Response) => {
  const session = req.userSession!;
  const group = db.getGroupById(req.params.id);
  if (!group) {
    return res.status(404).json({ error: 'Tontine introuvable' });
  }

  if (session.role === 'moderator' && group.moderatorId !== session.userId) {
    return res.status(403).json({ error: 'Accès interdit. Cette tontine appartient à un autre modérateur.' });
  }

  const updated = db.updateGroup(req.params.id, req.body);
  res.json(updated);
};

const handleDeleteGroup = (req: Request, res: Response) => {
  const session = req.userSession!;
  const group = db.getGroupById(req.params.id);
  if (!group) {
    return res.status(404).json({ error: 'Tontine introuvable' });
  }

  if (session.role === 'moderator' && group.moderatorId !== session.userId) {
    return res.status(403).json({ error: 'Accès interdit. Cette tontine appartient à un autre modérateur.' });
  }

  db.deleteGroup(req.params.id);
  res.json({ success: true, message: 'Tontine supprimée avec succès' });
};

// Pot Status
const handleGetPotStatus = (req: Request, res: Response) => {
  const session = req.userSession!;
  const group = db.getGroupById(req.params.id);
  if (!group) {
    return res.status(404).json({ error: 'Tontine introuvable' });
  }

  if (session.role === 'member' && group.id !== session.groupId) {
    return res.status(403).json({ error: 'Accès non autorisé.' });
  }
  if (session.role === 'moderator' && group.moderatorId !== session.userId) {
    return res.status(403).json({ error: 'Accès non autorisé.' });
  }

  const report = db.checkPotFundedStatus(req.params.id);
  res.json(report);
};

// Financial Summary
const handleGetTontineSummary = (req: Request, res: Response) => {
  const session = req.userSession!;
  const groupId = req.params.groupId || req.params.id;
  const group = db.getGroupById(groupId);
  if (!group) {
    return res.status(404).json({ error: 'Tontine introuvable' });
  }

  if (session.role === 'member' && group.id !== session.groupId) {
    return res.status(403).json({ error: 'Accès non autorisé.' });
  }
  if (session.role === 'moderator' && group.moderatorId !== session.userId) {
    return res.status(403).json({ error: 'Accès non autorisé.' });
  }

  const summary = db.getTontineSummary(groupId);
  res.json(summary);
};

// Payout pot disbursement
const handleProcessTontinePayout = (req: Request, res: Response) => {
  const session = req.userSession!;
  const groupId = req.body.groupId || req.params.id;
  const group = db.getGroupById(groupId);
  if (!group) {
    return res.status(404).json({ error: 'Tontine introuvable' });
  }

  if (session.role === 'moderator' && group.moderatorId !== session.userId) {
    return res.status(403).json({ error: 'Accès interdit.' });
  }

  try {
    const roundId = req.body.roundId ? Number(req.body.roundId) : undefined;
    const { force, notes, operator } = req.body;

    const result = db.processTontinePayout(groupId, roundId, {
      force: Boolean(force),
      operator: operator || 'Orange Money',
      notes,
    });
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Erreur lors du versement du pot' });
  }
};

// Advance round
const handleAdvanceRound = (req: Request, res: Response) => {
  const session = req.userSession!;
  const group = db.getGroupById(req.params.id);
  if (!group) {
    return res.status(404).json({ error: 'Tontine introuvable' });
  }

  if (session.role === 'moderator' && group.moderatorId !== session.userId) {
    return res.status(403).json({ error: 'Accès interdit.' });
  }

  const updated = db.advanceGroupRound(req.params.id);
  res.json({ success: true, group: updated });
};

// Reorder turns
const handleReorderTurns = (req: Request, res: Response) => {
  const session = req.userSession!;
  const group = db.getGroupById(req.params.id);
  if (!group) {
    return res.status(404).json({ error: 'Tontine introuvable' });
  }

  if (session.role === 'moderator' && group.moderatorId !== session.userId) {
    return res.status(403).json({ error: 'Accès interdit.' });
  }

  try {
    const { turns } = req.body;
    if (!Array.isArray(turns)) {
      return res.status(400).json({ error: 'Le champ turns (tableau) est requis' });
    }
    const updated = db.reorderTurns(req.params.id, turns);
    res.json({ success: true, group: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Erreur réorganisation des tours' });
  }
};

// Verify member presence / approval
const handleVerifyMemberPresence = (req: Request, res: Response) => {
  const session = req.userSession!;
  const group = db.getGroupById(req.params.id);
  if (!group) {
    return res.status(404).json({ error: 'Tontine introuvable' });
  }

  if (session.role === 'moderator' && group.moderatorId !== session.userId) {
    return res.status(403).json({ error: 'Accès interdit.' });
  }

  try {
    const { memberId, presenceValidated } = req.body;
    if (!memberId) {
      return res.status(400).json({ error: 'Le champ memberId est requis' });
    }
    const updated = db.verifyMemberPresence(req.params.id, memberId, presenceValidated ?? true);
    res.json({ success: true, group: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Erreur validation de présence' });
  }
};

// Late Penalty Regularization & Caution Top-up
const handlePayPenaltyAndTopup = (req: Request, res: Response) => {
  try {
    const { groupId, memberId, operator, phoneNumber, notes } = req.body;
    if (!groupId || !memberId) {
      return res.status(400).json({ error: 'Les champs groupId et memberId sont obligatoires.' });
    }

    const result = db.payPenaltyAndTopup({
      groupId,
      memberId,
      operator: operator || 'Orange Money',
      phoneNumber,
      notes,
    });

    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Erreur lors de la régularisation du retard et de la pénalité.' });
  }
};

// Règlement direct d'un ou plusieurs tours de tontine
const handlePayTurns = (req: Request, res: Response) => {
  try {
    const { groupId, memberId, turnsCount, operator, phoneNumber, notes } = req.body;
    if (!groupId || !memberId) {
      return res.status(400).json({ error: 'Les champs groupId et memberId sont obligatoires.' });
    }

    const result = db.recordTurnPayment({
      groupId,
      memberId,
      turnsCount: Number(turnsCount) || 1,
      operator: operator || 'Orange Money',
      phoneNumber,
      notes,
    });

    res.json({
      success: true,
      payment: result.payment,
      group: result.group,
      message: `Cotisation de ${result.payment.amount.toLocaleString()} FCFA enregistrée avec succès pour ${result.payment.coveredRounds}.`,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Erreur lors du règlement de la cotisation.' });
  }
};

apiRouter.post('/tontine/payout', requireModerator, handleProcessTontinePayout);
apiRouter.get('/tontine/summary/:groupId', requireAuth(), handleGetTontineSummary);
apiRouter.post('/tontine/pay-penalty-and-topup', requireAuth(), handlePayPenaltyAndTopup);
apiRouter.post('/tontines/pay-penalty-and-topup', requireAuth(), handlePayPenaltyAndTopup);
apiRouter.post('/tontine/pay-turns', requireAuth(), handlePayTurns);
apiRouter.post('/tontines/pay-turns', requireAuth(), handlePayTurns);

// Bind /tontines protected routes
apiRouter.get('/tontines', requireAuth(), handleGetGroups);
apiRouter.get('/tontines/:id', requireAuth(), handleGetGroupById);
apiRouter.post('/tontines', requireModerator, handleCreateGroup);
apiRouter.put('/tontines/:id', requireModerator, handleUpdateGroup);
apiRouter.delete('/tontines/:id', requireModerator, handleDeleteGroup);
apiRouter.get('/tontines/:id/summary', requireAuth(), handleGetTontineSummary);
apiRouter.get('/tontines/:id/pot-status', requireAuth(), handleGetPotStatus);
apiRouter.post('/tontines/:id/payout', requireModerator, handleProcessTontinePayout);
apiRouter.post('/tontines/:id/advance', requireModerator, handleAdvanceRound);
apiRouter.put('/tontines/:id/reorder-turns', requireModerator, handleReorderTurns);
apiRouter.put('/tontines/:id/members/verify', requireModerator, handleVerifyMemberPresence);

// Bind aliases /groups protected routes
apiRouter.get('/groups', requireAuth(), handleGetGroups);
apiRouter.get('/groups/:id', requireAuth(), handleGetGroupById);
apiRouter.post('/groups', requireModerator, handleCreateGroup);
apiRouter.put('/groups/:id', requireModerator, handleUpdateGroup);
apiRouter.delete('/groups/:id', requireModerator, handleDeleteGroup);
apiRouter.get('/groups/:id/summary', requireAuth(), handleGetTontineSummary);
apiRouter.get('/groups/:id/pot-status', requireAuth(), handleGetPotStatus);
apiRouter.post('/groups/:id/payout', requireModerator, handleProcessTontinePayout);
apiRouter.post('/groups/:id/advance', requireModerator, handleAdvanceRound);
apiRouter.put('/groups/:id/reorder-turns', requireModerator, handleReorderTurns);
apiRouter.put('/groups/:id/members/verify', requireModerator, handleVerifyMemberPresence);

// ==========================================
// --- MEMBERS ROUTES (Multi-Tenant Isolé) ---
// ==========================================

apiRouter.get('/members', requireModerator, (req: Request, res: Response) => {
  const session = req.userSession!;
  const myGroups = db.getGroups().filter((g) => g.moderatorId === session.userId);
  const myMemberIds = new Set<string>();
  for (const g of myGroups) {
    for (const m of g.members || []) {
      myMemberIds.add(m.memberId);
    }
  }

  const allMembers = db.getMembers();
  const filtered = allMembers.filter((m) => myMemberIds.has(m.id) || m.moderatorId === session.userId);
  res.json(filtered);
});

apiRouter.get('/members/:id', requireAuth(), (req: Request, res: Response) => {
  const session = req.userSession!;
  if (session.role === 'member' && session.memberId !== req.params.id) {
    return res.status(403).json({ error: 'Accès non autorisé à ce membre.' });
  }

  const member = db.getMemberById(req.params.id);
  if (!member) {
    return res.status(404).json({ error: 'Membre non trouvé' });
  }
  res.json(member);
});

apiRouter.post('/members', requireModerator, (req: Request, res: Response) => {
  try {
    const session = req.userSession!;
    const memberData = {
      ...req.body,
      moderatorId: session.userId,
    };
    const member = db.createMember(memberData);
    res.status(201).json(member);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Erreur de création de membre' });
  }
});

apiRouter.put('/members/:id', requireModerator, (req: Request, res: Response) => {
  const updated = db.updateMember(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Membre non trouvé' });
  }
  res.json(updated);
});

apiRouter.delete('/members/:id', requireModerator, (req: Request, res: Response) => {
  const deleted = db.deleteMember(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Membre non trouvé' });
  }
  res.json({ success: true });
});

// ==========================================
// --- PAYMENTS & REÇUS (Multi-Tenant Isolé) ---
// ==========================================

apiRouter.get('/payments', requireAuth(), (req: Request, res: Response) => {
  const session = req.userSession!;
  const { groupId, memberId, status } = req.query;

  if (session.role === 'member') {
    // Membre ne voit QUE ses propres paiements dans sa tontine
    const payments = db.getPayments({
      groupId: session.groupId,
      memberId: session.memberId,
      status: typeof status === 'string' ? status : undefined,
    });
    return res.json(payments);
  }

  // Modérateur : Ne voit QUE les paiements de ses tontines
  const myGroups = db.getGroups().filter((g) => g.moderatorId === session.userId);
  const myGroupIds = new Set(myGroups.map((g) => g.id));

  const allPayments = db.getPayments({
    groupId: typeof groupId === 'string' ? groupId : undefined,
    memberId: typeof memberId === 'string' ? memberId : undefined,
    status: typeof status === 'string' ? status : undefined,
  });

  const scopedPayments = allPayments.filter((p) => myGroupIds.has(p.groupId));
  res.json(scopedPayments);
});

apiRouter.post('/payments', requireAuth(), (req: Request, res: Response) => {
  try {
    const payment = db.createPayment(req.body);
    res.status(201).json(payment);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Erreur enregistrement versement' });
  }
});

apiRouter.put('/payments/:id/verify', requireModerator, (req: Request, res: Response) => {
  const verified = db.verifyPayment(req.params.id);
  if (!verified) {
    return res.status(404).json({ error: 'Paiement non trouvé' });
  }
  res.json(verified);
});

apiRouter.get('/payments/:id/receipt', requireAuth(), (req: Request, res: Response) => {
  const session = req.userSession!;
  const payments = db.getPayments();
  const tx = payments.find(
    (p) => p.id === req.params.id || p.transactionRef === req.params.id || p.receiptNumber === req.params.id
  );

  if (!tx) {
    return res.status(404).json({ error: 'Reçu non trouvé' });
  }

  if (session.role === 'member' && tx.memberId !== session.memberId) {
    return res.status(403).json({ error: 'Accès non autorisé à ce reçu.' });
  }

  res.json({
    receiptNumber: tx.receiptNumber || `REC-${tx.transactionRef}`,
    transactionRef: tx.transactionRef,
    date: tx.date,
    amount: tx.amount,
    baseAmount: tx.baseAmount,
    commission: tx.commission,
    method: tx.method,
    memberName: tx.memberName,
    memberPhone: tx.memberPhone,
    groupName: tx.groupName,
    status: tx.status,
    verifiedByModerator: tx.verifiedByModerator,
    issuedBy: 'TontiFlow Digital Platform',
    digitalSeal: `TF-SEAL-${Buffer.from(tx.id).toString('hex').slice(0, 16).toUpperCase()}`,
  });
});

/**
 * Endpoint Webhook Mobile Money réel
 */
apiRouter.post('/payments/webhook', (req: Request, res: Response) => {
  try {
    const { transaction_id, status, operator, phone_number, amount, external_ref } = req.body;

    const result = db.processWebhook({
      transactionId: transaction_id,
      status: status === 'SUCCESS' || status === 'completed' || status === 'PAID' ? 'completed' : 'failed',
      operator: operator || 'Mobile Money',
      phoneNumber: phone_number,
      amount: amount ? Number(amount) : undefined,
      providerTxId: external_ref,
    });

    res.json({
      received: true,
      processed: result.success,
      transactionId: result.transaction.id,
      receiptNumber: result.receiptNumber,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Erreur traitement webhook' });
  }
});

// ==========================================
// --- NOTIFICATIONS & STATS ---
// ==========================================

apiRouter.get('/notifications', requireAuth(), (req: Request, res: Response) => {
  const session = req.userSession!;
  const notifs = db.getNotifications().filter((n: any) => !n.userId || n.userId === session.userId);
  res.json(notifs);
});

apiRouter.put('/notifications/:id/read', requireAuth(), (req: Request, res: Response) => {
  const success = db.markNotificationRead(req.params.id);
  res.json({ success });
});

apiRouter.put('/notifications/read-all', requireAuth(), (req: Request, res: Response) => {
  db.markAllNotificationsRead();
  res.json({ success: true });
});

apiRouter.get('/stats/overview', requireModerator, (req: Request, res: Response) => {
  const session = req.userSession!;
  res.json(db.getStatsOverview(session.userId));
});

// ==========================================
// --- SASPAY GATEWAY & ABONNEMENTS ---
// ==========================================

// Endpoint POST /api/saspay/create-session
apiRouter.post('/saspay/create-session', handleCreateSasPaySession);

// Endpoint POST /api/saspay/create-subscription-session (Dédié aux abonnements modérateurs)
apiRouter.post('/saspay/create-subscription-session', requireModerator, handleCreateSubscriptionSession);

// Endpoint GET /api/saspay/status (Vérification officielle sans bypass)
apiRouter.get('/saspay/status', handleGetSasPayStatus);

// Endpoint GET /api/saspay/test-connection (Vérifie la liaison en direct avec l'API SasPay)
apiRouter.get('/saspay/test-connection', requireModerator, handleTestSasPayConnection);

// Endpoint POST /api/saspay/verify-subscription
apiRouter.post('/saspay/verify-subscription', requireModerator, handleVerifySubscription);

// Subscriptions & Invoices API
apiRouter.get('/subscriptions/invoices', requireModerator, (req: Request, res: Response) => {
  const session = req.userSession!;
  res.json(db.getSubscriptionInvoices(session.userId));
});

apiRouter.post('/subscriptions/update', requireModerator, (req: Request, res: Response) => {
  const session = req.userSession!;
  const { planId = 'pro', paymentMethod = 'SasPay Mobile Money' } = req.body;
  const updatedUser = db.updateSubscription(session.userId, planId, paymentMethod);
  res.json({ success: true, user: updatedUser });
});

// Webhook endpoints
apiRouter.post('/saspay/webhook', handleSasPayWebhook);
apiRouter.post('/webhook/saspay', handleSasPayWebhook);

// Resilient Node fallback for /api/saspay.php proxy requests
apiRouter.all('/saspay.php', (req: Request, res: Response) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  if (req.method === 'POST') {
    return handleCreateSasPaySession(req, res);
  }
  return handleGetSasPayStatus(req, res);
});
