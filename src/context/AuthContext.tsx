import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  User, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut 
} from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Video } from 'lucide-react';

interface AuthContextType {
  currentUser: User | null;
  userProfile: any | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  if (!auth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-4">
        <div className="max-w-md w-full glass-card p-8 rounded-3xl border border-white/5 shadow-2xl flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-2xl flex items-center justify-center shadow-lg mb-6">
            <Video className="h-8 w-8 text-white" fill="currentColor" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Firebase Configuration Required</h1>
          <p className="text-muted-foreground text-sm mb-6">
            VidNova requires Firebase to be configured. Please add your Firebase credentials to the application environment variables via the Settings menu.
          </p>
          <div className="w-full bg-secondary/50 rounded-xl p-4 text-left border border-white/5">
            <p className="text-xs font-mono text-zinc-300 mb-2">Required variables:</p>
            <ul className="text-xs font-mono text-zinc-400 space-y-1">
              <li>VITE_FIREBASE_API_KEY</li>
              <li>VITE_FIREBASE_AUTH_DOMAIN</li>
              <li>VITE_FIREBASE_PROJECT_ID</li>
              <li>VITE_FIREBASE_STORAGE_BUCKET</li>
              <li>VITE_FIREBASE_MESSAGING_SENDER_ID</li>
              <li>VITE_FIREBASE_APP_ID</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          // Fetch or create user profile
          const userRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(userRef);
          
          if (docSnap.exists()) {
            setUserProfile(docSnap.data());
          } else {
            const newProfile = {
              id: user.uid,
              displayName: user.displayName || 'User',
              email: user.email,
              avatarUrl: user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=800&q=80',
              subscribers: 0,
              verified: false,
              createdAt: new Date().toISOString()
            };
            await setDoc(userRef, newProfile);
            setUserProfile(newProfile);
          }
        } catch (error: any) {
          console.warn("Could not fetch/create user profile in Firestore. Check your Firestore Security Rules:", error);
          // If rules deny access, we can still set basic profile from auth
          setUserProfile({
            id: user.uid,
            displayName: user.displayName || user.email?.split('@')[0] || 'User',
            email: user.email,
            avatarUrl: user.photoURL,
          });
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ currentUser, userProfile, loading, signInWithGoogle, signOut }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
