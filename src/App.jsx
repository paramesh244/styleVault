import { useState, useEffect, useCallback, useRef } from 'react';
import { IoShirtOutline, IoAddCircle, IoSparkles, IoBookmarkOutline } from 'react-icons/io5';
import WardrobePage from './components/WardrobePage';
import AddClothingPage from './components/AddClothingPage';
import SuggestPage from './components/SuggestPage';
import SavedOutfitsPage from './components/SavedOutfitsPage';
import SettingsModal from './components/SettingsModal';
import ClothingDetailModal from './components/ClothingDetailModal';
import Toast from './components/Toast';
import { getSetting, getClothingCount } from './db';
import { getApiKey } from './services/geminiService';

const TABS = [
  { id: 'wardrobe', label: 'Wardrobe', icon: IoShirtOutline },
  { id: 'add', label: 'Add', icon: IoAddCircle },
  { id: 'suggest', label: 'Suggest', icon: IoSparkles },
  { id: 'saved', label: 'Saved', icon: IoBookmarkOutline },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('wardrobe');
  const [showSettings, setShowSettings] = useState(false);
  const [selectedClothing, setSelectedClothing] = useState(null);
  const [toast, setToast] = useState(null);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [clothingCount, setClothingCount] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const hasShownSettings = useRef(false);

  const refreshData = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);

  useEffect(() => {
    checkApiKey();
    updateCount();
  }, []);

  useEffect(() => {
    updateCount();
  }, [refreshKey]);

  async function checkApiKey() {
    const { key } = await getApiKey();
    setHasApiKey(!!key);
  }

  async function updateApiKeyStatus() {
    const { key } = await getApiKey();
    setHasApiKey(!!key);
  }

  async function updateCount() {
    const count = await getClothingCount();
    setClothingCount(count);
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
            onOpenSettings={() => setShowSettings(true)}
            showToast={showToast}
          />
        );
      case 'suggest':
        return (
          <SuggestPage
            key={refreshKey}
            hasApiKey={hasApiKey}
            clothingCount={clothingCount}
            onOpenSettings={() => setShowSettings(true)}
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
      {showSettings && (
        <SettingsModal
          onClose={() => {
            setShowSettings(false);
            updateApiKeyStatus();
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
