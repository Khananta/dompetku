"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatRupiah } from "./utils";
import { Icons } from "./Icons";

export default function CalculatorView({ isPrivateMode }) {
  const [activeTab, setActiveTab] = useState("emergency"); // "emergency" | "compound" | "budget503020" | "dsr"
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // ==========================================
  // 1. DANA DARURAT (DEFAULT KOSONG)
  // ==========================================
  const [emergencyExpense, setEmergencyExpense] = useState("");
  const [status, setStatus] = useState("lajang"); // "lajang" | "menikah" | "anak"
  const [jobType, setJobType] = useState("tetap"); // "tetap" | "freelance"
  const [hasDebt, setHasDebt] = useState(false);

  const calculateEmergency = () => {
    const exp = Number(String(emergencyExpense).replace(/\D/g, "")) || 0;
    if (exp === 0) return { months: 0, total: 0 };

    let months = 3;
    if (status === "lajang") months = 3;
    else if (status === "menikah") months = 6;
    else if (status === "anak") months = 9;

    if (jobType === "freelance") months += 3;
    if (hasDebt) months += 1;

    const total = exp * months;
    return { months, total };
  };

  const emergencyResult = calculateEmergency();

  // ==========================================
  // 2. BUNGA MAJEMUK (DEFAULT KOSONG)
  // ==========================================
  const [initDeposit, setInitDeposit] = useState("");
  const [monthlyDeposit, setMonthlyDeposit] = useState("");
  const [annualRate, setAnnualRate] = useState(""); // % per tahun
  const [years, setYears] = useState(""); // tahun

  const calculateCompound = () => {
    const P = Number(String(initDeposit).replace(/\D/g, "")) || 0;
    const PMT = Number(String(monthlyDeposit).replace(/\D/g, "")) || 0;
    const r = (Number(annualRate) || 0) / 100;
    const y = Number(years) || 0;
    const n = y * 12;
    const i = r / 12;

    if (P === 0 && PMT === 0) {
      return { futureValue: 0, totalInvested: 0, profit: 0, profitPercentage: 0 };
    }

    let futureValue = P;
    let totalInvested = P + PMT * n;

    if (i > 0 && n > 0) {
      const lumpSum = P * Math.pow(1 + i, n);
      const annuity = PMT > 0 ? PMT * ((Math.pow(1 + i, n) - 1) / i) : 0;
      futureValue = Math.round(lumpSum + annuity);
    } else {
      futureValue = totalInvested;
    }

    const profit = Math.max(0, futureValue - totalInvested);
    return {
      futureValue,
      totalInvested,
      profit,
      profitPercentage: totalInvested > 0 ? Math.round((profit / totalInvested) * 100) : 0,
    };
  };

  const compoundResult = calculateCompound();

  // ==========================================
  // 3. ATURAN 50/30/20 (DEFAULT KOSONG)
  // ==========================================
  const [income503020, setIncome503020] = useState("");

  const calculate503020 = () => {
    const inc = Number(String(income503020).replace(/\D/g, "")) || 0;
    return {
      needs: Math.round(inc * 0.5),
      wants: Math.round(inc * 0.3),
      savings: Math.round(inc * 0.2),
    };
  };

  const rule503020 = calculate503020();

  // ==========================================
  // 4. BATAS CICILAN (DSR) (DEFAULT KOSONG)
  // ==========================================
  const [dsrIncome, setDsrIncome] = useState("");
  const [dsrDebt, setDsrDebt] = useState("");

  const calculateDsr = () => {
    const inc = Number(String(dsrIncome).replace(/\D/g, "")) || 0;
    const debt = Number(String(dsrDebt).replace(/\D/g, "")) || 0;

    if (inc === 0) {
      return {
        ratio: 0,
        maxSafeDebt: 0,
        remainingQuota: 0,
        statusLabel: "Belum Dihitung",
        statusColor: "text-slate-600 bg-slate-50 border-slate-200",
      };
    }

    const ratio = Math.round((debt / inc) * 100);
    const maxSafeDebt = Math.round(inc * 0.3); // Maksimal 30%
    const remainingQuota = Math.max(0, maxSafeDebt - debt);

    let statusLabel = "Aman & Sehat";
    let statusColor = "text-emerald-700 bg-emerald-50 border-emerald-200";
    if (ratio > 40) {
      statusLabel = "Beresiko Tinggi (Over-leverage)";
      statusColor = "text-rose-700 bg-rose-50 border-rose-200";
    } else if (ratio > 30) {
      statusLabel = "Batas Maksimal (Waspada)";
      statusColor = "text-amber-700 bg-amber-50 border-amber-200";
    }

    return { ratio, maxSafeDebt, remainingQuota, statusLabel, statusColor };
  };

  const dsrResult = calculateDsr();

  // Quick Chips Helper
  const setAmountFormatted = (setter, val) => {
    setter(new Intl.NumberFormat("id-ID").format(val));
  };

  return (
    <div className="space-y-6">
      {/* ========================================================
      // 1. TOOLBAR TABS & BUTTON HELP
      // ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        {/* Tab Buttons (Full Rounded & Gradient Hijau) */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-full text-xs font-medium w-full sm:w-max">
          <button
            type="button"
            onClick={() => setActiveTab("emergency")}
            className={`px-4 py-2 rounded-full transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 ${
              activeTab === "emergency"
                ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Icons.Shield className="w-3.5 h-3.5" />
            <span>Dana Darurat</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("compound")}
            className={`px-4 py-2 rounded-full transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 ${
              activeTab === "compound"
                ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Icons.TrendingUp className="w-3.5 h-3.5" />
            <span>Bunga Majemuk</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("budget503020")}
            className={`px-4 py-2 rounded-full transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 ${
              activeTab === "budget503020"
                ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Icons.ChartPie className="w-3.5 h-3.5" />
            <span>Aturan 50/30/20</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("dsr")}
            className={`px-4 py-2 rounded-full transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 ${
              activeTab === "dsr"
                ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Icons.Calculator className="w-3.5 h-3.5" />
            <span>Batas Cicilan (DSR)</span>
          </button>
        </div>

        {/* Button Help */}
        <button
          type="button"
          onClick={() => setIsHelpOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-xs font-semibold transition cursor-pointer self-start sm:self-auto"
        >
          <Icons.HelpCircle className="w-4 h-4 text-emerald-600" />
          <span>Help & Panduan</span>
        </button>
      </div>

      {/* ========================================================
      // TAB 1: DANA DARURAT
      // ======================================================== */}
      {activeTab === "emergency" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card Form Kiri */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Hitung Kebutuhan Dana Darurat</h3>
              <p className="text-xs text-slate-400 mt-0.5">Sesuaikan profil tanggungan dan kestabilan pendapatan</p>
            </div>

            {/* Focal Point Large Nominal Input */}
            <div className="text-center py-2 bg-slate-50/70 border border-slate-100 rounded-2xl p-4">
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Pengeluaran Rutin Bulanan
              </label>
              <div className="flex items-center justify-center gap-1.5">
                <span className="text-lg font-bold text-slate-400">Rp</span>
                <input
                  type="text"
                  placeholder="0"
                  value={emergencyExpense}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, "");
                    setEmergencyExpense(clean ? new Intl.NumberFormat("id-ID").format(clean) : "");
                  }}
                  className="w-full max-w-xs text-center text-2xl sm:text-3xl font-bold text-slate-900 bg-transparent focus:outline-none placeholder-slate-300 tracking-tight"
                />
              </div>

              {/* Quick Chips */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3 pt-3 border-t border-slate-200/60">
                {[3000000, 5000000, 8000000, 10000000, 15000000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAmountFormatted(setEmergencyExpense, val)}
                    className="px-3 py-1 rounded-full bg-white border border-slate-200 hover:border-emerald-500 hover:text-emerald-700 text-[11px] font-semibold text-slate-600 active:scale-95 transition cursor-pointer"
                  >
                    {val / 1000000} Jt
                  </button>
                ))}
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Status Tanggungan</label>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-full">
                  <button
                    type="button"
                    onClick={() => setStatus("lajang")}
                    className={`py-1.5 rounded-full font-medium transition cursor-pointer ${
                      status === "lajang"
                        ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Lajang (3 Bln)
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus("menikah")}
                    className={`py-1.5 rounded-full font-medium transition cursor-pointer ${
                      status === "menikah"
                        ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Menikah (6 Bln)
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus("anak")}
                    className={`py-1.5 rounded-full font-medium transition cursor-pointer ${
                      status === "anak"
                        ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Punya Anak (9 Bln)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Stabilitas Pendapatan</label>
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-full">
                  <button
                    type="button"
                    onClick={() => setJobType("tetap")}
                    className={`py-1.5 rounded-full font-medium transition cursor-pointer ${
                      jobType === "tetap"
                        ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Gaji Tetap
                  </button>
                  <button
                    type="button"
                    onClick={() => setJobType("freelance")}
                    className={`py-1.5 rounded-full font-medium transition cursor-pointer ${
                      jobType === "freelance"
                        ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Freelance / Usaha (+3 Bln)
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={hasDebt}
                    onChange={(e) => setHasDebt(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                  />
                  <span className="text-slate-700 font-medium">Memiliki tanggungan cicilan aktif (+1 Bulan)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Card Hasil Kanan */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                Rekomendasi Aman
              </span>
              <h4 className="text-base font-bold text-slate-900 mt-2">Target Dana Darurat Ideal</h4>

              {/* Big Result Value */}
              <div className="mt-4 p-5 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                <span className="text-xs text-slate-400 block">Total Sasaran Dana:</span>
                <h2 className="text-3xl font-black text-emerald-700 tracking-tight mt-1">
                  {formatRupiah(emergencyResult.total, isPrivateMode)}
                </h2>
                <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 bg-white rounded-full border border-slate-200 text-xs font-semibold text-slate-700">
                  <span>{emergencyResult.months} Bulan Biaya Hidup</span>
                </div>
              </div>

              {/* Breakdown Cards */}
              <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 text-[10px]">Alokasi 20% Pengeluaran:</span>
                  <p className="font-bold text-slate-800 mt-0.5">
                    {formatRupiah(
                      Math.round(
                        (Number(String(emergencyExpense).replace(/\D/g, "")) || 0) * 0.2
                      ),
                      isPrivateMode
                    )}
                    /bln
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 text-[10px]">Tempat Simpan Terbaik:</span>
                  <p className="font-bold text-emerald-700 mt-0.5">RDPU / Deposito</p>
                </div>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-xs text-emerald-800 flex items-center gap-2">
              <Icons.Shield className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>Simpan dana darurat di instrumen likuid yang mudah dicairkan sewaktu-waktu.</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
      // TAB 2: BUNGA MAJEMUK (COMPOUND INTEREST)
      // ======================================================== */}
      {activeTab === "compound" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card Form Kiri */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Simulasi Investasi & Bunga Majemuk</h3>
              <p className="text-xs text-slate-400 mt-0.5">Hitung pertumbuhan dana hasil investasi berkala</p>
            </div>

            {/* Setoran Bulanan (Focal Point) */}
            <div className="text-center py-2 bg-slate-50/70 border border-slate-100 rounded-2xl p-4">
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Rencana Setoran per Bulan
              </label>
              <div className="flex items-center justify-center gap-1.5">
                <span className="text-lg font-bold text-slate-400">Rp</span>
                <input
                  type="text"
                  placeholder="0"
                  value={monthlyDeposit}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, "");
                    setMonthlyDeposit(clean ? new Intl.NumberFormat("id-ID").format(clean) : "");
                  }}
                  className="w-full max-w-xs text-center text-2xl sm:text-3xl font-bold text-slate-900 bg-transparent focus:outline-none placeholder-slate-300 tracking-tight"
                />
              </div>

              {/* Quick Chips */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3 pt-3 border-t border-slate-200/60">
                {[500000, 1000000, 2000000, 5000000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAmountFormatted(setMonthlyDeposit, val)}
                    className="px-3 py-1 rounded-full bg-white border border-slate-200 hover:border-emerald-500 hover:text-emerald-700 text-[11px] font-semibold text-slate-600 active:scale-95 transition cursor-pointer"
                  >
                    +{val >= 1000000 ? `${val / 1000000} Jt` : `${val / 1000} Rb`}
                  </button>
                ))}
              </div>
            </div>

            {/* Inputs Tambahan */}
            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Modal Awal (Rp)</label>
                <input
                  type="text"
                  placeholder="0"
                  value={initDeposit}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, "");
                    setInitDeposit(clean ? new Intl.NumberFormat("id-ID").format(clean) : "");
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Estimasi Return (% / Thn)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    placeholder="Contoh: 8"
                    value={annualRate}
                    onChange={(e) => setAnnualRate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white transition"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Jangka Waktu (Tahun)</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    placeholder="Contoh: 5"
                    value={years}
                    onChange={(e) => setYears(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white transition"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card Hasil Kanan */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                Proyeksi {years || 0} Tahun
              </span>
              <h4 className="text-base font-bold text-slate-900 mt-2">Estimasi Nilai Akhir Portofolio</h4>

              {/* Big Result Value */}
              <div className="mt-4 p-5 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                <span className="text-xs text-slate-400 block">Total Nilai Akumulasi:</span>
                <h2 className="text-3xl font-black text-emerald-700 tracking-tight mt-1">
                  {formatRupiah(compoundResult.futureValue, isPrivateMode)}
                </h2>
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-white rounded-full border border-slate-200 text-xs font-semibold text-slate-700">
                  <span className="text-emerald-600 font-bold">+{compoundResult.profitPercentage}%</span>
                  <span>keuntungan bunga</span>
                </div>
              </div>

              {/* Breakdown Cards */}
              <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 text-[10px]">Total Modal Disetor:</span>
                  <p className="font-bold text-slate-800 mt-0.5">
                    {formatRupiah(compoundResult.totalInvested, isPrivateMode)}
                  </p>
                </div>
                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
                  <span className="text-emerald-700 text-[10px]">Keuntungan Imbal Hasil:</span>
                  <p className="font-bold text-emerald-700 mt-0.5">
                    +{formatRupiah(compoundResult.profit, isPrivateMode)}
                  </p>
                </div>
              </div>
            </div>

            {/* Visual Bar Komposisi */}
            <div className="space-y-1.5 pt-2">
              <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden flex">
                <div
                  className="bg-slate-400 h-full transition-all"
                  style={{
                    width: `${Math.round(
                      (compoundResult.totalInvested / (compoundResult.futureValue || 1)) * 100
                    )}%`,
                  }}
                  title="Modal Pokok"
                />
                <div
                  className="bg-emerald-500 h-full transition-all"
                  style={{
                    width: `${Math.round(
                      (compoundResult.profit / (compoundResult.futureValue || 1)) * 100
                    )}%`,
                  }}
                  title="Keuntungan Bunga"
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Modal Pokok</span>
                <span className="text-emerald-700 font-semibold">Hasil Bunga Majemuk</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
      // TAB 3: ATURAN 50/30/20
      // ======================================================== */}
      {activeTab === "budget503020" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card Form Kiri */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Alokasi Anggaran Ideal 50/30/20</h3>
              <p className="text-xs text-slate-400 mt-0.5">Keseimbangan kebutuhan hidup, gaya hidup, dan tabungan</p>
            </div>

            {/* Income Input (Focal Point) */}
            <div className="text-center py-2 bg-slate-50/70 border border-slate-100 rounded-2xl p-4">
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Pendapatan Bersih Bulanan
              </label>
              <div className="flex items-center justify-center gap-1.5">
                <span className="text-lg font-bold text-slate-400">Rp</span>
                <input
                  type="text"
                  placeholder="0"
                  value={income503020}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, "");
                    setIncome503020(clean ? new Intl.NumberFormat("id-ID").format(clean) : "");
                  }}
                  className="w-full max-w-xs text-center text-2xl sm:text-3xl font-bold text-slate-900 bg-transparent focus:outline-none placeholder-slate-300 tracking-tight"
                />
              </div>

              {/* Quick Chips */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3 pt-3 border-t border-slate-200/60">
                {[5000000, 8000000, 10000000, 15000000, 20000000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAmountFormatted(setIncome503020, val)}
                    className="px-3 py-1 rounded-full bg-white border border-slate-200 hover:border-emerald-500 hover:text-emerald-700 text-[11px] font-semibold text-slate-600 active:scale-95 transition cursor-pointer"
                  >
                    {val / 1000000} Jt
                  </button>
                ))}
              </div>
            </div>

            {/* Porsi Visual Progress Bar */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
              <span className="text-xs font-semibold text-slate-700">Rasio Pembagian:</span>
              <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden flex">
                <div className="bg-blue-500 w-[50%] h-full" title="50% Pokok" />
                <div className="bg-amber-500 w-[30%] h-full" title="30% Keinginan" />
                <div className="bg-emerald-500 w-[20%] h-full" title="20% Tabungan" />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500">
                <span className="text-blue-600 font-semibold">50% Pokok</span>
                <span className="text-amber-600 font-semibold">30% Keinginan</span>
                <span className="text-emerald-600 font-semibold">20% Tabungan</span>
              </div>
            </div>
          </div>

          {/* Card Hasil Kanan */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3.5">
            <div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                Rincian Nominal
              </span>
              <h4 className="text-base font-bold text-slate-900 mt-2">Batas Maksimal Pengeluaran</h4>
            </div>

            {/* 3 Categories Breakdown */}
            <div className="space-y-3 pt-1">
              {/* 50% Needs */}
              <div className="p-3.5 bg-blue-50/70 rounded-2xl border border-blue-100 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <h5 className="text-xs font-bold text-slate-900">50% Kebutuhan Pokok</h5>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Sewa, makan harian, listrik, wifi, transportasi</p>
                </div>
                <span className="text-base font-black text-blue-700">
                  {formatRupiah(rule503020.needs, isPrivateMode)}
                </span>
              </div>

              {/* 30% Wants */}
              <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-100 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <h5 className="text-xs font-bold text-slate-900">30% Keinginan & Hiburan</h5>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Nongkrong, belanja hobi, streaming, liburan</p>
                </div>
                <span className="text-base font-black text-amber-700">
                  {formatRupiah(rule503020.wants, isPrivateMode)}
                </span>
              </div>

              {/* 20% Savings */}
              <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-100 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <h5 className="text-xs font-bold text-slate-900">20% Tabungan & Investasi</h5>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Dana darurat, tabungan masa depan, saham/reksadana</p>
                </div>
                <span className="text-base font-black text-emerald-700">
                  {formatRupiah(rule503020.savings, isPrivateMode)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
      // TAB 4: BATAS AMAN CICILAN (DSR)
      // ======================================================== */}
      {activeTab === "dsr" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card Form Kiri */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Kalkulator Batas Beban Cicilan (DSR)</h3>
              <p className="text-xs text-slate-400 mt-0.5">Ukur kesehatan hutang bulanan agar arus kas tidak tertekan</p>
            </div>

            {/* Input Cicilan (Focal Point) */}
            <div className="text-center py-2 bg-slate-50/70 border border-slate-100 rounded-2xl p-4">
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Total Cicilan / Hutang Tiap Bulan
              </label>
              <div className="flex items-center justify-center gap-1.5">
                <span className="text-lg font-bold text-slate-400">Rp</span>
                <input
                  type="text"
                  placeholder="0"
                  value={dsrDebt}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, "");
                    setDsrDebt(clean ? new Intl.NumberFormat("id-ID").format(clean) : "");
                  }}
                  className="w-full max-w-xs text-center text-2xl sm:text-3xl font-bold text-slate-900 bg-transparent focus:outline-none placeholder-slate-300 tracking-tight"
                />
              </div>

              {/* Quick Chips */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3 pt-3 border-t border-slate-200/60">
                {[1000000, 2000000, 3000000, 5000000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAmountFormatted(setDsrDebt, val)}
                    className="px-3 py-1 rounded-full bg-white border border-slate-200 hover:border-emerald-500 hover:text-emerald-700 text-[11px] font-semibold text-slate-600 active:scale-95 transition cursor-pointer"
                  >
                    {val / 1000000} Jt
                  </button>
                ))}
              </div>
            </div>

            {/* Input Gaji Bersih */}
            <div>
              <label className="block text-slate-600 font-medium mb-1 text-xs">Penghasilan Bersih per Bulan (Rp)</label>
              <input
                type="text"
                placeholder="0"
                value={dsrIncome}
                onChange={(e) => {
                  const clean = e.target.value.replace(/\D/g, "");
                  setDsrIncome(clean ? new Intl.NumberFormat("id-ID").format(clean) : "");
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white text-xs transition"
              />
            </div>
          </div>

          {/* Card Hasil Kanan */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${dsrResult.statusColor}`}>
                  {dsrResult.statusLabel}
                </span>
                <span className="text-xs text-slate-400 font-medium">Batas Maksimal Sehat: 30%</span>
              </div>
              <h4 className="text-base font-bold text-slate-900 mt-2">Rasio Beban Cicilan (DSR)</h4>

              {/* Big Result Value */}
              <div className="mt-4 p-5 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                <span className="text-xs text-slate-400 block">Porsi Cicilan dari Gaji:</span>
                <h2 className="text-4xl font-black text-slate-900 tracking-tight mt-1">
                  {dsrResult.ratio}%
                </h2>
                <div className="mt-2 text-xs text-slate-500">
                  {dsrResult.ratio <= 30
                    ? "Arus kas sehat! Kapasitas cicilan masih dalam batas aman."
                    : dsrResult.ratio === 0
                    ? "Masukkan nominal penghasilan untuk menghitung rasio."
                    : "Waspada! Porsi cicilan berisiko mengganggu kestabilan keuangan bulanan."}
                </div>
              </div>

              {/* Breakdown Cards */}
              <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 text-[10px]">Batas Cicilan Maksimal:</span>
                  <p className="font-bold text-slate-800 mt-0.5">
                    {formatRupiah(dsrResult.maxSafeDebt, isPrivateMode)}
                  </p>
                </div>
                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
                  <span className="text-emerald-700 text-[10px]">Sisa Kuota Cicilan Aman:</span>
                  <p className="font-bold text-emerald-700 mt-0.5">
                    {formatRupiah(dsrResult.remainingQuota, isPrivateMode)}
                  </p>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 text-center">
              Pertahankan total cicilan di bawah 30% agar tabungan dan investasi tetap berjalan optimal.
            </p>
          </div>
        </div>
      )}

      {/* ========================================================
      // MODAL HELP / PANDUAN KALKULATOR PINTAR
      // ======================================================== */}
      <AnimatePresence>
        {isHelpOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="bg-white rounded-3xl border border-slate-200/90 shadow-xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header Modal */}
              <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Icons.HelpCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Panduan Fitur & Cara Hitung</h3>
                    <p className="text-[11px] text-slate-400">Penjelasan singkat 4 fitur Kalkulator Pintar</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsHelpOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Isi Panduan */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs text-slate-600">
                {/* 1. Dana Darurat */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                  <div className="flex items-center gap-2 text-slate-900 font-bold">
                    <Icons.Shield className="w-4 h-4 text-emerald-600" />
                    <span>1. Dana Darurat (Emergency Fund)</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    <strong>Fungsi:</strong> Menghitung cadangan uang tunai wajib untuk menghadapi situasi darurat (sakit, kehilangan pekerjaan, krisis).
                  </p>
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    <strong>Sistem Hitung:</strong> 3 bulan biaya hidup untuk lajang, 6 bulan untuk pasangan menikah, dan 9 bulan bagi yang memiliki anak. Ditambah +3 bulan bila berpenghasilan fluktuatif/freelance dan +1 bulan bila punya cicilan aktif.
                  </p>
                </div>

                {/* 2. Bunga Majemuk */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                  <div className="flex items-center gap-2 text-slate-900 font-bold">
                    <Icons.TrendingUp className="w-4 h-4 text-emerald-600" />
                    <span>2. Bunga Majemuk (Compound Interest)</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    <strong>Fungsi:</strong> Mensimulasikan hasil investasi berkala, di mana keuntungan yang didapat ikut menghasilkan keuntungan baru (*efek bola salju*).
                  </p>
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    <strong>Sistem Hitung:</strong> Menggunakan rumus anuitas masa depan dengan bunga majemuk bulanan: <code>FV = P(1+i)ⁿ + PMT × ((1+i)ⁿ - 1)/i</code>.
                  </p>
                </div>

                {/* 3. Aturan 50/30/20 */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                  <div className="flex items-center gap-2 text-slate-900 font-bold">
                    <Icons.ChartPie className="w-4 h-4 text-emerald-600" />
                    <span>3. Aturan Anggaran 50/30/20</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    <strong>Fungsi:</strong> Formula paling populer di dunia untuk membagi gaji bulanan agar tidak boncos namun tetap bisa berhemat dan bersenang-senang.
                  </p>
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    <strong>Pembagian:</strong> <strong>50%</strong> Kebutuhan pokok (makan, sewa, tagihan), <strong>30%</strong> Keinginan (nongkrong, hiburan, hobi), dan <strong>20%</strong> Tabungan & Investasi masa depan.
                  </p>
                </div>

                {/* 4. DSR */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                  <div className="flex items-center gap-2 text-slate-900 font-bold">
                    <Icons.Calculator className="w-4 h-4 text-emerald-600" />
                    <span>4. Batas Beban Cicilan (Debt Service Ratio)</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    <strong>Fungsi:</strong> Menguji apakah beban cicilan/pinjaman bulanan Anda masih dalam batas aman atau sudah membahayakan dompet.
                  </p>
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    <strong>Standar Keuangan:</strong> Maksimal cicilan yang sehat adalah <strong>30%</strong> dari penghasilan bersih. Jika di atas 40%, keuangan terancam gagal bayar saat terjadi guncangan ekonomi.
                  </p>
                </div>
              </div>

              {/* Footer Modal */}
              <div className="p-4 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsHelpOpen(false)}
                  className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-95 text-white rounded-full font-semibold transition shadow-xs cursor-pointer"
                >
                  Saya Paham
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
