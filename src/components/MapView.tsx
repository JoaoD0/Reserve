import "leaflet/dist/leaflet.css";
import L from "leaflet";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navigation, Locate, X, Clock, Route, ChevronRight } from "lucide-react";
import { getDirectionsUrl, getDirectionsUrlFromAddress } from "@/lib/utils/location";

/* ─── Custom markers ──────────────────────────────────────────── */

const restaurantMarker = L.divIcon({
  className: "",
  iconSize: [36, 42],
  iconAnchor: [18, 42],
  html: `<div style="
    width:36px;height:42px;display:flex;flex-direction:column;align-items:center;
  ">
    <div style="
      width:36px;height:36px;border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      background:oklch(0.72 0.19 55);
      border:2.5px solid rgba(255,255,255,0.25);
      box-shadow:0 4px 12px rgba(0,0,0,0.5);
      display:flex;align-items:center;justify-content:center;
    ">
      <span style="transform:rotate(45deg);font-size:15px;">🍽️</span>
    </div>
    <div style="width:2px;height:6px;background:oklch(0.72 0.19 55);margin-top:0;"></div>
  </div>`,
});

const userMarker = L.divIcon({
  className: "",
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  html: `<div style="
    width:22px;height:22px;position:relative;display:flex;align-items:center;justify-content:center;
  ">
    <div style="
      position:absolute;width:22px;height:22px;border-radius:50%;
      background:rgba(99,102,241,0.25);
      animation:pulse-ring 1.8s ease-out infinite;
    "></div>
    <div style="
      width:14px;height:14px;border-radius:50%;
      background:#6366f1;
      border:2.5px solid white;
      box-shadow:0 2px 8px rgba(99,102,241,0.7);
      position:relative;z-index:1;
    "></div>
  </div>
  <style>
    @keyframes pulse-ring {
      0%{transform:scale(0.8);opacity:0.8}
      100%{transform:scale(2.2);opacity:0}
    }
  </style>`,
});

/* ─── Helpers ─────────────────────────────────────────────────── */

