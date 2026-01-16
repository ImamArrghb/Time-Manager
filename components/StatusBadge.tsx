import React from 'react';

// Mendefinisikan tipe status yang boleh dipakai
type StatusType = 'todo' | 'ongoing' | 'done';

interface StatusBadgeProps {
  status: StatusType;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  // Logic untuk menentukan warna berdasarkan status
  const getColor = () => {
    switch (status) {
      case 'done':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'ongoing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Logic mengubah teks bahasa inggris ke indonesia
  const getLabel = () => {
    switch (status) {
      case 'done': return 'Selesai';
      case 'ongoing': return 'Berlangsung';
      default: return 'Akan Datang';
    }
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getColor()}`}>
      {getLabel()}
    </span>
  );
}