'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabase';

export default function ProfilePage() {
  const { isDarkMode, toggleTheme } = useTheme();
  const router = useRouter();

  // --- STATE USER ---
  const [user, setUser] = useState({
    id: '', 
    name: 'Loading...',
    email: '',
    role: '',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Loading'
  });

  // --- STATE SETTINGS ---
  const [settings, setSettings] = useState({
    notifications: false,
    emailAlerts: false,
    privateAccount: false,
  });

  // --- STATE MODAL EDIT ---
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', role: '', avatar: '' });
  
  // STATE KHUSUS UPLOAD FOTO
  const [avatarFile, setAvatarFile] = useState<File | null>(null); 
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null); 
  const [uploading, setUploading] = useState(false);

  // --- STATE MODAL PASSWORD ---
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [passForm, setPassForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loadingPass, setLoadingPass] = useState(false);

  // 1. LOAD DATA
  useEffect(() => {
    const loadData = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (authUser) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (profile) {
          const defaultAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${authUser.email}`;
          const userData = {
            id: authUser.id,
            name: profile.name || 'User',
            role: profile.role || 'Mahasiswa CS',
            avatar: profile.avatar || defaultAvatar,
            email: authUser.email || ''
          };
          setUser(userData);
          setEditForm({ 
            name: userData.name, 
            role: userData.role, 
            avatar: userData.avatar 
          });
        }
      }
    };
    loadData();
    
    const savedSettings = localStorage.getItem('user_settings');
    if (savedSettings) setSettings(JSON.parse(savedSettings));
  }, []);

  const handleToggle = (key: string) => {
    const newSettings = { ...settings, [key]: !settings[key as keyof typeof settings] };
    setSettings(newSettings);
    localStorage.setItem('user_settings', JSON.stringify(newSettings));
  };

  // 2. HANDLE FILE SELECTED (PREVIEW)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    if (file.size > 2 * 1024 * 1024) {
      alert("Ukuran file terlalu besar! Maksimal 2MB.");
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  // 3. FUNGSI HAPUS AVATAR (Reset ke Default)
  const handleRemoveAvatar = () => {
    // Kembalikan ke avatar kartun bawaan berdasarkan email
    const defaultAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`;
    
    setEditForm(prev => ({ ...prev, avatar: defaultAvatar })); // Update form state
    setAvatarFile(null); // Batalkan file upload jika ada
    setAvatarPreview(null); // Hapus preview
  };

  // 4. LOGIKA SIMPAN PROFIL
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    
    let finalAvatarUrl = editForm.avatar; 

    // A. Jika ada file baru yang dipilih, UPLOAD dulu
    if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, avatarFile);

        if (uploadError) {
            alert('Gagal upload gambar: ' + uploadError.message);
            setUploading(false);
            return;
        }

        const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);

        finalAvatarUrl = publicUrl;
    }

    // B. Update Data ke Tabel Profiles
    const { error } = await supabase
      .from('profiles')
      .update({
        name: editForm.name,
        role: editForm.role,
        avatar: finalAvatarUrl
      })
      .eq('id', user.id);

    if (!error) {
      setUser(prev => ({ 
        ...prev, 
        name: editForm.name, 
        role: editForm.role,
        avatar: finalAvatarUrl 
      }));
      setIsEditModalOpen(false);
      setAvatarFile(null);
      setAvatarPreview(null);
      alert('✅ Profil berhasil diperbarui!');
    } else {
      alert('❌ Gagal update database: ' + error.message);
    }
    setUploading(false);
  };

  // 5. GANTI PASSWORD
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingPass(true);
    if (passForm.newPassword !== passForm.confirmPassword) {
      alert('⚠️ Password baru dan konfirmasi tidak sama.'); setLoadingPass(false); return;
    }
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: user.email, password: passForm.oldPassword });
    if (signInError) { alert('❌ Password lama salah!'); setLoadingPass(false); return; }
    const { error: updateError } = await supabase.auth.updateUser({ password: passForm.newPassword });
    if (updateError) { alert('❌ Gagal: ' + updateError.message); } 
    else { alert('✅ Password berhasil diubah!'); setIsPassModalOpen(false); setPassForm({ oldPassword: '', newPassword: '', confirmPassword: '' }); }
    setLoadingPass(false);
  };

  const handleLogout = async () => {
    if (confirm('Yakin ingin keluar?')) { await supabase.auth.signOut(); router.push('/login'); }
  };

  return (
    <div className="min-h-screen pb-24 transition-colors duration-300 bg-gray-50 text-gray-800 dark:bg-gray-900 dark:text-gray-100">
      
      <div className="px-6 pt-12 relative z-20">
        <div className="rounded-3xl p-6 shadow-xl mb-6 transition-colors duration-300 bg-white dark:bg-gray-800 dark:border dark:border-gray-700">
          
          {/* HEADER PROFIL */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="relative group cursor-pointer" onClick={() => setIsEditModalOpen(true)}>
              <img 
                src={user.avatar} 
                alt="Profile" 
                className="w-24 h-24 rounded-full border-4 border-indigo-50 dark:border-gray-700 shadow-lg mb-3 group-hover:scale-105 transition-transform bg-white object-cover"
              />
              <div className="absolute bottom-3 right-0 bg-indigo-600 text-white p-1.5 rounded-full shadow-md text-xs border-2 border-white dark:border-gray-800">✏️</div>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{user.name}</h2>
            <p className="text-indigo-500 font-medium text-sm">{user.role}</p>
            <p className="text-gray-400 text-xs mt-1 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">{user.email}</p>
            
            <button 
              onClick={() => setIsEditModalOpen(true)}
              className="mt-4 px-6 py-2 rounded-full bg-indigo-600 text-white text-sm font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition dark:shadow-none"
            >
              Edit Profil
            </button>
          </div>

          {/* SETTINGS LIST */}
          <div className="space-y-6">
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-2">Tampilan</h3>
              <div className="rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 dark:bg-gray-700 dark:border-gray-600">
                <div className="flex items-center justify-between p-4 border-b border-gray-200/10">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🌙</span>
                    <div><p className="font-bold text-sm">Mode Gelap</p><p className="text-xs text-gray-400">Ganti tema aplikasi</p></div>
                  </div>
                  <ToggleSwitch checked={isDarkMode} onChange={toggleTheme} />
                </div>
              </div>
            </div>

            <div>
               <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-2">Keamanan</h3>
               <div className="rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 dark:bg-gray-700 dark:border-gray-600">
                  <button onClick={() => setIsPassModalOpen(true)} className="w-full flex items-center justify-between p-4 hover:bg-black/5 dark:hover:bg-white/5 transition text-left">
                    <div className="flex items-center gap-3"><span className="text-xl">🔑</span><div><p className="font-bold text-sm">Ubah Password</p><p className="text-xs text-gray-400">Amankan akun Anda</p></div></div>
                    <span className="text-gray-400 text-lg">›</span>
                  </button>
               </div>
            </div>

            <button onClick={handleLogout} className="w-full py-4 mt-4 text-red-500 font-bold bg-red-50 hover:bg-red-100 rounded-2xl transition dark:bg-red-900/20 dark:hover:bg-red-900/30">Keluar Akun</button>
            <div className="text-center text-xs text-gray-300 mt-4 pb-4">App v2.5 Avatar Manager</div>
          </div>
        </div>
      </div>

      {/* --- MODAL EDIT PROFIL (DENGAN UPLOAD & HAPUS FOTO) --- */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in duration-200 bg-white dark:bg-gray-800 dark:text-white max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Edit Profil</h3>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              
              {/* AREA AVATAR */}
              <div className="flex flex-col items-center justify-center mb-4">
                <div className="relative">
                    {/* Pembungkus Label Upload */}
                    <label className="relative cursor-pointer group inline-block">
                        <img 
                            src={avatarPreview || editForm.avatar} 
                            className="w-24 h-24 rounded-full object-cover border-4 border-gray-100 dark:border-gray-700 group-hover:opacity-80 transition"
                            alt="Preview"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full opacity-0 group-hover:opacity-100 transition text-white font-bold text-xs">
                            Ganti
                        </div>
                        <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={handleFileChange}
                        />
                    </label>

                    {/* TOMBOL HAPUS (Hanya muncul jika bukan gambar default DiceBear) */}
                    {(avatarPreview || (editForm.avatar && !editForm.avatar.includes('dicebear'))) && (
                        <button
                            type="button"
                            onClick={handleRemoveAvatar}
                            className="absolute -bottom-1 -right-1 bg-red-500 text-white p-2 rounded-full shadow-md hover:bg-red-600 transition border-2 border-white dark:border-gray-800"
                            title="Hapus Foto & Pakai Default"
                        >
                            {/* Icon Sampah */}
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    )}
                </div>
                <p className="text-xs text-gray-400 mt-2">Klik foto untuk ganti, atau ikon sampah untuk hapus.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1 dark:text-gray-400">Nama Lengkap</label>
                <input 
                  type="text" 
                  className="w-full p-3 rounded-xl border focus:outline-indigo-500 bg-gray-50 border-gray-200 dark:bg-gray-700 dark:border-gray-600"
                  value={editForm.name}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1 dark:text-gray-400">Role</label>
                <input 
                  type="text" 
                  className="w-full p-3 rounded-xl border focus:outline-indigo-500 bg-gray-50 border-gray-200 dark:bg-gray-700 dark:border-gray-600"
                  value={editForm.role}
                  onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                />
              </div>
              
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition dark:bg-gray-700 dark:text-gray-300">Batal</button>
                <button 
                    type="submit" 
                    disabled={uploading}
                    className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-lg transition disabled:opacity-50"
                >
                    {uploading ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL UBAH PASSWORD --- */}
      {isPassModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in duration-200 bg-white dark:bg-gray-800 dark:text-white">
            <h3 className="text-lg font-bold mb-4">🔑 Ganti Password</h3>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div><label className="block text-xs font-bold mb-1">Password Lama</label><input required type="password" className="w-full p-3 rounded-xl border bg-gray-50 dark:bg-gray-700 dark:border-gray-600" value={passForm.oldPassword} onChange={(e) => setPassForm({...passForm, oldPassword: e.target.value})} /></div>
              <div><label className="block text-xs font-bold mb-1">Password Baru</label><input required type="password" className="w-full p-3 rounded-xl border bg-gray-50 dark:bg-gray-700 dark:border-gray-600" value={passForm.newPassword} onChange={(e) => setPassForm({...passForm, newPassword: e.target.value})} /></div>
              <div><label className="block text-xs font-bold mb-1">Konfirmasi</label><input required type="password" className="w-full p-3 rounded-xl border bg-gray-50 dark:bg-gray-700 dark:border-gray-600" value={passForm.confirmPassword} onChange={(e) => setPassForm({...passForm, confirmPassword: e.target.value})} /></div>
              <div className="flex gap-3 pt-4"><button type="button" onClick={() => setIsPassModalOpen(false)} className="flex-1 py-3 rounded-xl bg-gray-100">Batal</button><button type="submit" disabled={loadingPass} className="flex-1 py-3 rounded-xl bg-indigo-600 text-white">{loadingPass ? '...' : 'Simpan'}</button></div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <div onClick={onChange} className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${checked ? 'bg-indigo-600' : 'bg-gray-300'}`}>
      <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${checked ? 'translate-x-6' : 'translate-x-0'}`} />
    </div>
  );
}