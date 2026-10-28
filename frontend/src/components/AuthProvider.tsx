//frontend/src/components/AuthProvider.tsx
import { createContext, useContext, useEffect } from "react";
import { useAuth } from "../store/useAuth";

const AuthContext = createContext(null);
export const useAuthProvider = () => useContext(AuthContext);

export function AuthProvider({ children }: any) {
  const auth = useAuth();

  // Restore session on app start
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      auth.fetchProfile();
    } else {
      auth.logout(); // ensure clean state
    }
  }, [auth]);

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}
