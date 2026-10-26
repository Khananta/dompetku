"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Icons } from "./Icons";
import { formatRupiah } from "./utils";

// Komponen Bendera Negara Resolusi Tinggi (Anti Text-Emoji Windows)
function CountryFlag({ countryCode, alt, className = "w-5 h-3.5" }) {
  const [error, setError] = useState(false);
  const code = (countryCode || "").toLowerCase();

  if (error || !code) {
    return (
      <span
        className={`inline-flex items-center justify-center bg-slate-200 text-[9px] font-bold text-slate-600 rounded-xs uppercase ${className}`}
      >
        {countryCode}
      </span>
    );
  }

  return (
    <img
      src={`https://flagcdn.com/w40/${code}.png`}
      srcSet={`https://flagcdn.com/w80/${code}.png 2x`}
      alt={alt || countryCode}
      className={`inline-block object-cover rounded-xs shadow-2xs border border-slate-200/60 shrink-0 ${className}`}
      loading="lazy"
      onError={() => setError(true)}
    />
  );
}

// Currencies Lengkap yang Dipantau
const ALL_CURRENCIES = [
  // 6 Mata Uang Utama (Default ditampilkan)
  { code: "USD", name: "Dolar AS", countryCode: "us", symbol: "$", baseChange: 0.18 },
  { code: "SGD", name: "Dolar Singapura", countryCode: "sg", symbol: "S$", baseChange: 0.08 },
  { code: "EUR", name: "Euro", countryCode: "eu", symbol: "€", baseChange: -0.15 },
  { code: "JPY", name: "Yen Jepang", countryCode: "jp", symbol: "¥", baseChange: -0.32 },
  { code: "MYR", name: "Ringgit Malaysia", countryCode: "my", symbol: "RM", baseChange: 0.12 },
  { code: "SAR", name: "Riyal Saudi", countryCode: "sa", symbol: "SR", baseChange: 0.05 },
  // Mata Uang Tambahan yang bisa dicari
  { code: "GBP", name: "Pound Inggris", countryCode: "gb", symbol: "£", baseChange: -0.22 },
  { code: "AUD", name: "Dolar Australia", countryCode: "au", symbol: "A$", baseChange: 0.25 },
  { code: "CNY", name: "Yuan Tiongkok", countryCode: "cn", symbol: "¥", baseChange: 0.10 },
  { code: "KRW", name: "Won Korea", countryCode: "kr", symbol: "₩", baseChange: -0.28 },
  { code: "THB", name: "Baht Thailand", countryCode: "th", symbol: "฿", baseChange: 0.14 },
  { code: "HKD", name: "Dolar Hong Kong", countryCode: "hk", symbol: "HK$", baseChange: 0.04 },
  { code: "CAD", name: "Dolar Kanada", countryCode: "ca", symbol: "C$", baseChange: -0.09 },
  { code: "CHF", name: "Franc Swiss", countryCode: "ch", symbol: "CHF", baseChange: 0.16 },
  { code: "AED", name: "Dirham UEA", countryCode: "ae", symbol: "AED", baseChange: 0.03 },
  { code: "TWD", name: "Dolar Taiwan", countryCode: "tw", symbol: "NT$", baseChange: -0.07 },
  { code: "NZD", name: "Dolar Selandia Baru", countryCode: "nz", symbol: "NZ$", baseChange: 0.19 },
  { code: "INR", name: "Rupee India", countryCode: "in", symbol: "₹", baseChange: -0.11 },
  { code: "PHP", name: "Peso Filipina", countryCode: "ph", symbol: "₱", baseChange: 0.06 },
  { code: "VND", name: "Dong Vietnam", countryCode: "vn", symbol: "₫", baseChange: -0.04 },
  { code: "TRY", name: "Lira Turki", countryCode: "tr", symbol: "₺", baseChange: -0.45 },
];

// Fallback rates jika offline atau API limit
const FALLBACK_RATES = {
  USD: 16250,
  SGD: 12280,
  EUR: 17540,
  JPY: 106.5,
  MYR: 3540,
  SAR: 4330,
  GBP: 20850,
  AUD: 10620,
  CNY: 2240,
  KRW: 11.8,
  THB: 452,
  HKD: 2085,
  CAD: 11950,
  CHF: 18120,
  AED: 4425,
  TWD: 505,
  NZD: 9850,
  INR: 195,
  PHP: 285,
  VND: 0.65,
  TRY: 475,
};

