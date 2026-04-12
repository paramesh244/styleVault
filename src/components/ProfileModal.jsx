import { useAuth } from '../AuthContext';
import { useState } from 'react';

export default function ProfileModal({ onClose, showToast }) {
  const { user, logout, isFirebaseConfigured } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  async function handleLogout() {
    try {
      await logout();
      onClose();
    } catch (err) {
      showToast('Failed to sign out', 'error');
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-end justify-center transition-opacity p-0">
      <div className="w-full max-w-md bg-white h-[80dvh] rounded-t-3xl overflow-hidden flex flex-col relative animate-[slideUp_300ms_ease-out]">
        
        {/* Handle */}
        <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mt-4 mb-2"></div>
        
        {/* Header Action */}
        <div className="absolute top-4 right-4 z-10">
          <button onClick={onClose} className="w-10 h-10 bg-gray-100 text-gray-500 flex items-center justify-center rounded-full hover:bg-gray-200">
            <iconify-icon icon="lucide:x" class="text-xl"></iconify-icon>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto w-full no-scrollbar px-6 pt-6 pb-12">
          <h2 className="text-3xl font-black editorial-font mb-8">Client <span className="italic">Profile</span></h2>
          
          {/* Profile Details */}
          <div className="flex flex-col items-center justify-center mb-10">
            <div className="relative mb-4">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="w-24 h-24 rounded-full object-cover border-4 border-[#FDFDFD] shadow-lg" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-[#1A1A1A] flex items-center justify-center text-[#C5A059] text-3xl font-black editorial-font shadow-lg">
                  {(user?.displayName || user?.email || 'A').charAt(0).toUpperCase()}
                </div>
              )}
              {isFirebaseConfigured && (
                <div className="absolute bottom-0 right-0 w-7 h-7 bg-[#C5A059] text-white rounded-full flex items-center justify-center border-2 border-white shadow">
                   <iconify-icon icon="lucide:shield-check" class="text-sm"></iconify-icon>
                </div>
              )}
            </div>
            <h3 className="text-xl font-bold text-[#1A1A1A]">{user?.displayName || 'AURA Client'}</h3>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>

          <div className="h-[1px] bg-gray-100 w-full mb-8"></div>

          {/* Actions */}
          <div className="space-y-4">
            <div className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2">Account Management</div>
            
            {!showLogoutConfirm ? (
              <button 
                onClick={() => setShowLogoutConfirm(true)}
                className="w-full h-14 bg-white border border-gray-200 flex items-center justify-between px-6 text-sm font-bold uppercase tracking-widest text-[#1A1A1A] active:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <iconify-icon icon="lucide:log-out" class="text-lg text-gray-400"></iconify-icon>
                  Sign Out
                </div>
                <iconify-icon icon="lucide:chevron-right" class="text-gray-300"></iconify-icon>
              </button>
            ) : (
              <div className="p-5 border border-[#C5A059]/30 bg-[#F8F4EA]">
                <p className="text-sm font-bold text-[#1A1A1A] mb-4 text-center">Are you sure you want to sign out?</p>
                <div className="flex gap-2">
                  <button 
                    className="flex-1 py-3 bg-white border border-gray-200 text-xs font-bold uppercase tracking-widest text-[#1A1A1A]" 
                    onClick={() => setShowLogoutConfirm(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    className="flex-1 py-3 bg-[#1A1A1A] text-white text-xs font-bold uppercase tracking-widest" 
                    onClick={handleLogout}
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <div className="text-center mt-12">
             <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-1">AURA. Intelligence</p>
             <p className="text-xs text-gray-300 italic">v2.0 • Editorial Edition</p>
          </div>

        </div>
      </div>
    </div>
  );
}
