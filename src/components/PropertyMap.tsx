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
  const baseLayersRef = useRef<Record<string, L.TileLayer> | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Center on first property or default (Cuddalore)
    const first = properties[0];
    const center: L.LatLngExpression = first
      ? (first.coordinates as L.LatLngExpression)
      : [11.7401, 79.7590];

    const map = L.map(mapRef.current, {
      center,
      zoom: 14,
      zoomControl: false,
    });

    L.control.zoom({ position: "bottomright" }).addTo(map);

    // 1. Configure Base Layers
    const osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://openstreetmap.org/copyright">OSM</a>',
      maxZoom: 19,
    });

    const satellite = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
      maxZoom: 19,
    });

    const terrain = L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
      attribution: 'Map data &copy; <a href="https://openstreetmap.org/copyright">OSM</a>, SRTM | Map style &copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
      maxZoom: 17,
    });

    // Add default
    satellite.addTo(map);

    const baseMaps = {
      "Satellite View": satellite,
      "Terrain View": terrain,
      "Standard Map": osm,
    };

    L.control.layers(baseMaps, undefined, { position: "topright" }).addTo(map);

    baseLayersRef.current = baseMaps;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      baseLayersRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear non-tile layers
    map.eachLayer((layer) => {
      if (!(layer instanceof L.TileLayer) && !(layer instanceof L.Control)) {
        map.removeLayer(layer);
      }
    });

    if (properties.length === 0) return;

    const bounds = L.latLngBounds([]);

    properties.forEach((p) => {
      const isSelected = p.id === selectedId;
      const isExactGis = p.confidence_scores?.location_confidence_detail?.includes("Exact GIS") || false;
      const color = isSelected ? "#e97319" : (isExactGis ? "#2a9d5c" : "#dc2626");

      const tooltipContent = `
        <div style="font-family:system-ui; font-size:11px; padding:2px 4px;">
          <strong>Survey No:</strong> ${p.survey_number}<br/>
          <strong>Owner:</strong> ${p.owner}<br/>
          <strong>Area:</strong> ${p.land_area}<br/>
          <strong>Type:</strong> ${isExactGis ? "Exact GIS Parcel" : "Approximate Village Location"}
        </div>
      `;

      if (isExactGis) {
        // Draw precise boundary polygon
        const polygon = L.polygon(p.boundary as L.LatLngExpression[], {
          color,
          weight: isSelected ? 4 : 2,
          fillColor: color,
          fillOpacity: isSelected ? 0.35 : 0.15,
        }).addTo(map);

        polygon.bindTooltip(tooltipContent, { sticky: true });
        polygon.bindPopup(`
          <div style="font-family:system-ui;min-width:200px; font-size:12px; line-height: 1.4;">
            <h4 style="margin: 0 0 5px 0; font-weight: bold; border-bottom: 1px solid #eee; padding-bottom: 3px; color: #2a9d5c;">Exact GIS Match (100%)</h4>
            <strong>Owner:</strong> ${p.owner}<br/>
            <strong>Survey:</strong> ${p.survey_number}/${p.subdivision || "N/A"}<br/>
            <strong>Area:</strong> ${p.land_area}<br/>
            <strong>Classification:</strong> ${p.classification || "Dry Land"}<br/>
            <strong>Region:</strong> ${p.village}, ${p.taluk || "N/A"}, ${p.district || "N/A"}
          </div>
        `);

        polygon.on("click", () => onSelect(p.id));
        bounds.extend(polygon.getBounds());
      } else {
        // Render large semi-transparent buffer circle representing uncertainty
        const bufferCircle = L.circle(p.coordinates as L.LatLngExpression, {
          radius: 800, // 800m buffer
          color: color,
          dashArray: "6, 8",
          weight: isSelected ? 3 : 1.5,
          fillColor: color,
          fillOpacity: isSelected ? 0.12 : 0.06,
        }).addTo(map);

        bufferCircle.bindTooltip(tooltipContent, { sticky: true });
        bufferCircle.bindPopup(`
          <div style="font-family:system-ui;min-width:220px; font-size:12px; line-height: 1.4;">
            <h4 style="margin: 0 0 5px 0; font-weight: bold; border-bottom: 1px solid #eee; padding-bottom: 3px; color: #dc2626;">Approximate Location</h4>
            <p style="margin: 3px 0; color: #f43f5e; font-size: 11px; font-weight: 500;">
              ⚠️ This location is approximate because official GIS survey data is unavailable.
            </p>
            <strong>Owner:</strong> ${p.owner}<br/>
            <strong>Survey:</strong> ${p.survey_number}<br/>
            <strong>Area:</strong> ${p.land_area}<br/>
            <strong>Region:</strong> ${p.village}, ${p.taluk || "N/A"}, ${p.district || "N/A"}
          </div>
        `);

        bufferCircle.on("click", () => onSelect(p.id));
        bounds.extend(bufferCircle.getBounds());
      }

      // Add a center marker
      const marker = L.circleMarker(p.coordinates as L.LatLngExpression, {
        radius: isSelected ? 8 : 5,
        fillColor: color,
        color: "#fff",
        weight: 2,
        fillOpacity: 1,
      }).addTo(map);

      marker.bindTooltip(tooltipContent, { sticky: true });
      marker.on("click", () => onSelect(p.id));
    });

    if (selectedId) {
      const sel = properties.find((p) => p.id === selectedId);
      if (sel) {
        map.flyTo(sel.coordinates as L.LatLngExpression, sel.confidence_scores?.location_confidence_detail?.includes("Exact GIS") ? 16 : 14, {
          duration: 0.8,
        });
      }
    } else {
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [properties, selectedId, onSelect]);

  return (
    <Card className="glass-card overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-lg">
          <span className="flex items-center gap-2">
            <Map className="h-5 w-5 text-primary" />
            GIS Land Intelligence Map
          </span>
          <span className="text-xs text-muted-foreground font-normal">
            Hover elements for attributes. Select base layers in top right.
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div ref={mapRef} className="h-[450px] w-full" />
      </CardContent>
    </Card>
  );
};

export default PropertyMap;
