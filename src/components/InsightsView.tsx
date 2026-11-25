import React, { useState, useEffect } from 'react';
import { RotateCw, Sparkles, TrendingUp, Bot, FileText, AlertCircle } from 'lucide-react';
import { Transaction, Subscription, AIInsightData } from '../types';
import { CATEGORIES } from '../data/categories';
import { AIChatBot } from './AIChatBot';
import { ExpenseReportsView } from './ExpenseReportsView';

interface InsightsViewProps {
  transactions: Transaction[];
  subscriptions: Subscription[];
  overallBudget: number;
}

export const InsightsView: React.FC<InsightsViewProps> = ({
  transactions,
  subscriptions,
  overallBudget,
}) => {
  const [loading, setLoading] = useState(false);
  const [aiData, setAiData] = useState<AIInsightData | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'reports' | 'bot' | 'advice'>('bot');

  // Compute category breakdown from transactions and active subscriptions
  const activeSubs = subscriptions.filter((s) => s.active);
  const categoryTotals: Record<string, number> = {};

  // Add subscriptions
  activeSubs.forEach((sub) => {
    categoryTotals[sub.category] =
      (categoryTotals[sub.category] || 0) + sub.amount;
  });

  // Add transactions
  transactions.forEach((tx) => {
    categoryTotals[tx.category] =
      (categoryTotals[tx.category] || 0) + tx.amount;
  });

  const grandTotal = Object.values(categoryTotals).reduce(
    (a, b) => a + b,
    0
  );

  const categoryList = Object.entries(categoryTotals)
    .map(([name, amount]) => {
      const catObj = CATEGORIES.find((c) => c.name === name);
      const percentage =
        grandTotal > 0 ? Math.round((amount / grandTotal) * 100) : 0;
      return {
        name,
        amount,
        percentage,
        emoji: catObj?.emoji || '💰',
      };
    })
    .sort((a, b) => b.amount - a.amount);

  const fetchAIAnalysis = async () => {
    setLoading(true);
    setAiError(null);
    try {
      const res = await fetch('/api/ai-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expenses: transactions,
          subscriptions: activeSubs,
          totalBudget: overallBudget,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.data) {
        setAiData(data.data);
      } else {
        setAiError(data.error || 'Could not generate AI insights right now.');
      }
    } catch (err) {
      console.error(err);
      setAiError('Network error while connecting to Gemini AI Insights.');
    } finally {
      setLoading(false);
    }
  };

  // Automatically fetch AI Insights on load or when expenses/budget change
  useEffect(() => {
    fetchAIAnalysis();
  }, [transactions.length, activeSubs.length, overallBudget]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 pb-28 lg:pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight flex items-center gap-2">
            <span>Insights & Reports</span>
            <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Gemini AI
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Weekly and monthly expense reports & smart AI financial assistant
          </p>
        </div>

        {/* Refresh button */}
        <button
          onClick={fetchAIAnalysis}
          disabled={loading}
          aria-label="Refresh AI Insights"
          className="self-end sm:self-auto px-3.5 py-2 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/80 flex items-center gap-2 text-slate-700 hover:bg-white shadow-xs transition active:scale-95 text-xs font-bold cursor-pointer disabled:opacity-60"
        >
          <RotateCw
            className={`w-4 h-4 stroke-[2] ${loading ? 'animate-spin text-indigo-600' : ''}`}
          />
          <span>{loading ? 'Analyzing...' : 'Refresh Insights'}</span>
        </button>
      </div>

      {/* Main Mode Navigation Bar */}
      <div className="bg-white/80 backdrop-blur-md p-1.5 rounded-2xl flex border border-slate-200/80 shadow-xs max-w-2xl">
        <button
          type="button"
          onClick={() => setActiveTab('reports')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'reports'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm scale-[1.01]'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Expense Reports</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${activeTab === 'reports' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
            Weekly & Monthly
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('bot')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'bot'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm scale-[1.01]'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>AI Financial Bot</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('advice')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'advice'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm scale-[1.01]'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Smart Advice</span>
        </button>
      </div>

      {/* 1. EXPENSE REPORTS TAB (Weekly & Monthly Reports) */}
      {activeTab === 'reports' && (
        <ExpenseReportsView
          transactions={transactions}
          subscriptions={subscriptions}
          overallBudget={overallBudget}
        />
      )}

      {/* 2. AI FINANCIAL BOT TAB */}
      {activeTab === 'bot' && (
        <div className="max-w-4xl mx-auto">
          <AIChatBot
            transactions={transactions}
            subscriptions={subscriptions}
            overallBudget={overallBudget}
            categoryTotals={categoryTotals}
            grandTotal={grandTotal}
            isEmbedded={true}
          />
        </div>
      )}

      {/* 3. SMART ADVICE & CATEGORY OVERVIEW TAB */}
      {activeTab === 'advice' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Personalized Analysis */}
          <div className="lg:col-span-6 space-y-5">
            <div className="bg-indigo-50/80 border border-indigo-100 rounded-[28px] p-6 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-indigo-800 font-extrabold text-sm">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>Personalized AI Financial Analysis</span>
                </div>
                {typeof aiData?.healthScore === 'number' && !loading && (
                  <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-white text-indigo-700 border border-indigo-200">
                    Health Score: {aiData.healthScore}/100
                  </span>
                )}
              </div>

              {loading && (
                <div className="flex items-center gap-2.5 py-3 text-xs font-semibold text-indigo-700">
                  <RotateCw className="w-4 h-4 animate-spin" />
                  <span>Generating fresh Gemini AI analysis for your spending...</span>
                </div>
              )}

              {aiError && !loading && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{aiError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={fetchAIAnalysis}
                    className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-bold text-[11px] shrink-0 hover:bg-rose-700 transition cursor-pointer"
                  >
                    Retry
                  </button>
                </div>
              )}

              {!loading && !aiError && (
                <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
                  {aiData?.summary ||
                    (grandTotal === 0
                      ? 'Add expenses to unlock personalized AI insights and spend forecasting.'
                      : 'Click "Refresh Insights" to generate your personalized Gemini financial summary.')}
                </p>
              )}

              {!loading && aiData?.recommendations && aiData.recommendations.length > 0 && (
                <div className="pt-4 border-t border-indigo-200/80 space-y-2.5">
                  <span className="text-[11px] font-black text-indigo-900 uppercase tracking-wider">
                    Targeted Money-Saving Advice
                  </span>
                  <ul className="text-xs text-slate-700 space-y-2">
                    {aiData.recommendations.map((tip, idx) => (
                      <li key={idx} className="flex items-start gap-2 bg-white/60 p-2.5 rounded-xl border border-indigo-100">
                        <span className="text-indigo-600 font-bold">✓</span>
                        <span className="leading-snug">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Top Categories */}
          <div className="lg:col-span-6 bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-[28px] p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>Expense Category Concentration</span>
              </div>
              <span className="text-xs font-bold text-slate-500">
                {categoryList.length} Categories
              </span>
            </div>

            {categoryList.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No category data yet. Log an expense or subscription to view breakdowns.
              </div>
            ) : (
              <div className="space-y-4">
                {categoryList.map((cat) => (
                  <div key={cat.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                      <span className="flex items-center gap-2">
                        <span className="text-base">{cat.emoji}</span>
                        <span className="font-extrabold">{cat.name}</span>
                      </span>
                      <span>
                        ₹{cat.amount.toLocaleString('en-IN')} · {cat.percentage}%
                      </span>
                    </div>
                    {/* Full-width green progress bar */}
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
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
        </div>
      )}
    </div>
  );
};
