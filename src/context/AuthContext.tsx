import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { User, UserProfile } from "@/types";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  tokens: number;
  tier: string;
  login: (user: User) => void;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  consumeToken: () => Promise<boolean>;
  showLoginModal: boolean;
  showPremiumModal: boolean;
  showWelcome: boolean;
  setShowLoginModal: (v: boolean) => void;
  setShowPremiumModal: (v: boolean) => void;
  setShowWelcome: (v: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState(2);
  const [tier, setTier] = useState("Free");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showWelcome, setShowWelcome] = useState(() => {
    try { return !localStorage.getItem("welcome_seen"); } catch { return true; }
  });

  const login = useCallback((user: User) => {
    setUser(user);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    // In production this fetches from /api/auth/me
  }, []);

  const consumeToken = useCallback(async (): Promise<boolean> => {
    const role = (user?.role || "").toLowerCase();
    const currentTier = tier.toLowerCase();

    // Owner/Admin/Titan always pass
    if (role === "owner" || role === "admin" || currentTier === "titan") return true;
    // Paid tiers pass
    if (currentTier !== "free") return true;

    // Free tier — consume token
    try {
      const res = await fetch("/api/tokens-use", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "AI Generation" }),
      });

      const data = await res.json() as { success?: boolean; tokens?: number; isFree?: boolean; error?: string };

      if (res.status === 401) {
        setShowLoginModal(true);
        return false;
      }
      if (res.status === 403) {
        setShowPremiumModal(true);
        return false;
      }
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Token error");
      }

      setTokens(data.tokens || 0);
      return true;
    } catch {
      // If backend unavailable, allow (dev mode)
      if (import.meta.env.DEV) return true;
      return false;
    }
  }, [user, tier]);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile: user?.profile || null,
        isAuthenticated: !!user,
        tokens,
        tier,
        login,
        logout,
        refreshProfile,
        consumeToken,
        showLoginModal,
        showPremiumModal,
        showWelcome,
        setShowLoginModal,
        setShowPremiumModal,
        setShowWelcome,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
