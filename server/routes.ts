import { Router, Request, Response } from 'express';
import { db } from './db.js';
import {
  handleCreateSasPaySession,
  handleGetSasPayStatus,
  handleSasPayWebhook,
} from './saspay.js';

export const apiRouter = Router();

// Health check
apiRouter.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'TontiFlow API - Tontine Africaine Digitalisée',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ==========================================
// --- USERS & AUTH ---
// ==========================================

apiRouter.get('/users', (req: Request, res: Response) => {
  res.json(db.getUsers());
});

apiRouter.get('/users/:id', (req: Request, res: Response) => {
  const user = db.getUserById(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'Utilisateur non trouvé' });
  }
  res.json(user);
});

apiRouter.put('/users/:id/kyc', (req: Request, res: Response) => {
  const { kycStatus } = req.body;
  if (!kycStatus || !['unverified', 'pending', 'verified'].includes(kycStatus)) {
    return res.status(400).json({ error: 'Statut KYC invalide (unverified, pending, verified)' });
  }
  const updated = db.updateKycStatus(req.params.id, kycStatus);
  if (!updated) {
    return res.status(404).json({ error: 'Utilisateur non trouvé' });
  }
  res.json({ success: true, user: updated });
});

apiRouter.put('/users/:id/trust-score', (req: Request, res: Response) => {
  const { trustScore } = req.body;
  if (typeof trustScore !== 'number') {
    return res.status(400).json({ error: 'Score de confiance numérique requis (0-100)' });
  }
  const updated = db.updateTrustScore(req.params.id, trustScore);
  if (!updated) {
    return res.status(404).json({ error: 'Utilisateur non trouvé' });
  }
  res.json({ success: true, user: updated });
});

apiRouter.get('/auth/users', (req: Request, res: Response) => {
  res.json(db.getUsers());
});

apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { email, role } = req.body;
  const users = db.getUsers();
  let user = users.find((u) => u.email === email);
  if (!user) {
    user = users.find((u) => u.role === (role || 'moderator')) || users[0];
  }
  res.json({ success: true, user });
});

apiRouter.post('/auth/register', (req: Request, res: Response) => {
  const { name, email, phone, role, city, country } = req.body;
  const newUser = db.createUser({
    id: `user_${Date.now()}`,
    name: name || 'Utilisateur TontiFlow',
    email: email || `user_${Date.now()}@tontiflow.africa`,
    phone: phone || '+237 6 00 00 00 00',
    whatsappNumber: phone || '+237 6 00 00 00 00',
    role: role || 'moderator',
    trustScore: 100,
    kycStatus: 'pending',
    city: city || 'Douala',
    country: country || 'Cameroun',
  });
  res.status(201).json({ success: true, user: newUser });
});

// ==========================================
// --- TONTINES / GROUPS ROUTES ---
// (Supported on both /tontines and /groups)
// ==========================================

const handleGetGroups = (req: Request, res: Response) => {
  const { status, type } = req.query;
  let groups = db.getGroups();
  if (status && typeof status === 'string' && status !== 'all') {
    groups = groups.filter((g) => g.status === status);
  }
  if (type && typeof type === 'string' && type !== 'all') {
    groups = groups.filter((g) => g.type === type);
  }
  res.json(groups);
};

const handleGetGroupById = (req: Request, res: Response) => {
  const group = db.getGroupById(req.params.id);
  if (!group) {
    return res.status(404).json({ error: 'Tontine introuvable' });
  }
  res.json(group);
};

const handleCreateGroup = (req: Request, res: Response) => {
  try {
    const newGroup = db.createGroup(req.body);
    res.status(201).json(newGroup);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Erreur lors de la création de la tontine' });
  }
};

const handleUpdateGroup = (req: Request, res: Response) => {
  const updated = db.updateGroup(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Tontine introuvable' });
  }
  res.json(updated);
};

const handleDeleteGroup = (req: Request, res: Response) => {
  const deleted = db.deleteGroup(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Tontine introuvable' });
  }
  res.json({ success: true, message: 'Tontine archivée avec succès' });
};