export default function CurrencyRateWidget() {
  const [activeTab, setActiveTab] = useState("list"); // "list" | "converter"
  const [rates, setRates] = useState(FALLBACK_RATES);
  const [rateChanges, setRateChanges] = useState({});
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // State untuk pencarian (Enter / Tombol Cari)
  const [searchInput, setSearchInput] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    setSubmittedQuery(searchInput.trim());
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setSubmittedQuery("");
  };

  // State Konversi
  const [convertAmount, setConvertAmount] = useState("100");
  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toCurrency, setToCurrency] = useState("IDR");

  // Fetch Kurs Real-Time dari open API
  const fetchRates = useCallback(async (isManualRefresh = false) => {
    setLoading(true);
    setErrorMsg(null);

    // Cek cache localStorage jika bukan manual refresh
    if (!isManualRefresh && typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("dompetku_currency_rates_cache");
        if (cached) {
          const parsed = JSON.parse(cached);
          const cacheAge = Date.now() - parsed.timestamp;
          if (cacheAge < 30 * 60 * 1000 && parsed.rates) {
            setRates(parsed.rates);
            if (parsed.rateChanges) setRateChanges(parsed.rateChanges);
            setLastUpdated(new Date(parsed.timestamp));
            setLoading(false);
            return;
          }
        }
      } catch (e) {}
    }

    try {
      const res = await fetch("https://open.er-api.com/v6/latest/USD");
      if (!res.ok) throw new Error("Gagal mengambil data kurs.");
      const data = await res.json();

      if (data && data.result === "success" && data.rates && data.rates.IDR) {
        const usdToIdr = data.rates.IDR;
        const calculated = {};
        const changes = {};

        // Ambil riwayat rate sebelumnya untuk hitung pergerakan real
        let previousRates = null;
        if (typeof window !== "undefined") {
          try {
            const prev = localStorage.getItem("dompetku_previous_rates");
            if (prev) previousRates = JSON.parse(prev);
          } catch (e) {}
        }

        ALL_CURRENCIES.forEach((c) => {
          let currentRateVal = 0;
          if (c.code === "USD") {
            currentRateVal = Math.round(usdToIdr);
          } else if (data.rates[c.code]) {
            currentRateVal = Math.round((usdToIdr / data.rates[c.code]) * 100) / 100;
          } else {
            currentRateVal = FALLBACK_RATES[c.code] || 0;
          }
          calculated[c.code] = currentRateVal;

          // Hitung perubahan %
          if (previousRates && previousRates[c.code] && previousRates[c.code] !== currentRateVal) {
            const diff = ((currentRateVal - previousRates[c.code]) / previousRates[c.code]) * 100;
            changes[c.code] = Math.round(diff * 100) / 100;
          } else {
            changes[c.code] = c.baseChange;
          }
        });

        setRates(calculated);
        setRateChanges(changes);
        const updateTime = new Date();
        setLastUpdated(updateTime);

        if (typeof window !== "undefined") {
          localStorage.setItem("dompetku_previous_rates", JSON.stringify(calculated));
          localStorage.setItem(
            "dompetku_currency_rates_cache",
            JSON.stringify({
              timestamp: updateTime.getTime(),
              rates: calculated,
              rateChanges: changes,
            })
          );
        }
      } else {
        throw new Error("Format respons kurs tidak sesuai.");
      }
    } catch (err) {
      console.warn("Gagal fetch kurs live:", err.message);
      setErrorMsg("Menggunakan kurs estimasi offline.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  // Filter Mata Uang: jika ada pencarian maka filter ALL, jika tidak maka default 6 utama
  const displayedCurrencies = useMemo(() => {
    const q = submittedQuery.trim().toLowerCase();
    if (q !== "") {
      return ALL_CURRENCIES.filter(
        (c) =>
          c.code.toLowerCase().includes(q) ||
          c.name.toLowerCase().includes(q) ||
          c.countryCode.toLowerCase().includes(q)
      );
    }

    // Default: 6 kurs utama
    return ALL_CURRENCIES.slice(0, 6);
  }, [submittedQuery]);

  // Kalkulasi Hasil Konversi Cepat
  const conversionResult = useMemo(() => {
    const rawVal = parseFloat(String(convertAmount).replace(/,/g, "")) || 0;
    if (rawVal <= 0) return 0;

    // Jika Dari Valas ke IDR
    if (toCurrency === "IDR") {
      const rateToIdr = rates[fromCurrency] || FALLBACK_RATES[fromCurrency] || 1;
      return rawVal * rateToIdr;
    }

    // Jika Dari IDR ke Valas
    if (fromCurrency === "IDR") {
      const rateValas = rates[toCurrency] || FALLBACK_RATES[toCurrency] || 1;
      return rawVal / rateValas;
    }

    // Jika Antara 2 Valas (cth: USD ke SGD)
    const fromInIdr = (rates[fromCurrency] || 1) * rawVal;
    const toRate = rates[toCurrency] || 1;
    return fromInIdr / toRate;
  }, [convertAmount, fromCurrency, toCurrency, rates]);

  // Swap / Tukar Posisi Mata Uang
  const handleSwap = () => {
    const temp = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(temp);
  };

  // Format Angka Rupiah / Valas
  const formatRateNumber = (num, isIdr = true) => {
    if (isIdr) {
      return new Intl.NumberFormat("id-ID", {
        maximumFractionDigits: 0,
      }).format(Math.round(num));
    }
    return new Intl.NumberFormat("id-ID", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
      {/* ========================================================
      // 1. HEADER WIDGET
      // ======================================================== */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-slate-900 leading-tight">
            Mata Uang
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {lastUpdated
              ? `Update: ${lastUpdated.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB`
              : "Memperbarui kurs..."}
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Tombol Refresh Live */}
          <button
            onClick={() => fetchRates(true)}
            disabled={loading}
            title="Perbarui kurs terbaru"
            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-slate-50 active:scale-95 rounded-xl transition cursor-pointer disabled:opacity-50"
          >
            <Icons.RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-600" : ""}`} />
          </button>

          {/* Tab Switcher: Daftar vs Konverter */}
          <div className="flex items-center p-0.5 bg-slate-100 rounded-xl text-xs font-medium">
            <button
              onClick={() => setActiveTab("list")}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                activeTab === "list"
                  ? "bg-white text-slate-900 shadow-xs font-semibold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Daftar Kurs
            </button>
            <button
              onClick={() => setActiveTab("converter")}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                activeTab === "converter"
                  ? "bg-white text-emerald-700 shadow-xs font-semibold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Konversi
            </button>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="mt-2 py-1 px-2.5 bg-amber-50 text-amber-700 text-[10px] rounded-lg">
          {errorMsg}
        </div>
      )}

      {/* ========================================================
      // 2. KONTEN TAB 1: DAFTAR KURS
      // ======================================================== */}
      {activeTab === "list" ? (
        <div className="mt-3.5 space-y-3">
          {/* Form Pencarian Kurs dengan Tombol Cari & Support Enter */}
          <form onSubmit={handleSearch} className="flex items-center gap-1.5">
            <div className="relative flex-1 min-w-0">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Cari mata uang (Won, Yuan, SAR, dll)..."
                className="w-full pl-8 pr-7 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 transition"
              />
              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <Icons.Search className="w-3.5 h-3.5" />
              </div>
              {searchInput && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center cursor-pointer"
                  title="Hapus ketikan"
                >
                  ✕
                </button>
              )}
            </div>
            <button
              type="submit"
              className="px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-95 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer shrink-0"
            >
              Cari
            </button>
          </form>

          {/* Info Status Pencarian Aktif */}
          {submittedQuery && (
            <div className="flex items-center justify-between text-[11px] px-1 text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-100">
              <span className="truncate">
                Hasil: <strong className="text-slate-800">&quot;{submittedQuery}&quot;</strong> ({displayedCurrencies.length})
              </span>
              <button
                type="button"
                onClick={handleClearSearch}
                className="text-emerald-600 font-semibold hover:underline cursor-pointer shrink-0 ml-2"
              >
                Reset ke 6 Kurs Utama
              </button>
            </div>
          )}

          {/* Grid Kurs: 2 Kolom saat ada 2+, dan 1 Card Full saat hanya 1 hasil */}
          {displayedCurrencies.length > 0 ? (
            <div className="grid grid-cols-2 gap-2.5">
              {displayedCurrencies.map((item) => {
                const currentRate = rates[item.code] || FALLBACK_RATES[item.code] || 0;
                const change = rateChanges[item.code] !== undefined ? rateChanges[item.code] : item.baseChange;
                const isPositive = change >= 0;
                const isSingleResult = displayedCurrencies.length === 1;

                return (
                  <div
                    key={item.code}
                    onClick={() => {
                      setFromCurrency(item.code);
                      setToCurrency("IDR");
                      setActiveTab("converter");
                    }}
                    title={`Klik untuk konversi ${item.name} (${item.code})`}
                    className={`p-3 bg-slate-50/70 hover:bg-emerald-50/50 hover:border-emerald-200/90 border border-slate-100 rounded-xl transition cursor-pointer flex flex-col justify-between group ${
                      isSingleResult ? "col-span-2" : ""
                    }`}
                  >
                    {/* Baris Atas: Bendera Negara & Nama Mata Uang (Lega & Tidak Terpotong) */}
                    <div className="flex items-center gap-2 min-w-0">
                      <CountryFlag
                        countryCode={item.countryCode}
                        alt={item.name}
                        className="w-5 h-3.5 rounded-xs shadow-2xs shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-bold text-slate-800 leading-snug block truncate group-hover:text-emerald-700 transition pb-0.5">
                          {item.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium block leading-normal -mt-0.5">
                          {item.code}
                        </span>
                      </div>
                    </div>

                    {/* Baris Bawah: Nilai Rupiah, lalu di bawahnya Skala Naik/Turun */}
                    <div className="mt-2.5 pt-2 border-t border-slate-200/50">
                      {/* Nilai Rupiah */}
                      <div className="text-xs sm:text-sm font-black text-slate-900 tracking-tight leading-tight">
                        Rp {formatRateNumber(currentRate, true)}
                      </div>

                      {/* Skala Naik/Turun Tepat di Bawah Nilai Rupiah (Anti Kepotong) */}
                      <div className="mt-1.5 flex items-center justify-between gap-1">
                        <span
                          className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 border ${
                            isPositive
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100/90"
                              : "bg-rose-50 text-rose-700 border-rose-100/90"
                          }`}
                          title={`Pergerakan: ${isPositive ? "Menguat/Naik" : "Melemah/Turun"} ${Math.abs(change).toFixed(2)}%`}
                        >
                          {isPositive ? (
                            <Icons.TrendingUp className="w-3 h-3 text-emerald-600 shrink-0" />
                          ) : (
                            <Icons.TrendingDown className="w-3 h-3 text-rose-600 shrink-0" />
                          )}
                          <span>{isPositive ? `+${change.toFixed(2)}%` : `${change.toFixed(2)}%`}</span>
                        </span>

                        <span className="text-[10px] text-slate-400 font-normal">
                          / 1 {item.code}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-6 text-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              <p className="text-xs font-medium text-slate-600">
                Tidak ada mata uang cocok dengan &quot;{submittedQuery}&quot;
              </p>
              <button
                type="button"
                onClick={handleClearSearch}
                className="mt-1 text-xs text-emerald-600 font-semibold hover:underline cursor-pointer"
              >
                Kembali ke 6 kurs utama
              </button>
            </div>
          )}
        </div>
      ) : (
        /* ========================================================
        // 3. KONTEN TAB 2: KONVERSI CEPAT
        // ======================================================== */
        <div className="mt-3.5 space-y-3">
          {/* Baris 1: Form Input Nominal Lebar Penuh */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Nominal Uang
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                value={convertAmount}
                onChange={(e) => {
                  const clean = e.target.value.replace(/[^0-9.]/g, "");
                  setConvertAmount(clean);
                }}
                placeholder="0"
                className="w-full pl-3.5 pr-14 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                {fromCurrency}
              </span>
            </div>
          </div>

          {/* Baris 2: Pemilihan Mata Uang (Dari -> Swap -> Ke) */}
          <div className="flex items-center gap-2">
            {/* Dari Mata Uang */}
            <div className="flex-1 min-w-0">
              <label className="block text-[10px] font-medium text-slate-400 mb-1">
                Dari
              </label>
              <select
                value={fromCurrency}
                onChange={(e) => setFromCurrency(e.target.value)}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer truncate"
              >
                <option value="IDR">IDR - Rupiah Indonesia</option>
                {ALL_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} - {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Tombol Swap */}
            <div className="pt-4 shrink-0">
              <button
                type="button"
                onClick={handleSwap}
                title="Tukar mata uang"
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 flex items-center justify-center transition active:scale-90 cursor-pointer border border-slate-200/60"
              >
                <Icons.ArrowLeftRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Ke Mata Uang */}
            <div className="flex-1 min-w-0">
              <label className="block text-[10px] font-medium text-slate-400 mb-1">
                Ke
              </label>
              <select
                value={toCurrency}
                onChange={(e) => setToCurrency(e.target.value)}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer truncate"
              >
                <option value="IDR">IDR - Rupiah Indonesia</option>
                {ALL_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} - {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Amount Chips */}
          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
            <span className="text-[10px] text-slate-400 font-medium">Cepat:</span>
            {[10, 50, 100, 500, 1000].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setConvertAmount(String(val))}
                className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-semibold active:scale-95 transition cursor-pointer"
              >
                {val}
              </button>
            ))}
          </div>

          {/* Hasil Konversi */}
          <div className="p-3.5 bg-gradient-to-br from-emerald-50/90 to-teal-50/50 rounded-2xl border border-emerald-100/90 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-emerald-800/80">
              <span className="font-semibold">Hasil Konversi:</span>
              <span className="text-[10px] text-slate-500 font-normal">
                1 {fromCurrency === "IDR" ? toCurrency : fromCurrency} = Rp{" "}
                {formatRateNumber(
                  rates[fromCurrency === "IDR" ? toCurrency : fromCurrency] || 0,
                  true
                )}
              </span>
            </div>
            <p className="text-xl sm:text-2xl font-black text-emerald-700 tracking-tight">
              {toCurrency === "IDR"
                ? formatRupiah(conversionResult)
                : `${formatRateNumber(conversionResult, false)} ${toCurrency}`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
