"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatRupiah, getPaymentMethodInfo } from "./utils";
import { Icons } from "./Icons";

export default function CalendarDayModal({
  isOpen,
  onClose,
  selectedDay,
  isPrivateMode,
  onEditTransaction,
  onDeleteTransaction,
  onAddTransactionAtDate,
}) {
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen || !selectedDay) return null;

  const dateObj = new Date(selectedDay.dateStr);
  const formattedDate = dateObj.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const income = selectedDay.income || 0;
  const expense = selectedDay.expense || 0;
  const net = income - expense;

  return (
    <AnimatePresence>
      <div 
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-slate-900/60 backdrop-blur-sm overscroll-contain touch-none"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl w-full max-w-lg max-h-[85dvh] flex flex-col overflow-hidden isolate overscroll-contain"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Icons.Calendar className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">
                  Detail Transaksi Harian
                </span>
                <h3 className="text-sm font-bold text-slate-900">
                  {formattedDate}
                </h3>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition cursor-pointer"
            >
              <Icons.X className="w-4 h-4" />
            </button>
          </div>

          {/* Ringkasan Hari Ini: Pemasukan, Pengeluaran & Selisih Bersih */}
          <div className="p-4 bg-slate-50 border-b border-slate-100 grid grid-cols-3 gap-2.5 text-xs">
            <div className="p-2.5 bg-white rounded-xl border border-slate-100">
              <span className="text-slate-400 text-[10px] block">Pemasukan:</span>
              <p className="text-sm font-bold text-emerald-600 mt-0.5">
                +{formatRupiah(income, isPrivateMode)}
              </p>
            </div>
            <div className="p-2.5 bg-white rounded-xl border border-slate-100">
              <span className="text-slate-400 text-[10px] block">Pengeluaran:</span>
              <p className="text-sm font-bold text-rose-600 mt-0.5">
                -{formatRupiah(expense, isPrivateMode)}
              </p>
            </div>
            <div className="p-2.5 bg-white rounded-xl border border-slate-100">
              <span className="text-slate-400 text-[10px] block">Arus Kas Bersih:</span>
              <p className={`text-sm font-bold mt-0.5 ${net >= 0 ? "text-emerald-700" : "text-rose-600"}`}>
                {net >= 0 ? "+" : ""}{formatRupiah(net, isPrivateMode)}
              </p>
            </div>
          </div>

          {/* List Transaksi */}
          <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100">
            {selectedDay.transactions && selectedDay.transactions.length > 0 ? (
              selectedDay.transactions.map((tx) => {
                const isExpense = tx.type === "pengeluaran";
                const time = new Date(tx.created_at).toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <div key={tx.id} className="py-2.5 flex items-center justify-between text-xs group hover:bg-slate-50/60 px-2 rounded-xl transition">
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-slate-800 truncate">
                          {tx.note || tx.category}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium">
                          {tx.category}
                        </span>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border ${getPaymentMethodInfo(tx.payment_method).bg}`}>
                          {getPaymentMethodInfo(tx.payment_method).short}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Pukul {time}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`font-bold mr-1 ${
                          isExpense ? "text-rose-600" : "text-emerald-600"
                        }`}
                      >
                        {isExpense ? "-" : "+"}
                        {formatRupiah(tx.amount, isPrivateMode)}
                      </span>
                      <button
                        onClick={() => {
                          onClose();
                          onEditTransaction(tx);
                        }}
                        className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-slate-100 rounded transition cursor-pointer"
                        title="Edit transaksi"
                      >
                        <Icons.Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          onClose();
                          onDeleteTransaction(tx.id);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                        title="Hapus transaksi"
                      >
                        <Icons.Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-slate-400">
                <div className="w-10 h-10 mx-auto rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                  <Icons.Receipt className="w-5 h-5" />
                </div>
                <p className="text-xs font-medium text-slate-600">Tidak ada catatan transaksi pada tanggal ini.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Kamu dapat mencatat transaksi langsung untuk tanggal ini.</p>
              </div>
            )}
          </div>

          {/* Bottom Actions Bar */}
          <div className="p-4 border-t border-slate-100 flex items-center justify-between gap-2">
            {onAddTransactionAtDate ? (
              <button
                type="button"
                onClick={() => onAddTransactionAtDate(selectedDay.dateStr)}
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-95 text-white rounded-full text-xs font-semibold transition shadow-xs cursor-pointer"
              >
                <span>+ Catat Transaksi</span>
              </button>
            ) : (
              <div />
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 rounded-full text-xs font-medium transition cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
