"use client";

import { PrivyProvider } from '@privy-io/react-auth';
import { ReactQueryProvider } from './react-query-provider';
import "mapbox-gl/dist/mapbox-gl.css";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}>
      <ReactQueryProvider>{children}</ReactQueryProvider>
    </PrivyProvider>
  );
}
