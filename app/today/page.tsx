'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import PersonalHeader from '@/components/PersonalHeader';
import { supabase } from '@/lib/supabase';
import ProductivityChart from '@/components/ProductivityChart'; 

export default function TodayPage() {
  const router = useRouter();
  
  // --- STATE UTAMA ---
  const [schedules, setSchedules] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // --- MODAL MANUAL STATE ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // --- MODAL AUTO-SCHEDULE STATE ---
  const [isAutoModalOpen, setIsAutoModalOpen] = useState(false);
  const [autoText, setAutoText] = useState('');

  // --- MODAL AI COACH RESULT ---
  const [coachResult, setCoachResult] = useState('');
  const [isCoachModalOpen, setIsCoachModalOpen] = useState(false);

  const processingIds = useRef<number[]>([]);

  // Form Data Manual
  const [formData, setFormData] = useState({
    title: '', startTime: '', endTime: '', description: '', category: 'Personal'
  });

  // 1. FETCH DATA
  const fetchSchedules = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    const todayStr = new Date().toLocaleDateString('en-CA'); 

    // Ambil Jadwal Manual Hari Ini
    const { data: manuals } = await supabase
      .from('schedules')
      .select('*')
      .eq('is_routine', false)
      .eq('user_id', user.id)
      .or(`date.eq.${todayStr},date.is.null`); 
    
    // Ambil Jadwal Rutin
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const todayName = days[new Date().getDay()];
    const { data: routines } = await supabase
      .from('schedules')
      .select('*')
      .eq('is_routine', true)
      .eq('day', todayName)
      .eq('user_id', user.id);

    const combined = [...(manuals || []), ...(routines || [])].sort((a, b) => {
      const timeA = a.time.split(' - ')[0];
      const timeB = b.time.split(' - ')[0];
      return timeA.localeCompare(timeB);
    });

    setSchedules(combined);
    setIsLoaded(true);
  };

  useEffect(() => { fetchSchedules(); }, []);

  // 2. AUTO COMPLETE LOGIC
  const autoCompleteSchedule = async (item: any, userId: string) => {
    if (processingIds.current.includes(item.id)) return;
    processingIds.current.push(item.id);
    await supabase.from('schedules').update({ status: 'done' }).eq('id', item.id);
    const { data: profile } = await supabase.from('profiles').select('xp, level').eq('id', userId).single();
    if (profile) {
      let newXp = (profile.xp || 0) + 20; 
      let newLevel = profile.level || 1;
      if (newXp >= 100) { newLevel += 1; newXp = newXp - 100; }
      await supabase.from('profiles').update({ xp: newXp, level: newLevel }).eq('id', userId);
    }
    await fetchSchedules();
    processingIds.current = processingIds.current.filter(id => id !== item.id);
  };

  // 3. TIMER LOGIC
  useEffect(() => {
    if (!isLoaded) return;
    const checkTime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const now = new Date();
      const currentTotalMinutes = (now.getHours() * 60) + now.getMinutes();

      setSchedules(prev => prev.map(item => {
        if (item.status === 'done') return item;
        const times = item.time.split(' - ');
        let newStatus = item.status; 
        if (times.length >= 1) {
          const [startH, startM] = times[0].split(':').map(Number);
          const startTotal = (startH * 60) + startM;
          let endTotal = startTotal + 60; 
          if (times.length >= 2) {
            const [endH, endM] = times[1].split(':').map(Number);
            endTotal = (endH * 60) + endM;
          }
          if (currentTotalMinutes >= startTotal && currentTotalMinutes <= endTotal) newStatus = 'ongoing';
          else if (currentTotalMinutes > endTotal) {
             if (item.status !== 'done') { autoCompleteSchedule(item, user.id); newStatus = 'done'; }
          } 
          else if ((startTotal - currentTotalMinutes) > 0 && (startTotal - currentTotalMinutes) <= 15) newStatus = 'soon'; 
          else newStatus = 'upcoming';
        }
        return { ...item, status: newStatus };
      }));
    };
    checkTime(); 
    const timer = setInterval(checkTime, 5000);
    return () => clearInterval(timer);
  }, [isLoaded]);

  // --- HANDLER AI COACH ---
  const handleAiCoach = async () => {
    // Filter hanya jadwal aktif
    const activeOnly = schedules.filter(s => s.status !== 'done');
    if (activeOnly.length === 0) return alert("Belum ada jadwal aktif untuk dinilai!");
    
    setIsProcessing(true);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedules: activeOnly }),
      });
      
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      
      setCoachResult(json.analysis);
      setIsCoachModalOpen(true);
    } catch (error: any) {
      alert("Gagal menghubungi Coach: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // --- HANDLER AUTO SCHEDULE ---
  const handleAutoSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!autoText.trim()) return alert("Ceritakan dulu rencana harimu!");
    
    setIsProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const todayStr = new Date().toLocaleDateString('en-CA'); 

      const res = await fetch('/api/autoschedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            requestText: autoText,
            todayDate: todayStr
        }),
      });
      
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      
      const aiSchedules = json.data; 

      const savePromises = aiSchedules.map(async (item: any) => {
         const [startH, startM] = item.startTime.split(':').map(Number);
         const [endH, endM] = item.endTime.split(':').map(Number);
         const duration = (endH * 60 + endM) - (startH * 60 + startM);

         const result = await supabase.from('schedules').insert([{ 
            title: item.title, 
            time: `${item.startTime} - ${item.endTime}`, 
            description: item.description,
            category: item.category, 
            duration: duration > 0 ? duration : 60,
            status: 'upcoming', 
            is_routine: false, 
            user_id: user.id,
            date: item.date 
          }]);
          
          if (result.error) throw new Error(result.error.message);
          return result;
      });

      await Promise.all(savePromises);
      setAutoText('');
      setIsAutoModalOpen(false);
      await fetchSchedules(); 
      alert(`Berhasil! ${aiSchedules.length} jadwal ditambahkan.`);
    } catch (error: any) {
      console.error(error);
      alert("Gagal menyimpan: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // --- CRUD HANDLERS ---
  const openNewModal = () => {
    setFormData({ title: '', startTime: '', endTime: '', description: '', category: 'Personal' });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: any) => {
    const times = item.time.split(' - ');
    setFormData({ 
      title: item.title, 
      startTime: times[0] || '', 
      endTime: times[1] || '', 
      description: item.description || '',
      category: item.category || 'Personal'
    });
    setEditingId(item.id);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const timeString = `${formData.startTime} - ${formData.endTime}`;
      const [startH, startM] = formData.startTime.split(':').map(Number);
      const [endH, endM] = formData.endTime.split(':').map(Number);
      let durationCalc = (endH * 60 + endM) - (startH * 60 + startM);
      if (durationCalc < 0) durationCalc = 0;

      const payload = {
        title: formData.title, time: timeString, description: formData.description,
        category: formData.category, duration: durationCalc,
      };

      if (editingId) {
          await supabase.from('schedules').update(payload).eq('id', editingId);
      } else {
          await supabase.from('schedules').insert([{ 
              ...payload, 
              status: 'upcoming', 
              is_routine: false, 
              user_id: user.id,
              date: new Date().toLocaleDateString('en-CA') 
            }]);
      }
      
      await fetchSchedules();
      setIsModalOpen(false);
    } catch (error) { alert("Gagal menyimpan data."); } 
    finally { setIsProcessing(false); }
  };

  const handleDelete = async (item: any) => {
    if (confirm('Hapus jadwal ini?')) {
      setIsProcessing(true);
      try {
        await supabase.from('schedules').delete().eq('id', item.id);
        setSchedules(prev => prev.filter(s => s.id !== item.id));
      } catch (e) { alert("Gagal menghapus."); } 
      finally { setIsProcessing(false); }
    }
  };

  const activeSchedules = schedules.filter(s => s.status !== 'done');

  return (
    <div className="min-h-screen bg-gray-50 pb-24 dark:bg-gray-900 transition-colors duration-300">
      <PersonalHeader />
      <div className="px-6 -mt-8 relative z-20">
        <div className="bg-white rounded-3xl p-6 shadow-lg min-h-[400px] mb-6 dark:bg-gray-800 dark:border dark:border-gray-700">
          
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-3">
            {/* --- UPDATE: TEXT-CENTER (untuk mobile) SM:TEXT-LEFT (untuk desktop) --- */}
            <div className="text-center sm:text-left">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">Agenda Hari Ini</h2>
              <p className="text-xs text-gray-400 mt-1 dark:text-gray-500">XP bertambah otomatis</p>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={handleAiCoach} 
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg flex items-center gap-1 transition-transform hover:scale-105"
              >
                <span>🧠</span> Coach
              </button>
              <button onClick={() => setIsAutoModalOpen(true)} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg flex items-center gap-1 transition-transform hover:scale-105"><span>🤖</span> Auto</button>
              <button onClick={openNewModal} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg hover:scale-105 transition-transform">+ Baru</button>
            </div>
          </div>

          {activeSchedules.length === 0 ? (
            <div className="text-center py-10 text-gray-400 dark:text-gray-600">
              <div className="text-4xl mb-2 animate-bounce">🍃</div>
              <p>{isLoaded ? 'Semua tugas selesai!' : 'Memuat data...'}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {schedules.map((schedule, index) => {
                if (schedule.status === 'done') return null;

                return (
                  <div key={schedule.id || index} className={`relative p-5 rounded-2xl border transition-all duration-300 group ${schedule.status === 'ongoing' ? 'bg-blue-50 border-blue-200 shadow-md transform scale-[1.02] dark:bg-blue-900/20' : schedule.status === 'soon' ? 'bg-red-50 border-red-100 dark:bg-red-900/10' : 'bg-white border-gray-100 dark:bg-gray-700/50'}`}>
                    {schedule.status === 'ongoing' && <div className="absolute -top-3 left-4 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-full animate-pulse shadow-lg">SEDANG BERLANGSUNG</div>}
                    {schedule.status === 'soon' && <div className="absolute -top-3 left-4 bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-full animate-bounce shadow-lg">SEGERA DIMULAI</div>}

                    <div className="flex justify-between items-start mt-2">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-1 text-gray-800 dark:text-gray-100">{schedule.title}</h3>
                        <div className="flex items-center text-sm text-gray-500 mb-2 dark:text-gray-400">
                          <span className="mr-2">⏰</span>
                          <span className={`font-medium ${schedule.status === 'ongoing' ? 'text-blue-600' : ''}`}>{schedule.time}</span>
                          <span className="mx-2">•</span>
                          <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600 dark:bg-gray-600 dark:text-gray-300">{schedule.category || 'Personal'}</span>
                        </div>
                        <p className="text-gray-400 text-sm line-clamp-2 dark:text-gray-500">{schedule.description}</p>
                      </div>
                      <div className="flex flex-col gap-2 ml-4">
                        <button onClick={() => openEditModal(schedule)} className="w-8 h-8 flex items-center justify-center rounded-full bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20">✎</button>
                        <button onClick={() => handleDelete(schedule)} className="w-8 h-8 flex items-center justify-center rounded-full bg-red-500/10 text-red-500 hover:bg-red-500/20">🗑</button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
        
        <div className="mb-20">
            <ProductivityChart />
        </div>
      </div>
      
      {/* MODAL COMPONENTS (AUTO, AI COACH, MANUAL) - Sama seperti sebelumnya */}
      {isAutoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in duration-200 dark:bg-gray-800 dark:text-white">
            <div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-xl">🤖</div><div><h3 className="text-lg font-bold text-gray-800 dark:text-white">Auto Scheduler</h3><p className="text-xs text-gray-400">Powered by Llama-3</p></div></div>
            <form onSubmit={handleAutoSchedule} className="space-y-4">
              <div><label className="block text-xs font-bold mb-1 text-gray-500">Ceritakan Rencanamu</label><textarea required rows={4} placeholder="Contoh: Saya mau belajar React jam 8 pagi selama 2 jam..." className="w-full p-4 rounded-xl border bg-gray-50 text-gray-800 focus:ring-2 focus:ring-purple-500 outline-none dark:bg-gray-700 dark:text-white" value={autoText} onChange={(e) => setAutoText(e.target.value)} /></div>
              <div className="flex gap-3 pt-2"><button type="button" onClick={() => setIsAutoModalOpen(false)} className="flex-1 py-3 rounded-xl font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300">Batal</button><button type="submit" disabled={isProcessing} className="flex-1 py-3 rounded-xl font-bold text-white bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400">{isProcessing ? 'Sedang Membuat...' : '✨ Generate Jadwal'}</button></div>
            </form>
          </div>
        </div>
      )}

      {isCoachModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in duration-200 dark:bg-gray-800 dark:text-white">
            <div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-xl">🧠</div><div><h3 className="text-lg font-bold text-gray-800 dark:text-white">Kata Coach</h3><p className="text-xs text-gray-400">Analisis Jadwal</p></div></div>
            <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 text-gray-700 text-sm leading-relaxed dark:bg-orange-900/20 dark:border-orange-800 dark:text-gray-200 whitespace-pre-wrap">{coachResult}</div>
            <div className="pt-4"><button onClick={() => setIsCoachModalOpen(false)} className="w-full py-3 rounded-xl font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300">Tutup</button></div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in duration-200 dark:bg-gray-800 dark:text-white">
            <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">{editingId ? 'Edit Jadwal' : 'Tambah Jadwal'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-xs font-bold mb-1 text-gray-500">Nama Kegiatan</label><input required type="text" className="w-full p-3 rounded-xl border bg-gray-50 text-gray-800 dark:bg-gray-700 dark:text-white" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} /></div>
              <div><label className="block text-xs font-bold mb-1 text-gray-500">Kategori</label><select className="w-full p-3 rounded-xl border bg-gray-50 text-gray-800 dark:bg-gray-700 dark:text-white" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}><option value="Personal">Personal</option><option value="Work">Work</option><option value="Study">Study</option><option value="Health">Health</option></select></div>
              <div className="grid grid-cols-2 gap-4"><div><label className="block text-xs font-bold mb-1 text-gray-500">Mulai</label><input required type="time" className="w-full p-3 rounded-xl border bg-gray-50 text-gray-800 dark:bg-gray-700 dark:text-white" value={formData.startTime} onChange={(e) => setFormData({...formData, startTime: e.target.value})} /></div><div><label className="block text-xs font-bold mb-1 text-gray-500">Selesai</label><input required type="time" className="w-full p-3 rounded-xl border bg-gray-50 text-gray-800 dark:bg-gray-700 dark:text-white" value={formData.endTime} onChange={(e) => setFormData({...formData, endTime: e.target.value})} /></div></div>
              <div><label className="block text-xs font-bold mb-1 text-gray-500">Keterangan</label><textarea rows={2} className="w-full p-3 rounded-xl border bg-gray-50 text-gray-800 dark:bg-gray-700 dark:text-white" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} /></div>
              <div className="flex gap-3 pt-2"><button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 rounded-xl font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300">Batal</button><button type="submit" disabled={isProcessing} className="flex-1 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400">{editingId ? 'Simpan' : 'Tambah'}</button></div>
            </form>
          </div>
        </div>
      )}
      
      {isProcessing && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm"><div className="bg-white p-5 rounded-2xl shadow-2xl flex flex-col items-center"><div className="w-12 h-12 border-4 border-gray-200 border-t-purple-600 rounded-full animate-spin mb-3"></div><p className="text-sm font-bold animate-pulse text-black">Memproses...</p></div></div>}
    </div>
  );
}