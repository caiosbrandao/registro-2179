import { useEffect, useRef } from "react";
import L from "leaflet";
import { parseCoordenadas } from "@/lib/atendimento/geo";

interface Props {
  locCliente: string;
  locCto: string;
  /** muda quando a aba volta a ficar visível — força o invalidateSize do Leaflet */
  chaveVisibilidade: string;
}

const TILES = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

function pin(kind: "cli" | "cto", label: string) {
  return L.divIcon({
    className: "",
    html: `<div class="map-pin" data-kind="${kind}">${label}</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
}

export function MapaCoordenadas({ locCliente, locCto, chaveVisibilidade }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const mapa = useRef<L.Map | null>(null);
  const marcadorCli = useRef<L.Marker | null>(null);
  const marcadorCto = useRef<L.Marker | null>(null);
  const linha = useRef<L.Polyline | null>(null);

  useEffect(() => {
    if (!container.current || mapa.current) return;
    const map = L.map(container.current, { zoomControl: true, attributionControl: true }).setView(
      [-14.235, -51.925],
      4,
    );
    L.tileLayer(TILES, {
      attribution: "© OpenStreetMap · © CARTO",
      subdomains: "abcd",
      maxZoom: 20,
    }).addTo(map);
    mapa.current = map;
    setTimeout(() => map.invalidateSize(), 120);

    return () => {
      map.remove();
      mapa.current = null;
      marcadorCli.current = null;
      marcadorCto.current = null;
      linha.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapa.current;
    if (!map) return;
    setTimeout(() => map.invalidateSize(), 120);
  }, [chaveVisibilidade]);

  useEffect(() => {
    const map = mapa.current;
    if (!map) return;

    const cli = parseCoordenadas(locCliente);
    const cto = parseCoordenadas(locCto);
    const pontos: L.LatLngExpression[] = [];

    if (cli) {
      if (marcadorCli.current) marcadorCli.current.setLatLng(cli);
      else
        marcadorCli.current = L.marker(cli, { icon: pin("cli", "C") })
          .addTo(map)
          .bindPopup("CLIENTE");
      pontos.push(cli);
    } else if (marcadorCli.current) {
      marcadorCli.current.remove();
      marcadorCli.current = null;
    }

    if (cto) {
      if (marcadorCto.current) marcadorCto.current.setLatLng(cto);
      else
        marcadorCto.current = L.marker(cto, { icon: pin("cto", "T") })
          .addTo(map)
          .bindPopup("CTO MAIS PRÓXIMA");
      pontos.push(cto);
    } else if (marcadorCto.current) {
      marcadorCto.current.remove();
      marcadorCto.current = null;
    }

    if (linha.current) {
      linha.current.remove();
      linha.current = null;
    }
    if (cli && cto) {
      linha.current = L.polyline([cli, cto], {
        color: "#38bdf8",
        weight: 2,
        opacity: 0.7,
        dashArray: "5 6",
      }).addTo(map);
    }

    if (pontos.length === 1) map.setView(pontos[0], 17);
    else if (pontos.length > 1) map.fitBounds(L.latLngBounds(pontos), { padding: [36, 36] });
  }, [locCliente, locCto]);

  return <div ref={container} className="map-shell" />;
}

/** Distância em metros entre cliente e CTO (null quando faltam coordenadas). */
export function distanciaEntre(locCliente: string, locCto: string): number | null {
  const a = parseCoordenadas(locCliente);
  const b = parseCoordenadas(locCto);
  if (!a || !b) return null;
  const R = 6_371_000;
  const rad = (v: number) => (v * Math.PI) / 180;
  const dLat = rad(b[0] - a[0]);
  const dLon = rad(b[1] - a[1]);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}
