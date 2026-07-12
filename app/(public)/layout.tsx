import GoogleTag from "@/components/analytics/GoogleTag";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <GoogleTag />
      {children}
    </>
  );
}
