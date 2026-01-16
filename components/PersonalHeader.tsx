'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function PersonalHeader() {
  const [greeting, setGreeting] = useState('');
  const [userName, setUserName] = useState('...');
  const [userRole, setUserRole] = useState('...');
  const [avatar, setAvatar] = useState('https://api.dicebear.com/7.x/avataaars/svg?seed=Loading');
  const [quote, setQuote] = useState('Loading...');
  
  // STATE GAMIFIKASI
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);

  // STATE IKON WAKTU
  const [timeIcon, setTimeIcon] = useState('☀️');

  // STATE MODAL STATUS
  const [isStatusOpen, setIsStatusOpen] = useState(false);

  const quotes = [
    "Level up your life, one task at a time.",
    "Konsistensi adalah kunci.",
    "Jangan berhenti saat lelah, berhentilah saat selesai.",
    "Hati yang bersih, pikiran yang jernih.",
    "Jadikan hari ini legendaris."
  ];

  useEffect(() => {
    const hour = new Date().getHours();
    
    // 1. Logika Greeting & Ikon
    if (hour >= 6 && hour < 18) {
        setTimeIcon('☀️'); 
    } else {
        setTimeIcon('🌙');
    }

    if (hour < 11) setGreeting('Selamat Pagi');
    else if (hour < 15) setGreeting('Selamat Siang');
    else if (hour < 18) setGreeting('Selamat Sore');
    else setGreeting('Selamat Malam');

    // 2. Load Profile
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name, role, avatar, level, xp')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setUserName(profile.name);
          setUserRole(profile.role || 'Mahasiswa CS');
          setAvatar(profile.avatar);
          setLevel(profile.level || 1);
          setXp(profile.xp || 0);
        }
      }
    };
    
    // 3. Realtime Listener
    const channel = supabase.channel('realtime_profile')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, (payload) => {
         const newData = payload.new;
         setLevel(newData.level);
         setXp(newData.xp);
      })
      .subscribe();

    loadProfile();
    setQuote(quotes[Math.floor(Math.random() * quotes.length)]);

    return () => { supabase.removeChannel(channel); };
  }, []);

  const dateOptions: Intl.DateTimeFormatOptions = { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long',
    year: 'numeric' 
  };
  const todayDate = new Date().toLocaleDateString('id-ID', dateOptions).toUpperCase();

  const xpPercentage = Math.min((xp / 100) * 100, 100);

  return (
    <>
      <header className="bg-gradient-to-r from-indigo-600 to-purple-600 pt-10 pb-20 px-6 rounded-b-[3rem] shadow-xl text-white relative overflow-hidden transition-all">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-white opacity-5 rounded-full -ml-10 -mb-10 blur-xl"></div>

          <div className="flex justify-between items-start relative z-10">
              <div>
                  {/* 👇 BAGIAN INI DIPERBARUI: */}
                  {/* - text-[11px]: Ukuran sedikit lebih kecil */}
                  {/* - mb-0: Jarak bawah dihapus agar nempel ke greeting */}
                  {/* - opacity-90: Agar warnanya agak soft */}
                  <p className="text-[11px] font-bold tracking-widest text-indigo-100 mb-0 flex items-center gap-1.5 opacity-90">
                      <span className="text-sm">{timeIcon}</span> {todayDate}
                  </p>
                  
                  <h1 className="text-2xl font-extrabold leading-tight">
                      {greeting}, <br/>
                      <span className="text-yellow-300">{userName}</span>
                  </h1>

                  {/* GAMIFICATION BAR */}
                  <div className="mt-3 flex items-center gap-3">
                    <div className="bg-yellow-400 text-yellow-900 text-[10px] font-black px-2 py-0.5 rounded-md shadow-sm">
                        LVL {level}
                    </div>
                    <div className="w-32 h-2 bg-indigo-900/30 rounded-full overflow-hidden backdrop-blur-sm border border-white/10">
                        <div 
                          className="h-full bg-gradient-to-r from-yellow-300 to-yellow-500 transition-all duration-500 ease-out"
                          style={{ width: `${xpPercentage}%` }}
                        ></div>
                    </div>
                    <span className="text-[10px] font-medium text-indigo-200">{xp}/100 XP</span>
                  </div>
              </div>
              
              {/* KLIK AVATAR -> BUKA MODAL STATUS */}
              <button 
                onClick={() => setIsStatusOpen(true)}
                className="group focus:outline-none"
              >
                <div className="w-14 h-14 rounded-full border-2 border-indigo-300/50 bg-white/10 backdrop-blur-md p-1 overflow-hidden shadow-inner transition-transform group-hover:scale-105 group-active:scale-95">
                    <img src={avatar} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                </div>
              </button>
          </div>

          <div className="mt-6 relative z-10">
              <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-3 text-xs font-medium italic text-indigo-100 shadow-lg max-w-sm flex gap-2">
                  <span>💡</span> "{quote}"
              </div>
          </div>
      </header>

      {/* --- MODAL STATUS CARD --- */}
      {isStatusOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="absolute inset-0" onClick={() => setIsStatusOpen(false)}></div>
           
           <div className="bg-white dark:bg-gray-800 w-full max-w-xs rounded-3xl p-6 shadow-2xl relative z-10 text-center border-4 border-indigo-100 dark:border-gray-700 transform transition-all scale-100">
              
              <div className="absolute -top-5 -right-5 bg-yellow-400 text-yellow-900 w-16 h-16 rounded-full flex items-center justify-center font-black text-xl shadow-lg border-4 border-white dark:border-gray-800 rotate-12">
                 {level}
              </div>

              <div className="w-24 h-24 mx-auto rounded-full p-1 border-4 border-indigo-500 shadow-xl mb-4 bg-white">
                 <img src={avatar} className="w-full h-full object-cover rounded-full" />
              </div>

              <h2 className="text-xl font-bold text-gray-800 dark:text-white">{userName}</h2>
              <p className="text-indigo-500 font-medium text-sm mb-6">{userRole}</p>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 mb-6">
                 <div className="flex justify-between text-xs font-bold text-gray-500 dark:text-gray-300 mb-1">
                    <span>PROGRESS LEVEL {level}</span>
                    <span>{xp}/100 XP</span>
                 </div>
                 <div className="w-full h-4 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500" style={{ width: `${xpPercentage}%` }}></div>
                 </div>
                 <p className="text-[10px] text-gray-400 mt-2">
                    Kurang <b>{100 - xp} XP</b> lagi untuk naik ke Level {level + 1}!
                 </p>
              </div>

              <button 
                onClick={() => setIsStatusOpen(false)}
                className="w-full py-3 rounded-xl bg-indigo-600 text-white font-bold shadow-lg hover:bg-indigo-700 transition"
              >
                Tutup Kartu
              </button>
           </div>
        </div>
      )}
    </>
  );
}