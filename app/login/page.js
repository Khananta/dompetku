"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase";
import Swal from "sweetalert2";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  // State form input (Hanya Email & Password saja)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // State UI
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // ==========================================
  // HANDLER MASUK (LOGIN SAJA)
  // ==========================================
const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Bersihkan spasi di awal & akhir email
    const cleanEmail = email.trim().toLowerCase();

    try {
      // 1. Validasi Format Email Dasar di Frontend
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        throw new Error("EMAIL_TIDAK_VALID");
      }

      // 2. Kirim permintaan Login ke Supabase
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (loginError) {
        throw new Error("KREDENSIAL_SALAH");
      }

      // 3. LANGSUNG MASUK KE DASHBOARD (TANPA POP-UP ALERT)
      router.push("/");
      router.refresh();

    } catch (error) {
      // Penanganan error (SweetAlert Gagal) tetap dipertahankan agar tahu jika salah ketik
      let errorTitle = "Gagal!";
      let errorMessage = error.message;

      if (error.message === "EMAIL_TIDAK_VALID") {
        errorTitle = "Format Email Salah!";
        errorMessage = "Silakan masukkan alamat email yang valid (contoh: nama@email.com).";
      } else if (error.message === "KREDENSIAL_SALAH") {
        errorTitle = "Login Gagal!";
        errorMessage = "Email tidak terdaftar atau kata sandi yang kamu masukkan salah. Periksa kembali ketikanmu!";
      }

      Swal.fire({
        title: errorTitle,
        text: errorMessage,
        icon: "error",
        confirmButtonColor: "#3b82f6",
      });

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      {/* Logo Brand */}
      <div className="flex items-center gap-2 mb-8">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-200">
          D
        </div>
        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">
          Dompet<span className="text-blue-600">Ku</span>
        </h1>
      </div>

      {/* Card Form */}
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-100 shadow-xl p-8">
        <h2 className="text-2xl font-bold text-slate-800 text-center mb-1">
          Selamat Datang Kembali
        </h2>
        <p className="text-slate-400 text-sm text-center mb-6">
          Silakan masuk untuk mencatat dan memantau keuanganmu
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          
          {/* Input Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Alamat Email</label>
            <input
              type="email"
              placeholder="nama@email.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm text-slate-900 font-medium transition-all"
            />
          </div>

          {/* Input Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Kata Sandi</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm text-slate-900 font-medium transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {/* Tombol Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow-lg shadow-blue-100 transition-all flex items-center justify-center disabled:opacity-50"
          >
            {loading ? "Memproses..." : "Masuk ke Akun"}
          </button>
        </form>
      </div>
    </div>
  );
}