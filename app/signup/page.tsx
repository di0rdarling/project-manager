import { Suspense } from "react";
import SignupForm from "@/components/views/Signup/SignupForm";

export default function SignupPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-zinc-50 px-4 dark:bg-black">
      <Suspense fallback={null}>
        <SignupForm />
      </Suspense>
    </div>
  );
}
