import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import {
  Download,
  FileText,
  TrendingUp,
  Award,
  Users2,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { formatFCFA } from '../../utils/formatters';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from 'recharts';

export const ReportsPage: React.FC = () => {
  const { groups, members, payments, addToast } = useApp();
  const [period, setPeriod] = useState('year');

  const handleExportPDF = () => {
    addToast('Génération du rapport PDF', 'Votre synthèse comptable est prête au téléchargement.', 'success');
    window.print();
  };

  // Real monthly data dynamically calculated from actual payments
  const monthlyData = React.useMemo(() => {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    const now = new Date();
    const result = [];
    const count = period === 'month' ? 1 : period === 'quarter' ? 3 : 6;
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mName = months[d.getMonth()] + ' ' + String(d.getFullYear()).slice(2);
      const mYear = d.getFullYear();
      const mMonth = d.getMonth();
      const matchingPayments = payments.filter((p) => {
        const pDate = new Date(p.date);
        return pDate.getFullYear() === mYear && pDate.getMonth() === mMonth && p.status === 'paid';
      });
      const cotisations = matchingPayments.reduce((acc, p) => acc + p.amount, 0);
      const commissions = matchingPayments.reduce((acc, p) => acc + (p.commission || 0), 0);
      result.push({ month: mName, cotisations, commissions });
    }
    return result;
  }, [payments, period]);

  // Top 5 members by trust score & contributions
  const topMembers = [...members]
    .sort((a, b) => b.trustScore - a.trustScore || b.totalContributed - a.totalContributed)
    .slice(0, 5);

  return (
    <div className="space-y-6 text-left">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Rapports d'activité & Statistiques
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Analyse détaillée des encaissements, des commissions de gestion et du comportement des membres.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            options={[
              { value: 'month', label: 'Ce mois (Sep 2026)' },
              { value: 'quarter', label: '3 derniers mois' },
              { value: 'year', label: '12 derniers mois (Année)' },
            ]}
            className="text-xs min-h-[40px] w-48"
          />

          <Button
            variant="emerald"
            size="sm"
            onClick={handleExportPDF}
            leftIcon={<FileText size={15} />}
          >
            Exporter en PDF
          </Button>
        </div>
      </div>

      {/* 12 Months Commissions Bar Chart */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Commissions nettes perçues (12 derniers mois)</CardTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Évolution de vos revenus de modérateur en FCFA
            </p>
          </div>
          <span className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">
            Total annuel : 2 225 000 FCFA
          </span>
        </CardHeader>

        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <Tooltip
                formatter={(val: any) => [formatFCFA(Number(val) || 0), 'Commissions']}
                contentStyle={{
                  backgroundColor: '#0F172A',
                  borderRadius: '12px',
                  border: 'none',
                  color: '#fff',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="commissions" fill="#10B981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Two columns: Top Groups & Top Members */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Groups */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Volume collecté par groupe</CardTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Performance et régularité des cercles d'épargne
              </p>
            </div>
          </CardHeader>

          <div className="space-y-3">
            {groups.map((grp) => {
              const potPerTour = (grp.contributionAmount - grp.moderatorCommission) * grp.totalMembersCount;
              return (
                <div
                  key={grp.id}
                  className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between"
                >
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {grp.name}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {grp.totalMembersCount} membres · Tour {grp.currentDay}/{grp.totalMembersCount}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-white block">
                      {formatFCFA(potPerTour)}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-semibold">
                      +{formatFCFA(grp.moderatorCommission * grp.totalMembersCount)} com.
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Top Trust Members */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Membres les plus fiables (Top 5)</CardTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Calculé sur la ponctualité de leurs cotisations
              </p>
            </div>
          </CardHeader>

          <div className="space-y-3">
            {topMembers.map((m, idx) => (
              <div
                key={m.id}
                className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-400 flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <Avatar name={m.name} size="xs" />
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {m.name}
                    </h4>
                    <p className="text-[10px] text-slate-500 truncate">{m.city}</p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1 text-emerald-600 font-mono font-bold text-xs">
                    <Award size={13} />
                    <span>{m.trustScore}%</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {formatFCFA(m.totalContributed)} cotisés
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
