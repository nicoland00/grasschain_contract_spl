// src/components/tracking/TrackingWrapper.tsx
"use client";

import React from "react";
import { LoteProvider } from "@/context/tracking/contextLote";
import OverlayLayout from "@/components/tracking/overlayLayout";
import AccessOverlayWrapper from "@/components/tracking/AccessOverlayWrapper";

export default function TrackingWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LoteProvider>
      {/* Este es tu overlay de selección */}
      <AccessOverlayWrapper />
      {/* Luego tu layout de mapa/sidebar/etc */}
      <OverlayLayout>{children}</OverlayLayout>
    </LoteProvider>
  );
}
