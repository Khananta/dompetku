"use client";

import React, { useState, useMemo } from "react";
import { formatRupiah } from "./utils";
import { Icons } from "./Icons";

export default function BillingsView({
  billings,
  isPrivateMode,
  onOpenNewBillModal,
  onMarkAsPaid,
  onDeleteBill,
}) {
  const [statusFilter, setStatusFilter] = useState("belum_bayar"); // "semua" | "belum_bayar" | "lunas"
  const [typeFilter, setTypeFilter] = useState("semua"); // "semua" | "biasa" | "hutang" | "piutang"

  // Filter Data
  const filteredBillings = useMemo(() => {
    return billings.filter((b) => {
      if (statusFilter !== "semua" && b.status !== statusFilter) return false;
      if (typeFilter !== "semua" && b.billing_type !== typeFilter) return false;
      return true;
    });
  }, [billings, statusFilter, typeFilter]);

  // Ringkasan 3 Kategori yang Jelas & Informatif (Menghilangkan kartu kosong)
  const regularBillsTotal = useMemo(() => {
    return billings
      .filter((b) => b.status === "belum_bayar" && b.billing_type === "biasa")
      .reduce((s, b) => s + (Number(b.amount) || 0), 0);
  }, [billings]);

  const hutangTotal = useMemo(() => {
    return billings
      .filter((b) => b.status === "belum_bayar" && b.billing_type === "hutang")
      .reduce((s, b) => s + (Number(b.amount) || 0), 0);
  }, [billings]);

  const piutangTotal = useMemo(() => {
    return billings
      .filter((b) => b.status === "belum_bayar" && b.billing_type === "piutang")
      .reduce((s, b) => s + (Number(b.amount) || 0), 0);
  }, [billings]);

  // Due date indicator
  const getDueBadge = (dueDate, status) => {
    if (status === "lunas") {
      return {
        label: "Lunas",
        color: "bg-emerald-50 text-emerald-700 border-emerald-200",
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
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
        label: "Jatuh Tempo Hari Ini",
        color: "bg-amber-50 text-amber-700 border-amber-200",
      };
    }
    if (diffDays <= 3) {
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

  return (
    <div className="space-y-6">
      {/* ========================================================
      // 1. TOP 3 STATS CARDS (KONSISTEN DENGAN DASHBOARD & PENGELUARAN)
      // ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Tagihan Rutin */}
        <div 
          onClick={() => setTypeFilter((prev) => (prev === "biasa" ? "semua" : "biasa"))}
          title="Klik untuk filter Tagihan Rutin"
          className={`bg-white p-5 rounded-2xl border shadow-xs flex flex-col justify-between transition cursor-pointer hover:shadow-md ${
            typeFilter === "biasa" ? "border-blue-500 ring-2 ring-blue-100" : "border-slate-200/80 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Tagihan Rutin Tertunda</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Icons.Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              {formatRupiah(regularBillsTotal, isPrivateMode)}
            </h2>
            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
              <span className="text-blue-600 font-semibold">
                {billings.filter((b) => b.status === "belum_bayar" && b.billing_type === "biasa").length} Tagihan
              </span>
              <span>• Listrik, WiFi, Kost, dll.</span>
            </div>
          </div>
        </div>

        {/* Card 2: Hutang Saya */}
        <div 
          onClick={() => setTypeFilter((prev) => (prev === "hutang" ? "semua" : "hutang"))}
          title="Klik untuk filter Hutang Saya"
          className={`bg-white p-5 rounded-2xl border shadow-xs flex flex-col justify-between transition cursor-pointer hover:shadow-md ${
            typeFilter === "hutang" ? "border-rose-500 ring-2 ring-rose-100" : "border-slate-200/80 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Hutang Saya (Wajib Bayar)</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Icons.TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl font-bold text-rose-600 tracking-tight">
              {formatRupiah(hutangTotal, isPrivateMode)}
            </h2>
            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
              <span className="text-rose-600 font-semibold">
                {billings.filter((b) => b.status === "belum_bayar" && b.billing_type === "hutang").length} Pinjaman
              </span>
              <span>• Kewajiban ke orang lain</span>
            </div>
          </div>
        </div>

        {/* Card 3: Piutang Saya */}
        <div 
          onClick={() => setTypeFilter((prev) => (prev === "piutang" ? "semua" : "piutang"))}
          title="Klik untuk filter Piutang Saya"
          className={`bg-white p-5 rounded-2xl border shadow-xs flex flex-col justify-between transition cursor-pointer hover:shadow-md ${
            typeFilter === "piutang" ? "border-emerald-500 ring-2 ring-emerald-100" : "border-slate-200/80 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Piutang (Uang di Orang Lain)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Icons.TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl font-bold text-emerald-600 tracking-tight">
              {formatRupiah(piutangTotal, isPrivateMode)}
            </h2>
            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
              <span className="text-emerald-600 font-semibold">
                {billings.filter((b) => b.status === "belum_bayar" && b.billing_type === "piutang").length} Tagihan
              </span>
              <span>• Dana yang dipinjam pihak lain</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
      // 2. TOOLBAR FILTER & TOMBOL AKSI (PERSIS TARGET TABUNGAN)
      // ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        {/* Status Filter Tabs (Belum Bayar & Lunas) - Full Width Mengikuti Container di Mobile */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-full text-xs font-medium w-full sm:w-auto text-center">
          <button
            type="button"
            onClick={() => setStatusFilter("belum_bayar")}
            className={`py-2 px-4 rounded-full transition-all active:scale-95 cursor-pointer text-center ${
              statusFilter === "belum_bayar"
                ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Belum Bayar
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("lunas")}
            className={`py-2 px-4 rounded-full transition-all active:scale-95 cursor-pointer text-center ${
              statusFilter === "lunas"
                ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Lunas
          </button>
        </div>

        {/* Tombol + Tambah Tagihan - Full Width Mengikuti Container di Mobile */}
        <div className="w-full sm:w-auto">
          <button
            type="button"
            onClick={onOpenNewBillModal}
            className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-95 text-white rounded-full text-xs font-semibold transition shadow-xs hover:shadow cursor-pointer text-center whitespace-nowrap"
          >
            <span>+ Tambah Tagihan</span>
          </button>
        </div>
      </div>

      {/* Active Type Filter Chip Bar (Jika ada filter kategori aktif dari klik kartu statistik) */}
      {typeFilter !== "semua" && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-white border border-slate-200/80 rounded-2xl text-xs shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-slate-600">
              Filter kategori aktif: <strong className="text-slate-900 font-semibold">{
                typeFilter === "biasa" ? "Tagihan Rutin" : typeFilter === "hutang" ? "Hutang Saya" : "Piutang (Dipinjam)"
              }</strong>
            </span>
          </div>
          <button
            type="button"
            onClick={() => setTypeFilter("semua")}
            className="text-emerald-600 hover:text-emerald-700 font-semibold text-xs cursor-pointer hover:underline"
          >
            Reset Filter
          </button>
        </div>
      )}

      {/* ========================================================
      // 3. DAFTAR TAGIHAN (CARDS MODERN)
      // ======================================================== */}
      {filteredBillings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBillings.map((bill) => {
            const isPaid = bill.status === "lunas";
            const dueInfo = getDueBadge(bill.due_date, bill.status);

            const typeLabel =
              bill.billing_type === "hutang"
                ? `Hutang ke ${bill.person_name || "Orang"}`
                : bill.billing_type === "piutang"
                ? `Dipinjam oleh ${bill.person_name || "Orang"}`
                : "Tagihan Rutin";

            return (
              <div
                key={bill.id}
                className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 transition"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                        {typeLabel}
                      </span>
                      <h4 className="text-sm font-semibold text-slate-900 mt-0.5">
                        {bill.bill_name}
                      </h4>
                    </div>

                    <button
                      onClick={() => onDeleteBill(bill.id)}
                      title="Hapus"
                      className="text-slate-300 hover:text-rose-500 p-1 rounded-lg hover:bg-rose-50 transition"
                    >
                      <Icons.Trash className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="mt-3 flex items-baseline justify-between">
                    <span className="text-lg font-bold text-slate-900">
                      {formatRupiah(bill.amount, isPrivateMode)}
                    </span>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${dueInfo.color}`}>
                      {dueInfo.label}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 mt-2">
                    Jatuh tempo: <strong className="text-slate-600 font-medium">{bill.due_date}</strong>
                  </p>
                </div>

                {/* Bottom Action */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">
                    {isPaid ? "Tercatat lunas di saldo" : "Belum diselesaikan"}
                  </span>
                  {!isPaid && (
                    <button
                      type="button"
                      onClick={() => onMarkAsPaid(bill)}
                      className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-95 text-white text-xs font-semibold rounded-full transition flex items-center gap-1.5 shadow-xs hover:shadow cursor-pointer"
                    >
                      <Icons.Check className="w-3.5 h-3.5" />
                      <span>{bill.billing_type === "piutang" ? "Terima Bayaran" : "Tandai Lunas"}</span>
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
            <Icons.Bell className="w-6 h-6" />
          </div>
          <p className="text-sm font-medium text-slate-700 mt-2">Tidak ada tagihan pada filter ini</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Semua tagihan rutin atau hutang piutangmu sudah terkendali dengan baik.
          </p>
          <button
            type="button"
            onClick={onOpenNewBillModal}
            className="mt-4 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-95 text-white rounded-full text-xs font-semibold transition shadow-xs hover:shadow cursor-pointer"
          >
            <span>+ Tambah Tagihan</span>
          </button>
        </div>
      )}
    </div>
  );
}
