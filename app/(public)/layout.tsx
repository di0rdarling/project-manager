import { Analytics } from "@vercel/analytics/react";
import GoogleTag from "@/components/analytics/GoogleTag";
import PostHogProvider from "@/components/analytics/PostHogProvider";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <PostHogProvider>
      <GoogleTag />
      {children}
      <Analytics />
    </PostHogProvider>
  );
}
