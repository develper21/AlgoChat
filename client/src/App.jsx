import HomePage from "./pages/HomePage";
import MobileAuthPage from "./pages/MobileAuthPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";
import MediaPage from "./pages/MediaPage";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/useAuthStore";
import { useThemeStore } from "./store/useThemeStore";
import { useEffect } from "react";
import { Loader } from "lucide-react";
import { Toaster } from "react-hot-toast";

const needsProfileSetup = (user) =>
  user && (!user.fullName || !String(user.fullName).trim());

const App = () => {
  const { authUser, checkAuth, isCheckingAuth } = useAuthStore();
  const { theme } = useThemeStore();
  const profileIncomplete = needsProfileSetup(authUser);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isCheckingAuth && !authUser)
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="size-10 animate-spin" />
      </div>
    );

  return (
    <div data-theme={theme} className="h-screen">
      <Routes future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Route
          path="/"
          element={authUser && !profileIncomplete ? <HomePage /> : <Navigate to="/auth" />}
        />
        <Route
          path="/auth"
          element={!authUser || profileIncomplete ? <MobileAuthPage /> : <Navigate to="/" />}
        />
        <Route
          path="/settings"
          element={authUser && !profileIncomplete ? <SettingsPage /> : <Navigate to="/auth" />}
        />
        <Route
          path="/profile"
          element={authUser && !profileIncomplete ? <ProfilePage /> : <Navigate to="/auth" />}
        />
        <Route
          path="/media"
          element={authUser && !profileIncomplete ? <MediaPage /> : <Navigate to="/auth" />}
        />
      </Routes>

      <Toaster />
    </div>
  );
};
export default App;
