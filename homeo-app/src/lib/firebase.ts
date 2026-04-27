import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  User,
  NextOrObserver,
  ConfirmationResult
} from 'firebase/auth';

export { RecaptchaVerifier, signInWithPhoneNumber };
export type { ConfirmationResult };

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const signIn = () => signInWithPopup(auth, googleProvider);
export const firebaseSignOut = () => signOut(auth);

/**
 * Persists the ID token on successful sign-in
 */
export const onAuthChange = (callback: NextOrObserver<User>) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      const token = await user.getIdToken();
      localStorage.setItem("medifollowup_token", token);
    } else {
      localStorage.removeItem("medifollowup_token");
    }
    if (typeof callback === 'function') {
      callback(user);
    } else if (callback && typeof callback.next === 'function') {
      callback.next(user);
    }
  });
};

export default app;
