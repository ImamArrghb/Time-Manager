'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PersonalHeader from '@/components/PersonalHeader'; 
import { supabase } from '@/lib/supabase';

export default function WeeklyPage() {
  const router = useRouter();
  
  // --- STATE ---
  const [routines, setRoutines] = useState<any[]>([]);
  const [datedEvents, setDatedEvents] = useState<any[]>([]);
  const [activeDay, setActiveDay] = useState('Senin');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null); 
  const [editingItemDate, setEditingItemDate] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    day: 'Senin',
    title: '',
    startTime: '',
    endTime: '',
    description: ''
  });

  const daysOrder = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
  const [dateMap, setDateMap] = useState<any>({});

  // --- 1. GENERATE 7 HARI KEDEPAN ---
  const getNext7DaysMap = () => {
    const map: Record<string, { dateStr: string, displayDate: string }> = {};
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const dayName = dayNames[d.getDay()];
      map[dayName] = {
        dateStr: d.toLocaleDateString('en-CA'),
        displayDate: d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
      };
    }
    return map;
  };

  // --- 2. FETCH DATA ---
  const fetchWeeklySchedules = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    const { data: routineData } = await supabase
      .from('schedules').select('*').eq('is_routine', true).eq('user_id', user.id); 

    const { data: manualData } = await supabase
      .from('schedules').select('*').eq('is_routine', false).not('date', 'is', null).eq('user_id', user.id);

    setRoutines(routineData || []);
    setDatedEvents(manualData || []);
    setIsLoading(false);
  };

  useEffect(() => {
    setDateMap(getNext7DaysMap());
    fetchWeeklySchedules();
    const todayIndex = new Date().getDay(); 
    const dayMap = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    setActiveDay(dayMap[todayIndex]);
  }, []);

  // --- 3. LOGIKA MERGE DATA ---
  const getMergedSchedules = () => {
    const dayRoutines = routines.filter(s => s.day === activeDay);
    const activeDateStr = dateMap[activeDay]?.dateStr;
    const dayManuals = datedEvents.filter(s => s.date === activeDateStr);

    return [...dayRoutines, ...dayManuals].sort((a, b) => {
       const timeA = a.time.split(' - ')[0];
       const timeB = b.time.split(' - ')[0];
       return timeA.localeCompare(timeB);
    });
  };

  const filteredSchedules = getMergedSchedules();

  // --- CRUD FUNCTIONS ---
  const resetForm = () => {
    setFormData({ day: activeDay, title: '', startTime: '', endTime: '', description: '' });
    setEditingId(null); 
    setEditingItemDate(null);
  };

  const handleEditClick = (item: any) => {
    const times = item.time.split(' - ');
    setFormData({
      day: item.day || activeDay,
      title: item.title,
      startTime: times[0] || '',
      endTime: times[1] || '',
      description: item.description || ''
    });
    setEditingId(item.id); 
    setEditingItemDate(item.date || null); 
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        let payload: any = {
            title: formData.title,
            time: `${formData.startTime} - ${formData.endTime}`,
            description: formData.description,
        };

        if (editingId) {
            if (editingItemDate) {
                await supabase.from('schedules').update(payload).eq('id', editingId);
            } else {
                payload.day = formData.day;
                await supabase.from('schedules').update(payload).eq('id', editingId);
            }
        } else {
            payload.is_routine = true;
            payload.day = formData.day;
            payload.status = 'todo';
            payload.user_id = user.id;
            await supabase.from('schedules').insert([payload]);
        }

        await fetchWeeklySchedules();
        setIsModalOpen(false);
        resetForm();
    } catch (error) { alert('Gagal menyimpan data.'); console.error(error) } 
    finally { setIsProcessing(false); }
  };

  const handleDelete = async (item: any) => {
    if (confirm(`Hapus jadwal ${item.is_routine ? 'rutin' : 'ini'}?`)) {
      setIsProcessing(true);
      try {
          await supabase.from('schedules').delete().eq('id', item.id);
          fetchWeeklySchedules(); 
      } catch (error) { alert('Gagal menghapus.'); } 
      finally { setIsProcessing(false); }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 dark:bg-gray-900 transition-colors duration-300">
      <PersonalHeader />

      <div className="px-6 -mt-8 relative z-20">
        <div className="bg-white rounded-3xl p-6 shadow-lg min-h-[600px] dark:bg-gray-800 dark:border dark:border-gray-700">
          
          <div className="flex justify-between items-center mb-6">
            <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Jadwal Mingguan</h2>
                <p className="text-xs text-gray-400 mt-1">Gabungan Rutinitas & Agenda Harian</p>
            </div>
            <button 
              onClick={() => { resetForm(); setIsModalOpen(true); }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg transition-transform transform hover:scale-105"
            >
              + Tambah Rutinitas
            </button>
          </div>

          {/* TAB HARI */}
          <div className="flex overflow-x-auto pb-4 mb-4 gap-2 no-scrollbar">
            {daysOrder.map(day => {
               const dateInfo = dateMap[day];
               const hasDate = !!dateInfo;
               return (
                <button
                    key={day}
                    onClick={() => setActiveDay(day)}
                    className={`px-4 py-2 rounded-2xl text-sm font-semibold whitespace-nowrap transition-all flex flex-col items-center min-w-[80px]
                    ${activeDay === day 
                        ? 'bg-gray-800 text-white shadow-md dark:bg-indigo-600' 
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'}`}
                >
                    <span>{day}</span>
                    {hasDate && <span className="text-[10px] opacity-70 font-normal">{dateInfo.displayDate}</span>}
                </button>
               )
            })}
          </div>

          {/* LIST JADWAL */}
          {isLoading ? (
            <div className="text-center py-20 text-gray-400">
                <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                Loading data...
            </div>
          ) : filteredSchedules.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 dark:bg-gray-700/30 dark:border-gray-600">
              <div className="text-5xl mb-3 animate-bounce">📅</div>
              <p className="text-gray-400 font-medium dark:text-gray-500">Kosong di hari {activeDay}</p>
              <p className="text-xs text-gray-400 dark:text-gray-600">Tekan tombol + untuk mengisi rutinitas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSchedules.map((item) => (
                <div 
                  key={item.id} 
                  className={`group flex justify-between items-start p-4 border rounded-xl hover:shadow-md transition-all
                    ${item.is_routine 
                        ? 'bg-white border-gray-100 dark:bg-gray-700/50 dark:border-gray-600' 
                        : 'bg-indigo-50 border-indigo-100 dark:bg-indigo-900/20 dark:border-indigo-800'
                    }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-800 dark:text-white">{item.title}</h3>
                        {!item.is_routine && <span className="text-[10px] bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded-full dark:bg-indigo-700 dark:text-white">Harian</span>}
                        {item.is_routine && <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full dark:bg-gray-600 dark:text-gray-300">Rutin</span>}
                    </div>
                    <div className="flex items-center text-sm text-indigo-600 font-medium mt-1 dark:text-indigo-400">
                      <span className="mr-2">⏰</span>
                      {item.time}
                      {item.category && <span className="ml-2 text-xs text-gray-400">• {item.category}</span>}
                    </div>
                    {item.description && <p className="text-xs text-gray-400 mt-1 dark:text-gray-500">{item.description}</p>}
                  </div>
                  
                  {/* --- BAGIAN ICON YANG DIUBAH DI SINI --- */}
                  <div className="flex flex-col gap-2 ml-4">
                    
                    <button 
                      onClick={() => handleEditClick(item)} 
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 transition-colors"
                    >
                      ✎
                    </button>
                    
                    <button 
                      onClick={() => handleDelete(item)} 
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                    >
                      🗑
                    </button>

                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* --- MODAL POPUP --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in duration-200 dark:bg-gray-800 dark:text-white">
            <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">
                {editingId ? (editingItemDate ? 'Edit Agenda Harian' : 'Edit Jadwal Rutin') : 'Tambah Jadwal Rutin'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1 dark:text-gray-400">
                    {editingItemDate ? 'Tanggal (Tidak bisa diubah)' : 'Hari'}
                </label>
                {editingItemDate ? (
                    <input 
                        type="text" 
                        disabled 
                        className="w-full p-3 bg-gray-100 rounded-xl border border-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-700/50 dark:border-gray-600 dark:text-gray-400"
                        value={new Date(editingItemDate).toLocaleDateString('id-ID', { dateStyle: 'full' })}
                    />
                ) : (
                    <select className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-indigo-500 text-gray-800 dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={formData.day} onChange={(e) => setFormData({...formData, day: e.target.value})}>{daysOrder.map(d => <option key={d} value={d}>{d}</option>)}</select>
                )}
              </div>

              <div><label className="block text-xs font-bold text-gray-500 mb-1 dark:text-gray-400">Nama Kegiatan</label><input required type="text" className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-indigo-500 text-gray-800 dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-4"><div><label className="block text-xs font-bold text-gray-500 mb-1 dark:text-gray-400">Mulai</label><input required type="time" className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-indigo-500 text-gray-800 dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={formData.startTime} onChange={(e) => setFormData({...formData, startTime: e.target.value})} /></div><div><label className="block text-xs font-bold text-gray-500 mb-1 dark:text-gray-400">Selesai</label><input required type="time" className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-indigo-500 text-gray-800 dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={formData.endTime} onChange={(e) => setFormData({...formData, endTime: e.target.value})} /></div></div>
              <div><label className="block text-xs font-bold text-gray-500 mb-1 dark:text-gray-400">Keterangan (Opsional)</label><textarea rows={2} className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-indigo-500 text-gray-800 dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} /></div>
              <div className="flex gap-3 pt-2"><button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition dark:bg-gray-700 dark:text-gray-300">Batal</button><button type="submit" disabled={isProcessing} className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-indigo-200 shadow-lg transition disabled:bg-indigo-400">{editingId ? 'Simpan' : 'Tambah'}</button></div>
            </form>
          </div>
        </div>
      )}
      {isProcessing && <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"><div className="bg-white p-5 rounded-2xl shadow-2xl flex flex-col items-center dark:bg-gray-800"><div className="w-12 h-12 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin mb-3"></div><p className="text-sm font-bold text-gray-700 dark:text-white animate-pulse">Memproses Data...</p></div></div>}
    </div>
  );
}