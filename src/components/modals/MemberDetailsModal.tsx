import React from 'react';
import { Modal } from '../ui/Modal';
import { Member } from '../../types';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { formatFCFA, formatDate } from '../../utils/formatters';
import { Phone, Mail, MapPin, Calendar, Award, MessageSquare } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface MemberDetailsModalProps {
  member: Member | null;
  isOpen: boolean;
  onClose: () => void;
}

export const MemberDetailsModal: React.FC<MemberDetailsModalProps> = ({
  member,
  isOpen,
  onClose,
}) => {
  const { addToast } = useApp();

  if (!member) return null;

  const handleWhatsApp = () => {
    const text = encodeURIComponent(
      `Bonjour ${member.name}, rappel amical concernant votre participation à notre tontine TontiFlow.`
    );
    window.open(`https://wa.me/${member.phone.replace(/[^0-9]/g, '')}?text=${text}`, '_blank');
  };

  const handleReminderSMS = () => {
    addToast('Rappel envoyé', `Un SMS de relance a été envoyé à ${member.name}.`, 'info');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Fiche du membre"
      maxWidth="md"
    >
      <div className="space-y-5 text-left">
        {/* Profile Card Header */}
        <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
          <Avatar
            name={member.name}
            src={member.avatarUrl}
            size="lg"
          />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {member.name}
              </h3>
              <Badge variant={member.status === 'active' ? 'success' : 'danger'}>
                {member.status === 'active' ? 'Actif' : 'Inactif'}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
              <MapPin size={13} /> {member.city} · Membre depuis le {formatDate(member.joinedDate)}
            </p>
          </div>
        </div>

        {/* Trust Score & Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-center">
            <span className="text-[11px] text-slate-500 block mb-1">Score Confiance</span>
            <div className="flex items-center justify-center gap-1">
              <Award className="w-4 h-4 text-emerald-500" />
              <span className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {member.trustScore}%
              </span>
            </div>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-center">
            <span className="text-[11px] text-slate-500 block mb-1">Total Cotisé</span>
            <span className="text-sm font-bold font-mono text-slate-900 dark:text-white block mt-0.5">
              {formatFCFA(member.totalContributed)}
            </span>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-center">
            <span className="text-[11px] text-slate-500 block mb-1">Groupes Actifs</span>
            <span className="text-lg font-bold font-mono text-slate-900 dark:text-white block">
              {member.groupsCount}
            </span>
          </div>
        </div>

        {/* Contact details */}
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
            <span className="text-slate-500 flex items-center gap-2">
              <Phone size={14} /> Téléphone
            </span>
            <span className="font-mono font-medium text-slate-900 dark:text-white">
              {member.phone}
            </span>
          </div>
          <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
            <span className="text-slate-500 flex items-center gap-2">
              <Mail size={14} /> Email
            </span>
            <span className="font-medium text-slate-900 dark:text-white">
              {member.email}
            </span>
          </div>
        </div>

        {member.notes && (
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs">
            <strong className="text-amber-800 dark:text-amber-300 block mb-0.5">Note modérateur:</strong>
            <p className="text-amber-900 dark:text-amber-200">{member.notes}</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="pt-2 flex flex-col sm:flex-row gap-2 border-t border-slate-100 dark:border-slate-800">
          <Button
            variant="emerald"
            size="sm"
            onClick={handleWhatsApp}
            leftIcon={<MessageSquare size={16} />}
            className="flex-1"
          >
            Contacter sur WhatsApp
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReminderSMS}
            className="flex-1"
          >
            Envoyer rappel SMS
          </Button>
        </div>
      </div>
    </Modal>
  );
};
