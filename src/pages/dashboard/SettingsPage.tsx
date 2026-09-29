import React, { useState } from 'react';
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
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { currentUser, setCurrentUser, addToast } = useApp();
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'payments' | 'security' | 'billing'>('profile');

  // Profile form
  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [phone, setPhone] = useState(currentUser.phone);
  const [city, setCity] = useState(currentUser.city || 'Douala');

  // Mobile Money accounts
  const [momoNumber, setMomoNumber] = useState('+237 6 99 45 22 10');
  const [orangeNumber, setOrangeNumber] = useState('+237 6 94 33 21 00');
  const [waveNumber, setWaveNumber] = useState('+237 6 75 12 34 56');

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
    { id: 'profile', label: 'Mon Profil', icon: <User size={15} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={15} /> },
    { id: 'payments', label: 'Moyens d\'encaissement', icon: <Smartphone size={15} /> },
    { id: 'security', label: 'Sécurité & Accès', icon: <Lock size={15} /> },
    { id: 'billing', label: 'Facturation SaaS', icon: <Receipt size={15} /> },
  ];

  return (
    <div className="max-w-4xl space-y-6 text-left pb-12">
      {/* Header bar */}
      <div className="pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Paramètres du compte
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Gérez votre profil, vos canaux de paiement et vos préférences d'alerte.
        </p>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={tabsList}
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as any)}
        variant="segmented"
      />

      {/* TAB 1: PROFIL */}
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

      {/* TAB 2: NOTIFICATIONS */}
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

      {/* TAB 3: MOYENS DE PAIEMENT */}
      {activeTab === 'payments' && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Numéros d'encaissement Mobile Money</CardTitle>
              <p className="text-xs text-slate-500">
                Ces comptes reçoivent les cotisations de vos participants
              </p>
            </div>
          </CardHeader>

          <form onSubmit={handleSavePayments} className="space-y-4">
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

      {/* TAB 4: SÉCURITÉ */}
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

      {/* TAB 5: FACTURATION SAAS */}
      {activeTab === 'billing' && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Abonnement TontiFlow</CardTitle>
              <p className="text-xs text-slate-500">
                Gérez votre formule SaaS et vos factures
              </p>
            </div>
          </CardHeader>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
                  Formule active
                </span>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  Pro Modérateur (4 900 FCFA / mois)
                </h4>
                <p className="text-xs text-slate-500">Groupes illimités · Jusqu'à 50 membres par groupe</p>
              </div>

              <div className="text-right">
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-md">
                  <CheckCircle2 size={13} /> Actif
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
              <span className="text-slate-500">Prochain renouvellement : <strong>28 Octobre 2026</strong></span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addToast('Facturation', 'Redirection vers le portail de facturation sécurisé...', 'info')}
              >
                Changer de formule
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
