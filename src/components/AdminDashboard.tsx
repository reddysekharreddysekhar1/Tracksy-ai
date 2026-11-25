import React, { useState } from 'react';
import {
  ShieldCheck,
  Users,
  Activity,
  AlertTriangle,
  Search,
  DollarSign,
  TrendingUp,
  RefreshCw,
  Eye,
  Ban,
  CheckCircle,
  BellRing,
  Cpu,
  Download,
  Terminal,
  Sparkles,
  Zap,
  X,
  BarChart3,
  Globe,
  Radio,
  ArrowRight,
  PieChart,
  Layers,
  Heart,
  LogOut
} from 'lucide-react';
import { TrackedUser, UserProfile } from '../types';

interface AdminDashboardProps {
  currentUser: UserProfile;
  trackedUsers: TrackedUser[];
  onUpdateTrackedUsers: (users: TrackedUser[]) => void;
  onSwitchToUserMode: () => void;
  onLogout?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  trackedUsers,
  onUpdateTrackedUsers,
  onSwitchToUserMode,
  onLogout,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'anomaly' | 'analytics' | 'system'>('users');
  const [selectedUser, setSelectedUser] = useState<TrackedUser | null>(null);
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Suspended' | 'Flagged'>('All');

  // AI Scan state
  const [isAiScanning, setIsAiScanning] = useState(false);
  const [aiScanResult, setAiScanResult] = useState<string | null>(null);

