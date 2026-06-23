"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/utils/supabase";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";

// Kategori bawaan (statis di frontend agar tetap ada secara default)
const DEFAULT_CATEGORIES = [
  { name: "Makanan", type: "pengeluaran" },
  { name: "Transport", type: "pengeluaran" },
  { name: "Tagihan", type: "pengeluaran" },
  { name: "Hiburan", type: "pengeluaran" },
  { name: "Lainnya", type: "pengeluaran" },
  { name: "Gaji", type: "pemasukan" },
  { name: "Kiriman", type: "pemasukan" },
  { name: "Sampingan", type: "pemasukan" },
  { name: "Lainnya", type: "pemasukan" },
];

export default function Home() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  // State User & Loading
  const [user, setUser] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);

  // State Data Keuangan & Kategori Kustom
  const [transactions, setTransactions] = useState([]);
  const [customCategories, setCustomCategories] = useState([]);
  const [isEditingId, setIsEditingId] = useState(null);

  // State Layout & UI
  const [activeTab, setActiveTab] = useState("dashboard"); // "dashboard", "riwayat", "saving-goals", atau "billing-reminder"
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("list"); // "list" atau "grid"

  // State Target Tabungan & Alokasi Dana
  const [goals, setGoals] = useState([]);
  const [savingFilter, setSavingFilter] = useState("semua"); // "semua" | "progress" | "selesai"
  const [isSavingGoalModalOpen, setIsSavingGoalModalOpen] = useState(false);
  const [selectedGoalForSavings, setSelectedGoalForSavings] = useState(null);
  const [isAddSavingsModalOpen, setIsAddSavingsModalOpen] = useState(false);

  // Form states untuk Target Tabungan Modal
  const [savingGoalName, setSavingGoalName] = useState("");
  const [savingGoalTarget, setSavingGoalTarget] = useState("");
  const [savingGoalDate, setSavingGoalDate] = useState("");
  const [savingsAmount, setSavingsAmount] = useState("");

  // State Pengingat Tagihan Bulanan
  const [billings, setBillings] = useState([]);
  const [billingFilter, setBillingFilter] = useState("semua"); // "semua" | "progress" | "selesai"
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);

  // Form states untuk Tagihan Modal
  const [billingName, setBillingName] = useState("");
  const [billingAmount, setBillingAmount] = useState("");
  const [billingDate, setBillingDate] = useState("");

  // State Mode Privasi (Samaran)
  const [isPrivateMode, setIsPrivateMode] = useState(false);

  // State Catat Massal (Bulk Add)
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkRows, setBulkRows] = useState([]);

  // State Mode Gelap (Dark Mode)
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("dompetku_theme", nextTheme);
    
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  // State Form Input (Mendukung format string rupiah yang aman)
  const [formData, setFormData] = useState({
    type: "pengeluaran",
    amount: "", // Menggunakan string terformat (contoh: "75.000")
    category: "Makanan",
    note: "",
    date: "", // Format: YYYY-MM-DD
    time: "", // Format: HH:MM
  });

  // State Filter (hari-ini, semua, kustom, bulanan)
  const [filterType, setFilterType] = useState("bulanan");
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

  // Sinkronisasi tab berdasarkan URL parameter
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab === "dashboard" || tab === "riwayat" || tab === "saving-goals" || tab === "billing-reminder") {
        setActiveTab(tab);
      }
    }
  }, []);

  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tabName);
      window.history.pushState({}, "", url.toString());
    }
  };

  // Sync Mode Privasi dengan LocalStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedPrivacy = localStorage.getItem("dompetku_privacy_mode");
      if (savedPrivacy) {
        try {
          setIsPrivateMode(JSON.parse(savedPrivacy));
        } catch (e) {
          console.error("Gagal membaca mode privasi:", e);
        }
      }
    }
  }, []);

  const togglePrivacyMode = () => {
    setIsPrivateMode((prev) => {
      const next = !prev;
      localStorage.setItem("dompetku_privacy_mode", JSON.stringify(next));
      return next;
    });
  };

  // ==========================================
  // 2. CEK STATUS LOGIN & INITIAL LOAD
  // ==========================================
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        router.push("/login");
      } else {
        setUser(user);
        
        // Ambil data transaksi dari Supabase
        await fetchTransactions(user.id);
        
        // Ambil data kategori kustom dari LocalStorage
        const savedCustomCats = localStorage.getItem("dompetku_custom_categories");
        if (savedCustomCats) {
          try {
            setCustomCategories(JSON.parse(savedCustomCats));
          } catch (e) {
            console.error("Gagal membaca kategori kustom:", e);
          }
        }

        // Ambil data target tabungan dari LocalStorage
        const savedGoals = localStorage.getItem("dompetku_saving_goals");
        if (savedGoals) {
          try {
            setGoals(JSON.parse(savedGoals));
          } catch (e) {
            console.error("Gagal membaca target tabungan:", e);
          }
        }

        // Ambil data tagihan dari LocalStorage
        const savedBills = localStorage.getItem("dompetku_billings");
        if (savedBills) {
          try {
            setBillings(JSON.parse(savedBills));
          } catch (e) {
            console.error("Gagal membaca daftar tagihan:", e);
          }
        }
        
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
        
        // Hanya tampilkan selamat datang SEKALI per sesi browser
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
          
          sessionStorage.setItem("welcomed_dompetku", "true");
        }
      }
      setPageLoading(false);
    };

    checkUser();
  }, [router]);

  // ==========================================
  // 3. DETEKSI INAKTIF 15 MENIT UNTUK LOGOUT
  // ==========================================
  useEffect(() => {
    const TIMEOUT_INAKTIF = 15 * 60 * 1000; 
    let timerMundur;

    const resetTimerLogout = () => {
      if (timerMundur) clearTimeout(timerMundur);

      timerMundur = setTimeout(async () => {
        if (user) {
          await supabase.auth.signOut();
          sessionStorage.removeItem("welcomed_dompetku");
          
          Swal.fire({
            title: "Sesi Berakhir",
            text: "Kamu otomatis keluar karena tidak ada aktivitas beberapa saat.",
            icon: "info",
            confirmButtonColor: "#2563eb"
          }).then(() => {
            router.push("/login");
            router.refresh();
          });
        }
      }, TIMEOUT_INAKTIF);
    };

    const eventInteraksi = ["mousedown", "mousemove", "keypress", "scroll", "touchstart"];
    resetTimerLogout();

    eventInteraksi.forEach((event) => {
      window.addEventListener(event, resetTimerLogout);
    });

    return () => {
      if (timerMundur) clearTimeout(timerMundur);
      eventInteraksi.forEach((event) => {
        window.removeEventListener(event, resetTimerLogout);
      });
    };
  }, [user, router, supabase]);

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
  // 4. AMBIL DATA TRANSAKSI
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
      console.error("Gagal mengambil data transaksi:", error.message);
    }
  };

  // Menggabungkan kategori bawaan (statis) dan kustom (dari LocalStorage)
  const allCategories = useMemo(() => {
    return [...DEFAULT_CATEGORIES, ...customCategories];
  }, [customCategories]);

  // Menyaring kategori berdasarkan tipe form aktif (pengeluaran / pemasukan)
  const availableCategories = useMemo(() => {
    return allCategories.filter((c) => c.type === formData.type);
  }, [allCategories, formData.type]);

  // Otomatis memilih kategori pertama yang tersedia saat tipe transaksi berganti
  useEffect(() => {
    if (!isEditingId && availableCategories.length > 0) {
      const isValid = availableCategories.some((c) => c.name === formData.category);
      if (!isValid) {
        setFormData((prev) => ({ ...prev, category: availableCategories[0].name }));
      }
    }
  }, [formData.type, availableCategories, isEditingId, formData.category]);

  // ==========================================
  // 5. TAMBAH KATEGORI BARU (LOCAL STORAGE)
  // ==========================================
  const handleAddCategory = async () => {
    Swal.fire({
      title: `Tambah Kategori ${formData.type === "pengeluaran" ? "Pengeluaran" : "Pemasukan"}`,
      input: "text",
      inputPlaceholder: "Tulis nama kategori baru...",
      showCancelButton: true,
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Simpan",
      cancelButtonText: "Batal",
      inputValidator: (value) => {
        if (!value || value.trim() === "") {
          return "Nama kategori tidak boleh kosong!";
        }
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const newCatName = result.value.trim();

        // Cek duplikasi di seluruh kategori aktif (statis + kustom)
        const isDuplicate = allCategories.some(
          (c) => c.type === formData.type && c.name.toLowerCase() === newCatName.toLowerCase()
        );

        if (isDuplicate) {
          Swal.fire("Gagal", `Kategori "${newCatName}" sudah terdaftar sebelumnya!`, "error");
          return;
        }

        const newCat = { name: newCatName, type: formData.type };
        const updatedCustomCategories = [...customCategories, newCat];
        
        // Simpan ke state dan LocalStorage
        setCustomCategories(updatedCustomCategories);
        localStorage.setItem("dompetku_custom_categories", JSON.stringify(updatedCustomCategories));
        
        // Pilih kategori yang baru dibuat di formulir
        setFormData((prev) => ({ ...prev, category: newCatName }));

        Swal.fire({
          title: "Berhasil!",
          text: `Kategori "${newCatName}" berhasil ditambahkan.`,
          icon: "success",
          timer: 1500,
          showConfirmButton: false
        });
      }
    });
  };

  // ==========================================
  // 6. FORMATTING RUPIAH DI INPUT
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
  // 7. SIMPAN / UPDATE TRANSAKSI
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

    const combinedTimestamp = new Date(`${formData.date}T${formData.time}:05`).toISOString();

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
        category: availableCategories.length > 0 ? availableCategories[0].name : "Makanan",
        note: "",
        date: "",
        time: "",
      });
      setIsEditingId(null);
      setTodayDateTime();
      setIsModalOpen(false); // Tutup modal setelah simpan

    } catch (error) {
      Swal.fire("Error", "Gagal menyimpan data: " + error.message, "error");
    } finally {
      setSubmitLoading(false);
    }
  };

  // ==========================================
  // 7b. BULK ADD (CATAT MASSAL) TRANSACTIONS
  // ==========================================
  const getTodayDateTime = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    const localISOTime = new Date(now.getTime() - offset).toISOString();
    return {
      date: localISOTime.split("T")[0],
      time: now.toTimeString().split(" ")[0].substring(0, 5),
    };
  };

  const openBulkModal = () => {
    const dt = getTodayDateTime();
    setBulkRows([
      {
        id: String(Math.random()),
        type: "pengeluaran",
        amount: "",
        category: "Makanan",
        note: "",
        date: dt.date,
        time: dt.time,
      },
    ]);
    setIsBulkModalOpen(true);
  };

  const addBulkRow = () => {
    const dt = getTodayDateTime();
    const lastRow = bulkRows[bulkRows.length - 1];
    setBulkRows((prev) => [
      ...prev,
      {
        id: String(Math.random()),
        type: lastRow ? lastRow.type : "pengeluaran",
        amount: "",
        category: lastRow ? lastRow.category : "Makanan",
        note: "",
        date: lastRow ? lastRow.date : dt.date,
        time: lastRow ? lastRow.time : dt.time,
      },
    ]);
  };

  const removeBulkRow = (index) => {
    if (bulkRows.length <= 1) {
      Swal.fire("Peringatan", "Minimal harus ada satu transaksi untuk dicatat.", "warning");
      return;
    }
    setBulkRows((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleBulkTypeChange = (index, type) => {
    const filteredCats = allCategories.filter((c) => c.type === type);
    const defaultCat = filteredCats.length > 0 ? filteredCats[0].name : "Lainnya";
    setBulkRows((prev) =>
      prev.map((row, idx) =>
        idx === index ? { ...row, type, category: defaultCat } : row
      )
    );
  };

  const handleBulkAmountChange = (index, value) => {
    const cleanNumber = value.replace(/\D/g, "");
    const formatted = cleanNumber ? new Intl.NumberFormat("id-ID").format(cleanNumber) : "";
    setBulkRows((prev) =>
      prev.map((row, idx) => (idx === index ? { ...row, amount: formatted } : row))
    );
  };

  const handleBulkFieldChange = (index, field, value) => {
    setBulkRows((prev) =>
      prev.map((row, idx) => (idx === index ? { ...row, [field]: value } : row))
    );
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();

    for (let i = 0; i < bulkRows.length; i++) {
      const row = bulkRows[i];
      const cleanAmountStr = String(row.amount).replace(/\D/g, "");
      const parsedAmount = Math.round(Number(cleanAmountStr));
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        Swal.fire("Gagal!", `Baris ke-${i + 1} memiliki nominal transaksi yang tidak valid.`, "error");
        return;
      }
    }

    if (submitLoading) return;
    setSubmitLoading(true);

    try {
      const insertData = bulkRows.map((row) => {
        const cleanAmountStr = String(row.amount).replace(/\D/g, "");
        const parsedAmount = Math.round(Number(cleanAmountStr));
        const combinedTimestamp = new Date(`${row.date}T${row.time}:05`).toISOString();
        return {
          user_id: user.id,
          type: row.type,
          amount: parsedAmount,
          category: row.category,
          note: row.note || null,
          created_at: combinedTimestamp,
        };
      });

      const { data, error } = await supabase
        .from("transaksi")
        .insert(insertData)
        .select();

      if (error) throw error;

      setTransactions([...data, ...transactions]);
      setIsBulkModalOpen(false);

      Swal.fire({
        title: "Tersimpan!",
        text: `${bulkRows.length} transaksi berhasil ditambahkan sekaligus.`,
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });

    } catch (error) {
      Swal.fire("Error", "Gagal menyimpan data massal: " + error.message, "error");
    } finally {
      setSubmitLoading(false);
    }
  };

  // ==========================================
  // 8. TRIGGER EDIT MODE (BUKA DI MODAL)
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

    setIsModalOpen(true); // Membuka modal form saat edit dimulai
  };

  const cancelEdit = () => {
    setIsEditingId(null);
    setFormData({
      type: "pengeluaran",
      amount: "",
      category: availableCategories.length > 0 ? availableCategories[0].name : "Makanan",
      note: "",
      date: "",
      time: "",
    });
    setTodayDateTime();
    setIsModalOpen(false); // Menutup modal form saat batal
  };

  // ==========================================
  // 9. HAPUS DATA TRANSAKSI
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
  // 10. LOGOUT HANDLER
  // ==========================================
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Swal.fire("Error", "Gagal keluar: " + error.message, "error");
    } else {
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
  // 11. FILTER & SEARCH TRANSAKSI
  // ==========================================
  const filteredTransactions = useMemo(() => {
    return transactions.filter((item) => {
      const itemDate = new Date(item.created_at);
      const offset = itemDate.getTimezoneOffset() * 60000;
      const itemDateStr = new Date(itemDate.getTime() - offset).toISOString().split("T")[0];
      
      let dateMatch = true;
      if (filterType === "hari-ini") {
        const sekarang = new Date();
        const localOffset = sekarang.getTimezoneOffset() * 60000;
        const todayStr = new Date(sekarang.getTime() - localOffset).toISOString().split("T")[0];
        dateMatch = itemDateStr === todayStr;
      } else if (filterType === "kustom") {
        if (startDate && endDate) {
          dateMatch = itemDateStr >= startDate && itemDateStr <= endDate;
        } else if (startDate) {
          dateMatch = itemDateStr >= startDate;
        } else if (endDate) {
          dateMatch = itemDateStr <= endDate;
        }
      } else if (filterType === "bulanan" && selectedMonth) {
        dateMatch = itemDateStr.substring(0, 7) === selectedMonth;
      }

      // Filter Search Query (Case-insensitive match on note & category)
      let searchMatch = true;
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        const noteMatch = item.note ? item.note.toLowerCase().includes(query) : false;
        const catMatch = item.category ? item.category.toLowerCase().includes(query) : false;
        searchMatch = noteMatch || catMatch;
      }

      return dateMatch && searchMatch;
    });
  }, [transactions, filterType, startDate, endDate, selectedMonth, searchQuery]);

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

  // ==========================================
  // HANDLERS UNTUK TARGET TABUNGAN & PENGINGAT TAGIHAN
  // ==========================================
  const saveNewGoal = (e) => {
    e.preventDefault();
    if (!savingGoalName.trim()) {
      Swal.fire("Error", "Nama target tidak boleh kosong!", "error");
      return;
    }
    const cleanTarget = savingGoalTarget.replace(/\D/g, "");
    const targetNum = Number(cleanTarget);
    if (isNaN(targetNum) || targetNum <= 0) {
      Swal.fire("Error", "Nominal target harus lebih besar dari 0!", "error");
      return;
    }
    if (!savingGoalDate) {
      Swal.fire("Error", "Tanggal target tidak boleh kosong!", "error");
      return;
    }
    
    const newGoal = {
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
      user_id: user.id,
      goal_name: savingGoalName.trim(),
      target_amount: targetNum,
      current_amount: 0,
      target_date: savingGoalDate,
      created_at: new Date().toISOString(),
    };

    const updatedGoals = [newGoal, ...goals];
    setGoals(updatedGoals);
    localStorage.setItem("dompetku_saving_goals", JSON.stringify(updatedGoals));
    
    // reset form & close modal
    setSavingGoalName("");
    setSavingGoalTarget("");
    setSavingGoalDate("");
    setIsSavingGoalModalOpen(false);

    Swal.fire({
      title: "Tersimpan!",
      text: `Target "${newGoal.goal_name}" berhasil didaftarkan.`,
      icon: "success",
      timer: 1500,
      showConfirmButton: false
    });
  };

  const handleDeleteGoal = async (id) => {
    Swal.fire({
      title: "Apakah Anda yakin?",
      text: "Target tabungan ini akan dihapus secara permanen dari akun Anda!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Hapus",
      cancelButtonText: "Batal"
    }).then((result) => {
      if (result.isConfirmed) {
        const updatedGoals = goals.filter(g => g.id !== id);
        setGoals(updatedGoals);
        localStorage.setItem("dompetku_saving_goals", JSON.stringify(updatedGoals));
        Swal.fire("Terhapus!", "Target tabungan berhasil dihapus.", "success");
      }
    });
  };

  const openAddSavingsModal = (goal) => {
    setSelectedGoalForSavings(goal);
    setSavingsAmount("");
    setIsAddSavingsModalOpen(true);
  };

  const saveSavings = (e) => {
    e.preventDefault();
    if (!selectedGoalForSavings) return;

    const addedAmount = Number(savingsAmount.replace(/\D/g, ""));
    if (isNaN(addedAmount) || addedAmount <= 0) {
      Swal.fire("Error", "Nominal dana harus valid dan lebih besar dari 0!", "error");
      return;
    }

    const newAmount = Math.round(Number(selectedGoalForSavings.current_amount) + addedAmount);
    const completedNow = newAmount >= selectedGoalForSavings.target_amount;

    const updatedGoals = goals.map(g => 
      g.id === selectedGoalForSavings.id ? { ...g, current_amount: newAmount } : g
    );
    setGoals(updatedGoals);
    localStorage.setItem("dompetku_saving_goals", JSON.stringify(updatedGoals));

    setIsAddSavingsModalOpen(false);
    setSavingsAmount("");
    setSelectedGoalForSavings(null);

    if (completedNow) {
      Swal.fire({
        title: "🎉 Selamat! Target Tercapai!",
        text: `Tabungan untuk "${selectedGoalForSavings.goal_name}" telah mencapai target sebesar ${formatRupiah(selectedGoalForSavings.target_amount)}!`,
        icon: "success",
        confirmButtonColor: "#2563eb",
        showClass: {
          popup: 'animate__animated animate__zoomInUp'
        }
      });
    } else {
      Swal.fire({
        title: "Sukses!",
        text: `Menyimpan dana Rp ${new Intl.NumberFormat("id-ID").format(addedAmount)} ke target tabungan Anda.`,
        icon: "success",
        timer: 1500,
        showConfirmButton: false
      });
    }
  };

  const saveNewBilling = (e) => {
    e.preventDefault();
    if (!billingName.trim()) {
      Swal.fire("Error", "Nama tagihan tidak boleh kosong!", "error");
      return;
    }
    const cleanAmount = billingAmount.replace(/\D/g, "");
    const amountNum = Number(cleanAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Swal.fire("Error", "Nominal tagihan harus lebih besar dari 0!", "error");
      return;
    }
    if (!billingDate) {
      Swal.fire("Error", "Tanggal jatuh tempo tidak boleh kosong!", "error");
      return;
    }

    const newBill = {
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
      user_id: user.id,
      bill_name: billingName.trim(),
      amount: amountNum,
      due_date: billingDate,
      status: "belum_bayar",
      created_at: new Date().toISOString(),
    };

    const updatedBillings = [...billings, newBill].sort(
      (a, b) => new Date(a.due_date) - new Date(b.due_date)
    );
    setBillings(updatedBillings);
    localStorage.setItem("dompetku_billings", JSON.stringify(updatedBillings));

    // reset form & close modal
    setBillingName("");
    setBillingAmount("");
    setBillingDate("");
    setIsBillingModalOpen(false);

    Swal.fire({
      title: "Tersimpan!",
      text: `Tagihan "${newBill.bill_name}" berhasil didaftarkan.`,
      icon: "success",
      timer: 1500,
      showConfirmButton: false
    });
  };

  const handleMarkAsPaid = async (bill) => {
    Swal.fire({
      title: "Tandai sebagai Lunas?",
      text: `Apakah Anda ingin membayar tagihan "${bill.bill_name}" sebesar ${formatRupiah(bill.amount)}? Tindakan ini otomatis akan mengurangi saldo utama Anda dengan mencatatkan pengeluaran baru.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, Lunasi & Potong Saldo",
      cancelButtonText: "Batal",
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#64748b"
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const now = new Date();
          const offset = now.getTimezoneOffset() * 60000;
          const localTimestamp = new Date(now.getTime() - offset).toISOString();

          const { error: txError } = await supabase
            .from("transaksi")
            .insert([{
              user_id: user.id,
              type: "pengeluaran",
              amount: Math.round(Number(bill.amount)),
              category: "Tagihan",
              note: `Pembayaran tagihan: ${bill.bill_name}`,
              created_at: localTimestamp
            }]);

          if (txError) throw txError;

          // Re-fetch transactions to sync state
          await fetchTransactions(user.id);

          // Update status tagihan di LocalStorage
          const updatedBillings = billings.map(b => 
            b.id === bill.id ? { ...b, status: "lunas" } : b
          );
          setBillings(updatedBillings);
          localStorage.setItem("dompetku_billings", JSON.stringify(updatedBillings));

          Swal.fire({
            title: "Pembayaran Sukses!",
            text: `Tagihan "${bill.bill_name}" ditandai lunas dan didebit dari saldo utama Anda.`,
            icon: "success",
            timer: 2000,
            showConfirmButton: false
          });
        } catch (e) {
          Swal.fire("Error", "Gagal melunasi tagihan: " + e.message, "error");
        }
      }
    });
  };

  const handleDeleteBill = async (id) => {
    Swal.fire({
      title: "Apakah Anda yakin?",
      text: "Tagihan ini akan dihapus secara permanen dari daftar Anda!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Hapus",
      cancelButtonText: "Batal"
    }).then((result) => {
      if (result.isConfirmed) {
        const updatedBillings = billings.filter(b => b.id !== id);
        setBillings(updatedBillings);
        localStorage.setItem("dompetku_billings", JSON.stringify(updatedBillings));
        Swal.fire("Terhapus!", "Tagihan berhasil dihapus.", "success");
      }
    });
  };

  const getDueIndicator = (dueDate, status) => {
    if (status === "lunas") {
      return {
        label: "Lunas",
        colorClass: "bg-emerald-50 text-emerald-600 border-emerald-200",
        accentClass: "bg-emerald-500",
        isPaid: true
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);

    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 3) {
      return {
        label: diffDays < 0 ? `Terlewat ${Math.abs(diffDays)} Hari` : diffDays === 0 ? "Hari Ini (Segera)" : `H-${diffDays} (Segera)`,
        colorClass: "bg-rose-50 text-rose-600 border-rose-200 border-2",
        accentClass: "bg-rose-500",
        isPaid: false
      };
    } else if (diffDays <= 7) {
      return {
        label: `H-${diffDays} (Mendatang)`,
        colorClass: "bg-amber-50 text-amber-600 border-amber-200",
        accentClass: "bg-amber-500",
        isPaid: false
      };
    } else {
      return {
        label: `H-${diffDays} (Mendatang)`,
        colorClass: "bg-slate-50 text-slate-600 border-slate-200",
        accentClass: "bg-slate-400",
        isPaid: false
      };
    }
  };

  // ==========================================
  // 12. KALKULASI DATA ANALITIK GRAFIK
  // ==========================================
  // A. Pengeluaran Per Kategori
  const categoryData = useMemo(() => {
    const expenses = filteredTransactions.filter((t) => t.type === "pengeluaran");
    const total = expenses.reduce((sum, t) => sum + Math.round(Number(t.amount)), 0);

    const categoriesMap = {};
    expenses.forEach((t) => {
      const amt = Math.round(Number(t.amount));
      categoriesMap[t.category] = (categoriesMap[t.category] || 0) + amt;
    });

    return Object.entries(categoriesMap).map(([category, amount]) => ({
      category,
      amount,
      percentage: total > 0 ? (amount / total) * 100 : 0,
    })).sort((a, b) => b.amount - a.amount);
  }, [filteredTransactions]);

  // Segment Donut Chart Helper
  const donutSegments = useMemo(() => {
    let accumulatedPercent = 0;
    const colors = {
      Makanan: "#f43f5e",   // rose-500
      Transport: "#f59e0b", // amber-500
      Tagihan: "#3b82f6",   // blue-500
      Hiburan: "#8b5cf6",   // violet-500
      Lainnya: "#64748b",   // slate-500
    };

    return categoryData.map((item) => {
      const strokeDasharray = `${item.percentage} ${100 - item.percentage}`;
      const strokeDashoffset = 100 - accumulatedPercent;
      accumulatedPercent += item.percentage;
      const color = colors[item.category] || "#14b8a6"; // default teal

      return {
        ...item,
        strokeDasharray,
        strokeDashoffset,
        color,
      };
    });
  }, [categoryData]);

  // B. Tren Pengeluaran Harian (7 Hari Terakhir dengan Pengeluaran)
  const dailySpendingData = useMemo(() => {
    const expenses = filteredTransactions.filter((t) => t.type === "pengeluaran");
    const dailyMap = {};

    expenses.forEach((t) => {
      const dateObj = new Date(t.created_at);
      const offset = dateObj.getTimezoneOffset() * 60000;
      const localDateStr = new Date(dateObj.getTime() - offset).toISOString().split("T")[0];
      
      dailyMap[localDateStr] = (dailyMap[localDateStr] || 0) + Math.round(Number(t.amount));
    });

    const sortedDays = Object.entries(dailyMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-7);

    return sortedDays.map(([dateKey, amount]) => {
      const dateParts = dateKey.split("-");
      const displayDate = `${dateParts[2]}/${dateParts[1]}`;
      return {
        date: displayDate,
        amount,
      };
    });
  }, [filteredTransactions]);

  const maxDailyAmount = useMemo(() => {
    if (dailySpendingData.length === 0) return 0;
    return Math.max(...dailySpendingData.map((d) => d.amount));
  }, [dailySpendingData]);

  // ==========================================
  // 13. EKSPOR LAPORAN PDF
  // ==========================================
  const handleExportPDF = async () => {
    try {
      // 1. Tampilkan popup SweetAlert2 dengan desain custom HTML yang sangat menarik
      const result = await Swal.fire({
        title: "Pilih Data Laporan PDF",
        text: "Silakan tentukan data transaksi yang ingin diekspor ke berkas PDF:",
        html: `
          <div class="flex flex-col sm:flex-row gap-4 mt-5 text-left">
            <div id="btn-opt-filtered" class="flex-1 p-5 border-2 border-blue-600 rounded-2xl bg-blue-50/40 hover:bg-blue-50 hover:border-blue-600 transition-all flex flex-col justify-between gap-3 cursor-pointer select-none active:scale-[0.98]">
              <div class="flex items-center gap-2.5">
                <span class="text-2xl bg-white w-9 h-9 rounded-xl flex items-center justify-center shadow-xs">🔍</span>
                <span class="font-bold text-slate-800 text-sm">Data Terfilter</span>
              </div>
              <p class="text-xs text-slate-500 leading-relaxed">Mengekspor transaksi aktif yang saat ini tampil di layar sesuai saringan pencarian & rentang waktu.</p>
            </div>
            <div id="btn-opt-all" class="flex-1 p-5 border-2 border-slate-200 hover:border-blue-600 rounded-2xl hover:bg-slate-50 transition-all flex flex-col justify-between gap-3 cursor-pointer select-none active:scale-[0.98]">
              <div class="flex items-center gap-2.5">
                <span class="text-2xl bg-white w-9 h-9 rounded-xl flex items-center justify-center shadow-xs">🗂️</span>
                <span class="font-bold text-slate-800 text-sm">Semua Riwayat</span>
              </div>
              <p class="text-xs text-slate-500 leading-relaxed">Mengekspor seluruh data riwayat transaksi Anda sejak pertama kali mencatatkan keuangan.</p>
            </div>
          </div>
        `,
        showConfirmButton: false,
        showCancelButton: true,
        cancelButtonText: "Batal",
        cancelButtonColor: "#64748b",
        focusCancel: true,
        didOpen: () => {
          const filteredBtn = document.getElementById("btn-opt-filtered");
          const allBtn = document.getElementById("btn-opt-all");
          if (filteredBtn) {
            filteredBtn.addEventListener("click", () => {
              filteredBtn.setAttribute("data-choice", "filtered");
              Swal.clickConfirm();
            });
          }
          if (allBtn) {
            allBtn.addEventListener("click", () => {
              allBtn.setAttribute("data-choice", "all");
              Swal.clickConfirm();
            });
          }
        },
        preConfirm: () => {
          const filteredBtn = document.getElementById("btn-opt-filtered");
          const allBtn = document.getElementById("btn-opt-all");
          if (filteredBtn && filteredBtn.hasAttribute("data-choice")) {
            return "filtered";
          }
          if (allBtn && allBtn.hasAttribute("data-choice")) {
            return "all";
          }
          return null;
        }
      });

      const selectedOption = result.value;
      if (!selectedOption) return; // Batal mengunduh

      // Lazy load library jsPDF & autoTable agar aman dari SSR Next.js
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF();

      // Pilih data berdasarkan opsi terpilih
      const targetData = selectedOption === "all" ? transactions : filteredTransactions;

      // Hitung total nominal & saldo secara independiri untuk data yang diekspor
      const pdfTotalPemasukan = targetData
        .filter((t) => t.type === "pemasukan")
        .reduce((sum, t) => sum + Math.round(Number(t.amount)), 0);

      const pdfTotalPengeluaran = targetData
        .filter((t) => t.type === "pengeluaran")
        .reduce((sum, t) => sum + Math.round(Number(t.amount)), 0);

      const pdfSaldo = pdfTotalPemasukan - pdfTotalPengeluaran;

      // Desain Header PDF
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(37, 99, 235); // Blue color (#2563eb)
      doc.text("DompetKu", 14, 20);

      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139); // Slate-500
      doc.setFont("helvetica", "normal");
      doc.text("Laporan Keuangan Personal", 14, 25);

      // Metadata Saringan PDF
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text("Laporan Untuk:", 14, 38);
      doc.setFont("helvetica", "normal");
      doc.text(displayName, 45, 38);

      doc.setFont("helvetica", "bold");
      doc.text("Rentang Waktu:", 14, 44);
      doc.setFont("helvetica", "normal");

      let filterText = "Semua Riwayat";
      if (selectedOption === "filtered") {
        if (filterType === "hari-ini") {
          filterText = "Hari Ini (" + new Date().toLocaleDateString("id-ID") + ")";
        } else if (filterType === "bulanan" && selectedMonth) {
          const [yyyy, mm] = selectedMonth.split("-");
          const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
          filterText = `${months[parseInt(mm) - 1]} ${yyyy}`;
        } else if (filterType === "kustom" && (startDate || endDate)) {
          filterText = `${startDate || "Awal"} s/d ${endDate || "Akhir"}`;
        }
      }
      doc.text(filterText, 45, 44);

      doc.setFont("helvetica", "bold");
      doc.text("Tanggal Cetak:", 14, 50);
      doc.setFont("helvetica", "normal");
      doc.text(new Date().toLocaleString("id-ID"), 45, 50);

      // Divider Line
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.line(14, 56, 196, 56);

      // Mengumpulkan data transaksi yang akan dicetak
      const tableHeaders = [["No", "Tanggal & Waktu", "Tipe", "Kategori", "Catatan Keterangan", "Nominal"]];
      const tableRows = targetData.map((item, index) => {
        const date = item.created_at 
          ? new Date(item.created_at).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) 
          : "";
        const time = item.created_at 
          ? new Date(item.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) 
          : "";

        return [
          index + 1,
          `${date} (${time})`,
          item.type === "pemasukan" ? "Pemasukan" : "Pengeluaran",
          item.category,
          item.note || "-",
          formatRupiah(item.amount)
        ];
      });

      // Render Tabel menggunakan AutoTable
      autoTable(doc, {
        startY: 62,
        head: tableHeaders,
        body: tableRows,
        theme: "striped",
        headStyles: {
          fillColor: [37, 99, 235], // #2563eb
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 9
        },
        bodyStyles: {
          fontSize: 9
        },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 40 },
          2: { cellWidth: 25 },
          3: { cellWidth: 30 },
          4: { cellWidth: 47 },
          5: { cellWidth: 30, halign: "right" }
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252] // slate-50
        }
      });

      // Menghindari Rekapitulasi Terpotong di Batas Halaman
      const pageHeight = doc.internal.pageSize.getHeight();
      const rekapHeight = 35; // Tinggi estimasi yang diperlukan untuk rekapitulasi keuangan
      let currentY = (doc.lastAutoTable?.finalY || doc.previousAutoTable?.finalY || 120) + 10;

      if (currentY + rekapHeight > pageHeight - 15) {
        doc.addPage();
        currentY = 20; // Mulai di bagian atas halaman baru
      }

      // Menambahkan Recap Ringkasan di halaman/posisi yang sesuai
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42); // slate-900

      doc.text("Rekapitulasi Keuangan:", 14, currentY);

      doc.setFont("helvetica", "normal");
      doc.text("Total Pemasukan:", 14, currentY + 8);
      doc.setTextColor(16, 185, 129); // emerald-500
      doc.text("+ " + formatRupiah(pdfTotalPemasukan), 55, currentY + 8);

      doc.setTextColor(15, 23, 42);
      doc.text("Total Pengeluaran:", 14, currentY + 14);
      doc.setTextColor(244, 63, 94); // rose-500
      doc.text("- " + formatRupiah(pdfTotalPengeluaran), 55, currentY + 14);

      doc.setDrawColor(226, 232, 240);
      doc.line(14, currentY + 18, 90, currentY + 18);

      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.text("Saldo Akhir:", 14, currentY + 24);
      if (pdfSaldo >= 0) {
        doc.setTextColor(37, 99, 235); // blue-600
        doc.text(formatRupiah(pdfSaldo), 55, currentY + 24);
      } else {
        doc.setTextColor(244, 63, 94); // rose-500
        doc.text("- " + formatRupiah(Math.abs(pdfSaldo)), 55, currentY + 24);
      }

      // Download Berkas PDF
      doc.save(`Laporan_Keuangan_DompetKu_${filterText.replace(/\s+/g, '_')}.pdf`);

      Swal.fire({
        title: "Sukses!",
        text: "Laporan PDF berhasil diunduh.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false
      });

    } catch (error) {
      console.error("Gagal membuat berkas PDF:", error);
      Swal.fire("Gagal", "Gagal mengekspor laporan PDF: " + error.message, "error");
    }
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-2">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 text-sm font-medium">Memuat data DompetKu...</p>
        </div>
      </div>
    );
  }

  const displayName = user?.user_metadata?.username || (user?.email ? user.email.split("@")[0] : "User");

  return (
    <div className="h-screen overflow-hidden bg-slate-50 flex flex-col lg:flex-row font-sans text-slate-800 antialiased">
      
      {/* OVERLAY SIDEBAR MOBILE */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs z-30 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* ==========================================
      // PANEL KIRI: SIDEBAR NAVIGASI
      // ========================================== */}
      <aside className={`fixed inset-y-0 left-0 w-64 bg-slate-900 text-slate-300 z-40 transform lg:translate-x-0 lg:static flex flex-col justify-between transition-transform duration-300 ease-in-out border-r border-slate-800 h-full ${
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        
        {/* Header Sidebar & Profile */}
        <div>
          <div className="px-6 py-6 border-b border-slate-800/80 flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-500/10">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 12V7c0-1.1-.9-2-2-2H5c-1.11 0-2 .9-2 2v10c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-3" />
                <path d="M21 12H17c-1.1 0-2-.9-2-2s.9-2 2-2h4" />
              </svg>
            </div>
            <div>
              <h1 className="text-md font-semibold tracking-tight text-white">Dompet<span className="text-blue-500">Ku</span></h1>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Keuangan Personal</p>
            </div>
          </div>

          {/* User Profile Info */}
          <div className="px-5 py-5 border-b border-slate-800/50 flex items-center gap-3 bg-slate-950/20">
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-semibold text-blue-400 capitalize">
              {displayName[0]}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white capitalize truncate">{displayName}</p>
              <p className="text-[10px] text-slate-500 truncate mt-0.5">{user?.email}</p>
            </div>
          </div>

          {/* Menu Navigasi */}
          <nav className="px-3 py-6 space-y-1.5">
            <button
              onClick={() => { handleTabChange("dashboard"); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeTab === "dashboard"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/10"
                  : "hover:bg-slate-800/50 hover:text-white"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
              Ringkasan Dasbor
            </button>

            <button
              onClick={() => { handleTabChange("riwayat"); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeTab === "riwayat"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/10"
                  : "hover:bg-slate-800/50 hover:text-white"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
              Riwayat Transaksi
            </button>

            <button
              onClick={() => { handleTabChange("saving-goals"); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeTab === "saving-goals"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/10"
                  : "hover:bg-slate-800/50 hover:text-white"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="6" />
                <circle cx="12" cy="12" r="2" />
              </svg>
              Target Tabungan
            </button>

            <button
              onClick={() => { handleTabChange("billing-reminder"); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeTab === "billing-reminder"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/10"
                  : "hover:bg-slate-800/50 hover:text-white"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              Pengingat Tagihan
            </button>
          </nav>
        </div>

        {/* Footer Sidebar (Logout) */}
        <div className="p-4 border-t border-slate-800/80">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium rounded-xl transition-all cursor-pointer border border-red-500/20"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Keluar Sesi
          </button>
        </div>
      </aside>

      {/* ==========================================
      // TOP NAVBAR MOBILE
      // ========================================== */}
      <header className="lg:hidden bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 sticky top-0 z-20 px-4 py-3.5 flex justify-between items-center shadow-xs flex-shrink-0 transition-colors duration-300">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="18" x2="20" y2="18" />
            </svg>
          </button>
          
          <img src="/favicon.ico" alt="Logo" className="w-7 h-7 object-contain rounded-lg shadow-sm" onError={(e)=>{e.target.style.display='none'}} />
          <span className="text-md font-semibold tracking-tight text-slate-800 dark:text-slate-100">
            Dompet<span className="text-blue-600">Ku</span>
          </span>
        </div>

        <div className="flex gap-2">
          {/* Tombol Toggle Mata (Mode Privasi) Mobile Header */}
          <button
            type="button"
            onClick={togglePrivacyMode}
            className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-250 dark:hover:bg-slate-750 dark:border-slate-700 flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-xs cursor-pointer active:scale-95 transition-all duration-300"
            title={isPrivateMode ? "Matikan Mode Privasi" : "Aktifkan Mode Privasi"}
          >
            {isPrivateMode ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4.5 h-4.5 text-blue-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.815 7.815 3 3m-3-3-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4.5 h-4.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.43 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
            )}
          </button>

          {/* Tombol Switcher Tema Mobile Header */}
          <button
            type="button"
            onClick={toggleTheme}
            className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-250 dark:hover:bg-slate-750 dark:border-slate-700 flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-xs cursor-pointer active:scale-95 transition-all duration-300"
            title={theme === "light" ? "Aktifkan Mode Gelap" : "Aktifkan Mode Terang"}
          >
            <motion.div
              key={theme}
              initial={{ rotate: -90, scale: 0.8, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
            >
              {theme === "light" ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4.5 h-4.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m0 13.5V21M4.95 4.95l1.59 1.59m10.91 10.91 1.59 1.59M3 12h2.25m13.5 0H21M4.95 19.05l1.59-1.59m10.91-10.91 1.59-1.59M12 7.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4.5 h-4.5 text-amber-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
                </svg>
              )}
            </motion.div>
          </button>

          {activeTab === "riwayat" && (
            <button
              onClick={handleExportPDF}
              className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-250 dark:hover:bg-slate-750 dark:border-slate-700 flex items-center justify-center shadow-xs cursor-pointer border border-slate-200 dark:border-slate-700"
              title="Unduh PDF"
            >
              📥
            </button>
          )}
          {activeTab === "saving-goals" && (
            <button
              onClick={() => setIsSavingGoalModalOpen(true)}
              className="w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-md shadow-blue-500/15 cursor-pointer"
              title="Tambah Target"
            >
              🎯
            </button>
          )}
          {activeTab === "billing-reminder" && (
            <button
              onClick={() => setIsBillingModalOpen(true)}
              className="w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-md shadow-blue-500/15 cursor-pointer"
              title="Tambah Tagihan"
            >
              🗓️
            </button>
          )}
          <button
            onClick={openBulkModal}
            className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-250 dark:hover:bg-slate-750 dark:border-slate-700 flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-sm cursor-pointer active:scale-95 transition-all"
            title="Catat Massal"
          >
            🗂️
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-md shadow-blue-500/15 cursor-pointer active:scale-95 transition-all"
            title="Catat Transaksi"
          >
            +
          </button>
        </div>
      </header>

      {/* ==========================================
      // KONTEN UTAMA (SISI KANAN)
      // ========================================== */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        
        {/* HEADER DASHBOARD (DESKTOP ONLY) */}
        <header className="hidden lg:flex justify-between items-center bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-8 py-5.5 sticky top-0 z-10 flex-shrink-0 transition-colors duration-300">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white capitalize">
              {activeTab === "dashboard" && "Visualisasi Finansial"}
              {activeTab === "riwayat" && "Daftar Transaksi"}
              {activeTab === "saving-goals" && "Target Tabungan & Alokasi Dana"}
              {activeTab === "billing-reminder" && "Pengingat Tagihan Bulanan"}
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-400 font-medium">
              {activeTab === "saving-goals"
                ? "Buat rencana masa depan dan catat tabungan alokasi dana secara konsisten."
                : activeTab === "billing-reminder"
                ? "Catat tagihan rutin atau biaya langganan bulanan agar tidak terlewat."
                : `Selamat datang kembali, ${displayName}!`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Tombol Toggle Mata (Mode Privasi) Desktop Header */}
            <button
              type="button"
              onClick={togglePrivacyMode}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-250 dark:hover:bg-slate-750 dark:border-slate-700 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center duration-300"
              title={isPrivateMode ? "Matikan Mode Privasi" : "Aktifkan Mode Privasi"}
            >
              {isPrivateMode ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4.5 h-4.5 text-blue-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.815 7.815 3 3m-3-3-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4.5 h-4.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.43 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
              )}
            </button>

            {/* Tombol Switcher Tema Desktop Header */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-250 dark:hover:bg-slate-750 dark:border-slate-700 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center duration-300"
              title={theme === "light" ? "Aktifkan Mode Gelap" : "Aktifkan Mode Terang"}
            >
              <motion.div
                key={theme}
                initial={{ rotate: -90, scale: 0.8, opacity: 0 }}
                animate={{ rotate: 0, scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
              >
                {theme === "light" ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4.5 h-4.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m0 13.5V21M4.95 4.95l1.59 1.59m10.91 10.91 1.59 1.59M3 12h2.25m13.5 0H21M4.95 19.05l1.59-1.59m10.91-10.91 1.59-1.59M12 7.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4.5 h-4.5 text-amber-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
                  </svg>
                )}
              </motion.div>
            </button>

            {activeTab === "riwayat" && (
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-250 dark:hover:bg-slate-750 dark:border-slate-700 font-medium text-xs rounded-xl shadow-xs active:scale-[0.98] transition-all cursor-pointer"
              >
                📥 Unduh Laporan PDF
              </button>
            )}

            {activeTab === "saving-goals" && (
              <button
                onClick={() => setIsSavingGoalModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-xl shadow-lg shadow-blue-500/10 active:scale-[0.98] transition-all cursor-pointer"
              >
                <span>🎯 Tambah Target</span>
              </button>
            )}

            {activeTab === "billing-reminder" && (
              <button
                onClick={() => setIsBillingModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-xl shadow-lg shadow-blue-500/10 active:scale-[0.98] transition-all cursor-pointer"
              >
                <span>🗓️ Tambah Tagihan</span>
              </button>
            )}

            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-xl shadow-lg shadow-blue-500/10 active:scale-[0.98] transition-all cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Catat Transaksi
            </button>

            <button
              onClick={openBulkModal}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-250 dark:hover:bg-slate-750 dark:border-slate-700 font-medium text-xs rounded-xl shadow-sm active:scale-[0.98] transition-all cursor-pointer"
            >
              🗂️ Catat Massal
            </button>
          </div>
        </header>

        {/* CONTAINER KONTEN INTERNAL */}
        <div className="p-4 sm:p-6 lg:p-8 flex-1">

          {/* ==========================================
          // CARD RINGKASAN DINAMIS
          // ========================================== */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Kartu Saldo */}
            <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-6 rounded-2xl text-white shadow-xl shadow-blue-500/10 flex flex-col justify-between min-h-[120px] relative overflow-hidden group">
              <div className="flex justify-between items-center w-full">
                <span className="text-[10px] text-blue-100 font-semibold uppercase tracking-widest">Sisa Saldo</span>
                
                {/* Tombol Toggle Mata (Mode Privasi) di Saldo */}
                <button
                  type="button"
                  onClick={togglePrivacyMode}
                  className="p-1 text-blue-100 hover:text-white hover:bg-white/10 rounded-lg transition-all active:scale-95 cursor-pointer"
                  title={isPrivateMode ? "Tampilkan Saldo" : "Sembunyikan Saldo"}
                >
                  {isPrivateMode ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.815 7.815 3 3m-3-3-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.43 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                  )}
                </button>
              </div>
              <h3 className={`text-2xl font-bold mt-2 transition-all duration-300 ${
                isPrivateMode ? "blur-md select-none" : ""
              }`}>
                {saldo < 0 ? "-" : ""} {formatRupiah(Math.abs(saldo))}
              </h3>
            </div>

            {/* Kartu Pemasukan */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs flex items-center justify-between transition-colors duration-300">
              <div>
                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-widest">Total Pemasukan</span>
                <h4 className={`text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 transition-all duration-300 ${
                  isPrivateMode ? "blur-md select-none" : ""
                }`}>{formatRupiah(totalPemasukan)}</h4>
              </div>
              <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-md shadow-xs">
                ↓
              </div>
            </div>

            {/* Kartu Pengeluaran */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs flex items-center justify-between transition-colors duration-300">
              <div>
                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-widest">Total Pengeluaran</span>
                <h4 className={`text-xl font-bold text-rose-600 dark:text-rose-400 mt-1 transition-all duration-300 ${
                  isPrivateMode ? "blur-md select-none" : ""
                }`}>{formatRupiah(totalPengeluaran)}</h4>
              </div>
              <div className="w-10 h-10 bg-rose-50 dark:bg-rose-500/10 rounded-xl flex items-center justify-center text-rose-600 dark:text-rose-400 font-bold text-md shadow-xs">
                ↑
              </div>
            </div>
          </div>

          {/* TAB 1: DASBOR RINGKASAN & ANALITIK */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              
              {/* FILTER BAR DASBOR */}
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-wrap justify-between items-center gap-3">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Saring Rentang Statistik</span>
                <div className="flex flex-wrap bg-slate-100 p-1 rounded-xl text-xs font-semibold gap-1">
                  <button
                    onClick={() => setFilterType("hari-ini")}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      filterType === "hari-ini" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500"
                    }`}
                  >
                    Hari Ini
                  </button>
                  <button
                    onClick={() => setFilterType("bulanan")}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      filterType === "bulanan" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500"
                    }`}
                  >
                    Bulanan
                  </button>
                  <button
                    onClick={() => setFilterType("kustom")}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      filterType === "kustom" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500"
                    }`}
                  >
                    Kalender
                  </button>
                  <button
                    onClick={() => setFilterType("semua")}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      filterType === "semua" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500"
                    }`}
                  >
                    Semua
                  </button>
                </div>
              </div>

              {/* FILTER PANELS */}
              {filterType === "kustom" && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs grid grid-cols-2 gap-3"
                >
                  <div>
                    <label className="block text-[10px] font-medium uppercase text-slate-400 mb-1">Mulai Dari</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium uppercase text-slate-400 mb-1">Sampai Dengan</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none"
                    />
                  </div>
                </motion.div>
              )}

              {filterType === "bulanan" && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs"
                >
                  <label className="block text-[10px] font-medium uppercase text-slate-400 mb-1">Pilih Bulan & Tahun</label>
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none"
                  />
                </motion.div>
              )}

              {/* GRID VISUAL ANALITIK / GRAFIK */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                
                {/* 1. CHART DISTRIBUSI PENGELUARAN (DONUT) */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs lg:col-span-2 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">Distribusi Kategori Pengeluaran</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Persentase pengeluaran berdasarkan alokasi kebutuhan</p>
                  </div>
                  
                  {categoryData.length === 0 ? (
                    <div className="flex-1 py-12 flex flex-col items-center justify-center text-center">
                      <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 text-lg">📊</div>
                      <p className="text-xs text-slate-400 mt-2">Tidak ada data pengeluaran ditemukan.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center my-6 gap-6">
                      {/* Diagram Donut SVG */}
                      <div className="relative w-40 h-40">
                        <svg viewBox="0 0 42 42" className="w-full h-full transform -rotate-90">
                          {/* Background ring */}
                          <circle cx="21" cy="21" r="15.915494309189535" fill="transparent" stroke="#f1f5f9" strokeWidth="5" />
                          {/* Segments */}
                          {donutSegments.map((seg, idx) => (
                            <circle
                              key={idx}
                              cx="21"
                              cy="21"
                              r="15.915494309189535"
                              fill="transparent"
                              stroke={seg.color}
                              strokeWidth="5"
                              strokeDasharray={seg.strokeDasharray}
                              strokeDashoffset={seg.strokeDashoffset}
                              className="transition-all duration-300 hover:stroke-[6px] cursor-pointer"
                            />
                          ))}
                        </svg>
                        {/* Teks di tengah lingkaran */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                          <span className="text-[10px] text-slate-400 font-medium uppercase">Total Belanja</span>
                          <span className={`text-xs font-semibold text-slate-800 mt-0.5 transition-all duration-300 ${
                            isPrivateMode ? "blur-sm select-none" : ""
                          }`}>{formatRupiah(totalPengeluaran)}</span>
                        </div>
                      </div>

                      {/* Legenda Custom */}
                      <div className="w-full space-y-2.5">
                        {donutSegments.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs">
                            <div className="flex items-center gap-2">
                              <span className="w-3 h-3 rounded-md shrink-0" style={{ backgroundColor: item.color }} />
                              <span className="font-medium text-slate-600">{item.category}</span>
                            </div>
                            <div className="text-right">
                              <span className={`font-semibold text-slate-800 transition-all duration-300 ${
                                isPrivateMode ? "blur-sm select-none" : ""
                              }`}>{formatRupiah(item.amount)}</span>
                              <span className="text-[10px] text-slate-400 font-medium ml-1.5">({Math.round(item.percentage)}%)</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. CHART TREN HARIAN (BAR) */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs lg:col-span-3 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">Tren Pengeluaran Harian</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Riwayat pengeluaran 7 hari aktif terakhir dalam rentang filter</p>
                  </div>

                  {dailySpendingData.length === 0 ? (
                    <div className="flex-1 py-12 flex flex-col items-center justify-center text-center">
                      <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 text-lg">📈</div>
                      <p className="text-xs text-slate-400 mt-2">Belum ada riwayat harian terkumpul.</p>
                    </div>
                  ) : (
                    <div className="my-auto pt-8">
                      <div className="flex items-end justify-between h-48 px-2 relative">
                        {dailySpendingData.map((item, idx) => {
                          const heightPercent = maxDailyAmount > 0 ? (item.amount / maxDailyAmount) * 100 : 0;
                          return (
                            <div key={idx} className="flex flex-col items-center flex-1 group relative">
                              
                              {/* Hover tooltip */}
                              <div className={`opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[9px] py-1 px-1.5 rounded-lg absolute bottom-full mb-2 pointer-events-none shadow-md z-10 font-medium whitespace-nowrap transition-all duration-300 ${isPrivateMode ? "blur-sm select-none" : ""}`}>
                                {formatRupiah(item.amount)}
                              </div>
                              
                              {/* Bar wrapper with fixed height to resolve percentages */}
                              <div className="h-32 w-full flex items-end justify-center">
                                <div 
                                  className="w-7 bg-blue-500 rounded-t-md hover:bg-blue-600 transition-all duration-300 shadow-xs"
                                  style={{ height: `${Math.max(heightPercent, 4)}%` }}
                                />
                              </div>
                              
                              {/* Label tanggal di bawah bar */}
                              <span className="text-[10px] text-slate-400 font-medium mt-2.5 tracking-tight">{item.date}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  <div className="border-t border-slate-50 pt-4 flex justify-between items-center text-[10px] text-slate-400 font-medium">
                    <span>* Arahkan kursor pada batang untuk melihat nominal</span>
                    <span className="text-blue-500 cursor-pointer hover:underline" onClick={() => setActiveTab("riwayat")}>Lihat Semua Transaksi</span>
                  </div>
                </div>

              </div>

              {/* WIDGET DASHBOARD DUA FILTER AKTIF & ELEMEN MINI */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 1. AKTIVITAS TERAKHIR */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-sm font-semibold text-slate-800">Aktivitas Terakhir</h3>
                      <button onClick={() => handleTabChange("riwayat")} className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors">Semua</button>
                    </div>
                    
                    <div className="space-y-3">
                      {filteredTransactions.slice(0, 4).map((item) => {
                        const itemTime = item.created_at 
                          ? new Date(item.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) 
                          : "";
                        const itemDateStr = item.created_at 
                          ? new Date(item.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" }) 
                          : "";
                        
                        return (
                          <div key={item.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100/50 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                                item.type === "pemasukan" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                              }`}>
                                {item.category[0]}
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-semibold text-slate-700 truncate">{item.category}</h4>
                                <p className="text-[9px] text-slate-400 font-medium truncate">{item.note || "-"} • {itemDateStr}</p>
                              </div>
                            </div>
                            <span className={`font-bold shrink-0 transition-all duration-300 ${
                              isPrivateMode ? "blur-sm select-none" : ""
                            } ${
                              item.type === "pemasukan" ? "text-emerald-600" : "text-rose-600"
                            }`}>
                              {item.type === "pemasukan" ? "+" : "-"} {formatRupiah(item.amount)}
                            </span>
                          </div>
                        );
                      })}
                      {filteredTransactions.length === 0 && (
                        <p className="text-center py-10 text-slate-400 text-xs font-medium">Belum ada transaksi terekam.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. TARGET TABUNGAN AKTIF */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-sm font-semibold text-slate-800">Tabungan Aktif</h3>
                      <button onClick={() => handleTabChange("saving-goals")} className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors">Semua</button>
                    </div>
                    
                    <div className="space-y-3.5">
                      {goals.filter(g => g.current_amount < g.target_amount).slice(0, 3).map((item) => {
                        const percent = Math.min(Math.round((item.current_amount / item.target_amount) * 100), 100);
                        return (
                          <div key={item.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100/50 space-y-2">
                            <div className="flex justify-between items-start gap-2">
                              <h4 className="font-semibold text-slate-700 text-xs truncate max-w-[150px]">{item.goal_name}</h4>
                              <span className="text-[10px] text-blue-600 font-bold">{percent}%</span>
                            </div>
                            
                            <div className="w-full bg-slate-200/60 h-2 rounded-full overflow-hidden">
                              <div className="bg-blue-500 h-full rounded-full" style={{ width: `${percent}%` }} />
                            </div>
                            
                            <div className={`flex justify-between items-center text-[9px] text-slate-400 font-semibold transition-all duration-300 ${
                              isPrivateMode ? "blur-sm select-none" : ""
                            }`}>
                              <span>{formatRupiah(item.current_amount)}</span>
                              <span>Target: {formatRupiah(item.target_amount)}</span>
                            </div>
                          </div>
                        );
                      })}
                      {goals.filter(g => g.current_amount < g.target_amount).length === 0 && (
                        <div className="flex flex-col items-center justify-center text-center py-6">
                          <span className="text-2xl">🎯</span>
                          <p className="text-xs text-slate-400 mt-2 font-medium">Tidak ada target tabungan aktif.</p>
                          <button
                            onClick={() => setIsSavingGoalModalOpen(true)}
                            className="mt-3 text-[10px] bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer"
                          >
                            + Tambah Target
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. TAGIHAN MENDATANG */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-sm font-semibold text-slate-800">Tagihan Mendatang</h3>
                      <button onClick={() => handleTabChange("billing-reminder")} className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors font-sans">Semua</button>
                    </div>
                    
                    <div className="space-y-3">
                      {billings.filter(b => b.status === "belum_bayar").slice(0, 3).map((item) => {
                        const dueInfo = getDueIndicator(item.due_date, item.status);
                        return (
                          <div key={item.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100/50 flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <h4 className="font-semibold text-slate-700 text-xs truncate" title={item.bill_name}>{item.bill_name}</h4>
                              <p className={`text-[10px] text-slate-400 font-semibold mt-0.5 transition-all duration-300 ${
                                isPrivateMode ? "blur-sm select-none" : ""
                              }`}>{formatRupiah(item.amount)}</p>
                              <span className={`inline-block text-[8px] font-bold px-1.5 py-0.5 rounded-md border mt-1.5 ${dueInfo.colorClass}`}>
                                {dueInfo.label}
                              </span>
                            </div>
                            <button
                              onClick={() => handleMarkAsPaid(item)}
                              className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[10px] font-bold transition-all shrink-0 cursor-pointer shadow-sm shadow-emerald-500/10"
                            >
                              Bayar
                            </button>
                          </div>
                        );
                      })}
                      {billings.filter(b => b.status === "belum_bayar").length === 0 && (
                        <div className="flex flex-col items-center justify-center text-center py-6">
                          <span className="text-2xl">🗓️</span>
                          <p className="text-xs text-slate-400 mt-2 font-medium">Tidak ada tagihan mendatang.</p>
                          <button
                            onClick={() => setIsBillingModalOpen(true)}
                            className="mt-3 text-[10px] bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer"
                          >
                            + Tambah Tagihan
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: RIWAYAT TRANSAKSI LENGKAP */}
          {activeTab === "riwayat" && (
            <div className="space-y-4">
              
              {/* BAR PENCARIAN & FILTER HISTORI */}
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-4">
                
                {/* Search Bar Input & PDF button (Flex layout) */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      placeholder="Cari kategori atau keterangan catatan..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl text-xs font-medium text-slate-800 outline-none transition-all"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 hover:text-slate-600 bg-slate-200/50 hover:bg-slate-200 w-5 h-5 rounded-full flex items-center justify-center transition-colors"
                      >
                        ×
                      </button>
                    )}
                  </div>

                  {/* PDF Export Button (Visible on mobile/tablet layout inside search row) */}
                  <button
                    onClick={handleExportPDF}
                    className="lg:hidden px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-xl shadow-xs active:scale-[0.98] transition-all cursor-pointer border border-slate-200 flex items-center justify-center gap-2"
                  >
                    📥 Unduh PDF
                  </button>
                </div>

                <div className="flex flex-wrap justify-between items-center gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Filter Ringkasan</span>
                    
                    {/* Switcher Tampilan (List vs Card Grid) */}
                    <div className="flex bg-slate-100 p-0.5 rounded-lg text-[10px] font-medium border border-slate-200/50">
                      <button
                        onClick={() => setViewMode("list")}
                        className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                          viewMode === "list"
                            ? "bg-white text-slate-800 shadow-xs font-semibold"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                        title="Tampilan Daftar"
                      >
                        ☰ <span className="hidden sm:inline">Daftar</span>
                      </button>
                      <button
                        onClick={() => setViewMode("grid")}
                        className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                          viewMode === "grid"
                            ? "bg-white text-slate-800 shadow-xs font-semibold"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                        title="Tampilan Kotak-Kotak"
                      >
                        🎴 <span className="hidden sm:inline">Kotak</span>
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap bg-slate-100 p-1 rounded-xl text-xs font-semibold gap-1">
                    <button
                      onClick={() => setFilterType("hari-ini")}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        filterType === "hari-ini" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500"
                      }`}
                    >
                      Hari Ini
                    </button>
                    <button
                      onClick={() => setFilterType("bulanan")}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        filterType === "bulanan" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500"
                      }`}
                    >
                      Bulanan
                    </button>
                    <button
                      onClick={() => setFilterType("kustom")}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        filterType === "kustom" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500"
                      }`}
                    >
                      Kalender
                    </button>
                    <button
                      onClick={() => setFilterType("semua")}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        filterType === "semua" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500"
                      }`}
                    >
                      Semua
                    </button>
                  </div>
                </div>

                {/* Filter Panels */}
                {filterType === "kustom" && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-50"
                  >
                    <div>
                      <label className="block text-[10px] font-medium uppercase text-slate-400 mb-1">Mulai Dari</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium uppercase text-slate-400 mb-1">Sampai Dengan</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none"
                      />
                    </div>
                  </motion.div>
                )}

                {filterType === "bulanan" && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="pt-2 border-t border-slate-50"
                  >
                    <label className="block text-[10px] font-medium uppercase text-slate-400 mb-1">Pilih Bulan & Tahun</label>
                    <input
                      type="month"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none"
                    />
                  </motion.div>
                )}
              </div>

              {/* LIST KARTU HISTORI TRANSAKSI */}
              <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4" : "space-y-3"}>
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
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className={
                          viewMode === "grid"
                            ? "bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md hover:border-slate-200/60 transition-all flex flex-col justify-between h-44 relative"
                            : "p-4 bg-white rounded-2xl border border-slate-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:shadow-md hover:border-slate-200/60 transition-all"
                        }
                      >
                        {viewMode === "grid" ? (
                          // ==========================================
                          // DESIGN TAMPILAN KOTAK (GRID/CARD VIEW)
                          // ==========================================
                          <>
                            {/* Baris Atas: Badge Kategori & Tombol Aksi */}
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div
                                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                                    item.type === "pemasukan"
                                      ? "bg-emerald-50 text-emerald-600"
                                      : "bg-rose-50 text-rose-600"
                                  }`}
                                >
                                  {item.category[0]}
                                </div>
                                <div className="min-w-0">
                                  <h4 className="font-semibold text-slate-800 text-sm leading-tight truncate" title={item.category}>
                                    {item.category}
                                  </h4>
                                  <span className={`text-[9px] uppercase tracking-wider font-bold block ${
                                    item.type === "pemasukan" ? "text-emerald-600" : "text-rose-500"
                                  }`}>
                                    {item.type === "pemasukan" ? "Pemasukan" : "Pengeluaran"}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => startEdit(item)}
                                  className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                  title="Edit"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => handleDelete(item.id)}
                                  className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                  title="Hapus"
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>

                            {/* Baris Tengah: Nominal Uang Besar */}
                            <div className="my-2.5">
                              <span
                                className={`font-bold text-base transition-all duration-300 ${
                                  isPrivateMode ? "blur-sm select-none" : ""
                                } ${
                                  item.type === "pemasukan" ? "text-emerald-600" : "text-rose-600"
                                }`}
                              >
                                {item.type === "pemasukan" ? "+" : "-"} {formatRupiah(item.amount)}
                              </span>
                            </div>

                            {/* Baris Bawah: Catatan & Waktu */}
                            <div className="border-t border-slate-50 pt-2 text-[10px] text-slate-400 font-medium min-w-0">
                              <p className="truncate text-slate-600 mb-0.5" title={item.note || "Tidak ada catatan"}>
                                {item.note || "-"}
                              </p>
                              <p className="text-[9px] text-slate-400">
                                {itemDateStr} • {itemTime}
                              </p>
                            </div>
                          </>
                        ) : (
                          // ==========================================
                          // DESIGN TAMPILAN DAFTAR (LIST VIEW)
                          // ==========================================
                          <>
                            {/* Info Kategori & Catatan */}
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-9 h-9 rounded-xl flex items-center justify-center font-semibold text-sm shrink-0 ${
                                  item.type === "pemasukan"
                                    ? "bg-emerald-50 text-emerald-600"
                                    : "bg-rose-50 text-rose-600"
                                }`}
                              >
                                {item.category[0]}
                              </div>
                              <div>
                                <h4 className="font-semibold text-slate-800 text-sm leading-snug">{item.category}</h4>
                                <p className="text-xs text-slate-400 font-medium">
                                  {item.note || "-"} •{" "}
                                  <span className="text-slate-400 font-medium">{itemDateStr} ({itemTime})</span>
                                </p>
                              </div>
                            </div>

                            {/* Nominal & Tombol Aksi */}
                            <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2.5 sm:pt-0 border-slate-100">
                              <span
                                className={`font-semibold text-sm transition-all duration-300 ${
                                  isPrivateMode ? "blur-sm select-none" : ""
                                } ${
                                  item.type === "pemasukan" ? "text-emerald-600" : "text-rose-600"
                                }`}
                              >
                                {item.type === "pemasukan" ? "+" : "-"} {formatRupiah(item.amount)}
                              </span>

                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => startEdit(item)}
                                  className="p-2 text-slate-500 hover:text-blue-600 bg-slate-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                                  aria-label="Edit Catatan"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => handleDelete(item.id)}
                                  className="p-2 text-slate-500 hover:text-rose-600 bg-slate-50 hover:bg-rose-150 rounded-lg transition-colors cursor-pointer"
                                  aria-label="Hapus Catatan"
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {filteredTransactions.length === 0 && (
                  <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
                    <p className="text-slate-400 text-sm font-medium">Tidak ada transaksi yang cocok.</p>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 3: TARGET TABUNGAN / ALOKASI DANA */}
          {activeTab === "saving-goals" && (
            <div className="space-y-6">
              
              {/* FILTER BAR TARGET TABUNGAN */}
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-wrap justify-between items-center gap-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Saring Target Tabungan</span>
                <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold gap-1">
                  <button
                    onClick={() => setSavingFilter("semua")}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      savingFilter === "semua" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-750"
                    }`}
                  >
                    Semua
                  </button>
                  <button
                    onClick={() => setSavingFilter("progress")}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      savingFilter === "progress" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-750"
                    }`}
                  >
                    Progress
                  </button>
                  <button
                    onClick={() => setSavingFilter("selesai")}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      savingFilter === "selesai" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-750"
                    }`}
                  >
                    Selesai
                  </button>
                </div>
              </div>

              {/* GRID TARGET TABUNGAN */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {goals
                  .filter((item) => {
                    if (savingFilter === "progress") return item.current_amount < item.target_amount;
                    if (savingFilter === "selesai") return item.current_amount >= item.target_amount;
                    return true;
                  })
                  .map((item) => {
                    const percent = Math.min(
                      Math.round((item.current_amount / item.target_amount) * 100),
                      100
                    );
                    const formattedDate = item.target_date
                      ? new Date(item.target_date).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric"
                        })
                      : "-";

                    const isCompleted = item.current_amount >= item.target_amount;

                    return (
                      <div
                        key={item.id}
                        className={`bg-white p-5 rounded-2xl border shadow-xs flex flex-col justify-between h-48 relative hover:shadow-md hover:border-slate-200/60 transition-all ${
                          isCompleted ? "border-emerald-100" : "border-slate-100"
                        }`}
                      >
                        {/* Header Card */}
                        <div>
                          <div className="flex justify-between items-start gap-2">
                            <h3 className="font-bold text-slate-800 text-sm leading-snug truncate pr-6" title={item.goal_name}>
                              {item.goal_name}
                            </h3>
                            
                            {/* Delete Button */}
                            <button
                              onClick={() => handleDeleteGoal(item.id)}
                              className="absolute right-4 top-4 p-1 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-all cursor-pointer"
                              title="Hapus Target"
                            >
                              🗑️
                            </button>
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium block mt-1.5">
                            📅 Tenggat: {formattedDate}
                          </span>
                        </div>

                        {/* Area Progress Bar */}
                        <div className="my-3 space-y-1.5">
                          <div className="flex justify-between items-baseline text-xs">
                            <span className={`font-bold text-slate-700 transition-all duration-300 ${isPrivateMode ? "blur-sm select-none" : ""}`}>
                              {formatRupiah(item.current_amount)}
                            </span>
                            <span className={`text-[10px] text-slate-400 font-medium transition-all duration-300 ${isPrivateMode ? "blur-sm select-none" : ""}`}>
                              Target: {formatRupiah(item.target_amount)}
                            </span>
                          </div>

                          {/* Progress Bar with Animation */}
                          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden relative">
                            <motion.div
                              className={`h-full rounded-full ${
                                isCompleted ? "bg-gradient-to-r from-emerald-500 to-teal-500" : "bg-gradient-to-r from-blue-500 to-indigo-500"
                              }`}
                              initial={{ width: 0 }}
                              animate={{ width: `${percent}%` }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                            />
                          </div>

                          <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold">
                            <span>Status tabungan</span>
                            <span className={`font-bold ${isCompleted ? "text-emerald-600" : "text-blue-600"}`}>
                              {isCompleted ? "Selesai" : `${percent}%`}
                            </span>
                          </div>
                        </div>

                        {/* Tombol Isi Tabungan */}
                        {!isCompleted ? (
                          <button
                            onClick={() => openAddSavingsModal(item)}
                            className="w-full py-2 bg-slate-50 hover:bg-blue-600 hover:text-white border border-slate-200/80 hover:border-blue-600 text-blue-600 text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-xs"
                          >
                            💰 Isi Tabungan
                          </button>
                        ) : (
                          <div className="w-full py-2 bg-emerald-50 text-emerald-600 border border-emerald-100 text-center text-xs font-bold rounded-xl flex items-center justify-center gap-1.5">
                            ✓ Target Tercapai
                          </div>
                        )}
                      </div>
                    );
                  })}

                {/* EMPTY STATE */}
                {goals.filter((item) => {
                  if (savingFilter === "progress") return item.current_amount < item.target_amount;
                  if (savingFilter === "selesai") return item.current_amount >= item.target_amount;
                  return true;
                }).length === 0 && (
                  <div className="col-span-full text-center py-20 bg-white rounded-3xl border border-slate-100 flex flex-col items-center justify-center gap-4">
                    <span className="text-4xl">🎯</span>
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm">Tidak Ada Target Tabungan</h3>
                      <p className="text-xs text-slate-400 mt-1">
                        {savingFilter === "semua"
                          ? 'Klik "+ Tambah Target" untuk membuat alokasi dana baru.'
                          : `Tidak ada target tabungan dengan status ini.`}
                      </p>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 4: PENGINGAT TAGIHAN BULANAN */}
          {activeTab === "billing-reminder" && (
            <div className="space-y-6">
              
              {/* FILTER BAR PENGINGAT TAGIHAN */}
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-wrap justify-between items-center gap-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Saring Daftar Tagihan</span>
                <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold gap-1">
                  <button
                    onClick={() => setBillingFilter("semua")}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      billingFilter === "semua" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-750"
                    }`}
                  >
                    Semua
                  </button>
                  <button
                    onClick={() => setBillingFilter("progress")}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      billingFilter === "progress" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-750"
                    }`}
                  >
                    Belum Lunas
                  </button>
                  <button
                    onClick={() => setBillingFilter("selesai")}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      billingFilter === "selesai" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-750"
                    }`}
                  >
                    Lunas
                  </button>
                </div>
              </div>

              {/* LIST TAGIHAN MENDATANG */}
              <div className="space-y-4">
                {billings
                  .filter((item) => {
                    if (billingFilter === "progress") return item.status === "belum_bayar";
                    if (billingFilter === "selesai") return item.status === "lunas";
                    return true;
                  })
                  .map((item) => {
                    const indicator = getDueIndicator(item.due_date, item.status);
                    const formattedDate = item.due_date
                      ? new Date(item.due_date).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric"
                        })
                      : "-";

                    return (
                      <div
                        key={item.id}
                        className={`p-5 bg-white rounded-2xl border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md hover:border-slate-200 transition-all ${
                          item.status !== "lunas" && indicator.accentClass === "bg-rose-500" ? "border-rose-100" : "border-slate-100"
                        }`}
                      >
                        {/* Info Tagihan */}
                        <div className="flex items-start gap-4">
                          {/* Status Accent Line */}
                          <div className={`w-1.5 h-12 rounded-full shrink-0 ${indicator.accentClass}`} />
                          
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-bold text-slate-800 text-sm leading-snug">{item.bill_name}</h3>
                              <span className={`px-2.5 py-0.5 rounded-full border text-[9px] font-bold ${indicator.colorClass}`}>
                                {indicator.label}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 font-medium mt-1">
                              📅 Jatuh Tempo: {formattedDate}
                            </p>
                          </div>
                        </div>

                        {/* Nominal & Aksi Cepat */}
                        <div className="flex items-center justify-between sm:justify-end gap-5 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-50">
                          <span className={`font-bold text-slate-800 text-sm transition-all duration-300 ${isPrivateMode ? "blur-sm select-none" : ""}`}>
                            {formatRupiah(item.amount)}
                          </span>

                          <div className="flex items-center gap-2">
                            {/* Tombol Aksi Cepat "Tandai Lunas" */}
                            {item.status !== "lunas" && (
                              <button
                                onClick={() => handleMarkAsPaid(item)}
                                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
                              >
                                ✓ Bayar Lunas
                              </button>
                            )}

                            {/* Tombol Hapus */}
                            <button
                              onClick={() => handleDeleteBill(item.id)}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                              title="Hapus Tagihan"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                {/* EMPTY STATE */}
                {billings.filter((item) => {
                  if (billingFilter === "progress") return item.status === "belum_bayar";
                  if (billingFilter === "selesai") return item.status === "lunas";
                  return true;
                }).length === 0 && (
                  <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 flex flex-col items-center justify-center gap-4">
                    <span className="text-4xl">📅</span>
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm">Tidak Ada Tagihan Rutin</h3>
                      <p className="text-xs text-slate-400 mt-1">
                        {billingFilter === "semua"
                          ? 'Klik "+ Tambah Tagihan" untuk membuat catatan baru.'
                          : `Tidak ada tagihan dengan status ini.`}
                      </p>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

        </div>
      </main>

      {/* ==========================================
      // DIALOG MODAL CATAT/EDIT TRANSAKSI (Framer Motion)
      // ========================================== */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            
            {/* Backdrop blur overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={cancelEdit}
              className="absolute inset-0 bg-black/50 backdrop-blur-xs"
            />
            
            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-white w-full max-w-lg rounded-2xl border border-slate-100 shadow-2xl p-6 relative overflow-hidden z-10"
            >
              
              {/* Header Modal */}
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-md font-semibold text-slate-900">
                  {isEditingId ? "📝 Edit Transaksi" : "✍️ Catat Keuangan Baru"}
                </h3>
                <button
                  onClick={cancelEdit}
                  className="w-7 h-7 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full flex items-center justify-center text-xs transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Form Input */}
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Switcher Tipe Transaksi */}
                <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    disabled={isEditingId !== null}
                    onClick={() => setFormData({ ...formData, type: "pengeluaran" })}
                    className={`py-2 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                      formData.type === "pengeluaran"
                        ? "bg-white text-rose-600 shadow-xs"
                        : "text-slate-500 hover:text-slate-800"
                    } disabled:opacity-50`}
                  >
                    Pengeluaran
                  </button>
                  <button
                    type="button"
                    disabled={isEditingId !== null}
                    onClick={() => setFormData({ ...formData, type: "pemasukan" })}
                    className={`py-2 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                      formData.type === "pemasukan"
                        ? "bg-white text-emerald-600 shadow-xs"
                        : "text-slate-500 hover:text-slate-800"
                    } disabled:opacity-50`}
                  >
                    Pemasukan
                  </button>
                </div>

                {/* Input Jumlah Rupiah */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Nominal (Rupiah)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">Rp</span>
                    <input
                      type="text"
                      placeholder="0"
                      required
                      value={formData.amount}
                      onChange={handleAmountChange}
                      className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-blue-500 text-sm text-slate-900 font-semibold transition-all"
                    />
                  </div>
                </div>

                {/* Grid Input Tanggal & Waktu */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Tanggal</label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-blue-500 text-sm text-slate-900 transition-all font-medium"
                    />
                  </div>
                  <div className="w-full sm:w-36">
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Waktu</label>
                    <input
                      type="time"
                      required
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-blue-500 text-sm text-slate-900 transition-all font-medium"
                    />
                  </div>
                </div>

                {/* Dropdown Kategori & Button Tambah Kategori */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Kategori</label>
                  <div className="flex gap-2">
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-blue-500 text-sm text-slate-700 font-medium transition-all"
                    >
                      {availableCategories.map((cat, idx) => (
                        <option key={idx} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                      {availableCategories.length === 0 && (
                        <option value="">-- Kategori Kosong --</option>
                      )}
                    </select>
                    
                    {/* Tombol Tambah Kategori Kustom */}
                    <button
                      type="button"
                      onClick={handleAddCategory}
                      className="px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl flex items-center justify-center font-semibold text-base transition-colors cursor-pointer"
                      title="Tambah Kategori Baru"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Input Keterangan */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Keterangan / Catatan</label>
                  <textarea
                    placeholder="Catat rincian transaksi disini..."
                    rows="2"
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-blue-500 text-sm text-slate-700 font-medium transition-all resize-none"
                  ></textarea>
                </div>

                {/* Tombol Simpan & Batal */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl font-medium text-xs transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submitLoading}
                    className={`flex-1 py-2.5 text-white rounded-xl font-medium text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      formData.type === "pengeluaran"
                        ? "bg-rose-500 hover:bg-rose-600 shadow-rose-100"
                        : "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-100"
                    } disabled:opacity-50`}
                  >
                    {submitLoading ? "Menyimpan..." : isEditingId ? "Simpan Perubahan" : "Simpan Catatan"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==========================================
      // DIALOG MODAL CATAT TRANSAKSI MASSAL (BULK ADD) (Framer Motion)
      // ========================================== */}
      <AnimatePresence>
        {isBulkModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            
            {/* Backdrop blur overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsBulkModalOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-xs"
            />
            
            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-white w-full max-w-5xl max-h-[85vh] rounded-2xl border border-slate-100 shadow-2xl p-6 relative overflow-hidden z-10 flex flex-col"
            >
              
              {/* Header Modal */}
              <div className="flex justify-between items-center mb-6 flex-shrink-0">
                <div>
                  <h3 className="text-md font-semibold text-slate-900">
                    🗂️ Catat Keuangan Massal (Bulk Add)
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 font-medium font-sans">
                    Catat beberapa transaksi sekaligus (pemasukan & pengeluaran) dalam satu klik.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsBulkModalOpen(false)}
                  className="w-7 h-7 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full flex items-center justify-center text-xs transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Grid / Stack rows container */}
              <form onSubmit={handleBulkSubmit} className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto pr-1 space-y-4 mb-6">
                  {/* Table header for large screens */}
                  <div className="hidden md:grid md:grid-cols-[120px_140px_140px_145px_110px_1fr_40px] gap-3 px-2 text-slate-400 font-semibold text-[10px] uppercase tracking-wider select-none">
                    <div>Tipe</div>
                    <div>Nominal (Rp)</div>
                    <div>Kategori</div>
                    <div>Tanggal</div>
                    <div>Waktu</div>
                    <div>Keterangan</div>
                    <div className="text-center">Aksi</div>
                  </div>

                  {bulkRows.map((row, idx) => {
                    // Filter categories specifically for this row's type
                    const rowCategories = allCategories.filter(cat => cat.type === row.type);
                    
                    return (
                      <motion.div
                        key={row.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="bg-slate-50 md:bg-transparent p-4 md:p-0 rounded-xl md:rounded-none border border-slate-150 md:border-0 md:grid md:grid-cols-[120px_140px_140px_145px_110px_1fr_40px] gap-3 items-center"
                      >
                        {/* 1. Tipe Transaksi Switcher */}
                        <div>
                          <label className="block md:hidden text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tipe</label>
                          <div className="grid grid-cols-2 p-0.5 bg-slate-200/60 rounded-lg">
                            <button
                              type="button"
                              onClick={() => handleBulkTypeChange(idx, "pengeluaran")}
                              className={`py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                                row.type === "pengeluaran"
                                  ? "bg-white text-rose-600 shadow-xs"
                                  : "text-slate-500 hover:text-slate-800"
                              }`}
                            >
                              Keluar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleBulkTypeChange(idx, "pemasukan")}
                              className={`py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                                row.type === "pemasukan"
                                  ? "bg-white text-emerald-600 shadow-xs"
                                  : "text-slate-500 hover:text-slate-800"
                              }`}
                            >
                              Masuk
                            </button>
                          </div>
                        </div>

                        {/* 2. Nominal */}
                        <div className="mt-3 md:mt-0">
                          <label className="block md:hidden text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nominal</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-xs">Rp</span>
                            <input
                              type="text"
                              placeholder="0"
                              required
                              value={row.amount}
                              onChange={(e) => handleBulkAmountChange(idx, e.target.value)}
                              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-xs text-slate-900 font-semibold transition-all font-sans"
                            />
                          </div>
                        </div>

                        {/* 3. Kategori */}
                        <div className="mt-3 md:mt-0">
                          <label className="block md:hidden text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Kategori</label>
                          <select
                            value={row.category}
                            onChange={(e) => handleBulkFieldChange(idx, "category", e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-xs text-slate-700 font-semibold transition-all"
                          >
                            {rowCategories.map((cat, catIdx) => (
                              <option key={catIdx} value={cat.name}>
                                {cat.name}
                              </option>
                            ))}
                            {rowCategories.length === 0 && (
                              <option value="">Lainnya</option>
                            )}
                          </select>
                        </div>

                        {/* 4. Tanggal */}
                        <div className="mt-3 md:mt-0">
                          <label className="block md:hidden text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tanggal</label>
                          <input
                            type="date"
                            required
                            value={row.date}
                            onChange={(e) => handleBulkFieldChange(idx, "date", e.target.value)}
                            className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-xs text-slate-800 transition-all font-medium font-sans"
                          />
                        </div>

                        {/* 5. Waktu */}
                        <div className="mt-3 md:mt-0">
                          <label className="block md:hidden text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Waktu</label>
                          <input
                            type="time"
                            required
                            value={row.time}
                            onChange={(e) => handleBulkFieldChange(idx, "time", e.target.value)}
                            className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-xs text-slate-800 transition-all font-medium font-sans"
                          />
                        </div>

                        {/* 6. Keterangan */}
                        <div className="mt-3 md:mt-0">
                          <label className="block md:hidden text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Keterangan</label>
                          <input
                            type="text"
                            placeholder="Catatan..."
                            value={row.note}
                            onChange={(e) => handleBulkFieldChange(idx, "note", e.target.value)}
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-xs text-slate-700 font-semibold transition-all"
                          />
                        </div>

                        {/* 7. Hapus Row */}
                        <div className="mt-4 md:mt-0 text-right md:text-center">
                          <button
                            type="button"
                            onClick={() => removeBulkRow(idx)}
                            className="px-3 md:px-0 py-1.5 md:py-0 md:w-7 md:h-7 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-lg flex items-center justify-center text-xs transition-colors cursor-pointer border border-rose-200 md:border-0 font-medium font-sans inline-flex gap-1.5 md:gap-0"
                            title="Hapus baris ini"
                          >
                            <span className="md:hidden">Hapus Baris</span>
                            <span>🗑️</span>
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Footer Modal Actions */}
                <div className="border-t border-slate-100 pt-4 flex flex-wrap justify-between items-center gap-3 flex-shrink-0">
                  <button
                    type="button"
                    onClick={addBulkRow}
                    className="px-4 py-2 border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl font-semibold text-xs transition-all flex items-center gap-2 cursor-pointer shadow-xs active:scale-[0.98]"
                  >
                    ➕ Tambah Baris
                  </button>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsBulkModalOpen(false)}
                      className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl font-medium text-xs transition-colors cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={submitLoading}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-500/10 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {submitLoading ? "Menyimpan..." : `Simpan ${bulkRows.length} Catatan`}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==========================================
      // DIALOG MODAL TAMBAH TARGET TABUNGAN (Framer Motion)
      // ========================================== */}
      <AnimatePresence>
        {isSavingGoalModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSavingGoalModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-md rounded-2xl border border-slate-100 shadow-2xl p-6 relative overflow-hidden z-10"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-md font-semibold text-slate-900 flex items-center gap-2">
                  🎯 Tambah Target Tabungan Baru
                </h3>
                <button
                  type="button"
                  onClick={() => setIsSavingGoalModalOpen(false)}
                  className="w-7 h-7 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full flex items-center justify-center text-xs transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={saveNewGoal} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Nama Target</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Beli Laptop Kuliah, Liburan"
                    value={savingGoalName}
                    onChange={(e) => setSavingGoalName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:bg-white focus:border-blue-500 transition-all text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Nominal Target (Rp)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">Rp</span>
                    <input
                      type="text"
                      required
                      placeholder="0"
                      value={savingGoalTarget}
                      onChange={(e) => {
                        const cleanNumber = e.target.value.replace(/\D/g, "");
                        if (!cleanNumber) {
                          setSavingGoalTarget("");
                          return;
                        }
                        setSavingGoalTarget(new Intl.NumberFormat("id-ID").format(cleanNumber));
                      }}
                      className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:bg-white focus:border-blue-500 transition-all text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Tanggal Target</label>
                  <input
                    type="date"
                    required
                    value={savingGoalDate}
                    onChange={(e) => setSavingGoalDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:bg-white focus:border-blue-500 transition-all text-slate-800"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsSavingGoalModalOpen(false)}
                    className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-xs shadow-lg shadow-blue-500/10 transition-all cursor-pointer"
                  >
                    Simpan Target
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==========================================
      // DIALOG MODAL TAMBAH TAGIHAN (Framer Motion)
      // ========================================== */}
      <AnimatePresence>
        {isBillingModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsBillingModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-md rounded-2xl border border-slate-100 shadow-2xl p-6 relative overflow-hidden z-10"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-md font-semibold text-slate-900 flex items-center gap-2">
                  🗓️ Tambah Tagihan Baru
                </h3>
                <button
                  type="button"
                  onClick={() => setIsBillingModalOpen(false)}
                  className="w-7 h-7 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full flex items-center justify-center text-xs transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={saveNewBilling} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Nama Tagihan</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Langganan Spotify, Token Listrik"
                    value={billingName}
                    onChange={(e) => setBillingName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:bg-white focus:border-blue-500 transition-all text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Nominal Tagihan (Rp)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">Rp</span>
                    <input
                      type="text"
                      required
                      placeholder="0"
                      value={billingAmount}
                      onChange={(e) => {
                        const cleanNumber = e.target.value.replace(/\D/g, "");
                        if (!cleanNumber) {
                          setBillingAmount("");
                          return;
                        }
                        setBillingAmount(new Intl.NumberFormat("id-ID").format(cleanNumber));
                      }}
                      className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:bg-white focus:border-blue-500 transition-all text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Tanggal Jatuh Tempo</label>
                  <input
                    type="date"
                    required
                    value={billingDate}
                    onChange={(e) => setBillingDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:bg-white focus:border-blue-500 transition-all text-slate-800"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsBillingModalOpen(false)}
                    className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-xs shadow-lg shadow-blue-500/10 transition-all cursor-pointer"
                  >
                    Simpan Tagihan
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==========================================
      // DIALOG MODAL ISI TABUNGAN (Framer Motion)
      // ========================================== */}
      <AnimatePresence>
        {isAddSavingsModalOpen && selectedGoalForSavings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddSavingsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-md rounded-2xl border border-slate-100 shadow-2xl p-6 relative overflow-hidden z-10"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-md font-semibold text-slate-900 flex flex-col">
                  <span>💰 Isi Tabungan</span>
                  <span className="text-xs text-slate-400 font-medium mt-1">Tambah dana untuk: {selectedGoalForSavings.goal_name}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddSavingsModalOpen(false)}
                  className="w-7 h-7 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full flex items-center justify-center text-xs transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={saveSavings} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Nominal Dana Tambahan (Rp)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">Rp</span>
                    <input
                      type="text"
                      required
                      placeholder="0"
                      autoFocus
                      value={savingsAmount}
                      onChange={(e) => {
                        const cleanNumber = e.target.value.replace(/\D/g, "");
                        if (!cleanNumber) {
                          setSavingsAmount("");
                          return;
                        }
                        setSavingsAmount(new Intl.NumberFormat("id-ID").format(cleanNumber));
                      }}
                      className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:bg-white focus:border-blue-500 transition-all text-slate-800"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddSavingsModalOpen(false)}
                    className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-xs shadow-lg shadow-blue-500/10 transition-all cursor-pointer"
                  >
                    Simpan Dana
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}