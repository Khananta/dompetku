"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PengeluaranRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/?tab=pengeluaran");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-2">
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 text-xs font-medium">Memuat Pengeluaran...</p>
      </div>
    </div>
  );
}
