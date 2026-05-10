"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const router = useRouter();
  const supabase = createClient();

  // State User & Loading
  const [user, setUser] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);

  // State Data Keuangan
  const [transactions, setTransactions] = useState([]);
  const [isEditingId, setIsEditingId] = useState(null); // Menyimpan ID transaksi yang sedang diedit

  // State Form Input (Sekarang mendukung Tanggal dan Waktu)
  const [formData, setFormData] = useState({
    type: "pengeluaran",
    amount: "",
    category: "Makanan",
    note: "",
    date: "", // Format: YYYY-MM-DD
    time: "", // Format: HH:MM
  });

  // State Filter (hari-ini, semua, kustom-tanggal, bulanan)
  const [filterType, setFilterType] = useState("hari-ini");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(""); // Format: YYYY-MM

  const [submitLoading, setSubmitLoading] = useState(false);

  // 1. SET INITAL DATE & TIME DI FORM
  const setTodayDateTime = () => {
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    const timeStr = now.toTimeString().split(" ")[0].substring(0, 5); // Ambil HH:MM
    setFormData((prev) => ({ ...prev, date: dateStr, time: timeStr }));
  };

  // 2. CEK STATUS LOGIN & AMBIL DATA
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        router.push("/login");
      } else {
        setUser(user);
        setTodayDateTime();
        await fetchTransactions(user.id);
        
        // Notifikasi Selamat Datang (hanya sekali saat render pertama berhasil)
        const displayName = user.email.split("@")[0];
        Swal.fire({
          title: `Selamat Datang, ${displayName}!`,
          text: "Mulai catat dan kelola keuanganmu sekarang.",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: "top-end"
        });
      }
      setPageLoading(false);
    };

    checkUser();
  }, [router]);

  // Set ulang tanggal dan waktu form jika tipe transaksi berubah
  useEffect(() => {
    if (!isEditingId) {
      setTodayDateTime();
    }
  }, [formData.type]);

  // 3. AMBIL DATA TRANSAKSI
  const fetchTransactions = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("transaksi")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      Swal.fire("Error", "Gagal mengambil data: " + error.message, "error");
    }
  };

  // 4. SIMPAN / UPDATE TRANSAKSI
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || submitLoading) return;

    setSubmitLoading(true);

    // Gabungkan input tanggal & waktu menjadi format timestamp ISO
    const combinedTimestamp = new Date(`${formData.date}T${formData.time}:00`).toISOString();

    try {
      if (isEditingId) {
        // PROSES EDIT DATA
        const { data, error } = await supabase
          .from("transaksi")
          .update({
            type: formData.type,
            amount: parseFloat(formData.amount),
            category: formData.category,
            note: formData.note || null,
            created_at: combinedTimestamp,
          })
          .eq("id", isEditingId)
          .select();

        if (error) throw error;

        // Update local state agar instan berubah
        setTransactions(transactions.map(t => t.id === isEditingId ? data[0] : t));
        setIsEditingId(null);

        Swal.fire({
          title: "Berhasil!",
          text: "Catatan keuangan berhasil diperbarui.",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        // PROSES TAMBAH DATA BARU
        const { data, error } = await supabase
          .from("transaksi")
          .insert([
            {
              user_id: user.id,
              type: formData.type,
              amount: parseFloat(formData.amount),
              category: formData.category,
              note: formData.note || null,
              created_at: combinedTimestamp,
            },
          ])
          .select();

        if (error) throw error;

        setTransactions([data[0], ...transactions]);

        Swal.fire({
          title: "Tersimpan!",
          text: "Transaksi baru berhasil ditambahkan.",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });
      }

      // Reset form
      setFormData({
        type: "pengeluaran",
        amount: "",
        category: "Makanan",
        note: "",
        date: "",
        time: "",
      });
      setTodayDateTime();

    } catch (error) {
      Swal.fire("Error", "Gagal menyimpan data: " + error.message, "error");
    } finally {
      setSubmitLoading(false);
    }
  };

  // 5. TRIGGER EDIT MODE
  const startEdit = (item) => {
    setIsEditingId(item.id);
    const itemDate = new Date(item.created_at);
    const dateStr = itemDate.toISOString().split("T")[0];
    const timeStr = itemDate.toTimeString().split(" ")[0].substring(0, 5);

    setFormData({
      type: item.type,
      amount: item.amount,
      category: item.category,
      note: item.note || "",
      date: dateStr,
      time: timeStr,
    });

    // Scroll mulus kembali ke form input di device mobile
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Batal Edit
  const cancelEdit = () => {
    setIsEditingId(null);
    setFormData({
      type: "pengeluaran",
      amount: "",
      category: "Makanan",
      note: "",
      date: "",
      time: "",
    });
    setTodayDateTime();
  };

  // 6. HAPUS TRANSAKSI (DENGAN SWEETALERT CONFIRM)
  const handleDelete = async (id) => {
    Swal.fire({
      title: "Apakah kamu yakin?",
      text: "Catatan keuangan ini akan dihapus permanen!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Ya, Hapus!",
      cancelButtonText: "Batal",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const { error } = await supabase.from("transaksi").delete().eq("id", id);
          if (error) throw error;

          setTransactions(transactions.filter((t) => t.id !== id));

          Swal.fire({
            title: "Terhapus!",
            text: "Catatan keuangan berhasil dihapus.",
            icon: "success",
            timer: 1500,
            showConfirmButton: false,
          });
        } catch (error) {
          Swal.fire("Error", "Gagal menghapus data: " + error.message, "error");
        }
      }
    });
  };

  // 7. LOGOUT
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Swal.fire("Error", "Gagal keluar: " + error.message, "error");
    } else {
      Swal.fire({
        title: "Berhasil Keluar",
        text: "Sampai jumpa kembali!",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      }).then(() => {
        router.push("/login");
        router.refresh();
      });
    }
  };

  // Saring transaksi berdasarkan Filter yang dipilih aktif
  const filteredTransactions = transactions.filter((item) => {
    const itemDateStr = item.created_at ? item.created_at.split("T")[0] : "";
    
    if (filterType === "hari-ini") {
      const todayStr = new Date().toISOString().split("T")[0];
      return itemDateStr === todayStr;
    }
    
    if (filterType === "kustom" && startDate && endDate) {
      return itemDateStr >= startDate && itemDateStr <= endDate;
    }

    if (filterType === "bulanan" && selectedMonth) {
      // selectedMonth format: YYYY-MM, itemDateStr format: YYYY-MM-DD
      return itemDateStr.substring(0, 7) === selectedMonth;
    }

    return true; // "semua"
  });

  // Kalkulasi data kartu dinamis (hanya menghitung transaksi hasil filter aktif)
  const totalPemasukan = filteredTransactions
    .filter((t) => t.type === "pemasukan")
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const totalPengeluaran = filteredTransactions
    .filter((t) => t.type === "pengeluaran")
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const saldo = totalPemasukan - totalPengeluaran;

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-2">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 text-sm font-semibold">Memuat data keuangan...</p>
        </div>
      </div>
    );
  }

  // Mengambil nama depan saja dari email (Request No. 6)
  const displayName = user?.user_metadata?.username || (user?.email ? user.email.split("@")[0] : "User");

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* HEADER / NAVBAR */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-md shadow-blue-200">
              D
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">
                Dompet<span className="text-blue-600">Ku</span>
              </h1>
              <p className="text-xs text-slate-400">Catat keuangan praktis</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl hidden sm:inline capitalize">
              👋 Hai, {displayName}
            </span>
            <button
              onClick={handleLogout}
              className="px-4 py-1.5 text-xs font-semibold bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
            >
              Keluar
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 mt-8">
        {/* SECTION 1: RINGKASAN KARTU KEUANGAN (Animasi Masuk) */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
        >
          {/* Kartu Saldo */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-2xl text-white shadow-xl shadow-blue-100">
            <p className="text-sm text-blue-100 font-medium">Saldo (Sesuai Filter)</p>
            <h3 className="text-3xl font-bold mt-1">
              {saldo < 0 ? "-" : ""} Rp {Math.abs(saldo).toLocaleString("id-ID")}
            </h3>
          </div>

          {/* Kartu Pemasukan */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Pemasukan</p>
              <h4 className="text-xl font-bold text-emerald-600 mt-1">Rp {totalPemasukan.toLocaleString("id-ID")}</h4>
            </div>
            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 font-bold text-lg">
              ↓
            </div>
          </div>

          {/* Kartu Pengeluaran */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Pengeluaran</p>
              <h4 className="text-xl font-bold text-rose-600 mt-1">Rp {totalPengeluaran.toLocaleString("id-ID")}</h4>
            </div>
            <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center text-rose-600 font-bold text-lg">
              ↑
            </div>
          </div>
        </motion.div>

        {/* SECTION 2: FORM INPUT & HISTORI */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sisi Kiri: Form Catat Transaksi */}
          <div className="lg:col-span-5">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm sticky top-24">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-slate-800">
                  {isEditingId ? "📝 Edit Transaksi" : "✍️ Catat Keuangan"}
                </h3>
                {isEditingId && (
                  <button 
                    onClick={cancelEdit} 
                    className="text-xs font-bold text-slate-400 hover:text-slate-600 bg-slate-100 px-2 py-1 rounded"
                  >
                    Batal Edit
                  </button>
                )}
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Switcher Tipe Transaksi */}
                <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    disabled={isEditingId !== null} // Kunci tipe data jika sedang mengedit agar konsisten
                    onClick={() => setFormData({ ...formData, type: "pengeluaran", category: "Makanan" })}
                    className={`py-2 text-sm font-semibold rounded-lg transition-all ${
                      formData.type === "pengeluaran"
                        ? "bg-white text-rose-600 shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    } disabled:opacity-50`}
                  >
                    Pengeluaran
                  </button>
                  <button
                    type="button"
                    disabled={isEditingId !== null}
                    onClick={() => setFormData({ ...formData, type: "pemasukan", category: "Gaji" })}
                    className={`py-2 text-sm font-semibold rounded-lg transition-all ${
                      formData.type === "pemasukan"
                        ? "bg-white text-emerald-600 shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    } disabled:opacity-50`}
                  >
                    Pemasukan
                  </button>
                </div>

                {/* Input Jumlah */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Nominal (Rupiah)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">Rp</span>
                    <input
                      type="number"
                      placeholder="0"
                      required
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm text-slate-900 font-medium transition-all"
                    />
                  </div>
                </div>

                {/* Grid Input Tanggal & Waktu Manual (Request No. 3 & 4) */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Tanggal</label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm text-slate-900 transition-all font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Waktu / Jam</label>
                    <input
                      type="time"
                      required
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm text-slate-900 transition-all font-medium"
                    />
                  </div>
                </div>

                {/* Input Kategori */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Kategori</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm text-slate-900 font-medium transition-all"
                  >
                    {formData.type === "pengeluaran" ? (
                      <>
                        <option value="Makanan">Makanan & Minuman</option>
                        <option value="Transport">Transportasi</option>
                        <option value="Tagihan">Tagihan & Langganan</option>
                        <option value="Hiburan">Hiburan & Jajan</option>
                        <option value="Lainnya">Lain-lain</option>
                      </>
                    ) : (
                      <>
                        <option value="Gaji">Gaji / Upah</option>
                        <option value="Kiriman">Kiriman Bulanan</option>
                        <option value="Sampingan">Freelance / Bisnis</option>
                        <option value="Lainnya">Lain-lain</option>
                      </>
                    )}
                  </select>
                </div>

                {/* Input Keterangan */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Keterangan / Catatan</label>
                  <textarea
                    placeholder="Catat rincian transaksi disini..."
                    rows="2"
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm text-slate-900 font-medium transition-all resize-none"
                  ></textarea>
                </div>

                {/* Tombol Simpan */}
                <button
                  type="submit"
                  disabled={submitLoading}
                  className={`w-full py-3 text-white rounded-xl font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2 ${
                    formData.type === "pengeluaran"
                      ? "bg-rose-500 hover:bg-rose-600 shadow-rose-100"
                      : "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-100"
                  } disabled:opacity-50`}
                >
                  {submitLoading ? "Menyimpan..." : isEditingId ? "Simpan Perubahan" : "Simpan Catatan"}
                </button>
              </form>
            </div>
          </div>

          {/* Sisi Kanan: Histori Transaksi */}
          <div className="lg:col-span-7">
            {/* Filter Tabs Multi-Opsi (Request No. 7 & 8) */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm mb-6 space-y-4">
              <div className="flex flex-wrap justify-between items-center gap-3">
                <h3 className="text-md font-bold text-slate-800">Saring Histori & Rekap</h3>
                <div className="flex flex-wrap bg-slate-100 p-1 rounded-xl text-xs font-semibold gap-1">
                  <button
                    onClick={() => setFilterType("hari-ini")}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      filterType === "hari-ini" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500"
                    }`}
                  >
                    Hari Ini
                  </button>
                  <button
                    onClick={() => setFilterType("bulanan")}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      filterType === "bulanan" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500"
                    }`}
                  >
                    Bulanan
                  </button>
                  <button
                    onClick={() => setFilterType("kustom")}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      filterType === "kustom" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500"
                    }`}
                  >
                    Kalender
                  </button>
                  <button
                    onClick={() => setFilterType("semua")}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      filterType === "semua" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500"
                    }`}
                  >
                    Semua
                  </button>
                </div>
              </div>

              {/* Panel Input Kalender Rentang Tanggal */}
              {filterType === "kustom" && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-50"
                >
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Mulai Dari</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Sampai Dengan</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none"
                    />
                  </div>
                </motion.div>
              )}

              {/* Panel Input Rekap Bulanan */}
              {filterType === "bulanan" && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="pt-2 border-t border-slate-50"
                >
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Pilih Bulan & Tahun</label>
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none"
                  />
                </motion.div>
              )}
            </div>

            {/* List Transaksi dengan Animasi Framer Motion (Request No. 5) */}
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {filteredTransactions.map((item) => {
                  const itemTime = item.created_at 
                    ? new Date(item.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) 
                    : "";
                  const itemDateStr = item.created_at 
                    ? new Date(item.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) 
                    : "";

                    return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95, y: 15 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: -15 }}
                      transition={{ duration: 0.3 }}
                      className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:shadow-md transition-shadow"
                    >
                      {/* Sisi Kiri: Detail Kategori & Catatan */}
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                            item.type === "pemasukan"
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-rose-50 text-rose-600"
                          }`}
                        >
                          {item.category[0]}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm">{item.category}</h4>
                          <p className="text-xs text-slate-400 font-medium">
                            {item.note || "-"} •{" "}
                            <span className="text-slate-400 font-semibold">{itemDateStr} ({itemTime})</span>
                          </p>
                        </div>
                      </div>

                      {/* Sisi Kanan: Nominal & Tombol Aksi (Tampil Permanen & Responsif) */}
                      <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2.5 sm:pt-0 border-slate-100">
                        {/* Nominal Uang */}
                        <span
                          className={`font-extrabold text-sm ${
                            item.type === "pemasukan" ? "text-emerald-600" : "text-rose-600"
                          }`}
                        >
                          {item.type === "pemasukan" ? "+" : "-"} Rp {parseFloat(item.amount).toLocaleString("id-ID")}
                        </span>

                        {/* Tombol Aksi - Selalu Tampil Permanen */}
                        <div className="flex items-center gap-1">
                          {/* Tombol Edit */}
                          <button
                            onClick={() => startEdit(item)}
                            className="p-2 text-slate-500 hover:text-blue-600 bg-slate-50 hover:bg-blue-100 rounded-lg transition-colors"
                            aria-label="Edit Catatan"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                            </svg>
                          </button>
                          
                          {/* Tombol Hapus */}
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-2 text-slate-500 hover:text-rose-600 bg-slate-50 hover:bg-rose-100 rounded-lg transition-colors"
                            aria-label="Hapus Catatan"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {filteredTransactions.length === 0 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12 bg-white rounded-2xl border border-slate-100"
                >
                  <p className="text-slate-400 text-sm">Tidak ada transaksi yang cocok dengan filter aktif.</p>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}