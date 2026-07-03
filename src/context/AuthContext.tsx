"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { onAuthStateChanged, signInWithPopup, signOut, User } from "firebase/auth";
import { fbAuth, googleProvider } from "@/lib/firebase";

interface AuthCtx {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  logOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({
  user: null,
  loading: true,
  signIn: async () => {},
  logOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(fbAuth(), (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  const signIn = async () => {
    await signInWithPopup(fbAuth(), googleProvider());
  };

  const logOut = async () => {
    await signOut(fbAuth());
  };

  return <Ctx.Provider value={{ user, loading, signIn, logOut }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
