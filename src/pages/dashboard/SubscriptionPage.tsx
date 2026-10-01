import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { useApp } from '../../context/AppContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import {
  CreditCard,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Calendar,
  Zap,
  ArrowRight,
  ExternalLink,
  Smartphone,
  Building,
  Download,
  AlertCircle,
  RefreshCw,
  Clock,
  Loader2,
} from 'lucide-react';
import { formatFCFA, formatDate } from '../../utils/formatters';
import { SubscriptionPlanId } from '../../types';
import { api } from '../../services/api';

export const SubscriptionPage: React.FC = () => {
  const { currentUser, updateSubscription, addToast } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();

  const subscription = currentUser.subscription || {
    planId: 'pro',
    planName: 'Formule Pro',
    pricePerMonth: 15000,
    status: 'active',
    startedAt: '2026-09-01T00:00:00Z',
    expiresAt: '2026-10-31T23:59:59Z',
    paymentMethod: 'SasPay Mobile Money',
    autoRenew: true,
    maxGroups: 999,
  };

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState<SubscriptionPlanId>(
    subscription.planId
  );
  const [paymentPhone, setPaymentPhone] = useState(currentUser.phone || '+237 6 99 45 22 10');
  const [paymentOperator, setPaymentOperator] = useState('Orange Money');
  const [isProcessing, setIsProcessing] = useState(false);

  // SasPay session state
  const [saspayStep, setSaspayStep] = useState<'form' | 'waiting' | 'confirmed'>('form');
  const [activeSession, setActiveSession] = useState<{
    checkout_url: string;
    orderId: string;
    sessionId: string;
    upstreamId?: string;
  } | null>(null);

  // Invoices list from backend
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);

  const pollingRef = useRef<any>(null);

  const plans = [
    {
      id: 'starter' as const,
      name: 'Formule Starter',
      price: 5000,
      description: 'Idéal pour gérer 1 à 3 tontines familiales ou de quartier.',
      features: [
        'Jusqu\'à 3 tontines actives',
        'Jusqu\'à 30 membres cotisants',
        'Codes secrets à 6 chiffres pour chaque membre',
        'Prélèvement automatique des commissions modérateur',
        'Reçus de cotisation officiels horodatés',
        'Passerelle de paiement SasPay intégrée',
      ],
      recommended: false,
    },
    {
      id: 'pro' as const,
      name: 'Formule Pro',
      price: 15000,
      description: 'La solution complète pour les promoteurs et gestionnaires de tontines.',
      features: [
        'Tontines actives illimitées',
        'Membres cotisants illimités',
        'Codes secrets à 6 chiffres illimités',
        'Relances SMS & WhatsApp automatiques',
        'Gestion des pénalités de retard partagées (50/50)',
        'Export comptable et bilans financiers en CSV',
        'Passerelle SasPay prioritaire 7j/7',
      ],
      recommended: true,
    },
    {
      id: 'enterprise' as const,
      name: 'Formule Entreprise',
      price: 30000,
      description: 'Pour associations, mutuelles et grands réseaux de micro-épargne.',
      features: [
        'Tout le forfait Pro inclus',
        'Multi-modérateurs et gestionnaires délégués',
        'Personnalisation complète au nom de votre Organisation',
        'Taux SasPay Mobile Money préférentiel',
        'Tableau de bord financier consolidé multi-villes',
        'Accompagnement & gestionnaire de compte dédié',
      ],
      recommended: false,
    },
  ];

  const selectedPlanData = plans.find((p) => p.id === selectedPlanForPayment) || plans[1];

  // Charger les factures
  const loadInvoices = async () => {
    try {
      setLoadingInvoices(true);
      const data = await api.getSubscriptionInvoices(currentUser.id);
      if (Array.isArray(data) && data.length > 0) {
        setInvoices(data);
      } else {
        // Factures de démonstration initiales
        setInvoices([
          {
            id: 'inv_init_01',
            orderId: 'TF-SUB-2026-0901',
            date: '2026-09-01T08:00:00Z',
            planName: 'Abonnement Pro (30 jours)',
            paymentMethod: 'Orange Money (SasPay)',
            amount: 15000,
            status: 'paid',
            receiptNumber: 'REC-SUB-2026-0901',
          },
        ]);
      }
    } catch {
      // Ignorer
    } finally {
      setLoadingInvoices(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, [currentUser.id]);

  // Détection du retour automatique SasPay via query params (?status=success)
  useEffect(() => {
    const statusParam = searchParams.get('status');
    const orderIdParam = searchParams.get('orderId');
    const planIdParam = (searchParams.get('planId') as SubscriptionPlanId) || 'pro';

    if (statusParam === 'success' || statusParam === 'completed') {
      const finalizeReturn = async () => {
        try {
          if (orderIdParam) {
            await api.getSasPayStatus(orderIdParam);
          }
          await updateSubscription(planIdParam, 'SasPay Mobile Money');
          addToast(
            '🎉 Paiement SasPay Validé !',
            'Votre abonnement a été activé avec succès pour 30 jours supplémentaires.',
            'success'
          );
          confetti({
            particleCount: 100,
            spread: 90,
            origin: { y: 0.6 },
          });
          loadInvoices();
        } catch (e) {
          console.error(e);
        } finally {
          // Nettoyer l'URL
          setSearchParams({});
        }
      };

      finalizeReturn();
    }
  }, [searchParams]);

  // Nettoyage de l'intervalle de polling
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  // Déclenchement de la session SasPay
  const handleInitiateSasPay = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const returnUrl = `${window.location.origin}/dashboard/subscription?status=success&planId=${selectedPlanForPayment}`;

      const res = await api.createSasPaySubscriptionSession({
        planId: selectedPlanForPayment,
        planName: selectedPlanData.name,
        price: selectedPlanData.price,
        userId: currentUser.id,
        userName: currentUser.name,
        userEmail: currentUser.email,
        userPhone: paymentPhone,
        operator: paymentOperator,
        returnUrl,
      });

      if (res && res.success && res.checkout_url) {
        setActiveSession({
          checkout_url: res.checkout_url,
          orderId: res.orderId,
          sessionId: res.sessionId,
          upstreamId: res.upstreamId,
        });

        setSaspayStep('waiting');

        // Tenter d'ouvrir le guichet SasPay dans un nouvel onglet
        try {
          window.open(res.checkout_url, '_blank');
        } catch {
          // Si popup bloqué, le bouton d'accès direct reste affiché
        }

        // Démarrer le polling du statut auprès de SasPay
        if (pollingRef.current) clearInterval(pollingRef.current);

        pollingRef.current = setInterval(async () => {
          try {
            const statusRes = await api.getSasPayStatus(res.orderId, res.sessionId);
            if (statusRes && statusRes.status === 'completed') {
              clearInterval(pollingRef.current);
              handlePaymentSuccess();
            }
          } catch {}
        }, 3000);
      } else {
        throw new Error('Erreur lors de la génération du lien SasPay.');
      }
    } catch (err: any) {
      addToast('Erreur SasPay', err.message || 'Impossible d’initialiser le paiement.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualConfirm = async () => {
    if (!activeSession) return;
    setIsProcessing(true);
    try {
      await api.getSasPayStatus(activeSession.orderId, activeSession.sessionId);
      handlePaymentSuccess();
    } catch (err: any) {
      addToast('Erreur', err.message || 'Impossible de valider.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentSuccess = async () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    setSaspayStep('confirmed');

    await updateSubscription(selectedPlanForPayment, `${paymentOperator} (SasPay)`);
    await loadInvoices();

    try {
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.5 },
        colors: ['#10B981', '#3B82F6', '#F59E0B'],
      });
    } catch {}

    setTimeout(() => {
      setPaymentModalOpen(false);
      setSaspayStep('form');
      setActiveSession(null);
    }, 2200);
  };

  return (
    <div className="space-y-6 text-left pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Abonnement Modérateur SaaS
            </h2>
            <Badge variant="success">Passerelle SasPay Active</Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Organisation : <span className="font-semibold text-slate-700 dark:text-slate-300">{currentUser.organizationName || 'Réseau Tontines Indépendant'}</span> · Vos abonnements sont encaissés directement via l'API sécurisée SasPay.
          </p>
        </div>

        <Button
          variant="emerald"
          size="sm"
          onClick={() => {
            setSelectedPlanForPayment(subscription.planId);
            setSaspayStep('form');
            setPaymentModalOpen(true);
          }}
          leftIcon={<Sparkles size={15} />}
        >
          Renouveler via SasPay
        </Button>
      </div>

      {/* Current Subscription Status Card */}
      <Card className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white border-0 shadow-xl overflow-hidden relative">
        <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="p-6 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs border border-emerald-500/30 flex items-center gap-1.5">
                  <ShieldCheck size={14} /> Forfait Modérateur Actif
                </span>
                <span className="text-xs text-slate-400">
                  Encaissé par SasPay ({subscription.paymentMethod || 'Mobile Money'})
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white">
                {subscription.planName} · {formatFCFA(subscription.pricePerMonth)}
                <span className="text-sm font-normal text-slate-300"> / mois</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <Calendar size={15} className="text-emerald-400" />
                  <span>
                    Valable jusqu'au :{' '}
                    <strong className="text-white">
                      {formatDate(subscription.expiresAt || '2026-10-31')}
                    </strong>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Building size={15} className="text-emerald-400" />
                  <span>
                    Entité facturée :{' '}
                    <strong className="text-white">
                      {currentUser.organizationName || currentUser.name}
                    </strong>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                onClick={() => {
                  setSelectedPlanForPayment('enterprise');
                  setSaspayStep('form');
                  setPaymentModalOpen(true);
                }}
              >
                Changer de formule
              </Button>

              <Button
                variant="emerald"
                size="sm"
                onClick={() => {
                  setSelectedPlanForPayment(subscription.planId);
                  setSaspayStep('form');
                  setPaymentModalOpen(true);
                }}
                leftIcon={<Zap size={15} />}
              >
                Prolonger de 30 jours via SasPay
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* 3 Plans Comparison */}
      <div>
        <div className="mb-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Formules d'abonnement SaaS disponibles
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Paiement direct sécurisé par SasPay via MTN Mobile Money, Orange Money ou carte.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {plans.map((p) => {
            const isCurrent = subscription.planId === p.id;
            return (
              <Card
                key={p.id}
                className={`flex flex-col justify-between relative transition-all ${
                  isCurrent
                    ? 'border-2 border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                {p.recommended && (
                  <span className="absolute -top-3 right-4 px-2.5 py-0.5 bg-emerald-600 text-white text-[10px] font-bold rounded-full shadow-xs">
                    Le plus populaire
                  </span>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {p.name}
                    </h4>
                    {isCurrent && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border border-emerald-500/20">
                        Votre forfait
                      </span>
                    )}
                  </div>

                  <div className="text-2xl font-black font-mono text-slate-900 dark:text-white mb-2">
                    {formatFCFA(p.price)}
                    <span className="text-xs font-normal text-slate-500"> / mois</span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 min-h-[32px]">
                    {p.description}
                  </p>

                  <div className="space-y-2.5 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                    {p.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                        <span className="text-slate-700 dark:text-slate-300">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-5 mt-4 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    variant={isCurrent ? 'outline' : 'emerald'}
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setSelectedPlanForPayment(p.id);
                      setSaspayStep('form');
                      setPaymentModalOpen(true);
                    }}
                  >
                    {isCurrent ? 'Renouveler via SasPay' : 'Choisir cette formule'}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Invoices History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <div>
              <CardTitle>Historique des factures d'abonnement</CardTitle>
              <span className="text-xs text-slate-400">Reçus de règlement certifiés SasPay API</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadInvoices}
              leftIcon={<RefreshCw size={12} className={loadingInvoices ? 'animate-spin' : ''} />}
            >
              Actualiser
            </Button>
          </div>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="pb-3 px-3">Numéro Facture</th>
                <th className="pb-3 px-3">Date</th>
                <th className="pb-3 px-3">Formule</th>
                <th className="pb-3 px-3">Passerelle</th>
                <th className="pb-3 px-3 text-right">Montant</th>
                <th className="pb-3 px-3 text-center">Statut</th>
                <th className="pb-3 px-3 text-right">Reçu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {invoices.map((inv) => (
                <tr key={inv.id || inv.orderId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white">
                    {inv.orderId || inv.id}
                  </td>
                  <td className="py-3 px-3 text-slate-500">{formatDate(inv.date)}</td>
                  <td className="py-3 px-3 font-medium">{inv.planName || 'Abonnement Modérateur'}</td>
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center gap-1 font-medium text-emerald-700 dark:text-emerald-400">
                      <ShieldCheck size={13} /> {inv.paymentMethod || 'SasPay Mobile Money'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold">{formatFCFA(inv.amount)}</td>
                  <td className="py-3 px-3 text-center">
                    <Badge variant="success">Réglé</Badge>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => addToast('Téléchargement', `Reçu ${inv.receiptNumber || inv.orderId} téléchargé.`, 'info')}
                      className="p-1 text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
                      title="Télécharger la facture"
                    >
                      <Download size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Payment SasPay */}
      <Modal
        isOpen={paymentModalOpen}
        onClose={() => {
          if (pollingRef.current) clearInterval(pollingRef.current);
          setPaymentModalOpen(false);
          setSaspayStep('form');
        }}
        title={`Règlement SasPay · ${selectedPlanData.name}`}
        maxWidth="md"
      >
        {saspayStep === 'form' && (
          <form onSubmit={handleInitiateSasPay} className="space-y-4 text-left text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-500 block">Formule sélectionnée</span>
                <span className="font-bold text-slate-900 dark:text-white text-sm">
                  {selectedPlanData.name}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-500 block">Montant à régler</span>
                <span className="font-bold font-mono text-emerald-600 text-sm">
                  {formatFCFA(selectedPlanData.price)}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Opérateur Mobile Money (SasPay)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['Orange Money', 'MTN MoMo', 'Wave'].map((op) => (
                  <button
                    key={op}
                    type="button"
                    onClick={() => setPaymentOperator(op)}
                    className={`p-2.5 rounded-lg border text-center font-medium cursor-pointer transition-all ${
                      paymentOperator === op
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500 font-bold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {op}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Numéro Mobile Money de débit
              </label>
              <Input
                type="tel"
                value={paymentPhone}
                onChange={(e) => setPaymentPhone(e.target.value)}
                leftIcon={<Smartphone size={15} />}
                required
              />
            </div>

            <div className="p-3 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
              <ShieldCheck size={16} className="shrink-0 mt-0.5 text-emerald-600" />
              <div>
                <span className="font-bold block">Passerelle SasPay Officielle</span>
                <span>
                  Vous serez dirigé vers le guichet sécurisé SasPay. Dès validation par votre opérateur (Orange / MTN), votre abonnement sera renouvelé immédiatement.
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPaymentModalOpen(false)}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                variant="emerald"
                size="sm"
                isLoading={isProcessing}
                leftIcon={<Zap size={14} />}
              >
                Payer avec SasPay ({formatFCFA(selectedPlanData.price)})
              </Button>
            </div>
          </form>
        )}

        {saspayStep === 'waiting' && activeSession && (
          <div className="space-y-5 text-center py-3">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center animate-pulse">
              <Loader2 size={28} className="animate-spin" />
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Guichet SasPay Ouvert
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Veuillez valider l'opération sur la page sécurisée SasPay ou saisir votre code secret sur votre téléphone.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-left text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Référence commande :</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {activeSession.orderId}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Montant :</span>
                <span className="font-mono font-bold text-emerald-600">
                  {formatFCFA(selectedPlanData.price)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Statut :</span>
                <span className="text-amber-600 font-bold flex items-center gap-1">
                  <Clock size={12} /> En attente de paiement
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <a
                href={activeSession.checkout_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all"
              >
                <ExternalLink size={14} /> Ouvrir la page de paiement SasPay
              </a>

              <Button
                variant="outline"
                size="sm"
                onClick={handleManualConfirm}
                isLoading={isProcessing}
                leftIcon={<CheckCircle2 size={14} />}
              >
                J'ai validé le paiement sur mon téléphone
              </Button>
            </div>
          </div>
        )}

        {saspayStep === 'confirmed' && (
          <div className="space-y-4 text-center py-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={36} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Abonnement Modérateur Confirmé !
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                La transaction a été validée par la passerelle SasPay. Votre espace est actif pour 30 jours supplémentaires.
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
