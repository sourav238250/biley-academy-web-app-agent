import React, { useState, useMemo } from 'react';
import { Student, FeeDeposit, ClassLevel } from '../../types';
import { formatCurrency, computeStudentFeeSummary, CLASS_LEVELS } from '../../utils/academicUtils';
import {
  Target,
  TrendingUp,
  Sparkles,
  CheckCircle2,
  Calendar,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Layers,
  ArrowUpRight,
  Zap,
  Info,
} from 'lucide-react';

interface SessionRevenueGoalTrackerProps {
  students: Student[];
  deposits: FeeDeposit[];
  onOpenDepositModal?: () => void;
}

interface MonthlyDataPoint {
  monthKey: string;
  monthLabel: string;
  monthName: string;
  monthlyAmount: number;
  cumulativeAmount: number;
  targetBenchmark: number;
  percentageOfTarget: number;
  depositCount: number;
}

export const SessionRevenueGoalTracker: React.FC<SessionRevenueGoalTrackerProps> = ({
  students,
  deposits,
  onOpenDepositModal,
}) => {
  const [showClassBreakdown, setShowClassBreakdown] = useState(false);
  const [hoveredMonthIndex, setHoveredMonthIndex] = useState<number | null>(null);

  // Compute student fee summaries
  const allFeeSummaries = useMemo(() => {
    return students.map((s) => ({
      student: s,
      summary: computeStudentFeeSummary(s, deposits),
    }));
  }, [students, deposits]);

  // Aggregate Metrics
  const totalTargetRevenue = useMemo(() => {
    const sum = allFeeSummaries.reduce((acc, curr) => acc + curr.summary.netPayable, 0);
    return sum > 0 ? sum : 500000; // Fallback baseline if no students yet
  }, [allFeeSummaries]);

  const totalGrossAnnualBeforeScholarship = useMemo(() => {
    return allFeeSummaries.reduce((acc, curr) => acc + curr.summary.totalAnnualFee, 0);
  }, [allFeeSummaries]);

  const totalScholarshipDiscount = useMemo(() => {
    return allFeeSummaries.reduce((acc, curr) => acc + curr.summary.totalDiscount, 0);
  }, [allFeeSummaries]);

  const totalCollectedGross = useMemo(() => {
    return deposits.reduce((sum, d) => sum + d.amountPaid, 0);
  }, [deposits]);

  const totalOutstandingDues = useMemo(() => {
    return Math.max(0, totalTargetRevenue - totalCollectedGross);
  }, [totalTargetRevenue, totalCollectedGross]);

  const progressPercentage = useMemo(() => {
    if (totalTargetRevenue <= 0) return 0;
    return Math.min(100, Math.max(0, (totalCollectedGross / totalTargetRevenue) * 100));
  }, [totalCollectedGross, totalTargetRevenue]);

  // Academic year months (Indian academic session: April to March)
  const sessionMonths = useMemo(() => [
    { key: '04', label: 'Apr', fullName: 'April' },
    { key: '05', label: 'May', fullName: 'May' },
    { key: '06', label: 'Jun', fullName: 'June' },
    { key: '07', label: 'Jul', fullName: 'July' },
    { key: '08', label: 'Aug', fullName: 'August' },
    { key: '09', label: 'Sep', fullName: 'September' },
    { key: '10', label: 'Oct', fullName: 'October' },
    { key: '11', label: 'Nov', fullName: 'November' },
    { key: '12', label: 'Dec', fullName: 'December' },
    { key: '01', label: 'Jan', fullName: 'January' },
    { key: '02', label: 'Feb', fullName: 'February' },
    { key: '03', label: 'Mar', fullName: 'March' },
  ], []);

  // Compute monthly timeline data for Sparkline Chart
  const monthlyTimelineData: MonthlyDataPoint[] = useMemo(() => {
    let runningCumulative = 0;
    const totalMonths = sessionMonths.length;

    return sessionMonths.map((m, idx) => {
      // Find deposits that fall into this month
      const monthDeposits = deposits.filter((d) => {
        if (!d.depositDate) return false;
        const depositMonth = d.depositDate.split('-')[1];
        return depositMonth === m.key;
      });

      const monthlyAmount = monthDeposits.reduce((acc, curr) => acc + curr.amountPaid, 0);
      runningCumulative += monthlyAmount;

      // Linear target progression benchmark
      const targetBenchmark = Math.round((totalTargetRevenue / totalMonths) * (idx + 1));
      const percentageOfTarget = totalTargetRevenue > 0
        ? Number(((runningCumulative / totalTargetRevenue) * 100).toFixed(1))
        : 0;

      return {
        monthKey: m.key,
        monthLabel: m.label,
        monthName: m.fullName,
        monthlyAmount,
        cumulativeAmount: runningCumulative,
        targetBenchmark,
        percentageOfTarget,
        depositCount: monthDeposits.length,
      };
    });
  }, [deposits, sessionMonths, totalTargetRevenue]);

  // Class-wise Breakdown
  const classBreakdown = useMemo(() => {
    return CLASS_LEVELS.map((cls) => {
      const classStudents = students.filter((s) => s.classLevel === cls);
      const classSummaries = classStudents.map((s) => computeStudentFeeSummary(s, deposits));
      const classTarget = classSummaries.reduce((acc, curr) => acc + curr.netPayable, 0);
      
      const classStudentIds = new Set(classStudents.map((s) => s.id));
      const classDeposits = deposits.filter((d) => classStudentIds.has(d.studentId));
      const classCollected = classDeposits.reduce((acc, curr) => acc + curr.amountPaid, 0);
      const classPending = Math.max(0, classTarget - classCollected);
      const classProgress = classTarget > 0 ? Math.min(100, (classCollected / classTarget) * 100) : 0;

      return {
        classLevel: cls,
        studentCount: classStudents.length,
        targetRevenue: classTarget,
        collected: classCollected,
        pending: classPending,
        progress: classProgress,
      };
    });
  }, [students, deposits]);

  // Sparkline SVG Coordinates Generation
  const svgWidth = 600;
  const svgHeight = 120;
  const paddingX = 24;
  const paddingY = 16;
  const chartW = svgWidth - paddingX * 2;
  const chartH = svgHeight - paddingY * 2;

  const maxVal = Math.max(totalTargetRevenue, totalCollectedGross, 10000);

  const points = monthlyTimelineData.map((d, index) => {
    const x = paddingX + (index / (monthlyTimelineData.length - 1)) * chartW;
    const y = svgHeight - paddingY - (d.cumulativeAmount / maxVal) * chartH;
    return { x, y, data: d };
  });

  const benchmarkPoints = monthlyTimelineData.map((d, index) => {
    const x = paddingX + (index / (monthlyTimelineData.length - 1)) * chartW;
    const y = svgHeight - paddingY - (d.targetBenchmark / maxVal) * chartH;
    return { x, y };
  });

  const sparklinePath = points.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`;
  }, '');

  const areaPath = `${sparklinePath} L ${points[points.length - 1].x},${svgHeight - paddingY} L ${points[0].x},${svgHeight - paddingY} Z`;

  const benchmarkPath = benchmarkPoints.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`;
  }, '');

  const activeHoverData = hoveredMonthIndex !== null ? monthlyTimelineData[hoveredMonthIndex] : null;

  return (
    <div id="session-revenue-goal-card" className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      
      {/* Top Banner Header */}
      <div className="p-5 sm:p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white relative">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          
          {/* Main Title & Session Goal Numbers */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[11px] font-bold tracking-wide uppercase">
                <Target className="w-3.5 h-3.5" />
                Session 2025–2026 Target Goal
              </span>
              <span className="text-xs text-slate-300">
                {students.length} Enrolled Students (Class 5–12)
              </span>
            </div>

            <div className="flex flex-wrap items-baseline gap-3 sm:gap-4 pt-1">
              <div>
                <span className="text-xs text-slate-400 font-medium block">Total Collected Fee</span>
                <span className="text-3xl sm:text-4xl font-black text-emerald-400 tracking-tight">
                  {formatCurrency(totalCollectedGross)}
                </span>
              </div>
              <span className="text-2xl text-slate-600 font-light">/</span>
              <div>
                <span className="text-xs text-slate-400 font-medium block">Annual Target Goal</span>
                <span className="text-2xl sm:text-3xl font-bold text-slate-100">
                  {formatCurrency(totalTargetRevenue)}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300 max-w-xl">
              Coaching revenue collection benchmark for the current academic session based on net tuition, admission, exam & curriculum materials.
            </p>
          </div>

          {/* KPI Badge Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Target Achieved
              </span>
              <div className="text-xl sm:text-2xl font-black text-emerald-400 mt-0.5">
                {progressPercentage.toFixed(1)}%
              </div>
              <span className="text-[10px] text-emerald-300/80 font-medium block mt-0.5 flex items-center justify-center gap-0.5">
                <TrendingUp className="w-3 h-3" />
                Active Velocity
              </span>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Remaining Deficit
              </span>
              <div className="text-xl sm:text-2xl font-black text-amber-400 mt-0.5">
                {formatCurrency(totalOutstandingDues)}
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                To reach 100% goal
              </span>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 text-center col-span-2 sm:col-span-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Scholarships Given
              </span>
              <div className="text-lg sm:text-xl font-bold text-slate-200 mt-0.5">
                {formatCurrency(totalScholarshipDiscount)}
              </div>
              <span className="text-[10px] text-emerald-400/90 font-medium block mt-0.5">
                Fee concessions
              </span>
            </div>
          </div>

        </div>

        {/* Big Interactive Visual Progress Bar */}
        <div className="mt-6 pt-5 border-t border-slate-700/60 space-y-2">
          
          <div className="flex items-center justify-between text-xs font-semibold">
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" />
                {progressPercentage.toFixed(1)}% Collected
              </span>
              <span className="text-slate-400 text-[11px]">
                ({formatCurrency(totalCollectedGross)} of {formatCurrency(totalTargetRevenue)})
              </span>
            </div>
            <span className="text-slate-300 text-[11px] font-mono">
              Target: {formatCurrency(totalTargetRevenue)} (100%)
            </span>
          </div>

          {/* Multi-layered Progress Track */}
          <div className="relative w-full h-4 bg-slate-950/70 rounded-full overflow-hidden p-0.5 border border-slate-700 shadow-inner">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 transition-all duration-700 relative shadow-sm"
              style={{ width: `${Math.max(3, progressPercentage)}%` }}
            >
              {/* Animated highlight shimmer stripe */}
              <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse pointer-events-none" />
            </div>
          </div>

          {/* Milestone markers */}
          <div className="grid grid-cols-4 text-[10px] text-slate-400 pt-1 font-mono">
            <div className="text-left border-l border-slate-700 pl-1">
              <span className="block text-slate-300 font-bold">25%</span>
              <span>{formatCurrency(totalTargetRevenue * 0.25)}</span>
            </div>
            <div className="text-left border-l border-slate-700 pl-1">
              <span className="block text-slate-300 font-bold">50%</span>
              <span>{formatCurrency(totalTargetRevenue * 0.5)}</span>
            </div>
            <div className="text-left border-l border-slate-700 pl-1">
              <span className="block text-slate-300 font-bold">75%</span>
              <span>{formatCurrency(totalTargetRevenue * 0.75)}</span>
            </div>
            <div className="text-right border-r border-slate-700 pr-1">
              <span className="block text-emerald-400 font-bold">100% Goal</span>
              <span>{formatCurrency(totalTargetRevenue)}</span>
            </div>
          </div>

        </div>
      </div>

      {/* Sparkline Chart & Monthly Velocity Section */}
      <div className="p-5 sm:p-6 space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Monthly Collection Trajectory & Run-Rate Sparkline
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Cumulative fee inflow across session months vs linear target pace benchmark
            </p>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-emerald-600" />
              <span className="text-slate-600 font-medium">Actual Cumulative</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-0.5 border-t-2 border-dashed border-slate-400" />
              <span className="text-slate-500 font-medium">Target Pace Benchmark</span>
            </div>
          </div>
        </div>

        {/* Responsive Sparkline Visualizer */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          
          <div className="w-full overflow-x-auto no-scrollbar">
            <div className="min-w-[550px]">
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full h-32 overflow-visible"
              >
                <defs>
                  <linearGradient id="feeAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid Lines */}
                <line
                  x1={paddingX}
                  y1={paddingY}
                  x2={svgWidth - paddingX}
                  y2={paddingY}
                  stroke="#e2e8f0"
                  strokeDasharray="4 4"
                />
                <line
                  x1={paddingX}
                  y1={svgHeight / 2}
                  x2={svgWidth - paddingX}
                  y2={svgHeight / 2}
                  stroke="#e2e8f0"
                  strokeDasharray="4 4"
                />
                <line
                  x1={paddingX}
                  y1={svgHeight - paddingY}
                  x2={svgWidth - paddingX}
                  y2={svgHeight - paddingY}
                  stroke="#cbd5e1"
                  strokeWidth="1.5"
                />

                {/* Target Benchmark Line (Linear Pace) */}
                <path
                  d={benchmarkPath}
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="2"
                  strokeDasharray="5 5"
                />

                {/* Actual Collection Area Fill */}
                <path d={areaPath} fill="url(#feeAreaGradient)" />

                {/* Actual Collection Line */}
                <path
                  d={sparklinePath}
                  fill="none"
                  stroke="#059669"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Interactive Points on Sparkline */}
                {points.map((pt, idx) => {
                  const isHovered = hoveredMonthIndex === idx;
                  const isLastActive = idx === 4; // August in current academic calendar
                  const hasData = pt.data.monthlyAmount > 0;

                  return (
                    <g
                      key={pt.data.monthKey}
                      className="cursor-pointer transition-all"
                      onMouseEnter={() => setHoveredMonthIndex(idx)}
                      onMouseLeave={() => setHoveredMonthIndex(null)}
                    >
                      {/* Interactive Target hit zone */}
                      <circle cx={pt.x} cy={pt.y} r={12} fill="transparent" />

                      {/* Outer Ring on active points */}
                      {(isHovered || hasData) && (
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={isHovered ? 6.5 : 4.5}
                          fill="#ffffff"
                          stroke={isHovered ? '#047857' : '#10b981'}
                          strokeWidth={isHovered ? 2.5 : 2}
                          className="transition-all"
                        />
                      )}

                      {/* Month label along bottom */}
                      <text
                        x={pt.x}
                        y={svgHeight}
                        textAnchor="middle"
                        className={`text-[10px] font-sans select-none ${
                          isHovered ? 'fill-emerald-800 font-black' : 'fill-slate-500 font-medium'
                        }`}
                      >
                        {pt.data.monthLabel}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Month Hover Details Bar */}
          <div className="mt-3 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            {activeHoverData ? (
              <div className="flex flex-wrap items-center gap-4 bg-emerald-50 text-emerald-900 px-3.5 py-1.5 rounded-lg border border-emerald-200 font-medium">
                <span className="font-bold flex items-center gap-1 text-emerald-800">
                  <Calendar className="w-3.5 h-3.5" />
                  {activeHoverData.monthName}:
                </span>
                <span>
                  Month Collection: <strong className="font-bold">{formatCurrency(activeHoverData.monthlyAmount)}</strong> ({activeHoverData.depositCount} deposits)
                </span>
                <span>
                  Cumulative Total: <strong className="font-bold text-emerald-700">{formatCurrency(activeHoverData.cumulativeAmount)}</strong>
                </span>
                <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                  {activeHoverData.percentageOfTarget}% Goal Reached
                </span>
              </div>
            ) : (
              <div className="text-slate-500 flex items-center gap-1.5 text-[11px]">
                <Info className="w-3.5 h-3.5 text-slate-400" />
                Hover over monthly sparkline markers to view month-specific fee deposits & cumulative progress.
              </div>
            )}

            <button
              id="toggle-class-breakdown-btn"
              onClick={() => setShowClassBreakdown(!showClassBreakdown)}
              className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1 px-3 py-1 bg-white border border-slate-300 rounded-lg shadow-2xs hover:bg-slate-100 transition-colors cursor-pointer ml-auto"
            >
              <Layers className="w-3.5 h-3.5 text-slate-600" />
              <span>{showClassBreakdown ? 'Hide Class Breakdown' : 'Class-wise Revenue Contribution'}</span>
              {showClassBreakdown ? (
                <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              )}
            </button>
          </div>

        </div>

        {/* Collapsible Class-wise Contribution Sparkline Cards */}
        {showClassBreakdown && (
          <div className="pt-2 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Class 5 to 12 Target Goal & Collection Breakdown
              </h4>
              <span className="text-[11px] text-slate-500">
                8 Academic Standard Batches
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {classBreakdown.map((item) => (
                <div
                  key={item.classLevel}
                  className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-100/70 transition-colors space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">Class {item.classLevel}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
                      {item.studentCount} Students
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Collected:</span>
                      <span className="font-bold text-emerald-700">{formatCurrency(item.collected)}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Target Goal:</span>
                      <span className="font-medium text-slate-700">{formatCurrency(item.targetRevenue)}</span>
                    </div>
                  </div>

                  {/* Mini Class Progress Bar */}
                  <div className="space-y-1 pt-1">
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 rounded-full transition-all"
                        style={{ width: `${Math.max(2, item.progress)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                      <span>{item.progress.toFixed(0)}% goal</span>
                      <span className="text-amber-600 font-medium">Due: {formatCurrency(item.pending)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
