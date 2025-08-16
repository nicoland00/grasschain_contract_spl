"use client";

import { ReactQueryProvider } from './react-query-provider';
import "mapbox-gl/dist/mapbox-gl.css";
// PRIVY: wrap with MaybePrivy sin quitar legacy providers
import { MaybePrivy } from "@/components/providers/PrivyProviders";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MaybePrivy>
      <ReactQueryProvider>{children}</ReactQueryProvider>
    </MaybePrivy>
  );
}
