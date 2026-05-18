import { SignUp } from "@clerk/clerk-react";
import AuthImagePattern from "../components/AuthImagePattern";

export default function SignUpPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="flex flex-col justify-center items-center p-6 sm:p-12">
        <SignUp
          routing="path"
          path="/auth/sign-up"
          signInUrl="/auth"
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
        title="Join AlgoChat"
        subtitle="Create your account with Google or Apple and start chatting instantly."
      />
    </div>
  );
}
