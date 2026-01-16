import type { Metadata, Viewport } from "next"; // 1. Tambahkan import Viewport
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";

// Import Navbar
import Navbar from "@/components/Navbar"; 

const inter = Inter({ subsets: ["latin"] });

// 2. Metadata (Hanya untuk Judul, Deskripsi, Manifest)
export const metadata: Metadata = {
  title: "Day One",
  description: "Manajemen waktu dengan bantuan AI",
  manifest: "/manifest.json", 
};

// 3. Viewport (PISAHKAN KE SINI - Untuk PWA & Tampilan Mobile)
export const viewport: Viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Mencegah zoom cubit biar terasa seperti aplikasi native
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 dark:bg-gray-900 transition-colors duration-300`}>
        
        <ThemeProvider>
          {/* Main Content */}
          <main className="min-h-screen pb-20"> 
            {children}
          </main>

          {/* Navbar tetap di sini */}
          <Navbar />
          
        </ThemeProvider>

      </body>
    </html>
  );
}