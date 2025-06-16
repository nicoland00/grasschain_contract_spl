// app/components/tracking/MapComponent.tsx
"use client";

import React, { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useLote } from "@/context/tracking/contextLote";

// 1) Leaflet default icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "/marker-icon-2x.png",
  iconUrl:       "/marker-icon.png",
  shadowUrl:     "/marker-shadow.png",
});

interface AnimalWithCoords {
  id:     string;
  name:   string;
  lat:    number;
  lng:    number;
  weight?: number | null;
}

interface MapProps {
  sidebarOpen?: boolean;
}

// 2) Random cow icon
function getRandomCowIcon(): L.Icon {
  const imgs = ["/cows/2.png", "/cows/5.png", "/cows/8.png", "/cows/11.png"];
  return L.icon({
    iconUrl:     imgs[Math.floor(Math.random() * imgs.length)],
    iconSize:    [40, 40],
    iconAnchor:  [20, 20],
    popupAnchor: [0, -20],
  });
}

// 3) Zoom buttons (inside MapContainer)
function ZoomControls({ shift }: { shift?: boolean }) {
  const map = useMap();
  const pos = shift ? "left-[285px]" : "left-[15px]";
  return (
    <div className={`absolute top-[90px] z-[9999] p-2 bg-white/75 rounded-lg flex flex-col gap-2 ${pos}`}>
      <button onClick={() => map.zoomIn()} className="w-10 h-10 flex items-center justify-center hover:bg-gray-200">+</button>
      <button onClick={() => map.zoomOut()} className="w-10 h-10 flex items-center justify-center hover:bg-gray-200">−</button>
    </div>
  );
}

// 4) Resize handler (inside MapContainer)
function ResizeHandler({ sidebarOpen }: { sidebarOpen?: boolean }) {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
  }, [sidebarOpen, map]);
  return null;
}

export default function MapComponent({ sidebarOpen }: MapProps) {
  const { selected } = useLote();
  const [center, setCenter]     = useState<[number,number] | null>(null);
  const [animals, setAnimals]   = useState<AnimalWithCoords[]>([]);

  // A) get ranch center
  useEffect(() => {
    if (!selected?.ranchId) return;
    fetch("/api/ixorigue/ranches")
      .then((res) => res.json())
      .then(({ data }) => {
        const ranch = (data ?? []).find((r: any) => r.id === selected.ranchId);
        if (ranch) {
          setCenter([ranch.location.latitude, ranch.location.longitude]);
        }
      })
      .catch(console.error);
  }, [selected]);

  // B) fetch ALL animals, then filter by lotId client-side
  useEffect(() => {
    if (!center || !selected?.lotId) return;
    fetch(`/api/animals/${selected.ranchId}`)
      .then((res) => res.json())
      .then((json) => {
        const list = json.data ?? [];
        console.log("▶️ RAW animals count:", list.length);
        console.log("▶️ selected.lotId:", selected.lotId);
        const filtered = (list as any[])
          .filter((an) => an.lot?.lotId === selected.lotId && an.lastLocation)
          .map((an) => ({
            id:     an.id,
            name:   an.name || an.earTag || "Vaca",
            lat:    an.lastLocation.latitude,
            lng:    an.lastLocation.longitude,
            weight: an.lastWeight?.weight ?? null,
          }));
        console.log("▶️ filtered count:", filtered.length);
        console.log("▶️ filtered IDs:", filtered.map((a) => a.id).slice(0, 20));
        setAnimals(filtered);
      })
      .catch(console.error);
  }, [center, selected]);

  if (!center) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-white">
        Cargando mapa…
      </div>
    );
  }

  return (
    <MapContainer
      center={center}
      zoom={14}
      zoomControl={false}
      className="absolute inset-0"
    >
      {/* Esri Satellite */}
      <TileLayer
        url="https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        crossOrigin="anonymous"
        errorTileUrl="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        opacity={0.5}
      />

      {animals.map((a) => (
        <Marker key={a.id} position={[a.lat, a.lng]} icon={getRandomCowIcon()}>
          <Popup>
            <strong>{a.name}</strong><br />
            {a.weight != null ? `${a.weight} kg` : "Peso desconocido"}
          </Popup>
        </Marker>
      ))}

      <ZoomControls shift={sidebarOpen} />
      <ResizeHandler sidebarOpen={sidebarOpen} />
    </MapContainer>
  );
}
