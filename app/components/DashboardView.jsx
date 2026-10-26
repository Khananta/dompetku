"use client";

import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { formatRupiah, getPaymentMethodInfo } from "./utils";
import { Icons } from "./Icons";
import CurrencyRateWidget from "./CurrencyRateWidget";

export default function DashboardView({
  transactions,
  monthlyBudgetLimit,
  isPrivateMode,
  onOpenAddModal,
  onOpenBulkModal,
  onNavigateTab,
  onEditTransaction,
  onDeleteTransaction,
  goals,
  billings,
}) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  const currentMonthName = monthNames[currentMonth];

  // Format tanggal hari ini (Hari, Tanggal Bulan Tahun)
  const formattedToday = useMemo(() => {
    return now.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, []);

  // Transaksi bulan berjalan
  const currentMonthTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const d = new Date(t.created_at);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    });
  }, [transactions, currentYear, currentMonth]);

  const monthIncome = useMemo(() => {
    return currentMonthTransactions
      .filter((t) => t.type === "pemasukan")
      .reduce((sum, t) => sum + Math.round(Number(t.amount)), 0);
  }, [currentMonthTransactions]);

  const monthExpense = useMemo(() => {
    return currentMonthTransactions
      .filter((t) => t.type === "pengeluaran")
      .reduce((sum, t) => sum + Math.round(Number(t.amount)), 0);
  }, [currentMonthTransactions]);

  // Saldo bulan berjalan (uang per bulan)
  const monthBalance = monthIncome - monthExpense;

  const allTimeIncome = useMemo(() => {
    return transactions
      .filter((t) => t.type === "pemasukan")
      .reduce((sum, t) => sum + Math.round(Number(t.amount)), 0);
  }, [transactions]);

  const allTimeExpense = useMemo(() => {
    return transactions
      .filter((t) => t.type === "pengeluaran")
      .reduce((sum, t) => sum + Math.round(Number(t.amount)), 0);
  }, [transactions]);

  const totalBalance = allTimeIncome - allTimeExpense;

  const budgetLimitNum = Number(monthlyBudgetLimit) || 0;
  const budgetUsagePercent = budgetLimitNum > 0 ? Math.min(100, Math.round((monthExpense / budgetLimitNum) * 100)) : 0;
  const isOverBudget = budgetLimitNum > 0 && monthExpense > budgetLimitNum;

  const savingRate = monthIncome > 0 ? Math.round(((monthIncome - monthExpense) / monthIncome) * 100) : 0;

  const monthStatus = useMemo(() => {
    if (monthIncome === 0 && monthExpense === 0) {
      return { label: "Belum Ada Data", color: "text-slate-400", bg: "bg-slate-100" };
    }
    if (monthBalance < 0) {
      return { label: "Defisit Bulan Ini", color: "text-rose-600", bg: "bg-rose-50" };
    }
    if (monthBalance > 0) {
      return { label: "Surplus Bulan Ini", color: "text-emerald-600", bg: "bg-emerald-50" };
    }
    return { label: "Seimbang", color: "text-slate-600", bg: "bg-slate-100" };
  }, [monthIncome, monthExpense, monthBalance]);

  const categoryExpenses = useMemo(() => {
    const expenses = currentMonthTransactions.filter((t) => t.type === "pengeluaran");
    const map = {};
    expenses.forEach((t) => {
      map[t.category] = (map[t.category] || 0) + Math.round(Number(t.amount));
    });
    return Object.entries(map)
      .map(([cat, amount]) => ({
        category: cat,
        amount,
        percentage: monthExpense > 0 ? Math.round((amount / monthExpense) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [currentMonthTransactions, monthExpense]);

  const moneyFlowData = useMemo(() => {
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      const y = d.getFullYear();
      const m = d.getMonth();
      const label = monthNames[m].substring(0, 3);

      const mTransactions = transactions.filter((t) => {
        const td = new Date(t.created_at);
        return td.getFullYear() === y && td.getMonth() === m;
      });

      const inc = mTransactions
        .filter((t) => t.type === "pemasukan")
        .reduce((s, t) => s + Math.round(Number(t.amount)), 0);

      const exp = mTransactions
        .filter((t) => t.type === "pengeluaran")
        .reduce((s, t) => s + Math.round(Number(t.amount)), 0);

      data.push({
        name: label,
        Pemasukan: inc,
        Pengeluaran: exp,
      });
    }
    return data;
  }, [transactions, currentYear, currentMonth]);

  const recentTransactions = useMemo(() => {
    return [...transactions].slice(0, 10);
  }, [transactions]);

  // Helper pengelompokan tanggal untuk transaksi terbaru
  const formatGroupDate = (dateStr) => {
    if (!dateStr) return "Tanggal Tidak Diketahui";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "Tanggal Tidak Diketahui";
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const isTodayDate = (dateStr) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const today = new Date();
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  };

  const isYesterdayDate = (dateStr) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const yest = new Date();
    yest.setDate(yest.getDate() - 1);
    return (
      d.getDate() === yest.getDate() &&
      d.getMonth() === yest.getMonth() &&
      d.getFullYear() === yest.getFullYear()
    );
  };

  const groupedRecentTransactions = useMemo(() => {
    const groups = [];
    const groupMap = new Map();

    recentTransactions.forEach((tx) => {
      const rawDate = tx.created_at || tx.date;
      const dateKey = formatGroupDate(rawDate);

      if (!groupMap.has(dateKey)) {
        const group = {
          dateKey,
          rawDate,
          items: [],
        };
        groupMap.set(dateKey, group);
        groups.push(group);
      }
      groupMap.get(dateKey).items.push(tx);
    });

    return groups;
  }, [recentTransactions]);

  const pendingBillings = useMemo(() => {
    return [...billings]
      .filter((b) => b.status !== "lunas")
      .sort((a, b) => {
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date) - new Date(b.due_date);
      })
      .slice(0, 3);
  }, [billings]);

  const activeGoals = useMemo(() => {
    return [...goals]
      .sort((a, b) => {
        const pctA = (Number(a.current_amount) || 0) / (Number(a.target_amount) || 1);
        const pctB = (Number(b.current_amount) || 0) / (Number(b.target_amount) || 1);
        if (pctA >= 1 && pctB < 1) return 1;
        if (pctA < 1 && pctB >= 1) return -1;
        return pctB - pctA;
      })
      .slice(0, 3);
  }, [goals]);

  // Helper badge deadline tabungan
  const getGoalDueBadge = (targetDate, isCompleted) => {
    if (isCompleted) {
      return { label: "Tercapai! 🎉", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    }
    if (!targetDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(targetDate);
    due.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { label: `Lewat ${Math.abs(diffDays)}h`, color: "bg-rose-50 text-rose-700 border-rose-200" };
    if (diffDays === 0) return { label: "Hari ini", color: "bg-amber-50 text-amber-700 border-amber-200" };
    if (diffDays <= 7) return { label: `H-${diffDays}`, color: "bg-amber-50 text-amber-700 border-amber-200" };
    return { label: `H-${diffDays}`, color: "bg-slate-100 text-slate-600 border-slate-200" };
  };

  // Helper badge jatuh tempo tagihan
  const getBillDueInfo = (dueDate) => {
    if (!dueDate) return { label: "Tanpa tempo", color: "bg-slate-100 text-slate-500 border-slate-200", date: "-" };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
    const formattedDate = due.toLocaleDateString("id-ID", { day: "numeric", month: "short" });

    if (diffDays < 0) {
      return {
        label: `Lewat ${Math.abs(diffDays)}h`,
        color: "bg-rose-50 text-rose-700 border-rose-200 font-semibold",
        date: formattedDate,
      };
    }
    if (diffDays === 0) {
      return {
        label: "Hari ini",
        color: "bg-amber-50 text-amber-800 border-amber-300 font-bold",
        date: formattedDate,
      };
    }
    if (diffDays <= 3) {
      return {
        label: `H-${diffDays}`,
        color: "bg-amber-50 text-amber-700 border-amber-200 font-medium",
        date: formattedDate,
      };
    }
    return {
      label: `H-${diffDays}`,
      color: "bg-slate-100 text-slate-600 border-slate-200",
      date: formattedDate,
    };
  };

  const getBillTypeInfo = (type) => {
    if (type === "hutang") {
      return { label: "Hutang", color: "bg-amber-50 text-amber-700 border-amber-200" };
    }
    if (type === "piutang") {
      return { label: "Piutang", color: "bg-teal-50 text-teal-700 border-teal-200" };
    }
    return { label: "Tagihan", color: "bg-rose-50 text-rose-700 border-rose-200" };
  };

  return (
    <div className="space-y-6">
      {/* ========================================================
      // 0. TANGGAL HARI INI (MEDIUM TEXT)
      // ======================================================== */}
      <div className="flex items-center gap-2 px-1">
        <Icons.Calendar className="w-4 h-4 text-emerald-600" />
        <p className="text-sm sm:text-base font-medium text-slate-700 capitalize">
          {formattedToday}
        </p>
      </div>

      {/* ========================================================
      // 1. STATS CARDS ROW
      // ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card Saldo Bulan Ini (Uang Per Bulan) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Saldo Bulan Ini</span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              monthBalance < 0 ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
            }`}>
              <Icons.Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className={`text-2xl font-bold tracking-tight ${monthBalance < 0 ? "text-rose-600" : "text-slate-900"}`}>
              {formatRupiah(monthBalance, isPrivateMode)}
            </h2>
            <div className="mt-2 flex items-center gap-2">
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${monthStatus.bg} ${monthStatus.color}`}>
                {monthStatus.label}
              </span>
            </div>
          </div>
        </div>

        {/* Card Pemasukan */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Pemasukan</span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Icons.TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              {formatRupiah(monthIncome, isPrivateMode)}
            </h2>
            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
              <span className="text-teal-600 font-semibold">
                {currentMonthTransactions.filter((t) => t.type === "pemasukan").length} Transaksi
              </span>
              <span>masuk bulan ini</span>
            </div>
          </div>
        </div>

        {/* Card Pengeluaran */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Pengeluaran</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Icons.TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              {formatRupiah(monthExpense, isPrivateMode)}
            </h2>
            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
              <span className="text-rose-600 font-semibold">
                {currentMonthTransactions.filter((t) => t.type === "pengeluaran").length} Transaksi
              </span>
              <span>keluar bulan ini</span>
            </div>
          </div>
        </div>

        {/* Card Batas Anggaran Bulanan */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Batas Anggaran</span>
            <button
              onClick={() => onNavigateTab("settings")}
              className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700"
            >
              Atur Limit
            </button>
          </div>

          {budgetLimitNum > 0 ? (
            <div className="mt-3">
              <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-base font-bold text-slate-900">
                  {budgetUsagePercent}%
                </span>
                <span className="text-[11px] text-slate-400">
                  dari {formatRupiah(budgetLimitNum, isPrivateMode)}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isOverBudget
                      ? "bg-rose-500"
                      : budgetUsagePercent > 80
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                  }`}
                  style={{ width: `${Math.min(100, budgetUsagePercent)}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-2">
                {isOverBudget ? (
                  <span className="text-rose-600 font-semibold">Perhatian: Melebihi batas anggaran!</span>
                ) : (
                  `Tersisa ${formatRupiah(Math.max(0, budgetLimitNum - monthExpense), isPrivateMode)}`
                )}
              </p>
            </div>
          ) : (
            <>
              <p className="text-xs text-slate-400 my-auto py-2.5">Belum ada limit bulanan</p>
              <div>
                <button
                  onClick={() => onNavigateTab("settings")}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-95 text-white text-xs font-medium rounded-full shadow-xs hover:shadow transition cursor-pointer"
                >
                  <Icons.Plus className="w-3.5 h-3.5" />
                  <span>Pasang Limit</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ========================================================
      // 2. MIDDLE CHARTS & ANALYSIS
      // ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Money Flow Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Arus Kas Keuangan</h3>
              <p className="text-xs text-slate-400">Pemasukan vs Pengeluaran 6 Bulan Terakhir</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-slate-500">
                <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-b from-emerald-400 to-emerald-600" /> Pemasukan
              </span>
              <span className="flex items-center gap-1.5 text-slate-500">
                <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-b from-rose-400 to-rose-600" /> Pengeluaran
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={moneyFlowData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barGap={6}>
                <defs>
                  <linearGradient id="pemasukanGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#047857" />
                  </linearGradient>
                  <linearGradient id="pengeluaranGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fb7185" />
                    <stop offset="100%" stopColor="#e11d48" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => {
                    if (val >= 1000000) return `${(val / 1000000).toFixed(0)}jt`;
                    if (val >= 1000) return `${(val / 1000).toFixed(0)}rb`;
                    return val;
                  }}
                />
                <Tooltip
                  cursor={{ fill: "#f8fafc" }}
                  formatter={(value) => [formatRupiah(value, isPrivateMode), ""]}
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="Pemasukan" fill="url(#pemasukanGradient)" radius={[10, 10, 10, 10]} barSize={20} />
                <Bar dataKey="Pengeluaran" fill="url(#pengeluaranGradient)" radius={[10, 10, 10, 10]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Kategori Pengeluaran */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Pengeluaran per Kategori</h3>
              <p className="text-xs text-slate-400">{currentMonthName} {currentYear}</p>
            </div>
            <button
              onClick={() => onNavigateTab("pengeluaran")}
              className="px-3 py-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-95 text-white text-xs font-medium rounded-full shadow-xs hover:shadow transition cursor-pointer"
            >
              Rekap Lengkap
            </button>
          </div>

          <div className="space-y-2.5 flex-1 overflow-y-auto max-h-56 pr-1">
            {categoryExpenses.length > 0 ? (
              categoryExpenses.map((cat, idx) => {
                // Color theme berdasarkan ranking alokasi pengeluaran
                const colorThemes = [
                  { badge: "bg-rose-50 text-rose-600", gradient: "from-rose-500 to-pink-500" },
                  { badge: "bg-amber-50 text-amber-700", gradient: "from-amber-500 to-orange-400" },
                  { badge: "bg-indigo-50 text-indigo-600", gradient: "from-indigo-500 to-blue-500" },
                  { badge: "bg-emerald-50 text-emerald-700", gradient: "from-emerald-500 to-teal-400" },
                ];
                const theme = colorThemes[idx] || colorThemes[3];

                return (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-50/70 hover:bg-slate-50 border border-slate-100 transition-all space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${theme.badge}`}>
                          #{idx + 1}
                        </span>
                        <span className="font-bold text-slate-800 truncate">{cat.category}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-bold text-slate-900 mr-1.5">
                          {formatRupiah(cat.amount, isPrivateMode)}
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${theme.badge}`}>
                          {cat.percentage}%
                        </span>
                      </div>
                    </div>
                    {/* Modern Pill Progress Bar dengan Gradient */}
                    <div className="w-full h-2 rounded-full bg-slate-200/60 overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${theme.gradient} transition-all duration-500`}
                        style={{ width: `${Math.max(4, cat.percentage)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                  <Icons.Tag className="w-5 h-5" />
                </div>
                <p className="text-xs font-normal">Belum ada pengeluaran di bulan ini.</p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-slate-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Tingkat Tabungan:</span>
            </div>
            <span className={`font-bold px-2.5 py-0.5 rounded-full text-xs ${
              savingRate >= 20 ? "bg-emerald-50 text-emerald-700" : savingRate > 0 ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"
            }`}>
              {savingRate}%
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================
      // 3. BOTTOM ROW: TRANSAKSI TERBARU & WIDGETS
      // ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Transaksi Terbaru */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Transaksi Terbaru</h3>
                <p className="text-xs text-slate-400">Mutasi keuangan terkini</p>
              </div>
              <div>
                <button
                  onClick={() => onNavigateTab("pengeluaran")}
                  className="px-3.5 py-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-95 text-white text-xs font-medium rounded-full shadow-xs hover:shadow transition cursor-pointer"
                >
                  Rekap Pengeluaran
                </button>
              </div>
            </div>

            {recentTransactions.length > 0 ? (
              <div className="space-y-4">
                {groupedRecentTransactions.map((group) => {
                  const isToday = isTodayDate(group.rawDate);
                  const isYesterday = isYesterdayDate(group.rawDate);

                  return (
                    <div key={group.dateKey} className="space-y-1">
                      {/* Tanda Pengelompokan Tanggal */}
                      <div className="flex items-center gap-2 pt-2.5 pb-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                        <h4 className="text-xs font-bold text-slate-700 tracking-tight">
                          {group.dateKey}
                        </h4>
                        {isToday && (
                          <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                            Hari Ini
                          </span>
                        )}
                        {isYesterday && (
                          <span className="text-[10px] font-medium px-2 py-0.2 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                            Kemarin
                          </span>
                        )}
                        <div className="h-px bg-slate-100 flex-1 ml-1" />
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {group.items.length} transaksi
                        </span>
                      </div>

                      {/* Daftar Transaksi dalam Tanggal Tersebut */}
                      <div className="divide-y divide-slate-100">
                        {group.items.map((tx) => {
                          const isExpense = tx.type === "pengeluaran";
                          const txDate = new Date(tx.created_at || tx.date);
                          const formattedTime = txDate.toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          });

                          return (
                            <div
                              key={tx.id}
                              className="py-2.5 flex items-center justify-between gap-3 group hover:bg-slate-50/70 px-2 rounded-xl transition"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div
                                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                    isExpense
                                      ? "bg-rose-50 text-rose-600"
                                      : "bg-emerald-50 text-emerald-600"
                                  }`}
                                >
                                  {isExpense ? (
                                    <Icons.TrendingDown className="w-4 h-4" />
                                  ) : (
                                    <Icons.TrendingUp className="w-4 h-4" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <p className="text-xs font-semibold text-slate-800 truncate">
                                      {tx.note || tx.category}
                                    </p>
                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 shrink-0">
                                      {tx.category}
                                    </span>
                                    <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border shrink-0 ${getPaymentMethodInfo(tx.payment_method).bg}`}>
                                      {getPaymentMethodInfo(tx.payment_method).short}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-400">
                                    Pukul {formattedTime}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 shrink-0">
                                <span
                                  className={`text-xs font-bold ${
                                    isExpense ? "text-slate-800" : "text-emerald-600"
                                  }`}
                                >
                                  {isExpense ? "-" : "+"}
                                  {formatRupiah(tx.amount, isPrivateMode)}
                                </span>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => onEditTransaction(tx)}
                                    title="Edit"
                                    className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-slate-100 rounded transition cursor-pointer"
                                  >
                                    <Icons.Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => onDeleteTransaction(tx.id)}
                                    title="Hapus"
                                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded transition cursor-pointer"
                                  >
                                    <Icons.Trash className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400">
                <div className="w-10 h-10 mx-auto rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                  <Icons.Receipt className="w-5 h-5" />
                </div>
                <p className="text-xs mt-2">Belum ada transaksi yang tercatat.</p>
                <button
                  onClick={onOpenAddModal}
                  className="mt-3 text-xs font-medium text-emerald-600 hover:underline"
                >
                  Mulai Catat Transaksi Sekarang
                </button>
              </div>
            )}
          </div>

          {recentTransactions.length > 0 && (
            <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 px-1">
              <span>
                Menampilkan <strong className="text-slate-700 font-semibold">{recentTransactions.length}</strong> transaksi terbaru
              </span>
              <button
                onClick={() => onNavigateTab("pengeluaran")}
                className="px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-95 text-white text-xs font-semibold rounded-full shadow-xs hover:shadow transition cursor-pointer"
              >
                Lihat Semua
              </button>
            </div>
          )}
        </div>

        {/* Shortcuts Widget */}
        <div className="space-y-4">
          {/* Widget Kurs & Konversi Mata Uang */}
          <CurrencyRateWidget />

          {/* Target Tabungan Widget */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-3.5">
              <div>
                <h4 className="text-xs font-semibold text-slate-900 leading-tight">Target Tabungan</h4>
                <p className="text-[10px] text-slate-400">Progres impian finansial</p>
              </div>
              <button
                onClick={() => onNavigateTab("saving-goals")}
                className="px-3 py-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-95 text-white text-[11px] font-medium rounded-full shadow-xs hover:shadow transition cursor-pointer"
              >
                Buka
              </button>
            </div>
            {activeGoals.length > 0 ? (
              <div className="space-y-2.5">
                {activeGoals.map((g) => {
                  const cur = Number(g.current_amount) || 0;
                  const tgt = Number(g.target_amount) || 1;
                  const pct = Math.min(100, Math.round((cur / tgt) * 100));
                  const remaining = Math.max(0, tgt - cur);
                  const isCompleted = cur >= tgt;
                  const dueBadge = getGoalDueBadge(g.target_date, isCompleted);

                  return (
                    <div
                      key={g.id}
                      className="p-3 bg-slate-50/80 hover:bg-slate-100/70 rounded-xl border border-slate-100 transition space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-xs font-semibold text-slate-800 truncate">
                            {g.goal_name}
                          </span>
                          {dueBadge && (
                            <span className={`text-[10px] font-medium px-1.5 py-0.2 rounded border shrink-0 ${dueBadge.color}`}>
                              {dueBadge.label}
                            </span>
                          )}
                        </div>
                        <span className={`text-xs font-bold shrink-0 ${isCompleted ? "text-emerald-600" : "text-emerald-700"}`}>
                          {pct}%
                        </span>
                      </div>

                      {/* Capsule Progress Bar */}
                      <div className="w-full h-2 rounded-full bg-slate-200/80 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isCompleted
                              ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                              : "bg-gradient-to-r from-emerald-500 to-teal-600"
                          }`}
                          style={{ width: `${Math.max(pct, isCompleted ? 100 : 3)}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                        <span>
                          Terkumpul: <b className="text-slate-700">{formatRupiah(cur, isPrivateMode)}</b>
                        </span>
                        <span>
                          {isCompleted ? (
                            <span className="text-emerald-600 font-semibold">Tercapai</span>
                          ) : (
                            <>Sisa: <b className="text-slate-600">{formatRupiah(remaining, isPrivateMode)}</b></>
                          )}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-6 flex flex-col items-center justify-center text-center text-slate-400">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                  <Icons.Target className="w-5 h-5 text-emerald-600/70" />
                </div>
                <p className="text-xs font-normal">Belum ada target tabungan aktif.</p>
              </div>
            )}
          </div>

          {/* Pengingat Tagihan Widget */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-3.5">
              <div>
                <h4 className="text-xs font-semibold text-slate-900 leading-tight">Pengingat Tagihan</h4>
                <p className="text-[10px] text-slate-400">Jatuh tempo terdekat</p>
              </div>
              <button
                onClick={() => onNavigateTab("billing-reminder")}
                className="px-3 py-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-95 text-white text-[11px] font-medium rounded-full shadow-xs hover:shadow transition cursor-pointer"
              >
                Buka
              </button>
            </div>
            {pendingBillings.length > 0 ? (
              <div className="space-y-2.5">
                {pendingBillings.map((b) => {
                  const dueInfo = getBillDueInfo(b.due_date);
                  const typeInfo = getBillTypeInfo(b.billing_type);
                  const isPiutang = b.billing_type === "piutang";

                  return (
                    <div
                      key={b.id}
                      className="p-3 bg-slate-50/80 hover:bg-slate-100/70 rounded-xl border border-slate-100 transition space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border shrink-0 ${typeInfo.color}`}>
                            {typeInfo.label}
                          </span>
                          <span className="text-xs font-semibold text-slate-800 truncate">
                            {b.bill_name}
                          </span>
                          {b.person_name && (
                            <span className="text-[10px] text-slate-400 truncate shrink-0">
                              ({b.person_name})
                            </span>
                          )}
                        </div>
                        <span
                          className={`text-xs font-bold shrink-0 ${
                            isPiutang ? "text-emerald-600" : "text-rose-600"
                          }`}
                        >
                          {isPiutang ? "+" : "-"}
                          {formatRupiah(b.amount, isPrivateMode)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                        <div className="flex items-center gap-1.5">
                          <Icons.Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>Tempo: <span className="text-slate-600 font-medium">{dueInfo.date}</span></span>
                        </div>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${dueInfo.color}`}>
                          {dueInfo.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-6 flex flex-col items-center justify-center text-center text-slate-400">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                  <Icons.Bell className="w-5 h-5 text-rose-500/70" />
                </div>
                <p className="text-xs font-normal">Semua tagihan telah lunas!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
