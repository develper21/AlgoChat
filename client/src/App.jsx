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
import { Loader } from "lucide-react";
import { Toaster } from "react-hot-toast";

const needsProfileSetup = (user) =>
  user && (!user.fullName || !String(user.fullName).trim());

const App = () => {
  const { authUser, isCheckingAuth } = useAuthStore();
  const { theme } = useThemeStore();
  const profileIncomplete = needsProfileSetup(authUser);

  if (isCheckingAuth) {
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
            authUser && !profileIncomplete ? (
              <HomePage />
            ) : authUser && profileIncomplete ? (
              <Navigate to="/onboarding" />
            ) : (
              <Navigate to="/auth" />
            )
          }
        />
        <Route
          path="/auth/sign-up"
          element={!authUser ? <SignUpPage /> : <Navigate to="/" />}
        />
        <Route
          path="/auth"
          element={!authUser ? <AuthPage /> : <Navigate to="/" />}
        />
        <Route
          path="/onboarding"
          element={
            authUser && profileIncomplete ? (
              <OnboardingRedirect />
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route
          path="/settings"
          element={
            authUser && !profileIncomplete ? (
              <SettingsPage />
            ) : (
              <Navigate to="/auth" />
            )
          }
        />
        <Route
          path="/profile"
          element={
            authUser && !profileIncomplete ? (
              <ProfilePage />
            ) : (
              <Navigate to="/auth" />
            )
          }
        />
        <Route
          path="/media"
          element={
            authUser && !profileIncomplete ? (
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
