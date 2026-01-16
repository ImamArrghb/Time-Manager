'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  // State baru untuk memberi tahu user cek email
  const [verificationSent, setVerificationSent] = useState(false);

  const validateInput = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert("⚠️ Format email tidak valid.");
      return false;
    }
    if (password.length < 8) {
      alert("⚠️ Password terlalu pendek. Minimal 8 karakter.");
      return false;
    }
    return true;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInput()) return;

    setLoading(true);

    if (isRegister) {
      // --- REGISTER DENGAN VERIFIKASI EMAIL ---
      
      // Ambil URL saat ini untuk redirect setelah klik email
      const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        // Kita hapus 'options' agar dia otomatis ikut Site URL di Dashboard
      });
      
      if (error) {
        alert("Gagal Daftar: " + error.message);
      } else if (data?.user && !data?.session) {
        // !data.session artinya user berhasil dibuat TAPI belum login (karena butuh verifikasi email)
        
        // --- OPSIONAL: BUAT PROFIL --- 
        // Catatan: Jika kamu pakai RLS (Row Level Security), insert ini mungkin gagal 
        // karena user belum terverifikasi. Cara terbaik buat profil adalah pakai "Supabase Trigger".
        // Namun, kita coba buat profil dasar dulu di sini.
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const defaultName = `User${randomNum}`;
        const defaultAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${defaultName}`;

        await supabase.from('profiles').insert([{ 
             id: data.user.id,
             name: defaultName,
             role: 'Mahasiswa CS',
             avatar: defaultAvatar,
             email: email
        }]);

        // Tampilkan pesan sukses verifikasi
        setVerificationSent(true);
        alert(`✅ Link verifikasi telah dikirim ke ${email}. Silakan cek Inbox/Spam.`);
      } else {
        // Jika setting confirm email MATI, dia langsung login
        router.push('/today');
      }

    } else {
      // --- LOGIN ---
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.message.includes("Email not confirmed")) {
            alert("⚠️ Email belum diverifikasi. Silakan cek email kamu.");
        } else if (error.message.includes("Invalid login")) {
            alert("❌ Email atau Password salah.");
        } else {
            alert("❌ Login gagal: " + error.message);
        }
      } else {
        router.push('/today');
      }
    }
    setLoading(false);
  };

  // Tampilan jika email verifikasi sudah dikirim
  if (verificationSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-6">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl text-center">
          <div className="text-5xl mb-4">📩</div>
          <h2 className="text-2xl font-bold mb-2 dark:text-white">Cek Email Kamu</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Kami telah mengirimkan link konfirmasi ke <strong>{email}</strong>. 
            Klik link tersebut untuk mengaktifkan akunmu.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="text-indigo-600 font-bold hover:underline"
          >
            Kembali ke Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 transition-colors duration-300
      bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500
      dark:from-gray-900 dark:via-indigo-950 dark:to-gray-900"
    >
      
      <div className="w-full max-w-sm bg-white/95 backdrop-blur-sm dark:bg-gray-800/95 rounded-3xl shadow-2xl p-8 border border-white/20 dark:border-gray-700 transition-all">
        
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-300 mb-4 shadow-sm animate-bounce-slow">
            <span className="text-3xl">📖</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white tracking-tight">
            {isRegister ? 'Mulai Sekarang' : 'Selamat Datang!'}
          </h1>
          <p className="text-sm text-gray-500 mt-2 font-medium dark:text-gray-400">
            "Setiap hari adalah hari pertama kamu"
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-5">
          
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1 dark:text-gray-400">Email</label>
            <div className="relative">
              <input
                type="email"
                required
                className="w-full p-3.5 pl-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:bg-gray-600"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1 dark:text-gray-400">
              Password
              {isRegister && <span className="text-[10px] font-normal text-indigo-500 ml-1 bg-indigo-50 px-2 py-0.5 rounded-full dark:bg-indigo-900/50 dark:text-indigo-300">8+ Simbol</span>}
            </label>
            <div className="relative">
              <input
                type="password"
                required
                className="w-full p-3.5 pl-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:bg-gray-600"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            disabled={loading}
            type="submit"
            className="w-full py-3.5 mt-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/30 focus:ring-4 focus:ring-indigo-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.98] dark:shadow-none dark:focus:ring-indigo-900"
          >
            {loading ? 'Memproses...' : (isRegister ? 'Daftar Sekarang' : 'Masuk Aplikasi')}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {isRegister ? 'Sudah punya akun? ' : 'Belum punya akun? '}
            <button 
              type="button"
              onClick={() => {
                  setIsRegister(!isRegister);
                  setEmail('');
                  setPassword('');
                  setVerificationSent(false); // Reset state saat ganti mode
              }}
              className="text-indigo-600 font-bold hover:underline dark:text-indigo-400 transition-colors"
            >
              {isRegister ? 'Login di sini' : 'Daftar di sini'}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}