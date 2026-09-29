import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Tabs } from '../../components/ui/Tabs';
import { Input } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';
import {
  Plus,
  Search,
  Users2,
  Calendar,
  ArrowRight,
  Sparkles,
  Wallet,
} from 'lucide-react';
import { formatFCFA, formatDate } from '../../utils/formatters';

export const GroupsPage: React.FC = () => {
  const { groups } = useApp();
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter groups
  const filteredGroups = groups.filter((g) => {
    const matchesFilter =
      filter === 'all'
        ? true
        : filter === 'active'
        ? g.status === 'active'
        : filter === 'completed'
        ? g.status === 'completed'
        : filter === 'pending'
        ? g.status === 'pending'
        : true;

    const matchesSearch =
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.category && g.category.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  const filterTabs = [
    { id: 'all', label: 'Tous les groupes', count: groups.length },
    { id: 'active', label: 'Actifs', count: groups.filter((g) => g.status === 'active').length },
    { id: 'pending', label: 'En attente', count: groups.filter((g) => g.status === 'pending').length },
    { id: 'completed', label: 'Terminés', count: groups.filter((g) => g.status === 'completed').length },
  ];

  return (
    <div className="space-y-6 text-left">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Mes groupes de tontine
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Supervisez le déroulement des rotations, l'ordre des bénéficiaires et l'état des caisses.
          </p>
        </div>

        <Link to="/dashboard/groups/new">
          <Button variant="emerald" size="md" leftIcon={<Plus size={16} />}>
            Créer un nouveau groupe
          </Button>
        </Link>
      </div>

      {/* Filter bar & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <Tabs
          tabs={filterTabs}
          activeTab={filter}
          onChange={setFilter}
        />

        <div className="w-full sm:w-72">
          <Input
            placeholder="Rechercher par nom..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search size={16} />}
          />
        </div>
      </div>

      {/* Groups Grid */}
      {filteredGroups.length === 0 ? (
        <EmptyState
          icon={<Users2 size={24} />}
          title="Aucun groupe trouvé"
          description="Aucun groupe ne correspond à vos critères de recherche actuels."
          actionLabel="Créer un groupe"
          onAction={() => (window.location.href = '/dashboard/groups/new')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredGroups.map((group) => {
            const currentBeneficiary = group.beneficiarySchedule.find(
              (b) => b.order === group.currentDay
            );
            const totalPot = (group.contributionAmount - group.moderatorCommission) * group.totalMembersCount;

            const statusBadges: Record<string, React.ReactNode> = {
              created: <Badge variant="warning">Créé · En attente</Badge>,
              active: <Badge variant="success">Actif · En cours</Badge>,
              pending: <Badge variant="warning">En attente de démarrage</Badge>,
              completed: <Badge variant="neutral">Cycle achevé</Badge>,
              paused: <Badge variant="danger">En pause</Badge>,
            };

            return (
              <Card
                key={group.id}
                hoverEffect
                className="flex flex-col justify-between relative group"
              >
                <div>
                  {/* Card top: category & status */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      {group.category || 'Tontine'}
                    </span>
                    {statusBadges[group.status]}
                  </div>

                  {/* Group Name & description */}
                  <Link
                    to={`/dashboard/groups/${group.id}`}
                    className="block group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors"
                  >
                    <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1">
                      {group.name}
                    </h3>
                  </Link>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 mb-4 leading-relaxed">
                    {group.description}
                  </p>

                  {/* Financial stats box */}
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-2 mb-4">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Cotisation journalière :
                      </span>
                      <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                        {formatFCFA(group.contributionAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Cagnotte par tour :
                      </span>
                      <span className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        {formatFCFA(totalPot)}
                      </span>
                    </div>
                    <div className="flex justify-between items-baseline text-[11px] pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60">
                      <span className="text-slate-500">Commission modérateur :</span>
                      <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                        {group.moderatorCommission} FCFA / membre
                      </span>
                    </div>
                  </div>

                  {/* Rotation Progress */}
                  <div className="space-y-1.5 mb-4">
                    <ProgressBar
                      value={group.currentDay}
                      max={group.totalMembersCount}
                      showLabel
                      label={`Tour ${group.currentDay} sur ${group.totalMembersCount} membres`}
                      size="sm"
                    />
                    {currentBeneficiary && group.status === 'active' && (
                      <p className="text-[11px] text-slate-500">
                        Bénéficiaire actuel :{' '}
                        <strong className="text-slate-800 dark:text-slate-200">
                          {currentBeneficiary.memberName}
                        </strong>
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer action */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Users2 size={14} />
                    <span>{group.totalMembersCount} membres</span>
                  </div>

                  <Link to={`/dashboard/groups/${group.id}`}>
                    <Button
                      variant="ghost"
                      size="sm"
                      rightIcon={<ArrowRight size={14} />}
                    >
                      Détails
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
