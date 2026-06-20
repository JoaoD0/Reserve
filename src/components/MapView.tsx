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
import {
  Navigation, Locate, X, Clock, Route,
  CornerUpRight, CornerUpLeft, ArrowUp, MapPin as DestIcon,
  ExternalLink, Square,
} from "lucide-react";
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

function getInstruction(type: string, modifier: string | undefined, name: string): string {
  const street = name ? ` em ${name}` : "";
  if (type === "depart") return `Siga em frente${name ? ` por ${name}` : ""}`;
  if (type === "arrive") return "Você chegou ao destino";
  if (type === "roundabout" || type === "rotary") return "Entre na rotatória";
  if (type === "exit roundabout" || type === "exit rotary") return `Saia da rotatória${street}`;
  if (type === "merge") return `Entre na via${street}`;
  if (modifier === "right" || modifier === "slight right" || modifier === "sharp right")
    return `Vire à direita${street}`;
  if (modifier === "left" || modifier === "slight left" || modifier === "sharp left")
    return `Vire à esquerda${street}`;
  if (modifier === "uturn") return "Faça o retorno";
  return `Continue em frente${street}`;
}

function ManeuverIcon({ type, modifier, size = 20 }: { type: string; modifier?: string; size?: number }) {
  if (type === "arrive") return <DestIcon size={size} />;
  if (modifier === "right" || modifier === "slight right" || modifier === "sharp right")
    return <CornerUpRight size={size} />;
  if (modifier === "left" || modifier === "slight left" || modifier === "sharp left")
    return <CornerUpLeft size={size} />;
  return <ArrowUp size={size} />;
}

/* ─── Map controller ──────────────────────────────────────────── */

function RecenterBtn({
  userPos,
  tracking,
  geoLoading,
  onToggle,
  onRequestGeo,
  isNavigating,
}: {
  userPos: [number, number] | null;
  tracking: boolean;
  geoLoading: boolean;
  onToggle: () => void;
  onRequestGeo: () => void;
  isNavigating: boolean;
}) {
  const map = useMap();

  const fly = useCallback(() => {
    if (userPos) map.flyTo(userPos, 17, { duration: 1.2 });
  }, [map, userPos]);

  useMapEvents({
    dragstart: () => !isNavigating && tracking && onToggle(),
  });

  useEffect(() => {
    if (tracking && userPos) map.flyTo(userPos, 17, { duration: 1.2 });
  }, [tracking, userPos, map]);

  if (isNavigating) return null;

  const handleClick = () => {
    if (!userPos) onRequestGeo();
    else { onToggle(); fly(); }
  };

  return (
    <button
      onClick={handleClick}
      className={`absolute bottom-[196px] right-3 z-[999] flex h-11 w-11 items-center justify-center rounded-full border shadow-xl transition-all active:scale-90 ${
        tracking && userPos
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border/40 bg-card/95 text-muted-foreground backdrop-blur-md"
      }`}
    >
      {geoLoading
        ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        : <Locate size={16} />
      }
    </button>
  );
}

/* ─── Types ───────────────────────────────────────────────────── */

type Step = {
  maneuver: { type: string; modifier?: string; location: [number, number] };
  name: string;
  distance: number;
  duration: number;
};

type Props = {
  lat: number;
  lng: number;
  name: string;
  address?: string;
  imageUrl?: string;
  onClose?: () => void;
};

type RouteInfo = {
  coords: [number, number][];
  distanceKm: number;
  durationSecs: number;
  steps: Step[];
};

/* ─── Main component ──────────────────────────────────────────── */

