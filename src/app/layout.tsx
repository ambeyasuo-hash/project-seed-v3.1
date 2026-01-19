import "./globals.css";

export const metadata = {
  title: "Project SEED v3.1",
  description: "Restaurant Management System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}