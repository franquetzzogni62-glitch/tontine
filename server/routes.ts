import { Router, Request, Response } from 'express';
import { db } from './db.js';

export const apiRouter = Router();

// Health check
apiRouter.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --- Auth Routes ---
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
    role: role || 'moderator',
    city: city || 'Douala',
    country: country || 'Cameroun',
  });
  res.status(201).json({ success: true, user: newUser });
});

// --- Groups Routes ---
apiRouter.get('/groups', (req: Request, res: Response) => {
  const { status } = req.query;
  let groups = db.getGroups();
  if (status && typeof status === 'string' && status !== 'all') {
    groups = groups.filter((g) => g.status === status);
  }
  res.json(groups);
});

apiRouter.get('/groups/:id', (req: Request, res: Response) => {
  const group = db.getGroupById(req.params.id);
  if (!group) {
    return res.status(404).json({ error: 'Groupe non trouvé' });
  }
  res.json(group);
});

apiRouter.post('/groups', (req: Request, res: Response) => {
  try {
    const newGroup = db.createGroup(req.body);
    res.status(201).json(newGroup);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Erreur lors de la création du groupe' });
  }
});

apiRouter.put('/groups/:id', (req: Request, res: Response) => {
  const updated = db.updateGroup(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Groupe non trouvé' });
  }
  res.json(updated);
});

apiRouter.delete('/groups/:id', (req: Request, res: Response) => {
  const deleted = db.deleteGroup(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Groupe non trouvé' });
  }
  res.json({ success: true, message: 'Groupe supprimé avec succès' });
});

apiRouter.post('/groups/:id/advance', (req: Request, res: Response) => {
  const updated = db.advanceGroupRound(req.params.id);
  if (!updated) {
    return res.status(404).json({ error: 'Groupe non trouvé' });
  }
  res.json({ success: true, group: updated });
});

// --- Members Routes ---
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

// --- Payments Routes ---
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

// --- Notifications Routes ---
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

// --- Stats Routes ---
apiRouter.get('/stats/overview', (req: Request, res: Response) => {
  res.json(db.getStatsOverview());
});
