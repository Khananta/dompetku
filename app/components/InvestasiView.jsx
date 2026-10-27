"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Icons } from "./Icons";
import { formatRupiah } from "./utils";

// Helper SVG Mini Sparkline (Trading-style mini chart)
function MiniSparkline({ data = [], isPositive = true, width = 110, height = 32 }) {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data
    .map((val, idx) => {
      const x = (idx / (data.length - 1)) * (width - 4) + 2;
      const y = height - 4 - ((val - min) / range) * (height - 8);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const strokeColor = isPositive ? "#10b981" : "#f43f5e";
  const fillColor = isPositive ? "rgba(16, 185, 129, 0.12)" : "rgba(244, 63, 94, 0.12)";

  const firstX = 2;
  const lastX = width - 2;
  const bottomY = height;
  const areaPoints = `${firstX},${bottomY} ${points} ${lastX},${bottomY}`;

  return (
    <svg width={width} height={height} className="overflow-visible shrink-0">
      <polygon points={areaPoints} fill={fillColor} />
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

export default function InvestasiView({ isPrivateMode = false }) {
  const [marketData, setMarketData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdatedTime, setLastUpdatedTime] = useState("");

  // Mode Tampilan Utama: "market" (Daftar Pasar & Harga) | "calculator" (Kalkulator Simulasi)
  const [viewMode, setViewMode] = useState("market");

  // Tab Kategori Instrumen: "semua" | "saham" | "reksadana" | "crypto" | "komoditas"
  const [activeTab, setActiveTab] = useState("semua");
  const [searchQuery, setSearchQuery] = useState("");

  // State Kalkulator Simulasi Investasi
  const [simInstrument, setSimInstrument] = useState("BBCA");
  const [simInitialDeposit, setSimInitialDeposit] = useState("1.000.000");
  const [simMonthlyDeposit, setSimMonthlyDeposit] = useState("500.000");
  const [simYears, setSimYears] = useState(3);
  const [simExpectedReturn, setSimExpectedReturn] = useState(11.5); // % per tahun

  // Fetch Data Live dari API Handler
  const fetchInvestmentData = useCallback(async (manual = false) => {
    if (manual) setIsRefreshing(true);
    else setLoading(true);

    try {
      const res = await fetch("/api/investments");
      if (res.ok) {
        const data = await res.json();
        setMarketData(data);
        const now = new Date();
        setLastUpdatedTime(
          now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
        );
      }
    } catch (e) {
      console.error("Gagal memuat data pasar:", e);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchInvestmentData(false);
  }, [fetchInvestmentData]);

  // Gabungkan semua aset untuk tabel trading
  const allInstruments = useMemo(() => {
    if (!marketData) return [];
    const list = [];

    // 1. Saham IDX
    if (marketData.stocks) {
      marketData.stocks.forEach((s) => {
        list.push({
          id: `stock-${s.code}`,
          code: s.code,
          name: s.name,
          category: "saham",
          categoryLabel: "Saham IDX",
          categoryBadge: "bg-blue-50 text-blue-700 border-blue-200",
          subtext: `${s.sector} • P/E ${s.pe}x`,
          price: s.price,
          unit: "lembar",
          change: s.change || 0,
          changePercent: s.changePercent || 0,
          high: s.high,
          low: s.low,
          volume: s.volume,
          sparkline: s.sparkline,
          defaultReturn: 11.5,
          risk: "Sedang - Tinggi",
        });
      });
    }

    // 2. Reksadana
    if (marketData.mutualFunds) {
      marketData.mutualFunds.forEach((m) => {
        list.push({
          id: `mf-${m.code}`,
          code: m.code,
          name: m.name,
          category: "reksadana",
          categoryLabel: `Reksadana ${m.type}`,
          categoryBadge: "bg-emerald-50 text-emerald-700 border-emerald-200",
          subtext: `${m.manager} • Return 1Y: +${m.return1Y}%`,
          price: m.nav,
          unit: "unit",
          change: m.change || 0,
          changePercent: m.changePercent || 0,
          high: null,
          low: null,
          volume: `AUM ${m.aum}`,
          return1Y: m.return1Y,
          sparkline: m.sparkline,
          defaultReturn: m.return1Y || 6.5,
          risk: m.risk,
        });
      });
    }

    // 3. Kripto
    if (marketData.crypto) {
      marketData.crypto.forEach((c) => {
        list.push({
          id: `crypto-${c.code}`,
          code: c.code,
          name: c.name,
          category: "crypto",
          categoryLabel: "Kripto",
          categoryBadge: "bg-violet-50 text-violet-700 border-violet-200",
          subtext: `${c.symbol} • Vol ${c.volume}`,
          price: c.price,
          unit: "koin",
          change: c.price * (c.changePercent / 100),
          changePercent: c.changePercent || 0,
          high: c.high,
          low: c.low,
          volume: c.volume,
          sparkline: c.sparkline,
          defaultReturn: 16.0,
          risk: "Sangat Tinggi",
        });
      });
    }

    // 4. Komoditas / Logam
    if (marketData.commodities) {
      marketData.commodities.forEach((cm) => {
        list.push({
          id: `com-${cm.code}`,
          code: cm.code,
          name: cm.name,
          category: "komoditas",
          categoryLabel: "Logam Mulia",
          categoryBadge: "bg-amber-50 text-amber-700 border-amber-200",
          subtext: cm.buybackPrice ? `Buyback: ${formatRupiah(cm.buybackPrice, isPrivateMode)}` : "Komoditas Fisik",
          price: cm.price,
          unit: cm.unit,
          change: cm.change || 0,
          changePercent: cm.changePercent || 0,
          high: null,
          low: null,
          volume: "Fisik / Gram",
          sparkline: cm.sparkline,
          defaultReturn: 9.0,
          risk: "Rendah",
        });
      });
    }

    return list;
  }, [marketData, isPrivateMode]);

  // Filter daftar aset sesuai tab aktif & search
  const filteredInstruments = useMemo(() => {
    return allInstruments.filter((item) => {
      const matchTab = activeTab === "semua" ? true : item.category === activeTab;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = q
        ? item.name.toLowerCase().includes(q) || item.code.toLowerCase().includes(q)
        : true;
      return matchTab && matchSearch;
    });
  }, [allInstruments, activeTab, searchQuery]);

  // Instrumen aktif yang sedang dipilih di kalkulator
  const activeSimInstrument = useMemo(() => {
    return allInstruments.find((it) => it.code === simInstrument) || allInstruments[0] || null;
  }, [allInstruments, simInstrument]);

  // Handler Pilih Instrumen untuk Kalkulator (Langsung Beralih ke Tampilan Kalkulator di Atas!)
  const handleSelectForSim = (item) => {
    setSimInstrument(item.code);
    if (item.defaultReturn) setSimExpectedReturn(item.defaultReturn);
    setViewMode("calculator");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Kalkulasi Simulasi Investasi Komprehensif (Bunga Majemuk / DCA)
  const simResult = useMemo(() => {
    const init = Number(simInitialDeposit.replace(/\D/g, "")) || 0;
    const monthly = Number(simMonthlyDeposit.replace(/\D/g, "")) || 0;
    const annualRate = Number(simExpectedReturn || 0) / 100;
    const rateMonthly = annualRate / 12;
    const totalMonths = simYears * 12;

    let totalPrincipal = init + monthly * totalMonths;
    let futureValue = init * Math.pow(1 + rateMonthly, totalMonths);

    for (let m = 1; m <= totalMonths; m++) {
      futureValue += monthly * Math.pow(1 + rateMonthly, totalMonths - m);
    }

    futureValue = Math.round(futureValue);
    const profit = Math.max(0, futureValue - totalPrincipal);
    const returnPercent = totalPrincipal > 0 ? ((profit / totalPrincipal) * 100).toFixed(1) : 0;
    const multiplier = totalPrincipal > 0 ? (futureValue / totalPrincipal).toFixed(2) : "1.00";

    // Hitung milestone tahunan (Tahun 1, 2, 3... hingga simYears)
    const yearlyMilestones = [];
    for (let y = 1; y <= simYears; y++) {
      const yMonths = y * 12;
      let yPrincipal = init + monthly * yMonths;
      let yFV = init * Math.pow(1 + rateMonthly, yMonths);
      for (let m = 1; m <= yMonths; m++) {
        yFV += monthly * Math.pow(1 + rateMonthly, yMonths - m);
      }
      yFV = Math.round(yFV);
      const yProfit = Math.max(0, yFV - yPrincipal);
      yearlyMilestones.push({
        year: y,
        principal: yPrincipal,
        futureValue: yFV,
        profit: yProfit,
        profitPercent: yPrincipal > 0 ? ((yProfit / yPrincipal) * 100).toFixed(1) : 0,
      });
    }

    return {
      totalPrincipal,
      futureValue,
      profit,
      returnPercent,
      multiplier,
      yearlyMilestones,
    };
  }, [simInitialDeposit, simMonthlyDeposit, simExpectedReturn, simYears]);

  return (
    <div className="w-full space-y-6">
      {/* 4 Kartu Summary Atas (Format Identik dengan Dashboard & Pengeluaran) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Indeks IHSG */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">IHSG (Bursa Saham)</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Icons.TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              {marketData?.indices?.ihsg?.price
                ? new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(marketData.indices.ihsg.price)
                : "7.285,45"}
            </h2>
            <div className="mt-2 flex items-center gap-1.5 text-[11px]">
              <span
                className={`font-semibold px-2 py-0.5 rounded-md ${
                  (marketData?.indices?.ihsg?.changePercent || 0) >= 0
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-rose-50 text-rose-700"
                }`}
              >
                {(marketData?.indices?.ihsg?.changePercent || 0) >= 0 ? "+" : ""}
                {marketData?.indices?.ihsg?.changePercent || 0.44}%
              </span>
              <span className="text-slate-400">Sesi Reguler IDX</span>
            </div>
          </div>
        </div>

        {/* Card 2: Emas Fisik Antam */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Emas Antam (1 Gram)</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Icons.Banknote className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              {formatRupiah(marketData?.indices?.gold?.price || 2657000, isPrivateMode)}
            </h2>
            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
              <span className="text-amber-600 font-semibold">
                {(marketData?.indices?.gold?.changePercent || 0) >= 0 ? "+" : ""}
                {marketData?.indices?.gold?.changePercent || 0.45}%
              </span>
              <span>
                Buyback {formatRupiah(marketData?.indices?.gold?.buybackPrice || 2403000, isPrivateMode)}
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Bitcoin IDR */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Bitcoin (BTC / IDR)</span>
            <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
              <Icons.Globe className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              {formatRupiah(marketData?.crypto?.[0]?.price || 1450000000, isPrivateMode)}
            </h2>
            <div className="mt-2 flex items-center gap-1.5 text-[11px]">
              <span
                className={`font-semibold px-2 py-0.5 rounded-md ${
                  (marketData?.crypto?.[0]?.changePercent || 0) >= 0
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-rose-50 text-rose-700"
                }`}
              >
                {(marketData?.crypto?.[0]?.changePercent || 0) >= 0 ? "+" : ""}
                {marketData?.crypto?.[0]?.changePercent || -0.82}%
              </span>
              <span className="text-slate-400">24 Jam Terakhir</span>
            </div>
          </div>
        </div>

        {/* Card 4: Rata-rata Return Reksadana */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Rata-rata Reksadana 1Y</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Icons.ChartPie className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl font-bold text-emerald-600 tracking-tight">+7,8% / tahun</h2>
            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
              <span className="text-slate-700 font-semibold">6 Produk Unggulan</span>
              <span>Pasar Uang & Obligasi</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigasi Mode Tampilan: [Pasar & Harga Aset] vs [Kalkulator Simulasi] */}
      {/* Solusi UX Terbaik: Menempatkan Kalkulator langsung dapat diakses dari atas tanpa harus scroll ke bawah! */}
      <div className="flex items-center justify-between gap-3 pb-1 border-b border-slate-200/60">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-full">
          <button
            type="button"
            onClick={() => setViewMode("market")}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
              viewMode === "market"
                ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Icons.TrendingUp className="w-3.5 h-3.5" />
            <span>Pasar & Harga Aset</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("calculator")}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
              viewMode === "calculator"
                ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Icons.Calculator className="w-3.5 h-3.5" />
            <span>Kalkulator Simulasi</span>
          </button>
        </div>

        {lastUpdatedTime && (
          <span className="text-[11px] text-slate-400 hidden sm:inline-block">
            Pembaruan: <strong className="text-slate-700">{lastUpdatedTime}</strong>
          </span>
        )}
      </div>

      {/* ================================================================= */}
      {/* TAMPILAN 1: PASAR & HARGA ASET (TRADING TABLE) */}
      {/* ================================================================= */}
      {viewMode === "market" && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
          {/* Header & Filter Tabs (Dengan Tombol Refresh Ikon di Kanan Komoditas & Emas) */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Daftar Harga Instrumen Terkini</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Pantau harga real-time dan klik &quot;Simulasi&quot; untuk menguji proyeksi portofolio
              </p>
            </div>

            {/* Filter Tabs + Icon Refresh Button di Kanan Komoditas & Emas */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-full overflow-x-auto shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab("semua")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer shrink-0 ${
                  activeTab === "semua"
                    ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("saham")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer shrink-0 ${
                  activeTab === "saham"
                    ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Saham IDX
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("reksadana")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer shrink-0 ${
                  activeTab === "reksadana"
                    ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Reksadana
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("crypto")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer shrink-0 ${
                  activeTab === "crypto"
                    ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Kripto
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("komoditas")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer shrink-0 ${
                  activeTab === "komoditas"
                    ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Komoditas & Emas
              </button>

              {/* Tombol Refresh (Hanya Ikon, Tepat di Kanan Komoditas & Emas) */}
              <button
                type="button"
                onClick={() => fetchInvestmentData(true)}
                disabled={isRefreshing}
                className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-white rounded-full transition cursor-pointer shrink-0 disabled:opacity-50"
                title={`Perbarui data pasar${lastUpdatedTime ? ` (Terakhir: ${lastUpdatedTime})` : ""}`}
              >
                <Icons.RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-emerald-600" : ""}`} />
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <Icons.Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Cari instrumen (contoh: BBCA, Sucorinvest, Bitcoin, Emas, dll)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
            />
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-3">Instrumen</th>
                  <th className="py-3 px-3">Kategori</th>
                  <th className="py-3 px-3 text-right">Harga / Nilai NAV</th>
                  <th className="py-3 px-3 text-right">Perubahan 24 Jam</th>
                  <th className="py-3 px-3 text-center hidden md:table-cell">Tren 7 Hari</th>
                  <th className="py-3 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredInstruments.map((item) => {
                  const isPositive = item.changePercent >= 0;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition">
                      {/* Kode & Nama */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center justify-center font-bold text-xs text-slate-800 shrink-0">
                            {item.code.substring(0, 4)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate">{item.name}</p>
                            <span className="text-[11px] text-slate-400 block truncate">{item.subtext}</span>
                          </div>
                        </div>
                      </td>

                      {/* Kategori Badge */}
                      <td className="py-3.5 px-3">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${item.categoryBadge}`}>
                          {item.categoryLabel}
                        </span>
                      </td>

                      {/* Harga Sekarang */}
                      <td className="py-3.5 px-3 text-right font-bold text-slate-900">
                        {formatRupiah(item.price, isPrivateMode)}
                        <span className="text-[10px] text-slate-400 block font-normal">/{item.unit}</span>
                      </td>

                      {/* Perubahan % */}
                      <td className="py-3.5 px-3 text-right">
                        <span
                          className={`inline-flex items-center gap-1 font-bold ${
                            isPositive ? "text-emerald-600" : "text-rose-600"
                          }`}
                        >
                          {isPositive ? "▲ +" : "▼ "}
                          {item.changePercent.toFixed(2)}%
                        </span>
                        {item.change !== 0 && (
                          <span className="text-[10px] text-slate-400 block">
                            {isPositive ? "+" : ""}
                            {formatRupiah(Math.round(item.change), isPrivateMode)}
                          </span>
                        )}
                      </td>

                      {/* Mini Sparkline Chart */}
                      <td className="py-3.5 px-3 text-center hidden md:table-cell">
                        <div className="flex justify-center">
                          <MiniSparkline data={item.sparkline} isPositive={isPositive} width={100} height={30} />
                        </div>
                      </td>

                      {/* Tombol Simulasi: Mengarahkan Langsung ke Tampilan Kalkulator di Atas */}
                      <td className="py-3.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleSelectForSim(item)}
                          className="inline-flex items-center px-3.5 py-1.5 bg-slate-100 hover:bg-emerald-500 hover:text-white text-slate-700 active:scale-95 rounded-full text-[11px] font-semibold transition cursor-pointer"
                        >
                          Simulasi
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredInstruments.length === 0 && (
              <div className="text-center py-10 text-slate-400 text-xs">
                Tidak ada instrumen yang sesuai dengan pencarian &quot;{searchQuery}&quot;.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* TAMPILAN 2: KALKULATOR SIMULASI (LANGSUNG DITAMPILKAN DI ATAS DENGAN UX PRIMA) */}
      {/* ================================================================= */}
      {viewMode === "calculator" && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Icons.Calculator className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Kalkulator Simulasi</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Proyeksi pertumbuhan dana dengan strategi menabung rutin (*Dollar Cost Averaging*) dan bunga majemuk
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Form Input Simulasi (Kolom Kiri 5 col) */}
            <div className="lg:col-span-5 p-5 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-4">
              {/* Pilihan Instrumen & Preview Badge */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">Instrumen Acuan</label>
                <select
                  value={simInstrument}
                  onChange={(e) => {
                    setSimInstrument(e.target.value);
                    const found = allInstruments.find((it) => it.code === e.target.value);
                    if (found && found.defaultReturn) {
                      setSimExpectedReturn(found.defaultReturn);
                    }
                  }}
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:border-emerald-500 transition cursor-pointer"
                >
                  {allInstruments.map((it) => (
                    <option key={it.id} value={it.code}>
                      {it.code} - {it.name} ({it.categoryLabel})
                    </option>
                  ))}
                </select>

                {/* Badge info instrumen aktif */}
                {activeSimInstrument && (
                  <div className="flex items-center justify-between text-[11px] p-2 bg-white border border-slate-200/80 rounded-xl">
                    <span className="text-slate-500">Harga Sekarang:</span>
                    <span className="font-bold text-slate-900">
                      {formatRupiah(activeSimInstrument.price, isPrivateMode)} / {activeSimInstrument.unit}
                    </span>
                    <span className="text-emerald-700 font-medium">Risiko {activeSimInstrument.risk || "Moderat"}</span>
                  </div>
                )}
              </div>

              {/* Modal Awal + Quick Chips */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">Modal Awal Pertama</label>
                  <span className="text-[10px] text-slate-400">Bisa diisi Rp 0</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">Rp</span>
                  <input
                    type="text"
                    value={simInitialDeposit}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/\D/g, "");
                      setSimInitialDeposit(clean ? new Intl.NumberFormat("id-ID").format(clean) : "");
                    }}
                    className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:border-emerald-500 transition"
                    placeholder="0"
                  />
                </div>
                {/* Quick Chips Modal Awal */}
                <div className="flex items-center gap-1.5 pt-0.5">
                  {[0, 500000, 1000000, 5000000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setSimInitialDeposit(amt === 0 ? "0" : new Intl.NumberFormat("id-ID").format(amt))}
                      className="px-2.5 py-0.5 bg-white border border-slate-200 hover:border-emerald-500 text-[10px] font-medium text-slate-600 rounded-lg transition cursor-pointer"
                    >
                      {amt === 0 ? "Rp 0" : `${amt / 1000}rb`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tabungan Rutin Bulanan + Quick Chips */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">Rencana Setoran Rutin Bulanan</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">Rp</span>
                  <input
                    type="text"
                    value={simMonthlyDeposit}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/\D/g, "");
                      setSimMonthlyDeposit(clean ? new Intl.NumberFormat("id-ID").format(clean) : "");
                    }}
                    className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:border-emerald-500 transition"
                    placeholder="500.000"
                  />
                </div>
                {/* Quick Chips Setoran Bulanan */}
                <div className="flex items-center gap-1.5 pt-0.5">
                  {[100000, 500000, 1000000, 2000000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setSimMonthlyDeposit(new Intl.NumberFormat("id-ID").format(amt))}
                      className="px-2.5 py-0.5 bg-white border border-slate-200 hover:border-emerald-500 text-[10px] font-medium text-slate-600 rounded-lg transition cursor-pointer"
                    >
                      {`${amt / 1000}rb`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Estimasi Return Tahunan */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">Estimasi Return per Tahun</label>
                  <span className="text-xs font-bold text-emerald-600">{simExpectedReturn}% / thn</span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="30"
                  step="0.5"
                  value={simExpectedReturn}
                  onChange={(e) => setSimExpectedReturn(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Konservatif (4%)</span>
                  <span>Moderat (10%)</span>
                  <span>Agresif (20%+)</span>
                </div>
              </div>

              {/* Pilihan Jangka Waktu */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-semibold text-slate-700 block">Jangka Waktu Investasi</label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 3, 5, 10].map((yr) => (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => setSimYears(yr)}
                      className={`py-1.5 text-xs font-semibold rounded-full transition cursor-pointer ${
                        simYears === yr
                          ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xs"
                          : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {yr} Tahun
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Hasil Proyeksi & Timeline Milestone (Kolom Kanan 7 col) */}
            <div className="lg:col-span-7 space-y-4">
              {/* Kartu Dark Trading Style */}
              <div className="p-4 sm:p-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-700/80">
                  <div className="min-w-0">
                    <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block">
                      Proyeksi Nilai Akhir ({simYears} Tahun)
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 truncate">
                      {formatRupiah(simResult.futureValue, isPrivateMode)}
                    </h2>
                  </div>
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-1.5 sm:gap-1 shrink-0">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 whitespace-nowrap">
                      +{simResult.returnPercent}% ROI
                    </span>
                    <span className="text-[11px] text-slate-400 whitespace-nowrap">
                      {simResult.multiplier}x lipat modal
                    </span>
                  </div>
                </div>

                {/* 2 Kotak Ringkasan (Atas-Bawah di Mobile, Berdampingan di Layar Lebih Besar) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700/60">
                    <span className="text-[11px] text-slate-400 block font-medium">Total Modal Pokok</span>
                    <span className="text-base font-bold text-slate-200 block mt-1">
                      {formatRupiah(simResult.totalPrincipal, isPrivateMode)}
                    </span>
                  </div>
                  <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700/60">
                    <span className="text-[11px] text-emerald-400 block font-medium">Estimasi Keuntungan</span>
                    <span className="text-base font-bold text-emerald-400 block mt-1">
                      +{formatRupiah(simResult.profit, isPrivateMode)}
                    </span>
                  </div>
                </div>

                {/* Visual Ratio Bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Porsi Modal Pokok ({simResult.totalPrincipal > 0 ? Math.round((simResult.totalPrincipal / simResult.futureValue) * 100) : 100}%)</span>
                    <span className="text-emerald-400 font-semibold">
                      Keuntungan Bunga Majemuk ({simResult.futureValue > 0 ? Math.round((simResult.profit / simResult.futureValue) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-700/60 h-2.5 rounded-full overflow-hidden flex">
                    <div
                      className="bg-slate-400 h-full transition-all duration-500"
                      style={{
                        width: `${simResult.totalPrincipal > 0 ? Math.min(100, Math.round((simResult.totalPrincipal / simResult.futureValue) * 100)) : 100}%`,
                      }}
                    />
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-500"
                      style={{
                        width: `${simResult.futureValue > 0 ? Math.min(100, Math.round((simResult.profit / simResult.futureValue) * 100)) : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Milestone Timeline Pertumbuhan per Tahun (Informatif & Sangat Bermanfaat!) */}
              <div className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-2xl space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-800 block">
                    Perkembangan Nilai Dana per Tahun
                  </span>
                  <span className="text-[10px] text-slate-400 block sm:hidden">
                    Geser tabel →
                  </span>
                </div>
                <div className="overflow-x-auto -mx-1 px-1 overscroll-contain">
                  <table className="w-full text-left text-xs min-w-[460px]">
                    <thead>
                      <tr className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-200">
                        <th className="py-2.5 pr-4 whitespace-nowrap">Tahun</th>
                        <th className="py-2.5 px-4 text-right whitespace-nowrap">Modal Terkumpul</th>
                        <th className="py-2.5 px-4 text-right whitespace-nowrap">Total Nilai Investasi</th>
                        <th className="py-2.5 pl-4 text-right whitespace-nowrap">Keuntungan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {simResult.yearlyMilestones.map((ms) => (
                        <tr key={ms.year} className="hover:bg-white/80 transition">
                          <td className="py-2.5 pr-4 font-semibold text-slate-800 whitespace-nowrap">
                            Tahun ke-{ms.year}
                          </td>
                          <td className="py-2.5 px-4 text-right text-slate-600 font-medium whitespace-nowrap">
                            {formatRupiah(ms.principal, isPrivateMode)}
                          </td>
                          <td className="py-2.5 px-4 text-right font-bold text-slate-900 whitespace-nowrap">
                            {formatRupiah(ms.futureValue, isPrivateMode)}
                          </td>
                          <td className="py-2.5 pl-4 text-right font-semibold text-emerald-600 whitespace-nowrap">
                            +{formatRupiah(ms.profit, isPrivateMode)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
