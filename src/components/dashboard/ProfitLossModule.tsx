import React, { useState, useMemo } from 'react';
import {
  FeeDeposit,
  PaymentDisbursement,
  Student,
  DisbursementLedgerCategory,
  NavigationTab,
  InstitutionalAuthorizationConfig,
} from '../../types';
import {
  formatCurrency,
  computeProfitAndLossSummary,
  LEDGER_DEFINITIONS,
} from '../../utils/academicUtils';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart as PieIcon,
  BarChart3,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Calendar,
  Filter,
  CreditCard,
  Building2,
  Sparkles,
  Info,
  CheckCircle2,
} from 'lucide-react';

interface ProfitLossModuleProps {
  deposits: FeeDeposit[];
  disbursements: PaymentDisbursement[];
  students: Student[];
  authConfig?: InstitutionalAuthorizationConfig;
  onNavigateTab?: (tab: NavigationTab) => void;
  onOpenFeeDepositModal?: () => void;
}

// Consistent and accessible color palette for ledgers
const LEDGER_COLORS: Record<DisbursementLedgerCategory, string> = {
  Salary: '#3b82f6', // Blue
  Vendors: '#f59e0b', // Amber
  Contractor: '#10b981', // Emerald
  Assets: '#8b5cf6', // Purple
  Grocery: '#14b8a6', // Teal
  Utilities: '#6366f1', // Indigo
  Marketing: '#ec4899', // Pink
  Miscellaneous: '#64748b', // Slate
};

