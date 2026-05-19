import { useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore.js";

export default function AuthSync() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return null;
}
