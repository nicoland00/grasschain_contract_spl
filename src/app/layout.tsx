import "./globals.css";
import { SolanaProvider } from "@/components/solana/solana-provider";
import { UiLayout } from "@/components/ui/ui-layout";
import { ReactQueryProvider } from "./react-query-provider";



export const metadata = {
  title: "Pastora",
  description: "Empowering Sustainable Farming with Blockchain",
  icons: {
    icon: '../public/favicon.ico',
  },
};
<head>
  <link rel="icon" href="/favicon.ico" />
</head>

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{letterSpacing:0.5}}>
        <ReactQueryProvider>
            <SolanaProvider>
              <UiLayout>{children}</UiLayout>
            </SolanaProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
