"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";
import { Icons } from "./Icons";

export default function BillingModal({ isOpen, onClose, onSave }) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [type, setType] = useState("biasa"); // "biasa" | "hutang" | "piutang"
  const [person, setPerson] = useState("");

  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const quickNominals = [
    { label: "+10rb", value: 10000 },
    { label: "+20rb", value: 20000 },
    { label: "+50rb", value: 50000 },
    { label: "+100rb", value: 100000 },
    { label: "+500rb", value: 500000 },
    { label: "+1jt", value: 1000000 },
  ];

  const handleAddQuickNominal = (val) => {
    const current = Number(String(amount).replace(/\D/g, "")) || 0;
    const nextVal = current + val;
    setAmount(new Intl.NumberFormat("id-ID").format(nextVal));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      Swal.fire("Gagal", "Nama tagihan / keterangan wajib diisi!", "warning");
      return;
    }
    const cleanNum = Number(amount.replace(/\D/g, ""));
    if (cleanNum <= 0) {
      Swal.fire("Gagal", "Nominal tagihan harus lebih dari 0!", "warning");
      return;
    }
    if (!dueDate) {
      Swal.fire("Gagal", "Tanggal jatuh tempo wajib dipilih!", "warning");
      return;
    }
    if (type !== "biasa" && !person.trim()) {
      Swal.fire("Gagal", "Nama orang yang terkait wajib diisi!", "warning");
      return;
    }

    onSave({
      bill_name: name.trim(),
      amount: cleanNum,
      due_date: dueDate,
      billing_type: type,
      person_name: type !== "biasa" ? person.trim() : "",
      status: "belum_bayar",
    });

    setName("");
    setAmount("");
    setDueDate("");
    setType("biasa");
    setPerson("");
  };

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
          className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[88dvh] isolate overscroll-contain"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Icons.Receipt className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900">
                Tambah Tagihan & Kewajiban
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition cursor-pointer"
            >
              <Icons.X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Scrollable */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-xs overscroll-contain">
            {/* 1. Segmented Control Tipe (Full Rounded & Gradient Hijau) */}
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1.5">
                Jenis Kewajiban
              </label>
              <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-full">
                <button
                  type="button"
                  onClick={() => setType("biasa")}
                  className={`py-2 rounded-full font-semibold transition-all cursor-pointer ${
                    type === "biasa"
                      ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Tagihan Rutin
                </button>
                <button
                  type="button"
                  onClick={() => setType("hutang")}
                  className={`py-2 rounded-full font-semibold transition-all cursor-pointer ${
                    type === "hutang"
                      ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Hutang Saya
                </button>
                <button
                  type="button"
                  onClick={() => setType("piutang")}
                  className={`py-2 rounded-full font-semibold transition-all cursor-pointer ${
                    type === "piutang"
                      ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Piutang Saya
                </button>
              </div>
            </div>

            {/* 2. Input Nominal Besar (Focal Point Identik Transaksi) */}
            <div className="text-center py-2 bg-slate-50/70 border border-slate-100 rounded-2xl p-4">
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Nominal Tagihan / Pinjaman
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

            {/* 3. Nama Tagihan & Orang Terkait */}
            <div className="space-y-3">
              <div>
                <label className="block text-slate-600 font-medium mb-1">
                  Nama Tagihan / Keterangan
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    type === "biasa"
                      ? "Contoh: Listrik PLN, WiFi Indihome, Kost Bulanan"
                      : type === "hutang"
                      ? "Contoh: Pinjaman modal usaha, Talangan tiket pesawat"
                      : "Contoh: Pinjaman teman, Talangan makan bareng"
                  }
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
                />
              </div>

              {type !== "biasa" && (
                <div>
                  <label className="block text-slate-600 font-medium mb-1">
                    {type === "hutang" ? "Pemberi Pinjaman (Hutang ke Siapa)" : "Peminjam (Dipinjam oleh Siapa)"}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nama Teman / Kontak Terkait"
                    value={person}
                    onChange={(e) => setPerson(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
                  />
                </div>
              )}

              {/* 4. Tanggal Jatuh Tempo */}
              <div>
                <label className="block text-slate-600 font-medium mb-1">
                  Batas Tanggal Jatuh Tempo
                </label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
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
                className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-95 text-white rounded-full font-semibold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Icons.Check className="w-3.5 h-3.5" />
                <span>Simpan Tagihan</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
