'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function EditPage() {
  const router = useRouter();
  const params = useParams(); // Mengambil ID dari URL
  const indexToEdit = Number(params.id);

  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [description, setDescription] = useState('');

  // Load Data yang mau diedit
  useEffect(() => {
    const saved = localStorage.getItem('schedules');
    if (saved) {
      const schedules = JSON.parse(saved);
      const item = schedules[indexToEdit];
      
      if (item) {
        setTitle(item.title);
        setDescription(item.description);
        
        // Pecah format "08:00 - 09:00" balik jadi start & end
        const times = item.time.split(' - ');
        if (times.length >= 2) {
          setStartTime(times[0]);
          setEndTime(times[1]);
        }
      } else {
        alert('Jadwal tidak ditemukan!');
        router.push('/today');
      }
    }
  }, [indexToEdit, router]);

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    
    const saved = localStorage.getItem('schedules');
    if (saved) {
      const schedules = JSON.parse(saved);
      
      // Update data di index tersebut
      schedules[indexToEdit] = {
        title,
        time: `${startTime} - ${endTime}`,
        description,
        status: 'todo' // Reset status atau biarkan
      };

      localStorage.setItem('schedules', JSON.stringify(schedules));
      router.push('/today');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
      <div className="bg-white w-full max-w-md p-8 rounded-3xl shadow-xl">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Edit Jadwal ✏️</h1>
        
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Judul Kegiatan</label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
              required 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Mulai</label>
              <input 
                type="time" 
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full p-3 rounded-xl border border-gray-200 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Selesai</label>
              <input 
                type="time" 
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full p-3 rounded-xl border border-gray-200 outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Catatan</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 rounded-xl border border-gray-200 outline-none h-24"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button 
              type="button"
              onClick={() => router.back()}
              className="flex-1 py-3 rounded-xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              Batal
            </button>
            <button 
              type="submit"
              className="flex-1 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95"
            >
              Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}