import React from 'react';
import { ComplaintRecord } from '../types/triage';
import { AlertTriangle, ShieldAlert, CheckCircle2, UserCheck, Clock, Flame } from 'lucide-react';

interface StatsCardsProps {
  records: ComplaintRecord[];
  activeFilter: string | null;
  onSelectFilter: (filter: string | null) => void;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  records,
  activeFilter,
  onSelectFilter,
}) => {
  const total = records.length;
  const completed = records.filter((r) => r.triageStatus === 'completed');
  const critical = completed.filter((r) => r.triageResult?.severityLevel?.includes('LEVEL 4'));
  const high = completed.filter((r) => r.triageResult?.severityLevel?.includes('LEVEL 3'));
  const humanReviewRequired = completed.filter(
    (r) => r.triageResult?.humanReviewStatus === 'Human Review Required'
  );
  const immediateEscalations = completed.filter(
    (r) => r.triageResult?.escalationPriority === 'Immediate'
  );
  const humanSignedOff = records.filter((r) => !!r.humanSignOff);

  const humanReviewRate =
    completed.length > 0 ? Math.round((humanReviewRequired.length / completed.length) * 100) : 0;

  const cards = [
    {
      id: 'total',
      label: 'Total Queue',
      value: total,
      sublabel: `${completed.length} triaged, ${total - completed.length} pending`,
      icon: Clock,
      color: 'border-slate-200 dark:border-slate-800 bg-white text-slate-800',
      badgeColor: 'bg-slate-100 text-slate-700',
      filterKey: null,
    },
    {
      id: 'critical',
      label: 'Level 4 Critical',
      value: critical.length,
      sublabel: 'Immediate safety or legal exposure',
      icon: Flame,
      color: 'border-rose-200 bg-rose-50/50 text-rose-950',
      badgeColor: 'bg-rose-100 text-rose-700 font-semibold',
      filterKey: 'LEVEL 4',
    },
    {
      id: 'high',
      label: 'Level 3 High',
      value: high.length,
      sublabel: 'Potential harm or medication issue',
      icon: AlertTriangle,
      color: 'border-amber-200 bg-amber-50/50 text-amber-950',
      badgeColor: 'bg-amber-100 text-amber-800 font-semibold',
      filterKey: 'LEVEL 3',
    },
    {
      id: 'humanReview',
      label: 'Human Review Req.',
      value: `${humanReviewRequired.length} (${humanReviewRate}%)`,
      sublabel: 'Mandatory clinical/compliance audit',
      icon: ShieldAlert,
      color: 'border-indigo-200 bg-indigo-50/50 text-indigo-950',
      badgeColor: 'bg-indigo-100 text-indigo-700 font-semibold',
      filterKey: 'Human Review Required',
    },
    {
      id: 'immediate',
      label: 'Immediate Priority',
      value: immediateEscalations.length,
      sublabel: 'Requires expedited leadership dispatch',
      icon: AlertTriangle,
      color: 'border-red-200 bg-red-50/50 text-red-950',
      badgeColor: 'bg-red-100 text-red-700 font-semibold',
      filterKey: 'Immediate',
    },
    {
      id: 'signoff',
      label: 'Human Audited',
      value: humanSignedOff.length,
      sublabel: 'Supervisor reviewed & signed off',
      icon: UserCheck,
      color: 'border-emerald-200 bg-emerald-50/50 text-emerald-950',
      badgeColor: 'bg-emerald-100 text-emerald-700 font-semibold',
      filterKey: 'SignedOff',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((card) => {
        const Icon = card.icon;
        const isSelected =
          (card.filterKey === null && activeFilter === null) ||
          (card.filterKey !== null && activeFilter === card.filterKey);

        return (
          <button
            key={card.id}
            onClick={() => onSelectFilter(isSelected && card.filterKey !== null ? null : card.filterKey)}
            className={`text-left p-3.5 rounded-xl border transition-all duration-150 relative overflow-hidden ${
              isSelected
                ? 'ring-2 ring-blue-600 shadow-md bg-blue-50/30'
                : 'hover:shadow-sm hover:border-slate-300'
            } ${card.color}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                {card.label}
              </span>
              <span className={`p-1.5 rounded-lg ${card.badgeColor}`}>
                <Icon className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-bold tracking-tight text-slate-900">{card.value}</div>
            <p className="text-[11px] text-slate-500 mt-1 truncate">{card.sublabel}</p>
          </button>
        );
      })}
    </div>
  );
};
