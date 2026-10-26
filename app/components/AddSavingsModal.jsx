"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";
import { formatRupiah } from "./utils";
import { Icons } from "./Icons";

export default function AddSavingsModal({ isOpen, onClose, goal, onSave }) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);

  if (!isOpen || !goal) return null;

  const current = Number(goal.current_amount) || 0;
  const target = Number(goal.target_amount) || 1;
  const percent = Math.min(100, Math.round((current / target) * 100));
  const remaining = Math.max(0, target - current);

  const quickNominals = [
    { label: "+50rb", value: 50000 },
    { label: "+100rb", value: 100000 },
    { label: "+200rb", value: 200000 },
    { label: "+500rb", value: 500000 },
    { label: "+1jt", value: 1000000 },
  ];

  const handleAddQuickNominal = (val) => {
    const curr = Number(String(amount).replace(/\D/g, "")) || 0;
    const nextVal = curr + val;
    setAmount(new Intl.NumberFormat("id-ID").format(nextVal));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanNum = Number(amount.replace(/\D/g, ""));
    if (cleanNum <= 0) {
      Swal.fire("Gagal", "Nominal setoran tabungan harus lebih dari 0!", "warning");
      return;
    }

    onSave(goal, cleanNum, note.trim() || "Setoran Tabungan", date);
    setAmount("");
    setNote("");
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="bg-white rounded-3xl border border-slate-200/90 shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Icons.Wallet className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Setor Dana Tabungan</h3>
                <p className="text-[11px] text-slate-400">
                  Target: <strong className="text-slate-700 font-semibold">{goal.goal_name}</strong>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Form Scrollable */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-xs">
            {/* Ringkasan Status Tabungan Saat Ini */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500 font-medium">Terkumpul Saat Ini:</span>
                <span className="font-bold text-emerald-600">
                  {formatRupiah(current)} <span className="text-slate-400 font-normal">/ {formatRupiah(target)}</span>
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 transition-all duration-300"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>{percent}% tercapai</span>
                <span>Sisa kurang: {formatRupiah(remaining)}</span>
              </div>
            </div>

            {/* Input Nominal Besar (Focal Point) */}
            <div className="text-center py-2 bg-slate-50/70 border border-slate-100 rounded-2xl p-4">
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Nominal yang Disetor
              </label>
              <div className="flex items-center justify-center gap-1.5">
                <span className="text-lg font-bold text-slate-400">Rp</span>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="0"
                  value={amount}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, "");
                    setAmount(clean ? new Intl.NumberFormat("id-ID").format(clean) : "");
                  }}
                  className="w-full max-w-xs text-center text-2xl sm:text-3xl font-bold text-slate-900 bg-transparent focus:outline-none placeholder-slate-300 tracking-tight"
                />
              </div>

              {/* Quick Chips Nominal */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3 pt-3 border-t border-slate-200/60">
                {quickNominals.map((q, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleAddQuickNominal(q.value)}
                    className="px-3 py-1 rounded-full bg-white border border-slate-200 hover:border-emerald-500 hover:text-emerald-700 text-[11px] font-semibold text-slate-600 active:scale-95 transition cursor-pointer"
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Catatan / Sumber Setoran & Tanggal */}
            <div className="space-y-4">
              <div>
                <label className="block text-slate-600 font-medium mb-1">
                  Catatan / Keterangan Setoran
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Gaji bulanan, Uang lembur, Sisa uang belanja"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">
                  Tanggal Setoran
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
                />
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 rounded-full font-medium transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-95 text-white rounded-full font-semibold transition shadow-xs hover:shadow flex items-center gap-1.5 cursor-pointer"
              >
                <Icons.Check className="w-3.5 h-3.5" />
                <span>Setor Dana</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
