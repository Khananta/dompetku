"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icons } from "./Icons";
import { PAYMENT_METHODS } from "./utils";

export default function TransactionModal({
  isOpen,
  onClose,
  formData,
  setFormData,
  onSubmit,
  isEditing,
  availableCategories,
  submitLoading,
}) {
  if (!isOpen) return null;

  const quickNominals = [
    { label: "+10rb", value: 10000 },
    { label: "+20rb", value: 20000 },
    { label: "+50rb", value: 50000 },
    { label: "+100rb", value: 100000 },
    { label: "+500rb", value: 500000 },
  ];

  const handleAddQuickNominal = (val) => {
    const current = Number(String(formData.amount).replace(/\D/g, "")) || 0;
    const nextVal = current + val;
    setFormData((prev) => ({
      ...prev,
      amount: new Intl.NumberFormat("id-ID").format(nextVal),
    }));
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
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                formData.type === "pengeluaran" ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
              }`}>
                {formData.type === "pengeluaran" ? <Icons.TrendingDown className="w-4 h-4" /> : <Icons.TrendingUp className="w-4 h-4" />}
              </div>
              <h3 className="text-sm font-semibold text-slate-900">
                {isEditing ? "Edit Catatan Transaksi" : "Tambah Transaksi Baru"}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              ✕
            </button>
          </div>

          {/* Form Scrollable */}
          <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-xs">
            {/* 1. Segmented Control Tipe */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-full">
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, type: "pengeluaran" }))}
                className={`py-2 rounded-full font-semibold transition-all cursor-pointer ${
                  formData.type === "pengeluaran"
                    ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Pengeluaran
              </button>
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, type: "pemasukan" }))}
                className={`py-2 rounded-full font-semibold transition-all cursor-pointer ${
                  formData.type === "pemasukan"
                    ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Pemasukan
              </button>
            </div>

            {/* 2. Input Nominal Besar (Clean Focal Point) */}
            <div className="text-center py-2 bg-slate-50/70 border border-slate-100 rounded-2xl p-4">
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Nominal Transaksi
              </label>
              <div className="flex items-center justify-center gap-1.5">
                <span className="text-lg font-bold text-slate-400">Rp</span>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="0"
                  value={formData.amount}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, "");
                    const formatted = clean ? new Intl.NumberFormat("id-ID").format(clean) : "";
                    setFormData((prev) => ({ ...prev, amount: formatted }));
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

            {/* 3. Kategori Quick Selector (Chips/Grid Bersih) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-slate-600 font-medium">Pilih Kategori</label>
                <span className="text-[10px] text-slate-400">
                  Terpilih: <strong className="text-slate-700">{formData.category}</strong>
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                {availableCategories.map((c, idx) => {
                  const isSelected = formData.category === c.name;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, category: c.name }))}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer ${
                        isSelected
                          ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-transparent shadow-xs"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >
                      <Icons.Tag className="w-3 h-3" />
                      <span>{c.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Metode Pembayaran / Dompet (Fitur Bermanfaat) */}
            <div>
              <label className="block text-slate-600 font-medium mb-1.5">
                Sumber Dana / Dompet
              </label>
              <div className="grid grid-cols-3 gap-2">
                {PAYMENT_METHODS.map((pm) => {
                  const isSelected = (formData.payment_method || "cash") === pm.id;
                  return (
                    <button
                      key={pm.id}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, payment_method: pm.id }))}
                      className={`py-2 px-2.5 rounded-full border text-center text-[11px] font-semibold transition cursor-pointer active:scale-95 ${
                        isSelected
                          ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-transparent shadow-xs"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {pm.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 5. Tanggal & Jam */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Tanggal</label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">Jam</label>
                <input
                  type="time"
                  required
                  value={formData.time}
                  onChange={(e) => setFormData((prev) => ({ ...prev, time: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* 6. Catatan Keterangan */}
            <div>
              <label className="block text-slate-600 font-medium mb-1">
                Catatan (Opsional)
              </label>
              <input
                type="text"
                placeholder="Contoh: Beli kopi sore, Gaji freelance, dll."
                value={formData.note}
                onChange={(e) => setFormData((prev) => ({ ...prev, note: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 rounded-full font-medium transition cursor-pointer text-xs"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitLoading}
                className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-95 text-white rounded-full font-medium transition shadow-xs hover:shadow disabled:opacity-50 flex items-center gap-1.5 cursor-pointer text-xs"
              >
                {submitLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Icons.Check className="w-3.5 h-3.5" />
                )}
                <span>{isEditing ? "Perbarui Transaksi" : "Simpan Transaksi"}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
