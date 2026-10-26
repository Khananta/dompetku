export const DEFAULT_CATEGORIES = [
  { name: "Makanan", type: "pengeluaran", color: "#f43f5e" },
  { name: "Transport", type: "pengeluaran", color: "#f59e0b" },
  { name: "Tagihan", type: "pengeluaran", color: "#3b82f6" },
  { name: "Belanja", type: "pengeluaran", color: "#ec4899" },
  { name: "Hiburan", type: "pengeluaran", color: "#8b5cf6" },
  { name: "Kesehatan", type: "pengeluaran", color: "#06b6d4" },
  { name: "Pendidikan", type: "pengeluaran", color: "#6366f1" },
  { name: "Lainnya", type: "pengeluaran", color: "#64748b" },
  { name: "Gaji", type: "pemasukan", color: "#10b981" },
  { name: "Bonus", type: "pemasukan", color: "#14b8a6" },
  { name: "Investasi", type: "pemasukan", color: "#0ea5e9" },
  { name: "Sampingan", type: "pemasukan", color: "#8b5cf6" },
  { name: "Lainnya", type: "pemasukan", color: "#10b981" },
];

export const PAYMENT_METHODS = [
  { id: "cash", label: "Tunai (Cash)", short: "Cash", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { id: "qris", label: "QRIS", short: "QRIS", bg: "bg-blue-50 text-blue-700 border-blue-200" },
  { id: "bank", label: "Transfer Bank", short: "Bank", bg: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  { id: "card", label: "Debit / Kartu", short: "Kartu", bg: "bg-violet-50 text-violet-700 border-violet-200" },
];

export const getPaymentMethodInfo = (methodId) => {
  const found = PAYMENT_METHODS.find((p) => p.id === methodId);
  if (found) return found;
  return { id: "cash", label: "Tunai (Cash)", short: "Cash", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" };
};

export const formatRupiah = (num, isPrivate = false) => {
  if (isPrivate) return "Rp ••••••";
  const val = Number(num) || 0;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val);
};

export const formatNumberOnly = (num) => {
  const val = Number(num) || 0;
  return new Intl.NumberFormat("id-ID").format(val);
};

export const parseCleanNumber = (val) => {
  if (!val) return 0;
  const cleaned = String(val).replace(/\D/g, "");
  return Math.round(Number(cleaned)) || 0;
};

// Export to CSV Function
export const exportToCSV = (data, filename = "Laporan_Keuangan_DompetKu.csv") => {
  const headers = ["No", "Tanggal", "Jam", "Tipe", "Kategori", "Metode Pembayaran", "Keterangan", "Nominal (Rp)"];
  
  const csvRows = [
    headers.join(","),
    ...data.map((tx, idx) => {
      const d = new Date(tx.created_at);
      const dateStr = d.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" });
      const timeStr = d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
      const cleanNote = (tx.note || "-").replace(/"/g, '""');
      const methodLabel = getPaymentMethodInfo(tx.payment_method).label;
      
      return [
        idx + 1,
        `"${dateStr}"`,
        `"${timeStr}"`,
        `"${tx.type}"`,
        `"${tx.category}"`,
        `"${methodLabel}"`,
        `"${cleanNote}"`,
        Math.round(Number(tx.amount)),
      ].join(",");
    }),
  ];

  const blob = new Blob(["\uFEFF" + csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