function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDist(km: number) {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

function formatTime(secs: number) {
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)}h ${mins % 60}min`;
}

/* ─── Map controller ──────────────────────────────────────────── */

function RecenterBtn({
  userPos,
  tracking,
  onToggle,
}: {
  userPos: [number, number] | null;
  tracking: boolean;
  onToggle: () => void;
}) {
  const map = useMap();
  const fly = useCallback(() => {
    if (userPos) map.flyTo(userPos, 16, { duration: 1 });
  }, [map, userPos]);

  useMapEvents({
    dragstart: () => tracking && onToggle(),
  });

  useEffect(() => {
    if (tracking && userPos) map.flyTo(userPos, 16, { duration: 1 });
  }, [tracking, userPos, map]);

  return (
    <button
      onClick={() => { onToggle(); fly(); }}
      className={`absolute bottom-[140px] right-3 z-[999] flex h-10 w-10 items-center justify-center rounded-full border shadow-lg transition-all ${
        tracking
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border/60 bg-card/90 text-muted-foreground backdrop-blur"
      }`}
    >
      <Locate size={16} />
    </button>
  );
}

/* ─── Types ───────────────────────────────────────────────────── */

type Props = {
  lat: number;
  lng: number;
  name: string;
  address?: string;
  onClose?: () => void;
};

type RouteInfo = {
  coords: [number, number][];
  distanceKm: number;
  durationSecs: number;
};

/* ─── Main component ──────────────────────────────────────────── */

export function MapView({ lat, lng, name, address, onClose }: Props) {
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [tracking, setTracking] = useState(false);
  const [route, setRoute] = useState<RouteInfo | null>(null);
  const [geoError, setGeoError] = useState(false);
  const watchId = useRef<number | null>(null);

  /* Geolocalização */
  useEffect(() => {
    if (!navigator.geolocation) { setGeoError(true); return; }
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        setUserPos([pos.coords.latitude, pos.coords.longitude]);
        setGeoError(false);
      },
      () => setGeoError(true),
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
    return () => {
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    };
  }, []);

  /* Rota via OSRM */
  useEffect(() => {
    if (!userPos) return;
    const [uLat, uLng] = userPos;
    fetch(
      `https://router.project-osrm.org/route/v1/driving/${uLng},${uLat};${lng},${lat}?overview=full&geometries=geojson`
    )
      .then((r) => r.json())
      .then((d) => {
        const rt = d.routes?.[0];
        if (!rt) return;
        const coords = (rt.geometry.coordinates as [number, number][]).map(
          ([lo, la]) => [la, lo] as [number, number]
        );
        setRoute({
          coords,
          distanceKm: rt.distance / 1000,
          durationSecs: rt.duration,
        });
      })
      .catch(() => {});
  }, [userPos, lat, lng]);

  const straightDist = userPos ? haversine(userPos[0], userPos[1], lat, lng) : null;
  const displayDist = route?.distanceKm ?? straightDist;
  const displayTime = route?.durationSecs;

  const mapsUrl =
    lat && lng
      ? getDirectionsUrl(lat, lng, name)
      : address
      ? getDirectionsUrlFromAddress(address, name)
      : null;

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-background">
      {/* Header */}
      {onClose && (
        <div className="absolute left-0 right-0 top-0 z-[1000] flex items-center justify-between px-4 pt-4">
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border/40 bg-card/80 backdrop-blur-md text-foreground shadow"
          >
            <X size={16} />
          </button>
          <div className="rounded-full border border-border/40 bg-card/80 px-4 py-2 backdrop-blur-md shadow">
            <p className="text-xs font-semibold">{name}</p>
          </div>
          <div className="w-10" />
        </div>
      )}

      {/* Map */}
      <div className="flex-1">
        <MapContainer
          center={[lat, lng]}
          zoom={15}
          zoomControl={false}
          style={{ height: "100%", width: "100%", background: "#1a1a2e" }}
          attributionControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          {/* Route */}
          {route && (
            <Polyline
              positions={route.coords}
              pathOptions={{
                color: "oklch(0.72 0.19 55)",
                weight: 5,
                opacity: 0.9,
                lineCap: "round",
                lineJoin: "round",
              }}
            />
          )}

          {/* Restaurant marker */}
          <Marker position={[lat, lng]} icon={restaurantMarker} />

          {/* User marker */}
          {userPos && <Marker position={userPos} icon={userMarker} />}

          {/* Recenter button */}
          <RecenterBtn
            userPos={userPos}
            tracking={tracking}
            onToggle={() => setTracking((t) => !t)}
          />
        </MapContainer>
      </div>

      {/* Bottom card */}
      <div className="relative z-[1000] border-t border-border/40 bg-card/95 px-5 py-4 backdrop-blur-xl">
        {/* Restaurant info */}
        <p className="font-display text-lg font-medium leading-tight">{name}</p>
        {address && (
          <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{address}</p>
        )}

        {/* Stats */}
        <AnimatePresence>
          {displayDist !== null && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 flex items-center gap-3"
            >
              <div className="flex items-center gap-1.5 rounded-xl border border-border/60 bg-surface/60 px-3 py-2">
                <Route size={12} className="text-primary" />
                <span className="text-xs font-medium">{formatDist(displayDist)}</span>
              </div>
              {displayTime !== null && displayTime !== undefined && (
                <div className="flex items-center gap-1.5 rounded-xl border border-border/60 bg-surface/60 px-3 py-2">
                  <Clock size={12} className="text-primary" />
                  <span className="text-xs font-medium">{formatTime(displayTime)} de carro</span>
                </div>
              )}
              {geoError && (
                <p className="text-[11px] text-muted-foreground">Localização indisponível</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* CTA */}
        {mapsUrl && (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground"
          >
            <Navigation size={15} />
            Iniciar navegação
            <ChevronRight size={14} className="ml-auto" />
          </a>
        )}
      </div>
    </div>
  );
}
