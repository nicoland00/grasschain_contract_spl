"use client";

import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { useLote } from "@/context/tracking/contextLote";

// Configure Mapbox
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;
(mapboxgl as any).setTelemetryEnabled?.(false);

export default function MapComponent({ sidebarOpen }: { sidebarOpen?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const { selected } = useLote();

  // initialize map once
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/nicoland00/cmdol1doo003s01sb9car74qr",
      center: [-3.7038, 40.4168],
      zoom: 8,
      antialias: false,
      failIfMajorPerformanceCaveat: false,
    });

    map.on("load", () => {
      map.resize();
    });

    const handleResize = () => map.resize();
    window.addEventListener("resize", handleResize);

    mapRef.current = map;

    return () => {
      window.removeEventListener("resize", handleResize);
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // center map when ranch changes
  useEffect(() => {
    if (!selected?.ranchId || !mapRef.current) return;

    fetch("/api/ixorigue/ranches")
      .then((res) => res.json())
      .then((json) => {
        const ranch = (json.data || []).find((r: any) => r.id === selected.ranchId);
        if (ranch) {
          mapRef.current!.setCenter([
            ranch.location.longitude,
            ranch.location.latitude,
          ]);
        }
      })
      .catch(console.error);
  }, [selected?.ranchId]);

  // load animal markers for selected lot
  useEffect(() => {
    if (!selected?.ranchId || !selected.lotId || !mapRef.current) return;

    fetch(`/api/lots/${selected.ranchId}/${selected.lotId}`)
      .then((res) => res.json())
      .then((json) => {
        markersRef.current.forEach((m) => m.remove());
        const imgs = ["/cows/2.png", "/cows/5.png", "/cows/8.png", "/cows/11.png"];
        markersRef.current = (json.data || [])
          .filter((a: any) => a.lastLocation)
          .map((a: any) => {
            const el = document.createElement("img");
            el.src = imgs[Math.floor(Math.random() * imgs.length)];
            el.style.width = "40px";
            el.style.height = "40px";
            el.style.transform = "translate(-20px,-20px)";

            const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
              `<strong>${a.name || a.earTag || "Vaca"}</strong><br/>` +
                `${a.lastWeight?.weight != null ? `${a.lastWeight.weight} kg` : "Peso desconocido"}`
            );

            return new mapboxgl.Marker({ element: el })
              .setLngLat([a.lastLocation.longitude, a.lastLocation.latitude])
              .setPopup(popup)
              .addTo(mapRef.current!);
          });
      })
      .catch(console.error);
  }, [selected?.lotId, selected?.ranchId]);

  // resize map when sidebar toggles
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.resize();
    }
  }, [sidebarOpen]);

  return <div ref={containerRef} className="w-full h-full" />;
}
