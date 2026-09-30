import React from 'react';
import { Modal } from '../ui/Modal';
import { Member } from '../../types';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { formatFCFA, formatDate, formatAccessCode, generate6DigitCode } from '../../utils/formatters';
import { Phone, Mail, MapPin, Calendar, Award, MessageSquare, ShieldCheck, AlertTriangle, KeyRound, Copy, Share2 } from 'lucide-react';
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
  const { groups, addToast } = useApp();

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

  const isGuaranteeDepleted = member.status === 'GUARANTEE_DEPLETED' || (member.status as string) === 'guarantee_depleted';

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
              {isGuaranteeDepleted ? (
                <Badge variant="danger">
                  Caution Épuisée
                </Badge>
              ) : (
                <Badge variant={member.status === 'active' ? 'success' : 'danger'}>
                  {member.status === 'active' ? 'Actif' : 'Inactif'}
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
              <MapPin size={13} /> {member.city} · Membre depuis le {formatDate(member.joinedDate)}
            </p>
          </div>
        </div>

        {/* Depleted Guarantee Warning */}
        {isGuaranteeDepleted && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-900 dark:text-rose-200 text-xs space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-rose-700 dark:text-rose-400">
              <AlertTriangle size={16} />
              <span>Dépôt de garantie épuisé (Retard non régularisé)</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-700 dark:text-slate-300">
              La caution de ce membre a été prélevée suite à une défaillance. Pour réactiver son statut en <strong>ACTIVE</strong>, le membre doit verser la cotisation manquante (recharge caution) majorée de la <strong>pénalité de retard</strong> définie par l'administrateur.
            </p>
          </div>
        )}

        {/* Trust Score & Financial Stats */}
        <div className="grid grid-cols-4 gap-2">
          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-center">
            <span className="text-[10px] text-slate-500 block mb-1">Score Confiance</span>
            <div className="flex items-center justify-center gap-1">
              <Award className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {member.trustScore}%
              </span>
            </div>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-center">
            <span className="text-[10px] text-slate-500 block mb-1">Caution Dispo</span>
            <span className={`text-xs font-bold font-mono block mt-0.5 ${isGuaranteeDepleted ? 'text-rose-600' : 'text-emerald-600'}`}>
              {formatFCFA(member.guaranteeBalance ?? 0)}
            </span>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-center">
            <span className="text-[10px] text-slate-500 block mb-1">Total Cotisé</span>
            <span className="text-xs font-bold font-mono text-slate-900 dark:text-white block mt-0.5">
              {formatFCFA(member.totalContributed)}
            </span>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-center">
            <span className="text-[10px] text-slate-500 block mb-1">Groupes</span>
            <span className="text-base font-bold font-mono text-slate-900 dark:text-white block">
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

        {/* Tontines & Codes 6 chiffres */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <KeyRound size={14} className="text-emerald-500" />
              Codes secrets d'accès aux tontines (Connexion membre)
            </span>
          </div>

          {(() => {
            const cleanP = member.phone.replace(/\D/g, '');
            const memberGroups = groups.filter((g) =>
              g.members.some(
                (m) =>
                  m.memberId === member.id ||
                  (m.accessCode && g.beneficiarySchedule.some((b) => (b.memberPhone || '').replace(/\D/g, '').endsWith(cleanP.slice(-8))))
              ) ||
              g.beneficiarySchedule.some(
                (b) =>
                  b.memberId === member.id ||
                  (b.memberPhone || '').replace(/\D/g, '').endsWith(cleanP.slice(-8))
              )
            );

            if (memberGroups.length === 0) {
              return (
                <div className="p-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400 text-center">
                  Ce membre n'est actuellement inscrit à aucune tontine active.
                </div>
              );
            }

            return (
              <div className="space-y-2">
                {memberGroups.map((g) => {
                  const gm = g.members.find(
                    (m) =>
                      m.memberId === member.id ||
                      g.beneficiarySchedule.some((b) => b.memberId === m.memberId && (b.memberPhone || '').replace(/\D/g, '').endsWith(cleanP.slice(-8)))
                  );
                  const sched = g.beneficiarySchedule.find(
                    (b) =>
                      b.memberId === member.id ||
                      (b.memberPhone || '').replace(/\D/g, '').endsWith(cleanP.slice(-8))
                  );
                  const code =
                    gm?.accessCode ||
                    sched?.accessCode ||
                    generate6DigitCode(member.id + g.id);

                  return (
                    <div
                      key={g.id}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <span className="font-bold text-xs text-slate-900 dark:text-white block truncate">
                          {g.name}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          Cotisation : {formatFCFA(g.contributionAmount)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded-md border border-emerald-500/20">
                          {formatAccessCode(code)}
                        </span>

                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard?.writeText(code);
                            addToast('Code copié !', `Code de ${member.name} (${code}) copié.`, 'success');
                          }}
                          className="p-1 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded transition-colors cursor-pointer"
                          title="Copier le code"
                        >
                          <Copy size={13} />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const text = encodeURIComponent(
                              `Bonjour ${member.name},\nVoici votre code secret d'accès à 6 chiffres pour la tontine « ${g.name} » : ${code}.\nConnectez-vous sur ${window.location.origin}/login avec votre numéro (${member.phone}) et ce code.`
                            );
                            window.open(`https://wa.me/?text=${text}`, '_blank');
                          }}
                          className="p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded transition-colors cursor-pointer"
                          title="Envoyer le code par WhatsApp"
                        >
                          <Share2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
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
