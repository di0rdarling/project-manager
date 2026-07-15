"use client";

import { PostHogProvider as PHProvider } from "@posthog/react";
import posthog from "posthog-js";
import { useEffect } from "react";

function isPostHogCaptureEnabled(): boolean {
  const flag = process.env.NEXT_PUBLIC_POSTHOG_ENABLED;
  if (flag === "false") return false;
  if (flag === "true") return true;
  return process.env.NODE_ENV === "production";
}

/**
 * Wires up PostHog analytics. Scoped to the public route group only
 * (marketing/landing/auth pages) rather than the app root, since those are
 * the pages we currently want visit/conversion analytics for.
 */
export default function PostHogProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
    if (!key || !isPostHogCaptureEnabled()) return;

    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      defaults: "2026-01-30",
    });
  }, []);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