// Check pot funding status
const handleGetPotStatus = (req: Request, res: Response) => {
  const report = db.checkPotFundedStatus(req.params.id);
  if (!report) {
    return res.status(404).json({ error: 'Tontine introuvable' });
  }
  res.json(report);
};

// Financial Summary with 5% SaaS commission
const handleGetTontineSummary = (req: Request, res: Response) => {
  const groupId = req.params.groupId || req.params.id;
  if (!groupId) {
    return res.status(400).json({ error: 'Identifiant du groupe de tontine requis' });
  }
  const summary = db.getTontineSummary(groupId);
  if (!summary) {
    return res.status(404).json({ error: 'Tontine introuvable' });
  }
  res.json(summary);
};

// Payout pot disbursement with 5% SaaS commission calculation
const handleProcessTontinePayout = (req: Request, res: Response) => {
  try {
    const groupId = req.body.groupId || req.params.id;
    const roundId = req.body.roundId ? Number(req.body.roundId) : undefined;
    const { force, notes, operator } = req.body;

    if (!groupId) {
      return res.status(400).json({ error: 'Le champ groupId est requis' });
    }

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

const handlePayoutPot = handleProcessTontinePayout;

// Advance round
const handleAdvanceRound = (req: Request, res: Response) => {
  const updated = db.advanceGroupRound(req.params.id);
  if (!updated) {
    return res.status(404).json({ error: 'Tontine introuvable' });
  }
  res.json({ success: true, group: updated });
};

// Reorder turns
const handleReorderTurns = (req: Request, res: Response) => {
  try {
    const { turns } = req.body; // array of { memberId, order }
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

// Late Penalty Regularization & Caution Top-up (50% SaaS / 50% Beneficiary)
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

// Direct routes required:
apiRouter.post('/tontine/payout', handleProcessTontinePayout);
apiRouter.get('/tontine/summary/:groupId', handleGetTontineSummary);
apiRouter.post('/tontine/pay-penalty-and-topup', handlePayPenaltyAndTopup);
apiRouter.post('/tontines/pay-penalty-and-topup', handlePayPenaltyAndTopup);

// Bind /tontines
apiRouter.get('/tontines', handleGetGroups);
apiRouter.get('/tontines/:id', handleGetGroupById);
apiRouter.post('/tontines', handleCreateGroup);
apiRouter.put('/tontines/:id', handleUpdateGroup);
apiRouter.delete('/tontines/:id', handleDeleteGroup);
apiRouter.get('/tontines/:id/summary', handleGetTontineSummary);
apiRouter.get('/tontines/:id/pot-status', handleGetPotStatus);
apiRouter.post('/tontines/:id/payout', handleProcessTontinePayout);
apiRouter.post('/tontines/:id/advance', handleAdvanceRound);
apiRouter.put('/tontines/:id/reorder-turns', handleReorderTurns);
apiRouter.put('/tontines/:id/members/verify', handleVerifyMemberPresence);

// Bind aliases /groups
apiRouter.get('/groups', handleGetGroups);
apiRouter.get('/groups/:id', handleGetGroupById);
apiRouter.post('/groups', handleCreateGroup);
apiRouter.put('/groups/:id', handleUpdateGroup);
apiRouter.delete('/groups/:id', handleDeleteGroup);
apiRouter.get('/groups/:id/summary', handleGetTontineSummary);
apiRouter.get('/groups/:id/pot-status', handleGetPotStatus);
apiRouter.post('/groups/:id/payout', handleProcessTontinePayout);
apiRouter.post('/groups/:id/advance', handleAdvanceRound);
apiRouter.put('/groups/:id/reorder-turns', handleReorderTurns);
apiRouter.put('/groups/:id/members/verify', handleVerifyMemberPresence);

// ==========================================
// --- MEMBERS ROUTES ---
// ==========================================

apiRouter.get('/members', (req: Request, res: Response) => {
  res.json(db.getMembers());
});

apiRouter.get('/members/:id', (req: Request, res: Response) => {
  const member = db.getMemberById(req.params.id);
  if (!member) {
    return res.status(404).json({ error: 'Membre non trouvé' });
  }
  res.json(member);
});

apiRouter.post('/members', (req: Request, res: Response) => {
  try {
    const member = db.createMember(req.body);
    res.status(201).json(member);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Erreur de création de membre' });
  }
});

apiRouter.put('/members/:id', (req: Request, res: Response) => {
  const updated = db.updateMember(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Membre non trouvé' });
  }
  res.json(updated);
});

apiRouter.delete('/members/:id', (req: Request, res: Response) => {
  const deleted = db.deleteMember(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Membre non trouvé' });
  }
  res.json({ success: true });
});

// ==========================================
// --- PAYMENTS & WEBHOOKS ---
// ==========================================

apiRouter.get('/payments', (req: Request, res: Response) => {
  const { groupId, memberId, status } = req.query;
  const payments = db.getPayments({
    groupId: typeof groupId === 'string' ? groupId : undefined,
    memberId: typeof memberId === 'string' ? memberId : undefined,
    status: typeof status === 'string' ? status : undefined,
  });
  res.json(payments);
});

apiRouter.post('/payments', (req: Request, res: Response) => {
  try {
    const payment = db.createPayment(req.body);
    res.status(201).json(payment);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Erreur enregistrement versement' });
  }
});

apiRouter.put('/payments/:id/verify', (req: Request, res: Response) => {
  const verified = db.verifyPayment(req.params.id);
  if (!verified) {
    return res.status(404).json({ error: 'Paiement non trouvé' });
  }
  res.json(verified);
});

// Receipt fetch
apiRouter.get('/payments/:id/receipt', (req: Request, res: Response) => {
  const payments = db.getPayments();
  const tx = payments.find((p) => p.id === req.params.id || p.transactionRef === req.params.id || p.receiptNumber === req.params.id);
  if (!tx) {
    return res.status(404).json({ error: 'Reçu non trouvé' });
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
    digitalSeal: `TF-SEAL-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
  });
});

/**
 * Real Mobile Money Webhook Endpoint
 * Supports callbacks from Orange Money, MTN MoMo, Wave
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

/**
 * Webhook Simulation Endpoint (for testing without live credentials)
 * Required by user: POST /api/payments/webhook-test
 */
apiRouter.post('/payments/webhook-test', (req: Request, res: Response) => {
  try {
    const {
      transactionId,
      groupId,
      memberId,
      amount,
      operator = 'MTN MoMo',
      phoneNumber,
      status = 'completed',
    } = req.body;

    const result = db.processWebhook({
      transactionId,
      groupId,
      memberId,
      amount: amount ? Number(amount) : undefined,
      operator,
      phoneNumber,
      status: status === 'failed' ? 'failed' : 'completed',
    });

    res.json({
      simulation: true,
      success: result.success,
      operator,
      transaction: result.transaction,
      receiptNumber: result.receiptNumber,
      groupReport: result.groupReport,
      message:
        result.success
          ? `Webhook de test exécuté avec succès : Cotisation de ${result.transaction.amount.toLocaleString()} FCFA validée via ${operator}.`
          : `Webhook de test simulé en échec.`,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Erreur simulateur webhook' });
  }
});

// ==========================================
// --- NOTIFICATIONS & STATS ---
// ==========================================

apiRouter.get('/notifications', (req: Request, res: Response) => {
  res.json(db.getNotifications());
});

apiRouter.put('/notifications/:id/read', (req: Request, res: Response) => {
  const success = db.markNotificationRead(req.params.id);
  res.json({ success });
});

apiRouter.put('/notifications/read-all', (req: Request, res: Response) => {
  db.markAllNotificationsRead();
  res.json({ success: true });
});

apiRouter.get('/stats/overview', (req: Request, res: Response) => {
  res.json(db.getStatsOverview());
});

// ==========================================
// --- SASAPAY GATEWAY ROUTES ---
// ==========================================

// Endpoint POST /api/saspay/create-session
apiRouter.post('/saspay/create-session', handleCreateSasPaySession);

// Endpoint GET /api/saspay/status
apiRouter.get('/saspay/status', handleGetSasPayStatus);

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
