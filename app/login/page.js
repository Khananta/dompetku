"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase";
import Swal from "sweetalert2";
import { motion } from "framer-motion";
import { Icons } from "../components/Icons";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Sanitasi & Validasi Ketat Mencegah SQL Injection & Command Injection
  const validateInputs = (rawEmail, rawPassword) => {
    const cleanEmail = rawEmail.trim();

    // 1. Cek Pola Injeksi Berbahaya (SQL Injection & Command Injection)
    const dangerousPatterns = /(?:--|;|\/\*|\*\/|['"`\\$|&<>#]|\b(union|select|insert|update|delete|drop|alter|exec|truncate)\b)/i;
    if (dangerousPatterns.test(cleanEmail)) {
      throw new Error("INJECTION_DETECTED");
    }

    // 2. Cek Karakter Kontrol / Null Bytes pada Password
    // eslint-disable-next-line no-control-regex
    const controlCharsPattern = /[\x00-\x1F\x7F]/;
    if (controlCharsPattern.test(rawPassword) || controlCharsPattern.test(cleanEmail)) {
      throw new Error("CONTROL_CHARS_DETECTED");
    }

    // 3. Batas Panjang Input (Defensive Against Buffer / DOS)
    if (cleanEmail.length < 5 || cleanEmail.length > 100) {
      throw new Error("EMAIL_LENGTH_INVALID");
    }

    if (rawPassword.length < 6 || rawPassword.length > 72) {
      throw new Error("PASSWORD_LENGTH_INVALID");
    }

    // 4. Strict Standard Email Format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(cleanEmail)) {
      throw new Error("EMAIL_FORMAT_INVALID");
    }

    return cleanEmail.toLowerCase();
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const sanitizedEmail = validateInputs(email, password);

      // Supabase Auth menggunakan parameterized request ke GoTrue service
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: sanitizedEmail,
        password,
      });

      if (loginError) {
        throw new Error("KREDENSIAL_SALAH");
      }

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Berhasil masuk!",
        showConfirmButton: false,
        timer: 1200,
      });

      router.push("/");
      router.refresh();
    } catch (error) {
      let errorTitle = "Gagal Masuk";
      let errorMessage = "Terjadi kesalahan saat mencoba masuk. Silakan coba lagi.";

      if (error.message === "INJECTION_DETECTED" || error.message === "CONTROL_CHARS_DETECTED") {
        errorTitle = "Input Tidak Aman";
        errorMessage = "Karakter atau simbol khusus terlarang terdeteksi pada input form. Mohon masukkan email dan password yang valid.";
      } else if (error.message === "EMAIL_FORMAT_INVALID" || error.message === "EMAIL_LENGTH_INVALID") {
        errorTitle = "Format Email Tidak Valid";
        errorMessage = "Silakan masukkan alamat email yang benar (contoh: nama@email.com).";
      } else if (error.message === "PASSWORD_LENGTH_INVALID") {
        errorTitle = "Panjang Sandi Tidak Valid";
        errorMessage = "Kata sandi minimal 6 karakter dan maksimal 72 karakter.";
      } else if (error.message === "KREDENSIAL_SALAH") {
        errorTitle = "Login Gagal";
        errorMessage = "Email atau kata sandi tidak cocok. Mohon periksa kembali kredensial Anda.";
      }

      Swal.fire({
        title: errorTitle,
        text: errorMessage,
        icon: "error",
        confirmButtonColor: "#059669",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans antialiased text-slate-800 selection:bg-emerald-500/15 selection:text-emerald-700">
      {/* Floating Modal Card Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-4xl bg-white rounded-3xl border border-slate-200/90 shadow-[0_20px_50px_rgba(15,23,42,0.06)] overflow-hidden flex flex-col md:flex-row relative"
      >
        {/* ========================================================
        // SISI KIRI: ILUSTRASI MODERN & BRANDING
        // ======================================================== */}
        <div className="md:w-1/2 bg-gradient-to-br from-emerald-50 via-teal-50/60 to-emerald-100/40 p-8 sm:p-12 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-100 relative overflow-hidden">
          {/* Logo brand atas */}
          <div className="flex items-center gap-2.5 z-10">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shadow-xs overflow-hidden p-0.5">
              <Icons.Logo className="w-full h-full object-contain" />
            </div>
            <span className="text-base font-semibold tracking-tight text-slate-900">
              Dompet<span className="text-emerald-600">Ku</span>
            </span>
          </div>

          {/* Vektor Ilustrasi Kartun Keuangan Bersih (SVG Modern & Lucu) */}
          <div className="my-8 flex items-center justify-center z-10">
            <div className="relative w-64 h-64 flex items-center justify-center">
              {/* Decorative Circle Background Glow */}
              <div className="absolute inset-0 rounded-full bg-emerald-200/50 blur-2xl transform scale-90" />

              {/* Graphic Financial Mascot Illustration */}
              <Icons.Logo className="w-full h-full relative z-10 drop-shadow-lg" />
            </div>
          </div>

          {/* Subtext info */}
          <div className="z-10">
            <h3 className="text-sm font-semibold text-slate-800">
              Kelola Finansial Tanpa Ribet
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Catat pemasukan, kendalikan pengeluaran, dan wujudkan target tabungan impianmu setiap hari.
            </p>
          </div>
        </div>

        {/* ========================================================
        // SISI KANAN: FORM LOGIN CLEAN, LEGA & AMAN
        // ======================================================== */}
        <div className="md:w-1/2 p-8 sm:p-14 flex flex-col justify-center bg-white">
          <div className="max-w-sm mx-auto w-full">
            {/* Heading dengan jarak lega */}
            <div className="mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Masuk
              </h2>
              <p className="text-xs text-slate-500 mt-2">
                Silakan masukkan kredensial akun terdaftarmu.
              </p>
            </div>

            {/* Form Input dengan jarak yang nyaman */}
            <form onSubmit={handleLogin} className="space-y-6">
              {/* Input Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Alamat Email
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <Icons.Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    required
                    maxLength={100}
                    placeholder="nama@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50/80 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all duration-200"
                  />
                </div>
              </div>

              {/* Input Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Kata Sandi
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <Icons.Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    maxLength={72}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-11 py-3 bg-slate-50/80 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all duration-200"
                  />
                  {/* ICON MATA SAJA (TANPA TEKS LIHAT/SEMBUNYIKAN) */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
                    title={showPassword ? "Sembunyikan sandi" : "Tampilkan sandi"}
                  >
                    {showPassword ? (
                      <Icons.EyeOff className="w-4 h-4" />
                    ) : (
                      <Icons.Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button (Gradien Hijau & Rounded Full) */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-[0.98] text-white text-xs sm:text-sm font-semibold rounded-full shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>Masuk Sekarang</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
