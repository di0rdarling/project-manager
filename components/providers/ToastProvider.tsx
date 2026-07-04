"use client";

import { Toaster } from "react-hot-toast";

export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        className:
          "!rounded-lg !border !border-zinc-200 !bg-white !text-zinc-900 !text-sm dark:!border-zinc-800 dark:!bg-zinc-950 dark:!text-zinc-100",
        success: {
          iconTheme: {
            primary: "#16a34a",
            secondary: "#ffffff",
          },
        },
        error: {
          iconTheme: {
            primary: "#dc2626",
            secondary: "#ffffff",
          },
        },
      }}
    />
  );
}
