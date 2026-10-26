"use client";

import React, { useState, useMemo } from "react";
import Swal from "sweetalert2";
import { formatRupiah } from "./utils";
import { Icons } from "./Icons";

export default function SplitBillView({ isPrivateMode, onAddTransactionDirect }) {
  const [mode, setMode] = useState("itemized"); // "itemized" (Universal Resto/Kafe) | "simple"

  // ==========================================
  // STATE MODE 1: RINCIAN PESANAN (DEFAULT KOSONG & UNIVERSAL)
  // ==========================================
  const [members, setMembers] = useState([
    {
      id: "1",
      name: "Saya",
      items: [{ id: "i1", name: "", price: "" }],
    },
    {
      id: "2",
      name: "Orang 1",
      items: [{ id: "i2", name: "", price: "" }],
    },
  ]);

  // Menu Patungan Bersama (Shared Dishes) - Default Kosong
  const [sharedItems, setSharedItems] = useState([]);

  // Pajak & Biaya Tambahan - Default Kosong
  const [taxType, setTaxType] = useState("percent"); // "percent" | "nominal"
  const [taxValue, setTaxValue] = useState(""); // Default kosong
  const [serviceFee, setServiceFee] = useState("");
  const [discountAmount, setDiscountAmount] = useState("");
  const [otherFees, setOtherFees] = useState("");

  // ==========================================
  // STATE MODE 2: SIMPEL (BAGI RATA) - DEFAULT KOSONG
  // ==========================================
  const [simpleTotal, setSimpleTotal] = useState("");
  const [simplePeople, setSimplePeople] = useState(2);
  const [simpleTax, setSimpleTax] = useState("");
  const [simpleService, setSimpleService] = useState("");

  // ==========================================
  // KALKULASI MODE RINCIAN (PROPORSONAL ADIL 100%)
  // ==========================================
  const itemizedCalculation = useMemo(() => {
    // 1. Hitung total menu bersama per orang
    const totalShared = sharedItems.reduce(
      (sum, it) => sum + (Number(String(it.price).replace(/\D/g, "")) || 0),
      0
    );
    const sharedPerPerson = members.length > 0 ? Math.round(totalShared / members.length) : 0;

    // 2. Subtotal makanan dasar per orang (pesanan pribadi + bagian menu bersama)
    let totalFoodSubtotal = 0;
    const memberBases = members.map((m) => {
      const personalSum = m.items.reduce(
        (sum, it) => sum + (Number(String(it.price).replace(/\D/g, "")) || 0),
        0
      );
      const combinedSubtotal = personalSum + sharedPerPerson;
      totalFoodSubtotal += combinedSubtotal;
      return {
        ...m,
        personalSum,
        sharedShare: sharedPerPerson,
        combinedSubtotal,
      };
    });

    // 3. Kalkulasi Pajak, Service, Diskon, dan Biaya Lain
    let totalTaxCalculated = 0;
    if (taxType === "percent") {
      const pct = Number(taxValue) || 0;
      totalTaxCalculated = Math.round((totalFoodSubtotal * pct) / 100);
    } else {
      totalTaxCalculated = Number(String(taxValue).replace(/\D/g, "")) || 0;
    }

    const totalService = Number(String(serviceFee).replace(/\D/g, "")) || 0;
    const totalDiscount = Number(String(discountAmount).replace(/\D/g, "")) || 0;
    const totalOthers = Number(String(otherFees).replace(/\D/g, "")) || 0;
    const otherPerPerson = members.length > 0 ? Math.round(totalOthers / members.length) : 0;

    // 4. Distribusi Proporsional Pajak & Service Sesuai Pesanan Masing-Masing
    const breakdown = memberBases.map((m) => {
      const ratio = totalFoodSubtotal > 0 ? m.combinedSubtotal / totalFoodSubtotal : 1 / members.length;
      const myTax = Math.round(totalTaxCalculated * ratio);
      const myService = Math.round(totalService * ratio);
      const myDiscount = Math.round(totalDiscount * ratio);

      const finalTotal = Math.max(
        0,
        m.combinedSubtotal + myTax + myService - myDiscount + otherPerPerson
      );

      return {
        ...m,
        myTax,
        myService,
        myDiscount,
        otherShare: otherPerPerson,
        finalTotal,
      };
    });

    const grandTotal = Math.max(
      0,
      totalFoodSubtotal + totalTaxCalculated + totalService - totalDiscount + totalOthers
    );

    return {
      totalFoodSubtotal,
      totalShared,
      totalTaxCalculated,
      totalService,
      totalDiscount,
      totalOthers,
      grandTotal,
      breakdown,
    };
  }, [members, sharedItems, taxType, taxValue, serviceFee, discountAmount, otherFees]);

  // ==========================================
  // KALKULASI MODE SIMPEL
  // ==========================================
  const simpleCalculation = useMemo(() => {
    const rawTotal = Number(String(simpleTotal).replace(/\D/g, "")) || 0;
    const tax = Number(String(simpleTax).replace(/\D/g, "")) || 0;
    const service = Number(String(simpleService).replace(/\D/g, "")) || 0;
    const people = Math.max(1, Number(simplePeople) || 1);

    const grandTotal = rawTotal + tax + service;
    const perPerson = Math.ceil(grandTotal / people);

    return { grandTotal, perPerson, people };
  }, [simpleTotal, simpleTax, simpleService, simplePeople]);

  // ==========================================
  // HANDLERS
  // ==========================================
  const addMember = () => {
    setMembers((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        name: `Orang ${prev.length}`,
        items: [{ id: String(Date.now() + 1), name: "", price: "" }],
      },
    ]);
  };

  const removeMember = (index) => {
    if (members.length <= 1) return;
    setMembers((prev) => prev.filter((_, idx) => idx !== index));
  };

  const addItemToMember = (memberIdx) => {
    setMembers((prev) =>
      prev.map((m, idx) =>
        idx === memberIdx
          ? {
              ...m,
              items: [...m.items, { id: String(Date.now()), name: "", price: "" }],
            }
          : m
      )
    );
  };

  const removeItemFromMember = (memberIdx, itemIdx) => {
    setMembers((prev) =>
      prev.map((m, idx) =>
        idx === memberIdx
          ? {
              ...m,
              items: m.items.length > 1 ? m.items.filter((_, i) => i !== itemIdx) : m.items,
            }
          : m
      )
    );
  };

  const addSharedItem = () => {
    setSharedItems((prev) => [
      ...prev,
      { id: String(Date.now()), name: "", price: "" },
    ]);
  };

  const removeSharedItem = (itemIdx) => {
    setSharedItems((prev) => prev.filter((_, i) => i !== itemIdx));
  };

  // Salin Rincian ke WhatsApp
  const handleCopyWhatsApp = () => {
    let text = "";
    if (mode === "itemized") {
      text = `🧾 *RINCIAN BAGI TAGIHAN (SPLIT BILL)*
----------------------------------------
📍 *Total Struk:* ${formatRupiah(itemizedCalculation.grandTotal)}
🍽️ *Subtotal Makanan:* ${formatRupiah(itemizedCalculation.totalFoodSubtotal)}
${itemizedCalculation.totalTaxCalculated > 0 ? `📑 *Pajak (${taxType === "percent" ? `${taxValue}%` : "PB1"}):* ${formatRupiah(itemizedCalculation.totalTaxCalculated)}\n` : ""}${itemizedCalculation.totalService > 0 ? `🛎️ *Service Charge:* ${formatRupiah(itemizedCalculation.totalService)}\n` : ""}${itemizedCalculation.totalDiscount > 0 ? `🎁 *Diskon Promo:* -${formatRupiah(itemizedCalculation.totalDiscount)}\n` : ""}----------------------------------------
*Rincian Per Orang (Termasuk Pajak Adil):*

${itemizedCalculation.breakdown
  .map(
    (m, idx) =>
      `${idx + 1}. *${m.name}* 👉 *${formatRupiah(m.finalTotal)}*
   • Pesanan: ${m.items.filter((it) => it.name).map((it) => it.name).join(", ") || "Menu"} (${formatRupiah(m.personalSum)})
   ${m.sharedShare > 0 ? `• Menu Bersama: ${formatRupiah(m.sharedShare)}\n   ` : ""}• Porsi Pajak/Biaya: ${formatRupiah(m.myTax + m.myService - m.myDiscount + m.otherShare)}`
  )
  .join("\n\n")}
----------------------------------------
Yuk bisa ditransfer ya teman-teman! Terima kasih banyak! 🙏`;
    } else {
      text = `🧾 *BAGI TAGIHAN (SPLIT BILL)*
----------------------------------------
Total Tagihan: *${formatRupiah(simpleCalculation.grandTotal)}*
Jumlah Orang: ${simpleCalculation.people} orang
----------------------------------------
Masing-masing Bayar: *${formatRupiah(simpleCalculation.perPerson)}*

Yuk bisa ditransfer ya! Terima kasih! 🙏`;
    }

    navigator.clipboard.writeText(text).then(() => {
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Rincian WhatsApp berhasil disalin!",
        showConfirmButton: false,
        timer: 1500,
      });
    });
  };

  // Catat Bagian Pengguna ke Catatan Pengeluaran
  const handleRecordMyShare = () => {
    const myShare =
      mode === "itemized"
        ? itemizedCalculation.breakdown[0]?.finalTotal || 0
        : simpleCalculation.perPerson;

    if (myShare <= 0) {
      Swal.fire("Gagal", "Nominal porsi kamu masih 0!", "warning");
      return;
    }

    if (onAddTransactionDirect) {
      onAddTransactionDirect({
        type: "pengeluaran",
        amount: myShare,
        category: "Makanan & Minuman",
        note: `Makan bersama (Bagi Tagihan / Split Bill)`,
        payment_method: "Tunai",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* ========================================================
      // 1. TOP 4 STATS CARDS (KONSISTEN DENGAN DASHBOARD & PENGELUARAN)
      // ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Struk */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Tagihan Struk</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Icons.Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              {formatRupiah(
                mode === "itemized" ? itemizedCalculation.grandTotal : simpleCalculation.grandTotal,
                isPrivateMode
              )}
            </h2>
            <div className="mt-2 text-[11px] text-slate-400">
              {mode === "itemized" ? `${members.length} Orang terdaftar` : `${simpleCalculation.people} Orang patungan`}
            </div>
          </div>
        </div>

        {/* Card 2: Porsi Saya */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Bagian / Porsi Saya</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Icons.Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl font-bold tracking-tight text-emerald-600">
              {formatRupiah(
                mode === "itemized"
                  ? itemizedCalculation.breakdown[0]?.finalTotal || 0
                  : simpleCalculation.perPerson,
                isPrivateMode
              )}
            </h2>
            <div className="mt-2 text-[11px] text-emerald-700 font-semibold">
              Sudah termasuk pajak & biaya
            </div>
          </div>
        </div>

        {/* Card 3: Pajak & Biaya Tambahan */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Pajak & Biaya</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Icons.Calculator className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl font-bold tracking-tight text-amber-600">
              {formatRupiah(
                mode === "itemized"
                  ? itemizedCalculation.totalTaxCalculated + itemizedCalculation.totalService + itemizedCalculation.totalOthers
                  : (Number(String(simpleTax).replace(/\D/g, "")) || 0) + (Number(String(simpleService).replace(/\D/g, "")) || 0),
                isPrivateMode
              )}
            </h2>
            <div className="mt-2 text-[11px] text-slate-400">
              Dibagi proporsional & adil
            </div>
          </div>
        </div>

        {/* Card 4: Diskon / Potongan */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Diskon / Potongan</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Icons.TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl font-bold tracking-tight text-blue-600">
              -{formatRupiah(mode === "itemized" ? itemizedCalculation.totalDiscount : 0, isPrivateMode)}
            </h2>
            <div className="mt-2 text-[11px] text-slate-400">
              Mengurangi tagihan semua orang
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
      // 2. TOOLBAR MODE SWITCHER (UNIVERSAL & FULL ROUNDED)
      // ======================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        {/* Mode Switcher Tabs (Full Rounded & Gradient Hijau) */}
        <div className="flex items-center p-1 bg-slate-100 rounded-full text-xs font-medium">
          <button
            type="button"
            onClick={() => setMode("itemized")}
            className={`px-4 py-2 rounded-full transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 ${
              mode === "itemized"
                ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Icons.Receipt className="w-3.5 h-3.5" />
            <span>Rincian Pesanan (Resto / Kafe)</span>
          </button>

          <button
            type="button"
            onClick={() => setMode("simple")}
            className={`px-4 py-2 rounded-full transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 ${
              mode === "simple"
                ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Icons.Users className="w-3.5 h-3.5" />
            <span>Bagi Rata (Simpel)</span>
          </button>
        </div>

        {/* Action Buttons: Export & Catat */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyWhatsApp}
            className="px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold active:scale-95 transition cursor-pointer flex items-center gap-1.5"
          >
            <Icons.Copy className="w-3.5 h-3.5" />
            <span>Salin Rincian</span>
          </button>

          <button
            type="button"
            onClick={handleRecordMyShare}
            className="px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-semibold active:scale-95 transition shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <Icons.Wallet className="w-3.5 h-3.5" />
            <span>Catat Porsi Saya</span>
          </button>
        </div>
      </div>

      {/* ========================================================
      // 3. KONTEN MODE RINCIAN (UNIVERSAL RESTO & KAFE)
      // ======================================================== */}
      {mode === "itemized" && (
        <div className="space-y-6">
          {/* Card Pengaturan Pajak, Biaya & Menu Bersama */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Pajak Struk, Diskon & Biaya Tambahan</h3>
                <p className="text-xs text-slate-400">Pajak otomatis dibagi proporsional sesuai nominal pesanan tiap orang</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              {/* Pajak PB1 / PPN */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-700">Pajak (PB1 / PPN)</label>
                  <div className="flex text-[10px]">
                    <button
                      type="button"
                      onClick={() => setTaxType("percent")}
                      className={`px-1.5 py-0.5 rounded-l font-bold ${
                        taxType === "percent" ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      %
                    </button>
                    <button
                      type="button"
                      onClick={() => setTaxType("nominal")}
                      className={`px-1.5 py-0.5 rounded-r font-bold ${
                        taxType === "nominal" ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      Rp
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  placeholder={taxType === "percent" ? "Contoh: 10%" : "0"}
                  value={taxValue}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, "");
                    setTaxValue(taxType === "percent" ? clean : clean ? new Intl.NumberFormat("id-ID").format(clean) : "");
                  }}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-bold focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[10px] text-slate-400 block">
                  Total: {formatRupiah(itemizedCalculation.totalTaxCalculated)}
                </span>
              </div>

              {/* Service Charge */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
                <label className="font-semibold text-slate-700 block">Service Charge (Rp)</label>
                <input
                  type="text"
                  placeholder="0"
                  value={serviceFee}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, "");
                    setServiceFee(clean ? new Intl.NumberFormat("id-ID").format(clean) : "");
                  }}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-bold focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[10px] text-slate-400 block">Biaya layanan restoran</span>
              </div>

              {/* Diskon / Promo */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
                <label className="font-semibold text-slate-700 block">Diskon / Voucher (Rp)</label>
                <input
                  type="text"
                  placeholder="0"
                  value={discountAmount}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, "");
                    setDiscountAmount(clean ? new Intl.NumberFormat("id-ID").format(clean) : "");
                  }}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-blue-700 font-bold focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[10px] text-slate-400 block">Potongan dibagi adil</span>
              </div>

              {/* Biaya Lain-lain */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
                <label className="font-semibold text-slate-700 block">Biaya Bungkus / Lain (Rp)</label>
                <input
                  type="text"
                  placeholder="0"
                  value={otherFees}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, "");
                    setOtherFees(clean ? new Intl.NumberFormat("id-ID").format(clean) : "");
                  }}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-bold focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[10px] text-slate-400 block">Dibagi rata ke semua orang</span>
              </div>
            </div>

            {/* Menu Dimakan Bersama Card */}
            <div className="pt-2 border-t border-slate-100">
              <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-slate-900">Menu Dimakan Bersama</h4>
                  <p className="text-[11px] text-slate-400">
                    Misal: Menu camilan atau makanan pembuka yang dimakan bersama
                  </p>
                </div>

                {sharedItems.length > 0 && (
                  <div className="space-y-2 pt-1">
                    {sharedItems.map((sh, sIdx) => (
                      <div key={sh.id} className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Nama Menu Bersama"
                          value={sh.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSharedItems((prev) =>
                              prev.map((item, idx) => (idx === sIdx ? { ...item, name: val } : item))
                            );
                          }}
                          className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                        />
                        <input
                          type="text"
                          placeholder="Harga (Rp)"
                          value={sh.price}
                          onChange={(e) => {
                            const clean = e.target.value.replace(/\D/g, "");
                            const formatted = clean ? new Intl.NumberFormat("id-ID").format(clean) : "";
                            setSharedItems((prev) =>
                              prev.map((item, idx) => (idx === sIdx ? { ...item, price: formatted } : item))
                            );
                          }}
                          className="w-32 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-bold text-left placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={() => removeSharedItem(sIdx)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer transition"
                          title="Hapus menu bersama"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <div className="text-[11px] text-slate-500 pt-1 flex items-center justify-between">
                      <span>
                        Total menu bersama: <strong className="text-slate-800">{formatRupiah(itemizedCalculation.totalShared)}</strong>
                      </span>
                      <span className="text-emerald-700 font-semibold">
                        @{formatRupiah(Math.round(itemizedCalculation.totalShared / members.length))} per orang
                      </span>
                    </div>
                  </div>
                )}

                <div>
                  <button
                    type="button"
                    onClick={addSharedItem}
                    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-95 text-white rounded-full text-xs font-semibold transition shadow-xs cursor-pointer"
                  >
                    <span>+ Menu Bersama</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Cards Daftar Anggota & Pesanan Masing-Masing */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Daftar Pesanan per Orang</h3>
                <p className="text-xs text-slate-400">Masukkan makanan & minuman yang dipesan masing-masing orang</p>
              </div>
              {/* Tombol Tambah Orang (Satu Tanda Plus, Full Rounded & Gradient Hijau) */}
              <button
                type="button"
                onClick={addMember}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-95 text-white rounded-full text-xs font-semibold transition shadow-xs cursor-pointer"
              >
                <span>+ Tambah Orang</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {members.map((member, mIdx) => {
                const breakdownData = itemizedCalculation.breakdown[mIdx];
                return (
                  <div
                    key={member.id}
                    className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 flex flex-col justify-between"
                  >
                    <div>
                      {/* Nama Orang & Tombol Hapus */}
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <input
                          type="text"
                          value={member.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            setMembers((prev) =>
                              prev.map((m, idx) => (idx === mIdx ? { ...m, name: val } : m))
                            );
                          }}
                          className="font-bold text-sm text-slate-900 bg-transparent focus:outline-none focus:border-b-2 focus:border-emerald-500 pb-0.5"
                          placeholder="Nama Orang"
                        />
                        {members.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeMember(mIdx)}
                            className="text-slate-400 hover:text-rose-500 text-xs px-2 py-0.5 rounded-lg hover:bg-rose-50 cursor-pointer"
                          >
                            Hapus
                          </button>
                        )}
                      </div>

                      {/* Input Menu Masing-masing */}
                      <div className="space-y-2 pt-3">
                        {member.items.map((it, itIdx) => (
                          <div key={it.id} className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="Contoh: Menu / Minuman"
                              value={it.name}
                              onChange={(e) => {
                                const val = e.target.value;
                                setMembers((prev) =>
                                  prev.map((m, i) =>
                                    i === mIdx
                                      ? {
                                          ...m,
                                          items: m.items.map((item, j) =>
                                            j === itIdx ? { ...item, name: val } : item
                                          ),
                                        }
                                      : m
                                  )
                                );
                              }}
                              className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white"
                            />
                            <input
                              type="text"
                              placeholder="Harga (Rp)"
                              value={it.price}
                              onChange={(e) => {
                                const clean = e.target.value.replace(/\D/g, "");
                                const formatted = clean ? new Intl.NumberFormat("id-ID").format(clean) : "";
                                setMembers((prev) =>
                                  prev.map((m, i) =>
                                    i === mIdx
                                      ? {
                                          ...m,
                                          items: m.items.map((item, j) =>
                                            j === itIdx ? { ...item, price: formatted } : item
                                          ),
                                        }
                                      : m
                                  )
                                );
                              }}
                              className="w-28 sm:w-32 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-bold text-left placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white"
                            />
                            {member.items.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeItemFromMember(mIdx, itIdx)}
                                className="p-1 text-slate-300 hover:text-rose-500 rounded cursor-pointer"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Tombol Tambah Menu (Single Plus) */}
                      <button
                        type="button"
                        onClick={() => addItemToMember(mIdx)}
                        className="mt-3 text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                      >
                        <span>+ Tambah Menu</span>
                      </button>
                    </div>

                    {/* Ringkasan Subtotal & Total yang Harus Dibayar */}
                    <div className="pt-3 border-t border-slate-100 bg-slate-50/70 p-3 rounded-xl space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-500">
                        <span>Pesanan Pribadi:</span>
                        <span>{formatRupiah(breakdownData?.personalSum || 0)}</span>
                      </div>
                      {breakdownData?.sharedShare > 0 && (
                        <div className="flex justify-between text-[11px] text-slate-500">
                          <span>Porsi Menu Bersama:</span>
                          <span>+{formatRupiah(breakdownData.sharedShare)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-[11px] text-slate-500">
                        <span>Porsi Pajak ({taxType === "percent" ? `${taxValue || 0}%` : "Proporsional"}):</span>
                        <span className="text-amber-600">+{formatRupiah(breakdownData?.myTax || 0)}</span>
                      </div>
                      {breakdownData?.myDiscount > 0 && (
                        <div className="flex justify-between text-[11px] text-blue-600 font-medium">
                          <span>Potongan Diskon:</span>
                          <span>-{formatRupiah(breakdownData.myDiscount)}</span>
                        </div>
                      )}
                      <div className="pt-1.5 border-t border-slate-200 flex justify-between items-baseline">
                        <span className="text-xs font-bold text-slate-900">Total Tagihan:</span>
                        <span className="text-base font-black text-emerald-700">
                          {formatRupiah(breakdownData?.finalTotal || 0, isPrivateMode)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
      // 4. KONTEN MODE SIMPEL (BAGI RATA)
      // ======================================================== */}
      {mode === "simple" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Input Tagihan Simpel</h3>
              <p className="text-xs text-slate-400 mt-0.5">Bagi rata seluruh total tagihan ke sejumlah teman</p>
            </div>

            {/* Total Struk Input */}
            <div className="text-center py-2 bg-slate-50/70 border border-slate-100 rounded-2xl p-4">
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Total Tagihan Struk
              </label>
              <div className="flex items-center justify-center gap-1.5">
                <span className="text-lg font-bold text-slate-400">Rp</span>
                <input
                  type="text"
                  placeholder="0"
                  value={simpleTotal}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, "");
                    setSimpleTotal(clean ? new Intl.NumberFormat("id-ID").format(clean) : "");
                  }}
                  className="w-full max-w-xs text-center text-2xl sm:text-3xl font-bold text-slate-900 bg-transparent focus:outline-none placeholder-slate-300 tracking-tight"
                />
              </div>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Jumlah Orang Patungan</label>
                <input
                  type="number"
                  min="1"
                  value={simplePeople}
                  onChange={(e) => setSimplePeople(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Pajak (PB1 / PPN Rp)</label>
                  <input
                    type="text"
                    placeholder="Opsional"
                    value={simpleTax}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/\D/g, "");
                      setSimpleTax(clean ? new Intl.NumberFormat("id-ID").format(clean) : "");
                    }}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Service Charge (Rp)</label>
                  <input
                    type="text"
                    placeholder="Opsional"
                    value={simpleService}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/\D/g, "");
                      setSimpleService(clean ? new Intl.NumberFormat("id-ID").format(clean) : "");
                    }}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card Hasil Simpel */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                Bagi Rata
              </span>
              <h4 className="text-base font-bold text-slate-900 mt-2">Nominal Patungan per Orang</h4>

              <div className="mt-4 p-5 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                <span className="text-xs text-slate-400 block">Masing-masing Membayar:</span>
                <h2 className="text-4xl font-black text-emerald-700 tracking-tight mt-1">
                  {formatRupiah(simpleCalculation.perPerson, isPrivateMode)}
                </h2>
                <div className="mt-2 text-xs text-slate-500">
                  Total {formatRupiah(simpleCalculation.grandTotal)} dibagi rata untuk {simpleCalculation.people} orang
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleCopyWhatsApp}
                className="flex-1 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold active:scale-95 transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Icons.Copy className="w-3.5 h-3.5" />
                <span>Salin WhatsApp</span>
              </button>
              <button
                type="button"
                onClick={handleRecordMyShare}
                className="flex-1 py-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-semibold active:scale-95 transition shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Icons.Wallet className="w-3.5 h-3.5" />
                <span>Catat Porsi Saya</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
