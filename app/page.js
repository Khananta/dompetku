"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase";
import Swal from "sweetalert2";

// Komponen Modular Bersih
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import DashboardView from "./components/DashboardView";
import TransactionsView from "./components/TransactionsView";
import SavingGoalsView from "./components/SavingGoalsView";
import BillingsView from "./components/BillingsView";
import InvestasiView from "./components/InvestasiView";
import CalculatorView from "./components/CalculatorView";
import CalendarView from "./components/CalendarView";
import SplitBillView from "./components/SplitBillView";
import SettingsView from "./components/SettingsView";

// Modals
import TransactionModal from "./components/TransactionModal";
import BulkTransactionModal from "./components/BulkTransactionModal";
import SavingGoalModal from "./components/SavingGoalModal";
import AddSavingsModal from "./components/AddSavingsModal";
import BillingModal from "./components/BillingModal";
import CalendarDayModal from "./components/CalendarDayModal";

import { DEFAULT_CATEGORIES, formatRupiah } from "./components/utils";

export default function Home() {
  const router = useRouter();
  const supabase = createClient();

  // State User & Loading
  const [user, setUser] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);

  // State Data Keuangan & Kategori
  const [transactions, setTransactions] = useState([]);
  const [customCategories, setCustomCategories] = useState([]);
  const [isEditingId, setIsEditingId] = useState(null);

  // State Layout & UI
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPrivateMode, setIsPrivateMode] = useState(false);

  // State Target Tabungan
  const [goals, setGoals] = useState([]);
  const [editingGoal, setEditingGoal] = useState(null);
  const [isSavingGoalModalOpen, setIsSavingGoalModalOpen] = useState(false);
  const [selectedGoalForSavings, setSelectedGoalForSavings] = useState(null);
  const [isAddSavingsModalOpen, setIsAddSavingsModalOpen] = useState(false);

  // State Tagihan & Hutang
  const [billings, setBillings] = useState([]);
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);

  // State Batas Anggaran & Kategori Default
  const [monthlyBudgetLimit, setMonthlyBudgetLimit] = useState("");
  const [defaultCategory, setDefaultCategory] = useState("Makanan");

  // State Modal Transaksi
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: "pengeluaran",
    amount: "",
    category: "Makanan",
    note: "",
    payment_method: "cash",
    date: "",
    time: "",
  });

  // State Catat Massal
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkRows, setBulkRows] = useState([]);

  // State Modal Detail Kalender
  const [calendarSelectedDay, setCalendarSelectedDay] = useState(null);
  const [isCalendarDayModalOpen, setIsCalendarDayModalOpen] = useState(false);

  // ==========================================
  // 1. SET INITIAL DATE & TIME HELPER
  // ==========================================
  const setTodayDateTime = () => {
    if (isEditingId) return;
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    const localISOTime = new Date(now.getTime() - offset).toISOString();
    setFormData((prev) => ({
      ...prev,
      date: localISOTime.split("T")[0],
      time: now.toTimeString().split(" ")[0].substring(0, 5),
    }));
  };

  // Sinkronisasi tab dari URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (
        [
          "dashboard",
          "pengeluaran",
          "riwayat",
          "saving-goals",
          "billing-reminder",
          "investasi",
          "financial-calendar",
          "financial-calculator",
          "split-bill",
          "settings",
        ].includes(tab)
      ) {
        setActiveTab(tab === "riwayat" ? "pengeluaran" : tab);
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

  // Sinkronisasi Mode Privasi
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedPrivacy = localStorage.getItem("dompetku_privacy_mode");
      if (savedPrivacy) {
        try {
          setIsPrivateMode(JSON.parse(savedPrivacy));
        } catch (e) {}
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
  // 2. CEK USER LOGIN & INITIAL LOAD
  // ==========================================
  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        router.push("/login");
      } else {
        setUser(user);
        await fetchTransactions(user.id);

        try {
          const savedCustomCats = localStorage.getItem("dompetku_custom_categories");
          if (savedCustomCats) setCustomCategories(JSON.parse(savedCustomCats));

          const savedGoals = localStorage.getItem("dompetku_saving_goals");
          if (savedGoals) setGoals(JSON.parse(savedGoals));

          const savedBills = localStorage.getItem("dompetku_billings");
          if (savedBills) setBillings(JSON.parse(savedBills));

          const savedBudget = localStorage.getItem("dompetku_budget_limit");
          if (savedBudget) setMonthlyBudgetLimit(savedBudget);

          const savedDefaultCat = localStorage.getItem("dompetku_default_category");
          if (savedDefaultCat) {
            setDefaultCategory(savedDefaultCat);
            setFormData((prev) => ({ ...prev, category: savedDefaultCat }));
          }
        } catch (e) {
          console.error("Gagal membaca local storage:", e);
        }

        const now = new Date();
        const offset = now.getTimezoneOffset() * 60000;
        setFormData((prev) => ({
          ...prev,
          date: new Date(now.getTime() - offset).toISOString().split("T")[0],
          time: now.toTimeString().split(" ")[0].substring(0, 5),
        }));

        const hasWelcomed = sessionStorage.getItem("welcomed_dompetku");
        if (!hasWelcomed) {
          const displayName = user.user_metadata?.username || user.email.split("@")[0];
          Swal.fire({
            title: `Halo, ${displayName}!`,
            text: "Selamat datang kembali di DompetKu.",
            icon: "success",
            timer: 1800,
            showConfirmButton: false,
            toast: true,
            position: "top-end",
          });
          sessionStorage.setItem("welcomed_dompetku", "true");
        }
      }
      setPageLoading(false);
    };

    checkUser();
  }, [router]);

  // ==========================================
  // 3. INACTIVITY TIMEOUT 15 MENIT
  // ==========================================
  useEffect(() => {
    const TIMEOUT_INAKTIF = 15 * 60 * 1000;
    let timerMundur;

    const resetTimer = () => {
      if (timerMundur) clearTimeout(timerMundur);
      timerMundur = setTimeout(async () => {
        if (user) {
          await supabase.auth.signOut();
          sessionStorage.removeItem("welcomed_dompetku");
          Swal.fire({
            title: "Sesi Berakhir",
            text: "Kamu otomatis keluar karena tidak ada aktivitas.",
            icon: "info",
            confirmButtonColor: "#059669",
          }).then(() => {
            router.push("/login");
          });
        }
      }, TIMEOUT_INAKTIF);
    };

    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart"];
    resetTimer();
    events.forEach((e) => window.addEventListener(e, resetTimer));

    return () => {
      if (timerMundur) clearTimeout(timerMundur);
      events.forEach((e) => window.removeEventListener(e, resetTimer));
    };
  }, [user, router, supabase]);

  // Fetch Transaksi Supabase
  const fetchTransactions = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("transaksi")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      let localMethods = {};
      try {
        localMethods = JSON.parse(localStorage.getItem("dompetku_tx_payment_methods") || "{}");
      } catch (e) {}

      const merged = (data || []).map((t) => ({
        ...t,
        payment_method: t.payment_method || localMethods[t.id] || "cash",
      }));

      setTransactions(merged);
    } catch (error) {
      console.error("Gagal mengambil transaksi:", error.message);
    }
  };

  // Kategori Gabungan
  const allCategories = useMemo(() => {
    return [...DEFAULT_CATEGORIES, ...customCategories];
  }, [customCategories]);

  const availableCategories = useMemo(() => {
    return allCategories.filter((c) => c.type === formData.type);
  }, [allCategories, formData.type]);

  useEffect(() => {
    if (!isEditingId && availableCategories.length > 0) {
      const isValid = availableCategories.some((c) => c.name === formData.category);
      if (!isValid) {
        setFormData((prev) => ({ ...prev, category: availableCategories[0].name }));
      }
    }
  }, [formData.type, availableCategories, isEditingId]);

  // ==========================================
  // 4. KELOLA KATEGORI: TAMBAH, EDIT, HAPUS (DENGAN VALIDASI PINTAR)
  // ==========================================
  const handleAddCategory = (name, type) => {
    const exists = allCategories.some(
      (c) => c.type === type && c.name.toLowerCase() === name.toLowerCase()
    );

    if (exists) {
      Swal.fire("Kategori Sudah Ada", `Kategori "${name}" sudah terdaftar sebelumnya.`, "warning");
      return;
    }

    const updated = [...customCategories, { name, type }];
    setCustomCategories(updated);
    localStorage.setItem("dompetku_custom_categories", JSON.stringify(updated));

    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: `Kategori "${name}" berhasil ditambahkan!`,
      showConfirmButton: false,
      timer: 1500,
    });
  };

  const handleEditCategory = async (oldName, newName, type) => {
    // 1. Cek duplikasi nama baru
    const duplicate = allCategories.some(
      (c) => c.type === type && c.name.toLowerCase() === newName.toLowerCase() && c.name.toLowerCase() !== oldName.toLowerCase()
    );
    if (duplicate) {
      Swal.fire("Nama Sudah Digunakan", `Kategori "${newName}" sudah ada sebelumnya.`, "warning");
      return;
    }

    // 2. Update di customCategories jika itu kategori kustom
    const isCustom = customCategories.some((c) => c.name.toLowerCase() === oldName.toLowerCase() && c.type === type);
    let updatedCustom = [...customCategories];
    if (isCustom) {
      updatedCustom = customCategories.map((c) =>
        c.name.toLowerCase() === oldName.toLowerCase() && c.type === type ? { ...c, name: newName } : c
      );
    } else {
      // Jika kategori bawaan diedit, simpan sebagai pengganti di customCategories
      updatedCustom.push({ name: newName, type });
    }
    setCustomCategories(updatedCustom);
    localStorage.setItem("dompetku_custom_categories", JSON.stringify(updatedCustom));

    // 3. Update semua transaksi yang menggunakan kategori lama di database Supabase
    try {
      const { error } = await supabase
        .from("transaksi")
        .update({ category: newName })
        .eq("user_id", user.id)
        .eq("type", type)
        .eq("category", oldName);

      if (error) throw error;

      // Update state transaksi lokal
      setTransactions((prev) =>
        prev.map((t) => (t.type === type && t.category === oldName ? { ...t, category: newName } : t))
      );

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: `Kategori "${oldName}" berhasil diubah menjadi "${newName}"!`,
        showConfirmButton: false,
        timer: 1800,
      });
    } catch (err) {
      console.error("Gagal sinkronisasi kategori:", err);
      Swal.fire("Info", "Nama kategori diperbarui di sistem.", "success");
    }
  };

  const handleDeleteCategory = (name, type) => {
    const updated = customCategories.filter(
      (c) => !(c.name.toLowerCase() === name.toLowerCase() && c.type === type)
    );
    setCustomCategories(updated);
    localStorage.setItem("dompetku_custom_categories", JSON.stringify(updated));
  };

  // ==========================================
  // 5. SUBMIT TRANSAKSI (TAMBAH / UPDATE)
  // ==========================================
  const handleSubmitTransaction = async (e) => {
    e.preventDefault();

    const cleanNum = Number(String(formData.amount).replace(/\D/g, ""));
    if (isNaN(cleanNum) || cleanNum <= 0) {
      Swal.fire("Gagal", "Nominal transaksi harus angka valid!", "error");
      return;
    }

    if (submitLoading) return;
    setSubmitLoading(true);

    const timestamp = new Date(`${formData.date}T${formData.time}:00`).toISOString();
    const paymentMethodChosen = formData.payment_method || "cash";

    try {
      if (isEditingId) {
        let updatedItem = null;
        try {
          const { data, error } = await supabase
            .from("transaksi")
            .update({
              type: formData.type,
              amount: cleanNum,
              category: formData.category,
              note: formData.note || null,
              payment_method: paymentMethodChosen,
              created_at: timestamp,
            })
            .eq("id", isEditingId)
            .select();

          if (error) throw error;
          updatedItem = data[0];
        } catch (dbErr) {
          // Fallback jika kolom payment_method belum ada di tabel Supabase
          const { data, error } = await supabase
            .from("transaksi")
            .update({
              type: formData.type,
              amount: cleanNum,
              category: formData.category,
              note: formData.note || null,
              created_at: timestamp,
            })
            .eq("id", isEditingId)
            .select();

          if (error) throw error;
          updatedItem = data[0];
        }

        // Simpan ke local mapping agar metode selalu konsisten
        try {
          const stored = JSON.parse(localStorage.getItem("dompetku_tx_payment_methods") || "{}");
          stored[isEditingId] = paymentMethodChosen;
          localStorage.setItem("dompetku_tx_payment_methods", JSON.stringify(stored));
        } catch (e) {}

        const finalItem = { ...updatedItem, payment_method: paymentMethodChosen };
        setTransactions(transactions.map((t) => (t.id === isEditingId ? finalItem : t)));
        setIsEditingId(null);

        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: "Transaksi berhasil diperbarui!",
          showConfirmButton: false,
          timer: 1500,
        });
      } else {
        let insertedItem = null;
        try {
          const { data, error } = await supabase
            .from("transaksi")
            .insert([
              {
                user_id: user.id,
                type: formData.type,
                amount: cleanNum,
                category: formData.category,
                note: formData.note || null,
                payment_method: paymentMethodChosen,
                created_at: timestamp,
              },
            ])
            .select();

          if (error) throw error;
          insertedItem = data[0];
        } catch (dbErr) {
          // Fallback jika kolom payment_method belum ada di tabel Supabase
          const { data, error } = await supabase
            .from("transaksi")
            .insert([
              {
                user_id: user.id,
                type: formData.type,
                amount: cleanNum,
                category: formData.category,
                note: formData.note || null,
                created_at: timestamp,
              },
            ])
            .select();

          if (error) throw error;
          insertedItem = data[0];
        }

        // Simpan ke local mapping
        if (insertedItem?.id) {
          try {
            const stored = JSON.parse(localStorage.getItem("dompetku_tx_payment_methods") || "{}");
            stored[insertedItem.id] = paymentMethodChosen;
            localStorage.setItem("dompetku_tx_payment_methods", JSON.stringify(stored));
          } catch (e) {}
        }

        const finalItem = { ...insertedItem, payment_method: paymentMethodChosen };
        setTransactions([finalItem, ...transactions]);

        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: "Transaksi berhasil dicatat!",
          showConfirmButton: false,
          timer: 1500,
        });
      }

      setIsTransactionModalOpen(false);
      setFormData({
        type: "pengeluaran",
        amount: "",
        category: availableCategories[0]?.name || "Makanan",
        note: "",
        payment_method: "cash",
        date: "",
        time: "",
      });
      setTodayDateTime();
    } catch (err) {
      Swal.fire("Gagal Menyimpan", err.message, "error");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleAddTransactionDirect = async ({ type, amount, category, note }) => {
    try {
      const now = new Date();
      const offset = now.getTimezoneOffset() * 60000;
      const timestamp = new Date(now.getTime() - offset).toISOString();

      const { data, error } = await supabase
        .from("transaksi")
        .insert([
          {
            user_id: user.id,
            type,
            amount,
            category,
            note,
            created_at: timestamp,
          },
        ])
        .select();

      if (error) throw error;
      setTransactions([data[0], ...transactions]);

      Swal.fire({
        icon: "success",
        title: "Tercatat!",
        text: `Pengeluaran sebesar ${formatRupiah(amount)} berhasil disimpan ke transaksi utama.`,
        confirmButtonColor: "#059669",
      });
    } catch (err) {
      Swal.fire("Gagal", err.message, "error");
    }
  };

  const handleStartEdit = (tx) => {
    setIsEditingId(tx.id);
    const itemDate = new Date(tx.created_at);
    const offset = itemDate.getTimezoneOffset() * 60000;
    const localISO = new Date(itemDate.getTime() - offset).toISOString();

    setFormData({
      type: tx.type,
      amount: new Intl.NumberFormat("id-ID").format(tx.amount),
      category: tx.category,
      note: tx.note || "",
      payment_method: tx.payment_method || "cash",
      date: localISO.split("T")[0],
      time: itemDate.toTimeString().split(" ")[0].substring(0, 5),
    });

    setIsTransactionModalOpen(true);
  };

  const handleDeleteTransaction = async (id) => {
    Swal.fire({
      title: "Hapus transaksi ini?",
      text: "Data catatan keuangan ini akan dihapus permanen.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e11d48",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const { error } = await supabase.from("transaksi").delete().eq("id", id);
          if (error) throw error;
          setTransactions(transactions.filter((t) => t.id !== id));

          // Cek apakah transaksi ini tertaut ke tagihan / hutang
          let linkedBillId = null;
          try {
            const linkMap = JSON.parse(localStorage.getItem("dompetku_billing_tx_links") || "{}");
            linkedBillId = linkMap[id];
          } catch (e) {}

          const matchedBill = billings.find(
            (b) => b.transaction_id === id || (linkedBillId && b.id === linkedBillId)
          );

          if (matchedBill) {
            // Hapus juga tagihan / hutang terkait dari daftar tagihan
            const updatedBillings = billings.filter((b) => b.id !== matchedBill.id);
            setBillings(updatedBillings);
            localStorage.setItem("dompetku_billings", JSON.stringify(updatedBillings));

            try {
              const linkMap = JSON.parse(localStorage.getItem("dompetku_billing_tx_links") || "{}");
              delete linkMap[id];
              delete linkMap[`bill_${matchedBill.id}`];
              localStorage.setItem("dompetku_billing_tx_links", JSON.stringify(linkMap));
            } catch (e) {}
          }

          Swal.fire({
            toast: true,
            position: "top-end",
            icon: "success",
            title: matchedBill
              ? "Transaksi & catatan tagihan terkait dihapus!"
              : "Transaksi berhasil dihapus!",
            showConfirmButton: false,
            timer: 1500,
          });
        } catch (err) {
          Swal.fire("Gagal", err.message, "error");
        }
      }
    });
  };

  const handleDeleteMultipleTransactions = async (ids) => {
    if (!ids || ids.length === 0) return;
    Swal.fire({
      title: `Hapus ${ids.length} transaksi terpilih?`,
      text: "Semua catatan transaksi yang dipilih akan dihapus permanen.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e11d48",
      cancelButtonColor: "#64748b",
      confirmButtonText: `Ya, Hapus (${ids.length})`,
      cancelButtonText: "Batal",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const { error } = await supabase.from("transaksi").delete().in("id", ids);
          if (error) throw error;
          setTransactions(transactions.filter((t) => !ids.includes(t.id)));

          // Sinkronisasi hapus tagihan yang tertaut jika ada
          let linkMap = {};
          try {
            linkMap = JSON.parse(localStorage.getItem("dompetku_billing_tx_links") || "{}");
          } catch (e) {}

          const linkedBillIds = [];
          ids.forEach((txId) => {
            if (linkMap[txId]) linkedBillIds.push(linkMap[txId]);
          });

          billings.forEach((b) => {
            if (b.transaction_id && ids.includes(b.transaction_id)) {
              if (!linkedBillIds.includes(b.id)) linkedBillIds.push(b.id);
            }
          });

          if (linkedBillIds.length > 0) {
            const updatedBillings = billings.filter((b) => !linkedBillIds.includes(b.id));
            setBillings(updatedBillings);
            localStorage.setItem("dompetku_billings", JSON.stringify(updatedBillings));

            ids.forEach((txId) => delete linkMap[txId]);
            linkedBillIds.forEach((bId) => delete linkMap[`bill_${bId}`]);
            try {
              localStorage.setItem("dompetku_billing_tx_links", JSON.stringify(linkMap));
            } catch (e) {}
          }

          Swal.fire({
            toast: true,
            position: "top-end",
            icon: "success",
            title: `${ids.length} transaksi berhasil dihapus!`,
            showConfirmButton: false,
            timer: 1500,
          });
        } catch (err) {
          Swal.fire("Gagal", err.message, "error");
        }
      }
    });
  };

  // ==========================================
  // 6. BULK TRANSACTION HANDLER
  // ==========================================
  const openBulkModal = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    const dateStr = new Date(now.getTime() - offset).toISOString().split("T")[0];
    const timeStr = now.toTimeString().split(" ")[0].substring(0, 5);

    setBulkRows([
      {
        id: String(Date.now()),
        type: "pengeluaran",
        amount: "",
        category: availableCategories[0]?.name || "Makanan",
        payment_method: "cash",
        note: "",
        date: dateStr,
        time: timeStr,
      },
    ]);
    setIsBulkModalOpen(true);
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();

    for (let i = 0; i < bulkRows.length; i++) {
      const num = Number(String(bulkRows[i].amount).replace(/\D/g, ""));
      if (isNaN(num) || num <= 0) {
        Swal.fire("Gagal", `Baris ke-${i + 1} nominal tidak valid!`, "warning");
        return;
      }
    }

    if (submitLoading) return;
    setSubmitLoading(true);

    try {
      let inserted = null;
      try {
        const insertData = bulkRows.map((r) => ({
          user_id: user.id,
          type: r.type,
          amount: Number(String(r.amount).replace(/\D/g, "")),
          category: r.category,
          note: r.note || null,
          payment_method: r.payment_method || "cash",
          created_at: new Date(`${r.date}T${r.time || "12:00"}:00`).toISOString(),
        }));

        const { data, error } = await supabase.from("transaksi").insert(insertData).select();
        if (error) throw error;
        inserted = data;
      } catch (dbErr) {
        // Fallback jika kolom payment_method belum ada di tabel Supabase
        const insertDataFallback = bulkRows.map((r) => ({
          user_id: user.id,
          type: r.type,
          amount: Number(String(r.amount).replace(/\D/g, "")),
          category: r.category,
          note: r.note || null,
          created_at: new Date(`${r.date}T${r.time || "12:00"}:00`).toISOString(),
        }));

        const { data, error } = await supabase.from("transaksi").insert(insertDataFallback).select();
        if (error) throw error;
        inserted = data;
      }

      // Simpan mapping payment_method ke localStorage
      if (inserted && inserted.length > 0) {
        try {
          const stored = JSON.parse(localStorage.getItem("dompetku_tx_payment_methods") || "{}");
          inserted.forEach((item, idx) => {
            stored[item.id] = bulkRows[idx]?.payment_method || "cash";
          });
          localStorage.setItem("dompetku_tx_payment_methods", JSON.stringify(stored));
        } catch (e) {}
      }

      const mergedInserted = (inserted || []).map((item, idx) => ({
        ...item,
        payment_method: bulkRows[idx]?.payment_method || "cash",
      }));

      setTransactions([...mergedInserted, ...transactions]);
      setIsBulkModalOpen(false);

      Swal.fire({
        icon: "success",
        title: "Tersimpan!",
        text: `${bulkRows.length} transaksi berhasil dicatat sekaligus.`,
        confirmButtonColor: "#059669",
      });
    } catch (err) {
      Swal.fire("Gagal", err.message, "error");
    } finally {
      setSubmitLoading(false);
    }
  };

  // ==========================================
  // 7. TARGET TABUNGAN HANDLERS
  // ==========================================
  const handleSaveGoal = (goalData) => {
    if (goalData.id) {
      // Edit mode
      const updated = goals.map((g) =>
        g.id === goalData.id
          ? {
              ...g,
              goal_name: goalData.goal_name,
              target_amount: goalData.target_amount,
              target_date: goalData.target_date,
            }
          : g
      );
      setGoals(updated);
      localStorage.setItem("dompetku_saving_goals", JSON.stringify(updated));
      setIsSavingGoalModalOpen(false);
      setEditingGoal(null);

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: `Target "${goalData.goal_name}" berhasil diperbarui!`,
        showConfirmButton: false,
        timer: 1500,
      });
    } else {
      // Create mode
      const newGoal = {
        id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
        user_id: user?.id,
        ...goalData,
        current_amount: 0,
        deposits: [],
        created_at: new Date().toISOString(),
      };
      const updated = [newGoal, ...goals];
      setGoals(updated);
      localStorage.setItem("dompetku_saving_goals", JSON.stringify(updated));
      setIsSavingGoalModalOpen(false);

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: `Target "${newGoal.goal_name}" berhasil dibuat!`,
        showConfirmButton: false,
        timer: 1500,
      });
    }
  };

  const handleAddSavingsDeposit = (goal, addedAmount, note = "Setoran Tabungan", depositDate = null) => {
    const newAmt = Math.round((goal.current_amount || 0) + addedAmount);
    const isCompleted = newAmt >= goal.target_amount;

    const now = new Date();
    const dateStr = depositDate || now.toISOString().split("T")[0];
    const timeStr = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

    const newDeposit = {
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      amount: addedAmount,
      date: dateStr,
      time: timeStr,
      created_at: now.toISOString(),
      note: note || "Setoran Tabungan",
    };

    const currentDeposits = Array.isArray(goal.deposits) ? goal.deposits : [];
    const updatedDeposits = [newDeposit, ...currentDeposits];

    const updated = goals.map((g) =>
      g.id === goal.id ? { ...g, current_amount: newAmt, deposits: updatedDeposits } : g
    );
    setGoals(updated);
    localStorage.setItem("dompetku_saving_goals", JSON.stringify(updated));
    setIsAddSavingsModalOpen(false);
    setSelectedGoalForSavings(null);

    if (isCompleted) {
      Swal.fire({
        title: "Selamat! Target Tercapai",
        text: `Tabungan untuk "${goal.goal_name}" telah mencapai target ${formatRupiah(goal.target_amount)}!`,
        icon: "success",
        confirmButtonColor: "#059669",
      });
    } else {
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: `Dana ${formatRupiah(addedAmount)} disetor ke "${goal.goal_name}".`,
        showConfirmButton: false,
        timer: 1500,
      });
    }
  };

  const handleDeleteSavingsDeposit = (goalId, depositId) => {
    Swal.fire({
      title: "Hapus catatan setoran ini?",
      text: "Saldo tabungan terkumpul akan dikurangi sesuai nominal setoran ini.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e11d48",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
    }).then((res) => {
      if (res.isConfirmed) {
        const targetGoal = goals.find((g) => g.id === goalId);
        if (!targetGoal) return;
        const targetDeposit = (targetGoal.deposits || []).find((d) => d.id === depositId);
        const depositAmt = targetDeposit ? Number(targetDeposit.amount) || 0 : 0;
        const newAmt = Math.max(0, (targetGoal.current_amount || 0) - depositAmt);
        const newDeposits = (targetGoal.deposits || []).filter((d) => d.id !== depositId);

        const updated = goals.map((g) =>
          g.id === goalId ? { ...g, current_amount: newAmt, deposits: newDeposits } : g
        );
        setGoals(updated);
        localStorage.setItem("dompetku_saving_goals", JSON.stringify(updated));

        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: "Catatan setoran berhasil dihapus.",
          showConfirmButton: false,
          timer: 1500,
        });
      }
    });
  };

  const handleDeleteGoal = (id) => {
    Swal.fire({
      title: "Hapus target tabungan ini?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e11d48",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
    }).then((res) => {
      if (res.isConfirmed) {
        const updated = goals.filter((g) => g.id !== id);
        setGoals(updated);
        localStorage.setItem("dompetku_saving_goals", JSON.stringify(updated));
      }
    });
  };

  // ==========================================
  // 8. PENGINGAT TAGIHAN HANDLERS
  // ==========================================
  const handleSaveBill = (billData) => {
    const newBill = {
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      user_id: user.id,
      ...billData,
      created_at: new Date().toISOString(),
    };
    const updated = [...billings, newBill].sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
    setBillings(updated);
    localStorage.setItem("dompetku_billings", JSON.stringify(updated));
    setIsBillingModalOpen(false);

    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: `Tagihan "${newBill.bill_name}" berhasil dicatat!`,
      showConfirmButton: false,
      timer: 1500,
    });
  };

  const handleMarkBillPaid = async (bill) => {
    const isPiutang = bill.billing_type === "piutang";
    const title = isPiutang ? "Terima Pembayaran Piutang?" : "Tandai Tagihan Lunas?";
    const text = isPiutang
      ? `Tandai bahwa ${bill.person_name} telah melunasi ${formatRupiah(bill.amount)}? Otomatis akan mencatat pemasukan.`
      : `Lunasi tagihan ${bill.bill_name} sebesar ${formatRupiah(bill.amount)}? Otomatis akan mencatat pengeluaran.`;

    Swal.fire({
      title,
      text,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#059669",
      cancelButtonColor: "#64748b",
      confirmButtonText: isPiutang ? "Ya, Terima & Catat" : "Ya, Lunasi & Potong",
      cancelButtonText: "Batal",
    }).then(async (res) => {
      if (res.isConfirmed) {
        try {
          const now = new Date();
          const offset = now.getTimezoneOffset() * 60000;
          const timestamp = new Date(now.getTime() - offset).toISOString();

          const { data: insertedData, error: insertError } = await supabase
            .from("transaksi")
            .insert([
              {
                user_id: user.id,
                type: isPiutang ? "pemasukan" : "pengeluaran",
                amount: bill.amount,
                category: isPiutang ? "Piutang" : "Tagihan",
                note: isPiutang
                  ? `Pelunasan piutang: ${bill.bill_name} (${bill.person_name})`
                  : `Pembayaran tagihan: ${bill.bill_name}`,
                created_at: timestamp,
              },
            ])
            .select();

          if (insertError) throw insertError;
          const insertedTxId = insertedData?.[0]?.id;

          const updated = billings.map((b) =>
            b.id === bill.id ? { ...b, status: "lunas", transaction_id: insertedTxId } : b
          );
          setBillings(updated);
          localStorage.setItem("dompetku_billings", JSON.stringify(updated));

          // Simpan relasi sinkronisasi ID transaksi dan ID tagihan
          if (insertedTxId) {
            try {
              const linkMap = JSON.parse(localStorage.getItem("dompetku_billing_tx_links") || "{}");
              linkMap[insertedTxId] = bill.id;
              linkMap[`bill_${bill.id}`] = insertedTxId;
              localStorage.setItem("dompetku_billing_tx_links", JSON.stringify(linkMap));
            } catch (e) {}
          }

          await fetchTransactions(user.id);

          Swal.fire({
            icon: "success",
            title: "Berhasil!",
            text: "Status tagihan telah lunas dan saldo terupdate.",
            timer: 1500,
            showConfirmButton: false,
          });
        } catch (err) {
          Swal.fire("Gagal", err.message, "error");
        }
      }
    });
  };

  const handleDeleteBill = async (id) => {
    Swal.fire({
      title: "Hapus tagihan ini?",
      text: "Jika sudah lunas, catatan pengeluaran/pemasukan terkait juga akan ikut dihapus.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e11d48",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
    }).then(async (res) => {
      if (res.isConfirmed) {
        try {
          const billToDelete = billings.find((b) => b.id === id);

          // Cari linked transaction ID
          let txIdToDelete = billToDelete?.transaction_id;
          if (!txIdToDelete) {
            try {
              const linkMap = JSON.parse(localStorage.getItem("dompetku_billing_tx_links") || "{}");
              txIdToDelete = linkMap[`bill_${id}`];
            } catch (e) {}
          }

          // Fallback jika tidak ada txId tapi status sudah lunas: cari transaksi dengan keterangan dan nominal sama
          if (!txIdToDelete && billToDelete?.status === "lunas") {
            const matchedTx = transactions.find((t) => {
              const isMatchAmount = Math.round(Number(t.amount)) === Math.round(Number(billToDelete.amount));
              const isMatchNote =
                t.note &&
                (t.note.includes(billToDelete.bill_name) ||
                  (billToDelete.person_name && t.note.includes(billToDelete.person_name)));
              return isMatchAmount && isMatchNote;
            });
            if (matchedTx) txIdToDelete = matchedTx.id;
          }

          // Hapus transaksi jika ada
          if (txIdToDelete) {
            await supabase.from("transaksi").delete().eq("id", txIdToDelete);
            setTransactions((prev) => prev.filter((t) => t.id !== txIdToDelete));

            try {
              const linkMap = JSON.parse(localStorage.getItem("dompetku_billing_tx_links") || "{}");
              delete linkMap[txIdToDelete];
              delete linkMap[`bill_${id}`];
              localStorage.setItem("dompetku_billing_tx_links", JSON.stringify(linkMap));
            } catch (e) {}
          }

          const updated = billings.filter((b) => b.id !== id);
          setBillings(updated);
          localStorage.setItem("dompetku_billings", JSON.stringify(updated));

          Swal.fire({
            toast: true,
            position: "top-end",
            icon: "success",
            title: txIdToDelete
              ? "Tagihan & transaksi terkait berhasil dihapus!"
              : "Tagihan berhasil dihapus!",
            showConfirmButton: false,
            timer: 1500,
          });
        } catch (err) {
          Swal.fire("Gagal", err.message, "error");
        }
      }
    });
  };

  // ==========================================
  // 9. RESET DATA LOKAL & LOGOUT
  // ==========================================
  const handleResetAllData = () => {
    Swal.fire({
      title: "Hapus Data Lokal?",
      text: "Target tabungan, tagihan, dan batas anggaran di browser ini akan dihapus. Data transaksi di database tetap aman.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e11d48",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Ya, Bersihkan",
      cancelButtonText: "Batal",
    }).then((res) => {
      if (res.isConfirmed) {
        localStorage.removeItem("dompetku_saving_goals");
        localStorage.removeItem("dompetku_billings");
        localStorage.removeItem("dompetku_budget_limit");
        localStorage.removeItem("dompetku_default_category");
        setGoals([]);
        setBillings([]);
        setMonthlyBudgetLimit("");
        Swal.fire("Berhasil", "Data lokal telah dibersihkan.", "success");
      }
    });
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Swal.fire("Error", error.message, "error");
    } else {
      sessionStorage.removeItem("welcomed_dompetku");
      router.push("/login");
      router.refresh();
    }
  };

  // ==========================================
  // 10. EKSPOR LAPORAN PDF
  // ==========================================
  const handleExportPDF = async () => {
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF();
      const displayName = user?.user_metadata?.username || user?.email?.split("@")[0] || "Pengguna";

      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(5, 150, 105);
      doc.text("DompetKu", 14, 20);

      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.setFont("helvetica", "normal");
      doc.text("Laporan Catatan Keuangan Pribadi", 14, 25);

      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text("Pemilik Akun:", 14, 36);
      doc.setFont("helvetica", "normal");
      doc.text(displayName, 45, 36);

      doc.setFont("helvetica", "bold");
      doc.text("Tanggal Cetak:", 14, 42);
      doc.setFont("helvetica", "normal");
      doc.text(new Date().toLocaleDateString("id-ID"), 45, 42);

      doc.setDrawColor(226, 232, 240);
      doc.line(14, 48, 196, 48);

      const rows = transactions.map((t, idx) => {
        const d = new Date(t.created_at);
        return [
          idx + 1,
          d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }),
          t.type === "pemasukan" ? "Pemasukan" : "Pengeluaran",
          t.category,
          t.note || "-",
          formatRupiah(t.amount),
        ];
      });

      autoTable(doc, {
        startY: 54,
        head: [["No", "Tanggal", "Tipe", "Kategori", "Keterangan", "Nominal"]],
        body: rows,
        theme: "striped",
        headStyles: {
          fillColor: [5, 150, 105],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 9,
        },
        bodyStyles: { fontSize: 8.5 },
      });

      doc.save(`Laporan_Keuangan_DompetKu_${new Date().toISOString().split("T")[0]}.pdf`);

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Laporan PDF berhasil diunduh!",
        showConfirmButton: false,
        timer: 1500,
      });
    } catch (err) {
      Swal.fire("Gagal Ekspor PDF", err.message, "error");
    }
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-medium text-slate-500">Menyiapkan DompetKu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex text-slate-800 font-sans overflow-x-hidden w-full relative">
      {/* 1. Sidebar Navigasi */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        user={user}
        onLogout={handleLogout}
      />

      {/* 2. Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 w-full overflow-x-hidden lg:pl-64">
        {/* Top Header */}
        <Header
          activeTab={activeTab}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          isPrivateMode={isPrivateMode}
          togglePrivacyMode={togglePrivacyMode}
          onOpenAddModal={() => {
            setIsEditingId(null);
            const defPay = (typeof window !== "undefined" && localStorage.getItem("dompetku_default_payment_method")) || "cash";
            setFormData({
              type: "pengeluaran",
              amount: "",
              category: defaultCategory || availableCategories[0]?.name || "Makanan",
              note: "",
              payment_method: defPay,
              date: "",
              time: "",
            });
            setTodayDateTime();
            setIsTransactionModalOpen(true);
          }}
          onOpenBulkModal={openBulkModal}
          setIsSidebarOpen={setIsSidebarOpen}
        />

        {/* Tab Content Body with top offset for fixed navbar */}
        <div className="pt-16 flex-1 flex flex-col min-w-0">
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === "dashboard" && (
            <DashboardView
              transactions={transactions}
              monthlyBudgetLimit={monthlyBudgetLimit}
              isPrivateMode={isPrivateMode}
              onOpenAddModal={() => {
                setIsEditingId(null);
                const defPay = (typeof window !== "undefined" && localStorage.getItem("dompetku_default_payment_method")) || "cash";
                setFormData({
                  type: "pengeluaran",
                  amount: "",
                  category: defaultCategory || availableCategories[0]?.name || "Makanan",
                  note: "",
                  payment_method: defPay,
                  date: "",
                  time: "",
                });
                setTodayDateTime();
                setIsTransactionModalOpen(true);
              }}
              onOpenBulkModal={openBulkModal}
              onNavigateTab={handleTabChange}
              onEditTransaction={handleStartEdit}
              onDeleteTransaction={handleDeleteTransaction}
              goals={goals}
              billings={billings}
            />
          )}

          {(activeTab === "pengeluaran" || activeTab === "riwayat") && (
            <TransactionsView
              transactions={transactions}
              allCategories={allCategories}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              isPrivateMode={isPrivateMode}
              onOpenAddModal={() => {
                setIsEditingId(null);
                const defPay = (typeof window !== "undefined" && localStorage.getItem("dompetku_default_payment_method")) || "cash";
                setFormData({
                  type: "pengeluaran",
                  amount: "",
                  category: defaultCategory || availableCategories[0]?.name || "Makanan",
                  note: "",
                  payment_method: defPay,
                  date: "",
                  time: "",
                });
                setTodayDateTime();
                setIsTransactionModalOpen(true);
              }}
              onOpenBulkModal={openBulkModal}
              onEditTransaction={handleStartEdit}
              onDeleteTransaction={handleDeleteTransaction}
              onDeleteMultipleTransactions={handleDeleteMultipleTransactions}
              onExportPDF={handleExportPDF}
              user={user}
            />
          )}

          {activeTab === "saving-goals" && (
            <SavingGoalsView
              goals={goals}
              isPrivateMode={isPrivateMode}
              onOpenNewGoalModal={() => {
                setEditingGoal(null);
                setIsSavingGoalModalOpen(true);
              }}
              onEditGoal={(g) => {
                setEditingGoal(g);
                setIsSavingGoalModalOpen(true);
              }}
              onOpenDepositModal={(g) => {
                setSelectedGoalForSavings(g);
                setIsAddSavingsModalOpen(true);
              }}
              onDeleteGoal={handleDeleteGoal}
              onDeleteDeposit={handleDeleteSavingsDeposit}
            />
          )}

          {activeTab === "billing-reminder" && (
            <BillingsView
              billings={billings}
              isPrivateMode={isPrivateMode}
              onOpenNewBillModal={() => setIsBillingModalOpen(true)}
              onMarkAsPaid={handleMarkBillPaid}
              onDeleteBill={handleDeleteBill}
            />
          )}

          {activeTab === "investasi" && (
            <InvestasiView isPrivateMode={isPrivateMode} />
          )}

          {activeTab === "financial-calendar" && (
            <CalendarView
              transactions={transactions}
              isPrivateMode={isPrivateMode}
              onSelectDay={(day) => {
                setCalendarSelectedDay(day);
                setIsCalendarDayModalOpen(true);
              }}
              onAddTransactionAtDate={(dateStr) => {
                setFormData({
                  type: "pengeluaran",
                  amount: "",
                  category: "Makanan & Minuman",
                  note: "",
                  payment_method: "Tunai",
                  date: dateStr || new Date().toISOString().split("T")[0],
                  time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }).replace(".", ":"),
                });
                setIsEditingId(null);
                setIsCalendarDayModalOpen(false);
                setIsTransactionModalOpen(true);
              }}
            />
          )}

          {activeTab === "financial-calculator" && (
            <CalculatorView isPrivateMode={isPrivateMode} />
          )}

          {activeTab === "split-bill" && (
            <SplitBillView
              isPrivateMode={isPrivateMode}
              onAddTransactionDirect={handleAddTransactionDirect}
            />
          )}

          {activeTab === "settings" && (
            <SettingsView
              user={user}
              transactions={transactions}
              monthlyBudgetLimit={monthlyBudgetLimit}
              setMonthlyBudgetLimit={setMonthlyBudgetLimit}
              customCategories={customCategories}
              allCategories={allCategories}
              onAddCategory={handleAddCategory}
              onEditCategory={handleEditCategory}
              onDeleteCategory={handleDeleteCategory}
              onResetAllData={handleResetAllData}
              isPrivateMode={isPrivateMode}
              togglePrivacyMode={togglePrivacyMode}
              defaultCategory={defaultCategory}
              setDefaultCategory={setDefaultCategory}
              goals={goals}
              billings={billings}
            />
          )}
          </main>
        </div>
      </div>

      {/* ==========================================
      // MODALS
      // ========================================== */}
      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => {
          setIsTransactionModalOpen(false);
          setIsEditingId(null);
        }}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmitTransaction}
        isEditing={!!isEditingId}
        availableCategories={availableCategories}
        submitLoading={submitLoading}
      />

      <BulkTransactionModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        bulkRows={bulkRows}
        setBulkRows={setBulkRows}
        allCategories={allCategories}
        onSubmit={handleBulkSubmit}
        submitLoading={submitLoading}
      />

      <SavingGoalModal
        isOpen={isSavingGoalModalOpen}
        onClose={() => {
          setIsSavingGoalModalOpen(false);
          setEditingGoal(null);
        }}
        onSave={handleSaveGoal}
        initialData={editingGoal}
      />

      <AddSavingsModal
        isOpen={isAddSavingsModalOpen}
        onClose={() => {
          setIsAddSavingsModalOpen(false);
          setSelectedGoalForSavings(null);
        }}
        goal={selectedGoalForSavings}
        onSave={handleAddSavingsDeposit}
      />

      <BillingModal
        isOpen={isBillingModalOpen}
        onClose={() => setIsBillingModalOpen(false)}
        onSave={handleSaveBill}
      />

      <CalendarDayModal
        isOpen={isCalendarDayModalOpen}
        onClose={() => {
          setIsCalendarDayModalOpen(false);
          setCalendarSelectedDay(null);
        }}
        selectedDay={calendarSelectedDay}
        isPrivateMode={isPrivateMode}
        onEditTransaction={handleStartEdit}
        onDeleteTransaction={handleDeleteTransaction}
        onAddTransactionAtDate={(dateStr) => {
          setFormData({
            type: "pengeluaran",
            amount: "",
            category: "Makanan & Minuman",
            note: "",
            payment_method: "Tunai",
            date: dateStr || new Date().toISOString().split("T")[0],
            time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }).replace(".", ":"),
          });
          setIsEditingId(null);
          setIsCalendarDayModalOpen(false);
          setIsTransactionModalOpen(true);
        }}
      />
    </div>
  );
}