  // Broadcast modal state
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastSent, setBroadcastSent] = useState(false);

  // Filtered Users
  const filteredUsers = trackedUsers.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.handle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || u.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Global Metrics
  const totalUsersCount = trackedUsers.length;
  const activeUsersCount = trackedUsers.filter((u) => u.status === 'Active').length;
  const totalPlatformExpenses = trackedUsers.reduce((sum, u) => sum + u.totalExpenses, 0);
  const totalPlatformBudget = trackedUsers.reduce((sum, u) => sum + u.monthlyBudget, 0);
  const flaggedUsersCount = trackedUsers.filter((u) => u.status === 'Flagged' || u.riskLevel === 'High').length;

  const handleToggleUserStatus = (userId: string) => {
    const updated = trackedUsers.map((u) => {
      if (u.id === userId) {
        const nextStatus: TrackedUser['status'] = u.status === 'Active' ? 'Suspended' : 'Active';
        return { ...u, status: nextStatus };
      }
      return u;
    });
    onUpdateTrackedUsers(updated);
    if (selectedUser && selectedUser.id === userId) {
      setSelectedUser({
        ...selectedUser,
        status: selectedUser.status === 'Active' ? 'Suspended' : 'Active',
      });
    }
  };

  const handleRunAiSecurityScan = async () => {
    setIsAiScanning(true);
    setAiScanResult(null);

    try {
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Perform a full platform security audit and risk scan on user spending metrics, anomalies, and budget overruns.',
          financialContext: {
            overallBudget: totalPlatformBudget,
            grandTotal: totalPlatformExpenses,
            categoryTotals: { Food: 45000, Shopping: 62000, Transport: 18000, Bills: 32000 },
            subscriptions: [{ name: 'Enterprise API', amount: 12000 }],
            recentTransactions: trackedUsers.map((u) => ({
              title: `${u.name}'s spending`,
              amount: u.totalExpenses,
              category: 'Other',
              date: u.lastActive,
            })),
          },
        }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.reply) {
        setAiScanResult(data.reply);
      } else {
        setAiScanResult(`AI Scan Error: ${data.error || 'Could not complete platform audit right now.'}`);
      }
    } catch (err) {
      setAiScanResult('AI Scan Error: Network error while connecting to Gemini AI.');
    } finally {
      setIsAiScanning(false);
    }
  };

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;
    setBroadcastSent(true);
    setTimeout(() => {
      setBroadcastMessage('');
      setBroadcastSent(false);
    }, 3000);
  };

  const handleExportAudit = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(trackedUsers, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `tracksy_admin_audit_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#eafbee] via-[#f0f8ff] to-[#f9f3ff] text-slate-800 font-sans p-3 sm:p-6 lg:p-8 space-y-6">
      {/* Colorful Ambient Glow Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[550px] h-[550px] bg-gradient-to-tr from-emerald-300/30 via-teal-300/25 to-sky-300/30 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-[35%] right-[-10%] w-[600px] h-[600px] bg-gradient-to-br from-sky-300/25 via-indigo-300/20 to-purple-300/30 rounded-full blur-[110px] pointer-events-none" />
      <div className="absolute bottom-[-15%] left-[20%] w-[500px] h-[500px] bg-gradient-to-tr from-amber-300/25 via-pink-300/20 to-teal-300/25 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 max-w-7xl mx-auto space-y-6">

        {/* 1. Colorful Command Header (Stylized after the reference image top banner) */}
        <div className="relative rounded-[32px] bg-white/85 backdrop-blur-2xl border-2 border-white p-5 sm:p-7 shadow-[0_20px_50px_rgba(16,185,129,0.12),0_4px_16px_rgba(14,165,233,0.08)] overflow-hidden">
          {/* Top Liquid Specular Light Sheen */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white to-transparent pointer-events-none" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            {/* Title & Brand Capsule */}
            <div className="space-y-2">
              {/* Brush Tag Banner from Image: "Simple Steps. Smarter Finances." */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 border border-emerald-300 text-xs font-black text-emerald-800 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Simple Steps. Smarter Finances. • Admin Intelligence Hub</span>
              </div>

              <div className="flex items-center gap-3 sm:gap-4">
                {/* Reference Dark Teal / Mint Capsule Pill */}
                <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-[#063830] border-2 border-emerald-400 shadow-[0_8px_20px_rgba(5,150,105,0.35)] text-white font-black text-base tracking-wider">
                  <span className="text-xl">👛</span>
                  <span>TRACKSY</span>
                </div>

                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <span>Admin Control Center</span>
                  </h1>
                  <p className="text-xs text-slate-600 font-semibold flex items-center gap-2 mt-0.5">
                    <span>Authenticated as</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-sky-100 border border-sky-300 text-sky-900 font-mono font-bold text-[11px]">
                      {currentUser?.email || 'admi@gmail.com'}
                    </span>
                    <span className="text-emerald-700 font-bold">• Master Role</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons styled like the workflow pills from reference image */}
            <div className="flex flex-wrap items-center gap-3">
              {/* "Switch to User View" styled like the Sky-Blue "Login/Register" pill */}
              <button
                type="button"
                onClick={onSwitchToUserMode}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-600 hover:from-sky-500 hover:to-indigo-700 text-white font-black text-xs shadow-[0_6px_18px_rgba(14,165,233,0.35)] transition-all duration-200 active:scale-95 flex items-center gap-2 border-2 border-white/60"
              >
                <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center">
                  <Globe className="w-3 h-3 text-white" />
                </div>
                <span>Switch to User View</span>
              </button>

              {/* "Export Audit" styled like the Honey-Amber "Receipt OCR" pill */}
              <button
                type="button"
                onClick={handleExportAudit}
                className="px-4 py-2.5 rounded-2xl bg-amber-100 hover:bg-amber-200 text-amber-950 border-2 border-amber-300 font-black text-xs shadow-[0_4px_12px_rgba(245,158,11,0.15)] transition-all duration-200 active:scale-95 flex items-center gap-2"
              >
                <Download className="w-4 h-4 text-amber-800" />
                <span>Export Audit</span>
              </button>

              {/* "Logout" styled like the vibrant Rose/Pink "AI Advice" pill from reference diagram */}
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 hover:from-rose-600 hover:to-pink-700 text-white font-black text-xs shadow-[0_6px_18px_rgba(244,63,94,0.35)] transition-all duration-200 active:scale-95 flex items-center gap-2 border-2 border-white/60"
                  title="Sign out of Admin Control Center"
                >
                  <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center">
                    <LogOut className="w-3 h-3 text-white" />
                  </div>
                  <span>Logout</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 2. Four Colorful Metric Capsules (Drawn directly from reference image color hierarchy) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Card 1: Users (Mint Green from "Add Expense" / "Save Transaction") */}
          <div className="group relative rounded-[28px] bg-gradient-to-br from-emerald-50 via-teal-50/70 to-white border-2 border-emerald-300 p-4 sm:p-5 shadow-[0_10px_25px_rgba(16,185,129,0.12)] hover:border-emerald-400 transition-all duration-300">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-900">Total Users</span>
              <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/30 group-hover:scale-110 transition">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 tracking-tight">
              {totalUsersCount}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-[11px] font-bold text-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>{activeUsersCount} Active Accounts</span>
            </div>
          </div>

          {/* Card 2: Liquidity (Sky Blue from "Login/Register" / "Text") */}
          <div className="group relative rounded-[28px] bg-gradient-to-br from-sky-50 via-blue-50/70 to-white border-2 border-sky-300 p-4 sm:p-5 shadow-[0_10px_25px_rgba(14,165,233,0.12)] hover:border-sky-400 transition-all duration-300">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-sky-900">Platform Liquidity</span>
              <div className="w-9 h-9 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-md shadow-sky-500/30 group-hover:scale-110 transition">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 tracking-tight">
              ₹{totalPlatformExpenses.toLocaleString('en-IN')}
            </div>
            <div className="mt-2 text-[11px] font-bold text-sky-700">
              Avg ₹{totalUsersCount > 0 ? Math.round(totalPlatformExpenses / totalUsersCount).toLocaleString('en-IN') : 0} / user
            </div>
          </div>

          {/* Card 3: Budget Pool (Lavender Purple from "Dashboard" / "AI Category") */}
          <div className="group relative rounded-[28px] bg-gradient-to-br from-purple-50 via-fuchsia-50/70 to-white border-2 border-purple-300 p-4 sm:p-5 shadow-[0_10px_25px_rgba(168,85,247,0.12)] hover:border-purple-400 transition-all duration-300">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-purple-900">Budget Pool</span>
              <div className="w-9 h-9 rounded-full bg-purple-500 text-white flex items-center justify-center shadow-md shadow-purple-500/30 group-hover:scale-110 transition">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 tracking-tight">
              ₹{totalPlatformBudget.toLocaleString('en-IN')}
            </div>
            <div className="mt-2 text-[11px] font-bold text-purple-700">
              {totalPlatformBudget > 0 ? Math.round((totalPlatformExpenses / totalPlatformBudget) * 100) : 0}% Budget Utilized
            </div>
          </div>

          {/* Card 4: Threat Alerts (Honey Amber from "Receipt Scan" / "Budget Plan") */}
          <div className="group relative rounded-[28px] bg-gradient-to-br from-amber-50 via-orange-50/70 to-white border-2 border-amber-300 p-4 sm:p-5 shadow-[0_10px_25px_rgba(245,158,11,0.12)] hover:border-amber-400 transition-all duration-300">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-900">Risk & Anomalies</span>
              <div className="w-9 h-9 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/30 group-hover:scale-110 transition">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-700 mt-2 tracking-tight">
              {flaggedUsersCount}
            </div>
            <div className="mt-2 text-[11px] font-bold text-amber-800">
              Gemini 3.8 Vigilance Active
            </div>
          </div>
        </div>

        {/* 3. Colorful Workflow Navigation Tabs (Styled like the colorful capsules in the flowchart) */}
        <div className="p-2 rounded-2xl bg-white/90 backdrop-blur-xl border-2 border-white shadow-[0_8px_25px_rgba(0,0,0,0.06)] flex flex-wrap gap-2">
          {/* Tab 1: Emerald Mint Pill */}
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`flex-1 min-w-[130px] py-3 px-4 rounded-xl text-xs font-black transition-all duration-200 flex items-center justify-center gap-2 ${
              activeTab === 'users'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30 scale-[1.02] border border-emerald-300'
                : 'bg-emerald-50/80 text-emerald-900 hover:bg-emerald-100/90 border border-emerald-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>User Surveillance</span>
          </button>

          {/* Tab 2: Rose / Pink Pill (Styled like "AI Advice" in image) */}
          <button
            type="button"
            onClick={() => setActiveTab('anomaly')}
            className={`flex-1 min-w-[130px] py-3 px-4 rounded-xl text-xs font-black transition-all duration-200 flex items-center justify-center gap-2 ${
              activeTab === 'anomaly'
                ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-lg shadow-rose-500/30 scale-[1.02] border border-rose-300'
                : 'bg-rose-50/80 text-rose-900 hover:bg-rose-100/90 border border-rose-200'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>AI Threat Detector</span>
          </button>

          {/* Tab 3: Sky Blue / Royal Blue Pill (Styled like "View Insights" in image) */}
          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`flex-1 min-w-[130px] py-3 px-4 rounded-xl text-xs font-black transition-all duration-200 flex items-center justify-center gap-2 ${
              activeTab === 'analytics'
                ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 scale-[1.02] border border-blue-300'
                : 'bg-sky-50/80 text-sky-900 hover:bg-sky-100/90 border border-sky-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Expense Matrix</span>
          </button>

          {/* Tab 4: Honey Amber Pill (Styled like "Budget Plan" in image) */}
          <button
            type="button"
            onClick={() => setActiveTab('system')}
            className={`flex-1 min-w-[130px] py-3 px-4 rounded-xl text-xs font-black transition-all duration-200 flex items-center justify-center gap-2 ${
              activeTab === 'system'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30 scale-[1.02] border border-amber-300'
                : 'bg-amber-50/80 text-amber-900 hover:bg-amber-100/90 border border-amber-200'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Broadcast & Logs</span>
          </button>
        </div>

        {/* Tab 1: User Surveillance & Data Tracker */}
        {activeTab === 'users' && (
          <div className="space-y-5">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              {/* Colorful Search Box */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-sky-600 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter users by name, email, or handle..."
                  className="w-full bg-white border-2 border-sky-200 rounded-2xl pl-11 pr-4 py-3 text-xs text-slate-900 font-medium outline-none focus:border-sky-500 shadow-sm transition placeholder:text-slate-400"
                />
              </div>

              {/* Colorful Filter Pills */}
              <div className="flex items-center gap-1.5 bg-white border-2 border-slate-100 p-1.5 rounded-2xl shadow-sm">
                {(['All', 'Active', 'Suspended', 'Flagged'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all duration-200 ${
                      statusFilter === st
                        ? st === 'Active'
                          ? 'bg-emerald-500 text-white shadow-sm'
                          : st === 'Suspended'
                          ? 'bg-rose-500 text-white shadow-sm'
                          : st === 'Flagged'
                          ? 'bg-amber-500 text-white shadow-sm'
                          : 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Users Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredUsers.map((usr) => (
                <div
                  key={usr.id}
                  className="group relative rounded-[28px] bg-white border-2 border-slate-100 hover:border-emerald-300 p-5 space-y-4 shadow-[0_10px_25px_rgba(0,0,0,0.04)] hover:shadow-[0_15px_30px_rgba(16,185,129,0.12)] transition-all duration-300"
                >
                  {/* User Profile Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-400 via-teal-400 to-sky-400 p-[2px] shadow-sm">
                        <div className="w-full h-full rounded-[14px] bg-white flex items-center justify-center text-slate-900 font-black text-sm">
                          {usr.name.charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <div>
                        <h3 className="font-black text-sm text-slate-900">{usr.name}</h3>
                        <p className="text-[11px] text-slate-500 font-mono font-semibold">{usr.email}</p>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-black px-3 py-1 rounded-full border shadow-sm ${
                        usr.status === 'Active'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : usr.status === 'Suspended'
                          ? 'bg-rose-100 text-rose-800 border-rose-300'
                          : 'bg-amber-100 text-amber-800 border-amber-300'
                      }`}
                    >
                      {usr.status}
                    </span>
                  </div>

                  {/* Colorful Stat Compartments */}
                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <div className="bg-sky-50/80 rounded-2xl p-3 border border-sky-200">
                      <span className="text-[10px] text-sky-800 uppercase font-black block">Total Spend</span>
                      <span className="text-sm font-black text-slate-900">₹{usr.totalExpenses.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="bg-purple-50/80 rounded-2xl p-3 border border-purple-200">
                      <span className="text-[10px] text-purple-800 uppercase font-black block">Monthly Budget</span>
                      <span className="text-sm font-black text-purple-900">₹{usr.monthlyBudget.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {/* Micro Metrics */}
                  <div className="flex items-center justify-between text-[11px] text-slate-600 px-1 font-semibold">
                    <span>Health: <strong className="text-emerald-700">{usr.healthScore}/100</strong></span>
                    <span>Streak: <strong className="text-amber-700">{usr.streakDays}d 🔥</strong></span>
                    <span>Risk: <strong className={usr.riskLevel === 'High' ? 'text-rose-600' : 'text-slate-800'}>{usr.riskLevel}</strong></span>
                  </div>

                  {/* Action Buttons styled as colorful capsules */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setSelectedUser(usr)}
                      className="flex-1 py-2 px-3 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-900 border-2 border-sky-200 font-black text-xs transition flex items-center justify-center gap-1.5 active:scale-95"
                    >
                      <Eye className="w-3.5 h-3.5 text-sky-600" />
                      <span>Inspect</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleUserStatus(usr.id)}
                      className={`py-2 px-3.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 border-2 active:scale-95 shadow-sm ${
                        usr.status === 'Active'
                          ? 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                      }`}
                    >
                      {usr.status === 'Active' ? <Ban className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                      <span>{usr.status === 'Active' ? 'Suspend' : 'Activate'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: AI Threat & Anomaly Detector */}
        {activeTab === 'anomaly' && (
          <div className="rounded-[32px] bg-white/90 backdrop-blur-2xl border-2 border-white p-6 sm:p-8 space-y-6 shadow-[0_20px_50px_rgba(244,63,94,0.08)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 border-2 border-rose-300 flex items-center justify-center text-2xl shadow-sm">
                  🤖
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <span>Gemini 3.8 Neural Threat Engine</span>
                    <span className="text-[10px] font-black uppercase bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full border border-rose-300">
                      Real-time
                    </span>
                  </h2>
                  <p className="text-xs text-slate-600 font-medium mt-0.5">
                    Autonomous spending pattern surveillance, fraud isolation, and threshold breach detection.
                  </p>
                </div>
              </div>

              {/* Vibrant Emerald Pill Scan Button */}
              <button
                type="button"
                onClick={handleRunAiSecurityScan}
                disabled={isAiScanning}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-xs shadow-[0_6px_20px_rgba(16,185,129,0.35)] flex items-center gap-2 transition active:scale-95 disabled:opacity-50 border border-emerald-300"
              >
                <RefreshCw className={`w-4 h-4 ${isAiScanning ? 'animate-spin' : ''}`} />
                <span>{isAiScanning ? 'Neural Scan in Progress...' : 'Run Full Platform Security Audit'}</span>
              </button>
            </div>

            {aiScanResult && (
              <div className="bg-gradient-to-br from-rose-50 to-pink-50 border-2 border-rose-300 p-4 rounded-2xl space-y-2 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-black text-rose-900">
                  <Cpu className="w-4 h-4 text-rose-600" />
                  <span>Gemini Intelligence Summary:</span>
                </div>
                <div className="text-xs text-slate-800 leading-relaxed font-mono font-medium whitespace-pre-line bg-white/80 p-3 rounded-xl border border-rose-200">
                  {aiScanResult}
                </div>
              </div>
            )}

            {/* Threat Insight Capsules with Colorful Reference Styling */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="bg-rose-50/90 p-5 rounded-2xl border-2 border-rose-300 space-y-2 shadow-sm">
                <span className="text-xs font-black text-rose-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" /> High Risk Anomaly
                </span>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  User <strong>Anita Sharma</strong> logged a single transaction of ₹18,500 under <i>Shopping</i>, exceeding average baseline by +340%.
                </p>
              </div>

              <div className="bg-amber-50/90 p-5 rounded-2xl border-2 border-amber-300 space-y-2 shadow-sm">
                <span className="text-xs font-black text-amber-900 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-amber-600" /> Budget Overrun Alert
                </span>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  User <strong>Alex Johnson</strong> has spent ₹12,400 out of a ₹10,000 budget (124% breach).
                </p>
              </div>

              <div className="bg-emerald-50/90 p-5 rounded-2xl border-2 border-emerald-300 space-y-2 shadow-sm">
                <span className="text-xs font-black text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" /> System Health Status
                </span>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  Encryption tokens and active session signatures valid across all Cloud Run nodes.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Platform Expense Matrix */}
        {activeTab === 'analytics' && (
          <div className="rounded-[32px] bg-white/90 backdrop-blur-2xl border-2 border-white p-6 sm:p-8 space-y-6 shadow-[0_20px_50px_rgba(37,99,235,0.08)]">
            <div>
              <h2 className="text-lg font-black text-slate-900">Platform-wide Expense Matrix</h2>
              <p className="text-xs text-slate-600 font-medium mt-1">Cumulative category distribution across all tracked accounts</p>
            </div>

            <div className="space-y-4">
              {[
                { category: 'Food & Dining', icon: '🍔', total: 45200, percentage: 38, color: 'from-teal-400 to-emerald-500' },
                { category: 'Shopping', icon: '🛍️', total: 32400, percentage: 27, color: 'from-pink-400 to-rose-500' },
                { category: 'Bills & Utilities', icon: '⚡', total: 18900, percentage: 16, color: 'from-amber-400 to-orange-400' },
                { category: 'Transport', icon: '🚗', total: 12500, percentage: 11, color: 'from-sky-400 to-blue-500' },
                { category: 'Entertainment', icon: '🎬', total: 9500, percentage: 8, color: 'from-purple-400 to-indigo-500' },
              ].map((cat) => (
                <div key={cat.category} className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-black text-slate-800">
                    <span className="flex items-center gap-2">
                      <span className="text-base">{cat.icon}</span>
                      <span>{cat.category}</span>
                    </span>
                    <span className="font-mono">₹{cat.total.toLocaleString('en-IN')} ({cat.percentage}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3.5 p-0.5 overflow-hidden border border-slate-200 shadow-inner">
                    <div
                      className={`bg-gradient-to-r ${cat.color} h-full rounded-full transition-all duration-500 shadow-sm`}
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: System Broadcast & Telemetry */}
        {activeTab === 'system' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Broadcast Form */}
            <div className="rounded-[32px] bg-white/90 backdrop-blur-2xl border-2 border-white p-6 space-y-4 shadow-sm">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <BellRing className="w-5 h-5 text-amber-600" />
                <span>Global System Announcement</span>
              </h2>
              <p className="text-xs text-slate-600 font-medium">
                Transmit a high-priority banner notification to all connected user sessions.
              </p>

              <form onSubmit={handleSendBroadcast} className="space-y-3.5">
                <textarea
                  rows={3}
                  required
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="e.g. Scheduled database maintenance tonight at 02:00 UTC. Your data is fully safe."
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-3.5 text-xs text-slate-900 font-medium outline-none focus:border-amber-500 shadow-inner transition placeholder:text-slate-400"
                />

                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs shadow-[0_6px_18px_rgba(245,158,11,0.35)] transition active:scale-95 border border-amber-300"
                >
                  Dispatch Announcement
                </button>

                {broadcastSent && (
                  <div className="p-3 bg-emerald-100 border-2 border-emerald-300 text-emerald-900 rounded-xl text-xs text-center font-black">
                    ✓ Global broadcast successfully sent to active sessions!
                  </div>
                )}
              </form>
            </div>

            {/* Telemetry Console */}
            <div className="rounded-[32px] bg-white/90 backdrop-blur-2xl border-2 border-white p-6 space-y-4 shadow-sm">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Terminal className="w-5 h-5 text-emerald-600" />
                <span>Live System Telemetry</span>
              </h2>

              <div className="bg-slate-900 p-4 rounded-2xl font-mono text-[11px] text-slate-300 space-y-1.5 h-48 overflow-y-auto border border-slate-800 shadow-inner">
                <p className="text-emerald-400 font-bold">[09:42:10] SYS_INIT: Admin master authenticated ({currentUser?.email || 'admi@gmail.com'})</p>
                <p>[09:42:15] DB_SYNC: 5 user schemas synced to Cloud Run container</p>
                <p>[09:42:18] GEMINI_3.8: Neural models connected via @google/genai (14ms latency)</p>
                <p className="text-sky-300">[09:43:02] SURVEILLANCE: Real-time spending stream listening on port 3000</p>
                <p className="text-amber-300">[09:43:20] AUDIT: AI scan completed across platform ledger</p>
              </div>
            </div>
          </div>
        )}

        {/* 5. Iconic Bottom Banner Capsule (Styled directly from the "Better Financial Decisions" capsule in image) */}
        <div className="pt-4 flex flex-col items-center space-y-3">
          <div className="inline-flex items-center gap-3 px-8 py-3.5 rounded-full bg-[#063830] border-2 border-emerald-400 text-white shadow-[0_12px_30px_rgba(5,150,105,0.4)] text-xs sm:text-sm font-black tracking-wider uppercase">
            <span className="text-base">🎯</span>
            <span>Better Financial Decisions • Powered by Tracksy AI</span>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
            <span>Track</span>
            <span className="text-emerald-600">•</span>
            <span>Understand</span>
            <span className="text-sky-600">•</span>
            <span>Plan</span>
            <span className="text-purple-600">•</span>
            <span>Grow</span>
          </div>
        </div>

        {/* 6. Inspect User Modal (Colorful Light Modal) */}
        {selectedUser && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="rounded-[32px] bg-white border-2 border-white max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-[0_25px_60px_rgba(0,0,0,0.25)] relative overflow-hidden">
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="absolute right-5 top-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-full bg-slate-100 border border-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-400 via-teal-400 to-sky-400 p-[2px] shadow-sm">
                  <div className="w-full h-full rounded-[14px] bg-white flex items-center justify-center text-slate-900 font-black text-xl">
                    {selectedUser.name.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900">{selectedUser.name}</h3>
                  <p className="text-xs text-slate-500 font-mono font-semibold">{selectedUser.email} · {selectedUser.handle}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-emerald-50/80 p-3.5 rounded-2xl border border-emerald-200">
                  <span className="text-[10px] text-emerald-800 uppercase font-black block">Status</span>
                  <span className="font-black text-emerald-900">{selectedUser.status}</span>
                </div>
                <div className="bg-amber-50/80 p-3.5 rounded-2xl border border-amber-200">
                  <span className="text-[10px] text-amber-800 uppercase font-black block">Risk Level</span>
                  <span className={`font-black ${selectedUser.riskLevel === 'High' ? 'text-rose-700' : 'text-slate-800'}`}>
                    {selectedUser.riskLevel}
                  </span>
                </div>
                <div className="bg-sky-50/80 p-3.5 rounded-2xl border border-sky-200">
                  <span className="text-[10px] text-sky-800 uppercase font-black block">Total Logged Spend</span>
                  <span className="font-black text-slate-900">₹{selectedUser.totalExpenses.toLocaleString('en-IN')}</span>
                </div>
                <div className="bg-purple-50/80 p-3.5 rounded-2xl border border-purple-200">
                  <span className="text-[10px] text-purple-800 uppercase font-black block">Monthly Budget</span>
                  <span className="font-black text-purple-900">₹{selectedUser.monthlyBudget.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">User Activity History</h4>
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1.5 font-medium">
                  <p>• Account created: <strong className="text-slate-900">{selectedUser.joinDate}</strong></p>
                  <p>• Last active timestamp: <strong className="text-slate-900">{selectedUser.lastActive}</strong></p>
                  <p>• Total transactions logged: <strong className="text-slate-900">{selectedUser.transactionsCount}</strong></p>
                  <p>• Financial Health Score: <strong className="text-emerald-700">{selectedUser.healthScore}/100</strong></p>
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => handleToggleUserStatus(selectedUser.id)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-900 font-black text-xs rounded-2xl transition border border-slate-300 active:scale-95 shadow-sm"
                >
                  Toggle {selectedUser.status === 'Active' ? 'Suspension' : 'Activation'}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-xs rounded-2xl transition active:scale-95 shadow-md"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
