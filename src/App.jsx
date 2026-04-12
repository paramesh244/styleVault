import { useState, useEffect, useCallback, useRef } from 'react';
import { IoShirtOutline, IoAddCircle, IoSparkles, IoBookmarkOutline, IoLogOutOutline, IoPersonCircleOutline } from 'react-icons/io5';
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
  { id: 'wardrobe', label: 'Wardrobe', icon: IoShirtOutline },
  { id: 'add', label: 'Add', icon: IoAddCircle },
  { id: 'suggest', label: 'Suggest', icon: IoSparkles },
  { id: 'saved', label: 'Saved', icon: IoBookmarkOutline },
];

export default function App() {
  const { user, loading: authLoading, logout } = useAuth();

  const [activeTab, setActiveTab] = useState('wardrobe');
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

  async function updateApiKeyStatus() {
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

  async function handleLogout() {
    try {
      await logout();
      setClothingCount(0);
      setActiveTab('wardrobe');
    } catch {
      showToast('Failed to sign out', 'error');
    }
  }

  // Auth loading state
  if (authLoading) {
    return (
      <div className="app-shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner spinner--lg" style={{ margin: '0 auto 16px' }} />
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading StyleVault...</div>
        </div>
      </div>
    );
  }

  // Not logged in — show login page
  if (!user) {
    return <LoginPage />;
  }

  function renderPage() {
    switch (activeTab) {
      case 'wardrobe':
        return (
          <WardrobePage
            key={refreshKey}
            onSelectClothing={setSelectedClothing}
            onAddClick={() => setActiveTab('add')}
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
    <div className="app-shell">
      {/* Header */}
      <header className="app-header">
        <div className="app-header__logo">
          <div className="app-header__logo-icon">👔</div>
          <span>StyleVault</span>
        </div>
        <div className="app-header__actions">
          {clothingCount > 0 && (
            <span className="badge" style={{ alignSelf: 'center', marginRight: 4 }}>
              {clothingCount}
            </span>
          )}
          <div 
            onClick={() => setShowProfile(true)} 
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            id="profile-trigger"
          >
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt="Profile"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  border: '2px solid var(--border-light)',
                }}
                title={user.displayName || user.email}
              />
            ) : (
              <div style={{ 
                width: 32, 
                height: 32, 
                borderRadius: '50%', 
                background: 'var(--bg-glass)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                fontSize: '1.2rem'
              }}>
                <IoPersonCircleOutline />
              </div>
            )}
          </div>
          <button
            className="icon-btn"
            onClick={() => setShowProfile(true)}
            title="Sign out"
            id="logout-btn"
            style={{ width: 36, height: 36, fontSize: '1.1rem' }}
          >
            <IoLogOutOutline />
          </button>
        </div>
      </header>
      {/* Main Content */}
      <main className="main-content">
        {renderPage()}
      </main>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            id={`nav-${tab.id}`}
            className={`bottom-nav__item ${activeTab === tab.id ? 'bottom-nav__item--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon className="bottom-nav__item-icon" />
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Modals */}
      {showProfile && (
        <ProfileModal
          onClose={() => {
            setShowProfile(false);
          }}
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
