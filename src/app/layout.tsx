// src/app/layout.tsx
import "./globals.css";
import { UiLayout } from "@/components/ui/ui-layout";
import { Providers } from "./providers";

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
      <body style={{ letterSpacing: 0.5 }}>
        {/* This is a Server Component, but it's rendering our Client-side wrapper */}
        <Providers>
          <UiLayout>{children}</UiLayout>
        </Providers>
      </body>
    </html>
  );
}
