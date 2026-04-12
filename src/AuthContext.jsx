import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from './firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If Firebase is not configured, skip auth entirely
    if (!isFirebaseConfigured || !auth) {
      // Create a mock user for dev mode
      setUser({
        uid: 'dev-user',
        displayName: 'Dev User',
        email: 'dev@stylevault.local',
        photoURL: null,
        // Mock getIdToken for API calls
        getIdToken: async () => 'dev-token',
      });
      setLoading(false);
      console.warn('⚠️ Running without Firebase Auth — using dev user');
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  async function loginWithGoogle() {
    if (!isFirebaseConfigured || !auth || !googleProvider) {
      console.warn('Firebase not configured — cannot sign in');
      return;
    }
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error('Google sign-in failed:', err);
      throw err;
    }
  }

  async function logout() {
    if (!isFirebaseConfigured || !auth) {
      // In dev mode, just reload
      window.location.reload();
      return;
    }
    await signOut(auth);
  }

  // Get the current Firebase ID token for API requests
  async function getIdToken() {
    if (!user) return null;
    return user.getIdToken();
  }

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout, getIdToken, isFirebaseConfigured }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