export function MapView({ lat, lng, name, address, imageUrl, onClose }: Props) {
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [tracking, setTracking] = useState(false);
  const [route, setRoute] = useState<RouteInfo | null>(null);
  const [geoError, setGeoError] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const watchId = useRef<number | null>(null);

  const startWatch = useCallback(() => {
    if (!navigator.geolocation) { setGeoError(true); return; }
    setGeoLoading(true);
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        setUserPos([pos.coords.latitude, pos.coords.longitude]);
        setGeoError(false);
        setGeoLoading(false);
        setTracking(true);
      },
      () => { setGeoError(true); setGeoLoading(false); },
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
    );
  }, []);

  useEffect(() => {
    startWatch();
    return () => {
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    };
  }, [startWatch]);

  /* Rota via OSRM com passos */
  useEffect(() => {
    if (!userPos) return;
    const [uLat, uLng] = userPos;
    fetch(
      `https://router.project-osrm.org/route/v1/driving/${uLng},${uLat};${lng},${lat}?overview=full&geometries=geojson&steps=true`
    )
      .then((r) => r.json())
      .then((d) => {
        const rt = d.routes?.[0];
        if (!rt) return;
        const coords = (rt.geometry.coordinates as [number, number][]).map(
          ([lo, la]) => [la, lo] as [number, number]
        );
        const steps: Step[] = (rt.legs?.[0]?.steps ?? []).map((s: any) => ({
          maneuver: s.maneuver,
          name: s.name ?? "",
          distance: s.distance,
          duration: s.duration,
        }));
        setRoute({ coords, distanceKm: rt.distance / 1000, durationSecs: rt.duration, steps });
      })
      .catch(() => {});
  }, [userPos, lat, lng]);

  /* Avança passo quando usuário chega perto do próximo maneuver */
  useEffect(() => {
    if (!isNavigating || !userPos || !route?.steps.length) return;
    const steps = route.steps;
    for (let i = currentStepIdx; i < steps.length - 1; i++) {
      const [mLng, mLat] = steps[i + 1].maneuver.location;
      const dist = haversine(userPos[0], userPos[1], mLat, mLng);
      if (dist < 0.04) {
        setCurrentStepIdx(i + 1);
        break;
      }
    }
  }, [userPos, isNavigating, route, currentStepIdx]);

  const currentStep = route?.steps[currentStepIdx];
  const nextStep = route?.steps[currentStepIdx + 1];

  const distToNext = nextStep && userPos
    ? haversine(userPos[0], userPos[1], nextStep.maneuver.location[1], nextStep.maneuver.location[0])
    : null;

  const straightDist = userPos ? haversine(userPos[0], userPos[1], lat, lng) : null;
  const displayDist = route?.distanceKm ?? straightDist;
  const displayTime = route?.durationSecs;

  const mapsUrl =
    lat && lng
      ? getDirectionsUrl(lat, lng, name)
      : address
      ? getDirectionsUrlFromAddress(address, name)
      : null;

  const startNavigation = () => {
    setCurrentStepIdx(0);
    setIsNavigating(true);
    setTracking(true);
  };

  const stopNavigation = () => {
    setIsNavigating(false);
  };

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-background">
      {/* Header */}
      {onClose && (
        <div className="absolute left-0 right-0 top-0 z-[1000] flex items-center justify-between px-4 pt-4">
          <button
            onClick={isNavigating ? stopNavigation : onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border/40 bg-card/80 backdrop-blur-md text-foreground shadow"
          >
            <X size={16} />
          </button>
          {!isNavigating && (
            <div className="rounded-full border border-border/40 bg-card/80 px-4 py-2 backdrop-blur-md shadow">
              <p className="text-xs font-semibold">{name}</p>
            </div>
          )}
          <div className="w-10" />
        </div>
      )}

      {/* Navigation instruction overlay */}
      <AnimatePresence>
        {isNavigating && currentStep && (
          <motion.div
            key="nav-instruction"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="absolute left-4 right-4 top-[68px] z-[999] overflow-hidden rounded-2xl border border-border/30 bg-card/95 shadow-xl backdrop-blur-xl"
          >
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <ManeuverIcon
                  type={currentStep.maneuver.type}
                  modifier={currentStep.maneuver.modifier}
                  size={22}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-tight">
                  {getInstruction(
                    currentStep.maneuver.type,
                    currentStep.maneuver.modifier,
                    currentStep.name
                  )}
                </p>
                {distToNext !== null && (
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    em {formatDist(distToNext)}
                  </p>
                )}
              </div>
              {displayDist !== null && (
                <div className="shrink-0 text-right">
                  <p className="text-xs font-semibold text-primary">{formatDist(displayDist)}</p>
                  {displayTime != null && (
                    <p className="text-[10px] text-muted-foreground">{formatTime(displayTime)}</p>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map */}
      <div className="flex-1">
        <MapContainer
          center={[lat, lng]}
          zoom={15}
          zoomControl={false}
          style={{ height: "100%", width: "100%", background: "#1a1a2e" }}
          attributionControl={false}
        >
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />

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

          <Marker position={[lat, lng]} icon={restaurantMarker} />
          {userPos && <Marker position={userPos} icon={userMarker} />}

          <RecenterBtn
            userPos={userPos}
            tracking={tracking}
            geoLoading={geoLoading}
            onToggle={() => setTracking((t) => !t)}
            onRequestGeo={startWatch}
            isNavigating={isNavigating}
          />
        </MapContainer>
      </div>

      {/* Bottom sheet */}
      <div className="relative z-[1000] rounded-t-3xl border-t border-border/30 bg-card/95 px-5 pb-8 pt-3 backdrop-blur-xl shadow-[0_-8px_32px_rgba(0,0,0,0.4)]">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border/50" />

        {!isNavigating ? (
          <>
            {/* Info row */}
            <div className="flex items-start gap-3">
              <div className="h-11 w-11 shrink-0 overflow-hidden rounded-2xl border border-border/40 bg-surface">
                {imageUrl ? (
                  <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xl">🍽️</div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display text-base font-semibold leading-tight">{name}</p>
                {address && (
                  <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{address}</p>
                )}
              </div>
            </div>

            {/* Stats pills */}
            <AnimatePresence>
              {displayDist !== null && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 flex gap-2"
                >
                  <div className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-border/60 bg-surface/60 py-2.5">
                    <Route size={12} className="text-primary" />
                    <span className="text-xs font-semibold">{formatDist(displayDist)}</span>
                  </div>
                  {displayTime != null && (
                    <div className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-border/60 bg-surface/60 py-2.5">
                      <Clock size={12} className="text-primary" />
                      <span className="text-xs font-semibold">{formatTime(displayTime)}</span>
                    </div>
                  )}
                  {geoError && !geoLoading && (
                    <button
                      onClick={startWatch}
                      className="self-center text-[11px] text-primary underline-offset-2 hover:underline"
                    >
                      Permitir localização
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* CTAs */}
            <div className="mt-3 flex gap-2">
              {/* In-app navigation */}
              <button
                onClick={startNavigation}
                disabled={!route || !userPos}
                className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-semibold text-primary-foreground transition-all active:scale-[0.98] disabled:opacity-40"
              >
                <Navigation size={15} />
                Navegar
              </button>

              {/* Open native GPS */}
              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-surface/60 text-muted-foreground transition-all active:scale-[0.98] hover:text-foreground"
                  title="Abrir no GPS do celular"
                >
                  <ExternalLink size={17} />
                </a>
              )}
            </div>
          </>
        ) : (
          /* Navigating mode bottom */
          <>
            <div className="flex gap-2 mb-3">
              <div className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-border/60 bg-surface/60 py-2.5">
                <Route size={12} className="text-primary" />
                <span className="text-xs font-semibold">
                  {displayDist !== null ? formatDist(displayDist) : "—"}
                </span>
              </div>
              {displayTime != null && (
                <div className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-border/60 bg-surface/60 py-2.5">
                  <Clock size={12} className="text-primary" />
                  <span className="text-xs font-semibold">{formatTime(displayTime)}</span>
                </div>
              )}
            </div>

            <button
              onClick={stopNavigation}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl border border-red-500/40 bg-red-500/10 text-sm font-semibold text-red-400 transition-all active:scale-[0.98]"
            >
              <Square size={14} fill="currentColor" />
              Parar navegação
            </button>
          </>
        )}
      </div>
    </div>
  );
}
