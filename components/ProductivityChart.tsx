'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['#818cf8', '#34d399', '#f472b6', '#fbbf24']; 

export default function ProductivityChart() {
  const [data, setData] = useState<any[]>([]);
  const [filter, setFilter] = useState('hari'); 
  const [loading, setLoading] = useState(true);
  const [totalTasks, setTotalTasks] = useState(0);

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let query = supabase.from('schedules').select('category, duration, date, is_routine').eq('user_id', user.id);

    const now = new Date();
    let startDate = new Date();
    
    if (filter === 'hari') {
       const todayStr = now.toLocaleDateString('en-CA');
       query = query.or(`date.eq.${todayStr},is_routine.eq.true`); 
    } else {
       if (filter === 'minggu') startDate.setDate(now.getDate() - 7);
       if (filter === 'bulan') startDate.setMonth(now.getMonth() - 1);
       if (filter === 'tahun') startDate.setFullYear(now.getFullYear() - 1);
       const dateStr = startDate.toISOString().split('T')[0];
       query = query.gte('date', dateStr).eq('is_routine', false); 
    }

    const { data: rawData } = await query;

    if (rawData) {
      const categoryMap: Record<string, number> = {};
      let count = 0;
      rawData.forEach((item: any) => {
        const cat = item.category || 'Personal';
        categoryMap[cat] = (categoryMap[cat] || 0) + 1; 
        count++;
      });
      const chartData = Object.keys(categoryMap).map(key => ({ name: key, value: categoryMap[key] }));
      setData(chartData);
      setTotalTasks(count);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [filter]); 

  return (
    <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
      
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        {/* --- UPDATE: TEXT-CENTER (untuk mobile) SM:TEXT-LEFT (untuk desktop) --- */}
        <div className="text-center sm:text-left">
           <h3 className="text-lg font-bold text-gray-800 dark:text-white">Statistik Produktivitas</h3>
           <p className="text-xs text-gray-400">Distribusi kategori kegiatanmu</p>
        </div>
        
        <div className="flex bg-gray-100 p-1 rounded-xl dark:bg-gray-700">
          {['Hari', 'Minggu', 'Bulan'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f.toLowerCase())}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${filter === f.toLowerCase() ? 'bg-white text-indigo-600 shadow-sm dark:bg-gray-600 dark:text-white' : 'text-gray-400 hover:text-gray-600 dark:text-gray-500'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[250px] w-full relative flex items-center justify-center">
        {loading ? (
           <div className="animate-pulse flex flex-col items-center"><div className="h-20 w-20 bg-gray-200 rounded-full mb-2 dark:bg-gray-700"></div><div className="h-4 w-32 bg-gray-200 rounded dark:bg-gray-700"></div></div>
        ) : totalTasks === 0 ? (
           <div className="text-center text-gray-300 dark:text-gray-600"><div className="text-4xl mb-2">📊</div><p className="text-sm">Belum ada data di periode ini</p></div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Legend verticalAlign="bottom" height={36} iconType="circle"/>
            </PieChart>
          </ResponsiveContainer>
        )}
        {!loading && totalTasks > 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-10">
            <span className="text-4xl font-bold text-gray-800 dark:text-white">{totalTasks}</span>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Tugas</span>
          </div>
        )}
      </div>
    </div>
  );
}