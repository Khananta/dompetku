"use client";

import React, { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { formatRupiah, exportToCSV, getPaymentMethodInfo, PAYMENT_METHODS } from "./utils";
import { Icons } from "./Icons";
import Swal from "sweetalert2";

export default function TransactionsView({
  transactions,
  allCategories,
  searchQuery,
  setSearchQuery,
  isPrivateMode,
  onOpenAddModal,
  onOpenBulkModal,
  onEditTransaction,
  onDeleteTransaction,
  onDeleteMultipleTransactions,
  onExportPDF,
  user,
}) {
  // Filter States - default "semua" (Semua Transaksi)
  const [typeFilter, setTypeFilter] = useState("semua"); // "semua" (default) | "pengeluaran" | "pemasukan"
  const [dateFilterType, setDateFilterType] = useState("bulanan"); // "bulanan" | "hari-ini" | "kustom" | "semua"
  const [categoryFilter, setCategoryFilter] = useState("semua");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("semua");
  const [viewMode, setViewMode] = useState("list"); // "list" (default rekap per tanggal) | "table" | "grid"
  const [selectedIds, setSelectedIds] = useState([]);

  // Date controls
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const [selectedMonth, setSelectedMonth] = useState(`${yyyy}-${mm}`);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Cetak Laporan Modal States
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [reportFormat, setReportFormat] = useState("pdf"); // "pdf" | "csv"
  const [reportType, setReportType] = useState("semua"); // "semua" | "pengeluaran" | "pemasukan"
  const [reportPeriod, setReportPeriod] = useState("bulan-ini"); // "bulan-ini" | "semua" | "kustom"
  const [reportMonth, setReportMonth] = useState(`${yyyy}-${mm}`);
  const [reportStartDate, setReportStartDate] = useState("");
  const [reportEndDate, setReportEndDate] = useState("");
  const [reportCategory, setReportCategory] = useState("semua");
  const [reportPaymentMethod, setReportPaymentMethod] = useState("semua");

  // Cegah scroll tembus pada background ketika modal aktif (terutama di iOS Safari)
  useEffect(() => {
    if (isMobileFilterOpen || isReportModalOpen) {
      const prevOverflow = document.body.style.overflow;
      const prevTouchAction = document.body.style.touchAction;
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
      return () => {
        document.body.style.overflow = prevOverflow;
        document.body.style.touchAction = prevTouchAction;
      };
    }
  }, [isMobileFilterOpen, isReportModalOpen]);

  // Jumlah filter aktif untuk badge mobile
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (dateFilterType !== "bulanan") count++;
    if (paymentMethodFilter !== "semua") count++;
    if (categoryFilter !== "semua") count++;
    return count;
  }, [dateFilterType, paymentMethodFilter, categoryFilter]);

  // Filter Logic
  const filteredData = useMemo(() => {
    return transactions.filter((item) => {
      // 1. Filter Tipe
      if (typeFilter !== "semua" && item.type !== typeFilter) return false;

      // 2. Filter Kategori
      if (categoryFilter !== "semua" && item.category !== categoryFilter) return false;

      // 3. Filter Metode Pembayaran
      const currentMethod = item.payment_method || "cash";
      if (paymentMethodFilter !== "semua" && currentMethod !== paymentMethodFilter) return false;

      // 4. Filter Tanggal
      const itemDate = new Date(item.created_at);
      const offset = itemDate.getTimezoneOffset() * 60000;
      const itemDateStr = new Date(itemDate.getTime() - offset).toISOString().split("T")[0];

      if (dateFilterType === "hari-ini") {
        const todayStr = new Date(Date.now() - offset).toISOString().split("T")[0];
        if (itemDateStr !== todayStr) return false;
      } else if (dateFilterType === "bulanan" && selectedMonth) {
        if (itemDateStr.substring(0, 7) !== selectedMonth) return false;
      } else if (dateFilterType === "kustom") {
        if (startDate && itemDateStr < startDate) return false;
        if (endDate && itemDateStr > endDate) return false;
      }

      // 5. Search Filter
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        const noteMatch = item.note ? item.note.toLowerCase().includes(q) : false;
        const catMatch = item.category ? item.category.toLowerCase().includes(q) : false;
        const methodMatch = getPaymentMethodInfo(item.payment_method).label.toLowerCase().includes(q);
        if (!noteMatch && !catMatch && !methodMatch) return false;
      }

      return true;
    });
  }, [
    transactions,
    typeFilter,
    categoryFilter,
    paymentMethodFilter,
    dateFilterType,
    selectedMonth,
    startDate,
    endDate,
    searchQuery,
  ]);

  // Ringkasan nominal data terfilter
  const summaryIncome = useMemo(() => {
    return filteredData
      .filter((t) => t.type === "pemasukan")
      .reduce((sum, t) => sum + Math.round(Number(t.amount)), 0);
  }, [filteredData]);

  const summaryExpense = useMemo(() => {
    return filteredData
      .filter((t) => t.type === "pengeluaran")
      .reduce((sum, t) => sum + Math.round(Number(t.amount)), 0);
  }, [filteredData]);

  // Multi-Selection Logic
  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredData.length && filteredData.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredData.map((tx) => tx.id));
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    if (onDeleteMultipleTransactions) {
      onDeleteMultipleTransactions(selectedIds);
      setSelectedIds([]);
    } else {
      selectedIds.forEach((id) => onDeleteTransaction(id));
      setSelectedIds([]);
    }
  };

  // Helper pengelompokan tanggal seperti di Dashboard
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

  // Transaksi hari ini & pengeluaran hari ini
  const todayTransactions = useMemo(() => {
    return transactions.filter((t) => isTodayDate(t.created_at || t.date));
  }, [transactions]);

  const todayExpense = useMemo(() => {
    return todayTransactions
      .filter((t) => t.type === "pengeluaran")
      .reduce((sum, t) => sum + Math.round(Number(t.amount)), 0);
  }, [todayTransactions]);

  const todayExpenseCount = useMemo(() => {
    return todayTransactions.filter((t) => t.type === "pengeluaran").length;
  }, [todayTransactions]);

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

  const groupedTransactions = useMemo(() => {
    const groups = [];
    const groupMap = new Map();

    filteredData.forEach((tx) => {
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
  }, [filteredData]);

  const summaryBalance = summaryIncome - summaryExpense;

  // Analisis Rekap Pengeluaran per Kategori
  const expenseCategoryBreakdown = useMemo(() => {
    // Ambil semua transaksi bertipe 'pengeluaran' dalam filter periode & metode yang sama
    const expenses = transactions.filter((item) => {
      if (item.type !== "pengeluaran") return false;
      const currentMethod = item.payment_method || "cash";
      if (paymentMethodFilter !== "semua" && currentMethod !== paymentMethodFilter) return false;

      const itemDate = new Date(item.created_at);
      const offset = itemDate.getTimezoneOffset() * 60000;
      const itemDateStr = new Date(itemDate.getTime() - offset).toISOString().split("T")[0];

      if (dateFilterType === "hari-ini") {
        const todayStr = new Date(Date.now() - offset).toISOString().split("T")[0];
        if (itemDateStr !== todayStr) return false;
      } else if (dateFilterType === "bulanan" && selectedMonth) {
        if (itemDateStr.substring(0, 7) !== selectedMonth) return false;
      } else if (dateFilterType === "kustom") {
        if (startDate && itemDateStr < startDate) return false;
        if (endDate && itemDateStr > endDate) return false;
      }
      return true;
    });

    const totalExp = expenses.reduce((s, t) => s + Math.round(Number(t.amount)), 0);
    const map = {};
    expenses.forEach((t) => {
      const cat = t.category || "Lainnya";
      if (!map[cat]) {
        map[cat] = { amount: 0, count: 0 };
      }
      map[cat].amount += Math.round(Number(t.amount));
      map[cat].count += 1;
    });

    const totalForCalc = totalExp > 0 ? totalExp : 1;
    return Object.entries(map)
      .map(([cat, val]) => ({
        category: cat,
        amount: val.amount,
        count: val.count,
        percentage: totalExp > 0 ? Math.round((val.amount / totalForCalc) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions, paymentMethodFilter, dateFilterType, selectedMonth, startDate, endDate]);

  const topCategory = expenseCategoryBreakdown[0] || null;

  // Hitung rata-rata pengeluaran harian
  const dailyAverageExpense = useMemo(() => {
    if (summaryExpense === 0) return 0;
    if (dateFilterType === "bulanan" && selectedMonth) {
      const [y, m] = selectedMonth.split("-").map(Number);
      const isCurrentMonth = y === yyyy && m === now.getMonth() + 1;
      const days = isCurrentMonth ? Math.max(1, now.getDate()) : new Date(y, m, 0).getDate();
      return Math.round(summaryExpense / days);
    }
    if (dateFilterType === "hari-ini") {
      return summaryExpense;
    }
    if (dateFilterType === "kustom" && startDate && endDate) {
      const diffTime = Math.abs(new Date(endDate) - new Date(startDate));
      const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);
      return Math.round(summaryExpense / diffDays);
    }
    return Math.round(summaryExpense / 30);
  }, [summaryExpense, dateFilterType, selectedMonth, yyyy, now, startDate, endDate]);

  // Helper gradien bar & badge persentase kategori
  const getCategoryBarGradient = (pct) => {
    if (pct >= 50) return "bg-gradient-to-r from-rose-500 via-rose-500 to-amber-500";
    if (pct >= 25) return "bg-gradient-to-r from-amber-500 to-orange-400";
    if (pct >= 10) return "bg-gradient-to-r from-indigo-500 to-blue-500";
    return "bg-gradient-to-r from-emerald-500 to-teal-500";
  };

  const getCategoryBadgeColor = (pct) => {
    if (pct >= 50) return "bg-rose-50 text-rose-700 border-rose-200";
    if (pct >= 25) return "bg-amber-50 text-amber-700 border-amber-200";
    if (pct >= 10) return "bg-indigo-50 text-indigo-700 border-indigo-200";
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  };

  // Report Filter Data & Totals
  const reportFilteredData = useMemo(() => {
    return transactions.filter((item) => {
      if (reportType !== "semua" && item.type !== reportType) return false;
      if (reportCategory !== "semua" && item.category !== reportCategory) return false;
      const currentMethod = item.payment_method || "cash";
      if (reportPaymentMethod !== "semua" && currentMethod !== reportPaymentMethod) return false;

      const itemDate = new Date(item.created_at);
      const offset = itemDate.getTimezoneOffset() * 60000;
      const itemDateStr = new Date(itemDate.getTime() - offset).toISOString().split("T")[0];

      if (reportPeriod === "bulan-ini" && reportMonth) {
        if (itemDateStr.substring(0, 7) !== reportMonth) return false;
      } else if (reportPeriod === "kustom") {
        if (reportStartDate && itemDateStr < reportStartDate) return false;
        if (reportEndDate && itemDateStr > reportEndDate) return false;
      }
      return true;
    });
  }, [transactions, reportType, reportCategory, reportPaymentMethod, reportPeriod, reportMonth, reportStartDate, reportEndDate]);

  const reportIncomeTotal = useMemo(() => {
    return reportFilteredData
      .filter((t) => t.type === "pemasukan")
      .reduce((s, t) => s + Math.round(Number(t.amount)), 0);
  }, [reportFilteredData]);

  const reportExpenseTotal = useMemo(() => {
    return reportFilteredData
      .filter((t) => t.type === "pengeluaran")
      .reduce((s, t) => s + Math.round(Number(t.amount)), 0);
  }, [reportFilteredData]);

  const handleExecuteExport = async () => {
    if (reportFilteredData.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Data Kosong",
        text: "Tidak ada transaksi yang cocok dengan kriteria filter cetak.",
        confirmButtonColor: "#10b981",
      });
      return;
    }

    const dateSlug = new Date().toISOString().split("T")[0];
    const periodLabel =
      reportPeriod === "bulan-ini"
        ? `Bulan_${reportMonth}`
        : reportPeriod === "kustom"
        ? `Periode_${reportStartDate || "Awal"}_sd_${reportEndDate || "Akhir"}`
        : "Semua_Waktu";
    const filename = `Laporan_Keuangan_DompetKu_${periodLabel}_${dateSlug}`;

    if (reportFormat === "csv") {
      exportToCSV(reportFilteredData, `${filename}.csv`);
      setIsReportModalOpen(false);
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Laporan CSV berhasil diunduh!",
        showConfirmButton: false,
        timer: 1800,
      });
    } else {
      try {
        const { default: jsPDF } = await import("jspdf");
        const { default: autoTable } = await import("jspdf-autotable");

        const doc = new jsPDF();
        const displayName = user?.user_metadata?.username || user?.email?.split("@")[0] || "Pengguna";

        // Header Title
        doc.setFont("helvetica", "bold");
        doc.setFontSize(20);
        doc.setTextColor(5, 150, 105);
        doc.text("DompetKu", 14, 18);

        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.setFont("helvetica", "normal");
        doc.text("Laporan Catatan Keuangan Pribadi", 14, 24);

        // Metadata Info
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105);
        doc.setFont("helvetica", "bold");
        doc.text("Nama Pengguna:", 14, 34);
        doc.setFont("helvetica", "normal");
        doc.text(displayName, 45, 34);

        doc.setFont("helvetica", "bold");
        doc.text("Periode Laporan:", 14, 40);
        doc.setFont("helvetica", "normal");
        const periodText =
          reportPeriod === "bulan-ini"
            ? `Bulan ${reportMonth}`
            : reportPeriod === "kustom"
            ? `${reportStartDate || "Awal"} s/d ${reportEndDate || "Akhir"}`
            : "Semua Waktu";
        doc.text(periodText, 45, 40);

        doc.setFont("helvetica", "bold");
        doc.text("Filter Tipe:", 14, 46);
        doc.setFont("helvetica", "normal");
        doc.text(
          reportType === "pengeluaran"
            ? "Hanya Pengeluaran"
            : reportType === "pemasukan"
            ? "Hanya Pemasukan"
            : "Semua Transaksi",
          45,
          46
        );

        doc.setFont("helvetica", "bold");
        doc.text("Tanggal Cetak:", 120, 34);
        doc.setFont("helvetica", "normal");
        doc.text(new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }), 148, 34);

        doc.setFont("helvetica", "bold");
        doc.text("Total Mutasi:", 120, 40);
        doc.setFont("helvetica", "normal");
        doc.text(`${reportFilteredData.length} Transaksi`, 148, 40);

        doc.setDrawColor(226, 232, 240);
        doc.line(14, 52, 196, 52);

        const rows = reportFilteredData.map((t, idx) => {
          const d = new Date(t.created_at);
          const dateStr = d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
          const method = getPaymentMethodInfo(t.payment_method).short;
          const isExp = t.type === "pengeluaran";
          const formattedAmt = `${isExp ? "-" : "+"} ${formatRupiah(t.amount)}`;
          return [
            idx + 1,
            dateStr,
            t.type === "pemasukan" ? "Pemasukan" : "Pengeluaran",
            t.category,
            method,
            t.note || "-",
            formattedAmt,
          ];
        });

        autoTable(doc, {
          startY: 56,
          head: [["No", "Tanggal", "Tipe", "Kategori", "Metode", "Keterangan", "Nominal"]],
          body: rows,
          theme: "striped",
          headStyles: {
            fillColor: [5, 150, 105],
            textColor: [255, 255, 255],
            fontStyle: "bold",
            fontSize: 9,
          },
          bodyStyles: {
            fontSize: 8.5,
            textColor: [51, 65, 85],
          },
          columnStyles: {
            0: { cellWidth: 10, halign: "center" },
            1: { cellWidth: 26 },
            2: { cellWidth: 24 },
            3: { cellWidth: 25 },
            4: { cellWidth: 20 },
            5: { cellWidth: "auto" },
            6: { cellWidth: 32, halign: "right", fontStyle: "bold" },
          },
        });

        doc.save(`${filename}.pdf`);
        setIsReportModalOpen(false);
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: "Laporan PDF berhasil diunduh!",
          showConfirmButton: false,
          timer: 1800,
        });
      } catch (err) {
        console.error("PDF Export error:", err);
        Swal.fire("Gagal", "Terjadi kesalahan saat memproses laporan PDF.", "error");
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* ========================================================
      // 1. TOP SUMMARY CARDS (STATISTIK CEPAT PENGELUARAN)
      // ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Pengeluaran Hari Ini (Paling Kiri di Desktop, Paling Atas di Mobile) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Pengeluaran Hari Ini</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Icons.Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              {formatRupiah(todayExpense, isPrivateMode)}
            </h2>
            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
              {todayExpenseCount > 0 ? (
                <>
                  <span className="text-amber-600 font-semibold">
                    {todayExpenseCount} Transaksi
                  </span>
                  <span>keluar hari ini</span>
                </>
              ) : (
                <span className="text-slate-400">Belum ada pengeluaran hari ini</span>
              )}
            </div>
          </div>
        </div>

        {/* Card 2: Total Pengeluaran Periode Ini */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Pengeluaran</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Icons.TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl font-bold text-rose-600 tracking-tight">
              -{formatRupiah(summaryExpense, isPrivateMode)}
            </h2>
            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
              <span className="text-rose-600 font-semibold">
                {filteredData.filter((t) => t.type === "pengeluaran").length} Transaksi
              </span>
              <span>pada filter ini</span>
            </div>
          </div>
        </div>

        {/* Card 3: Rata-rata Harian */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Rata-rata Harian</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Icons.Calculator className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
              {formatRupiah(dailyAverageExpense, isPrivateMode)}
            </h2>
            <div className="mt-2 text-[11px] text-slate-400">
              Pengeluaran per hari periode ini
            </div>
          </div>
        </div>

        {/* Card 4: Info Pemasukan / Arus Kas Bersih */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Pemasukan & Selisih</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Icons.Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-base font-bold text-slate-800">
              +{formatRupiah(summaryIncome, isPrivateMode)}
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Selisih Kas:</span>
              <span className={`font-bold ${summaryBalance >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                {summaryBalance >= 0 ? "+" : ""}{formatRupiah(summaryBalance, isPrivateMode)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
      // 2. REKAPAN LENGKAP PENGELUARAN PER KATEGORI (COMPACT & INFORMATIF)
      // ======================================================== */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900">Rekapitulasi per Kategori</h3>
            <span className="text-[10px] font-semibold bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full border border-rose-100">
              {expenseCategoryBreakdown.length} Kategori
            </span>
          </div>

          {categoryFilter !== "semua" && (
            <button
              onClick={() => setCategoryFilter("semua")}
              className="self-start sm:self-auto text-xs font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1 rounded-full transition flex items-center gap-1 cursor-pointer"
            >
              <span>Filter: <strong>{categoryFilter}</strong></span>
              <span className="text-emerald-800 font-bold ml-1">✕ Reset</span>
            </button>
          )}
        </div>

        {expenseCategoryBreakdown.length > 0 ? (
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {expenseCategoryBreakdown.map((cat, idx) => {
              const isSelected = categoryFilter === cat.category;
              return (
                <div
                  key={idx}
                  onClick={() => setCategoryFilter(isSelected ? "semua" : cat.category)}
                  className={`p-2.5 rounded-xl border transition cursor-pointer select-none ${
                    isSelected
                      ? "border-emerald-500 bg-emerald-50/50 shadow-xs ring-1 ring-emerald-500"
                      : "border-slate-200/70 bg-slate-50/60 hover:bg-white hover:border-slate-300"
                  }`}
                  title="Klik untuk menyaring mutasi berdasarkan kategori ini"
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[10px] font-bold text-slate-400 shrink-0">#{idx + 1}</span>
                      <h4 className="text-xs font-semibold text-slate-800 truncate">{cat.category}</h4>
                    </div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full border shrink-0 ${getCategoryBadgeColor(cat.percentage)}`}>
                      {cat.percentage}%
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between text-[11px] mb-1.5">
                    <span className="font-bold text-slate-900 text-xs">
                      {formatRupiah(cat.amount, isPrivateMode)}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {cat.count} tx
                    </span>
                  </div>

                  {/* Progress Bar Persentase Mengikuti Warna Progres */}
                  <div className="w-full h-1.5 rounded-full bg-slate-200/70 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${getCategoryBarGradient(cat.percentage)}`}
                      style={{ width: `${Math.max(4, cat.percentage)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-6 text-center text-slate-400">
            <div className="w-8 h-8 mx-auto rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mb-1.5">
              <Icons.Tag className="w-4 h-4" />
            </div>
            <p className="text-xs font-medium text-slate-600">Tidak ada pengeluaran pada periode ini</p>
          </div>
        )}
      </div>

      {/* ========================================================
      // 3. TOOLBAR FILTER, PENCARIAN & EKSPOR
      // ======================================================== */}
      <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Tipe Tabs: Semua Transaksi (Paling Kiri & Default), Pengeluaran, Pemasukan */}
          <div className="grid grid-cols-3 sm:inline-flex p-1 bg-slate-100 rounded-full text-xs font-medium w-full sm:w-auto text-center">
            <button
              onClick={() => setTypeFilter("semua")}
              className={`px-2.5 sm:px-3.5 py-1.5 rounded-full active:scale-95 transition cursor-pointer text-center truncate ${
                typeFilter === "semua"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span className="sm:hidden">Semua</span>
              <span className="hidden sm:inline">Semua Transaksi</span>
            </button>
            <button
              onClick={() => setTypeFilter("pengeluaran")}
              className={`px-2.5 sm:px-3.5 py-1.5 rounded-full active:scale-95 transition cursor-pointer text-center truncate ${
                typeFilter === "pengeluaran"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Pengeluaran
            </button>
            <button
              onClick={() => setTypeFilter("pemasukan")}
              className={`px-2.5 sm:px-3.5 py-1.5 rounded-full active:scale-95 transition cursor-pointer text-center truncate ${
                typeFilter === "pemasukan"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Pemasukan
            </button>
          </div>

          {/* Export Button "Cetak Laporan", Mobile Filter Button, & Mode Tampilan */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-95 text-white text-xs font-semibold rounded-full shadow-xs hover:shadow transition cursor-pointer shrink-0"
              title="Buka menu cetak dan ekspor laporan"
            >
              <Icons.Download className="w-3.5 h-3.5 shrink-0" />
              <span>Cetak Laporan</span>
            </button>

            {/* Mobile Filter Button: penempatannya di tengah-tengah antara cetak laporan dan pengubah grid, mengisi sisa panjang */}
            <button
              type="button"
              onClick={() => setIsMobileFilterOpen(true)}
              className="sm:hidden flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-xs font-semibold rounded-full transition cursor-pointer"
            >
              <Icons.SlidersHorizontal className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>Filter</span>
              {activeFiltersCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            <div className="flex items-center p-1 bg-slate-100 rounded-full relative shrink-0">
              <button
                type="button"
                onClick={() => setViewMode("list")}
                title="Tampilan Rekap per Tanggal"
                className={`relative w-8 h-8 rounded-full transition cursor-pointer flex items-center justify-center p-0 z-10 shrink-0 ${
                  viewMode === "list" ? "text-white" : "text-slate-400 hover:text-slate-700"
                }`}
              >
                {viewMode === "list" && (
                  <motion.div
                    layoutId="viewModeSwipePill"
                    className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full shadow-xs"
                    transition={{ type: "spring", stiffness: 450, damping: 32 }}
                  />
                )}
                <Icons.Receipt className="w-4 h-4 relative z-10" />
              </button>

              <button
                type="button"
                onClick={() => setViewMode("grid")}
                title="Tampilan Kartu"
                className={`relative w-8 h-8 rounded-full transition cursor-pointer flex items-center justify-center p-0 z-10 shrink-0 ${
                  viewMode === "grid" ? "text-white" : "text-slate-400 hover:text-slate-700"
                }`}
              >
                {viewMode === "grid" && (
                  <motion.div
                    layoutId="viewModeSwipePill"
                    className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full shadow-xs"
                    transition={{ type: "spring", stiffness: 450, damping: 32 }}
                  />
                )}
                <Icons.Dashboard className="w-4 h-4 relative z-10" />
              </button>
            </div>
          </div>
        </div>

        {/* Date Filter, Category Selection & Payment Method (Desktop Only) */}
        <div className="hidden sm:flex pt-2.5 border-t border-slate-100 items-center flex-wrap gap-2.5 text-xs">
          {/* Periode & Tanggal */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <span className="text-slate-400 font-medium shrink-0">Periode:</span>
            <select
              value={dateFilterType}
              onChange={(e) => setDateFilterType(e.target.value)}
              className="py-1 px-3 bg-slate-50 border border-slate-200 rounded-full text-slate-700 focus:outline-none focus:border-emerald-500 text-xs cursor-pointer"
            >
              <option value="bulanan">Per Bulan</option>
              <option value="hari-ini">Hari Ini</option>
              <option value="kustom">Rentang Tanggal</option>
              <option value="semua">Semua Waktu</option>
            </select>

            {dateFilterType === "bulanan" && (
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="py-1 px-3 bg-slate-50 border border-slate-200 rounded-full text-slate-700 focus:outline-none focus:border-emerald-500 text-xs cursor-pointer"
              />
            )}

            {dateFilterType === "kustom" && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="py-1 px-2.5 bg-slate-50 border border-slate-200 rounded-full text-slate-700 text-xs cursor-pointer"
                />
                <span className="text-slate-400">s/d</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="py-1 px-2.5 bg-slate-50 border border-slate-200 rounded-full text-slate-700 text-xs cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Filter Metode Pembayaran & Kategori */}
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:ml-auto w-full sm:w-auto">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-slate-400 font-medium shrink-0 hidden sm:inline">Metode:</span>
              <select
                value={paymentMethodFilter}
                onChange={(e) => setPaymentMethodFilter(e.target.value)}
                className="w-full sm:w-auto py-1 px-3 bg-slate-50 border border-slate-200 rounded-full text-slate-700 focus:outline-none focus:border-emerald-500 text-xs cursor-pointer truncate"
              >
                <option value="semua">Semua Metode</option>
                {PAYMENT_METHODS.map((pm) => (
                  <option key={pm.id} value={pm.id}>
                    {pm.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-slate-400 font-medium shrink-0 hidden sm:inline">Kategori:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full sm:w-auto py-1 px-3 bg-slate-50 border border-slate-200 rounded-full text-slate-700 focus:outline-none focus:border-emerald-500 text-xs cursor-pointer truncate"
              >
                <option value="semua">Semua Kategori</option>
                {allCategories.map((c, i) => (
                  <option key={i} value={c.name}>
                    {c.name} ({c.type})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
      // 4. DAFTAR MUTASI / TRANSAKSI PENGELUARAN
      // ======================================================== */}
      {filteredData.length > 0 ? (
        viewMode === "list" ? (
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div>
              {/* Header Card & Selection Controls */}
              <div className="flex items-center justify-between gap-2.5 pb-3.5 border-b border-slate-100 mb-2">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-slate-900 truncate">Rekapitulasi Pengeluaran</h3>
                  <p className="text-xs text-slate-400 hidden sm:block">Mutasi keuangan terkelompok berdasarkan tanggal</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Select All Radio/Checkbox Button */}
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 transition cursor-pointer select-none active:scale-95"
                  >
                    <span
                      className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition border ${
                        filteredData.length > 0 && selectedIds.length === filteredData.length
                          ? "bg-emerald-600 border-emerald-600 text-white"
                          : "border-slate-300 bg-white"
                      }`}
                    >
                      {filteredData.length > 0 && selectedIds.length === filteredData.length && (
                        <span className="w-1.5 h-1.5 bg-white rounded-full" />
                      )}
                    </span>
                    <span className="text-[11px] sm:text-xs">
                      {filteredData.length > 0 && selectedIds.length === filteredData.length
                        ? "Batal Semua"
                        : "Pilih Semua"}
                    </span>
                  </button>

                  {/* Bulk Delete Button when items selected */}
                  {selectedIds.length > 0 && (
                    <div className="flex items-center gap-1.5 animate-in fade-in duration-200">
                      <span className="text-[11px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                        {selectedIds.length}
                      </span>
                      <button
                        type="button"
                        onClick={handleBulkDelete}
                        title="Hapus semua transaksi terpilih"
                        className="inline-flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-semibold rounded-full shadow-xs hover:shadow transition cursor-pointer"
                      >
                        <Icons.Trash className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Hapus</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Grouped by Date List - Sama persis dengan tampilan Transaksi Terbaru di Dashboard */}
              <div className="space-y-4 pt-1">
                {groupedTransactions.map((group) => {
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
                          const isSelected = selectedIds.includes(tx.id);
                          const methodInfo = getPaymentMethodInfo(tx.payment_method);

                          return (
                            <div
                              key={tx.id}
                              className={`py-2.5 flex items-center justify-between gap-3 group hover:bg-slate-50/70 px-2 rounded-xl transition ${
                                isSelected ? "bg-emerald-50/50" : ""
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                {/* Radio/Checkbox Selector di sebelah kiri item */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleSelect(tx.id);
                                  }}
                                  title={isSelected ? "Batalkan pilihan" : "Pilih transaksi ini"}
                                  className={`w-5 h-5 rounded-full border flex items-center justify-center transition cursor-pointer shrink-0 ${
                                    isSelected
                                      ? "bg-emerald-600 border-emerald-600 text-white shadow-xs ring-2 ring-emerald-200"
                                      : "border-slate-300 bg-white hover:border-emerald-500"
                                  }`}
                                  aria-label={isSelected ? "Batalkan pilihan" : "Pilih transaksi"}
                                >
                                  {isSelected && (
                                    <span className="w-2 h-2 bg-white rounded-full" />
                                  )}
                                </button>

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
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-x-1.5 gap-y-1 flex-wrap">
                                    <p className="text-xs font-semibold text-slate-800 truncate max-w-[140px] sm:max-w-none">
                                      {tx.note || tx.category}
                                    </p>
                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 shrink-0">
                                      {tx.category}
                                    </span>
                                    <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border shrink-0 ${methodInfo.bg}`}>
                                      {methodInfo.short}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-400 mt-1.5 sm:mt-1">
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
            </div>

            {/* Bottom info bar */}
            <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 px-1">
              <span>
                Menampilkan <strong className="text-slate-700 font-semibold">{filteredData.length}</strong> transaksi terkelompok
              </span>
            </div>
          </div>
        ) : (
          /* Grid View Mode */
          <div className="space-y-3.5">
            {/* Grid Selection Bar */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleSelectAll}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 hover:border-slate-300 bg-slate-50 text-xs font-medium text-slate-700 transition cursor-pointer"
              >
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center transition border ${
                    filteredData.length > 0 && selectedIds.length === filteredData.length
                      ? "bg-emerald-600 border-emerald-600 text-white"
                      : "border-slate-300 bg-white"
                  }`}
                >
                  {filteredData.length > 0 && selectedIds.length === filteredData.length && (
                    <span className="w-1.5 h-1.5 bg-white rounded-full" />
                  )}
                </span>
                <span>
                  {filteredData.length > 0 && selectedIds.length === filteredData.length
                    ? "Batalkan Pilih Semua"
                    : "Pilih Semua"}
                </span>
              </button>

              {selectedIds.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                    {selectedIds.length} dipilih
                  </span>
                  <button
                    type="button"
                    onClick={handleBulkDelete}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-semibold rounded-full shadow-xs hover:shadow transition cursor-pointer"
                  >
                    <Icons.Trash className="w-3.5 h-3.5" />
                    <span>Hapus ({selectedIds.length})</span>
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredData.map((tx) => {
                const isExpense = tx.type === "pengeluaran";
                const txDate = new Date(tx.created_at || tx.date);
                const formattedDate = txDate.toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                });
                const methodInfo = getPaymentMethodInfo(tx.payment_method);
                const isSelected = selectedIds.includes(tx.id);

                return (
                  <div
                    key={tx.id}
                    className={`bg-white p-4 rounded-2xl border transition shadow-xs flex flex-col justify-between space-y-3 ${
                      isSelected ? "border-emerald-500 ring-1 ring-emerald-500 bg-emerald-50/20" : "border-slate-200/80"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <button
                          type="button"
                          onClick={() => toggleSelect(tx.id)}
                          className={`w-4 h-4 rounded-full border mt-0.5 shrink-0 flex items-center justify-center transition cursor-pointer ${
                            isSelected
                              ? "bg-emerald-600 border-emerald-600 text-white shadow-xs"
                              : "border-slate-300 bg-white hover:border-emerald-500"
                          }`}
                        >
                          {isSelected && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
                        </button>
                        <div className="min-w-0">
                          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                            {formattedDate}
                          </span>
                          <h4 className="text-xs font-semibold text-slate-900 mt-0.5 line-clamp-1">
                            {tx.note || tx.category}
                          </h4>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${methodInfo.bg}`}>
                          {methodInfo.short}
                        </span>
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                            isExpense ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {tx.category}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span
                        className={`text-sm font-bold ${
                          isExpense ? "text-slate-800" : "text-emerald-600"
                        }`}
                      >
                        {isExpense ? "-" : "+"}
                        {formatRupiah(tx.amount, isPrivateMode)}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onEditTransaction(tx)}
                          className="p-1 text-slate-400 hover:text-emerald-600 active:scale-95 rounded transition cursor-pointer"
                          title="Edit"
                        >
                          <Icons.Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteTransaction(tx.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 active:scale-95 rounded transition cursor-pointer"
                          title="Hapus"
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
        )
      ) : (
        /* Empty State */
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-400">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-2">
            <Icons.Search className="w-6 h-6" />
          </div>
          <p className="text-sm font-medium text-slate-700 mt-2">Tidak ada data ditemukan</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Coba ubah kata kunci pencarian, kategori, metode pembayaran, atau rentang filter tanggal.
          </p>
          <button
            onClick={onOpenAddModal}
            className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-medium transition cursor-pointer"
          >
            + Catat Pengeluaran Baru
          </button>
        </div>
      )}

      {/* ========================================================
      // 5. MODAL POPUP CETAK LAPORAN (INTERAKTIF & FLEKSIBEL)
      // ======================================================== */}
      {isReportModalOpen && (
        <div
          onClick={() => setIsReportModalOpen(false)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3.5 sm:p-4 overscroll-contain touch-none animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 max-w-md w-full p-5 sm:p-6 space-y-4 max-h-[85dvh] flex flex-col overflow-hidden isolate overscroll-contain animate-in zoom-in-95 duration-200"
          >
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Icons.Download className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Cetak & Ekspor Laporan</h3>
                  <p className="text-[11px] text-slate-400">Pilih format dan filter mutasi keuangan Anda</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsReportModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 w-7 h-7 flex items-center justify-center rounded-full transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Pilihan Format File (PDF / CSV) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Format Dokumen:</label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setReportFormat("pdf")}
                  className={`p-2.5 rounded-2xl border flex items-center gap-2.5 text-left transition cursor-pointer ${
                    reportFormat === "pdf"
                      ? "border-emerald-500 bg-emerald-50/60 ring-1 ring-emerald-500 shadow-xs"
                      : "border-slate-200 hover:border-slate-300 bg-slate-50/60"
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${
                      reportFormat === "pdf" ? "bg-emerald-600 text-white" : "bg-rose-50 text-rose-600"
                    }`}
                  >
                    PDF
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">Dokumen PDF</p>
                    <p className="text-[10px] text-slate-400">Laporan resmi siap cetak</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setReportFormat("csv")}
                  className={`p-2.5 rounded-2xl border flex items-center gap-2.5 text-left transition cursor-pointer ${
                    reportFormat === "csv"
                      ? "border-emerald-500 bg-emerald-50/60 ring-1 ring-emerald-500 shadow-xs"
                      : "border-slate-200 hover:border-slate-300 bg-slate-50/60"
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      reportFormat === "csv" ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-600"
                    }`}
                  >
                    <Icons.FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">Excel / CSV</p>
                    <p className="text-[10px] text-slate-400">Olah data spreadsheet</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Pilihan Tipe Transaksi */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Tipe Transaksi:</label>
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-full text-xs">
                {[
                  { id: "semua", label: "Semua" },
                  { id: "pengeluaran", label: "Pengeluaran" },
                  { id: "pemasukan", label: "Pemasukan" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setReportType(item.id)}
                    className={`flex-1 py-1 px-2.5 rounded-full font-medium transition cursor-pointer ${
                      reportType === item.id
                        ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xs font-semibold"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Pilihan Rentang Waktu */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Rentang Waktu:</label>
              <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                {[
                  { id: "bulan-ini", label: "Per Bulan" },
                  { id: "semua", label: "Semua Waktu" },
                  { id: "kustom", label: "Rentang Kustom" },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setReportPeriod(p.id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition cursor-pointer ${
                      reportPeriod === p.id
                        ? "bg-emerald-50 border-emerald-500 text-emerald-700 font-semibold"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {reportPeriod === "bulan-ini" && (
                <input
                  type="month"
                  value={reportMonth}
                  onChange={(e) => setReportMonth(e.target.value)}
                  className="w-full py-1.5 px-3.5 bg-slate-50 border border-slate-200 rounded-full text-xs text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
                />
              )}

              {reportPeriod === "kustom" && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">Dari Tanggal:</span>
                    <input
                      type="date"
                      value={reportStartDate}
                      onChange={(e) => setReportStartDate(e.target.value)}
                      className="w-full py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-full text-xs text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">Sampai Tanggal:</span>
                    <input
                      type="date"
                      value={reportEndDate}
                      onChange={(e) => setReportEndDate(e.target.value)}
                      className="w-full py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-full text-xs text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Filter Kategori & Metode Pembayaran */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600">Kategori:</label>
                <select
                  value={reportCategory}
                  onChange={(e) => setReportCategory(e.target.value)}
                  className="w-full py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-full text-xs text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="semua">Semua Kategori</option>
                  {allCategories.map((c, i) => (
                    <option key={i} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600">Metode Bayar:</label>
                <select
                  value={reportPaymentMethod}
                  onChange={(e) => setReportPaymentMethod(e.target.value)}
                  className="w-full py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-full text-xs text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="semua">Semua Metode</option>
                  {PAYMENT_METHODS.map((pm) => (
                    <option key={pm.id} value={pm.id}>
                      {pm.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Ringkasan Data yang Akan Dicetak */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400">Data Terpilih:</span>
                <p className="font-bold text-slate-800">{reportFilteredData.length} Transaksi</p>
              </div>
              <div className="text-right">
                <span className="text-slate-400">Total Nominal:</span>
                <p className="font-bold text-slate-800">
                  {reportType === "pengeluaran"
                    ? formatRupiah(reportExpenseTotal, isPrivateMode)
                    : reportType === "pemasukan"
                    ? formatRupiah(reportIncomeTotal, isPrivateMode)
                    : `${formatRupiah(reportExpenseTotal + reportIncomeTotal, isPrivateMode)}`}
                </p>
              </div>
            </div>

            {/* Tombol Aksi */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsReportModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-full transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteExport}
                className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-95 text-white text-xs font-semibold rounded-full shadow-xs hover:shadow transition flex items-center gap-1.5 cursor-pointer"
              >
                <Icons.Download className="w-3.5 h-3.5" />
                <span>Unduh {reportFormat.toUpperCase()}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
      // 6. MODAL POPUP FILTER MOBILE
      // ======================================================== */}
      {isMobileFilterOpen && (
        <div
          onClick={() => setIsMobileFilterOpen(false)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3.5 sm:p-4 overscroll-contain touch-none animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 max-w-md w-full p-4 sm:p-5 space-y-4 max-h-[85dvh] flex flex-col overflow-hidden isolate overscroll-contain animate-in zoom-in-95 duration-200"
          >
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Icons.SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Filter Transaksi</h3>
                  <p className="text-[11px] text-slate-400">Sesuaikan periode, kategori, & metode</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(false)}
                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition cursor-pointer shrink-0"
              >
                <Icons.X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Filters (Scrollable) */}
            <div className="overflow-y-auto flex-1 space-y-3.5 text-xs pr-1 overscroll-contain">
              {/* Periode */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">
                  Periode Transaksi
                </label>
                <div className="relative">
                  <select
                    value={dateFilterType}
                    onChange={(e) => setDateFilterType(e.target.value)}
                    className="w-full py-2.5 pl-3.5 pr-9 bg-slate-50 border border-slate-200 rounded-full text-slate-700 focus:outline-none focus:border-emerald-500 text-xs cursor-pointer appearance-none"
                  >
                    <option value="bulanan">Per Bulan</option>
                    <option value="hari-ini">Hari Ini</option>
                    <option value="kustom">Rentang Tanggal</option>
                    <option value="semua">Semua Waktu</option>
                  </select>
                  <Icons.ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
              </div>

              {/* Tanggal Bulanan */}
              {dateFilterType === "bulanan" && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">
                    Pilih Bulan
                  </label>
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-full text-slate-700 focus:outline-none focus:border-emerald-500 text-xs cursor-pointer min-h-[40px]"
                  />
                </div>
              )}

              {/* Tanggal Kustom */}
              {dateFilterType === "kustom" && (
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-semibold text-slate-700">
                    Rentang Tanggal
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-1">Mulai:</span>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-full text-slate-700 text-xs cursor-pointer min-h-[38px]"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-1">Sampai:</span>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-full text-slate-700 text-xs cursor-pointer min-h-[38px]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Metode Pembayaran */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">
                  Metode Pembayaran
                </label>
                <div className="relative">
                  <select
                    value={paymentMethodFilter}
                    onChange={(e) => setPaymentMethodFilter(e.target.value)}
                    className="w-full py-2.5 pl-3.5 pr-9 bg-slate-50 border border-slate-200 rounded-full text-slate-700 focus:outline-none focus:border-emerald-500 text-xs cursor-pointer appearance-none"
                  >
                    <option value="semua">Semua Metode Pembayaran</option>
                    {PAYMENT_METHODS.map((pm) => (
                      <option key={pm.id} value={pm.id}>
                        {pm.label}
                      </option>
                    ))}
                  </select>
                  <Icons.ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
              </div>

              {/* Kategori */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">
                  Kategori
                </label>
                <div className="relative">
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full py-2.5 pl-3.5 pr-9 bg-slate-50 border border-slate-200 rounded-full text-slate-700 focus:outline-none focus:border-emerald-500 text-xs cursor-pointer appearance-none"
                  >
                    <option value="semua">Semua Kategori</option>
                    {allCategories.map((c, i) => (
                      <option key={i} value={c.name}>
                        {c.name} ({c.type})
                      </option>
                    ))}
                  </select>
                  <Icons.ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setDateFilterType("bulanan");
                  setSelectedMonth(`${yyyy}-${mm}`);
                  setStartDate("");
                  setEndDate("");
                  setPaymentMethodFilter("semua");
                  setCategoryFilter("semua");
                }}
                className="px-4 py-2.5 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-full font-semibold text-xs transition cursor-pointer"
              >
                Reset Filter
              </button>

              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(false)}
                className="flex-1 py-2.5 px-5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-95 text-white text-xs font-semibold rounded-full shadow-xs hover:shadow transition cursor-pointer text-center"
              >
                Terapkan Filter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
