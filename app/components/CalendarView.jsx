"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { formatRupiah } from "./utils";
import { Icons } from "./Icons";

export default function CalendarView({
  transactions,
  isPrivateMode,
  onSelectDay,
  onAddTransactionAtDate,
}) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [viewFilter, setViewFilter] = useState("semua"); // "semua" | "pengeluaran" | "pemasukan"
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const datePickerRef = useRef(null);

  // Close popup bila klik di luar
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target)) {
        setIsDatePickerOpen(false);
      }
    };
    if (isDatePickerOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDatePickerOpen]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Ringkasan Finansial Bulan yang Sedang Ditampilkan
  const monthTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const d = new Date(t.created_at);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  }, [transactions, year, month]);

  const monthIncome = useMemo(() => {
    return monthTransactions
      .filter((t) => t.type === "pemasukan")
      .reduce((sum, t) => sum + Math.round(Number(t.amount)), 0);
  }, [monthTransactions]);

  const monthExpense = useMemo(() => {
    return monthTransactions
      .filter((t) => t.type === "pengeluaran")
      .reduce((sum, t) => sum + Math.round(Number(t.amount)), 0);
  }, [monthTransactions]);

  const monthNet = monthIncome - monthExpense;

  // Analisis hari dengan pengeluaran terbesar di bulan ini
  const peakExpenseInfo = useMemo(() => {
    const dailyMap = {};
    monthTransactions
      .filter((t) => t.type === "pengeluaran")
      .forEach((t) => {
        const itemDate = new Date(t.created_at);
        const offset = itemDate.getTimezoneOffset() * 60000;
        const key = new Date(itemDate.getTime() - offset).toISOString().split("T")[0];
        dailyMap[key] = (dailyMap[key] || 0) + Math.round(Number(t.amount));
      });

    let peakDate = null;
    let peakAmount = 0;
    Object.entries(dailyMap).forEach(([dateStr, amt]) => {
      if (amt > peakAmount) {
        peakAmount = amt;
        peakDate = dateStr;
      }
    });

    if (!peakDate || peakAmount === 0) {
      return { amount: 0, dateFormatted: "Belum ada" };
    }

    const d = new Date(peakDate);
    const dateFormatted = d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
    });

    return { amount: peakAmount, dateFormatted };
  }, [monthTransactions]);

  // Kalkulasi Matriks Kalender
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthTotalDays = new Date(year, month, 0).getDate();

    const days = [];

    // Hari dari bulan sebelumnya
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        dayNumber: prevMonthTotalDays - i,
        isCurrentMonth: false,
        dateStr: "",
      });
    }

    // Hari dari bulan berjalan
    for (let d = 1; d <= totalDays; d++) {
      const mm = String(month + 1).padStart(2, "0");
      const dd = String(d).padStart(2, "0");
      const dateStr = `${year}-${mm}-${dd}`;

      const dayTx = transactions.filter((t) => {
        const itemDate = new Date(t.created_at);
        const offset = itemDate.getTimezoneOffset() * 60000;
        const itemDateStr = new Date(itemDate.getTime() - offset).toISOString().split("T")[0];
        return itemDateStr === dateStr;
      });

      const inc = dayTx
        .filter((t) => t.type === "pemasukan")
        .reduce((s, t) => s + Math.round(Number(t.amount)), 0);

      const exp = dayTx
        .filter((t) => t.type === "pengeluaran")
        .reduce((s, t) => s + Math.round(Number(t.amount)), 0);

      days.push({
        dayNumber: d,
        isCurrentMonth: true,
        dateStr,
        transactions: dayTx,
        income: inc,
        expense: exp,
        net: inc - exp,
      });
    }

    // Sisa slot untuk mengisi baris terakhir kalender
    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        days.push({
          dayNumber: i,
          isCurrentMonth: false,
          dateStr: "",
        });
      }
    }

    return days;
  }, [transactions, year, month]);

  const todayStr = useMemo(() => {
    const t = new Date();
    const offset = t.getTimezoneOffset() * 60000;
    return new Date(t.getTime() - offset).toISOString().split("T")[0];
  }, []);

  return (
    <div className="space-y-6">
      {/* ========================================================
      // 1. TOP 4 STATS CARDS (KONSISTEN DENGAN DASHBOARD & PENGELUARAN)
      // ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Pemasukan Bulan Ini */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Pemasukan Bulan Ini</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Icons.TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl font-bold tracking-tight text-emerald-600">
              +{formatRupiah(monthIncome, isPrivateMode)}
            </h2>
            <div className="mt-2 text-[11px] text-slate-400">
              {monthTransactions.filter((t) => t.type === "pemasukan").length} transaksi pemasukan
            </div>
          </div>
        </div>

        {/* Card 2: Pengeluaran Bulan Ini */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Pengeluaran Bulan Ini</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Icons.TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl font-bold tracking-tight text-rose-600">
              -{formatRupiah(monthExpense, isPrivateMode)}
            </h2>
            <div className="mt-2 text-[11px] text-slate-400">
              {monthTransactions.filter((t) => t.type === "pengeluaran").length} transaksi pengeluaran
            </div>
          </div>
        </div>

        {/* Card 3: Arus Kas Bersih */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Arus Kas Bersih</span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              monthNet < 0 ? "bg-rose-50 text-rose-600" : "bg-blue-50 text-blue-600"
            }`}>
              <Icons.Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className={`text-2xl font-bold tracking-tight ${monthNet < 0 ? "text-rose-600" : "text-slate-900"}`}>
              {formatRupiah(monthNet, isPrivateMode)}
            </h2>
            <div className="mt-2 flex items-center gap-1.5 text-[11px]">
              <span className={`font-semibold px-2 py-0.5 rounded-full ${
                monthNet >= 0
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                  : "bg-rose-50 text-rose-700 border border-rose-100"
              }`}>
                {monthNet >= 0 ? "Surplus Bulan Ini" : "Defisit Bulan Ini"}
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Puncak Pengeluaran Harian */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Puncak Belanja Harian</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Icons.Calculator className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl font-bold tracking-tight text-amber-600">
              {formatRupiah(peakExpenseInfo.amount, isPrivateMode)}
            </h2>
            <div className="mt-2 text-[11px] text-slate-400">
              Tertinggi pada: <strong className="text-slate-700 font-semibold">{peakExpenseInfo.dateFormatted}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
      // 2. MAIN CALENDAR CARD
      // ======================================================== */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
        {/* Calendar Header with Rounded Green Chevron Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base sm:text-xl font-bold text-slate-900 tracking-tight">
              {monthNames[month]} {year}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Klik pada tanggal untuk melihat rincian mutasi hari tersebut.
            </p>
          </div>

          {/* Right Header: Filter & Navigation (Hilangkan teks Hari Ini, Chevron Buttons Rounded Full & Light Green) */}
          <div className="flex items-center gap-3 self-end sm:self-auto">
            {/* Filter Pill: Semua / Pengeluaran / Pemasukan */}
            <div className="flex items-center p-1 bg-slate-100 rounded-full text-xs font-medium">
              <button
                type="button"
                onClick={() => setViewFilter("semua")}
                className={`px-3 py-1.5 rounded-full transition-all active:scale-95 cursor-pointer ${
                  viewFilter === "semua"
                    ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setViewFilter("pengeluaran")}
                className={`px-3 py-1.5 rounded-full transition-all active:scale-95 cursor-pointer ${
                  viewFilter === "pengeluaran"
                    ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Pengeluaran
              </button>
              <button
                type="button"
                onClick={() => setViewFilter("pemasukan")}
                className={`px-3 py-1.5 rounded-full transition-all active:scale-95 cursor-pointer ${
                  viewFilter === "pemasukan"
                    ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Pemasukan
              </button>
            </div>

            {/* Tombol Navigasi: Tombol Kalender (Pilih & Loncat Bulan) di Sebelah Kiri Chevron Left */}
            <div className="relative flex items-center gap-1.5" ref={datePickerRef}>
              <button
                type="button"
                onClick={() => setIsDatePickerOpen((prev) => !prev)}
                className={`w-8 h-8 rounded-full border border-emerald-200/60 shadow-2xs flex items-center justify-center transition cursor-pointer active:scale-95 ${
                  isDatePickerOpen
                    ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
                    : "bg-[#f0fdf4] hover:bg-[#dcfce7] text-emerald-700"
                }`}
                title="Pilih & Loncat Bulan/Tahun"
              >
                <Icons.Calendar className="w-4 h-4" />
              </button>

              {/* Popover Loncat Bulan & Tahun */}
              {isDatePickerOpen && (
                <div className="absolute right-0 top-10 z-40 bg-white rounded-2xl border border-slate-200/90 shadow-xl p-4 w-72 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-800">Pilih Periode Bulan</span>
                    <select
                      value={year}
                      onChange={(e) => setCurrentDate(new Date(Number(e.target.value), month, 1))}
                      className="text-xs font-semibold px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-emerald-500"
                    >
                      {[year - 3, year - 2, year - 1, year, year + 1, year + 2, year + 3].map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Grid 12 Bulan */}
                  <div className="grid grid-cols-3 gap-1.5 py-3">
                    {monthNames.map((mName, mIdx) => {
                      const isSelected = mIdx === month;
                      return (
                        <button
                          key={mIdx}
                          type="button"
                          onClick={() => {
                            setCurrentDate(new Date(year, mIdx, 1));
                            setIsDatePickerOpen(false);
                          }}
                          className={`py-1.5 text-xs rounded-xl font-medium transition cursor-pointer ${
                            isSelected
                              ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold shadow-xs"
                              : "hover:bg-slate-100 text-slate-600"
                          }`}
                        >
                          {mName.slice(0, 3)}
                        </button>
                      );
                    })}
                  </div>

                  {/* Loncat ke Bulan Ini */}
                  <div className="pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentDate(new Date());
                        setIsDatePickerOpen(false);
                      }}
                      className="w-full py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition cursor-pointer text-center"
                    >
                      Loncat ke Bulan Sekarang
                    </button>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handlePrevMonth}
                className="w-8 h-8 rounded-full bg-[#f0fdf4] hover:bg-[#dcfce7] active:scale-95 text-emerald-700 border border-emerald-200/60 shadow-2xs flex items-center justify-center transition cursor-pointer"
                title="Bulan sebelumnya"
              >
                <Icons.ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="w-8 h-8 rounded-full bg-[#f0fdf4] hover:bg-[#dcfce7] active:scale-95 text-emerald-700 border border-emerald-200/60 shadow-2xs flex items-center justify-center transition cursor-pointer"
                title="Bulan berikutnya"
              >
                <Icons.ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Days Grid Header */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-400 uppercase py-1">
          {dayNames.map((d, idx) => (
            <div key={idx} className={idx === 0 ? "text-rose-500" : ""}>
              {d}
            </div>
          ))}
        </div>

        {/* Calendar Days Matrix */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {calendarDays.map((item, index) => {
            if (!item.isCurrentMonth) {
              return (
                <div
                  key={index}
                  className="min-h-[75px] sm:min-h-[92px] p-1.5 sm:p-2 rounded-xl bg-slate-50/40 text-slate-300 text-xs select-none"
                >
                  <span className="font-semibold text-slate-300">{item.dayNumber}</span>
                </div>
              );
            }

            const isToday = item.dateStr === todayStr;
            const hasTx = item.transactions && item.transactions.length > 0;
            const showInc = (viewFilter === "semua" || viewFilter === "pemasukan") && item.income > 0;
            const showExp = (viewFilter === "semua" || viewFilter === "pengeluaran") && item.expense > 0;

            return (
              <div
                key={index}
                onClick={() => onSelectDay(item)}
                className={`min-h-[75px] sm:min-h-[92px] p-2 rounded-2xl border transition flex flex-col justify-between ${
                  isToday
                    ? "border-emerald-500 bg-emerald-50/30 shadow-xs"
                    : "border-slate-100 bg-white hover:border-slate-300 hover:shadow-xs"
                } cursor-pointer active:scale-95 group`}
              >
                {/* Day Header */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                      isToday
                        ? "bg-emerald-600 text-white shadow-2xs"
                        : "text-slate-700 group-hover:text-emerald-700"
                    }`}
                  >
                    {item.dayNumber}
                  </span>

                  {hasTx && (
                    <span className="text-[10px] text-slate-400 font-medium hidden sm:inline px-1.5 py-0.2 rounded bg-slate-100 group-hover:bg-slate-200">
                      {item.transactions.length} tx
                    </span>
                  )}
                </div>

                {/* Day Financial Badges */}
                <div className="space-y-0.5 mt-1 min-w-0">
                  {showInc && (
                    <div className="text-[10px] text-emerald-700 bg-emerald-50/80 px-1.5 py-0.5 rounded font-semibold truncate border border-emerald-100/60">
                      +{formatRupiah(item.income, isPrivateMode)}
                    </div>
                  )}
                  {showExp && (
                    <div className="text-[10px] text-rose-700 bg-rose-50/80 px-1.5 py-0.5 rounded font-semibold truncate border border-rose-100/60">
                      -{formatRupiah(item.expense, isPrivateMode)}
                    </div>
                  )}
                  {!hasTx && (
                    <span className="text-[10px] text-slate-300 font-normal pl-0.5 select-none">-</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend Petunjuk Warna Kalender */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Uang Masuk / Pemasukan</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>Uang Keluar / Pengeluaran</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full ring-2 ring-emerald-500 bg-emerald-100" />
              <span>Hari Ini</span>
            </div>
          </div>
          <span className="text-[11px] text-slate-400">
            Pilih tanggal manapun untuk melihat detail atau mencatat transaksi
          </span>
        </div>
      </div>
    </div>
  );
}
