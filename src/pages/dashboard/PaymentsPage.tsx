import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Tabs } from '../../components/ui/Tabs';
import { EmptyState } from '../../components/ui/EmptyState';
import { RecordPaymentModal } from '../../components/modals/RecordPaymentModal';
import {
  Download,
  CreditCard,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Wallet,
} from 'lucide-react';
import { formatFCFA, formatDateTime, exportToCSV } from '../../utils/formatters';

export const PaymentsPage: React.FC = () => {
  const { payments, groups, verifyPayment, addToast } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [groupFilter, setGroupFilter] = useState('all');
  const [recordModalOpen, setRecordModalOpen] = useState(false);

  // Filter logic
  const filteredPayments = payments.filter((p) => {
    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'paid'
        ? p.status === 'paid'
        : statusFilter === 'late'
        ? p.status === 'late'
        : p.status === 'pending';

    const matchesGroup = groupFilter === 'all' ? true : p.groupId === groupFilter;

    const matchesSearch =
      p.memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.transactionRef.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.groupName.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesGroup && matchesSearch;
  });

  // Top stats
  const totalPaid = payments
    .filter((p) => p.status === 'paid')
    .reduce((acc, p) => acc + p.amount, 0);

  const totalCommissions = payments
    .filter((p) => p.status === 'paid')
    .reduce((acc, p) => acc + p.commission, 0);

  const pendingCount = payments.filter((p) => p.status === 'pending' || p.status === 'late').length;

  const handleExportCSV = () => {
    exportToCSV(
      'cotisations_tontiflow.csv',
      filteredPayments,
      [
        { key: 'transactionRef', header: 'Référence' },
        { key: 'date', header: 'Date' },
        { key: 'memberName', header: 'Membre' },
        { key: 'memberPhone', header: 'Téléphone' },
        { key: 'groupName', header: 'Groupe de tontine' },
        { key: 'amount', header: 'Montant versé (FCFA)' },
        { key: 'commission', header: 'Commission (FCFA)' },
        { key: 'method', header: 'Moyen de paiement' },
        { key: 'status', header: 'Statut' },
      ]
    );
    addToast('Export terminé', 'Le fichier CSV des transactions a été téléchargé.', 'success');
  };

  const statusTabs = [
    { id: 'all', label: 'Toutes', count: payments.length },
    { id: 'paid', label: 'Validées (Payées)', count: payments.filter((p) => p.status === 'paid').length },
    { id: 'late', label: 'En retard', count: payments.filter((p) => p.status === 'late').length },
  ];

  return (
    <div className="space-y-6 text-left">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Paiements et Cotisations
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Journal complet des flux financiers et des commissions nettes perçues.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            leftIcon={<Download size={15} />}
          >
            Exporter CSV
          </Button>

          <Button
            variant="emerald"
            size="sm"
            onClick={() => setRecordModalOpen(true)}
            leftIcon={<CreditCard size={15} />}
          >
            Encaisser une cotisation
          </Button>
        </div>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500">Total encaissé</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
            {formatFCFA(totalPaid)}
          </div>
          <span className="text-[11px] text-slate-400">Versements vérifiés avec succès</span>
        </Card>

        <Card>
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500">Commissions modérateur</span>
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-600">
              <Wallet size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
            {formatFCFA(totalCommissions)}
          </div>
          <span className="text-[11px] text-slate-400">Revenus nets générés par la gestion</span>
        </Card>

        <Card>
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500">En attente / Retard</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600">
              <Clock size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1">
            {pendingCount}
          </div>
          <span className="text-[11px] text-slate-400">Cotisations nécessitant un suivi</span>
        </Card>
      </div>

      {/* Filter and search bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <Tabs
          tabs={statusTabs}
          activeTab={statusFilter}
          onChange={setStatusFilter}
        />

        <div className="flex items-center gap-2">
          <Select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            className="w-48 text-xs min-h-[40px]"
            options={[
              { value: 'all', label: 'Tous les groupes' },
              ...groups.map((g) => ({ value: g.id, label: g.name })),
            ]}
          />

          <div className="w-56">
            <Input
              placeholder="Recherche membre / réf..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search size={15} />}
              className="min-h-[40px] text-xs"
            />
          </div>
        </div>
      </div>

      {/* Payments Table or Empty State */}
      {filteredPayments.length === 0 ? (
        <EmptyState
          icon={<CreditCard size={28} />}
          title={searchQuery || statusFilter !== 'all' ? 'Aucune transaction correspondante' : 'Aucune transaction enregistrée'}
          description={
            searchQuery || statusFilter !== 'all'
              ? 'Aucun paiement ne correspond aux filtres appliqués.'
              : 'Les versements de cotisations et régularisations de pénalités apparaîtront ici dès leur encaissement.'
          }
          actionLabel="Encaisser un versement"
          onAction={() => setRecordModalOpen(true)}
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold">
                  <th className="pb-3 px-3">Réf</th>
                  <th className="pb-3 px-3">Date</th>
                  <th className="pb-3 px-3">Membre</th>
                  <th className="pb-3 px-3">Groupe</th>
                  <th className="pb-3 px-3">Moyen</th>
                  <th className="pb-3 px-3 text-right">Montant</th>
                  <th className="pb-3 px-3 text-right">Commission</th>
                  <th className="pb-3 px-3 text-center">Statut</th>
                  <th className="pb-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredPayments.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-3 font-mono font-medium text-slate-400">
                      {p.transactionRef}
                    </td>
                    <td className="py-3 px-3 text-slate-500 font-mono">
                      {formatDateTime(p.date)}
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-900 dark:text-white">
                      <div>{p.memberName}</div>
                      <span className="text-[10px] text-slate-400 font-mono">{p.memberPhone}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300 max-w-[140px] truncate">
                      {p.groupName}
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-700 dark:text-slate-300">
                      {p.method}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {formatFCFA(p.amount)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                      +{formatFCFA(p.commission)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <Badge variant={p.status === 'paid' ? 'success' : p.status === 'late' ? 'danger' : 'warning'}>
                        {p.status === 'paid' ? 'Payé' : p.status === 'late' ? 'En retard' : 'En attente'}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {p.status !== 'paid' ? (
                        <Button
                          variant="emerald"
                          size="sm"
                          onClick={() => verifyPayment(p.id)}
                        >
                          Valider
                        </Button>
                      ) : (
                        <span className="text-[11px] text-slate-400">Vérifié</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Record modal */}
      <RecordPaymentModal
        isOpen={recordModalOpen}
        onClose={() => setRecordModalOpen(false)}
      />
    </div>
  );
};
