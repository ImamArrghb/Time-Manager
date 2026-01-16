import React from 'react';
import Link from 'next/link'; // Import Link
import StatusBadge from './StatusBadge';

interface ScheduleCardProps {
  id: number; // <--- Tambahkan ID di sini
  title: string;
  time: string;
  description?: string;
  status: 'todo' | 'ongoing' | 'done';
  onDelete?: () => void;
}

export default function ScheduleCard({ id, title, time, description, status, onDelete }: ScheduleCardProps) {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-4 relative group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 animate-fade-in">
      
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-semibold text-gray-800 text-lg">{title}</h3>
          <p className="text-blue-600 font-medium text-sm">{time}</p>
        </div>
        <StatusBadge status={status} />
      </div>
      
      {description && (
        <p className="text-gray-500 text-sm mt-2 line-clamp-2 pr-16"> {/* pr-16 biar teks ga nabrak tombol */}
          {description}
        </p>
      )}

      {/* Container Tombol Aksi */}
      <div className="absolute bottom-4 right-4 flex gap-2">
        
        {/* Tombol EDIT (Pensil) - Biru */}
        <Link href={`/today/edit/${id}`}>
          <button className="text-gray-300 hover:text-blue-500 transition p-1" title="Edit Jadwal">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        </Link>

        {/* Tombol HAPUS (Sampah) - Merah */}
        {onDelete && (
          <button 
            onClick={onDelete}
            className="text-gray-300 hover:text-red-500 transition p-1"
            title="Hapus Jadwal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}