// src/app/layout.tsx
import "./globals.css";
import { Providers } from "./providers";
import AuthGuard from "@/components/auth/AuthGuard";
import { UiLayout } from "@/components/ui/ui-layout";

export const metadata = {
  title: "Pastora",
  description: "Empowering Sustainable Farming with Blockchain",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen">
        <Providers>
          <AuthGuard>
            <UiLayout>{children}</UiLayout>
          </AuthGuard>
        </Providers>
      </body>
    </html>
  );
}
