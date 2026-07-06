import { Suspense } from "react";
import LoginForm from "@/components/views/Login/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-zinc-50 px-4 dark:bg-black">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
