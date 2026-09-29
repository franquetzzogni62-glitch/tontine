import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Copy, Check, MessageSquareShare, Send, PhoneCall } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupName?: string;
  groupId?: string;
}

export const InviteModal: React.FC<InviteModalProps> = ({
  isOpen,
  onClose,
  groupName = 'Tontine Mélanie',
  groupId = 'grp_1',
}) => {
  const { addToast } = useApp();
  const [copied, setCopied] = useState(false);
  const [phone, setPhone] = useState('');
  const [memberName, setMemberName] = useState('');

  const inviteLink = `https://tontiflow.africa/join/${groupId}?ref=inv_987`;
  const whatsappMessage = encodeURIComponent(
    `Bonjour ! Tu es invité(e) à rejoindre notre tontine "${groupName}" sur TontiFlow. Clique ici pour voir les détails et participer : ${inviteLink}`
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    addToast('Lien copié', 'Le lien d\'invitation est prêt à être partagé.', 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendSMS = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;
    addToast('Invitation envoyée !', `Un SMS d'invitation a été adressé au ${phone}`, 'success');
    setPhone('');
    setMemberName('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Inviter des participants"
      description={`Partagez le lien d'adhésion sécurisé pour "${groupName}".`}
      maxWidth="md"
    >
      <div className="space-y-5">
        {/* Copy Link Box */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 text-left">
            Lien d'invitation direct
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={inviteLink}
              className="flex-1 min-h-[44px] px-3.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 truncate font-mono select-all"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              leftIcon={copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
            >
              {copied ? 'Copié' : 'Copier'}
            </Button>
          </div>
        </div>

        {/* WhatsApp Share Button */}
        <div>
          <a
            href={`https://wa.me/?text=${whatsappMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full min-h-[44px] px-4 py-2 text-sm font-semibold rounded-xl bg-[#25D366] text-white hover:bg-[#20bd5a] transition-all shadow-xs cursor-pointer"
          >
            <MessageSquareShare size={18} />
            <span>Partager via WhatsApp</span>
          </a>
        </div>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
          <span className="flex-shrink mx-4 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
            Ou inviter par SMS
          </span>
          <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
        </div>

        {/* SMS invite form */}
        <form onSubmit={handleSendSMS} className="space-y-3 text-left">
          <Input
            label="Nom du contact (optionnel)"
            placeholder="Ex: Jean Kouassi"
            value={memberName}
            onChange={(e) => setMemberName(e.target.value)}
          />
          <Input
            label="Numéro de téléphone WhatsApp / Mobile"
            placeholder="+237 6 xx xx xx xx"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <Button
            type="submit"
            variant="emerald"
            size="sm"
            className="w-full"
            leftIcon={<Send size={15} />}
          >
            Envoyer l'invitation SMS
          </Button>
        </form>
      </div>
    </Modal>
  );
};
