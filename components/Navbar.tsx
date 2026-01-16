'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();

  // 👇 LOGIKA BARU: Sembunyikan Navbar jika sedang di halaman Login
  if (pathname === '/login') {
    return null;
  }

  // Daftar Menu Navigasi
  const navItems = [
    { 
      name: 'Hari Ini', 
      href: '/today', 
      icon: (active: boolean) => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    { 
      name: 'Mingguan', 
      href: '/week', 
      icon: (active: boolean) => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    { 
      name: 'Profil', 
      href: '/profile', 
      icon: (active: boolean) => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    },
  ];

  return (
    <nav className="fixed bottom-0 w-full z-50 bg-white border-t border-gray-100 dark:bg-gray-800 dark:border-gray-700 transition-colors duration-300 pb-safe">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto">
        
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);

          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors duration-200 
                ${isActive 
                  ? 'text-indigo-600 dark:text-indigo-400' 
                  : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'
                }`}
            >
              {item.icon(isActive)}
              <span className="text-[10px] font-medium">
                {item.name}
              </span>
            </Link>
          );
        })}

      </div>
    </nav>
  );
}