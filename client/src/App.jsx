import HomePage from "./pages/HomePage";
import AuthPage from "./pages/AuthPage";
import SignUpPage from "./pages/SignupPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";
import MediaPage from "./pages/MediaPage";
import AuthSync from "./components/AuthSync";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/useAuthStore";
import { useThemeStore } from "./store/useThemeStore";
import { useAuth } from "@clerk/clerk-react";
import { Loader } from "lucide-react";
import { Toaster } from "react-hot-toast";

const needsProfileSetup = (user) =>
  user && (!user.fullName || !String(user.fullName).trim());

const App = () => {
  const { authUser, isCheckingAuth, isSyncing } = useAuthStore();
  const { isLoaded, isSignedIn } = useAuth();
  const { theme } = useThemeStore();
  const profileIncomplete = needsProfileSetup(authUser);

  const isBootstrapping =
    !isLoaded || (isSignedIn && (isCheckingAuth || isSyncing) && !authUser);

  if (isBootstrapping) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="size-10 animate-spin" />
      </div>
    );
  }

  return (
    <div data-theme={theme} className="h-screen">
      <AuthSync />
      <Routes future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Route
          path="/"
          element={
            isSignedIn && authUser && !profileIncomplete ? (
              <HomePage />
            ) : isSignedIn && profileIncomplete ? (
              <Navigate to="/onboarding" />
            ) : (
              <Navigate to="/auth" />
            )
          }
        />
        <Route
          path="/auth/sign-up/*"
          element={!isSignedIn ? <SignUpPage /> : <Navigate to="/" />}
        />
        <Route
          path="/auth/*"
          element={!isSignedIn ? <AuthPage /> : <Navigate to="/" />}
        />
        <Route
          path="/onboarding"
          element={
            isSignedIn && profileIncomplete ? (
              <OnboardingRedirect />
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route
          path="/settings"
          element={
            isSignedIn && authUser && !profileIncomplete ? (
              <SettingsPage />
            ) : (
              <Navigate to="/auth" />
            )
          }
        />
        <Route
          path="/profile"
          element={
            isSignedIn && authUser && !profileIncomplete ? (
              <ProfilePage />
            ) : (
              <Navigate to="/auth" />
            )
          }
        />
        <Route
          path="/media"
          element={
            isSignedIn && authUser && !profileIncomplete ? (
              <MediaPage />
            ) : (
              <Navigate to="/auth" />
            )
          }
        />
      </Routes>

      <Toaster />
    </div>
  );
};

function OnboardingRedirect() {
  const { authUser } = useAuthStore();
  if (authUser?.fullName?.trim()) {
    return <Navigate to="/" />;
  }
  return <Navigate to="/profile" />;
}

export default App;
