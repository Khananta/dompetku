"use client";

import React, { useState, useMemo } from "react";
import Swal from "sweetalert2";
import { formatRupiah, PAYMENT_METHODS } from "./utils";
import { Icons } from "./Icons";

export default function SettingsView({
  user,
  transactions = [],
  monthlyBudgetLimit,
  setMonthlyBudgetLimit,
  customCategories = [],
  allCategories = [],
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
  onResetAllData,
  isPrivateMode = false,
  togglePrivacyMode,
  defaultCategory = "Makanan",
  setDefaultCategory,
  goals = [],
  billings = [],
}) {
  // State Input Anggaran
  const [budgetInput, setBudgetInput] = useState(() => {
    return monthlyBudgetLimit ? new Intl.NumberFormat("id-ID").format(monthlyBudgetLimit) : "";
  });

  // State Tambah Kategori
  const [newCatName, setNewCatName] = useState("");
  const [newCatType, setNewCatType] = useState("pengeluaran");

  // State Tab Filter Kategori ("semua", "pengeluaran", "pemasukan")
  const [catFilter, setCatFilter] = useState("semua");
  const [catSearchQuery, setCatSearchQuery] = useState("");

  // State Metode Pembayaran Bawaan
  const [defaultPaymentMethod, setDefaultPaymentMethod] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("dompetku_default_payment_method") || "cash";
    }
    return "cash";
  });

  // State Kategori Bawaan
  const [selectedDefaultCategory, setSelectedDefaultCategory] = useState(defaultCategory);

  // Perhitungan Realisasi Pengeluaran Bulan Ini
  const budgetAnalytics = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const thisMonthExpenses = transactions
      .filter((t) => {
        if (t.type !== "pengeluaran" || !t.date) return false;
        const d = new Date(t.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

    const limitNum = Number(monthlyBudgetLimit) || 0;
    const percentUsed = limitNum > 0 ? Math.min(Math.round((thisMonthExpenses / limitNum) * 100), 100) : 0;
    const actualPercent = limitNum > 0 ? ((thisMonthExpenses / limitNum) * 100).toFixed(1) : 0;
    const remaining = limitNum > thisMonthExpenses ? limitNum - thisMonthExpenses : 0;
    const isOver = limitNum > 0 && thisMonthExpenses > limitNum;
    const overAmount = isOver ? thisMonthExpenses - limitNum : 0;

    return {
      thisMonthExpenses,
      limitNum,
      percentUsed,
      actualPercent,
      remaining,
      isOver,
      overAmount,
    };
  }, [transactions, monthlyBudgetLimit]);

  // Simpan Limit Anggaran
  const handleSaveBudget = (e) => {
    e.preventDefault();
    const clean = budgetInput.replace(/\D/g, "");
    setMonthlyBudgetLimit(clean);
    if (typeof window !== "undefined") {
      localStorage.setItem("dompetku_budget_limit", clean);
    }

    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: clean ? "Batas anggaran berhasil diperbarui!" : "Batas anggaran telah dinonaktifkan.",
      showConfirmButton: false,
      timer: 1500,
    });
  };

  // Simpan Preferensi Kategori Bawaan
  const handleDefaultCategoryChange = (val) => {
    setSelectedDefaultCategory(val);
    if (setDefaultCategory) setDefaultCategory(val);
    if (typeof window !== "undefined") {
      localStorage.setItem("dompetku_default_category", val);
    }
    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: `Kategori bawaan diatur ke "${val}"`,
      showConfirmButton: false,
      timer: 1500,
    });
  };

  // Simpan Preferensi Metode Pembayaran Bawaan
  const handleDefaultPaymentMethodChange = (val) => {
    setDefaultPaymentMethod(val);
    if (typeof window !== "undefined") {
      localStorage.setItem("dompetku_default_payment_method", val);
    }
    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: `Metode pembayaran bawaan disimpan`,
      showConfirmButton: false,
      timer: 1500,
    });
  };

  // Tambah Kategori
  const handleFormAddCategory = (e) => {
    e.preventDefault();
    const trimmed = newCatName.trim();
    if (!trimmed) return;

    // Cek duplikasi
    const isDuplicate = allCategories.some(
      (c) => c.name.toLowerCase() === trimmed.toLowerCase() && c.type === newCatType
    );
    if (isDuplicate) {
      Swal.fire({
        icon: "warning",
        title: "Kategori Sudah Ada",
        text: `Kategori "${trimmed}" untuk jenis ${newCatType} sudah terdaftar.`,
        confirmButtonColor: "#059669",
      });
      return;
    }

    onAddCategory(trimmed, newCatType);
    setNewCatName("");
    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: `Kategori "${trimmed}" berhasil ditambahkan!`,
      showConfirmButton: false,
      timer: 1500,
    });
  };

  // Hitung jumlah pemakaian transaksi untuk tiap kategori
  const getCategoryUsageCount = (catName, catType) => {
    return transactions.filter(
      (t) => t.category?.toLowerCase() === catName.toLowerCase() && t.type === catType
    ).length;
  };

  // Hapus Kategori dengan Validasi Transaksi Aktif
  const handleAttemptDelete = (cat) => {
    const usageCount = getCategoryUsageCount(cat.name, cat.type);

    if (usageCount > 0) {
      Swal.fire({
        title: "Kategori Tidak Dapat Dihapus",
        text: `Kategori "${cat.name}" saat ini telah digunakan pada ${usageCount} transaksi aktif. Ubah atau hapus transaksi tersebut terlebih dahulu sebelum menghapus kategori ini.`,
        icon: "warning",
        confirmButtonColor: "#059669",
        confirmButtonText: "Mengerti",
      });
      return;
    }

    Swal.fire({
      title: "Hapus Kategori?",
      text: `Apakah kamu yakin ingin menghapus kategori "${cat.name}"?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#e11d48",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
    }).then((res) => {
      if (res.isConfirmed) {
        onDeleteCategory(cat.name, cat.type);
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: `Kategori "${cat.name}" berhasil dihapus.`,
          showConfirmButton: false,
          timer: 1500,
        });
      }
    });
  };

  // Edit Kategori
  const handleAttemptEdit = (cat) => {
    Swal.fire({
      title: `Ubah Nama Kategori`,
      text: `Masukkan nama baru untuk kategori "${cat.name}" (${cat.type}):`,
      input: "text",
      inputValue: cat.name,
      showCancelButton: true,
      confirmButtonColor: "#059669",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Simpan",
      cancelButtonText: "Batal",
      inputValidator: (value) => {
        if (!value || !value.trim()) {
          return "Nama kategori tidak boleh kosong!";
        }
      },
    }).then((result) => {
      if (result.isConfirmed) {
        const newName = result.value.trim();
        if (newName.toLowerCase() === cat.name.toLowerCase()) return;
        onEditCategory(cat.name, newName, cat.type);
      }
    });
  };

  // Ekspor Transaksi ke CSV (Excel Ready)
  const handleExportCSV = () => {
    if (!transactions || transactions.length === 0) {
      Swal.fire({
        icon: "info",
        title: "Belum Ada Transaksi",
        text: "Tidak ada riwayat transaksi yang dapat diekspor.",
        confirmButtonColor: "#059669",
      });
      return;
    }

    const headers = ["ID", "Tanggal", "Waktu", "Tipe", "Kategori", "Nominal (Rp)", "Metode Pembayaran", "Catatan"];
    const rows = transactions.map((t) => [
      `"${t.id || ""}"`,
      `"${t.date || ""}"`,
      `"${t.time || ""}"`,
      `"${t.type || ""}"`,
      `"${t.category || ""}"`,
      t.amount || 0,
      `"${t.payment_method || "cash"}"`,
      `"${(t.note || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `dompetku_transaksi_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: "Data transaksi berhasil diekspor ke format CSV!",
      showConfirmButton: false,
      timer: 2000,
    });
  };

  // Ekspor Cadangan Lengkap ke JSON
  const handleExportJSON = () => {
    const backupData = {
      appName: "DompetKu",
      version: "2.0",
      exportedAt: new Date().toISOString(),
      user: {
        email: user?.email || "pengguna",
        name: user?.user_metadata?.username || user?.email?.split("@")[0] || "Pengguna",
      },
      preferences: {
        monthlyBudgetLimit: monthlyBudgetLimit || 0,
        defaultCategory: selectedDefaultCategory,
        defaultPaymentMethod: defaultPaymentMethod,
        isPrivateMode: isPrivateMode,
      },
      allCategories: allCategories,
      customCategories: customCategories,
      transactions: transactions,
      savingGoals: goals,
      billings: billings,
    };

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(backupData, null, 2)
    )}`;
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", jsonString);
    downloadAnchor.setAttribute("download", `dompetku_backup_${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: "Cadangan data lengkap berhasil diunduh!",
      showConfirmButton: false,
      timer: 2000,
    });
  };

  // Kategori yang difilter
  const filteredCategories = useMemo(() => {
    return allCategories.filter((cat) => {
      const matchType = catFilter === "semua" ? true : cat.type === catFilter;
      const matchQuery = catSearchQuery.trim()
        ? cat.name.toLowerCase().includes(catSearchQuery.toLowerCase().trim())
        : true;
      return matchType && matchQuery;
    });
  }, [allCategories, catFilter, catSearchQuery]);

  return (
    <div className="w-full space-y-6">
      {/* Grid Status Ringkas (Sama seperti Dashboard & Pengeluaran) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card Batas Anggaran */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Batas Anggaran</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Icons.Banknote className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              {monthlyBudgetLimit ? formatRupiah(monthlyBudgetLimit, isPrivateMode) : "Rp 0"}
            </h2>
            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
              <span className="text-emerald-600 font-semibold">
                {budgetAnalytics.limitNum > 0 ? `${budgetAnalytics.percentUsed}% terpakai` : "Belum ditentukan"}
              </span>
              <span>bulan ini</span>
            </div>
          </div>
        </div>

        {/* Card Total Kategori */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Kategori</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Icons.Tag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              {allCategories.length} Kategori
            </h2>
            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
              <span className="text-blue-600 font-semibold">
                {allCategories.filter((c) => c.type === "pengeluaran").length} Pengeluaran
              </span>
              <span>• {allCategories.filter((c) => c.type === "pemasukan").length} Pemasukan</span>
            </div>
          </div>
        </div>

        {/* Card Total Transaksi */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Transaksi</span>
            <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
              <Icons.Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              {transactions.length} Transaksi
            </h2>
            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
              <span className="text-violet-600 font-semibold">Aktif tercatat</span>
              <span>dalam riwayat</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content: 2-Column Responsive Full Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ==================================================== */}
        {/* KOLOM KIRI: Batas Anggaran & Kelola Kategori Keuangan */}
        {/* ==================================================== */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          {/* Card 1: Batas Anggaran Bulanan & Realisasi */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Icons.Banknote className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Batas Anggaran Bulanan</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tentukan batas maksimal pengeluaran setiap bulan untuk mengendalikan finansialmu
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveBudget} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
              <div className="relative flex-1">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">
                  Rp
                </span>
                <input
                  type="text"
                  placeholder="Contoh: 5.000.000"
                  value={budgetInput}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, "");
                    setBudgetInput(clean ? new Intl.NumberFormat("id-ID").format(clean) : "");
                  }}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:outline-none focus:border-emerald-500 focus:bg-white transition"
                />
              </div>

              <button
                type="submit"
                className="inline-flex items-center justify-center px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-95 text-white rounded-full text-xs font-semibold transition shadow-xs cursor-pointer shrink-0"
              >
                Simpan Limit
              </button>
            </form>

            {/* Widget Pemantauan Realisasi Anggaran Bulan Berjalan */}
            {budgetAnalytics.limitNum > 0 && (
              <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[11px] text-slate-500 font-medium">Realisasi Pengeluaran Bulan Ini</span>
                    <p className="font-bold text-slate-900">
                      {formatRupiah(budgetAnalytics.thisMonthExpenses, isPrivateMode)}{" "}
                      <span className="text-slate-400 font-normal">/ {formatRupiah(budgetAnalytics.limitNum, isPrivateMode)}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        budgetAnalytics.isOver
                          ? "bg-rose-100 text-rose-700"
                          : budgetAnalytics.percentUsed >= 80
                          ? "bg-amber-100 text-amber-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {budgetAnalytics.actualPercent}% terpakai
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {budgetAnalytics.isOver
                        ? `Melebihi limit ${formatRupiah(budgetAnalytics.overAmount, isPrivateMode)}`
                        : `Sisa anggaran ${formatRupiah(budgetAnalytics.remaining, isPrivateMode)}`}
                    </p>
                  </div>
                </div>

                {/* Progress bar visual */}
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      budgetAnalytics.isOver
                        ? "bg-rose-500"
                        : budgetAnalytics.percentUsed >= 80
                        ? "bg-amber-500"
                        : "bg-gradient-to-r from-emerald-500 to-teal-500"
                    }`}
                    style={{ width: `${budgetAnalytics.percentUsed}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Card 2: Kelola Kategori Keuangan (Full Width & Clean) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Icons.Tag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Kelola Kategori Keuangan</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Kustomisasi kategori transaksi. Kategori yang sudah memiliki riwayat transaksi terlindungi dari penghapusan
                  </p>
                </div>
              </div>

              {/* Filter Tabs (Full Rounded & Gradient Hijau Saat Aktif) */}
              <div className="grid grid-cols-3 w-full sm:w-auto p-1 bg-slate-100 rounded-full text-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setCatFilter("semua")}
                  className={`py-1.5 px-3 sm:px-4 rounded-full text-xs font-semibold transition cursor-pointer text-center flex items-center justify-center whitespace-nowrap ${
                    catFilter === "semua"
                      ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Semua
                </button>
                <button
                  type="button"
                  onClick={() => setCatFilter("pengeluaran")}
                  className={`py-1.5 px-3 sm:px-4 rounded-full text-xs font-semibold transition cursor-pointer text-center flex items-center justify-center whitespace-nowrap ${
                    catFilter === "pengeluaran"
                      ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Pengeluaran
                </button>
                <button
                  type="button"
                  onClick={() => setCatFilter("pemasukan")}
                  className={`py-1.5 px-3 sm:px-4 rounded-full text-xs font-semibold transition cursor-pointer text-center flex items-center justify-center whitespace-nowrap ${
                    catFilter === "pemasukan"
                      ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Pemasukan
                </button>
              </div>
            </div>

            {/* Form Tambah Kategori Baru */}
            <form
              onSubmit={handleFormAddCategory}
              className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80 flex flex-wrap items-center gap-2.5"
            >
              <input
                type="text"
                required
                placeholder="Tulis nama kategori baru..."
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="flex-1 min-w-[170px] px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition"
              />
              <select
                value={newCatType}
                onChange={(e) => setNewCatType(e.target.value)}
                className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="pengeluaran">Pengeluaran</option>
                <option value="pemasukan">Pemasukan</option>
              </select>
              {/* Tombol Tambah Kategori (Full Rounded, Gradient Hijau, Tanpa Plus) */}
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-95 text-white rounded-full text-xs font-semibold transition shadow-xs cursor-pointer shrink-0"
              >
                <span>Tambah Kategori</span>
              </button>
            </form>

            {/* Search Kategori Bar */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Icons.Search className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                placeholder="Cari kategori..."
                value={catSearchQuery}
                onChange={(e) => setCatSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
              />
            </div>

            {/* Grid Kartu Kategori */}
            <div className="space-y-3 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {filteredCategories.map((cat, idx) => {
                  const usage = getCategoryUsageCount(cat.name, cat.type);
                  const isExpense = cat.type === "pengeluaran";

                  return (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-2xl flex items-center justify-between text-xs hover:border-slate-300 hover:bg-white transition group"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                              isExpense ? "bg-rose-500" : "bg-emerald-500"
                            }`}
                          />
                          <p className="font-semibold text-slate-800 truncate">{cat.name}</p>
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {usage > 0 ? `${usage} transaksi aktif` : "Belum terpakai"}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleAttemptEdit(cat)}
                          title="Ubah nama kategori"
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                        >
                          <Icons.Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAttemptDelete(cat)}
                          title={usage > 0 ? "Kategori tidak dapat dihapus karena sudah dipakai" : "Hapus kategori"}
                          className={`p-1.5 rounded-lg transition cursor-pointer ${
                            usage > 0
                              ? "text-slate-300 cursor-not-allowed hover:text-rose-400"
                              : "text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          }`}
                        >
                          <Icons.Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredCategories.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Tidak ada kategori yang cocok dengan pencarian.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ==================================================== */}
        {/* KOLOM KANAN: Preferensi Cepat, Cadangan & Akun */}
        {/* ==================================================== */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6">
          {/* Card 3: Preferensi Transaksi & Aplikasi (Fitur Baru Bermanfaat!) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Icons.Settings className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Preferensi Cepat</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Atur nilai bawaan saat menambah transaksi baru
                </p>
              </div>
            </div>

            <div className="space-y-4 pt-1">
              {/* Kategori Bawaan */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  Kategori Bawaan (Default)
                </label>
                <select
                  value={selectedDefaultCategory}
                  onChange={(e) => handleDefaultCategoryChange(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:border-emerald-500 focus:bg-white transition cursor-pointer"
                >
                  {allCategories.map((c, i) => (
                    <option key={i} value={c.name}>
                      {c.name} ({c.type})
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-400 block">
                  Kategori ini akan otomatis terpilih saat pertama membuka form transaksi.
                </span>
              </div>

              {/* Metode Pembayaran Bawaan */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  Metode Pembayaran Bawaan
                </label>
                <select
                  value={defaultPaymentMethod}
                  onChange={(e) => handleDefaultPaymentMethodChange(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:border-emerald-500 focus:bg-white transition cursor-pointer"
                >
                  {PAYMENT_METHODS.map((pm) => (
                    <option key={pm.id} value={pm.id}>
                      {pm.label}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-400 block">
                  Metode pembayaran utama yang paling sering kamu gunakan.
                </span>
              </div>

              {/* Mode Privasi Switch */}
              {togglePrivacyMode && (
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div className="space-y-0.5 pr-3">
                    <span className="text-xs font-semibold text-slate-800 block">Mode Privasi Saldo</span>
                    <span className="text-[10px] text-slate-400 block">
                      Menyamarkan nominal rupiah dengan bintang (Rp ••••••).
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={togglePrivacyMode}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      isPrivateMode ? "bg-emerald-600" : "bg-slate-200"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        isPrivateMode ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Card 4: Cadangan & Ekspor Data Finansial (Fitur Baru Bermanfaat!) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                <Icons.Download className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Cadangan & Ekspor Data</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Unduh salinan data keuanganmu agar selalu aman dan bisa diolah di Excel
                </p>
              </div>
            </div>

            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={handleExportCSV}
                className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-emerald-50/60 border border-slate-200 hover:border-emerald-200 rounded-2xl transition cursor-pointer text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white text-emerald-600 border border-slate-200 flex items-center justify-center shrink-0">
                    <Icons.FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-700 block">
                      Ekspor ke CSV (Excel)
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      {transactions.length} transaksi siap diolah di spreadsheet
                    </span>
                  </div>
                </div>
                <span className="text-slate-400 group-hover:text-emerald-600 transition">↓</span>
              </button>

              <button
                type="button"
                onClick={handleExportJSON}
                className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-emerald-50/60 border border-slate-200 hover:border-emerald-200 rounded-2xl transition cursor-pointer text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white text-emerald-600 border border-slate-200 flex items-center justify-center shrink-0">
                    <Icons.Download className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-700 block">
                      Cadangan Penuh (JSON)
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      Backup komprehensif transaksi, tabungan & tagihan
                    </span>
                  </div>
                </div>
                <span className="text-slate-400 group-hover:text-emerald-600 transition">↓</span>
              </button>
            </div>
          </div>

          {/* Card 5: Akun & Keamanan Data */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                <Icons.Shield className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Informasi Akun & Data</h3>
                <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[240px]">
                  {user?.email || "Tidak diketahui"}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-3">
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-rose-600">Pembersihan Penyimpanan Lokal</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Menghapus target tabungan, tagihan, dan batas anggaran yang disimpan di browser. Data transaksi di database cloud tetap aman.
                </p>
              </div>

              <div>
                <button
                  type="button"
                  onClick={onResetAllData}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-700 border border-rose-200 rounded-full text-xs font-semibold transition cursor-pointer"
                >
                  Reset Data Lokal
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
