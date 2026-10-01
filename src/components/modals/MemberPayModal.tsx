import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { useApp } from '../../context/AppContext';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { formatFCFA } from '../../utils/formatters';
import {
  CheckCircle2,
  ShieldCheck,
  Smartphone,
  Zap,
  FileText,
  CreditCard,
  Globe,
  ExternalLink,
  Lock,
} from 'lucide-react';
import { TontineGroup, PaymentTransaction } from '../../types';
import { ReceiptModal } from './ReceiptModal';
import {
  SUPPORTED_COUNTRIES,
  CurrencyCode,
  convertCurrency,
  formatCurrencyAmount,
  WHITE_LABEL_TEXTS,
  requestSasPaySession,
} from '../../lib/saspay';
import { useNavigate } from 'react-router-dom';

interface MemberPayModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: TontineGroup;
}

export const MemberPayModal: React.FC<MemberPayModalProps> = ({
  isOpen,
  onClose,
  group,
}) => {
  const navigate = useNavigate();
  const { currentUser, addToast } = useApp();

  const [selectedCountryCode, setSelectedCountryCode] = useState<string>('CM');
  const selectedCountry = SUPPORTED_COUNTRIES.find((c) => c.code === selectedCountryCode) || SUPPORTED_COUNTRIES[1];

  const [operator, setOperator] = useState<string>(selectedCountry.operators[0] || 'Orange Money');
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>('XAF');
  const [phone, setPhone] = useState(currentUser?.phone || `${selectedCountry.dialCode} `);

  const [step, setStep] = useState<'form' | 'gateway_loading' | 'ussd' | 'webhook' | 'success'>('form');
  const [generatedTx, setGeneratedTx] = useState<PaymentTransaction | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);

  // Conversion de montant dans la devise sélectionnée
  const baseAmountInFCFA = group.contributionAmount;
  const convertedAmount = convertCurrency(baseAmountInFCFA, 'XOF', selectedCurrency);

  // Changement de pays
  const handleCountryChange = (countryCode: string) => {
    setSelectedCountryCode(countryCode);
    const country = SUPPORTED_COUNTRIES.find((c) => c.code === countryCode);
    if (country) {
      setOperator(country.operators[0] || 'Mobile Money');
      setSelectedCurrency(country.currency);
      setPhone(`${country.dialCode} `);
    }
  };

  /**
   * Initialise le paiement via le guichet sécurisé avec stratégie multi-endpoint fallback
   */
  const handleGatewayCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep('gateway_loading');

    try {
      const orderId = `TF-ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const session = await requestSasPaySession({
        amount: convertedAmount,
        currency: selectedCurrency,
        orderId,
        customerEmail: currentUser?.email || 'client@tontiflow.africa',
        customerPhone: phone,
        customerName: currentUser?.name || 'Membre TontiFlow',
        metadata: {
          groupId: group.id,
          groupName: group.name,
          memberId: currentUser?.id,
          operator,
          type: 'contribution',
        },
      });

      if (session && session.checkout_url) {
        addToast(WHITE_LABEL_TEXTS.badgeSecure, 'Redirection vers le guichet de paiement...', 'info');
        onClose();
        // Redirection vers le guichet sécurisé ou vue de traitement
        if (session.checkout_url.startsWith('http') && !session.checkout_url.includes(window.location.host)) {
          window.location.href = session.checkout_url;
        } else {
          navigate(session.checkout_url);
        }
      } else {
        throw new Error('Impossible de générer le guichet.');
      }
    } catch (err: any) {
      setStep('form');
      addToast('Erreur passerelle', WHITE_LABEL_TEXTS.errorMessage, 'error');
    }
  };

  const handleFinish = () => {
    setStep('form');
    onClose();
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleFinish}
        title={step === 'success' ? 'Cotisation Validée & Sécurisée' : 'Payer ma cotisation'}
        maxWidth="md"
      >
        {step === 'form' && (
          <form onSubmit={handleGatewayCheckout} className="space-y-4 text-left text-xs">
            {/* Top Badges */}
            <div className="flex items-center justify-between pb-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 font-semibold text-[11px]">
                <ShieldCheck size={14} />
                <span>{WHITE_LABEL_TEXTS.badgeSecure}</span>
              </div>
              <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                {WHITE_LABEL_TEXTS.badgeInstant}
              </span>
            </div>

            {/* Summary Box */}
            <div className="p-4 rounded-xl bg-slate-100/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                  {group.name}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Tour #{group.currentDay} / {group.totalMembersCount}
                </span>
              </div>

              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                    {formatCurrencyAmount(convertedAmount, selectedCurrency)}
                  </span>
                  {selectedCurrency !== 'XOF' && selectedCurrency !== 'XAF' && (
                    <span className="text-[11px] text-slate-400 block">
                      ≈ {formatFCFA(baseAmountInFCFA)}
                    </span>
                  )}
                </div>

                {/* Sélecteur de Devise */}
                <select
                  value={selectedCurrency}
                  onChange={(e) => setSelectedCurrency(e.target.value as CurrencyCode)}
                  aria-label="Sélectionner la devise"
                  className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  <option value="XAF">FCFA (CEMAC)</option>
                  <option value="XOF">FCFA (UEMOA)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GHS">GHS (GH₵)</option>
                  <option value="KES">KES (KSh)</option>
                </select>
              </div>
            </div>

            {/* Sélecteur de Pays */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Globe size={14} className="text-slate-400" />
                <span>Pays de facturation Mobile Money</span>
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5 max-h-28 overflow-y-auto p-1 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50">
                {SUPPORTED_COUNTRIES.map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => handleCountryChange(country.code)}
                    className={`p-1.5 rounded-lg text-center transition-all cursor-pointer flex flex-col items-center gap-0.5 border ${
                      selectedCountryCode === country.code
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-semibold ring-1 ring-emerald-500'
                        : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span className="text-base">{country.flag}</span>
                    <span className="text-[10px] truncate max-w-full font-medium">{country.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Operators in Country */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Opérateur de paiement ({selectedCountry.name})
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {selectedCountry.operators.map((op) => {
                  const isSelected = operator === op;
                  return (
                    <button
                      key={op}
                      type="button"
                      onClick={() => setOperator(op)}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold ring-2 ring-emerald-500/20'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {op.toLowerCase().includes('carte') ? (
                        <CreditCard size={16} className="text-slate-600 dark:text-slate-400" />
                      ) : (
                        <Smartphone size={16} className="text-emerald-600 dark:text-emerald-400" />
                      )}
                      <span className="text-xs truncate">{op}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Numéro de téléphone */}
            <Input
              label="Numéro de compte Mobile Money (ou Carte)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              leftIcon={<Smartphone size={16} />}
              required
              helperText={`Format attendu avec indicatif : ${selectedCountry.dialCode} ...`}
            />

            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300 text-[11px]">
              <Lock size={15} className="text-emerald-600 shrink-0" />
              <span>
                {WHITE_LABEL_TEXTS.subtitle}
              </span>
            </div>

            {/* Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="outline" size="sm" onClick={onClose} className="w-full sm:w-auto">
                Annuler
              </Button>

              <Button
                type="submit"
                variant="emerald"
                size="md"
                className="w-full sm:flex-1 font-bold text-xs"
                rightIcon={<ExternalLink size={15} />}
              >
                Payer via {WHITE_LABEL_TEXTS.buttonLabel}
              </Button>
            </div>
          </form>
        )}

        {/* LOADING GATEWAY SESSION */}
        {step === 'gateway_loading' && (
          <div className="py-10 flex flex-col items-center text-center space-y-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
              <ShieldCheck className="w-7 h-7 text-emerald-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                {WHITE_LABEL_TEXTS.loadingSession}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mt-1">
                Connexion sécurisée aux serveurs bancaires et de télécommunication agréés...
              </p>
            </div>
          </div>
        )}

        {/* USSD APPROVAL */}
        {step === 'ussd' && (
          <div className="py-8 flex flex-col items-center text-center space-y-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
              <Smartphone className="w-6 h-6 text-emerald-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                Approbation USSD en attente...
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mt-1">
                Veuillez valider le prompt avec votre code PIN {operator} sur votre téléphone ({phone}).
              </p>
            </div>
          </div>
        )}

        {/* WEBHOOK PROCESSING */}
        {step === 'webhook' && (
          <div className="py-8 flex flex-col items-center text-center space-y-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin" />
              <Zap className="w-6 h-6 text-amber-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                Traitement du Webhook Sécurisé...
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mt-1">
                Validation du hash cryptographique et mise à jour instantanée du grand livre de la tontine.
              </p>
            </div>
          </div>
        )}

        {/* SUCCESS STATE */}
        {step === 'success' && (
          <div className="py-4 flex flex-col items-center text-center space-y-4 text-xs">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 size={36} />
            </div>
            <div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                Cotisation validée avec succès !
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mt-1">
                Votre versement de <strong className="text-slate-900 dark:text-white">{formatCurrencyAmount(convertedAmount, selectedCurrency)}</strong> pour la tontine <strong className="text-slate-900 dark:text-white">{group.name}</strong> a bien été comptabilisé.
              </p>
            </div>

            <div className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 font-mono text-slate-500 text-left space-y-1.5 border border-slate-200/60 dark:border-slate-700/60">
              <div className="flex justify-between">
                <span>Réf. Transaction :</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  {generatedTx?.transactionRef || 'TRX-ONLINE'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>N° de Reçu officiel :</span>
                <strong className="text-emerald-600 dark:text-emerald-400">
                  {generatedTx?.receiptNumber || 'REC-VERIFIED'}
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Opérateur :</span>
                <span>{operator}</span>
              </div>
              <div className="flex justify-between">
                <span>Statut :</span>
                <span className="text-emerald-600 font-semibold">Validé & Sécurisé</span>
              </div>
            </div>

            <div className="w-full flex items-center gap-2">
              <Button
                variant="outline"
                size="md"
                className="flex-1"
                onClick={() => setReceiptOpen(true)}
                leftIcon={<FileText size={15} />}
              >
                Voir le reçu officiel
              </Button>
              <Button
                variant="emerald"
                size="md"
                className="flex-1"
                onClick={handleFinish}
              >
                Terminer
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reçu officiel modal */}
      {generatedTx && (
        <ReceiptModal
          isOpen={receiptOpen}
          onClose={() => setReceiptOpen(false)}
          transaction={generatedTx}
        />
      )}
    </>
  );
};
