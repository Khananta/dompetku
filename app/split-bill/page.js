"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SplitBillRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/?tab=split-bill");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <div className="flex flex-col items-center gap-2">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium font-sans">Mengalihkan ke Bagi Tagihan...</p>
      </div>
    </div>
  );
}
