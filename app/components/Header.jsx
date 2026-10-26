"use client";

import React from "react";
import { Icons } from "./Icons";

export default function Header({
  activeTab,
  searchQuery,
  setSearchQuery,
  isPrivateMode,
  togglePrivacyMode,
  onOpenAddModal,
  onOpenBulkModal,
  setIsSidebarOpen,
}) {
  const getTabTitle = (tab) => {
    switch (tab) {
      case "dashboard":
        return {
          title: "Dashboard",
          subtitle: "Pantau, evaluasi, dan tingkatkan performa finansialmu",
        };
      case "pengeluaran":
      case "riwayat":
        return {
          title: "Pengeluaran",
          subtitle: "Rekapan lengkap pengeluaran, analisis kategori, dan riwayat mutasi",
        };
      case "saving-goals":
        return {
          title: "Target Tabungan",
          subtitle: "Wujudkan impian finansial dan alokasi dana secara konsisten",
        };
      case "billing-reminder":
        return {
          title: "Pengingat Tagihan & Hutang",
          subtitle: "Kelola jatuh tempo tagihan rutin, hutang, dan piutang",
        };
      case "financial-calendar":
        return {
          title: "Kalender Finansial",
          subtitle: "Jadwal dan sebaran mutasi harian dalam bentuk kalender visual",
        };
      case "financial-calculator":
        return {
          title: "Kalkulator Finansial",
          subtitle: "Simulasi dana darurat, target waktu menabung, dan aturan 50/30/20",
        };
      case "split-bill":
        return {
          title: "Bagi Tagihan (Split Bill)",
          subtitle: "Hitung pembagian patungan makan atau acara bersama teman",
        };
      case "settings":
        return {
          title: "Pengaturan & Kategori",
          subtitle: "Kelola batas anggaran bulanan dan kustomisasi kategori",
        };
      default:
        return {
          title: "Keuangan Pribadi",
          subtitle: "Kelola keuangan harian secara praktis dan teratur",
        };
    }
  };

  const { title, subtitle } = getTabTitle(activeTab);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
      {/* Title & Mobile Toggle */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="lg:hidden p-2 -ml-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 active:scale-95 rounded-xl transition cursor-pointer"
          aria-label="Buka menu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="lg:hidden w-7 h-7 flex items-center justify-center shrink-0">
          <Icons.Logo className="w-full h-full" />
        </div>

        <div>
          <h1 className="text-base sm:text-lg font-semibold text-slate-900 tracking-tight leading-tight">
            {title}
          </h1>
          <p className="text-xs text-slate-400 font-normal hidden sm:block">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-2.5 ml-auto md:ml-0 w-full md:w-auto justify-end">
        {/* Privacy Mode Toggle */}
        <button
          onClick={togglePrivacyMode}
          title={isPrivateMode ? "Tampilkan Nominal Saldo" : "Sembunyikan Saldo (Mode Privasi)"}
          className={`w-8 h-8 rounded-full text-xs font-medium active:scale-95 transition flex items-center justify-center shrink-0 cursor-pointer ${
            isPrivateMode
              ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
              : "bg-slate-100 hover:bg-slate-200 text-slate-600"
          }`}
        >
          {isPrivateMode ? (
            <Icons.EyeOff className="w-4 h-4" />
          ) : (
            <Icons.Eye className="w-4 h-4" />
          )}
        </button>

        {/* Bulk Action Button */}
        <button
          onClick={onOpenBulkModal}
          title="Catat Massal Beberapa Transaksi Sekaligus"
          className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-xs font-medium rounded-full transition cursor-pointer"
        >
          <Icons.Receipt className="w-3.5 h-3.5 text-slate-500" />
          <span>Catat Massal</span>
        </button>

        {/* Primary CTA: Catat Transaksi (Gradien Hijau & Rounded Full) */}
        <button
          onClick={onOpenAddModal}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-95 text-white text-xs font-medium rounded-full shadow-xs hover:shadow transition cursor-pointer"
        >
          <Icons.Plus className="w-3.5 h-3.5" />
          <span>Catat Transaksi</span>
        </button>
      </div>
    </header>
  );
}
