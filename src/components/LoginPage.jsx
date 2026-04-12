import { useState } from 'react';
import { useAuth } from '../AuthContext';

export default function LoginPage() {
  const { loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleGoogleLogin() {
    setLoading(true);
    setError(null);
    try {
      await loginWithGoogle();
    } catch (err) {
      setError('Sign-in failed. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      {/* Animated background orbs */}
      <div className="login-page__orb login-page__orb--1" />
      <div className="login-page__orb login-page__orb--2" />
      <div className="login-page__orb login-page__orb--3" />

      <div className="login-page__content">
        {/* Logo */}
        <div className="login-page__logo">
          <div className="login-page__logo-icon">👔</div>
          <h1 className="login-page__title">StyleVault</h1>
          <p className="login-page__subtitle">
            Your AI-powered personal wardrobe
          </p>
        </div>

        {/* Features */}
        <div className="login-page__features">
          <div className="login-page__feature">
            <span className="login-page__feature-icon">📸</span>
            <span>AI clothing analysis</span>
          </div>
          <div className="login-page__feature">
            <span className="login-page__feature-icon">✨</span>
            <span>Smart outfit suggestions</span>
          </div>
          <div className="login-page__feature">
            <span className="login-page__feature-icon">☁️</span>
            <span>Cloud synced wardrobe</span>
          </div>
        </div>

        {/* Sign In Button */}
        <button
          className="login-page__google-btn"
          onClick={handleGoogleLogin}
          disabled={loading}
          id="google-sign-in-btn"
        >
          {loading ? (
            <>
              <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
              Signing in...
            </>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </>
          )}
        </button>

        {error && (
          <div style={{
            marginTop: 12,
            padding: '10px 16px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(248, 113, 113, 0.1)',
            border: '1px solid rgba(248, 113, 113, 0.2)',
            color: 'var(--error)',
            fontSize: '0.85rem',
            textAlign: 'center',
          }}>
            {error}
          </div>
        )}

        <p className="login-page__privacy">
          Your data is encrypted and stored securely in the cloud.
          <br />Only you can access your wardrobe.
        </p>
      </div>
    </div>
  );
}
