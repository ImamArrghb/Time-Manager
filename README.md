# 🚀 One Day: AI Productivity App

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Supabase](https://img.shields.io/badge/Supabase-Database-green)
![Groq AI](https://img.shields.io/badge/AI-Llama3-orange)
![PWA](https://img.shields.io/badge/PWA-Supported-purple)

**One Day** (sebelumnya Time Manager) adalah aplikasi manajemen waktu berbasis **Gamifikasi** dan **Artificial Intelligence**. Aplikasi ini dirancang untuk membantu pengguna mengelola jadwal harian mereka dengan pendekatan "RPG", di mana setiap tugas yang selesai memberikan XP (Experience Points) untuk menaikkan level karakter.

> *"Setiap hari adalah hari pertama kamu."*

## ✨ Fitur Unggulan

- 🎮 **Gamification System**: Dapatkan XP dan naikkan Level (dari *Novice* hingga *Master*) setiap menyelesaikan tugas.
- 🤖 **AI Smart Coach**: Terintegrasi dengan **Llama-3 (via Groq)** yang memberikan saran produktivitas personal berdasarkan jadwalmu.
- 📱 **PWA (Progressive Web App)**: Bisa diinstall langsung di Android, iOS, dan Desktop layaknya aplikasi native.
- 📸 **Dokumentasi Visual**: Upload bukti foto kegiatanmu langsung ke cloud.
- 🔐 **Secure Authentication**: Login aman menggunakan Email Magic Link / Password dengan verifikasi Supabase.
- 🌓 **Dark Mode**: Tampilan responsif yang nyaman di mata.

## 🛠️ Teknologi yang Digunakan

- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS.
- **Language**: TypeScript.
- **Backend & Auth**: Supabase (PostgreSQL).
- **AI Engine**: Groq SDK (Llama-3-8b-8192).
- **Deployment**: Vercel.

## 🚀 Cara Menjalankan Project (Localhost)

Ikuti langkah ini untuk menjalankan aplikasi di komputer kamu:

1. Clone Repository
   ```bash
   git clone [https://github.com/ImamArrghb/Time-Manager.git](https://github.com/ImamArrghb/Time-Manager.git)
   cd nama-repo

2. Install Dependencies
    ```bash
   npm install

3. Setup Environment Variables Buat file .env.local di folder root
    ```bash
   NEXT_PUBLIC_SUPABASE_URL=[https://your-project.supabase.co](https://your-project.supabase.co)
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   GROQ_API_KEY=your-groq-api-key

4. Jalankan Server
    ```bash
   npm run dev
   Buka http://localhost:3000 di browser.

📱 Cara Install di HP (PWA)

Aplikasi ini sudah mendukung PWA. Untuk menginstall:
1. Buka website aplikasi di Chrome (Android) atau Safari (iOS).
2. Android: Klik titik tiga pojok kanan atas -> Pilih "Install App".
3. iOS: Klik tombol Share -> Pilih "Add to Home Screen".

🗄️ Struktur Database (Supabase)

Aplikasi ini membutuhkan tabel todos dan profiles di Supabase.
Table: profiles
1. id (uuid, primary key)
2. email (text)
3. xp (int8)
4. level (text)
5. role (text)

Table: todos
1. id (int8, primary key)
2. user_id (uuid, foreign key)
3. title (text)
4. is_completed (boolean)
5. image_url (text, nullable)

🤝 Kontribusi

Project ini dibuat untuk tujuan pembelajaran dan portofolio. Kritik dan saran sangat diterima!

Dibuat dengan ❤️ oleh Imam 
