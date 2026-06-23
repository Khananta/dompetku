"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function BillingReminderRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/?tab=billing-reminder");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-2">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 text-sm font-medium font-sans">Redirecting to Dashboard...</p>
      </div>
    </div>
  );
}
