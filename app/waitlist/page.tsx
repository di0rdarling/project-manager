import { Suspense } from "react";
import WaitlistForm from "@/components/views/Waitlist/WaitlistForm";

export default function WaitlistPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-zinc-50 px-4 dark:bg-black">
      <Suspense fallback={null}>
        <WaitlistForm />
      </Suspense>
    </div>
  );
}
