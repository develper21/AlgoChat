import { useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { registerAuthHandlers } from "../lib/token.js";
import { useAuthStore } from "../store/useAuthStore.js";

export default function AuthSync() {
  const { isLoaded, isSignedIn, getToken, signOut } = useAuth();
  const { syncUser, clearAuth } = useAuthStore();

  useEffect(() => {
    registerAuthHandlers({ getToken, signOut });
  }, [getToken, signOut]);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      clearAuth();
      return;
    }

    syncUser();
  }, [isLoaded, isSignedIn, syncUser, clearAuth]);

  return null;
}
