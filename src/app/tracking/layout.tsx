// Note: **no** "use client" at the top of this file!

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
  // This is now a server component, so it can export metadata,
  // but it must not have "use client".
  return <TrackingWrapper>{children}</TrackingWrapper>;
}
