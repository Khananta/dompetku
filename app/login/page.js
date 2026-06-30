"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase";
import Swal from "sweetalert2";
import { motion } from "framer-motion";

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
        confirmButtonColor: "#2563eb",
      });

    } finally {
      setLoading(false);
    }
  };



  // Variabel animasi Framer Motion
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } },
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans antialiased selection:bg-blue-600/10 selection:text-blue-600">
      
      {/* ==========================================
      // SISI KIRI: BRANDING & VISUAL DEMO (DESKTOP ONLY)
      // ========================================== */}
      <div className="hidden md:flex md:w-1/2 lg:w-[55%] bg-slate-950 relative overflow-hidden flex-col justify-between p-12 lg:p-16 text-white border-r border-slate-900">
        
        {/* Animated Background Mesh & Floating Blobs */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950 z-0"></div>
        
        <motion.div
          animate={{
            x: [0, 60, -40, 0],
            y: [0, -50, 30, 0],
            scale: [1, 1.15, 0.95, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -top-20 -left-20 w-[450px] h-[450px] rounded-full bg-blue-600/15 blur-[120px] z-0"
        />
        
        <motion.div
          animate={{
            x: [0, -40, 60, 0],
            y: [0, 60, -30, 0],
            scale: [1, 0.9, 1.1, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -bottom-20 -right-20 w-[450px] h-[450px] rounded-full bg-indigo-600/10 blur-[120px] z-0"
        />

        {/* Top Header Logo */}
        <div className="flex items-center gap-3 z-10">
          <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12V7c0-1.1-.9-2-2-2H5c-1.11 0-2 .9-2 2v10c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-3" />
              <path d="M21 12H17c-1.1 0-2-.9-2-2s.9-2 2-2h4" />
            </svg>
          </div>
          <span className="text-xl font-black tracking-tight text-white">
            Dompet<span className="text-blue-500">Ku</span>
          </span>
        </div>

        {/* Middle Interactive Mockup (Dashboard Preview) */}
        <div className="my-auto max-w-lg z-10 relative">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-2xl shadow-black/40"
          >
            {/* Mock Header */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Saldo Aktif</p>
                <h3 className="text-2xl font-black text-white mt-0.5">Rp 14.850.000</h3>
              </div>
              <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-lg flex items-center gap-1 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-50 animate-pulse"></span>
                +14.2% bulan ini
              </span>
            </div>

            {/* Mock Graph / Sparkline */}
            <div className="h-20 w-full relative mb-6">
              <svg viewBox="0 0 100 30" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity="0.4"/>
                    <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0"/>
                  </linearGradient>
                </defs>
                {/* Grid Lines */}
                <line x1="0" y1="10" x2="100" y2="10" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="2"/>
                <line x1="0" y1="20" x2="100" y2="20" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="2"/>
                {/* Area under curve */}
                <path d="M 0 25 Q 15 12, 30 18 T 60 4 T 85 10 T 100 2 L 100 30 L 0 30 Z" fill="url(#chartGradient)"/>
                {/* Line path */}
                <path d="M 0 25 Q 15 12, 30 18 T 60 4 T 85 10 T 100 2" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round"/>
                {/* Highlight Point */}
                <circle cx="60" cy="4" r="3" fill="#3b82f6" stroke="#ffffff" strokeWidth="1"/>
              </svg>
            </div>

            {/* Mock Recent Transactions */}
            <div className="space-y-3">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800/80 pb-2">Transaksi Terbaru</p>
              
              <div className="flex items-center justify-between text-xs py-0.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">G</div>
                  <div>
                    <p className="font-bold text-slate-200">Gaji Freelance</p>
                    <p className="text-[10px] text-slate-400">Sampingan • Hari ini</p>
                  </div>
                </div>
                <span className="font-extrabold text-emerald-400">+Rp 4.500.000</span>
              </div>

              <div className="flex items-center justify-between text-xs py-0.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold">M</div>
                  <div>
                    <p className="font-bold text-slate-200">Kafe & Kopi Sore</p>
                    <p className="text-[10px] text-slate-400">Makanan • Kemarin</p>
                  </div>
                </div>
                <span className="font-extrabold text-rose-400">-Rp 180.000</span>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="mt-8 text-slate-400 space-y-2 px-2"
          >
            <h4 className="text-lg font-bold text-white tracking-tight">Kelola Keuangan Praktis & Modern</h4>
            <p className="text-sm leading-relaxed text-slate-400">
              Lacak setiap rupiah pemasukan dan pengeluaran Anda. Analisis rekap bulanan secara detail untuk membantu Anda mengendalikan finansial secara penuh.
            </p>
          </motion.div>
        </div>

        {/* Footer Brand info */}
        <div className="flex items-center justify-between text-xs text-slate-500 z-10 border-t border-slate-900 pt-6">
          <span>&copy; {new Date().getFullYear()} DompetKu - Powered By Khananta</span>
          <div className="flex gap-4">
            <span className="hover:text-slate-400 cursor-pointer">Bantuan</span>
            <span className="hover:text-slate-400 cursor-pointer">Privasi</span>
          </div>
        </div>
      </div>

      {/* ==========================================
      // SISI KANAN: FORM LOGIN (MOBILE FRIENDLY)
      // ========================================== */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 md:p-12 lg:p-16 bg-white dark:bg-slate-900 transition-colors duration-300">
        
        {/* Logo Brand on Mobile (Hidden on Desktop) */}
        <div className="flex items-center gap-2.5 mb-10 md:hidden">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12V7c0-1.1-.9-2-2-2H5c-1.11 0-2 .9-2 2v10c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-3" />
              <path d="M21 12H17c-1.1 0-2-.9-2-2s.9-2 2-2h4" />
            </svg>
          </div>
          <span className="text-lg font-black tracking-tight text-slate-800 dark:text-slate-100">
            Dompet<span className="text-blue-600">Ku</span>
          </span>
        </div>

        {/* Form Container with animation */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-[400px] flex flex-col"
        >
          <motion.div variants={itemVariants} className="text-center md:text-left mb-8">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Selamat Datang
            </h2>
            <p className="text-slate-400 text-sm mt-2 font-medium">
              Silakan masuk dengan kredensial akun Anda untuk mengelola keuangan harian.
            </p>
          </motion.div>

          <form onSubmit={handleLogin} className="space-y-4">
            
            {/* Input Email */}
            <motion.div variants={itemVariants}>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Alamat Email</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </span>
                <input
                  type="email"
                  placeholder="nama@email.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-blue-500/10 rounded-xl outline-none text-sm text-slate-900 dark:text-white font-normal transition-all duration-200"
                />
              </div>
            </motion.div>

            {/* Input Password */}
            <motion.div variants={itemVariants}>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Kata Sandi</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-blue-500/10 rounded-xl outline-none text-sm text-slate-900 dark:text-white font-normal transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition-colors focus:outline-none"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </motion.div>

            {/* Tombol Submit */}
            <motion.button
              variants={itemVariants}
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Memproses Masuk...</span>
                </>
              ) : (
                <span>Masuk ke Akun</span>
              )}
            </motion.button>
          </form>



        </motion.div>

        {/* Footer Brand info on Mobile */}
        <div className="mt-auto pt-10 text-center text-[10px] text-slate-400 md:hidden">
          &copy; {new Date().getFullYear()} DompetKu. Hak Cipta Dilindungi.
        </div>
      </div>
      
    </div>
  );
}