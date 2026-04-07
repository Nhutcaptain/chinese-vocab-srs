import type { Metadata } from "next";
import "./globals.css";
import { UserProvider } from "@/lib/contexts/UserContext";
import { LoginGuard } from "@/components/LoginGuard";

export const metadata: Metadata = {
  title: "Chinese SRS - Học tiếng Trung hiệu quả",
  description: "Ứng dụng ôn tập từ vựng tiếng Trung với Flashcards, Quiz và Rapid Typing.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="font-sans antialiased selection:bg-indigo-100 selection:text-indigo-900">
        <UserProvider>
          <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
          <LoginGuard>
            <main className="min-h-screen container mx-auto px-4 py-8">
              {children}
            </main>
          </LoginGuard>
        </UserProvider>
      </body>
    </html>
  );
}

