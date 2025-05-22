// src/app/layout.tsx
import "./globals.css";
import { Providers } from "./providers";
import AuthGuard from "@/components/auth/AuthGuard";
import { UiLayout } from "@/components/ui/ui-layout";

// ← import the Toaster here
import { Toaster } from "react-hot-toast";

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
            <UiLayout>
              {/* ← mount your Toaster once at the top level */}
              <Toaster position="top-right" />
              {children}
            </UiLayout>
          </AuthGuard>
        </Providers>
      </body>
    </html>
  );
}
