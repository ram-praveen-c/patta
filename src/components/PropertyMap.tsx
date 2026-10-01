import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Map, Layers, Compass, AlertCircle, CheckCircle2, MapPin } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import type { PropertyRecord } from "@/data/mockData";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Props {
  properties: PropertyRecord[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  scannedMapOverlay?: {
    url: string;
    bounds: [[number, number], [number, number]];
  } | null;
}

const PropertyMap = ({ properties, selectedId, onSelect, scannedMapOverlay }: Props) => {
  const { t } = useLanguage();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const baseLayersRef = useRef<Record<string, L.TileLayer> | null>(null);
  const scannedOverlayLayerRef = useRef<L.ImageOverlay | null>(null);

  // Filter properties with genuine coordinates
  const locatableProperties = properties.filter((p) => p.coordinates && p.coordinates.length === 2 && p.location_status !== "unresolved");
  const hasUnresolved = properties.some((p) => p.location_status === "unresolved" || !p.coordinates);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Center on genuine locatable coordinates or fallback to general Tamil Nadu overview
    const firstLocatable = locatableProperties[0];
    const defaultCenter: L.LatLngExpression = firstLocatable?.coordinates
      ? (firstLocatable.coordinates as L.LatLngExpression)
      : [11.1271, 78.6569]; // Centroid of Tamil Nadu for general overview

    const map = L.map(mapRef.current, {
      center: defaultCenter,
      zoom: firstLocatable ? 15 : 7,
      zoomControl: false,
    });

    L.control.zoom({ position: "bottomright" }).addTo(map);

    // Base Layers
    const osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://openstreetmap.org/copyright">OSM</a> Cadastral Basemap',
      maxZoom: 19,
    });

    const satellite = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        attribution: 'Tiles &copy; Esri World Imagery &mdash; Cadastral High-Res',
        maxZoom: 19,
      }
    );

    satellite.addTo(map);

    const baseMaps = {
      [t.mapLayerSatellite]: satellite,
      [t.mapLayerStreet]: osm,
    };

    L.control.layers(baseMaps, undefined, { position: "topright" }).addTo(map);

    baseLayersRef.current = baseMaps;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      baseLayersRef.current = null;
    };
  }, []);

  // Update scanned map image overlay if georeferenced
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (scannedOverlayLayerRef.current) {
      map.removeLayer(scannedOverlayLayerRef.current);
      scannedOverlayLayerRef.current = null;
    }

    if (scannedMapOverlay && scannedMapOverlay.bounds) {
      const overlay = L.imageOverlay(scannedMapOverlay.url, scannedMapOverlay.bounds, {
        opacity: 0.75,
        interactive: true,
      }).addTo(map);
      scannedOverlayLayerRef.current = overlay;
      map.fitBounds(scannedMapOverlay.bounds, { padding: [30, 30] });
    }
  }, [scannedMapOverlay]);

  // Render parcel polygons, boundaries, popups, and centroid markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear non-tile, non-control, non-overlay layers
    map.eachLayer((layer) => {
      if (
        !(layer instanceof L.TileLayer) &&
        !(layer instanceof L.Control) &&
        layer !== scannedOverlayLayerRef.current
      ) {
        map.removeLayer(layer);
      }
    });

    if (locatableProperties.length === 0) return;

    const bounds = L.latLngBounds([]);

    locatableProperties.forEach((p) => {
      const isSelected = p.id === selectedId;
      const isExactParcel = p.location_status === "parcel_found" || (p.boundary && p.boundary.length >= 3);

      const color = isSelected
        ? "#ea580c" // Orange highlight
        : isExactParcel
        ? "#10b981" // Emerald green for cadastral parcel
        : "#f59e0b"; // Amber for approximate

      const surveyDisplay = p.survey_display || `${p.survey_number}${p.subdivision ? `/${p.subdivision}` : ""}`;
      const pattaAreaDisplay = p.patta_area ? `${p.patta_area.toLocaleString()} m²` : (p.land_area || "N/A");
      const gisAreaDisplay = p.gis_area ? `${p.gis_area.toLocaleString()} m²` : "N/A";
      const diffDisplay = p.area_difference !== undefined ? `${p.area_difference} m²` : "N/A";

      // Rich Parcel Popup
      const popupHtml = `
        <div style="font-family:system-ui, -apple-system, sans-serif; min-width: 240px; font-size: 12px; line-height: 1.5; color: #1e293b;">
          <div style="padding-bottom: 6px; border-bottom: 2px solid ${color}; margin-bottom: 6px;">
            <div style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: ${color}; letter-spacing: 0.5px;">
              ${isExactParcel ? `✓ ${t.exactParcelLocated}` : `⚠️ ${t.administrativeLocation}`}
            </div>
            <h3 style="margin: 2px 0 0 0; font-size: 15px; font-weight: 800; color: #0f172a;">
              ${t.surveyNumber}: ${p.survey_number}
              ${p.subdivision ? `<span style="color:${color}; font-weight:700;"> / ${p.subdivision}</span>` : ""}
            </h3>
          </div>

          <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 6px;">
            <tr>
              <td style="color: #64748b; padding: 2px 0;"><strong>${t.subdivision}:</strong></td>
              <td style="font-weight: 600; text-align: right;">${p.subdivision || "N/A"}</td>
            </tr>
            <tr>
              <td style="color: #64748b; padding: 2px 0;"><strong>${t.village}:</strong></td>
              <td style="font-weight: 600; text-align: right;">${p.village || "N/A"}</td>
            </tr>
            <tr>
              <td style="color: #64748b; padding: 2px 0;"><strong>${t.panchayat}:</strong></td>
              <td style="font-weight: 600; text-align: right;">${p.panchayat || "N/A"}</td>
            </tr>
            <tr>
              <td style="color: #64748b; padding: 2px 0;"><strong>${t.taluk}:</strong></td>
              <td style="font-weight: 600; text-align: right;">${p.taluk || "N/A"}</td>
            </tr>
            <tr>
              <td style="color: #64748b; padding: 2px 0;"><strong>${t.district}:</strong></td>
              <td style="font-weight: 600; text-align: right;">${p.district || "N/A"}</td>
            </tr>
            <tr style="border-top: 1px dashed #e2e8f0;">
              <td style="color: #64748b; padding: 3px 0;"><strong>${t.landArea}:</strong></td>
              <td style="font-weight: 700; text-align: right; color: #0f172a;">${pattaAreaDisplay}</td>
            </tr>
            <tr>
              <td style="color: #64748b; padding: 2px 0;"><strong>GIS Cadastral Area:</strong></td>
              <td style="font-weight: 700; text-align: right; color: #10b981;">${gisAreaDisplay}</td>
            </tr>
            <tr>
              <td style="color: #64748b; padding: 2px 0;"><strong>Difference:</strong></td>
              <td style="font-weight: 600; text-align: right;">${diffDisplay}</td>
            </tr>
          </table>

          <div style="background: #f8fafc; padding: 5px 8px; border-radius: 6px; font-size: 10px; border: 1px solid #e2e8f0;">
            <div><strong>Status:</strong> <span style="color: ${isExactParcel ? "#10b981" : "#ea580c"}; font-weight: bold;">${isExactParcel ? t.exactParcelLocated : t.administrativeLocation}</span></div>
            <div><strong>Match:</strong> ${p.match_type === "exact" ? "Cadastral Survey GIS Polygon" : (p.match_type || "Administrative Lookup")}</div>
          </div>
        </div>
      `;

      if (isExactParcel && p.boundary && p.boundary.length >= 3) {
        // Draw genuine cadastral parcel polygon
        const polygon = L.polygon(p.boundary as L.LatLngExpression[], {
          color,
          weight: isSelected ? 4 : 2,
          fillColor: color,
          fillOpacity: isSelected ? 0.45 : 0.25,
        }).addTo(map);

        polygon.bindPopup(popupHtml);
        polygon.on("click", () => onSelect(p.id));

        p.boundary.forEach(([lat, lng]) => bounds.extend([lat, lng]));
      } else if (p.coordinates) {
        // Draw Administrative Circle marker (Rule #14 B: Do NOT represent village point as parcel boundary)
        const circle = L.circle(p.coordinates, {
          radius: 350, // 350m radius indicating administrative area
          color: "#f59e0b",
          fillColor: "#f59e0b",
          fillOpacity: 0.15,
          weight: 2,
          dashArray: "5, 5"
        }).addTo(map);

        circle.bindPopup(popupHtml);

        const markerIcon = L.divIcon({
          className: "custom-map-marker",
          html: `
            <div style="
              width: 32px; height: 32px; border-radius: 50%;
              background: #f59e0b;
              border: 3px solid white;
              box-shadow: 0 4px 12px rgba(0,0,0,0.4);
              display: flex; align-items: center; justify-content: center;
              color: white; font-weight: 800; font-size: 11px;
            ">
              ADM
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker(p.coordinates, { icon: markerIcon }).addTo(map);
        marker.bindPopup(popupHtml);
        marker.on("click", () => onSelect(p.id));

        bounds.extend(p.coordinates);
      }
    });

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 17 });
    }
  }, [locatableProperties, selectedId, onSelect, t]);

  return (
    <Card className="glass-card overflow-hidden">
      <CardHeader className="pb-3 border-b border-border/40 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <Map className="h-5 w-5 text-primary" />
            {t.mapTitle}
          </CardTitle>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Cadastral parcel polygons, verified administrative boundaries, and survey coordinates
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/30 gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
            {t.exactParcelLocated}
          </Badge>
          <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-400 border-amber-500/30 gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
            {t.administrativeLocation}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-0 relative">
        {/* Unresolved location banner (Rule #14 C) */}
        {hasUnresolved && (
          <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 flex items-center gap-2 text-xs text-amber-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-400" />
            <span>
              <strong>{t.locationUnresolved}:</strong> Exact parcel boundary could not be located in spatial GIS. No fake or default markers are plotted.
            </span>
          </div>
        )}

        <div ref={mapRef} className="w-full h-[480px] bg-slate-950/40 relative z-0" />
      </CardContent>
    </Card>
  );
};

export default PropertyMap;
