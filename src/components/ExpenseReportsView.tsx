import React, { useState, useMemo } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart as PieIcon,
  BarChart3,
  Sparkles,
  Download,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  FileText,
  Share2,
  Clock,
  Zap,
} from 'lucide-react';
import { Transaction, Subscription, ExpenseCategory } from '../types';
import { CATEGORIES } from '../data/categories';

interface ExpenseReportsViewProps {
  transactions: Transaction[];
  subscriptions: Subscription[];
  overallBudget: number;
}

export const ExpenseReportsView: React.FC<ExpenseReportsViewProps> = ({
  transactions,
  subscriptions,
  overallBudget,
}) => {
  const [reportType, setReportType] = useState<'weekly' | 'monthly'>('weekly');
  const [selectedWeekOffset, setSelectedWeekOffset] = useState<number>(0); // 0 = This week, 1 = Last week, 2 = 2 weeks ago
  const [selectedMonthOffset, setSelectedMonthOffset] = useState<number>(0); // 0 = This month, 1 = Last month
  const [copiedNotification, setCopiedNotification] = useState(false);

  // Reference current date (September 18, 2026)
  const baseDate = useMemo(() => new Date(), []);

  // Compute active subscriptions monthly sum
  const activeSubs = subscriptions.filter((s) => s.active);
  const monthlySubsTotal = activeSubs.reduce((acc, s) => {
    return acc + (s.billingCycle === 'yearly' ? s.amount / 12 : s.amount);
  }, 0);

  // If transactions are empty, generate realistic demo records so reports are immediately rich and useful
  const effectiveTransactions = useMemo(() => {
    if (transactions && transactions.length > 0) {
      return transactions;
    }
    // Realistic fallback data centered around September 2026
    return [
      { id: 'tx-s1', amount: 480, category: 'Food' as ExpenseCategory, merchant: 'Supermarket Groceries', date: '2026-09-18', note: 'Weekly fresh produce' },
      { id: 'tx-s2', amount: 150, category: 'Transport' as ExpenseCategory, merchant: 'Metro Rail Pass', date: '2026-09-17', note: 'Commute' },
      { id: 'tx-s3', amount: 1200, category: 'Shopping' as ExpenseCategory, merchant: 'Zara Apparel', date: '2026-09-16', note: 'Autumn jacket' },
      { id: 'tx-s4', amount: 350, category: 'Food' as ExpenseCategory, merchant: 'Blue Tokai Cafe', date: '2026-09-15', note: 'Coffee with team' },
      { id: 'tx-s5', amount: 890, category: 'Bills' as ExpenseCategory, merchant: 'Airtel Fiber Broadband', date: '2026-09-14', note: 'Monthly internet' },
      { id: 'tx-s6', amount: 650, category: 'Entertainment' as ExpenseCategory, merchant: 'PVR Cinema IMAX', date: '2026-09-12', note: 'Movie tickets' },
      { id: 'tx-s7', amount: 420, category: 'Food' as ExpenseCategory, merchant: 'Swiggy Gourmet', date: '2026-09-10', note: 'Dinner order' },
      { id: 'tx-s8', amount: 1800, category: 'Health' as ExpenseCategory, merchant: 'Apollo Pharmacy', date: '2026-09-08', note: 'Vitamins & wellness check' },
      { id: 'tx-s9', amount: 2400, category: 'Travel' as ExpenseCategory, merchant: 'MakeMyTrip Express', date: '2026-09-05', note: 'Weekend train trip' },
      { id: 'tx-s10', amount: 310, category: 'Food' as ExpenseCategory, merchant: 'Starbucks Reserve', date: '2026-09-03', note: 'Breakfast' },
      { id: 'tx-s11', amount: 750, category: 'Shopping' as ExpenseCategory, merchant: 'Amazon Essentials', date: '2026-09-02', note: 'Desk accessories' },
      { id: 'tx-s12', amount: 1500, category: 'Bills' as ExpenseCategory, merchant: 'Electric Utility Board', date: '2026-09-01', note: 'Electricity bill' },
    ];
  }, [transactions]);

  // ==========================================
  // WEEKLY REPORT CALCULATIONS
  // ==========================================
  const weeklyData = useMemo(() => {
    // Current week dates: Calculate Monday - Sunday
    const now = new Date(baseDate);
    // Shift by week offset
    now.setDate(now.getDate() - selectedWeekOffset * 7);

    const currentDayOfWeek = now.getDay(); // 0 = Sun, 1 = Mon ...
    const distanceToMonday = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + distanceToMonday);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const daysArr = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      return {
        dateStr: iso,
        label: dayNames[i],
        dayNum: d.getDate(),
        monthShort: d.toLocaleString('en-US', { month: 'short' }),
        total: 0,
        txs: [] as Transaction[],
      };
    });

    // Populate day totals from effective transactions
    const weekTxs: Transaction[] = [];
    const catTotals: Record<string, number> = {};

    effectiveTransactions.forEach((tx) => {
      const txDate = tx.date ? tx.date.split('T')[0] : '';
      const dayObj = daysArr.find((d) => d.dateStr === txDate);
      if (dayObj) {
        dayObj.total += tx.amount;
        dayObj.txs.push(tx);
        weekTxs.push(tx);
        catTotals[tx.category] = (catTotals[tx.category] || 0) + tx.amount;
      }
    });

    const totalWeeklySpent = weekTxs.reduce((sum, t) => sum + t.amount, 0);
    const dailyAverage = Math.round(totalWeeklySpent / 7);
    const weeklyBudgetTarget = overallBudget > 0 ? Math.round(overallBudget / 4) : 5000;
    const budgetVariance = weeklyBudgetTarget - totalWeeklySpent;

    // Peak spend day
    const peakDay = [...daysArr].sort((a, b) => b.total - a.total)[0];
    const noSpendDays = daysArr.filter((d) => d.total === 0).length;

    // Max day total for bar scaling
    const maxDayTotal = Math.max(...daysArr.map((d) => d.total), 500);

    // Sorted categories
    const categoryBreakdown = Object.entries(catTotals)
      .map(([name, amount]) => {
        const catInfo = CATEGORIES.find((c) => c.name === name);
        const percentage = totalWeeklySpent > 0 ? Math.round((amount / totalWeeklySpent) * 100) : 0;
        return {
          name,
          amount,
          percentage,
          emoji: catInfo?.emoji || '🏷️',
        };
      })
      .sort((a, b) => b.amount - a.amount);

    const weekRangeLabel = `${monday.toLocaleString('en-US', { month: 'short', day: 'numeric' })} – ${sunday.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

    return {
      monday,
      sunday,
      weekRangeLabel,
      daysArr,
      weekTxs,
      totalWeeklySpent,
      dailyAverage,
      weeklyBudgetTarget,
      budgetVariance,
      peakDay,
      noSpendDays,
      maxDayTotal,
      categoryBreakdown,
    };
  }, [baseDate, selectedWeekOffset, effectiveTransactions, overallBudget]);

  // ==========================================
  // MONTHLY REPORT CALCULATIONS
  // ==========================================
  const monthlyData = useMemo(() => {
    const targetDate = new Date(baseDate);
    targetDate.setMonth(targetDate.getMonth() - selectedMonthOffset);
    const targetYear = targetDate.getFullYear();
    const targetMonth = targetDate.getMonth(); // 0-11
    const monthName = targetDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });

    // Filter transactions for this month
    const monthTxs = effectiveTransactions.filter((tx) => {
      if (!tx.date) return false;
      const d = new Date(tx.date);
      return d.getFullYear() === targetYear && d.getMonth() === targetMonth;
    });

    const txSum = monthTxs.reduce((sum, t) => sum + t.amount, 0);
    const totalMonthlySpent = txSum + (selectedMonthOffset === 0 ? monthlySubsTotal : 0);
    const effectiveMonthlyBudget = overallBudget > 0 ? overallBudget : 25000;
    const remainingBudget = effectiveMonthlyBudget - totalMonthlySpent;
    const budgetUtilizationPct = Math.round((totalMonthlySpent / effectiveMonthlyBudget) * 100);

    // Week-by-Week distribution (Week 1: days 1-7, Week 2: days 8-14, Week 3: days 15-21, Week 4+: 22-end)
    const weekBuckets = [
      { label: 'Week 1 (1–7)', total: 0, count: 0 },
      { label: 'Week 2 (8–14)', total: 0, count: 0 },
      { label: 'Week 3 (15–21)', total: 0, count: 0 },
      { label: 'Week 4+ (22+)', total: 0, count: 0 },
    ];

    monthTxs.forEach((tx) => {
      const dayNum = new Date(tx.date).getDate();
      if (dayNum <= 7) {
        weekBuckets[0].total += tx.amount;
        weekBuckets[0].count++;
      } else if (dayNum <= 14) {
        weekBuckets[1].total += tx.amount;
        weekBuckets[1].count++;
      } else if (dayNum <= 21) {
        weekBuckets[2].total += tx.amount;
        weekBuckets[2].count++;
      } else {
        weekBuckets[3].total += tx.amount;
        weekBuckets[3].count++;
      }
    });

    const maxWeekTotal = Math.max(...weekBuckets.map((w) => w.total), 1000);

    // Category breakdown
    const catTotals: Record<string, number> = {};
    monthTxs.forEach((tx) => {
      catTotals[tx.category] = (catTotals[tx.category] || 0) + tx.amount;
    });
    // Add subscriptions to category totals
    if (selectedMonthOffset === 0) {
      activeSubs.forEach((sub) => {
        catTotals[sub.category] = (catTotals[sub.category] || 0) + sub.amount;
      });
    }

    const categoryBreakdown = Object.entries(catTotals)
      .map(([name, amount]) => {
        const catInfo = CATEGORIES.find((c) => c.name === name);
        const percentage = totalMonthlySpent > 0 ? Math.round((amount / totalMonthlySpent) * 100) : 0;
        return {
          name,
          amount,
          percentage,
          emoji: catInfo?.emoji || '🏷️',
        };
      })
      .sort((a, b) => b.amount - a.amount);

    // Top 5 largest expenses
    const topExpenses = [...monthTxs].sort((a, b) => b.amount - a.amount).slice(0, 5);

    // Savings rate
    const savingsRate = remainingBudget > 0 ? Math.round((remainingBudget / effectiveMonthlyBudget) * 100) : 0;

    return {
      monthName,
      monthTxs,
      totalMonthlySpent,
      effectiveMonthlyBudget,
      remainingBudget,
      budgetUtilizationPct,
      weekBuckets,
      maxWeekTotal,
      categoryBreakdown,
      topExpenses,
      savingsRate,
      discretionarySpend: txSum,
      fixedSubscriptionsSpend: selectedMonthOffset === 0 ? monthlySubsTotal : 0,
    };
  }, [baseDate, selectedMonthOffset, effectiveTransactions, overallBudget, monthlySubsTotal, activeSubs]);

  const handleCopySummary = () => {
    let summaryText = '';
    if (reportType === 'weekly') {
      summaryText = `📊 TRACKSY WEEKLY REPORT (${weeklyData.weekRangeLabel})\n• Total Spent: ₹${weeklyData.totalWeeklySpent.toLocaleString('en-IN')}\n• Daily Average: ₹${weeklyData.dailyAverage.toLocaleString('en-IN')}\n• Peak Spend Day: ${weeklyData.peakDay?.label || 'N/A'} (₹${weeklyData.peakDay?.total || 0})\n• Budget Target: ₹${weeklyData.weeklyBudgetTarget.toLocaleString('en-IN')}`;
    } else {
      summaryText = `📊 TRACKSY MONTHLY REPORT (${monthlyData.monthName})\n• Total Spent: ₹${monthlyData.totalMonthlySpent.toLocaleString('en-IN')}\n• Monthly Budget: ₹${monthlyData.effectiveMonthlyBudget.toLocaleString('en-IN')}\n• Budget Used: ${monthlyData.budgetUtilizationPct}%\n• Savings Buffer: ₹${monthlyData.remainingBudget.toLocaleString('en-IN')}`;
    }

    if (navigator.clipboard) {
      navigator.clipboard.writeText(summaryText);
      setCopiedNotification(true);
      setTimeout(() => setCopiedNotification(false), 2500);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Sub-Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/70 backdrop-blur-xl p-4 sm:p-5 rounded-3xl border border-white/80 shadow-sm">
        {/* Toggle between Weekly & Monthly Report */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100/90 border border-slate-200">
          <button
            type="button"
            onClick={() => setReportType('weekly')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
              reportType === 'weekly'
                ? 'bg-white text-indigo-700 shadow-sm scale-[1.02]'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
            <span>Weekly Report</span>
          </button>
          <button
            type="button"
            onClick={() => setReportType('monthly')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
              reportType === 'monthly'
                ? 'bg-white text-indigo-700 shadow-sm scale-[1.02]'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
            <span>Monthly Report</span>
          </button>
        </div>

        {/* Date Period Selector & Export */}
        <div className="flex items-center gap-2">
          {reportType === 'weekly' ? (
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-1.5 rounded-2xl text-xs font-bold text-slate-800">
              <button
                type="button"
                onClick={() => setSelectedWeekOffset((prev) => Math.min(prev + 1, 4))}
                disabled={selectedWeekOffset >= 4}
                className="p-1 rounded-lg hover:bg-slate-200 disabled:opacity-30 disabled:pointer-events-none transition"
                title="Previous Week"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-black text-slate-900">
                {selectedWeekOffset === 0
                  ? 'This Week'
                  : selectedWeekOffset === 1
                  ? 'Last Week'
                  : `${selectedWeekOffset} Weeks Ago`}
              </span>
              <button
                type="button"
                onClick={() => setSelectedWeekOffset((prev) => Math.max(prev - 1, 0))}
                disabled={selectedWeekOffset <= 0}
                className="p-1 rounded-lg hover:bg-slate-200 disabled:opacity-30 disabled:pointer-events-none transition"
                title="Next Week"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-1.5 rounded-2xl text-xs font-bold text-slate-800">
              <button
                type="button"
                onClick={() => setSelectedMonthOffset((prev) => Math.min(prev + 1, 3))}
                disabled={selectedMonthOffset >= 3}
                className="p-1 rounded-lg hover:bg-slate-200 disabled:opacity-30 disabled:pointer-events-none transition"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-black text-slate-900">
                {selectedMonthOffset === 0
                  ? 'Current Month'
                  : selectedMonthOffset === 1
                  ? 'Last Month'
                  : `${selectedMonthOffset} Months Ago`}
              </span>
              <button
                type="button"
                onClick={() => setSelectedMonthOffset((prev) => Math.max(prev - 1, 0))}
                disabled={selectedMonthOffset <= 0}
                className="p-1 rounded-lg hover:bg-slate-200 disabled:opacity-30 disabled:pointer-events-none transition"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Quick Share / Export Button */}
          <button
            type="button"
            onClick={handleCopySummary}
            className="px-3.5 py-2 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center gap-1.5 border border-indigo-200/80 transition active:scale-95"
            title="Copy Report Summary"
          >
            {copiedNotification ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>Export</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ========================================================== */}
      {/* 1. WEEKLY EXPENSE REPORT VIEW                              */}
      {/* ========================================================== */}
      {reportType === 'weekly' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white p-5 sm:p-6 rounded-[28px] shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-indigo-800/40">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-800/60 border border-indigo-400/40 text-[11px] font-black uppercase tracking-wider text-indigo-200 mb-2">
                <Calendar className="w-3.5 h-3.5 text-indigo-300" />
                <span>{weeklyData.weekRangeLabel}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">Weekly Expense Audit</h2>
              <p className="text-xs text-indigo-200/80 font-medium">
                Day-by-day expenditure pattern & pace evaluation
              </p>
            </div>

            <div className="text-left sm:text-right bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/20">
              <span className="text-[11px] text-indigo-200 font-bold uppercase block">Total Weekly Spend</span>
              <span className="text-2xl sm:text-3xl font-black text-white">
                ₹{weeklyData.totalWeeklySpent.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* KPI Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
            {/* Daily Average */}
            <div className="bg-white/80 backdrop-blur-md p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Daily Average</span>
              <div className="text-lg sm:text-xl font-black text-slate-900">
                ₹{weeklyData.dailyAverage.toLocaleString('en-IN')}
                <span className="text-xs font-normal text-slate-500"> /day</span>
              </div>
              <div className="text-[11px] text-slate-500 font-semibold flex items-center gap-1 pt-1">
                <Clock className="w-3 h-3 text-indigo-600" />
                <span>Across 7 days</span>
              </div>
            </div>

            {/* Weekly Budget Target */}
            <div className="bg-white/80 backdrop-blur-md p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Weekly Target</span>
              <div className="text-lg sm:text-xl font-black text-slate-900">
                ₹{weeklyData.weeklyBudgetTarget.toLocaleString('en-IN')}
              </div>
              <div
                className={`text-[11px] font-bold flex items-center gap-1 pt-1 ${
                  weeklyData.budgetVariance >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {weeklyData.budgetVariance >= 0 ? (
                  <>
                    <TrendingDown className="w-3 h-3" />
                    <span>₹{weeklyData.budgetVariance.toLocaleString('en-IN')} under pace</span>
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-3 h-3" />
                    <span>₹{Math.abs(weeklyData.budgetVariance).toLocaleString('en-IN')} over pace</span>
                  </>
                )}
              </div>
            </div>

            {/* Peak Spending Day */}
            <div className="bg-white/80 backdrop-blur-md p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Peak Spend Day</span>
              <div className="text-lg sm:text-xl font-black text-slate-900">
                {weeklyData.peakDay && weeklyData.peakDay.total > 0 ? weeklyData.peakDay.label : 'None'}
              </div>
              <div className="text-[11px] text-slate-500 font-semibold pt-1">
                {weeklyData.peakDay && weeklyData.peakDay.total > 0
                  ? `₹${weeklyData.peakDay.total.toLocaleString('en-IN')} spent on ${weeklyData.peakDay.dayNum} ${weeklyData.peakDay.monthShort}`
                  : 'Balanced daily spending'}
              </div>
            </div>

            {/* No-Spend Days */}
            <div className="bg-white/80 backdrop-blur-md p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Zero-Spend Days</span>
              <div className="text-lg sm:text-xl font-black text-emerald-600">
                {weeklyData.noSpendDays} of 7 Days
              </div>
              <div className="text-[11px] text-slate-500 font-semibold pt-1">
                {weeklyData.noSpendDays >= 2 ? '🎉 Great financial discipline!' : 'Consistent daily expenses'}
              </div>
            </div>
          </div>

          {/* Day-by-Day Interactive Bar Chart */}
          <div className="bg-white/80 backdrop-blur-xl p-5 sm:p-6 rounded-[28px] border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-indigo-600" />
                  <span>Day-by-Day Spending Distribution</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium">Daily outflow throughout the selected week</p>
              </div>
              <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-xl border border-indigo-200">
                Peak: ₹{weeklyData.maxDayTotal.toLocaleString('en-IN')}
              </span>
            </div>

            {/* Bars container */}
            <div className="pt-6 pb-2 grid grid-cols-7 gap-2 sm:gap-4 items-end h-48 border-b border-slate-100">
              {weeklyData.daysArr.map((day) => {
                const heightPct = Math.max(Math.round((day.total / weeklyData.maxDayTotal) * 100), day.total > 0 ? 12 : 3);
                const isPeak = day.total > 0 && day.total === weeklyData.peakDay?.total;

                return (
                  <div key={day.dateStr} className="flex flex-col items-center h-full justify-end group relative">
                    {/* Amount Tooltip on top of bar */}
                    <span className="text-[10px] sm:text-xs font-black text-slate-700 mb-1 opacity-90 group-hover:scale-110 transition">
                      {day.total > 0 ? `₹${day.total}` : '₹0'}
                    </span>

                    {/* Bar */}
                    <div className="w-full max-w-[36px] bg-slate-100 rounded-t-xl overflow-hidden flex flex-col justify-end h-32">
                      <div
                        className={`w-full rounded-t-xl transition-all duration-500 ${
                          isPeak
                            ? 'bg-gradient-to-t from-rose-500 to-amber-400 shadow-[0_4px_12px_rgba(244,63,94,0.3)]'
                            : day.total > 0
                            ? 'bg-gradient-to-t from-indigo-600 to-sky-400'
                            : 'bg-slate-200 h-1'
                        }`}
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>

                    {/* Day label */}
                    <div className="text-center mt-2">
                      <span className="block text-xs font-black text-slate-800">{day.label}</span>
                      <span className="block text-[10px] text-slate-400 font-semibold">{day.dayNum}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Two-Column Grid: Weekly Categories & Transactions */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Category Outflow */}
            <div className="lg:col-span-6 bg-white/80 backdrop-blur-xl p-5 sm:p-6 rounded-[28px] border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                  <PieIcon className="w-4 h-4 text-emerald-600" />
                  <span>Weekly Category Outflow</span>
                </h3>
                <span className="text-xs font-bold text-slate-500">
                  {weeklyData.categoryBreakdown.length} Categories
                </span>
              </div>

              {weeklyData.categoryBreakdown.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No recorded transactions for this week.
                </div>
              ) : (
                <div className="space-y-3.5">
                  {weeklyData.categoryBreakdown.map((cat) => (
                    <div key={cat.name} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                        <span className="flex items-center gap-2">
                          <span className="text-base">{cat.emoji}</span>
                          <span className="font-extrabold">{cat.name}</span>
                        </span>
                        <span>
                          ₹{cat.amount.toLocaleString('en-IN')}{' '}
                          <span className="text-slate-400 text-[11px]">({cat.percentage}%)</span>
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${cat.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Transactions logged in this week */}
            <div className="lg:col-span-6 bg-white/80 backdrop-blur-xl p-5 sm:p-6 rounded-[28px] border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-sky-600" />
                  <span>Transactions this Week</span>
                </h3>
                <span className="text-xs font-bold text-slate-500">
                  {weeklyData.weekTxs.length} entries
                </span>
              </div>

              {weeklyData.weekTxs.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No expenses recorded in this period.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                  {weeklyData.weekTxs.map((tx) => (
                    <div
                      key={tx.id}
                      className="p-3 bg-slate-50/80 hover:bg-white rounded-2xl border border-slate-200/60 flex items-center justify-between transition shadow-2xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-base shadow-xs">
                          {CATEGORIES.find((c) => c.name === tx.category)?.emoji || '💰'}
                        </div>
                        <div>
                          <div className="text-xs font-black text-slate-900">
                            {tx.merchant || tx.category}
                          </div>
                          <div className="text-[10px] text-slate-500 font-semibold">
                            {tx.date ? new Date(tx.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'Recent'}{' '}
                            {tx.note && `• ${tx.note}`}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs font-black text-slate-900">
                        ₹{tx.amount.toLocaleString('en-IN')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* 2. MONTHLY EXPENSE REPORT VIEW                             */}
      {/* ========================================================== */}
      {reportType === 'monthly' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white p-5 sm:p-6 rounded-[28px] shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-emerald-800/40">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800/60 border border-emerald-400/40 text-[11px] font-black uppercase tracking-wider text-emerald-200 mb-2">
                <Calendar className="w-3.5 h-3.5 text-emerald-300" />
                <span>{monthlyData.monthName}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">Monthly Financial Report</h2>
              <p className="text-xs text-emerald-200/80 font-medium">
                Comprehensive budget utilization, week-by-week trends & savings rate
              </p>
            </div>

            <div className="text-left sm:text-right bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/20">
              <span className="text-[11px] text-emerald-200 font-bold uppercase block">Total Monthly Expenses</span>
              <span className="text-2xl sm:text-3xl font-black text-white">
                ₹{monthlyData.totalMonthlySpent.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* KPI Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
            {/* Monthly Budget */}
            <div className="bg-white/80 backdrop-blur-md p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Overall Budget</span>
              <div className="text-lg sm:text-xl font-black text-slate-900">
                ₹{monthlyData.effectiveMonthlyBudget.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-slate-500 font-semibold pt-1">
                Allocated for this month
              </div>
            </div>

            {/* Budget Utilization */}
            <div className="bg-white/80 backdrop-blur-md p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Budget Utilized</span>
              <div
                className={`text-lg sm:text-xl font-black ${
                  monthlyData.budgetUtilizationPct > 100
                    ? 'text-rose-600'
                    : monthlyData.budgetUtilizationPct > 80
                    ? 'text-amber-600'
                    : 'text-emerald-600'
                }`}
              >
                {monthlyData.budgetUtilizationPct}%
              </div>
              {/* Progress bar */}
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-1.5">
                <div
                  className={`h-full rounded-full ${
                    monthlyData.budgetUtilizationPct > 100
                      ? 'bg-rose-500'
                      : monthlyData.budgetUtilizationPct > 80
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(monthlyData.budgetUtilizationPct, 100)}%` }}
                />
              </div>
            </div>

            {/* Remaining Savings Buffer */}
            <div className="bg-white/80 backdrop-blur-md p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Remaining Buffer</span>
              <div
                className={`text-lg sm:text-xl font-black ${
                  monthlyData.remainingBudget >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                ₹{Math.abs(monthlyData.remainingBudget).toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-slate-500 font-semibold pt-1">
                {monthlyData.remainingBudget >= 0 ? 'Available surplus' : 'Over budget'}
              </div>
            </div>

            {/* Subscriptions vs Discretionary */}
            <div className="bg-white/80 backdrop-blur-md p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Fixed Subscriptions</span>
              <div className="text-lg sm:text-xl font-black text-purple-700">
                ₹{monthlyData.fixedSubscriptionsSpend.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-slate-500 font-semibold pt-1">
                {activeSubs.length} active recurring services
              </div>
            </div>
          </div>

          {/* Week-by-Week Trend Breakdown */}
          <div className="bg-white/80 backdrop-blur-xl p-5 sm:p-6 rounded-[28px] border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-600" />
                  <span>Week-by-Week Outflow Progression</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium">How expenses accumulated across the month</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
              {monthlyData.weekBuckets.map((bucket, idx) => {
                const heightPct = Math.max(Math.round((bucket.total / monthlyData.maxWeekTotal) * 100), bucket.total > 0 ? 10 : 3);

                return (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-700">{bucket.label}</span>
                      <span className="text-[11px] font-bold text-slate-400">{bucket.count} items</span>
                    </div>

                    <div className="text-lg font-black text-slate-900">
                      ₹{bucket.total.toLocaleString('en-IN')}
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${heightPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Two-Column Grid: Monthly Categories & Top Single Expenses */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Monthly Category Breakdown */}
            <div className="lg:col-span-6 bg-white/80 backdrop-blur-xl p-5 sm:p-6 rounded-[28px] border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                  <PieIcon className="w-4 h-4 text-indigo-600" />
                  <span>Monthly Category Breakdown</span>
                </h3>
                <span className="text-xs font-bold text-slate-500">
                  {monthlyData.categoryBreakdown.length} Categories
                </span>
              </div>

              {monthlyData.categoryBreakdown.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No expenses recorded this month.
                </div>
              ) : (
                <div className="space-y-3.5">
                  {monthlyData.categoryBreakdown.map((cat) => (
                    <div key={cat.name} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                        <span className="flex items-center gap-2">
                          <span className="text-base">{cat.emoji}</span>
                          <span className="font-extrabold">{cat.name}</span>
                        </span>
                        <span>
                          ₹{cat.amount.toLocaleString('en-IN')}{' '}
                          <span className="text-slate-400 text-[11px]">({cat.percentage}%)</span>
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${cat.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Top 5 Largest Expenses of the Month */}
            <div className="lg:col-span-6 bg-white/80 backdrop-blur-xl p-5 sm:p-6 rounded-[28px] border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-rose-600" />
                  <span>Top 5 Largest Outflows</span>
                </h3>
                <span className="text-[11px] font-bold text-slate-400 uppercase">Single Transactions</span>
              </div>

              {monthlyData.topExpenses.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No recorded transactions this month.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {monthlyData.topExpenses.map((tx, idx) => (
                    <div
                      key={tx.id}
                      className="p-3 bg-slate-50/80 hover:bg-white rounded-2xl border border-slate-200/60 flex items-center justify-between transition shadow-2xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-rose-50 border border-rose-200 text-rose-700 font-black text-xs flex items-center justify-center">
                          #{idx + 1}
                        </div>
                        <div>
                          <div className="text-xs font-black text-slate-900">
                            {tx.merchant || tx.category}
                          </div>
                          <div className="text-[10px] text-slate-500 font-semibold">
                            {tx.category} • {tx.date ? new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Recent'}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs font-black text-rose-600">
                        ₹{tx.amount.toLocaleString('en-IN')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* AI Monthly Assessment Card */}
          <div className="p-5 sm:p-6 rounded-[28px] bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border border-indigo-200/70 space-y-3">
            <div className="flex items-center gap-2 text-indigo-900 font-black text-sm">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>AI Monthly Financial Assessment</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
              In {monthlyData.monthName}, your total spend was ₹{monthlyData.totalMonthlySpent.toLocaleString('en-IN')}.{' '}
              {monthlyData.budgetUtilizationPct <= 85
                ? `You maintained outstanding discipline, saving approximately ${monthlyData.savingsRate}% of your planned allocation.`
                : monthlyData.budgetUtilizationPct <= 100
                ? 'Your expenditure remains within your overall limits, but watch late-month dining and subscription renewals.'
                : 'Expenses exceeded the initial monthly ceiling. Consider trimming non-essential shopping to restore positive cash flow.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
