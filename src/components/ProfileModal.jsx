import { IoClose, IoMailOutline, IoPersonOutline, IoTrashOutline, IoLogOutOutline, IoShieldCheckmarkOutline } from 'react-icons/io5';
import { useAuth } from '../AuthContext';
import { clearAllData } from '../db';
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
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="modal-handle" />
        <div className="modal-header">
          <h2 className="modal-title">User Profile</h2>
          <button className="icon-btn" onClick={onClose}>
            <IoClose />
          </button>
        </div>

        {/* Profile Info Card */}
        <div className="glass-card" style={{ padding: 24, textAlign: 'center', marginBottom: 24 }}>
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: 16 }}>
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName}
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: '50%',
                  border: '3px solid var(--accent-primary)',
                  padding: 3,
                }}
              />
            ) : (
              <div style={{
                width: 100,
                height: 100,
                borderRadius: '50%',
                background: 'var(--accent-gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2.5rem',
                color: 'white',
              }}>
                {(user?.displayName || user?.email || 'U').charAt(0).toUpperCase()}
              </div>
            )}
            {isFirebaseConfigured && (
              <div style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                background: 'var(--success)',
                color: 'white',
                width: 28,
                height: 28,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid var(--bg-secondary)',
                fontSize: '0.9rem',
              }} title="Verified Account">
                <IoShieldCheckmarkOutline />
              </div>
            )}
          </div>

          <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 4 }}>
            {user?.displayName || 'StyleVault User'}
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <IoMailOutline /> {user?.email}
          </p>
        </div>

        {/* Actions List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="input-label">Account Options</div>
          
          {!showLogoutConfirm ? (
            <button className="btn btn--secondary btn--full" onClick={() => setShowLogoutConfirm(true)} style={{ justifyContent: 'flex-start' }}>
              <IoLogOutOutline style={{ fontSize: '1.2rem' }} /> Sign Out
            </button>
          ) : (
            <div style={{ 
              padding: 16, 
              background: 'var(--bg-glass)', 
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
            }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
                Are you sure you want to sign out?
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn--secondary" style={{ flex: 1 }} onClick={() => setShowLogoutConfirm(false)}>
                  Cancel
                </button>
                <button className="btn" style={{ flex: 1, background: 'var(--accent-primary)', color: 'white' }} onClick={handleLogout}>
                  Confirm
                </button>
              </div>
            </div>
          )}

        </div>

        <div style={{ marginTop: 40, textAlign: 'center' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            StyleVault v1.2.0 • MongoDB Cloud Enabled
          </p>
        </div>
      </div>
    </div>
  );
}
