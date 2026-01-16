'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
// SOLUSI B: Kita import konfigurasi supabase dari file lib kamu sendiri
import { supabase } from '@/lib/supabase'; 

export default function AddSchedulePage() {
  const router = useRouter();
  // (Kita tidak perlu lagi createClientComponentClient karena sudah pakai 'supabase' dari import di atas)

  // State Data
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Personal');
  const [duration, setDuration] = useState<number>(60);
  const [startTime, setStartTime] = useState(''); 
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Kirim data menggunakan variabel 'supabase' yang kita import
      const { error } = await supabase
        .from('schedules') // Pastikan nama tabel benar
        .insert([
          {
            title: title,
            category: category,
            duration: duration,
            is_completed: false
          }
        ]);

      if (error) throw error;

      // 2. Sukses? Kembali ke dashboard
      router.push('/today');
      router.refresh(); 
      
    } catch (error: any) {
      console.error('Error saving:', error);
      alert('Gagal menyimpan: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white p-4 shadow-sm flex items-center gap-4 sticky top-0 z-10">
        <Link href="/today" className="text-gray-500 hover:text-gray-800 transition">
          <span className="text-xl">←</span>
        </Link>
        <h1 className="text-lg font-bold text-gray-800">Tambah Jadwal Baru</h1>
      </div>

      {/* Form Input */}
      <div className="flex-1 p-6">
        <form onSubmit={handleSubmit} className="max-w-lg mx-auto bg-white p-6 rounded-xl shadow-sm space-y-6">
          
          {/* Judul Kegiatan */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Kegiatan</label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
              placeholder="Contoh: Belajar Next.js"
              required 
            />
          </div>

          {/* Dropdown Kategori */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-black"
            >
              <option value="Personal">Personal (Pribadi)</option>
              <option value="Work">Work (Kerja)</option>
              <option value="Study">Study (Belajar)</option>
              <option value="Health">Health (Kesehatan)</option>
            </select>
          </div>

          {/* Durasi & Jam */}
          <div className="grid grid-cols-2 gap-4">
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Durasi (Menit)</label>
               <input 
                 type="number"
                 value={duration}
                 onChange={(e) => setDuration(Number(e.target.value))}
                 className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black"
               />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jam Mulai</label>
              <input 
                type="time" 
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black"
              />
            </div>
          </div>

          {/* Tombol Simpan (Ganti Button Custom jadi button biasa agar tidak error) */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-blue-600 text-white p-3 rounded-lg transition hover:bg-blue-700 
                ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Menyimpan...' : 'Simpan ke Database'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}