export const ProfitLossModule: React.FC<ProfitLossModuleProps> = ({
  deposits,
  disbursements,
  students,
  authConfig,
  onNavigateTab,
  onOpenFeeDepositModal,
}) => {
  const [selectedView, setSelectedView] = useState<'timeline' | 'ledgers' | 'split'>('split');
  const [timeRange, setTimeRange] = useState<'all' | '6months' | 'currentYear'>('all');
  const [hoveredLedger, setHoveredLedger] = useState<string | null>(null);

  // Profit and Loss Summary
  const pnlSummary = useMemo(() => {
    return computeProfitAndLossSummary(
      deposits,
      disbursements,
      students,
      authConfig?.monthlyDisbursementBudgetCap,
      authConfig?.minimumProfitReserveTarget
    );
  }, [deposits, disbursements, students, authConfig]);

  // Aggregate monthly cashflow data for timeline chart
  const monthlyTimelineData = useMemo(() => {
    const monthMap = new Map<
      string,
      {
        monthKey: string;
        monthLabel: string;
        deposits: number;
        disbursements: number;
        netProfit: number;
        depositCount: number;
        disbursementCount: number;
        margin: number;
      }
    >();

    // Process all deposits
    deposits.forEach((dep) => {
      if (!dep.depositDate) return;
      const monthKey = dep.depositDate.slice(0, 7); // "YYYY-MM"
      if (!monthMap.has(monthKey)) {
        const [year, month] = monthKey.split('-');
        const d = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
        const monthLabel = d.toLocaleDateString('en-IN', {
          month: 'short',
          year: '2-digit',
        });
        monthMap.set(monthKey, {
          monthKey,
          monthLabel,
          deposits: 0,
          disbursements: 0,
          netProfit: 0,
          depositCount: 0,
          disbursementCount: 0,
          margin: 0,
        });
      }
      const record = monthMap.get(monthKey)!;
      record.deposits += dep.amountPaid;
      record.depositCount += 1;
    });

    // Process all disbursements (only realized/approved/disbursed)
    disbursements.forEach((disb) => {
      if (!disb.disbursementDate || disb.status === 'Cancelled') return;
      const monthKey = disb.disbursementDate.slice(0, 7);
      if (!monthMap.has(monthKey)) {
        const [year, month] = monthKey.split('-');
        const d = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
        const monthLabel = d.toLocaleDateString('en-IN', {
          month: 'short',
          year: '2-digit',
        });
        monthMap.set(monthKey, {
          monthKey,
          monthLabel,
          deposits: 0,
          disbursements: 0,
          netProfit: 0,
          depositCount: 0,
          disbursementCount: 0,
          margin: 0,
        });
      }
      const record = monthMap.get(monthKey)!;
      record.disbursements += disb.amount;
      record.disbursementCount += 1;
    });

    // Calculate net profits and margins
    const sorted = Array.from(monthMap.values()).sort((a, b) =>
      a.monthKey.localeCompare(b.monthKey)
    );

    sorted.forEach((item) => {
      item.netProfit = item.deposits - item.disbursements;
      item.margin =
        item.deposits > 0 ? Math.round((item.netProfit / item.deposits) * 100) : 0;
    });

    // Filter by timeRange if requested
    if (timeRange === '6months') {
      return sorted.slice(-6);
    }
    if (timeRange === 'currentYear') {
      const currentYear = new Date().getFullYear().toString();
      return sorted.filter((s) => s.monthKey.startsWith(currentYear));
    }

    return sorted;
  }, [deposits, disbursements, timeRange]);

  // Ledger Breakdown Data for Pie/Bar charts
  const ledgerPieData = useMemo(() => {
    return pnlSummary.ledgerBreakdown
      .filter((l) => l.totalAmount > 0)
      .map((l) => ({
        name: l.ledger,
        value: l.totalAmount,
        color: LEDGER_COLORS[l.ledger] || '#64748b',
        percentage: l.percentageOfTotalExpense,
        revenuePercentage: l.percentageOfRevenue,
        count: l.transactionCount,
      }))
      .sort((a, b) => b.value - a.value);
  }, [pnlSummary.ledgerBreakdown]);

  const isNetSurplus = pnlSummary.netOperatingProfit >= 0;
  const expenseRatio =
    pnlSummary.grossRevenue > 0
      ? (pnlSummary.totalDisbursed / pnlSummary.grossRevenue) * 100
      : 0;

  // Custom Recharts Tooltip for Timeline
  const CustomTimelineTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const net = data.netProfit;
      const isPositive = net >= 0;

      return (
        <div className="bg-slate-900/95 text-white p-3.5 rounded-xl shadow-2xl border border-slate-700 text-xs space-y-2 backdrop-blur-md min-w-[200px]">
          <div className="flex items-center justify-between border-b border-slate-700 pb-1.5">
            <span className="font-bold text-amber-400">{data.monthLabel}</span>
            <span className="text-[10px] text-slate-400 font-mono">Period Overview</span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-emerald-400 font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Gross Inflow (Fees):
              </span>
              <span className="font-mono font-bold">{formatCurrency(data.deposits)}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-rose-400 font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                Disbursements (Outflow):
              </span>
              <span className="font-mono font-bold">{formatCurrency(data.disbursements)}</span>
            </div>
          </div>

          <div className="pt-1.5 border-t border-slate-700/80 flex items-center justify-between">
            <span className="text-slate-300 font-bold">Net Institutional Growth:</span>
            <span
              className={`font-mono font-black ${
                isPositive ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {formatCurrency(net)}
            </span>
          </div>

          <div className="text-[10px] text-slate-400 text-right">
            Profit Margin: <strong className="text-white">{data.margin}%</strong>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Recharts Tooltip for Ledger Pie
  const CustomLedgerTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 text-white p-3 rounded-xl shadow-2xl border border-slate-700 text-xs space-y-1.5 backdrop-blur-md min-w-[180px]">
          <div className="flex items-center justify-between border-b border-slate-700 pb-1">
            <span className="font-bold text-white flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: data.color }}
              ></span>
              {data.name} Ledger
            </span>
            <span className="text-[10px] text-slate-400">{data.count} txns</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-300">Total Disbursed:</span>
            <span className="font-mono font-bold text-amber-300">{formatCurrency(data.value)}</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Share of Outflow:</span>
            <span className="font-bold text-white">{data.percentage.toFixed(1)}%</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Share of Revenue:</span>
            <span className="font-bold text-emerald-400">{data.revenuePercentage.toFixed(1)}%</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      
      {/* Module Header */}
      <div className="p-5 sm:p-6 border-b border-slate-100 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono tracking-wider uppercase bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded font-bold">
                  TREASURY & INSTITUTIONAL SOLVENCY
                </span>
                <span className="text-xs text-slate-400 hidden sm:inline">• Live P&L Tracking</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight mt-0.5">
                Profit & Loss Ledger Analytics
              </h2>
            </div>
          </div>

          {/* Action & View Controls */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* View Mode Selector */}
            <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setSelectedView('split')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  selectedView === 'split'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Side-by-side Timeline & Allocation View"
              >
                Full Analytics
              </button>
              <button
                type="button"
                onClick={() => setSelectedView('timeline')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  selectedView === 'timeline'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Monthly Inflow vs Outflow Trend"
              >
                Cashflow Trend
              </button>
              <button
                type="button"
                onClick={() => setSelectedView('ledgers')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  selectedView === 'ledgers'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Ledger Category Allocation"
              >
                Ledger Shares
              </button>
            </div>

            {/* Time Filter */}
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="bg-slate-800 border border-slate-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl cursor-pointer focus:ring-2 focus:ring-amber-400"
            >
              <option value="all">All Records</option>
              <option value="6months">Last 6 Months</option>
              <option value="currentYear">Current Year</option>
            </select>

            {/* Deep-link to Disbursements view */}
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('disbursements')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
                title="Go to detailed Disbursements Ledger"
              >
                <span>Treasury Ledger</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}

          </div>
        </div>

        {/* 4-KPI Metric Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-800/80">
          
          {/* KPI 1: Gross Revenue */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Gross Fee Revenue Inflow
            </span>
            <span className="text-base sm:text-lg font-black font-mono text-emerald-400 block mt-0.5">
              {formatCurrency(pnlSummary.grossRevenue)}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              {deposits.length} fee receipts realized
            </span>
          </div>

          {/* KPI 2: Total Disbursements */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Total Realized Disbursements
            </span>
            <span className="text-base sm:text-lg font-black font-mono text-rose-400 block mt-0.5">
              {formatCurrency(pnlSummary.totalDisbursed)}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              {expenseRatio.toFixed(1)}% of gross collections
            </span>
          </div>

          {/* KPI 3: Net Operating Profit */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Net Institutional Growth
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span
                className={`text-base sm:text-lg font-black font-mono ${
                  isNetSurplus ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {formatCurrency(pnlSummary.netOperatingProfit)}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Operating Margin: <strong className="text-white">{pnlSummary.profitMarginPercent.toFixed(1)}%</strong>
            </span>
          </div>

          {/* KPI 4: Pending / Reserve Health */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Pending Approvals & Buffer
            </span>
            <span className="text-base sm:text-lg font-black font-mono text-amber-300 block mt-0.5">
              {formatCurrency(pnlSummary.pendingDisbursements)}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 block flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Cap: {formatCurrency(pnlSummary.monthlyDisbursementBudgetCap)}/mo
            </span>
          </div>

        </div>
      </div>

      {/* Main Charts Content Area */}
      <div className="p-5 sm:p-6 space-y-6">
        
        {/* Dynamic Layout Based on selectedView */}
        <div
          className={`grid gap-6 ${
            selectedView === 'split'
              ? 'grid-cols-1 lg:grid-cols-12'
              : 'grid-cols-1'
          }`}
        >
          
          {/* Chart Section 1: Inflow vs Outflow & Growth Line */}
          {(selectedView === 'split' || selectedView === 'timeline') && (
            <div
              className={`space-y-3 ${
                selectedView === 'split' ? 'lg:col-span-7' : 'w-full'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-slate-600" />
                    <span>Monthly Cashflow & Net Surplus Trajectory</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Comparing gross fee deposits against realized disbursements across months
                  </p>
                </div>

                <div className="flex items-center gap-2 text-[11px] font-medium text-slate-600">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block"></span>
                    Inflow
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded bg-rose-500 inline-block"></span>
                    Disbursed
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-0.5 bg-indigo-600 inline-block"></span>
                    Net Growth
                  </span>
                </div>
              </div>

              {/* Recharts Composed Chart */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 sm:p-4 h-72 sm:h-80 w-full">
                {monthlyTimelineData.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                    <Layers className="w-8 h-8 text-slate-300 mb-2" />
                    <span>No cashflow data logged for selected period</span>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={monthlyTimelineData}
                      margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis
                        dataKey="monthLabel"
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        axisLine={{ stroke: '#cbd5e1' }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: '#64748b' }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                      />
                      <Tooltip content={<CustomTimelineTooltip />} />
                      <Bar
                        dataKey="deposits"
                        name="Fee Inflow"
                        fill="#10b981"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={32}
                      />
                      <Bar
                        dataKey="disbursements"
                        name="Disbursements"
                        fill="#f43f5e"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={32}
                      />
                      <Line
                        type="monotone"
                        dataKey="netProfit"
                        name="Net Growth"
                        stroke="#4f46e5"
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: '#4f46e5', strokeWidth: 1.5, stroke: '#ffffff' }}
                        activeDot={{ r: 6 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          )}

          {/* Chart Section 2: Ledger Category Allocation */}
          {(selectedView === 'split' || selectedView === 'ledgers') && (
            <div
              className={`space-y-3 ${
                selectedView === 'split' ? 'lg:col-span-5' : 'w-full'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <PieIcon className="w-4 h-4 text-slate-600" />
                    <span>Disbursements Across Ledgers</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Proportion of expenditure consumed by each operational head
                  </p>
                </div>

                {onNavigateTab && (
                  <button
                    onClick={() => onNavigateTab('disbursements')}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 cursor-pointer"
                  >
                    View All <ArrowUpRight className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Recharts Pie Chart & Interactive Breakdown */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 min-h-[288px] sm:min-h-[320px] flex flex-col justify-between">
                {ledgerPieData.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs">
                    <Layers className="w-8 h-8 text-slate-300 mb-2" />
                    <span>No disbursement records found</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Donut Chart */}
                    <div className="h-44 sm:h-48 w-full relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={ledgerPieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={48}
                            outerRadius={72}
                            paddingAngle={3}
                            dataKey="value"
                            onMouseEnter={(_, index) =>
                              setHoveredLedger(ledgerPieData[index]?.name || null)
                            }
                            onMouseLeave={() => setHoveredLedger(null)}
                          >
                            {ledgerPieData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={entry.color}
                                stroke="#ffffff"
                                strokeWidth={2}
                              />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomLedgerTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>

                      {/* Donut Center Label */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          {hoveredLedger || 'Total Outflow'}
                        </span>
                        <span className="text-xs sm:text-sm font-black text-slate-900 font-mono">
                          {hoveredLedger
                            ? formatCurrency(
                                ledgerPieData.find((l) => l.name === hoveredLedger)?.value || 0
                              )
                            : formatCurrency(pnlSummary.totalDisbursed)}
                        </span>
                      </div>
                    </div>

                    {/* Ledger Pills Grid */}
                    <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-200/80">
                      {ledgerPieData.slice(0, 6).map((item) => (
                        <div
                          key={item.name}
                          onMouseEnter={() => setHoveredLedger(item.name)}
                          onMouseLeave={() => setHoveredLedger(null)}
                          className={`p-2 rounded-xl border text-xs transition-all cursor-pointer ${
                            hoveredLedger === item.name
                              ? 'bg-white border-slate-400 shadow-xs'
                              : 'bg-white/60 border-slate-200 hover:bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800 flex items-center gap-1.5 truncate">
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: item.color }}
                              ></span>
                              {item.name}
                            </span>
                            <span className="font-mono font-bold text-slate-900 text-[11px]">
                              {item.percentage.toFixed(0)}%
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5 pl-3.5">
                            {formatCurrency(item.value)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Ledger Breakdown Bar Strip across all 8 Ledgers */}
        <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Institutional Ledger Breakdown (8 Expense Heads)
              </h4>
              <p className="text-[11px] text-slate-500">
                Expenditure tracked against active budget cap (₹{pnlSummary.monthlyDisbursementBudgetCap.toLocaleString('en-IN')}/mo)
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-lg">
                Solvency Status:{' '}
                <strong className={isNetSurplus ? 'text-emerald-700' : 'text-rose-700'}>
                  {isNetSurplus ? 'Operating Surplus' : 'Operating Deficit'}
                </strong>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {pnlSummary.ledgerBreakdown.map((item) => {
              const def = LEDGER_DEFINITIONS[item.ledger];
              const color = LEDGER_COLORS[item.ledger];
              const hasExpense = item.totalAmount > 0;

              return (
                <div
                  key={item.ledger}
                  onClick={() => onNavigateTab && onNavigateTab('disbursements')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    hasExpense
                      ? 'bg-white border-slate-200 hover:border-slate-400 hover:shadow-xs'
                      : 'bg-white/40 border-dashed border-slate-200 opacity-60'
                  }`}
                  title={`${def?.title || item.ledger} - Click to manage in Treasury`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: color }}
                    ></span>
                    <span className="text-[11px] font-bold text-slate-800 truncate">
                      {item.ledger}
                    </span>
                  </div>
                  <div className="text-xs font-black font-mono text-slate-900">
                    {formatCurrency(item.totalAmount)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {hasExpense ? `${item.percentageOfTotalExpense.toFixed(1)}% exp` : '₹0 spent'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
};
