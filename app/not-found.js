"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import DompetkuLogo from "./components/DompetkuLogo";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-800">
      <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-2xl p-8 text-center shadow-sm">
        <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <DompetkuLogo className="w-full h-full drop-shadow-md" />
        </div>
        <span className="text-xs font-semibold tracking-wider text-emerald-600 uppercase bg-emerald-50 px-2.5 py-1 rounded-full">
          Error 404
        </span>
        <h2 className="text-xl font-semibold text-slate-900 mt-3 mb-1">
          Halaman Tidak Ditemukan
        </h2>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
          Halaman yang kamu tuju tidak tersedia atau telah dipindahkan ke menu utama DompetKu.
        </p>

        <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/70 rounded-xl transition"
          >
            Kembali Sebelumnya
          </button>
          <Link
            href="/"
            className="px-4 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition"
          >
            Menuju Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
