"use client";

import React, { useState, useMemo } from "react";
import { formatRupiah } from "./utils";
import { Icons } from "./Icons";

export default function SavingGoalsView({
  goals,
  isPrivateMode,
  onOpenNewGoalModal,
  onEditGoal,
  onOpenDepositModal,
  onDeleteGoal,
  onDeleteDeposit,
}) {
  const [filter, setFilter] = useState("progress"); // "progress" | "selesai" | "semua"
  const [selectedGoalDetailId, setSelectedGoalDetailId] = useState(null);

  // Ambil goal yang sedang dipilih untuk detail riwayat nabung
  const selectedGoalDetail = useMemo(() => {
    if (!selectedGoalDetailId) return null;
    return goals.find((g) => g.id === selectedGoalDetailId) || null;
  }, [goals, selectedGoalDetailId]);

  // Ringkasan 3 Kategori yang Jelas & Informatif
  const totalTarget = useMemo(() => {
    return goals.reduce((sum, g) => sum + (Number(g.target_amount) || 0), 0);
  }, [goals]);

  const totalCollected = useMemo(() => {
    return goals.reduce((sum, g) => sum + (Number(g.current_amount) || 0), 0);
  }, [goals]);

  const remainingTotal = Math.max(0, totalTarget - totalCollected);
  const overallProgress = totalTarget > 0 ? Math.min(100, Math.round((totalCollected / totalTarget) * 100)) : 0;

  const inProgressGoals = useMemo(() => {
    return goals.filter((g) => (Number(g.current_amount) || 0) < (Number(g.target_amount) || 0));
  }, [goals]);

  const filteredGoals = useMemo(() => {
    return goals.filter((g) => {
      const isCompleted = (Number(g.current_amount) || 0) >= (Number(g.target_amount) || 0);
      if (filter === "progress") return !isCompleted;
      if (filter === "selesai") return isCompleted;
      return true;
    });
  }, [goals, filter]);

  // Due date / deadline badge calculation
  const getGoalDueBadge = (targetDate, isCompleted) => {
    if (isCompleted) {
      return {
        label: "Target Tercapai",
        color: "bg-emerald-50 text-emerald-700 border-emerald-200",
      };
    }

    if (!targetDate) {
      return {
        label: "Tanpa Batas",
        color: "bg-slate-100 text-slate-600 border-slate-200",
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(targetDate);
    due.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        label: `Terlewat ${Math.abs(diffDays)} Hari`,
        color: "bg-rose-50 text-rose-700 border-rose-200",
      };
    }
    if (diffDays === 0) {
      return {
        label: "Batas Hari Ini",
        color: "bg-amber-50 text-amber-700 border-amber-200",
      };
    }
    if (diffDays <= 7) {
      return {
        label: `H-${diffDays} Segera`,
        color: "bg-amber-50 text-amber-700 border-amber-200",
      };
    }
    return {
      label: `H-${diffDays}`,
      color: "bg-slate-100 text-slate-600 border-slate-200",
    };
  };

  // Helper riwayat setoran
  const getGoalDeposits = (goal) => {
    if (!goal) return [];
    if (Array.isArray(goal.deposits) && goal.deposits.length > 0) {
      return goal.deposits;
    }
    if ((Number(goal.current_amount) || 0) > 0) {
      return [
        {
          id: `init-${goal.id}`,
          amount: goal.current_amount,
          date: goal.created_at ? goal.created_at.split("T")[0] : new Date().toISOString().split("T")[0],
          time: "09:00",
          created_at: goal.created_at || new Date().toISOString(),
          note: "Setoran Awal Tabungan",
        },
      ];
    }
    return [];
  };

  // Helper pengelompokan tanggal
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

  const groupedDeposits = useMemo(() => {
    if (!selectedGoalDetail) return [];
    const deposits = getGoalDeposits(selectedGoalDetail);
    const groups = [];
    const groupMap = new Map();

    deposits.forEach((dep) => {
      const rawDate = dep.created_at || dep.date;
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
      groupMap.get(dateKey).items.push(dep);
    });

    return groups;
  }, [selectedGoalDetail]);

  // ========================================================
  // JIKA SEDANG MELIHAT DETAIL RIWAYAT NABUNG SPESIFIK
  // ========================================================
  if (selectedGoalDetail) {
    const current = Number(selectedGoalDetail.current_amount) || 0;
    const target = Number(selectedGoalDetail.target_amount) || 1;
    const percent = Math.min(100, Math.round((current / target) * 100));
    const isCompleted = current >= target;
    const remaining = Math.max(0, target - current);
    const dueInfo = getGoalDueBadge(selectedGoalDetail.target_date, isCompleted);
    const depositsList = getGoalDeposits(selectedGoalDetail);

    return (
      <div className="space-y-6">
        {/* Navigation & Action Bar Atas */}
        <div className="flex items-center justify-between gap-2 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <button
            type="button"
            onClick={() => setSelectedGoalDetailId(null)}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 flex items-center justify-center transition cursor-pointer shrink-0"
            title="Kembali ke Daftar Target"
          >
            <Icons.ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={() => onEditGoal(selectedGoalDetail)}
              className="inline-flex items-center gap-1 sm:gap-1.5 px-3 sm:px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 rounded-full text-xs font-semibold transition cursor-pointer"
            >
              <Icons.Edit className="w-3.5 h-3.5" />
              <span>Edit Target</span>
            </button>
            <button
              onClick={() => onOpenDepositModal(selectedGoalDetail)}
              className="inline-flex items-center gap-1 px-3 sm:px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-95 text-white rounded-full text-xs font-semibold transition shadow-xs hover:shadow cursor-pointer whitespace-nowrap"
            >
              <span>+ Setor Dana</span>
            </button>
          </div>
        </div>

        {/* Ringkasan Target Tabungan ini */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Detail Target Tabungan
              </span>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                {selectedGoalDetail.goal_name}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${dueInfo.color}`}>
                {dueInfo.label}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                Tenggat: <strong className="text-slate-700 font-semibold">{selectedGoalDetail.target_date || "Fleksibel"}</strong>
              </span>
            </div>
          </div>

          {/* Baris Nominal & Progres */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* 1. Dana Terkumpul */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Dana Terkumpul</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Icons.Wallet className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2.5">
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                  {formatRupiah(current, isPrivateMode)}
                </h3>
                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
                  <span className="text-emerald-600 font-semibold">{percent}% tercapai</span>
                  <span>dari target</span>
                </div>
              </div>
            </div>

            {/* 2. Total Target */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Total Target</span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Icons.Target className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2.5">
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                  {formatRupiah(target, isPrivateMode)}
                </h3>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Sasaran anggaran impian
                </span>
              </div>
            </div>

            {/* 3. Sisa Kekurangan */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Sisa Kekurangan</span>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  isCompleted ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                }`}>
                  <Icons.TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2.5">
                <h3 className={`text-xl font-bold tracking-tight ${isCompleted ? "text-emerald-600" : "text-amber-600"}`}>
                  {isCompleted ? "Tercapai Penuh 🎉" : formatRupiah(remaining, isPrivateMode)}
                </h3>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  {isCompleted ? "Target telah sukses dipenuhi" : `Kurang ${(100 - percent)}% lagi untuk capai target`}
                </span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5 pt-1">
            <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 transition-all duration-500"
                style={{ width: `${percent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Progres Pencapaian</span>
              <strong className="text-emerald-700 font-bold">{percent}%</strong>
            </div>
          </div>
        </div>

        {/* Card Rekapitulasi Riwayat Setoran (Identik dengan Rekapitulasi Pengeluaran) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3.5 border-b border-slate-100 mb-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Rekapitulasi Riwayat Setoran</h3>
                <p className="text-xs text-slate-400">Mutasi tabungan masuk terkelompok berdasarkan tanggal</p>
              </div>
              <span className="text-xs font-semibold px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 self-start sm:self-auto">
                {depositsList.length} catatan setoran
              </span>
            </div>

            {depositsList.length > 0 ? (
              <div className="space-y-4 pt-1">
                {groupedDeposits.map((group) => {
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
                          {group.items.length} transaksi setoran
                        </span>
                      </div>

                      {/* Daftar Transaksi dalam Tanggal Tersebut */}
                      <div className="divide-y divide-slate-100">
                        {group.items.map((dep) => {
                          const depDate = new Date(dep.created_at || dep.date);
                          const formattedTime = dep.time || depDate.toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          });

                          return (
                            <div
                              key={dep.id}
                              className="py-2.5 flex items-center justify-between gap-3 group hover:bg-slate-50/70 px-2 rounded-xl transition"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-emerald-50 text-emerald-600">
                                  <Icons.TrendingUp className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <p className="text-xs font-semibold text-slate-800 truncate">
                                      {dep.note || "Setoran Tabungan"}
                                    </p>
                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-100 shrink-0">
                                      Setoran
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-400 mt-1 sm:mt-0.5">
                                    Pukul {formattedTime}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 shrink-0">
                                <span className="text-xs font-bold text-emerald-600">
                                  +{formatRupiah(dep.amount, isPrivateMode)}
                                </span>
                                {onDeleteDeposit && !String(dep.id).startsWith("init-") && (
                                  <button
                                    onClick={() => onDeleteDeposit(selectedGoalDetail.id, dep.id)}
                                    title="Hapus Catatan Setoran Ini"
                                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded transition cursor-pointer"
                                  >
                                    <Icons.Trash className="w-3.5 h-3.5" />
                                  </button>
                                )}
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
              <div className="py-10 text-center text-slate-400">
                <div className="w-10 h-10 mx-auto rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                  <Icons.Receipt className="w-5 h-5" />
                </div>
                <p className="text-xs mt-2 font-medium text-slate-600">Belum ada riwayat setoran dana.</p>
                <button
                  onClick={() => onOpenDepositModal(selectedGoalDetail)}
                  className="mt-3 text-xs font-semibold text-emerald-600 hover:underline cursor-pointer"
                >
                  Mulai Setor Tabungan Pertama Sekarang
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ========================================================
  // TAMPILAN UTAMA DAFTAR TARGET TABUNGAN
  // ========================================================
  return (
    <div className="space-y-6">
      {/* ========================================================
      // 1. TOP 3 STATS CARDS (KONSISTEN DENGAN DASHBOARD & PENGELUARAN)
      // ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Dana Terkumpul */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Dana Terkumpul</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Icons.Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              {formatRupiah(totalCollected, isPrivateMode)}
            </h2>
            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
              <span className="text-emerald-600 font-semibold">
                {overallProgress}% tercapai
              </span>
              <span>• {inProgressGoals.length} pos sedang berjalan</span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Target */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Target</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Icons.Target className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              {formatRupiah(totalTarget, isPrivateMode)}
            </h2>
            <div className="mt-2 text-[11px] text-slate-400">
              Akumulasi dari {goals.length} target tabungan
            </div>
          </div>
        </div>

        {/* Card 3: Sisa Kekurangan */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Sisa Kekurangan</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Icons.TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl font-bold tracking-tight text-amber-600">
              {formatRupiah(remainingTotal, isPrivateMode)}
            </h2>
            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
              <span className="text-amber-600 font-semibold">
                Kurang {100 - overallProgress}%
              </span>
              <span>dari total rencana anggaran</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
      // 2. TOOLBAR FILTER (HANYA SEDANG BERJALAN & TERCAPAI)
      // ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        {/* Status Filter Tabs (Sedang Berjalan & Tercapai) - Full Width Mengikuti Container di Mobile */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-full text-xs font-medium w-full sm:w-auto text-center">
          <button
            type="button"
            onClick={() => setFilter("progress")}
            className={`py-2 px-4 rounded-full transition-all active:scale-95 cursor-pointer text-center ${
              filter === "progress"
                ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Sedang Berjalan
          </button>
          <button
            type="button"
            onClick={() => setFilter("selesai")}
            className={`py-2 px-4 rounded-full transition-all active:scale-95 cursor-pointer text-center ${
              filter === "selesai"
                ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Tercapai
          </button>
        </div>

        {/* Tombol + Target Baru - Full Width Mengikuti Container di Mobile */}
        <div className="w-full sm:w-auto">
          <button
            type="button"
            onClick={onOpenNewGoalModal}
            className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-95 text-white rounded-full text-xs font-semibold transition shadow-xs hover:shadow cursor-pointer text-center"
          >
            <span>+ Target Baru</span>
          </button>
        </div>
      </div>

      {/* ========================================================
      // 3. DAFTAR TARGET TABUNGAN (CLICKABLE CARDS KE RIWAYAT NABUNG)
      // ======================================================== */}
      {filteredGoals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGoals.map((goal) => {
            const current = Number(goal.current_amount) || 0;
            const target = Number(goal.target_amount) || 1;
            const percent = Math.min(100, Math.round((current / target) * 100));
            const isCompleted = current >= target;
            const remaining = Math.max(0, target - current);
            const dueInfo = getGoalDueBadge(goal.target_date, isCompleted);
            const depositsCount = (goal.deposits || []).length || (current > 0 ? 1 : 0);

            return (
              <div
                key={goal.id}
                onClick={() => setSelectedGoalDetailId(goal.id)}
                title="Klik untuk melihat riwayat setoran tabungan"
                className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4 hover:border-emerald-400 hover:shadow-md transition cursor-pointer group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                          Target Tabungan
                        </span>
                        <span className="text-[9px] font-bold px-1.5 py-0.2 bg-slate-100 text-slate-500 rounded-md">
                          {depositsCount}x setor
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 mt-0.5 truncate group-hover:text-emerald-700 transition">
                        {goal.goal_name}
                      </h4>
                    </div>

                    {/* Menu Edit & Hapus */}
                    <div
                      className="flex items-center gap-1 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => onEditGoal(goal)}
                        title="Edit Target Tabungan"
                        className="text-slate-400 hover:text-emerald-600 p-1.5 rounded-lg hover:bg-slate-100 active:scale-95 transition cursor-pointer"
                      >
                        <Icons.Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteGoal(goal.id)}
                        title="Hapus Target"
                        className="text-slate-400 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-50 active:scale-95 transition cursor-pointer"
                      >
                        <Icons.Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Nominal Terkumpul & Due Badge */}
                  <div className="mt-3 flex items-baseline justify-between">
                    <div>
                      <span className="text-lg font-bold text-slate-900">
                        {formatRupiah(current, isPrivateMode)}
                      </span>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        Target: {formatRupiah(target, isPrivateMode)}
                      </span>
                    </div>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${dueInfo.color}`}>
                      {dueInfo.label}
                    </span>
                  </div>

                  {/* Progress Bar & Persentase */}
                  <div className="mt-4 space-y-1.5">
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isCompleted ? "bg-emerald-500" : "bg-gradient-to-r from-emerald-500 to-teal-600"
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                      <span>Progres: <strong className="text-slate-700 font-semibold">{percent}%</strong></span>
                      <span>Target: <strong className="text-slate-600 font-medium">{goal.target_date || "Fleksibel"}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Bottom Action & Hint */}
                <div
                  className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="text-[10px] text-slate-400">
                    {isCompleted
                      ? "Target tabungan tercapai penuh 🎉"
                      : `Kurang ${formatRupiah(remaining, isPrivateMode)}`}
                  </span>

                  {!isCompleted && (
                    <button
                      type="button"
                      onClick={() => onOpenDepositModal(goal)}
                      className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-95 text-white text-xs font-semibold rounded-full transition flex items-center gap-1 shadow-xs hover:shadow cursor-pointer shrink-0"
                    >
                      <Icons.Plus className="w-3.5 h-3.5" />
                      <span>Setor Dana</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-400">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-2">
            <Icons.Target className="w-6 h-6" />
          </div>
          <p className="text-sm font-medium text-slate-700 mt-2">Belum ada target tabungan pada filter ini</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Mulai alokasikan dana untuk tabungan liburan, dana darurat, gadget, atau kebutuhan masa depan lainnya.
          </p>
          <button
            type="button"
            onClick={onOpenNewGoalModal}
            className="mt-4 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-95 text-white rounded-full text-xs font-semibold transition shadow-xs hover:shadow cursor-pointer"
          >
            + Buat Target Tabungan Sekarang
          </button>
        </div>
      )}
    </div>
  );
}
