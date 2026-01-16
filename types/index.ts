export interface Schedule {
    id: string;
    created_at: string;
    title: string;
    is_completed: boolean;
    // Kolom baru yang kita tambahkan di database:
    category: 'Work' | 'Study' | 'Personal' | 'Health';
    duration: number; // dalam menit
  }