import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Tabs } from '../../components/ui/Tabs';
import { EmptyState } from '../../components/ui/EmptyState';
import { MemberDetailsModal } from '../../components/modals/MemberDetailsModal';
import { AddMemberModal } from '../../components/modals/AddMemberModal';
import { Member } from '../../types';
import {
  Search,
  Download,
  UserPlus,
  Award,
  Phone,
  MessageSquare,
  ShieldCheck,
  UserX,
  UserCheck2,
  Users,
  KeyRound,
  Copy,
  Share2,
} from 'lucide-react';
import {
  formatFCFA,
  formatDate,
  exportToCSV,
  formatAccessCode,
  generate6DigitCode,
} from '../../utils/formatters';

export const MembersPage: React.FC = () => {
  const { members, groups, updateMember, addToast } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);

  // Filter members
  const filteredMembers = members.filter((m) => {
    const isDepleted = m.status === 'GUARANTEE_DEPLETED' || (m.status as string) === 'guarantee_depleted';
    const matchesFilter =
      filter === 'all'
        ? true
        : filter === 'active'
        ? m.status === 'active'
        : filter === 'depleted'
        ? isDepleted
        : filter === 'inactive'
        ? m.status === 'inactive'
        : true;

    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.phone.includes(searchQuery) ||
      m.city.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const handleExportCSV = () => {
    exportToCSV(
      'membres_tontiflow.csv',
      members,
      [
        { key: 'name', header: 'Nom complet' },
        { key: 'phone', header: 'Téléphone' },
        { key: 'city', header: 'Ville / Quartier' },
        { key: 'trustScore', header: 'Score de confiance (%)' },
        { key: 'totalContributed', header: 'Total cotisé (FCFA)' },
        { key: 'status', header: 'Statut' },
      ]
    );
    addToast('Export terminé', 'Le fichier CSV des membres a été téléchargé.', 'success');
  };

  const handleToggleStatus = (member: Member) => {
    const newStatus = member.status === 'active' ? 'inactive' : 'active';
    updateMember(member.id, { status: newStatus });
    addToast(
      'Statut modifié',
      `${member.name} est maintenant ${newStatus === 'active' ? 'actif' : 'inactif'}.`,
      'info'
    );
  };

  const handleOpenDetails = (member: Member) => {
    setSelectedMember(member);
    setDetailsModalOpen(true);
  };

  const filterTabs = [
    { id: 'all', label: 'Tous les membres', count: members.length },
    { id: 'active', label: 'Actifs', count: members.filter((m) => m.status === 'active').length },
    {
      id: 'depleted',
      label: 'Cautions Épuisées',
      count: members.filter((m) => m.status === 'GUARANTEE_DEPLETED' || (m.status as string) === 'guarantee_depleted').length,
    },
    { id: 'inactive', label: 'Inactifs', count: members.filter((m) => m.status === 'inactive').length },
  ];

  return (
    <div className="space-y-6 text-left">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Membres de la communauté
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Gérez les participants, suivez leur régularité et consultez leur score de confiance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            leftIcon={<Download size={15} />}
            disabled={members.length === 0}
          >
            Exporter CSV
          </Button>
          <Button
            variant="emerald"
            size="sm"
            onClick={() => setAddModalOpen(true)}
            leftIcon={<UserPlus size={15} />}
          >
            Ajouter un membre
          </Button>
        </div>
      </div>

      {/* Filter and search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <Tabs
          tabs={filterTabs}
          activeTab={filter}
          onChange={setFilter}
        />

        <div className="w-full sm:w-72">
          <Input
            placeholder="Rechercher par nom, téléphone, ville..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search size={16} />}
          />
        </div>
      </div>

      {/* Members table or Empty State */}
      {filteredMembers.length === 0 ? (
        <EmptyState
          icon={<Users size={28} />}
          title={searchQuery ? 'Aucun membre correspondant' : 'Aucun membre enregistré'}
          description={
            searchQuery
              ? 'Aucun membre ne correspond à vos critères de recherche.'
              : 'Commencez par ajouter les premiers membres de votre tontine ou invitez-les par lien.'
          }
          actionLabel="Ajouter un membre"
          onAction={() => setAddModalOpen(true)}
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold">
                  <th className="pb-3 px-3">Membre</th>
                  <th className="pb-3 px-3">Téléphone & Ville</th>
                  <th className="pb-3 px-3 text-center">Score Confiance</th>
                  <th className="pb-3 px-3">Tontines & Codes 6 chiffres</th>
                  <th className="pb-3 px-3 text-right">Total cotisé</th>
                  <th className="pb-3 px-3 text-center">Statut</th>
                  <th className="pb-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredMembers.map((member) => (
                  <tr
                    key={member.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-3 font-medium text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={member.name} src={member.avatarUrl} size="sm" />
                        <div>
                          <span className="font-bold block leading-tight">{member.name}</span>
                          <span className="text-[11px] text-slate-400 font-normal">
                            Depuis le {formatDate(member.joinedDate)}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                      <div className="font-mono">{member.phone}</div>
                      <span className="text-[11px] text-slate-400">{member.city}</span>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <div className="inline-flex items-center gap-1 font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                        <Award size={13} />
                        <span>{member.trustScore}%</span>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      {(() => {
                        const cleanP = member.phone.replace(/\D/g, '');
                        const memberGroups = groups.filter((g) =>
                          g.members.some(
                            (m) =>
                              m.memberId === member.id ||
                              members
                                .find((mb) => mb.id === m.memberId)
                                ?.phone.replace(/\D/g, '')
                                .endsWith(cleanP.slice(-8))
                          ) ||
                          g.beneficiarySchedule.some(
                            (b) =>
                              b.memberId === member.id ||
                              (b.memberPhone || '').replace(/\D/g, '').endsWith(cleanP.slice(-8))
                          )
                        );

                        if (memberGroups.length === 0) {
                          return <span className="text-[11px] text-slate-400">Aucun groupe</span>;
                        }

                        return (
                          <div className="space-y-1.5">
                            {memberGroups.map((g) => {
                              const gm = g.members.find(
                                (m) =>
                                  m.memberId === member.id ||
                                  members
                                    .find((mb) => mb.id === m.memberId)
                                    ?.phone.replace(/\D/g, '')
                                    .endsWith(cleanP.slice(-8))
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
                                <div key={g.id} className="flex items-center gap-1.5">
                                  <span
                                    className="text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate max-w-[100px]"
                                    title={g.name}
                                  >
                                    {g.name} :
                                  </span>
                                  <span className="font-mono font-bold text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                    {formatAccessCode(code)}
                                  </span>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard?.writeText(code);
                                      addToast(
                                        'Code copié !',
                                        `Code de ${member.name} (${code}) copié.`,
                                        'success'
                                      );
                                    }}
                                    className="p-0.5 text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
                                    title="Copier le code"
                                  >
                                    <Copy size={12} />
                                  </button>
                                  <button
                                    onClick={() => {
                                      const text = encodeURIComponent(
                                        `Bonjour ${member.name},\nVoici votre code d'accès à 6 chiffres pour la tontine « ${g.name} » : ${code}.\nConnectez-vous sur ${window.location.origin}/login avec votre numéro (${member.phone}) et ce code.`
                                      );
                                      window.open(`https://wa.me/?text=${text}`, '_blank');
                                    }}
                                    className="p-0.5 text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer"
                                    title="Partager par WhatsApp"
                                  >
                                    <Share2 size={12} />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold tabular-nums text-slate-900 dark:text-white">
                      {formatFCFA(member.totalContributed)}
                    </td>

                    <td className="py-3 px-3 text-center">
                      {member.status === 'GUARANTEE_DEPLETED' || (member.status as string) === 'guarantee_depleted' ? (
                        <Badge variant="danger">
                          Caution Épuisée
                        </Badge>
                      ) : (
                        <Badge variant={member.status === 'active' ? 'success' : 'danger'}>
                          {member.status === 'active' ? 'Actif' : 'Inactif'}
                        </Badge>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDetails(member)}
                        >
                          Voir profil
                        </Button>
                        <button
                          onClick={() => handleToggleStatus(member)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                          title={member.status === 'active' ? 'Désactiver ce membre' : 'Réactiver ce membre'}
                        >
                          {member.status === 'active' ? (
                            <UserX size={15} />
                          ) : (
                            <UserCheck2 size={15} className="text-emerald-500" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Details modal */}
      <MemberDetailsModal
        member={selectedMember}
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
      />

      {/* Add member modal */}
      <AddMemberModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
      />
    </div>
  );
};
