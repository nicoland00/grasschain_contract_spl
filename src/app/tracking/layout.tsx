// src/app/tracking/layout.tsx
// **no** "use client" here

export const metadata = {
  title: "Pastora Tracking",
  description: "Cattle tracking dashboard",
};

import React from "react";
import "leaflet/dist/leaflet.css";
import TrackingWrapper from "@/components/tracking/TrackingWrapper";

export default function TrackingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // still a server component: no hooks or "use client"
  return <TrackingWrapper>{children}</TrackingWrapper>;
}
