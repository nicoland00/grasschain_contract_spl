// src/components/tracking/AccessOverlayWrapper.tsx
"use client";
import dynamic from "next/dynamic";

const AccessOverlayDynamic = dynamic(
  () => import("@/components/tracking/AccessOverlay"),
  { ssr: false }
);

export default function AccessOverlayWrapper() {
  return <AccessOverlayDynamic />;
}
