import { SignIn } from "@clerk/clerk-react";
import AuthImagePattern from "../components/AuthImagePattern";

export default function AuthPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="flex flex-col justify-center items-center p-6 sm:p-12">
        <SignIn
          routing="path"
          path="/auth"
          signUpUrl="/auth/sign-up"
          forceRedirectUrl="/"
          appearance={{
            elements: {
              rootBox: "w-full max-w-md",
              card: "shadow-none bg-transparent",
            },
          }}
        />
      </div>

      <AuthImagePattern
        title="Connect Instantly"
        subtitle="Sign in with Google or Apple to start chatting with friends and family."
      />
    </div>
  );
}
