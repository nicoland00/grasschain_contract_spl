"use client";

import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { useLote } from "@/context/tracking/contextLote";
import "mapbox-gl/dist/mapbox-gl.css";

// Explicitly set Mapbox access token
mapboxgl.accessToken =
  "pk.eyJ1Ijoibmljb2xhbmQwMCIsImEiOiJjbWRwbm84NGcwZzRkMmpzOHM2dGc5NTA3In0.ypUF5A-pit_YVraEp8YQOQ";

export default function MapComponent({ sidebarOpen }: { sidebarOpen?: boolean }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<mapboxgl.Map | null>(null);
  const { selected } = useLote();
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  // Create or update the map center based on the selected ranch
  useEffect(() => {
    if (!selected?.ranchId) return;

    fetch("/api/ixorigue/ranches")
      .then((res) => res.json())
      .then((json) => {
        const ranch = (json.data || []).find((r: any) => r.id === selected.ranchId);
        if (!ranch) return;

        const center: [number, number] = [ranch.location.longitude, ranch.location.latitude];

        if (!mapInstance.current && mapRef.current) {
          mapInstance.current = new mapboxgl.Map({
            container: mapRef.current,
            style: "mapbox://styles/nicoland00/cmdol1doo003s01sb9car74qr",
            center,
            zoom: 13,
          });
          mapInstance.current.addControl(new mapboxgl.NavigationControl(), "top-left");
        } else if (mapInstance.current) {
          mapInstance.current.setCenter(center);
        }
      })
      .catch(console.error);
  }, [selected]);

  // Load animals for the selected lot and display them as markers
  useEffect(() => {
    if (!selected?.ranchId || !selected.lotId) return;
    if (!mapInstance.current) return;

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
              .addTo(mapInstance.current!);
          });
      })
      .catch(console.error);
  }, [selected]);

  // Resize map when the sidebar toggles
  useEffect(() => {
    if (mapInstance.current) {
      mapInstance.current.resize();
    }
  }, [sidebarOpen]);

  return <div ref={mapRef} className="absolute inset-0 z-0" />;
}
