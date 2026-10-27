"use client";

import React, { useEffect } from "react";
import { Icons } from "./Icons";
import { PAYMENT_METHODS } from "./utils";

export default function BulkTransactionModal({
  isOpen,
  onClose,
  bulkRows,
  setBulkRows,
  allCategories,
  onSubmit,
  submitLoading,
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

  if (!isOpen) return null;

  const addRow = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    const dateStr = new Date(now.getTime() - offset).toISOString().split("T")[0];
    const timeStr = now.toTimeString().split(" ")[0].substring(0, 5);

    const defaultCat =
      allCategories.find((c) => c.type === "pengeluaran")?.name || "Makanan";

    setBulkRows([
      ...bulkRows,
      {
        id: String(Date.now() + Math.random()),
        type: "pengeluaran",
        amount: "",
        category: defaultCat,
        payment_method: "cash",
        note: "",
        date: dateStr,
        time: timeStr,
      },
    ]);
  };

  const removeRow = (index) => {
    if (bulkRows.length <= 1) return;
    setBulkRows(bulkRows.filter((_, idx) => idx !== index));
  };

  const updateRow = (index, field, value) => {
    setBulkRows((prev) =>
      prev.map((row, idx) => {
        if (idx !== index) return row;
        const updated = { ...row, [field]: value };

        // Jika tipe diubah, update kategori ke kategori pertama yang sesuai
        if (field === "type") {
          const matchingCat = allCategories.find((c) => c.type === value)?.name || "Lainnya";
          updated.category = matchingCat;
        }
        return updated;
      })
    );
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overscroll-contain touch-none"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl w-full max-w-4xl max-h-[88dvh] flex flex-col overflow-hidden isolate overscroll-contain"
      >
        {/* Header Modal */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-xs">
              <Icons.Receipt className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Catat Massal Transaksi</h3>
              <p className="text-xs text-slate-400">Tambahkan banyak mutasi sekaligus secara cepat dan rapi.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition cursor-pointer"
          >
            <Icons.X className="w-4 h-4" />
          </button>
        </div>

        {/* Rows Container */}
        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 overscroll-contain">
          <div className="space-y-3">
            {bulkRows.map((row, idx) => (
              <div
                key={row.id || idx}
                className="p-4 bg-slate-50/80 hover:bg-slate-50 border border-slate-200/90 rounded-2xl transition space-y-3 shadow-2xs"
              >
                {/* Baris Atas: Nomor Baris, Tipe Toggle, Waktu & Hapus */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center justify-center shrink-0">
                      #{idx + 1}
                    </span>

                    {/* Tipe Toggle (Rounded-full & Green Gradient saat aktif) */}
                    <div className="inline-flex p-0.5 bg-slate-200/70 rounded-full text-xs font-semibold">
                      <button
                        type="button"
                        onClick={() => updateRow(idx, "type", "pengeluaran")}
                        className={`px-3 py-1 rounded-full text-[11px] transition cursor-pointer ${
                          row.type === "pengeluaran"
                            ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        Pengeluaran
                      </button>
                      <button
                        type="button"
                        onClick={() => updateRow(idx, "type", "pemasukan")}
                        className={`px-3 py-1 rounded-full text-[11px] transition cursor-pointer ${
                          row.type === "pemasukan"
                            ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        Pemasukan
                      </button>
                    </div>
                  </div>

                  {/* Tanggal, Jam & Tombol Hapus */}
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      required
                      value={row.date}
                      onChange={(e) => updateRow(idx, "date", e.target.value)}
                      className="py-1 px-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-emerald-500"
                    />
                    <input
                      type="time"
                      required
                      value={row.time}
                      onChange={(e) => updateRow(idx, "time", e.target.value)}
                      className="py-1 px-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-emerald-500"
                    />
                    {bulkRows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRow(idx)}
                        title="Hapus baris ini"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 active:scale-95 rounded-xl transition cursor-pointer"
                      >
                        <Icons.Trash className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Baris Input Data: Nominal, Kategori, Sumber Dana & Catatan */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {/* Nominal */}
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                      Nominal (Rp)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                        Rp
                      </span>
                      <input
                        type="text"
                        placeholder="0"
                        required
                        value={row.amount}
                        onChange={(e) => {
                          const clean = e.target.value.replace(/\D/g, "");
                          const formatted = clean ? new Intl.NumberFormat("id-ID").format(clean) : "";
                          updateRow(idx, "amount", formatted);
                        }}
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Kategori */}
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                      Kategori
                    </label>
                    <select
                      value={row.category}
                      onChange={(e) => updateRow(idx, "category", e.target.value)}
                      className="w-full py-2 px-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      {allCategories
                        .filter((c) => c.type === row.type)
                        .map((c, i) => (
                          <option key={i} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Sumber Dana / Dompet */}
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                      Sumber Dana
                    </label>
                    <select
                      value={row.payment_method || "cash"}
                      onChange={(e) => updateRow(idx, "payment_method", e.target.value)}
                      className="w-full py-2 px-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      {PAYMENT_METHODS.map((pm) => (
                        <option key={pm.id} value={pm.id}>
                          {pm.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Catatan / Keterangan */}
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                      Catatan
                    </label>
                    <input
                      type="text"
                      placeholder="Keterangan opsional..."
                      value={row.note}
                      onChange={(e) => updateRow(idx, "note", e.target.value)}
                      className="w-full py-2 px-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Tombol Tambah Baris */}
          <button
            type="button"
            onClick={addRow}
            className="w-full py-2.5 border-2 border-dashed border-emerald-300 hover:border-emerald-500 rounded-full text-xs font-semibold text-emerald-700 hover:bg-emerald-50/50 active:scale-[0.99] transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Icons.Plus className="w-3.5 h-3.5" />
            <span>Tambah Baris Transaksi</span>
          </button>

          {/* Footer Action Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 rounded-full text-xs font-medium transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitLoading}
              className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-95 text-white rounded-full text-xs font-medium transition shadow-xs hover:shadow disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              {submitLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Icons.Check className="w-3.5 h-3.5" />
              )}
              <span>Simpan Semua ({bulkRows.length} Transaksi)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
