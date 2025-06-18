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

// 2) Random cow icon
function getRandomCowIcon(): L.Icon {
  const imgs = ["/cows/2.png","/cows/5.png","/cows/8.png","/cows/11.png"];
  return L.icon({
    iconUrl:     imgs[Math.floor(Math.random()*imgs.length)],
    iconSize:    [40,40],
    iconAnchor:  [20,20],
    popupAnchor: [0,-20],
  });
}

// 3) Zoom + resize helpers
function ZoomControls({ shift }: { shift?: boolean }) {
  const map = useMap();
  const pos = shift ? "left-[285px]" : "left-[15px]";
  return (
    <div className={`absolute top-[90px] z-[9999] p-2 bg-white/75 rounded-lg flex flex-col gap-2 ${pos}`}>
      <button onClick={()=>map.zoomIn()} className="w-10 h-10 flex items-center justify-center hover:bg-gray-200">+</button>
      <button onClick={()=>map.zoomOut()}className="w-10 h-10 flex items-center justify-center hover:bg-gray-200">−</button>
    </div>
  );
}
function ResizeHandler({ sidebarOpen }: { sidebarOpen?: boolean }) {
  const map = useMap();
  useEffect(() => { map.invalidateSize(); }, [sidebarOpen, map]);
  return null;
}

export default function MapComponent({ sidebarOpen }: { sidebarOpen?: boolean }) {
  const { selected } = useLote();
  const [center, setCenter] = useState<[number,number] | null>(null);
  const [animals,setAnimals] = useState<any[]>([]);

  // A) ranch center
  useEffect(() => {
    if(!selected?.ranchId) return;
    fetch("/api/ixorigue/ranches")
      .then(r=>r.json())
      .then(json=>{
        const ranch = (json.data||[]).find((r:any)=>r.id===selected.ranchId);
        if(ranch) setCenter([ranch.location.latitude, ranch.location.longitude]);
      })
      .catch(console.error);
  },[selected]);

  // B) all animals → filter by selected lot
  useEffect(() => {
    if (!center || !selected?.lotId) return;
    fetch(`/api/lots/${selected.ranchId}/${selected.lotId}`)
      .then((r) => r.json())
      .then((json) => {
        const list = json.data || [];
        setAnimals(
          list
          .filter((a: any) => a.lastLocation)
          .map((a: any) => ({
            id: a.id,
            lat: a.lastLocation.latitude,
            lng: a.lastLocation.longitude,
            name: a.name || a.earTag || "Vaca",
              weight: a.lastWeight?.weight ?? null,
            }))
        );
      })
      .catch(console.error);
  }, [center, selected]);

  if(!center) {
    return <div className="absolute inset-0 flex items-center justify-center bg-white">Cargando mapa…</div>;
  }

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  return (
    <MapContainer center={center} zoom={14} zoomControl={false} className="absolute inset-0">
      <TileLayer
        // Mapbox Satellite
        url={`https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/{z}/{x}/{y}?access_token=${token}`}
        tileSize={512}
        zoomOffset={-1}
        attribution='&copy; <a href="https://www.mapbox.com/">Mapbox</a>'
      />
      {animals.map(a=>(
        <Marker key={a.id} position={[a.lat,a.lng]} icon={getRandomCowIcon()}>
          <Popup>
            <strong>{a.name}</strong><br/>
            {a.weight!=null?`${a.weight} kg`:"Peso desconocido"}
          </Popup>
        </Marker>
      ))}
      <ZoomControls shift={sidebarOpen}/>
      <ResizeHandler sidebarOpen={sidebarOpen}/>
    </MapContainer>
  );
}
