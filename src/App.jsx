import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import LoginPage from './components/LoginPage';
import WardrobePage from './components/WardrobePage';
import AddClothingPage from './components/AddClothingPage';
import SuggestPage from './components/SuggestPage';
import SavedOutfitsPage from './components/SavedOutfitsPage';
import ProfileModal from './components/ProfileModal';
import ClothingDetailModal from './components/ClothingDetailModal';
import Toast from './components/Toast';
import { getClothingCount } from './db';
import { getApiKey } from './services/geminiService';

const TABS = [
  { id: 'wardrobe', label: 'Vault', icon: 'lucide:layout-grid' },
  { id: 'suggest', label: 'Suggest', icon: 'lucide:sparkles' },
  { id: 'saved', label: 'Saved', icon: 'lucide:bookmark' },
];

export default function App() {
  const { user, loading: authLoading, logout } = useAuth();

  const [activeTab, setActiveTab] = useState('wardrobe'); // wardrobe, add, suggest, saved
  const [showProfile, setShowProfile] = useState(false);
  const [selectedClothing, setSelectedClothing] = useState(null);
  const [toast, setToast] = useState(null);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [clothingCount, setClothingCount] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshData = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);

  useEffect(() => {
    if (user) {
      checkApiKey();
      updateCount();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      updateCount();
    }
  }, [refreshKey, user]);

  async function checkApiKey() {
    const { key } = await getApiKey();
    setHasApiKey(!!key);
  }

  async function updateCount() {
    try {
      const count = await getClothingCount();
      setClothingCount(count);
    } catch {
      setClothingCount(0);
    }
  }

  function showToast(message, type = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  function handleClothingAdded() {
    refreshData();
    setActiveTab('wardrobe');
    showToast('Clothing item added! ✨');
  }

  function handleClothingDeleted() {
    setSelectedClothing(null);
    refreshData();
    showToast('Item removed from wardrobe');
  }

  // Auth loading state
  if (authLoading) {
    return (
      <div className="w-full max-w-md mx-auto min-h-screen bg-[#FDFDFD] flex items-center justify-center">
        <div className="text-center flex flex-col items-center">
          <div className="spinner spinner--lg mb-4" />
          <div className="text-gray-400 text-xs uppercase tracking-widest font-bold">Loading AURA...</div>
        </div>
      </div>
    );
  }

  // Not logged in — show login page
  if (!user) {
    return (
      <div className="w-full max-w-md mx-auto h-[100dvh] bg-[#FDFDFD] relative overflow-hidden flex flex-col">
        <LoginPage />
      </div>
    );
  }

  function renderPage() {
    switch (activeTab) {
      case 'wardrobe':
        return (
          <WardrobePage
            key={refreshKey}
            onSelectClothing={setSelectedClothing}
            onAddClick={() => setActiveTab('add')}
            clothingCount={clothingCount}
          />
        );
      case 'add':
        return (
          <AddClothingPage
            onClothingAdded={handleClothingAdded}
            hasApiKey={hasApiKey}
            onOpenSettings={() => setShowProfile(true)}
            showToast={showToast}
          />
        );
      case 'suggest':
        return (
          <SuggestPage
            key={refreshKey}
            hasApiKey={hasApiKey}
            clothingCount={clothingCount}
            onOpenSettings={() => setShowProfile(true)}
            onAddClick={() => setActiveTab('add')}
            showToast={showToast}
          />
        );
      case 'saved':
        return (
          <SavedOutfitsPage
            key={refreshKey}
            showToast={showToast}
          />
        );
      default:
        return null;
    }
  }

  return (
    <div className="w-full max-w-md mx-auto h-[100dvh] bg-[#FDFDFD] flex flex-col relative overflow-hidden">
      
      {/* Header Nav */}
      <header className="shrink-0 pt-14 px-6 flex justify-between items-center bg-white/95 backdrop-blur-md z-40">
        <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('wardrobe'); }} className="text-2xl font-black tracking-tighter italic editorial-font">
          AURA<span className="text-[#C5A059]">.</span>
        </a>
        <button 
          onClick={() => setShowProfile(true)} 
          className="w-10 h-10 flex flex-col items-center justify-center gap-1 group" 
          aria-label="Profile"
        >
           {user?.photoURL ? (
             <img src={user.photoURL} alt="Profile" className="w-8 h-8 rounded-full object-cover border border-gray-200" />
           ) : (
             <iconify-icon icon="lucide:user" class="text-2xl text-gray-800"></iconify-icon>
           )}
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto no-scrollbar relative">
        {renderPage()}
      </main>

      {/* Floating Add Button (only show if not on 'add' tab) */}
      {activeTab !== 'add' && (
        <button 
          onClick={() => setActiveTab('add')}
          className="absolute bottom-28 right-6 z-50 w-14 h-14 bg-[#1A1A1A] text-white rounded-full flex items-center justify-center shadow-2xl transition-transform active:scale-95 border border-[#C5A059]/30"
        >
          <iconify-icon icon="lucide:plus" class="text-2xl"></iconify-icon>
        </button>
      )}

      {/* Bottom Navigation */}
      <nav className="shrink-0 h-[84px] bg-white border-t border-gray-100 flex items-center justify-around px-4 pb-[34px] z-50">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-[#C5A059]' : 'text-gray-400 hover:text-[#1A1A1A]'}`}
            >
              <iconify-icon icon={tab.icon} class="text-xl"></iconify-icon>
              <span className={`text-[8px] uppercase tracking-widest ${isActive ? 'font-bold' : 'font-semibold'}`}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </nav>

      {/* Modals */}
      {showProfile && (
        <ProfileModal
          onClose={() => setShowProfile(false)}
          showToast={showToast}
        />
      )}

      {selectedClothing && (
        <ClothingDetailModal
          clothing={selectedClothing}
          onClose={() => setSelectedClothing(null)}
          onDelete={handleClothingDeleted}
          showToast={showToast}
        />
      )}

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}
