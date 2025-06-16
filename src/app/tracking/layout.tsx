// src/app/tracking/layout.tsx
export const metadata = {
  title: "Pastora Tracking",
  description: "Cattle tracking dashboard",
};

import React from "react";
import TrackingWrapper from "@/components/tracking/TrackingWrapper";

export default function TrackingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // still a server component—no hooks or "use client"
  return <TrackingWrapper>{children}</TrackingWrapper>;
}
