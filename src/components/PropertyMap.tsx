import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Map } from "lucide-react";
import type { PropertyRecord } from "@/data/mockData";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Props {
  properties: PropertyRecord[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const PropertyMap = ({ properties, selectedId, onSelect }: Props) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Center on first property or default
    const first = properties[0];
    const center: L.LatLngExpression = first
      ? (first.coordinates as L.LatLngExpression)
      : [11.74, 79.76];

    const map = L.map(mapRef.current, {
      center,
      zoom: 14,
      zoomControl: false,
    });

    L.control.zoom({ position: "bottomright" }).addTo(map);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://openstreetmap.org">OSM</a>',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear non-tile layers
    map.eachLayer((layer) => {
      if (!(layer instanceof L.TileLayer)) map.removeLayer(layer);
    });

    if (properties.length === 0) return;

    const bounds = L.latLngBounds([]);

    properties.forEach((p) => {
      const isSelected = p.id === selectedId;
      const color = isSelected ? "#e97319" : "#2a9d5c";

      const polygon = L.polygon(p.boundary as L.LatLngExpression[], {
        color,
        weight: isSelected ? 3 : 2,
        fillColor: color,
        fillOpacity: isSelected ? 0.3 : 0.15,
      }).addTo(map);

      polygon.bindPopup(`
        <div style="font-family:system-ui;min-width:160px">
          <strong>${p.owner}</strong><br/>
          <span style="color:#666">Survey: ${p.survey_number}</span><br/>
          <span style="color:#666">Area: ${p.land_area}</span><br/>
          <span style="color:#666">${p.village}</span>
        </div>
      `);

      polygon.on("click", () => onSelect(p.id));
      bounds.extend(polygon.getBounds());

      const marker = L.circleMarker(p.coordinates as L.LatLngExpression, {
        radius: isSelected ? 8 : 6,
        fillColor: color,
        color: "#fff",
        weight: 2,
        fillOpacity: 1,
      }).addTo(map);

      marker.on("click", () => onSelect(p.id));
    });

    if (selectedId) {
      const sel = properties.find((p) => p.id === selectedId);
      if (sel) map.flyTo(sel.coordinates as L.LatLngExpression, 15, { duration: 0.8 });
    } else {
      map.fitBounds(bounds, { padding: [30, 30] });
    }
  }, [properties, selectedId, onSelect]);

  return (
    <Card className="glass-card overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Map className="h-5 w-5 text-primary" />
          GIS Property Map
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div ref={mapRef} className="h-[420px] w-full" />
      </CardContent>
    </Card>
  );
};

export default PropertyMap;
