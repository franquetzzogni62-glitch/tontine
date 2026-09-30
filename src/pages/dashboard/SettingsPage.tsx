import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Tabs } from '../../components/ui/Tabs';
import { Checkbox } from '../../components/ui/Textarea';
import { Avatar } from '../../components/ui/Avatar';
import {
  User,
  Bell,
  CreditCard,
  Lock,
  Receipt,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  Copy,
  Check,
  Activity,
  Zap,
  Server,
} from 'lucide-react';
import { api } from '../../services/api';
import { formatDate, formatFCFA } from '../../utils/formatters';

export const SettingsPage: React.FC = () => {
  const { currentUser, setCurrentUser, addToast } = useApp();
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'payments' | 'security' | 'billing'>('billing');

  // Profile form
  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [phone, setPhone] = useState(currentUser.phone);
  const [city, setCity] = useState(currentUser.city || 'Douala');

  // Mobile Money accounts
  const [momoNumber, setMomoNumber] = useState('+237 6 99 45 22 10');
  const [orangeNumber, setOrangeNumber] = useState('+237 6 94 33 21 00');
  const [waveNumber, setWaveNumber] = useState('+237 6 75 12 34 56');

  // SasPay state
  const [showApiKey, setShowApiKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [isTestingSasPay, setIsTestingSasPay] = useState(false);
  const [saspayTestResult, setSaspayTestResult] = useState<{
    success: boolean;
    message: string;
    latencyMs?: number;
    merchantId?: string;
  } | null>(null);

  const saspayApiKey = 'sk_live_dpveGiiFhSgw8zT6cWGYBQkXlTnqth1VfDDHctYD__w';

  const handleCopyKey = () => {
    navigator.clipboard.writeText(saspayApiKey);
    setCopiedKey(true);
    addToast('Copié', 'Clé secrète SasPay copiée dans le presse-papier.', 'info');
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleTestSasPay = async () => {
    setIsTestingSasPay(true);
    setSaspayTestResult(null);
    try {
      const res = await api.testSasPayConnection();
      if (res.success && res.connected) {
        setSaspayTestResult({
          success: true,
          message: `Connexion SasPay vérifiée avec succès. Passerelle Live opérationnelle.`,
          latencyMs: res.latencyMs,
          merchantId: res.merchantId,
        });
        addToast('SasPay Opérationnel', `Liaison établie en ${res.latencyMs} ms avec l'API Live SasPay.`, 'success');
      } else {
        setSaspayTestResult({
          success: false,
          message: res.error || 'Erreur lors du test de connexion SasPay.',
        });
        addToast('Échec SasPay', res.error || 'Erreur de communication.', 'error');
      }
    } catch (err: any) {
      setSaspayTestResult({
        success: false,
        message: err.message || 'Impossible de joindre le serveur.',
      });
    } finally {
      setIsTestingSasPay(false);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentUser({
      ...currentUser,
      name,
      email,
      phone,
      city,
    });
    addToast('Profil mis à jour', 'Vos informations ont été enregistrées.', 'success');
  };

  const handleSavePayments = (e: React.FormEvent) => {
    e.preventDefault();
    addToast('Comptes Mobile Money enregistrés', 'Vos numéros d\'encaissement sont à jour.', 'success');
  };

  const tabsList = [
    { id: 'billing', label: 'Facturation & SasPay', icon: <Receipt size={15} /> },
    { id: 'payments', label: 'Moyens d\'encaissement', icon: <Smartphone size={15} /> },
    { id: 'profile', label: 'Mon Profil', icon: <User size={15} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={15} /> },
    { id: 'security', label: 'Sécurité & Accès', icon: <Lock size={15} /> },
  ];

  const sub = currentUser.subscription || {
    planId: 'pro',
    planName: 'Formule Pro',
    pricePerMonth: 15000,
    status: 'active',
    expiresAt: '2026-10-31T23:59:59Z',
  };

  return (
    <div className="max-w-4xl space-y-6 text-left pb-12">
      {/* Header bar */}
      <div className="pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Paramètres du compte & Paiements
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Gérez votre profil, vos canaux d'encaissement et la passerelle de paiement SasPay.
        </p>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={tabsList}
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as any)}
        variant="segmented"
      />

      {/* TAB 1: FACTURATION SAAS & SASPAY */}
      {activeTab === 'billing' && (
        <div className="space-y-6">
          {/* Active Subscription Overview Card */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Abonnement Modérateur TontiFlow</CardTitle>
                <p className="text-xs text-slate-500">
                  Votre formule active pour gérer vos tontines et percevoir vos commissions
                </p>
              </div>
            </CardHeader>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
                    Formule active
                  </span>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                    {sub.planName} ({formatFCFA(sub.pricePerMonth)} / mois)
                  </h4>
                  <p className="text-xs text-slate-500">
                    Tontines illimitées · Encaissé via la passerelle sécurisée SasPay
                  </p>
                </div>

                <div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
                    <CheckCircle2 size={14} /> Abonnement Actif
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
                <span className="text-slate-500">
                  Valide jusqu'au : <strong>{formatDate(sub.expiresAt)}</strong>
                </span>
                <Link to="/dashboard/subscription">
                  <Button variant="emerald" size="sm" leftIcon={<Zap size={14} />}>
                    Gérer / Renouveler sur SasPay
                  </Button>
                </Link>
              </div>
            </div>
          </Card>

          {/* SasPay Gateway Configuration Card */}
          <Card className="border-emerald-500/30">
            <CardHeader>
              <div className="flex items-center justify-between w-full">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle>Passerelle de Paiement SasPay</CardTitle>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                      Live Connecté
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Moyen de paiement configuré pour recevoir les abonnements et les cotisations via Mobile Money & Carte
                  </p>
                </div>

                <a
                  href="https://docs.saspay.me/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-medium inline-flex items-center gap-1"
                >
                  Documentation <ExternalLink size={13} />
                </a>
              </div>
            </CardHeader>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-slate-400 block text-[11px]">Environnement & API</span>
                  <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Server size={14} className="text-emerald-500" />
                    https://api.saspay.me/api/v1
                  </div>
                  <span className="text-[11px] text-emerald-600 font-medium">Mode Production Live</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-slate-400 block text-[11px]">Usage de la passerelle</span>
                  <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-emerald-500" />
                    Abonnements Modérateur & Cotisations
                  </div>
                  <span className="text-[11px] text-slate-500">Orange Money, MTN MoMo, Wave, Carte</span>
                </div>
              </div>

              {/* Secret Key Display */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white">
                    Clé secrète SasPay (Secret Key)
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                    Configurée dans les paramètres
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1 font-mono text-xs p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 select-all overflow-x-auto">
                    {showApiKey ? saspayApiKey : `${saspayApiKey.slice(0, 11)}••••••••••••••••••••••••${saspayApiKey.slice(-6)}`}
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowApiKey(!showApiKey)}
                    title={showApiKey ? 'Masquer la clé' : 'Afficher la clé'}
                  >
                    {showApiKey ? <EyeOff size={15} /> : <Eye size={15} />}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCopyKey}
                    title="Copier la clé secrète"
                  >
                    {copiedKey ? <Check size={15} className="text-emerald-500" /> : <Copy size={15} />}
                  </Button>
                </div>
              </div>

              {/* Test Connection Button & Result */}
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="emerald"
                  size="sm"
                  onClick={handleTestSasPay}
                  isLoading={isTestingSasPay}
                  leftIcon={<Activity size={14} />}
                >
                  Tester la connexion API SasPay
                </Button>

                {saspayTestResult && (
                  <div
                    className={`p-2.5 rounded-lg flex items-center gap-2 text-xs font-medium ${
                      saspayTestResult.success
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                        : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-500/30'
                    }`}
                  >
                    {saspayTestResult.success ? (
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    ) : (
                      <Lock size={16} className="text-red-600 shrink-0" />
                    )}
                    <span>
                      {saspayTestResult.message}
                      {saspayTestResult.latencyMs && (
                        <strong className="ml-1 font-mono">({saspayTestResult.latencyMs} ms)</strong>
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 2: MOYENS DE PAIEMENT */}
      {activeTab === 'payments' && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Numéros d'encaissement Mobile Money & SasPay</CardTitle>
              <p className="text-xs text-slate-500">
                Ces comptes reçoivent les cotisations de vos participants
              </p>
            </div>
          </CardHeader>

          <form onSubmit={handleSavePayments} className="space-y-4">
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
              <ShieldCheck size={16} className="shrink-0 mt-0.5 text-emerald-600" />
              <span>
                La passerelle <strong>SasPay</strong> gère automatiquement les transactions Orange Money et MTN MoMo avec validation instantanée.
              </span>
            </div>

            <Input
              label="Numéro MTN Mobile Money marchand / personnel"
              value={momoNumber}
              onChange={(e) => setMomoNumber(e.target.value)}
              helperText="Compte principal pour les versements MTN au Cameroun."
            />

            <Input
              label="Numéro Orange Money marchand / personnel"
              value={orangeNumber}
              onChange={(e) => setOrangeNumber(e.target.value)}
              helperText="Compte principal pour les versements Orange Money."
            />

            <Input
              label="Numéro Wave"
              value={waveNumber}
              onChange={(e) => setWaveNumber(e.target.value)}
              helperText="Pour les participants utilisant le portefeuille Wave."
            />

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <Button type="submit" variant="emerald" size="sm">
                Enregistrer mes comptes d'encaissement
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* TAB 3: PROFIL */}
      {activeTab === 'profile' && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Profil Modérateur</CardTitle>
              <p className="text-xs text-slate-500">
                Vos coordonnées visibles par les participants de vos tontines
              </p>
            </div>
          </CardHeader>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="flex items-center gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <Avatar name={currentUser.name} src={currentUser.avatarUrl} size="lg" />
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {currentUser.name}
                </h4>
                <p className="text-xs text-slate-400">Modérateur vérifié · {currentUser.country}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Nom et Prénom"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <Input
                label="Adresse email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                label="Téléphone principal"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
              <Input
                label="Ville / Région"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
              />
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <Button type="submit" variant="emerald" size="sm">
                Enregistrer les modifications
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* TAB 4: NOTIFICATIONS */}
      {activeTab === 'notifications' && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Canaux de rappel & alertes</CardTitle>
              <p className="text-xs text-slate-500">
                Paramétrez la façon dont vous et vos membres recevez les alertes
              </p>
            </div>
          </CardHeader>

          <div className="space-y-4">
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Rappels de cotisation journalière
              </h4>
              <p className="text-xs text-slate-500">
                Envoyer automatiquement un rappel WhatsApp ou SMS le matin à 08h00 aux participants dont la cotisation n'est pas encore consignée.
              </p>
              <div className="pt-2">
                <Checkbox
                  label="Activer les relances automatiques par WhatsApp"
                  defaultChecked
                />
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Alerte cagnotte et bénéficiaire du jour
              </h4>
              <p className="text-xs text-slate-500">
                Notifier le bénéficiaire du tour dès que la totalité du pot est collectée et prête au décaissement.
              </p>
              <div className="pt-2">
                <Checkbox
                  label="Notification push et SMS au bénéficiaire"
                  defaultChecked
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="emerald"
                size="sm"
                onClick={() => addToast('Préférences enregistrées', 'Vos paramètres de notifications sont actifs.', 'success')}
              >
                Sauvegarder les préférences
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* TAB 5: SÉCURITÉ */}
      {activeTab === 'security' && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Sécurité et authentification</CardTitle>
              <p className="text-xs text-slate-500">
                Protégez l'accès à vos comptes et transactions
              </p>
            </div>
          </CardHeader>

          <div className="space-y-4 max-w-md">
            <Input
              label="Mot de passe actuel"
              type="password"
              placeholder="••••••••"
            />
            <Input
              label="Nouveau mot de passe"
              type="password"
              placeholder="Minimum 8 caractères"
            />
            <Input
              label="Confirmer le nouveau mot de passe"
              type="password"
              placeholder="Minimum 8 caractères"
            />

            <div className="pt-2">
              <Button
                variant="emerald"
                size="sm"
                onClick={() => addToast('Sécurité', 'Mot de passe mis à jour avec succès.', 'success')}
              >
                Mettre à jour le mot de passe
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
