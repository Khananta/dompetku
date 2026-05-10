"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase";
import Swal from "sweetalert2";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  // State mode login atau register
  const [isRegister, setIsRegister] = useState(false);
  
  // State form input
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");

  // State UI
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // ==========================================
  // HANDLER UTAMA (LOGIN & REGISTER)
  // ==========================================
    const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    // 1. Bersihkan spasi di awal & akhir input secara otomatis (Sanitasi dasar)
    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim().toLowerCase();

    try {
      // 2. VALIDASI FORMAT EMAIL (Regex standar industri)
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        throw new Error("EMAIL_TIDAK_VALID");
      }

      if (isRegister) {
        // --- VALIDASI KHUSUS REGISTER ---
        
        // 3. VALIDASI PANJANG USERNAME & KARAKTER AMAN
        // Hanya mengizinkan huruf, angka, titik (.), dan underscore (_)
        const usernameRegex = /^[a-zA-Z0-9._]+$/;
        
        if (cleanUsername.length < 3 || cleanUsername.length > 20) {
          throw new Error("USERNAME_PANJANG_SALAH");
        }
        
        if (!usernameRegex.test(cleanUsername)) {
          throw new Error("USERNAME_KARAKTER_BAHAYA");
        }

        // 4. VALIDASI PANJANG PASSWORD
        if (password.length < 6) {
          throw new Error("KATA_SANDI_PENDEK");
        }

        // 5. CEK APAKAH USERNAME SUDAH TERPAKAI (Cek database)
        const { data: existingUser } = await supabase
          .from("profiles")
          .select("username")
          .eq("username", cleanUsername)
          .maybeSingle();

        if (existingUser) {
          throw new Error("USERNAME_SUDAH_DIPAKAI");
        }

        // Proses daftar...
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: { username: username.trim() },
          },
        });

        if (signUpError) {
          if (signUpError.message.includes("User already registered") || signUpError.status === 422) {
            throw new Error("EMAIL_SUDAH_TERDAFTAR");
          }
          throw signUpError;
        }

        // Otomatis login...
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (signInError) throw signInError;

        Swal.fire({
          title: "Pendaftaran Berhasil!",
          text: `Selamat datang di DompetKu, ${username}!`,
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        }).then(() => {
          router.push("/");
          router.refresh();
        });

      } else {
        // --- PROSES MASUK (LOGIN) ---
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (loginError) {
          throw new Error("KREDENSIAL_SALAH");
        }

        Swal.fire({
          title: "Login Berhasil!",
          text: "Selamat mengelola keuanganmu kembali!",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        }).then(() => {
          router.push("/");
          router.refresh();
        });
      }
    } catch (error) {
      // ==========================================
      // PENANGANAN & TRANSLATE ERROR ALERT (SWEETALERT)
      // ==========================================
      let errorTitle = "Gagal!";
      let errorMessage = error.message;

      if (error.message === "EMAIL_TIDAK_VALID") {
        errorTitle = "Format Email Salah!";
        errorMessage = "Silakan masukkan alamat email yang valid (contoh: nama@email.com).";
      } else if (error.message === "USERNAME_PANJANG_SALAH") {
        errorTitle = "Username Tidak Valid!";
        errorMessage = "Nama pengguna (username) harus terdiri dari 3 hingga 20 karakter.";
      } else if (error.message === "USERNAME_KARAKTER_BAHAYA") {
        errorTitle = "Karakter Tidak Diizinkan!";
        errorMessage = "Username hanya boleh berisi huruf, angka, titik (.), dan garis bawah (_). Tanpa spasi atau simbol aneh!";
      } else if (error.message === "KATA_SANDI_PENDEK") {
        errorTitle = "Sandi Terlalu Pendek!";
        errorMessage = "Kata sandi minimal harus terdiri dari 6 karakter.";
      } else if (error.message === "USERNAME_SUDAH_DIPAKAI") {
        errorTitle = "Nama Sudah Dipakai!";
        errorMessage = `Nama pengguna "@${cleanUsername}" sudah digunakan orang lain. Coba nama lain, ya!`;
      } else if (error.message === "EMAIL_SUDAH_TERDAFTAR") {
        errorTitle = "Email Sudah Terdaftar!";
        errorMessage = "Alamat email ini sudah memiliki akun. Silakan langsung masuk saja.";
      } else if (error.message === "KREDENSIAL_SALAH") {
        errorTitle = "Login Gagal!";
        errorMessage = "Email tidak terdaftar atau kata sandi yang kamu masukkan salah. Periksa kembali ketikanmu!";
      } else {
        errorMessage = error.message;
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
          {isRegister ? "Buat Akun Baru" : "Selamat Datang Kembali"}
        </h2>
        <p className="text-slate-400 text-sm text-center mb-6">
          {isRegister 
            ? "Mulai kelola keuanganmu dengan lebih rapi hari ini" 
            : "Silakan masuk untuk mencatat keuanganmu"}
        </p>

        <form onSubmit={handleAuth} className="space-y-4">
          
          {/* Input Username (Hanya muncul jika mode Register) */}
          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Nama Pengguna (Username)</label>
              <input
                type="text"
                placeholder="Contoh: khanifyunan"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm text-slate-900 font-medium transition-all"
              />
            </div>
          )}

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
            {loading ? "Memproses..." : isRegister ? "Daftar Akun" : "Masuk ke Akun"}
          </button>
        </form>

        {/* Toggle Login / Register */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500">
            {isRegister ? "Sudah punya akun?" : "Belum punya akun?"}{" "}
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setEmail("");
                setPassword("");
                setUsername("");
              }}
              className="text-blue-600 font-bold hover:underline"
            >
              {isRegister ? "Masuk di sini" : "Daftar di sini"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}