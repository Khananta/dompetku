"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/utils/supabase";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

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
  const [billingType, setBillingType] = useState("biasa"); // "biasa" | "hutang" | "piutang"
  const [billingPerson, setBillingPerson] = useState("");
  const [billingTypeFilter, setBillingTypeFilter] = useState("semua"); // "semua" | "biasa" | "hutang" | "piutang"

  // State baru untuk Pengaturan Finansial
  const [monthlyBudgetLimit, setMonthlyBudgetLimit] = useState("");
  const [defaultCategory, setDefaultCategory] = useState("Makanan");

  // State Mode Privasi (Samaran)
  const [isPrivateMode, setIsPrivateMode] = useState(false);

  // State Catat Massal (Bulk Add)
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkRows, setBulkRows] = useState([]);

  // State Mode Gelap (Dark Mode)
  const [theme, setTheme] = useState("light");
  const [mounted, setMounted] = useState(false);

  // State Kalkulator Finansial
  const [activeCalcTab, setActiveCalcTab] = useState("emergency");
  const [calcMonthlyExpense, setCalcMonthlyExpense] = useState("");
  const [calcFamilyStatus, setCalcFamilyStatus] = useState("lajang");
  const [calcSavingsTarget, setCalcSavingsTarget] = useState("");
  const [calcMonthlySavings, setCalcMonthlySavings] = useState("");

  // State Kalender Keuangan
  const [calendarCurrentDate, setCalendarCurrentDate] = useState(() => new Date());
  const [calendarSelectedDate, setCalendarSelectedDate] = useState(null);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);

  // State Split Bill Calculator
  const [splitBillMode, setSplitBillMode] = useState("simple"); // "simple" | "itemized"
  const [splitBillTotal, setSplitBillTotal] = useState("");
  const [splitBillPeople, setSplitBillPeople] = useState(2);
  const [splitBillTax, setSplitBillTax] = useState("");
  const [splitBillService, setSplitBillService] = useState("");
  const [splitBillMembers, setSplitBillMembers] = useState([
    { id: "1", name: "Teman 1", items: [{ id: "i1", name: "Menu 1", price: "" }] },
    { id: "2", name: "Teman 2", items: [{ id: "i1", name: "Menu 1", price: "" }] },
  ]);

  // State Kalkulator Finansial Lanjutan (Dana Darurat)
  const [calcIncomeStability, setCalcIncomeStability] = useState("stabil");
  const [calcHasDebt, setCalcHasDebt] = useState(false);
  const [calcHasMedicalRisk, setCalcHasMedicalRisk] = useState(false);
  const [calcNoInsurance, setCalcNoInsurance] = useState(false);

  useEffect(() => {
    setMounted(true);
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
      if (
        tab === "dashboard" ||
        tab === "riwayat" ||
        tab === "saving-goals" ||
        tab === "billing-reminder" ||
        tab === "settings" ||
        tab === "financial-calculator" ||
        tab === "financial-calendar" ||
        tab === "split-bill"
      ) {
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

        // Ambil pengaturan budget & kategori default dari LocalStorage
        const savedBudget = localStorage.getItem("dompetku_budget_limit");
        if (savedBudget) {
          setMonthlyBudgetLimit(savedBudget);
        }
        const savedDefaultCat = localStorage.getItem("dompetku_default_category");
        if (savedDefaultCat) {
          setDefaultCategory(savedDefaultCat);
          setFormData((prev) => ({
            ...prev,
            category: savedDefaultCat,
          }));
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

  const currentMonthTotalExpenses = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-11
    
    return transactions
      .filter((t) => {
        if (t.type !== "pengeluaran") return false;
        const tDate = new Date(t.created_at || t.date);
        return tDate.getFullYear() === currentYear && tDate.getMonth() === currentMonth;
      })
      .reduce((sum, t) => sum + Math.round(Number(t.amount)), 0);
  }, [transactions]);

  const isBudgetExceeded = useMemo(() => {
    if (!monthlyBudgetLimit) return false;
    const limit = Number(monthlyBudgetLimit);
    return !isNaN(limit) && limit > 0 && currentMonthTotalExpenses > limit;
  }, [monthlyBudgetLimit, currentMonthTotalExpenses]);

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
    if (billingType !== "biasa" && !billingPerson.trim()) {
      Swal.fire("Error", "Nama orang tidak boleh kosong!", "error");
      return;
    }

    const newBill = {
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
      user_id: user.id,
      bill_name: billingName.trim(),
      amount: amountNum,
      due_date: billingDate,
      status: "belum_bayar",
      billing_type: billingType,
      person_name: billingType !== "biasa" ? billingPerson.trim() : "",
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
    setBillingType("biasa");
    setBillingPerson("");
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
    const isPiutang = bill.billing_type === "piutang";
    const isHutang = bill.billing_type === "hutang";

    let confirmTitle = "Tandai sebagai Lunas?";
    let confirmText = `Apakah Anda ingin membayar tagihan "${bill.bill_name}" sebesar ${formatRupiah(bill.amount)}? Tindakan ini otomatis akan mengurangi saldo utama Anda dengan mencatatkan pengeluaran baru.`;
    let confirmBtn = "Ya, Lunasi & Potong Saldo";
    let txType = "pengeluaran";
    let txCategory = "Tagihan";
    let txNote = `Pembayaran tagihan: ${bill.bill_name}`;
    let successTitle = "Pembayaran Sukses!";
    let successText = `Tagihan "${bill.bill_name}" ditandai lunas dan didebit dari saldo utama Anda.`;

    if (isPiutang) {
      confirmTitle = "Terima Pembayaran?";
      confirmText = `Apakah Anda ingin menandai bahwa "${bill.person_name}" telah melunasi hutangnya sebesar ${formatRupiah(bill.amount)}? Tindakan ini otomatis akan menambahkan saldo utama Anda dengan mencatatkan pemasukan baru.`;
      confirmBtn = "Ya, Terima & Tambah Saldo";
      txType = "pemasukan";
      txCategory = "Piutang";
      txNote = `Pelunasan piutang: ${bill.bill_name} oleh ${bill.person_name}`;
      successTitle = "Pembayaran Diterima!";
      successText = `Tagihan "${bill.bill_name}" ditandai lunas dan ditambahkan ke saldo utama Anda.`;
    } else if (isHutang) {
      confirmTitle = "Bayar Hutang?";
      confirmText = `Apakah Anda ingin membayar hutang "${bill.bill_name}" kepada "${bill.person_name}" sebesar ${formatRupiah(bill.amount)}? Tindakan ini otomatis akan mengurangi saldo utama Anda dengan mencatatkan pengeluaran baru.`;
      confirmBtn = "Ya, Lunasi & Potong Saldo";
      txType = "pengeluaran";
      txCategory = "Hutang";
      txNote = `Pelunasan hutang: ${bill.bill_name} kepada ${bill.person_name}`;
      successTitle = "Pembayaran Sukses!";
      successText = `Tagihan "${bill.bill_name}" ditandai lunas dan didebit dari saldo utama Anda.`;
    }

    Swal.fire({
      title: confirmTitle,
      text: confirmText,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: confirmBtn,
      cancelButtonText: "Batal",
      confirmButtonColor: isPiutang ? "#10b981" : "#3b82f6",
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
              type: txType,
              amount: Math.round(Number(bill.amount)),
              category: txCategory,
              note: txNote,
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
            title: successTitle,
            text: successText,
            icon: "success",
            timer: 2000,
            showConfirmButton: false
          });
        } catch (e) {
          Swal.fire("Error", "Gagal memproses transaksi: " + e.message, "error");
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

  const handleResetAllData = () => {
    Swal.fire({
      title: "Hapus Semua Data?",
      text: "Tindakan ini akan menghapus semua data target tabungan, pengingat tagihan, budget limit, dan kustomisasi lainnya yang disimpan di browser secara permanen! Data transaksi di database tidak akan terpengaruh.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Ya, Hapus Semua",
      cancelButtonText: "Batal"
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem("dompetku_saving_goals");
        localStorage.removeItem("dompetku_billings");
        localStorage.removeItem("dompetku_budget_limit");
        localStorage.removeItem("dompetku_default_category");
        
        // Reset states
        setGoals([]);
        setBillings([]);
        setMonthlyBudgetLimit("");
        setDefaultCategory("Makanan");
        
        Swal.fire({
          title: "Berhasil Direset!",
          text: "Semua data lokal telah dihapus.",
          icon: "success",
          timer: 1500,
          showConfirmButton: false
        });
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

  const handleCopySplitBill = (totalText, perPersonText, membersBreakdown = []) => {
    let textToCopy = "";
    if (splitBillMode === "simple") {
      textToCopy = `=== 👥 SPLIT BILL DOMPETKU ===
Total Tagihan: Rp ${totalText}
Jumlah Orang: ${splitBillPeople} Orang
---------------------------
Patungan Per Orang: *Rp ${perPersonText}*

Yuk, bayar patungannya ya! Terima kasih.`;
    } else {
      textToCopy = `=== 👥 SPLIT BILL DOMPETKU ===
Total Tagihan: Rp ${totalText}
---------------------------
Detail Pembagian Per Orang (inc. Pajak/Servis):
${membersBreakdown.map((m) => `- ${m.name}: *Rp ${m.totalFormatted}* (Subtotal: Rp ${m.baseFormatted} + Pajak/Servis)`).join("\n")}
---------------------------
Yuk, bayar patungannya ya! Terima kasih.`;
    }

    navigator.clipboard.writeText(textToCopy).then(() => {
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Rincian patungan disalin!",
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      });
    }).catch((err) => {
      console.error("Gagal menyalin teks: ", err);
      Swal.fire("Gagal", "Gagal menyalin rincian patungan.", "error");
    });
  };

  const getMonthlyTrendData = () => {
    const months = [
      { name: "Jan", pemasukan: 0, pengeluaran: 0 },
      { name: "Feb", pemasukan: 0, pengeluaran: 0 },
      { name: "Mar", pemasukan: 0, pengeluaran: 0 },
      { name: "Apr", pemasukan: 0, pengeluaran: 0 },
      { name: "Mei", pemasukan: 0, pengeluaran: 0 },
      { name: "Jun", pemasukan: 0, pengeluaran: 0 },
      { name: "Jul", pemasukan: 0, pengeluaran: 0 },
      { name: "Agu", pemasukan: 0, pengeluaran: 0 },
      { name: "Sep", pemasukan: 0, pengeluaran: 0 },
      { name: "Okt", pemasukan: 0, pengeluaran: 0 },
      { name: "Nov", pemasukan: 0, pengeluaran: 0 },
      { name: "Des", pemasukan: 0, pengeluaran: 0 },
    ];

    const currentYear = new Date().getFullYear();

    transactions.forEach((t) => {
      if (!t.created_at) return;
      const tDate = new Date(t.created_at);
      if (tDate.getFullYear() === currentYear) {
        const monthIndex = tDate.getMonth();
        if (monthIndex >= 0 && monthIndex <= 11) {
          const amt = Number(t.amount) || 0;
          if (t.type === "pemasukan") {
            months[monthIndex].pemasukan += amt;
          } else if (t.type === "pengeluaran") {
            months[monthIndex].pengeluaran += amt;
          }
        }
      }
    });

    return months;
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-lg font-sans text-xs">
          <p className="font-extrabold text-slate-800 dark:text-slate-100 mb-2">{label}</p>
          <div className="space-y-1">
            <p className="text-emerald-600 dark:text-emerald-400 font-semibold flex justify-between gap-6">
              <span>Pemasukan:</span>
              <span>{formatRupiah(payload[0].value)}</span>
            </p>
            <p className="text-rose-600 dark:text-rose-455 font-semibold flex justify-between gap-6">
              <span>Pengeluaran:</span>
              <span>{formatRupiah(payload[1].value)}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
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

            <button
              onClick={() => { handleTabChange("financial-calculator"); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeTab === "financial-calculator"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/10"
                  : "hover:bg-slate-800/50 hover:text-white"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="3" width="7" height="9" rx="1" />
                <rect x="14" y="3" width="7" height="5" rx="1" />
                <rect x="14" y="12" width="7" height="9" rx="1" />
                <rect x="3" y="16" width="7" height="5" rx="1" />
              </svg>
              Kalkulator Keuangan
            </button>

            <button
              onClick={() => { handleTabChange("financial-calendar"); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeTab === "financial-calendar"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/10"
                  : "hover:bg-slate-800/50 hover:text-white"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" />
              </svg>
              Kalender Keuangan
            </button>

            <button
              onClick={() => { handleTabChange("split-bill"); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeTab === "split-bill"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/10"
                  : "hover:bg-slate-800/50 hover:text-white"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a6 6 0 0 0-3.44-4.53M4 19c0-1.1.9-2 2-2h4c1.1 0 2 Ley-2" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              Bagi Tagihan (Split Bill)
            </button>

            <button
              onClick={() => { handleTabChange("settings"); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeTab === "settings"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/10"
                  : "hover:bg-slate-800/50 hover:text-white"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.43l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 0 1 0-.255c.007-.378-.138-.75-.43-.991l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              Pengaturan
            </button>
          </nav>
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
              {activeTab === "settings" && "Pengaturan Aplikasi"}
              {activeTab === "financial-calculator" && "🧮 Kalkulator Simulasi Finansial"}
              {activeTab === "financial-calendar" && "📅 Kalender Keuangan"}
              {activeTab === "split-bill" && "👥 Bagi Tagihan (Split Bill)"}
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-400 font-medium">
              {activeTab === "saving-goals"
                ? "Buat rencana masa depan dan catat tabungan alokasi dana secara konsisten."
                : activeTab === "billing-reminder"
                ? "Catat tagihan rutin atau biaya langganan bulanan agar tidak terlewat."
                : activeTab === "settings"
                ? "Sesuaikan preferensi tampilan, batas anggaran, dan keamanan DompetKu."
                : activeTab === "financial-calculator"
                ? "Lakukan simulasi target dana darurat dan durasi menabung Anda secara praktis."
                : activeTab === "financial-calendar"
                ? "Lihat ringkasan arus kas masuk dan keluar bulanan Anda secara visual."
                : activeTab === "split-bill"
                ? "Hitung pembagian rata tagihan nota belanja Anda dengan teman secara praktis."
                : `Selamat datang kembali, ${displayName}!`}
            </p>
          </div>

          <div className="flex items-center gap-3">



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
              onClick={openBulkModal}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-250 dark:hover:bg-slate-750 dark:border-slate-700 font-medium text-xs rounded-xl shadow-sm active:scale-[0.98] transition-all cursor-pointer"
            >
              🗂️ Catat Massal
            </button>

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
          </div>
        </header>

        {/* CONTAINER KONTEN INTERNAL */}
        <div className="p-4 sm:p-6 lg:p-8 flex-1">

          {/* ==========================================
          // CARD RINGKASAN DINAMIS
          // ========================================== */}
          {(activeTab === "dashboard" || activeTab === "riwayat") && (
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
                  <h4 className={`text-xl font-bold text-emerald-600 dark:text-emerald-450 mt-1 transition-all duration-300 ${
                    isPrivateMode ? "blur-md select-none" : ""
                  }`}>{formatRupiah(totalPemasukan)}</h4>
                </div>
                <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-450 font-bold text-md shadow-xs">
                  ↓
                </div>
              </div>

              {/* Kartu Pengeluaran */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs flex items-center justify-between transition-colors duration-300">
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-widest">Total Pengeluaran</span>
                  <h4 className={`text-xl font-bold text-rose-600 dark:text-rose-450 mt-1 transition-all duration-300 ${
                    isPrivateMode ? "blur-md select-none" : ""
                  }`}>{formatRupiah(totalPengeluaran)}</h4>
                </div>
                <div className="w-10 h-10 bg-rose-50 dark:bg-rose-500/10 rounded-xl flex items-center justify-center text-rose-600 dark:text-rose-450 font-bold text-md shadow-xs">
                  ↑
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: DASBOR RINGKASAN & ANALITIK */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              
              {/* WARNING BUDGET LIMIT */}
              {isBudgetExceeded && (
                <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 rounded-2xl flex items-start gap-3 shadow-xs">
                  <span className="text-xl shrink-0 mt-0.5">⚠️</span>
                  <div className="min-w-0">
                    <h4 className="font-bold text-rose-800 dark:text-rose-400 text-xs">Batas Anggaran Bulanan Terlampaui!</h4>
                    <p className="text-[10px] text-rose-600 dark:text-rose-500 font-semibold mt-1">
                      Total pengeluaran Anda di bulan ini sebesar <span className="underline">{formatRupiah(currentMonthTotalExpenses)}</span> telah melebihi batas anggaran bulanan yang ditentukan yaitu <span className="underline">{formatRupiah(Number(monthlyBudgetLimit))}</span>. Kurangi pengeluaran non-esensial untuk menjaga kesehatan keuangan Anda!
                    </p>
                  </div>
                </div>
              )}

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
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs lg:col-span-2 flex flex-col justify-between transition-colors duration-300">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Distribusi Kategori Pengeluaran</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Persentase pengeluaran berdasarkan alokasi kebutuhan</p>
                  </div>
                  
                  {categoryData.length === 0 ? (
                    <div className="flex-1 py-12 flex flex-col items-center justify-center text-center">
                      <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800/80 flex items-center justify-center text-slate-400 dark:text-slate-500 text-lg">📊</div>
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
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs lg:col-span-3 flex flex-col justify-between transition-colors duration-300">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Tren Pengeluaran Harian</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Riwayat pengeluaran 7 hari aktif terakhir dalam rentang filter</p>
                  </div>

                  {dailySpendingData.length === 0 ? (
                    <div className="flex-1 py-12 flex flex-col items-center justify-center text-center">
                      <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800/80 flex items-center justify-center text-slate-400 dark:text-slate-500 text-lg">📈</div>
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

              {/* 3. LINE CHART TREN TAHUNAN (RECHARTS) */}
              <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs transition-colors duration-300">
                <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-150/45 dark:border-slate-800/40">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Tren Keuangan Tahunan</h3>
                    <p className="text-[10px] text-slate-405 dark:text-slate-500 font-medium">Perbandingan arus pemasukan dan pengeluaran Anda sepanjang tahun berjalan</p>
                  </div>
                  <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-400 rounded-lg">
                    Tahun {new Date().getFullYear()}
                  </span>
                </div>

                <div className="h-72 w-full pt-4 font-sans text-xs">
                  {mounted ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={getMonthlyTrendData()}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                        <XAxis
                          dataKey="name"
                          tickLine={false}
                          axisLine={false}
                          stroke="#94a3b8"
                          dy={10}
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          stroke="#94a3b8"
                          dx={-5}
                          tickFormatter={(value) => {
                            if (isPrivateMode) return "•••";
                            return new Intl.NumberFormat("id-ID", { notation: "compact", compactDisplay: "short" }).format(value);
                          }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                          verticalAlign="top"
                          height={36}
                          iconType="circle"
                          iconSize={8}
                          formatter={(value) => (
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 capitalize px-1">{value}</span>
                          )}
                        />
                        <Line
                          type="monotone"
                          dataKey="pemasukan"
                          name="Pemasukan"
                          stroke="#10b981"
                          strokeWidth={3}
                          dot={false}
                          activeDot={{ r: 6, strokeWidth: 0 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="pengeluaran"
                          name="Pengeluaran"
                          stroke="#f43f5e"
                          strokeWidth={3}
                          dot={false}
                          activeDot={{ r: 6, strokeWidth: 0 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <p className="text-slate-400 text-xs font-semibold">Membuat Grafik...</p>
                    </div>
                  )}
                </div>
              </div>

              {/* WIDGET DASHBOARD DUA FILTER AKTIF & ELEMEN MINI */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 1. AKTIVITAS TERAKHIR */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs flex flex-col justify-between transition-colors duration-300">
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Aktivitas Terakhir</h3>
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
                          <div key={item.id} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100/50 dark:border-slate-800/60 flex items-center justify-between text-xs transition-colors duration-300">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                                item.type === "pemasukan" ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-450" : "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-450"
                              }`}>
                                {item.category[0]}
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-semibold text-slate-700 dark:text-slate-350 truncate">{item.category}</h4>
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
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs flex flex-col justify-between transition-colors duration-300">
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Tabungan Aktif</h3>
                      <button onClick={() => handleTabChange("saving-goals")} className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors">Semua</button>
                    </div>
                    
                    <div className="space-y-3.5">
                      {goals.filter(g => g.current_amount < g.target_amount).slice(0, 3).map((item) => {
                        const percent = Math.min(Math.round((item.current_amount / item.target_amount) * 100), 100);
                        return (
                          <div key={item.id} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100/50 dark:border-slate-800/60 space-y-2 transition-colors duration-300">
                            <div className="flex justify-between items-start gap-2">
                              <h4 className="font-semibold text-slate-700 dark:text-slate-350 text-xs truncate max-w-[150px]">{item.goal_name}</h4>
                              <span className="text-[10px] text-blue-600 font-bold">{percent}%</span>
                            </div>
                            
                            <div className="w-full bg-slate-200/60 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
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
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs flex flex-col justify-between transition-colors duration-300">
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Tagihan & Hutang</h3>
                      <button onClick={() => handleTabChange("billing-reminder")} className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors font-sans">Semua</button>
                    </div>
                    
                    <div className="space-y-3">
                      {billings.filter(b => b.status === "belum_bayar").slice(0, 3).map((item) => {
                        const dueInfo = getDueIndicator(item.due_date, item.status);
                        
                        let displayTitle = item.bill_name;
                        let btnText = "Bayar";
                        let btnColorClass = "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/10";
                        
                        if (item.billing_type === "piutang") {
                          displayTitle = `💰 Piutang: ${item.person_name} (${item.bill_name})`;
                          btnText = "Terima";
                          btnColorClass = "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/10";
                        } else if (item.billing_type === "hutang") {
                          displayTitle = `💸 Hutang: ${item.person_name} (${item.bill_name})`;
                        } else {
                          displayTitle = `📱 ${item.bill_name}`;
                        }

                        return (
                          <div key={item.id} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100/50 dark:border-slate-800/60 flex items-center justify-between gap-2 transition-colors duration-300">
                            <div className="min-w-0">
                              <h4 className="font-semibold text-slate-700 dark:text-slate-350 text-xs truncate" title={item.bill_name}>{displayTitle}</h4>
                              <p className={`text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5 transition-all duration-300 ${
                                isPrivateMode ? "blur-sm select-none" : ""
                              }`}>{formatRupiah(item.amount)}</p>
                              <span className={`inline-block text-[8px] font-bold px-1.5 py-0.5 rounded-md border mt-1.5 ${dueInfo.colorClass}`}>
                                {dueInfo.label}
                              </span>
                            </div>
                            <button
                              onClick={() => handleMarkAsPaid(item)}
                              className={`px-2.5 py-1.5 text-white rounded-lg text-[10px] font-bold transition-all shrink-0 cursor-pointer shadow-sm ${btnColorClass}`}
                            >
                              {btnText}
                            </button>
                          </div>
                        );
                      })}
                      {billings.filter(b => b.status === "belum_bayar").length === 0 && (
                        <div className="flex flex-col items-center justify-center text-center py-6">
                          <span className="text-2xl">🗓️</span>
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 font-medium">Tidak ada tagihan mendatang.</p>
                          <button
                            onClick={() => setIsBillingModalOpen(true)}
                            className="mt-3 text-[10px] bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer"
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
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs flex flex-col gap-4 transition-colors duration-300">
                <div className="flex flex-wrap justify-between items-center gap-3">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Status Pembayaran</span>
                  <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl text-xs font-semibold gap-1">
                    <button
                      onClick={() => setBillingFilter("semua")}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        billingFilter === "semua"
                          ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-xs"
                          : "text-slate-500 dark:text-slate-400 hover:text-slate-750 dark:hover:text-slate-200"
                      }`}
                    >
                      Semua
                    </button>
                    <button
                      onClick={() => setBillingFilter("progress")}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        billingFilter === "progress"
                          ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-xs"
                          : "text-slate-500 dark:text-slate-400 hover:text-slate-750 dark:hover:text-slate-200"
                      }`}
                    >
                      Belum Lunas
                    </button>
                    <button
                      onClick={() => setBillingFilter("selesai")}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        billingFilter === "selesai"
                          ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-xs"
                          : "text-slate-500 dark:text-slate-400 hover:text-slate-750 dark:hover:text-slate-200"
                      }`}
                    >
                      Lunas
                    </button>
                  </div>
                </div>

                <div className="h-px bg-slate-100 dark:bg-slate-800" />

                <div className="flex flex-wrap justify-between items-center gap-3">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Tipe Catatan</span>
                  <div className="flex flex-wrap bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl text-xs font-semibold gap-1">
                    <button
                      onClick={() => setBillingTypeFilter("semua")}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        billingTypeFilter === "semua"
                          ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-xs"
                          : "text-slate-500 dark:text-slate-400 hover:text-slate-750 dark:hover:text-slate-200"
                      }`}
                    >
                      Semua Tipe
                    </button>
                    <button
                      onClick={() => setBillingTypeFilter("biasa")}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        billingTypeFilter === "biasa"
                          ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-xs"
                          : "text-slate-500 dark:text-slate-400 hover:text-slate-750 dark:hover:text-slate-200"
                      }`}
                    >
                      📱 Tagihan Rutin
                    </button>
                    <button
                      onClick={() => setBillingTypeFilter("hutang")}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        billingTypeFilter === "hutang"
                          ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-xs"
                          : "text-slate-500 dark:text-slate-400 hover:text-slate-750 dark:hover:text-slate-200"
                      }`}
                    >
                      💸 Saya Berhutang
                    </button>
                    <button
                      onClick={() => setBillingTypeFilter("piutang")}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        billingTypeFilter === "piutang"
                          ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-xs"
                          : "text-slate-500 dark:text-slate-400 hover:text-slate-750 dark:hover:text-slate-200"
                      }`}
                    >
                      💰 Piutang
                    </button>
                  </div>
                </div>
              </div>

              {/* LIST TAGIHAN MENDATANG */}
              <div className="space-y-4">
                {billings
                  .filter((item) => {
                    const matchesStatus =
                      billingFilter === "semua"
                        ? true
                        : billingFilter === "progress"
                        ? item.status === "belum_bayar"
                        : item.status === "lunas";

                    const matchesType =
                      billingTypeFilter === "semua"
                        ? true
                        : item.billing_type === billingTypeFilter || (billingTypeFilter === "biasa" && (!item.billing_type || item.billing_type === "biasa"));

                    return matchesStatus && matchesType;
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

                    // Hitung badge tipe tagihan
                    let typeText = "📱 Tagihan Rutin";
                    let typeBadge = "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/50";
                    let leftLineColor = indicator.accentClass;

                    if (item.status === "lunas") {
                      leftLineColor = "bg-emerald-500";
                    } else if (item.billing_type === "piutang") {
                      typeText = `💰 Piutang: ${item.person_name}`;
                      typeBadge = "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50";
                      leftLineColor = "bg-indigo-500";
                    } else if (item.billing_type === "hutang") {
                      typeText = `💸 Hutang ke: ${item.person_name}`;
                      typeBadge = "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/50";
                      leftLineColor = "bg-rose-500";
                    }

                    return (
                      <div
                        key={item.id}
                        className={`p-5 bg-white dark:bg-slate-900 rounded-2xl border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md hover:border-slate-200 dark:hover:border-slate-700 transition-all ${
                          item.status !== "lunas" && item.billing_type === "hutang"
                            ? "border-rose-100 dark:border-rose-950/30"
                            : "border-slate-100 dark:border-slate-800"
                        }`}
                      >
                        {/* Info Tagihan */}
                        <div className="flex items-start gap-4">
                          {/* Status Accent Line */}
                          <div className={`w-1.5 h-12 rounded-full shrink-0 ${leftLineColor}`} />
                          
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-bold text-slate-800 dark:text-white text-sm leading-snug">{item.bill_name}</h3>
                              <span className={`px-2.5 py-0.5 rounded-full border text-[9px] font-bold ${indicator.colorClass}`}>
                                {indicator.label}
                              </span>
                              <span className={`px-2.5 py-0.5 rounded-full border text-[9px] font-bold ${typeBadge}`}>
                                {typeText}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-1">
                              📅 Jatuh Tempo: {formattedDate}
                            </p>
                          </div>
                        </div>

                        {/* Nominal & Aksi Cepat */}
                        <div className="flex items-center justify-between sm:justify-end gap-5 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-50 dark:border-slate-800">
                          <span className={`font-bold text-slate-800 dark:text-white text-sm transition-all duration-300 ${isPrivateMode ? "blur-sm select-none" : ""}`}>
                            {formatRupiah(item.amount)}
                          </span>

                          <div className="flex items-center gap-2">
                            {/* Tombol Aksi Cepat "Tandai Lunas" */}
                            {item.status !== "lunas" && (
                              <button
                                onClick={() => handleMarkAsPaid(item)}
                                className={`px-4 py-2 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer ${
                                  item.billing_type === "piutang"
                                    ? "bg-indigo-600 hover:bg-indigo-700"
                                    : "bg-emerald-500 hover:bg-emerald-600"
                                }`}
                              >
                                {item.billing_type === "piutang" ? "✓ Terima Pembayaran" : "✓ Bayar Lunas"}
                              </button>
                            )}

                            {/* Tombol Hapus */}
                            <button
                              onClick={() => handleDeleteBill(item.id)}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition-all cursor-pointer"
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
                  const matchesStatus =
                    billingFilter === "semua"
                      ? true
                      : billingFilter === "progress"
                      ? item.status === "belum_bayar"
                      : item.status === "lunas";

                  const matchesType =
                    billingTypeFilter === "semua"
                      ? true
                      : item.billing_type === billingTypeFilter || (billingTypeFilter === "biasa" && (!item.billing_type || item.billing_type === "biasa"));

                  return matchesStatus && matchesType;
                }).length === 0 && (
                  <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center gap-4 transition-colors duration-300">
                    <span className="text-4xl">📅</span>
                    <div>
                      <h3 className="font-bold text-slate-800 dark:text-white text-sm">Tidak Ada Tagihan Rutin / Hutang-Piutang</h3>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                        {billingFilter === "semua" && billingTypeFilter === "semua"
                          ? 'Klik "+ Tambah Tagihan" untuk membuat catatan baru.'
                          : `Tidak ada catatan dengan filter aktif saat ini.`}
                      </p>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 5: PENGATURAN APLIKASI */}
          {activeTab === "settings" && (
            <div className="max-w-2xl mx-auto space-y-6">
              
              {/* CARD: PREFERENSI TAMPILAN */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs space-y-5 transition-colors duration-300">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xl">🎨</span>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-white text-sm">Tampilan & Tema</h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Sesuaikan bagaimana DompetKu terlihat pada perangkat Anda.</p>
                  </div>
                </div>

                {/* Switcher Mode Gelap / Terang */}
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-xs">Mode Gelap</h4>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">Ubah skema warna aplikasi menjadi gelap atau terang.</p>
                  </div>
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="flex items-center justify-between gap-2.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition-all cursor-pointer border border-slate-200 dark:border-slate-700 active:scale-[0.98]"
                  >
                    {theme === "light" ? (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5 text-amber-500">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m0 13.5V21M4.95 4.95l1.59 1.59m10.91 10.91 1.59 1.59M3 12h2.25m13.5 0H21M4.95 19.05l1.59-1.59m10.91-10.91 1.59-1.59M12 7.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Z" />
                        </svg>
                        <span>Terang</span>
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5 text-amber-400">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
                        </svg>
                        <span>Gelap</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="h-px bg-slate-100 dark:bg-slate-800" />

                {/* Switcher Mode Privasi */}
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-xs">Mode Privasi (Samaran)</h4>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">Sembunyikan nominal uang pada dashboard untuk menjaga privasi Anda.</p>
                  </div>
                  <button
                    type="button"
                    onClick={togglePrivacyMode}
                    className={`w-11 h-6 rounded-full p-1 transition-colors duration-300 flex items-center cursor-pointer ${isPrivateMode ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-700"}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 transform ${isPrivateMode ? "translate-x-5" : "translate-x-0"}`} />
                  </button>
                </div>
              </div>

              {/* CARD: KELOLA KEUANGAN */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs space-y-5 transition-colors duration-300">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xl">⚙️</span>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-white text-sm">Pengaturan Finansial</h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Pengaturan kustom untuk mempermudah manajemen pengeluaran Anda.</p>
                  </div>
                </div>

                {/* Batas Anggaran Bulanan */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-xs">Batas Anggaran Bulanan</h4>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">Tentukan batas pengeluaran bulanan. Peringatan akan muncul jika melampaui batas.</p>
                    </div>
                  </div>
                  <div className="relative max-w-xs">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-xs">Rp</span>
                    <input
                      type="text"
                      placeholder="Tanpa Batas"
                      value={monthlyBudgetLimit ? new Intl.NumberFormat("id-ID").format(monthlyBudgetLimit) : ""}
                      onChange={(e) => {
                        const cleanNumber = e.target.value.replace(/\D/g, "");
                        if (!cleanNumber) {
                          setMonthlyBudgetLimit("");
                          localStorage.removeItem("dompetku_budget_limit");
                          return;
                        }
                        setMonthlyBudgetLimit(cleanNumber);
                        localStorage.setItem("dompetku_budget_limit", cleanNumber);
                      }}
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 transition-all text-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div className="h-px bg-slate-100 dark:bg-slate-800" />

                {/* Kategori Default */}
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-xs">Kategori Catatan Default</h4>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">Pilih kategori default yang langsung terpilih saat menambah catatan baru.</p>
                  </div>
                  <div className="max-w-xs">
                    <select
                      value={defaultCategory}
                      onChange={(e) => {
                        setDefaultCategory(e.target.value);
                        localStorage.setItem("dompetku_default_category", e.target.value);
                        setFormData((prev) => ({
                          ...prev,
                          category: e.target.value,
                        }));
                      }}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 transition-all text-slate-800 dark:text-white cursor-pointer"
                    >
                      {availableCategories.map((cat) => (
                        <option key={cat.name} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* CARD: DANGER ZONE */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-red-100 dark:border-red-950/30 shadow-xs space-y-5 transition-colors duration-300">
                <div className="flex items-center gap-3 pb-3 border-b border-red-100 dark:border-red-950/30">
                  <span className="text-xl">⚠️</span>
                  <div>
                    <h3 className="font-bold text-red-600 dark:text-red-400 text-sm">Zona Bahaya</h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Hati-hati, tindakan di bawah ini dapat menghapus data Anda secara permanen.</p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-xs">Reset Semua Data Lokal</h4>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">Menghapus target tabungan, pengingat tagihan, dan preferensi aplikasi dari browser.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetAllData}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                  >
                    Reset Data
                  </button>
                </div>

                <div className="h-px bg-red-100 dark:bg-red-950/20" />

                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-xs">Keluar Sesi Akun</h4>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">Akhiri sesi aktif Anda dan kembali ke halaman login.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="px-4 py-2 bg-slate-800 dark:bg-slate-700 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-xs active:scale-[0.98] border border-slate-700"
                  >
                    Keluar Sesi
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: KALKULATOR FINANSIAL */}
          {activeTab === "financial-calculator" && (
            <div className="max-w-4xl mx-auto space-y-6">
              {/* TAB MENU */}
              <div className="flex bg-slate-105 dark:bg-slate-900 p-1 rounded-2xl w-full sm:max-w-md mx-auto border border-slate-200/50 dark:border-slate-800 transition-colors duration-300">
                <button
                  type="button"
                  onClick={() => setActiveCalcTab("emergency")}
                  className={`flex-1 py-3 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    activeCalcTab === "emergency"
                      ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  <span>🚨</span>
                  <span>Dana Darurat</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCalcTab("savings")}
                  className={`flex-1 py-3 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    activeCalcTab === "savings"
                      ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  <span>🎯</span>
                  <span>Simulasi Menabung</span>
                </button>
              </div>

              {/* VIEW */}
              <AnimatePresence mode="wait">
                {activeCalcTab === "emergency" ? (
                  <motion.div
                    key="emergency-calc"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xs space-y-6 transition-colors duration-300"
                  >
                    <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-2xl">🚨</span>
                      <div>
                        <h3 className="font-bold text-slate-800 dark:text-white text-sm sm:text-md">Kalkulator Dana Darurat</h3>
                        <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Hitung bantalan dana ideal untuk mengamankan kondisi finansial keluarga Anda.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                      {/* FORM INPUTS */}
                      <div className="space-y-4 flex flex-col justify-center">
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
                            Pengeluaran Bulanan Saat Ini (Rupiah)
                          </label>
                          <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-405 font-semibold text-sm">Rp</span>
                            <input
                              type="text"
                              placeholder="Contoh: 5.000.000"
                              value={calcMonthlyExpense}
                              onChange={(e) => {
                                const cleanNumber = e.target.value.replace(/\D/g, "");
                                if (!cleanNumber) {
                                  setCalcMonthlyExpense("");
                                  return;
                                }
                                setCalcMonthlyExpense(new Intl.NumberFormat("id-ID").format(Number(cleanNumber)));
                              }}
                              className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 text-sm text-slate-900 dark:text-white font-semibold transition-all font-sans"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
                            Status Pernikahan & Tanggungan
                          </label>
                          <select
                            value={calcFamilyStatus}
                            onChange={(e) => setCalcFamilyStatus(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 text-xs sm:text-sm text-slate-800 dark:text-white font-medium transition-all cursor-pointer"
                          >
                            <option value="lajang">Lajang / Mandiri (+0 Bulan)</option>
                            <option value="menikah_tanpa_anak">Menikah / Ada Tanggungan Keluarga (+3 Bulan)</option>
                            <option value="menikah_dengan_anak">Menikah dengan Anak (+6 Bulan)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
                            Stabilitas Pendapatan Utama
                          </label>
                          <select
                            value={calcIncomeStability}
                            onChange={(e) => setCalcIncomeStability(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 text-xs sm:text-sm text-slate-800 dark:text-white font-medium transition-all cursor-pointer"
                          >
                            <option value="stabil">Karyawan Tetap (Sangat Stabil) (Base: 3 Bulan)</option>
                            <option value="freelance">Freelance / Kontrak (Kurang Stabil) (Base: 6 Bulan)</option>
                            <option value="bisnis">Pengusaha / Pemilik Bisnis (Fluktuatif) (Base: 9 Bulan)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
                            Faktor Risiko Tambahan
                          </label>
                          <div className="space-y-2 mt-1 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800">
                            <label className="flex items-center gap-2.5 text-xs text-slate-650 dark:text-slate-355 font-medium cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={calcHasDebt}
                                onChange={(e) => setCalcHasDebt(e.target.checked)}
                                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700"
                              />
                              <span>Memiliki Cicilan KPR / Kredit Aktif (+2 Bulan)</span>
                            </label>
                            <label className="flex items-center gap-2.5 text-xs text-slate-650 dark:text-slate-355 font-medium cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={calcHasMedicalRisk}
                                onChange={(e) => setCalcHasMedicalRisk(e.target.checked)}
                                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700"
                              />
                              <span>Riwayat Medis Kronis / Rentan Sakit (+2 Bulan)</span>
                            </label>
                            <label className="flex items-center gap-2.5 text-xs text-slate-650 dark:text-slate-355 font-medium cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={calcNoInsurance}
                                onChange={(e) => setCalcNoInsurance(e.target.checked)}
                                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700"
                              />
                              <span>Tidak Memiliki Asuransi Kesehatan (+2 Bulan)</span>
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* RESULTS */}
                      {(() => {
                        const cleanExpense = Number(calcMonthlyExpense.replace(/\D/g, "")) || 0;
                        
                        let baseMultiplier = 3;
                        let stabilityLabel = "Karyawan Tetap";
                        if (calcIncomeStability === "freelance") {
                          baseMultiplier = 6;
                          stabilityLabel = "Freelance/Kontrak";
                        } else if (calcIncomeStability === "bisnis") {
                          baseMultiplier = 9;
                          stabilityLabel = "Pengusaha/Bisnis";
                        }

                        let statusMultiplier = 0;
                        let statusLabel = "Lajang";
                        if (calcFamilyStatus === "menikah_tanpa_anak") {
                          statusMultiplier = 3;
                          statusLabel = "Menikah / Tanggungan";
                        } else if (calcFamilyStatus === "menikah_dengan_anak") {
                          statusMultiplier = 6;
                          statusLabel = "Menikah dengan Anak";
                        }

                        let riskMultiplier = 0;
                        if (calcHasDebt) riskMultiplier += 2;
                        if (calcHasMedicalRisk) riskMultiplier += 2;
                        if (calcNoInsurance) riskMultiplier += 2;

                        const emergencyMultiplier = baseMultiplier + statusMultiplier + riskMultiplier;
                        const idealEmergencyFund = cleanExpense * emergencyMultiplier;

                        let recText = "Kombinasi pendapatan yang stabil dan status lajang menuntut bantalan dana darurat dasar. Namun, disarankan menambahkan porsi cadangan jika terdapat risiko tambahan.";
                        if (emergencyMultiplier >= 12) {
                          recText = "Faktor risiko kumulatif Anda cukup tinggi (pendapatan fluktuatif, keluarga, cicilan, kesehatan). Sangat penting mengamankan dana darurat minimal setara 12 bulan pengeluaran atau lebih.";
                        } else if (emergencyMultiplier >= 8) {
                          recText = "Keluarga atau fleksibilitas pendapatan menengah membutuhkan dana darurat terencana. Tetapkan sasaran tabungan bertahap untuk mencapai bantalan ideal Anda.";
                        }

                        return (
                          <div className="bg-slate-50 dark:bg-slate-800/40 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col justify-between space-y-5 transition-colors duration-300">
                            <div className="space-y-3">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Breakdown Multiplier</span>
                              <div className="space-y-1.5 text-[11px] text-slate-650 dark:text-slate-350">
                                <div className="flex justify-between">
                                  <span>Pekerjaan ({stabilityLabel}):</span>
                                  <span className="font-bold text-slate-800 dark:text-slate-200">+{baseMultiplier} Bulan</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Tanggungan Status ({statusLabel}):</span>
                                  <span className="font-bold text-slate-800 dark:text-slate-200">+{statusMultiplier} Bulan</span>
                                </div>
                                {riskMultiplier > 0 && (
                                  <div className="flex justify-between text-rose-500 font-bold">
                                    <span>Faktor Risiko Tambahan:</span>
                                    <span>+{riskMultiplier} Bulan</span>
                                  </div>
                                )}
                                <div className="border-t border-slate-200 dark:border-slate-700 pt-1.5 flex justify-between font-extrabold text-slate-900 dark:text-white">
                                  <span>Total Faktor Pengali:</span>
                                  <span className="text-blue-500">{emergencyMultiplier}x Pengeluaran</span>
                                </div>
                              </div>
                            </div>

                            <div className="py-2 border-t border-b border-slate-150/40 dark:border-slate-800">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Dana Darurat Ideal</span>
                              <h4 className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 tracking-tight">
                                {formatRupiah(idealEmergencyFund)}
                              </h4>
                            </div>

                            <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100/50 dark:border-blue-900/30 rounded-xl">
                              <p className="text-[11px] text-slate-500 dark:text-slate-405 font-medium leading-relaxed">
                                💡 <strong>Rekomendasi:</strong> {recText}
                              </p>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="savings-calc"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xs space-y-6 transition-colors duration-300"
                  >
                    <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-2xl">🎯</span>
                      <div>
                        <h3 className="font-bold text-slate-800 dark:text-white text-sm sm:text-md">Simulasi Target Menabung</h3>
                        <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Ketahui secara akurat waktu yang Anda butuhkan untuk mencapai resolusi impian Anda.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                      {/* FORM INPUTS */}
                      <div className="space-y-4 flex flex-col justify-center">
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
                            Nominal Target Impian (Rupiah)
                          </label>
                          <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-405 font-semibold text-sm">Rp</span>
                            <input
                              type="text"
                              placeholder="Contoh: 15.000.000 (Beli Laptop)"
                              value={calcSavingsTarget}
                              onChange={(e) => {
                                const cleanNumber = e.target.value.replace(/\D/g, "");
                                if (!cleanNumber) {
                                  setCalcSavingsTarget("");
                                  return;
                                }
                                setCalcSavingsTarget(new Intl.NumberFormat("id-ID").format(Number(cleanNumber)));
                              }}
                              className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 text-sm text-slate-900 dark:text-white font-semibold transition-all font-sans"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
                            Kemampuan Menabung per Bulan (Rupiah)
                          </label>
                          <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-405 font-semibold text-sm">Rp</span>
                            <input
                              type="text"
                              placeholder="Contoh: 1.500.000"
                              value={calcMonthlySavings}
                              onChange={(e) => {
                                const cleanNumber = e.target.value.replace(/\D/g, "");
                                if (!cleanNumber) {
                                  setCalcMonthlySavings("");
                                  return;
                                }
                                setCalcMonthlySavings(new Intl.NumberFormat("id-ID").format(Number(cleanNumber)));
                              }}
                              className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 text-sm text-slate-900 dark:text-white font-semibold transition-all font-sans"
                            />
                          </div>
                        </div>
                      </div>

                      {/* RESULTS */}
                      {(() => {
                        const cleanTarget = Number(calcSavingsTarget.replace(/\D/g, "")) || 0;
                        const cleanMonthlySavings = Number(calcMonthlySavings.replace(/\D/g, "")) || 0;

                        let durationInMonths = 0;
                        let durationText = "";
                        let motivationText = "";

                        if (cleanTarget > 0 && cleanMonthlySavings > 0) {
                          durationInMonths = Math.ceil(cleanTarget / cleanMonthlySavings);
                          const years = Math.floor(durationInMonths / 12);
                          const months = durationInMonths % 12;

                          if (years > 0) {
                            durationText = `${years} Tahun ${months > 0 ? `${months} Bulan` : ""}`;
                          } else {
                            durationText = `${months} Bulan`;
                          }

                          motivationText = `Wah, jika kamu konsisten menabung ${formatRupiah(cleanMonthlySavings)} per bulan, target ${formatRupiah(cleanTarget)} kamu akan tercapai dalam ${durationText} lagi! Tetap semangat, konsistensi adalah kunci! 💪🚀`;
                        }

                        return (
                          <div className="bg-slate-50 dark:bg-slate-800/40 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col justify-center min-h-[200px] space-y-5 transition-colors duration-300">
                            {cleanTarget > 0 && cleanMonthlySavings > 0 ? (
                              <div className="space-y-4">
                                <div>
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Durasi Pencapaian</span>
                                  <div className="flex flex-wrap items-baseline gap-1.5">
                                    <span className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 tracking-tight">{durationText}</span>
                                    <span className="text-xs text-slate-400 dark:text-slate-500 font-bold">({durationInMonths} Bulan)</span>
                                  </div>
                                </div>

                                <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100/50 dark:border-emerald-900/30 rounded-xl">
                                  <p className="text-[11px] text-emerald-700 dark:text-emerald-450 font-semibold leading-relaxed">
                                    🎯 {motivationText}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center text-center py-6 space-y-3">
                                  <span className="text-3xl">📊</span>
                                  <div>
                                    <h4 className="text-xs font-bold text-slate-750 dark:text-slate-350">Masukkan Data Simulasi</h4>
                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-1">
                                      Isi kolom nominal target impian dan kemampuan menabung per bulan untuk melihat proyeksi durasi secara real-time.
                                    </p>
                                  </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* TAB 7: KALENDER KEASIAN / KALENDER FINANSIAL */}
          {activeTab === "financial-calendar" && (
            <div className="max-w-4xl mx-auto space-y-6">
              
              {/* HEADER KALENDER (Bulan & Tahun Navigasi) */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors duration-300">
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <span className="text-xl shrink-0">📅</span>
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-800 dark:text-white text-sm">Visualisasi Kalender Transaksi</h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-medium leading-normal">Lihat ringkasan arus kas masuk dan keluar Anda dalam format grid kalender bulanan.</p>
                  </div>
                </div>

                <div className="flex items-center justify-center md:justify-end gap-1.5 sm:gap-2 w-full md:w-auto flex-wrap shrink-0">
                  <button
                    type="button"
                    onClick={() => setCalendarCurrentDate(new Date(calendarCurrentDate.getFullYear(), calendarCurrentDate.getMonth() - 1, 1))}
                    className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-250 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 flex items-center justify-center cursor-pointer transition-colors active:scale-95 shrink-0"
                    title="Bulan Sebelumnya"
                  >
                    ←
                  </button>
                  
                  {/* Dropdown Bulan */}
                  <select
                    value={calendarCurrentDate.getMonth()}
                    onChange={(e) => {
                      const selectedMonth = parseInt(e.target.value, 10);
                      setCalendarCurrentDate(new Date(calendarCurrentDate.getFullYear(), selectedMonth, 1));
                    }}
                    className="px-2 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-705 text-slate-800 dark:text-slate-250 text-xs font-bold rounded-lg cursor-pointer focus:outline-none focus:border-blue-500"
                  >
                    {["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"].map((m, idx) => (
                      <option key={idx} value={idx}>{m}</option>
                    ))}
                  </select>

                  {/* Dropdown Tahun */}
                  <select
                    value={calendarCurrentDate.getFullYear()}
                    onChange={(e) => {
                      const selectedYear = parseInt(e.target.value, 10);
                      setCalendarCurrentDate(new Date(selectedYear, calendarCurrentDate.getMonth(), 1));
                    }}
                    className="px-2 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-705 text-slate-800 dark:text-slate-250 text-xs font-bold rounded-lg cursor-pointer focus:outline-none focus:border-blue-500"
                  >
                    {(() => {
                      const thisYear = new Date().getFullYear();
                      const years = [];
                      for (let y = thisYear - 5; y <= thisYear + 5; y++) {
                        years.push(y);
                      }
                      return years.map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ));
                    })()}
                  </select>

                  <button
                    type="button"
                    onClick={() => setCalendarCurrentDate(new Date(calendarCurrentDate.getFullYear(), calendarCurrentDate.getMonth() + 1, 1))}
                    className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-250 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 flex items-center justify-center cursor-pointer transition-colors active:scale-95 shrink-0"
                    title="Bulan Berikutnya"
                  >
                    →
                  </button>
                </div>
              </div>

              {/* GRID KALENDER */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors duration-300">
                
                {/* Nama Hari */}
                <div className="grid grid-cols-7 gap-1 text-center border-b border-slate-200 dark:border-slate-800 pb-2 mb-2">
                  {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((dayName) => (
                    <span key={dayName} className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      {dayName}
                    </span>
                  ))}
                </div>

                {/* Grid Sel Hari */}
                <div className="grid grid-cols-7 gap-1 sm:gap-2">
                  {(() => {
                    const currentYear = calendarCurrentDate.getFullYear();
                    const currentMonth = calendarCurrentDate.getMonth();
                    
                    const firstDay = new Date(currentYear, currentMonth, 1);
                    const startOffset = (firstDay.getDay() + 6) % 7;
                    
                    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
                    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();
                    
                    const cells = [];
                    
                    for (let i = startOffset - 1; i >= 0; i--) {
                      const dayVal = daysInPrevMonth - i;
                      cells.push({
                        day: dayVal,
                        isCurrentMonth: false,
                        dateKey: `${currentMonth === 0 ? currentYear - 1 : currentYear}-${String(currentMonth === 0 ? 12 : currentMonth).padStart(2, "0")}-${String(dayVal).padStart(2, "0")}`,
                      });
                    }
                    
                    for (let i = 1; i <= daysInMonth; i++) {
                      cells.push({
                        day: i,
                        isCurrentMonth: true,
                        dateKey: `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`,
                      });
                    }
                    
                    const totalGridCells = Math.ceil(cells.length / 7) * 7;
                    const nextMonthFill = totalGridCells - cells.length;
                    for (let i = 1; i <= nextMonthFill; i++) {
                      cells.push({
                        day: i,
                        isCurrentMonth: false,
                        dateKey: `${currentMonth === 11 ? currentYear + 1 : currentYear}-${String(currentMonth === 11 ? 1 : currentMonth + 2).padStart(2, "0")}-${String(i).padStart(2, "0")}`,
                      });
                    }

                    return cells.map((cell, idx) => {
                      const dayTransactions = transactions.filter((t) => {
                        if (!t.created_at) return false;
                        const tDate = t.created_at.split("T")[0];
                        return tDate === cell.dateKey;
                      });

                      const hasIncome = dayTransactions.some((t) => t.type === "pemasukan");
                      const hasExpense = dayTransactions.some((t) => t.type === "pengeluaran");

                      let netAmount = 0;
                      dayTransactions.forEach((t) => {
                        if (t.type === "pemasukan") netAmount += Number(t.amount) || 0;
                        if (t.type === "pengeluaran") netAmount -= Number(t.amount) || 0;
                      });

                      const today = new Date();
                      const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
                      const isToday = todayKey === cell.dateKey;

                      return (
                        <div
                          key={idx}
                          onClick={() => {
                            setCalendarSelectedDate(cell.dateKey);
                            setIsCalendarModalOpen(true);
                          }}
                          className={`min-h-[60px] sm:min-h-[85px] p-1.5 sm:p-2.5 rounded-xl border flex flex-col justify-between items-start transition-all duration-300 cursor-pointer ${
                            cell.isCurrentMonth
                              ? "bg-white hover:bg-slate-50 dark:bg-slate-900/60 dark:hover:bg-slate-800 border-slate-200/80 dark:border-slate-800"
                              : "bg-slate-100/40 border-slate-200/40 dark:bg-slate-950/20 dark:border-slate-900/40 opacity-55 hover:opacity-80"
                          } ${isToday ? "ring-2 ring-blue-500 bg-blue-50/20 dark:bg-blue-950/30 border-transparent" : ""}`}
                        >
                          <div className="flex justify-between items-center w-full">
                            <span className={`text-[10px] sm:text-xs font-extrabold ${
                              isToday 
                                ? "bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center font-sans shadow-xs" 
                                : cell.isCurrentMonth
                                ? "text-slate-900 dark:text-slate-100"
                                : "text-slate-400 dark:text-slate-600"
                            }`}>
                              {cell.day}
                            </span>
                            
                            <div className="flex gap-1">
                              {hasIncome && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm" />}
                              {hasExpense && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-sm" />}
                            </div>
                          </div>

                          {netAmount !== 0 && (
                            <span className={`text-[8px] sm:text-[9px] font-black font-sans mt-auto leading-none w-full text-right truncate tracking-tight transition-all duration-300 ${
                              isPrivateMode
                                ? "blur-[3px] select-none"
                                : netAmount > 0
                                ? "text-emerald-700 dark:text-emerald-400"
                                : "text-rose-700 dark:text-rose-400"
                            }`} title={formatRupiah(netAmount)}>
                              {netAmount > 0 ? "+" : ""}{new Intl.NumberFormat("id-ID", { notation: "compact", compactDisplay: "short" }).format(netAmount)}
                            </span>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>

              </div>

              {/* TATA TERTIB LEGENDA */}
              <div className="flex items-center justify-center gap-6 py-2 flex-wrap text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Ada Pemasukan</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span>Ada Pengeluaran</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500/20 border border-blue-500" />
                  <span>Hari Ini</span>
                </div>
              </div>

            </div>
          )}

          {/* TAB 8: BAGI TAGIHAN (SPLIT BILL) */}
          {activeTab === "split-bill" && (() => {
            // Helper functions and state handlers for split bill itemized mode
            const handlePeopleChange = (newVal) => {
              const val = Math.max(1, newVal);
              setSplitBillPeople(val);
              
              setSplitBillMembers(prev => {
                if (val > prev.length) {
                  const extra = [];
                  for (let i = prev.length + 1; i <= val; i++) {
                    extra.push({
                      id: String(Date.now() + i),
                      name: `Teman ${i}`,
                      items: [{ id: String(Date.now() + i + 100), name: "Menu 1", price: "" }]
                    });
                  }
                  return [...prev, ...extra];
                } else if (val < prev.length) {
                  return prev.slice(0, val);
                }
                return prev;
              });
            };

            const addMember = () => {
              const nextNum = splitBillMembers.length + 1;
              const newMember = {
                id: String(Date.now()),
                name: `Teman ${nextNum}`,
                items: [{ id: String(Date.now() + 10), name: "Menu 1", price: "" }]
              };
              setSplitBillMembers([...splitBillMembers, newMember]);
              setSplitBillPeople(splitBillMembers.length + 1);
            };

            const removeMember = (id) => {
              if (splitBillMembers.length <= 1) return;
              const filtered = splitBillMembers.filter(m => m.id !== id);
              setSplitBillMembers(filtered);
              setSplitBillPeople(filtered.length);
            };

            const updateMemberName = (id, name) => {
              setSplitBillMembers(splitBillMembers.map(m => m.id === id ? { ...m, name } : m));
            };

            const addMemberItem = (memberId) => {
              setSplitBillMembers(splitBillMembers.map(m => {
                if (m.id === memberId) {
                  return {
                    ...m,
                    items: [...m.items, { id: String(Date.now()), name: `Menu ${m.items.length + 1}`, price: "" }]
                  };
                }
                return m;
              }));
            };

            const removeMemberItem = (memberId, itemId) => {
              setSplitBillMembers(splitBillMembers.map(m => {
                if (m.id === memberId) {
                  const filtered = m.items.filter(item => item.id !== itemId);
                  return {
                    ...m,
                    items: filtered.length > 0 ? filtered : [{ id: String(Date.now()), name: "Menu 1", price: "" }]
                  };
                }
                return m;
              }));
            };

            const updateMemberItem = (memberId, itemId, field, value) => {
              setSplitBillMembers(splitBillMembers.map(m => {
                if (m.id === memberId) {
                  return {
                    ...m,
                    items: m.items.map(item => {
                      if (item.id === itemId) {
                        if (field === "price") {
                          const clean = value.replace(/\D/g, "");
                          return { ...item, price: clean ? new Intl.NumberFormat("id-ID").format(Number(clean)) : "" };
                        }
                        return { ...item, [field]: value };
                      }
                      return item;
                    })
                  };
                }
                return m;
              }));
            };

            const taxPercent = Number(splitBillTax) || 0;
            const servicePercent = Number(splitBillService) || 0;

            let grandTotal = 0;
            let totalBase = 0;
            let perPersonSimple = 0;
            let membersBreakdown = [];

            if (splitBillMode === "simple") {
              totalBase = Number(splitBillTotal.replace(/\D/g, "")) || 0;
              const taxAmount = totalBase * (taxPercent / 100);
              const serviceAmount = totalBase * (servicePercent / 100);
              grandTotal = totalBase + taxAmount + serviceAmount;
              perPersonSimple = splitBillPeople > 0 ? Math.ceil(grandTotal / splitBillPeople) : grandTotal;
            } else {
              splitBillMembers.forEach(m => {
                let memberBase = 0;
                m.items.forEach(item => {
                  memberBase += Number(item.price.replace(/\D/g, "")) || 0;
                });
                const memberTax = memberBase * (taxPercent / 100);
                const memberService = memberBase * (servicePercent / 100);
                const memberTotal = memberBase + memberTax + memberService;
                
                totalBase += memberBase;
                grandTotal += memberTotal;

                membersBreakdown.push({
                  name: m.name,
                  base: memberBase,
                  baseFormatted: new Intl.NumberFormat("id-ID").format(memberBase),
                  total: memberTotal,
                  totalFormatted: new Intl.NumberFormat("id-ID").format(Math.ceil(memberTotal)),
                });
              });
            }

            const formatNum = (num) => new Intl.NumberFormat("id-ID").format(num);

            return (
              <div className="max-w-4xl mx-auto space-y-6">
                
                <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6 transition-colors duration-300">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200/60 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">👥</span>
                      <div>
                        <h3 className="font-bold text-slate-800 dark:text-white text-sm sm:text-md">Bagi Tagihan (Split Bill)</h3>
                        <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Bagi pengeluaran bersama teman secara cepat dan akurat.</p>
                      </div>
                    </div>

                    {/* Mode Selector */}
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/40 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={() => setSplitBillMode("simple")}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          splitBillMode === "simple"
                            ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs"
                            : "text-slate-500 hover:text-slate-850 dark:hover:text-slate-200"
                        }`}
                      >
                        ⚖️ Bagi Rata
                      </button>
                      <button
                        type="button"
                        onClick={() => setSplitBillMode("itemized")}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          splitBillMode === "itemized"
                            ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs"
                            : "text-slate-500 hover:text-slate-850 dark:hover:text-slate-200"
                        }`}
                      >
                        📝 Per Orang
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    
                    {/* FORM INPUTS */}
                    <div className="space-y-4">
                      
                      {splitBillMode === "simple" ? (
                        <>
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
                              Total Nominal Nota/Tagihan (Rupiah)
                            </label>
                            <div className="relative">
                              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-405 font-semibold text-sm">Rp</span>
                              <input
                                type="text"
                                placeholder="Contoh: 150.000"
                                value={splitBillTotal}
                                onChange={(e) => {
                                  const cleanNumber = e.target.value.replace(/\D/g, "");
                                  if (!cleanNumber) {
                                    setSplitBillTotal("");
                                    return;
                                  }
                                  setSplitBillTotal(formatNum(Number(cleanNumber)));
                                }}
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 text-sm text-slate-900 dark:text-white font-semibold transition-all font-sans"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
                              Jumlah Orang yang Ikut Patungan
                            </label>
                            <input
                              type="number"
                              min="1"
                              placeholder="Ketik jumlah orang"
                              value={splitBillPeople}
                              onChange={(e) => handlePeopleChange(parseInt(e.target.value, 10) || 1)}
                              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 text-sm text-slate-900 dark:text-white font-semibold transition-all font-sans"
                            />
                          </div>
                        </>
                      ) : (
                        // Itemized Mode
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                              Daftar Pesanan & Orang
                            </label>
                            <span className="text-[10px] text-slate-400 font-bold">Total Orang: {splitBillPeople}</span>
                          </div>

                          <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
                            {splitBillMembers.map((member, mIdx) => {
                              let mSubtotal = 0;
                              member.items.forEach(it => {
                                mSubtotal += Number(it.price.replace(/\D/g, "")) || 0;
                              });

                              return (
                                <div key={member.id} className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 relative group transition-all">
                                  <div className="flex justify-between items-center gap-3">
                                    <input
                                      type="text"
                                      value={member.name}
                                      onChange={(e) => updateMemberName(member.id, e.target.value)}
                                      placeholder={`Nama Orang ${mIdx + 1}`}
                                      className="bg-transparent border-b border-slate-200/50 dark:border-slate-700 hover:border-slate-400 focus:border-blue-500 focus:outline-none text-xs font-extrabold text-slate-800 dark:text-white px-1 py-0.5 min-w-[120px] transition-all"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => removeMember(member.id)}
                                      className="text-[10px] text-rose-500 font-bold hover:underline cursor-pointer"
                                    >
                                      Hapus Orang
                                    </button>
                                  </div>

                                  <div className="space-y-2">
                                    {member.items.map((item) => (
                                      <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                                        <div className="col-span-6">
                                          <input
                                            type="text"
                                            placeholder="Nama menu makanan"
                                            value={item.name}
                                            onChange={(e) => updateMemberItem(member.id, item.id, "name", e.target.value)}
                                            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-white font-medium focus:outline-none focus:border-blue-500 transition-colors"
                                          />
                                        </div>
                                        <div className="col-span-5 relative">
                                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-semibold">Rp</span>
                                          <input
                                            type="text"
                                            placeholder="Harga"
                                            value={item.price}
                                            onChange={(e) => updateMemberItem(member.id, item.id, "price", e.target.value)}
                                            className="w-full pl-7 pr-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-white font-semibold font-sans focus:outline-none focus:border-blue-500 transition-colors"
                                          />
                                        </div>
                                        <div className="col-span-1 text-right">
                                          <button
                                            type="button"
                                            onClick={() => removeMemberItem(member.id, item.id)}
                                            className="text-xs text-slate-405 hover:text-rose-500 transition-colors cursor-pointer"
                                            title="Hapus"
                                          >
                                            ✕
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>

                                  <div className="flex justify-between items-center pt-2 border-t border-slate-200/40 dark:border-slate-800/40 text-[10px]">
                                    <button
                                      type="button"
                                      onClick={() => addMemberItem(member.id)}
                                      className="text-blue-500 font-bold hover:underline"
                                    >
                                      + Tambah Menu
                                    </button>
                                    <div className="text-slate-500 dark:text-slate-400 font-semibold">
                                      Subtotal: <span className="font-extrabold text-slate-800 dark:text-slate-200">Rp {formatNum(mSubtotal)}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          
                          <button
                            type="button"
                            onClick={addMember}
                            className="w-full py-2.5 border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-600 rounded-2xl text-xs font-bold text-slate-500 hover:text-blue-500 transition-all cursor-pointer text-center"
                          >
                            + Tambah Orang Baru
                          </button>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
                            Pajak / Tax (%)
                          </label>
                          <input
                            type="number"
                            placeholder="Contoh: 10"
                            value={splitBillTax}
                            onChange={(e) => setSplitBillTax(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 text-sm text-slate-900 dark:text-white font-semibold transition-all font-sans"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
                            Servis / Service (%)
                          </label>
                          <input
                            type="number"
                            placeholder="Contoh: 5"
                            value={splitBillService}
                            onChange={(e) => setSplitBillService(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 text-sm text-slate-900 dark:text-white font-semibold transition-all font-sans"
                          />
                        </div>
                      </div>
                    </div>

                    {/* REAL-TIME RESULTS */}
                    <div className="bg-slate-950 text-white p-6 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-6 shadow-xl relative overflow-hidden">
                      <div className="absolute -right-16 -top-16 w-32 h-32 rounded-full bg-blue-600/10 blur-xl pointer-events-none" />

                      <div className="space-y-4">
                        <div>
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Ringkasan Tagihan</span>
                          <div className="space-y-1.5 text-xs text-slate-405">
                            <div className="flex justify-between">
                              <span>Total Harga Menu:</span>
                              <span className="font-bold text-slate-200">Rp {formatNum(totalBase)}</span>
                            </div>
                            {taxPercent > 0 && (
                              <div className="flex justify-between">
                                <span>Total Pajak ({taxPercent}%):</span>
                                <span className="font-bold text-rose-400">+ Rp {formatNum(totalBase * (taxPercent / 100))}</span>
                              </div>
                            )}
                            {servicePercent > 0 && (
                              <div className="flex justify-between">
                                <span>Total Servis ({servicePercent}%):</span>
                                <span className="font-bold text-rose-400">+ Rp {formatNum(totalBase * (servicePercent / 100))}</span>
                              </div>
                            )}
                            <div className="h-px bg-slate-800 my-2" />
                            <div className="flex justify-between text-sm font-extrabold text-white">
                              <span>Grand Total Tagihan:</span>
                              <span>Rp {formatNum(grandTotal)}</span>
                            </div>
                          </div>
                        </div>

                        {splitBillMode === "simple" ? (
                          <div className="py-2 border-t border-slate-800">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Patungan per Orang ({splitBillPeople} Orang)</span>
                            <h4 className="text-xl sm:text-2xl font-black text-blue-400 tracking-tight">
                              Rp {formatNum(perPersonSimple)}
                            </h4>
                          </div>
                        ) : (
                          // Itemized Mode Breakdown
                          <div className="py-2 border-t border-slate-800 space-y-2.5">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Rincian Patungan Per Orang</span>
                            <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1 text-xs">
                              {membersBreakdown.map((m, idx) => (
                                <div key={idx} className="flex justify-between items-center text-slate-300">
                                  <span className="font-medium">{m.name}:</span>
                                  <span className="font-extrabold text-blue-400">Rp {m.totalFormatted} <span className="text-[9px] text-slate-500 font-semibold">(Base: Rp {m.baseFormatted})</span></span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCopySplitBill(formatNum(grandTotal), formatNum(perPersonSimple), membersBreakdown)}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98 shadow-lg shadow-blue-500/15"
                      >
                        <span>💬</span>
                        <span>Salin Rincian ke WhatsApp</span>
                      </button>
                    </div>
                    
                  </div>
                </div>

              </div>
            );
          })()}

        </div>
      </main>

      {/* ==========================================
      // DIALOG DETAIL TRANSAKSI HARIAN KALENDER
      // ========================================== */}
      <AnimatePresence>
        {isCalendarModalOpen && calendarSelectedDate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCalendarModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
            />
            
            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl border border-slate-100 dark:border-slate-800 shadow-2xl p-6 relative overflow-hidden z-10 transition-colors duration-300 animate-in fade-in zoom-in duration-200"
            >
              
              {/* Header Modal */}
              <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-150/40 dark:border-slate-800/40">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    📅 Transaksi Harian
                  </h3>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">
                    {new Date(calendarSelectedDate).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCalendarModalOpen(false)}
                  className="w-7 h-7 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-full flex items-center justify-center text-xs transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* List Detail Transaksi */}
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {(() => {
                  const dayTransactions = transactions.filter((t) => {
                    if (!t.created_at) return false;
                    return t.created_at.split("T")[0] === calendarSelectedDate;
                  });

                  if (dayTransactions.length === 0) {
                    return (
                      <div className="flex flex-col items-center justify-center text-center py-10 space-y-2">
                        <span className="text-3xl">☕</span>
                        <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Tidak ada riwayat transaksi pada hari ini</p>
                      </div>
                    );
                  }

                  return dayTransactions.map((item) => (
                    <div key={item.id} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100/50 dark:border-slate-800/60 flex items-center justify-between text-xs transition-colors duration-300">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                          item.type === "pemasukan" ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-450" : "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-450"
                        }`}>
                          {item.category[0]}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-semibold text-slate-700 dark:text-slate-350 truncate">{item.category}</h4>
                          <p className="text-[9px] text-slate-400 font-medium truncate">{item.note || "-"}</p>
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
                  ));
                })()}
              </div>

              {/* Button Close */}
              <div className="pt-4 mt-5 border-t border-slate-150/40 dark:border-slate-800/40">
                <button
                  type="button"
                  onClick={() => setIsCalendarModalOpen(false)}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-655 dark:text-slate-300 rounded-xl font-bold text-xs transition-all cursor-pointer active:scale-98"
                >
                  Tutup
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
              className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl border border-slate-100 dark:border-slate-800 shadow-2xl p-6 relative overflow-hidden z-10 transition-colors duration-300"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-md font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  🗓️ Tambah Tagihan Baru
                </h3>
                <button
                  type="button"
                  onClick={() => setIsBillingModalOpen(false)}
                  className="w-7 h-7 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-full flex items-center justify-center text-xs transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={saveNewBilling} className="space-y-4">
                {/* Selektor Tipe Tagihan */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
                    Tipe Tagihan
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "biasa", label: "Tagihan Rutin", icon: "📱" },
                      { id: "hutang", label: "Saya Berhutang", icon: "💸" },
                      { id: "piutang", label: "Piutang", icon: "💰" }
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setBillingType(opt.id)}
                        className={`py-2 px-1 text-center rounded-xl border text-[11px] font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                          billingType === opt.id
                            ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/10"
                            : "bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        <span className="text-sm">{opt.icon}</span>
                        <span>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Nama Tagihan</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Langganan Spotify, Token Listrik"
                    value={billingName}
                    onChange={(e) => setBillingName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 transition-all text-slate-800 dark:text-white"
                  />
                </div>

                {billingType !== "biasa" && (
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                      Nama Orang ({billingType === "hutang" ? "Pemberi Hutang" : "Peminjam"})
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={billingType === "hutang" ? "Contoh: Budi, Bank Mandiri" : "Contoh: Boni, Siti"}
                      value={billingPerson}
                      onChange={(e) => setBillingPerson(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 transition-all text-slate-800 dark:text-white"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Nominal Tagihan (Rp)</label>
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
                      className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 transition-all text-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Tanggal Jatuh Tempo</label>
                  <input
                    type="date"
                    required
                    value={billingDate}
                    onChange={(e) => setBillingDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 transition-all text-slate-800 dark:text-white"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsBillingModalOpen(false)}
                    className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl font-semibold text-xs transition-colors cursor-pointer"
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