import { useState } from 'react';
import { IoClose, IoEyeOutline, IoEyeOffOutline, IoCheckmarkCircle, IoOpenOutline, IoTrashOutline, IoLockClosedOutline } from 'react-icons/io5';
import { getSetting, setSetting, clearAllData } from '../db';
import { validateApiKey, resetModel, getApiKey } from '../services/geminiService';

export default function SettingsModal({ onClose, showToast }) {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [validating, setValidating] = useState(false);
  const [isValid, setIsValid] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [keySource, setKeySource] = useState(null);

  // Load existing key
  useState(() => {
    (async () => {
      const { key, source } = await getApiKey();
      if (key) {
        setApiKey(source === 'env' ? '••••••••••••••••••••••••' : key);
        setIsValid(true);
        setKeySource(source);
      }
      setLoaded(true);
    })();
  });

  async function handleSaveKey() {
    if (!apiKey.trim()) {
      showToast('Please enter an API key', 'error');
      return;
    }
    setValidating(true);
    setIsValid(null);
    const valid = await validateApiKey(apiKey.trim());
    setValidating(false);

    if (valid) {
      await setSetting('gemini_api_key', apiKey.trim());
      resetModel();
      setIsValid(true);
      showToast('API key saved & verified! ✨');
    } else {
      setIsValid(false);
      showToast('Invalid API key. Please check and try again.', 'error');
    }
  }

  async function handleClearData() {
    await clearAllData();
    resetModel();
    setApiKey('');
    setIsValid(null);
    setShowClearConfirm(false);
    showToast('All data cleared');
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="modal-handle" />
        <div className="modal-header">
          <h2 className="modal-title">⚙️ Settings</h2>
          <button className="icon-btn" onClick={onClose} id="close-settings">
            <IoClose />
          </button>
        </div>

        {/* API Key Section */}
        <div style={{ marginBottom: 24 }}>
          {keySource === 'env' ? (
            <div style={{
              padding: '16px',
              background: 'rgba(52, 211, 153, 0.1)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(52, 211, 153, 0.2)',
              marginBottom: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              color: 'var(--success)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
                <IoLockClosedOutline /> API Key Configured Securely
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Your Gemini API key is currently loaded from the <code>.env</code> file. To change it, update the <code>VITE_GEMINI_API_KEY</code> variable in your environment.
              </div>
            </div>
          ) : (
            <>
              <div className="input-group">
                <label className="input-label">Gemini API Key</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showKey ? 'text' : 'password'}
                    className="input-field"
                    placeholder="Paste your API key here..."
                    value={apiKey}
                    onChange={(e) => {
                      setApiKey(e.target.value);
                      setIsValid(null);
                    }}
                    id="api-key-input"
                    style={{ paddingRight: 44 }}
                  />
                  <button
                    className="icon-btn"
                    onClick={() => setShowKey(!showKey)}
                    style={{
                      position: 'absolute',
                      right: 4,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 36,
                      height: 36,
                      background: 'none',
                      border: 'none',
                    }}
                  >
                    {showKey ? <IoEyeOffOutline /> : <IoEyeOutline />}
                  </button>
                </div>
                {isValid === true && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, color: 'var(--success)', fontSize: '0.8rem' }}>
                    <IoCheckmarkCircle /> Verified & saved
                  </div>
                )}
                {isValid === false && (
                  <div style={{ marginTop: 6, color: 'var(--error)', fontSize: '0.8rem' }}>
                    Invalid key. Make sure you copied the full key.
                  </div>
                )}
              </div>

              <button
                className="btn btn--primary btn--full"
                onClick={handleSaveKey}
                disabled={validating || !apiKey.trim()}
                id="save-api-key-btn"
              >
                {validating ? (
                  <>
                    <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                    Validating...
                  </>
                ) : (
                  'Save & Verify Key'
                )}
              </button>
            </>
          )}
        </div>

        {/* Get API Key Link */}
        <a
          href="https://aistudio.google.com/apikey"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn--secondary btn--full"
          style={{ marginBottom: 24, textAlign: 'center' }}
        >
          <IoOpenOutline /> Get Free API Key
        </a>

        <div style={{
          padding: 14,
          background: 'var(--bg-glass)',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.8rem',
          color: 'var(--text-muted)',
          lineHeight: 1.6,
          marginBottom: 24,
        }}>
          <strong style={{ color: 'var(--text-secondary)' }}>How to get your free key:</strong>
          <ol style={{ paddingLeft: 18, marginTop: 6 }}>
            <li>Visit <strong>aistudio.google.com/apikey</strong></li>
            <li>Sign in with your Google account</li>
            <li>Click "Create API Key"</li>
            <li>Copy & paste it above</li>
          </ol>
          <p style={{ marginTop: 8 }}>Your key is stored locally on this device only.</p>
        </div>

        <div className="divider" />

        {/* Clear Data */}
        {!showClearConfirm ? (
          <button
            className="btn btn--ghost btn--full"
            onClick={() => setShowClearConfirm(true)}
            style={{ color: 'var(--error)' }}
          >
            <IoTrashOutline /> Clear All Data
          </button>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
              This will delete ALL clothing items, saved outfits, and your API key. This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn btn--secondary"
                onClick={() => setShowClearConfirm(false)}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                className="btn"
                onClick={handleClearData}
                style={{ flex: 1, background: 'var(--error)', color: 'white' }}
              >
                Delete Everything
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
