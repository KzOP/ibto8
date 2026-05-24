import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendEmailVerification,
  onAuthStateChanged,
  reload,
  User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { createStudentProfile, getStudentProfile } from "@/lib/firestore";

export interface SignUpData {
  email: string;
  password: string;
  name?: string;
  phoneNumber?: string;
  country?: string;
}

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  isAdmin: boolean;
  emailVerified: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (data: SignUpData) => Promise<void>;
  signOut: () => Promise<void>;
  resendVerification: () => Promise<void>;
  refreshUser: () => Promise<void>;
  firebaseError: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

const ADMIN_EMAILS = ["admin@ibtiaathi.sa", "admin@test.com"];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [firebaseError, setFirebaseError] = useState(false);

  const isAdmin = currentUser ? ADMIN_EMAILS.includes(currentUser.email ?? "") : false;
  const emailVerified = currentUser?.emailVerified ?? false;

  useEffect(() => {
    try {
      const unsubscribe = onAuthStateChanged(
        auth,
        (user) => {
          setCurrentUser(user);
          setLoading(false);
        },
        (error) => {
          console.error("Auth error:", error);
          setFirebaseError(true);
          setLoading(false);
        }
      );
      return unsubscribe;
    } catch {
      setFirebaseError(true);
      setLoading(false);
      return undefined;
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      if (err.code?.includes("auth/")) throw err;
      setFirebaseError(true);
      throw new Error("لم يتم إعداد Firebase بعد.");
    }
  };

  const signUp = async ({ email, password, name, phoneNumber, country }: SignUpData) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const user = cred.user;

      await sendEmailVerification(user);

      const existingProfile = await getStudentProfile(user.uid);
      if (!existingProfile) {
        await createStudentProfile(user.uid, {
          uid: user.uid,
          email,
          name: name ?? "",
          phoneNumber: phoneNumber ?? "",
          country: country ?? "",
          grades: {},
          tests: [],
          internationalTests: [],
          emailVerified: false,
        });
      }
    } catch (err: any) {
      if (err.code?.includes("auth/")) throw err;
      setFirebaseError(true);
      throw new Error("حدث خطأ أثناء إنشاء الحساب.");
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  const resendVerification = async () => {
    if (!currentUser) throw new Error("لا يوجد مستخدم مسجّل الدخول");
    await sendEmailVerification(currentUser);
  };

  const refreshUser = async () => {
    if (!currentUser) return;
    await reload(currentUser);
    setCurrentUser({ ...currentUser });
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        isAdmin,
        emailVerified,
        signIn,
        signUp,
        signOut,
        resendVerification,
        refreshUser,
        firebaseError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
