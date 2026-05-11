"use client";

import { useState, useEffect, useMemo } from "react";
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
  const [submitLoading, setSubmitLoading] = useState(false);

  // State Data Keuangan
  const [transactions, setTransactions] = useState([]);
  const [isEditingId, setIsEditingId] = useState(null);

  // State Form Input (Mendukung format string rupiah yang aman)
  const [formData, setFormData] = useState({
    type: "pengeluaran",
    amount: "", // Menggunakan string terformat (contoh: "75.000")
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

  // ==========================================
  // 1. SET INITIAL DATE & TIME (FIX BUG TANGGAL)
  // ==========================================
  const setTodayDateTime = () => {
    if (isEditingId) return; // Kunci otomatisasi jika sedang mengedit!

    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    const localISOTime = new Date(now.getTime() - offset).toISOString();
    
    const dateStr = localISOTime.split("T")[0]; // YYYY-MM-DD
    const timeStr = now.toTimeString().split(" ")[0].substring(0, 5); // HH:MM
    
    setFormData((prev) => ({ ...prev, date: dateStr, time: timeStr }));
  };

  // ==========================================
  // 2. CEK STATUS LOGIN & INITIAL LOAD
  // ==========================================
  // ==========================================
  // 2. CEK STATUS LOGIN & INITIAL LOAD (FIX BUG SPAM ALERT)
  // ==========================================
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        router.push("/login");
      } else {
        setUser(user);
        
        // Ambil data transaksi
        await fetchTransactions(user.id);
        
        // Set tanggal hari ini pertama kali
        const now = new Date();
        const offset = now.getTimezoneOffset() * 60000;
        const localISOTime = new Date(now.getTime() - offset).toISOString();
        setFormData((prev) => ({
          ...prev,
          date: localISOTime.split("T")[0],
          time: now.toTimeString().split(" ")[0].substring(0, 5),
        }));

        // Set default bulan aktif ke bulan sekarang
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        setSelectedMonth(`${yyyy}-${mm}`);
        
        // FIX: Hanya tampilkan selamat datang SEKALI per sesi browser
        const hasWelcomed = sessionStorage.getItem("welcomed_dompetku");
        
        if (!hasWelcomed) {
          const displayName = user.user_metadata?.username || user.email.split("@")[0];
          Swal.fire({
            title: `Selamat Datang, ${displayName}!`,
            text: "Mulai catat dan kelola keuanganmu sekarang.",
            icon: "success",
            timer: 2000,
            showConfirmButton: false,
            toast: true,
            position: "top-end"
          });
          
          // Tandai bahwa user sudah disambut
          sessionStorage.setItem("welcomed_dompetku", "true");
        }
      }
      setPageLoading(false);
    };

    checkUser();
  }, [router]);

  // Jalankan interval update waktu otomatis
  useEffect(() => {
    if (isEditingId) return;
    const interval = setInterval(setTodayDateTime, 60000);
    return () => clearInterval(interval);
  }, [isEditingId]);

  // Hindari overwrite ketika tipe transaksi berubah
  useEffect(() => {
    if (!isEditingId) {
      setTodayDateTime();
    }
  }, [formData.type, isEditingId]);

  // ==========================================
  // 3. AMBIL DATA TRANSAKSI
  // ==========================================
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
      console.error("Gagal mengambil data:", error.message);
    }
  };

  // ==========================================
  // 4. FORMATTING RUPIAH DI INPUT
  // ==========================================
  const handleAmountChange = (e) => {
    const rawValue = e.target.value;
    const cleanNumber = rawValue.replace(/\D/g, ""); // Bersihkan non-angka
    
    if (!cleanNumber) {
      setFormData((prev) => ({ ...prev, amount: "" }));
      return;
    }

    const formatted = new Intl.NumberFormat("id-ID").format(cleanNumber);
    setFormData((prev) => ({ ...prev, amount: formatted }));
  };

  // ==========================================
  // 5. SIMPAN / UPDATE TRANSAKSI
  // ==========================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const rawAmount = String(formData.amount);
    const cleanAmountStr = rawAmount.replace(/\D/g, "");
    const parsedAmount = Math.round(Number(cleanAmountStr));

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Swal.fire("Gagal!", "Nominal transaksi harus berupa angka valid.", "error");
      return;
    }

    if (submitLoading) return;
    setSubmitLoading(true);

    const combinedTimestamp = new Date(`${formData.date}T${formData.time}:00`).toISOString();

    try {
      if (isEditingId) {
        // PROSES UPDATE DATA
        const { data, error } = await supabase
          .from("transaksi")
          .update({
            type: formData.type,
            amount: parsedAmount,
            category: formData.category,
            note: formData.note || null,
            created_at: combinedTimestamp,
          })
          .eq("id", isEditingId)
          .select();

        if (error) throw error;

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
        // PROSES SIMPAN DATA BARU
        const { data, error } = await supabase
          .from("transaksi")
          .insert([
            {
              user_id: user.id,
              type: formData.type,
              amount: parsedAmount,
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

      setFormData({
        type: "pengeluaran",
        amount: "",
        category: "Makanan",
        note: "",
        date: "",
        time: "",
      });
      setIsEditingId(null);
      setTodayDateTime();

    } catch (error) {
      Swal.fire("Error", "Gagal menyimpan data: " + error.message, "error");
    } finally {
      setSubmitLoading(false);
    }
  };

  // ==========================================
  // 6. TRIGGER EDIT MODE
  // ==========================================
  const startEdit = (item) => {
    setIsEditingId(item.id);
    
    const itemDate = new Date(item.created_at);
    const offset = itemDate.getTimezoneOffset() * 60000;
    const localISO = new Date(itemDate.getTime() - offset).toISOString();
    
    const dateStr = localISO.split("T")[0];
    const timeStr = itemDate.toTimeString().split(" ")[0].substring(0, 5);

    const formattedAmount = new Intl.NumberFormat("id-ID").format(item.amount);

    setFormData({
      type: item.type,
      amount: formattedAmount,
      category: item.category,
      note: item.note || "",
      date: dateStr,
      time: timeStr,
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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

  // ==========================================
  // 7. HAPUS DATA TRANSAKSI
  // ==========================================
  const handleDelete = async (id) => {
    Swal.fire({
      title: "Apakah kamu yakin?",
      text: "Catatan keuangan ini akan dihapus permanen!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
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

          if (isEditingId === id) {
            cancelEdit();
          }
        } catch (error) {
          Swal.fire("Error", "Gagal menghapus data: " + error.message, "error");
        }
      }
    });
  };

  // ==========================================
  // 8. LOGOUT HANDLER (HAPUS SESI SELAMAT DATANG)
  // ==========================================
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Swal.fire("Error", "Gagal keluar: " + error.message, "error");
    } else {
      // Reset penanda selamat datang agar saat login lagi alert muncul kembali
      sessionStorage.removeItem("welcomed_dompetku");
      
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

  // ==========================================
  // 9. LOGIKA FILTER HISTORI
  // ==========================================
  const filteredTransactions = useMemo(() => {
    return transactions.filter((item) => {
      const itemDate = new Date(item.created_at);
      const offset = itemDate.getTimezoneOffset() * 60000;
      const itemDateStr = new Date(itemDate.getTime() - offset).toISOString().split("T")[0];
      
      if (filterType === "hari-ini") {
        const sekarang = new Date();
        const localOffset = sekarang.getTimezoneOffset() * 60000;
        const todayStr = new Date(sekarang.getTime() - localOffset).toISOString().split("T")[0];
        
        return itemDateStr === todayStr;
      }
      
      if (filterType === "kustom") {
        if (!startDate && !endDate) return true;
        if (startDate && endDate) {
          return itemDateStr >= startDate && itemDateStr <= endDate;
        }
        if (startDate) return itemDateStr >= startDate;
        if (endDate) return itemDateStr <= endDate;
      }

      if (filterType === "bulanan" && selectedMonth) {
        return itemDateStr.substring(0, 7) === selectedMonth;
      }

      return true; // "semua"
    });
  }, [transactions, filterType, startDate, endDate, selectedMonth]);

  // Kalkulasi data kartu dinamis
  const totalPemasukan = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.type === "pemasukan")
      .reduce((sum, t) => sum + Math.round(Number(t.amount)), 0);
  }, [filteredTransactions]);

  const totalPengeluaran = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.type === "pengeluaran")
      .reduce((sum, t) => sum + Math.round(Number(t.amount)), 0);
  }, [filteredTransactions]);

  const saldo = useMemo(() => totalPemasukan - totalPengeluaran, [totalPemasukan, totalPengeluaran]);

  const formatRupiah = (num) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);
  };

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

  const displayName = user?.user_metadata?.username || (user?.email ? user.email.split("@")[0] : "User");

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* HEADER / NAVBAR */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            {/* SINKRONISASI LOGO DENGAN FAVICON.ICO */}
            <img 
              src="/favicon.ico" 
              alt="Logo DompetKu" 
              className="w-10 h-10 object-contain rounded-xl shadow-md shadow-blue-100"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%232563eb'%3E%3Cpath d='M21 18V6c0-1.1-.9-2-2-2H5c-1.11 0-2 .9-2 2v12c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2zm-9-2c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z'/%3E%3C/svg%3E";
              }}
            />
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
              className="px-4 py-1.5 text-xs font-semibold bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors border border-red-100"
            >
              Keluar
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 mt-8">
        {/* RINGKASAN KARTU KEUANGAN */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
        >
          {/* Kartu Saldo */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-2xl text-white shadow-xl shadow-blue-100">
            <p className="text-sm text-blue-100 font-medium">Saldo (Sesuai Filter)</p>
            <h3 className="text-3xl font-extrabold mt-1">
              {saldo < 0 ? "-" : ""} {formatRupiah(Math.abs(saldo))}
            </h3>
          </div>

          {/* Kartu Pemasukan */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Pemasukan</p>
              <h4 className="text-xl font-bold text-emerald-600 mt-1">{formatRupiah(totalPemasukan)}</h4>
            </div>
            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 font-bold text-lg">
              ↓
            </div>
          </div>

          {/* Kartu Pengeluaran */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Pengeluaran</p>
              <h4 className="text-xl font-bold text-rose-600 mt-1">{formatRupiah(totalPengeluaran)}</h4>
            </div>
            <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center text-rose-600 font-bold text-lg">
              ↑
            </div>
          </div>
        </motion.div>

        {/* ==========================================
        // GRID LAYOUT: STICKY FORM & SCROLLABLE LIST SEJAJAR SEMPURNA
        // ========================================== */}
        <div className="flex flex-col lg:flex-row gap-8 items-stretch">
          
          {/* SISI KIRI: INPUT FORM */}
          <div className="w-full lg:w-[42%] shrink-0">
            <div id="form-card" className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-full flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-md font-bold text-slate-800">
                    {isEditingId ? "📝 Edit Transaksi" : "✍️ Catat Keuangan"}
                  </h3>
                  {isEditingId && (
                    <button 
                      onClick={cancelEdit} 
                      className="text-xs font-bold text-rose-500 hover:text-rose-700 bg-rose-50 px-2 py-1 rounded"
                    >
                      Batal Edit
                    </button>
                  )}
                </div>
                
                <form id="finance-form" onSubmit={handleSubmit} className="space-y-4">
                  {/* Switcher Tipe Transaksi */}
                  <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl">
                    <button
                      type="button"
                      disabled={isEditingId !== null}
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

                  {/* Input Jumlah Rupiah */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Nominal (Rupiah)</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">Rp</span>
                      <input
                        type="text"
                        placeholder="0"
                        required
                        value={formData.amount}
                        onChange={handleAmountChange}
                        className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm text-slate-900 font-bold transition-all"
                      />
                    </div>
                  </div>

                  {/* Grid Input Tanggal & Waktu */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Tanggal</label>
                      <input
                        type="date"
                        required
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm text-slate-900 transition-all font-medium"
                      />
                    </div>
                    <div className="w-full sm:w-36">
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Waktu / Jam</label>
                      <input
                        type="time"
                        required
                        value={formData.time}
                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm text-slate-900 transition-all font-medium"
                      />
                    </div>
                  </div>

                  {/* Dropdown Kategori */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Kategori</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm text-slate-700 font-medium transition-all"
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
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm text-slate-700 font-medium transition-all resize-none"
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
          </div>

          {/* SISI KANAN: HISTORI TRANSAKSI (Sejajar Sempurna Secara Vertikal) */}
          <div className="w-full lg:flex-1 flex flex-col justify-between min-h-0">
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-4 mb-4 shrink-0">
              <div className="flex flex-wrap justify-between items-center gap-3">
                <h3 className="text-sm font-bold text-slate-700">Saring Histori & Rekap</h3>
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
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Sampai Dengan</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none"
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
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none"
                  />
                </motion.div>
              )}
            </div>

            {/* LIST DAFTAR TRANSAKSI (SCROLLABLE CONTAINER - SEJAJAR SEMPURNA ATAS-BAWAH) */}
            <div className="flex-1 min-h-[442px] max-h-[442px] overflow-y-auto pr-1 space-y-3 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
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
                      {/* Detail Kategori & Catatan */}
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
                          <h4 className="font-bold text-slate-800 text-sm leading-snug">{item.category}</h4>
                          <p className="text-xs text-slate-400 font-medium">
                            {item.note || "-"} •{" "}
                            <span className="text-slate-400 font-semibold">{itemDateStr} ({itemTime})</span>
                          </p>
                        </div>
                      </div>

                      {/* Nominal & Tombol Aksi */}
                      <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2.5 sm:pt-0 border-slate-100">
                        {/* Nominal Uang */}
                        <span
                          className={`font-extrabold text-sm ${
                            item.type === "pemasukan" ? "text-emerald-600" : "text-rose-600"
                          }`}
                        >
                          {item.type === "pemasukan" ? "+" : "-"} {formatRupiah(item.amount)}
                        </span>

                        {/* Tombol Kontrol */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => startEdit(item)}
                            className="p-2 text-slate-500 hover:text-blue-600 bg-slate-50 hover:bg-blue-100 rounded-lg transition-colors"
                            aria-label="Edit Catatan"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-2 text-slate-500 hover:text-rose-600 bg-slate-50 hover:bg-rose-100 rounded-lg transition-colors"
                            aria-label="Hapus Catatan"
                          >
                            🗑️
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