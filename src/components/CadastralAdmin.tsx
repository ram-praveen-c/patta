import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Upload,
  Database,
  Map as MapIcon,
  Compass,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  Layers,
  FileCode,
  Image as ImageIcon,
  Loader2,
  RefreshCw
} from "lucide-react";
import {
  getCadastralMaps,
  getCadastralParcels,
  importGeoJsonParcels,
  uploadScannedMap,
  georeferenceScannedMap,
  type CadastralMapRecord,
  type CadastralParcelRecord
} from "@/lib/cadastralApi";

interface GCPRow {
  pixel_x: number;
  pixel_y: number;
  lat: number;
  lon: number;
}

const CadastralAdmin: React.FC = () => {
  const [maps, setMaps] = useState<CadastralMapRecord[]>([]);
  const [parcels, setParcels] = useState<CadastralParcelRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  // GeoJSON Import form
  const [geoFile, setGeoFile] = useState<File | null>(null);
  const [geoPanchayat, setGeoPanchayat] = useState("Cuddalore Town Panchayat");
  const [geoVillage, setGeoVillage] = useState("Cuddalore Town");
  const [geoTaluk, setGeoTaluk] = useState("Cuddalore");
  const [geoDistrict, setGeoDistrict] = useState("Cuddalore");

  // Scanned Map Upload & Georeferencing
  const [scannedFile, setScannedFile] = useState<File | null>(null);
  const [selectedMapId, setSelectedMapId] = useState("");
  const [imgWidth, setImgWidth] = useState(2000);
  const [imgHeight, setImgHeight] = useState(2000);
  const [gcps, setGcps] = useState<GCPRow[]>([
    { pixel_x: 0, pixel_y: 0, lat: 11.750, lon: 79.750 },
    { pixel_x: 2000, pixel_y: 0, lat: 11.750, lon: 79.775 },
    { pixel_x: 2000, pixel_y: 2000, lat: 11.730, lon: 79.775 },
    { pixel_x: 0, pixel_y: 2000, lat: 11.730, lon: 79.750 }
  ]);
  const [calibrationResult, setCalibrationResult] = useState<any>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [mapsData, parcelsData] = await Promise.all([
        getCadastralMaps(),
        getCadastralParcels()
      ]);
      setMaps(mapsData);
      setParcels(parcelsData);
      if (mapsData.length > 0 && !selectedMapId) {
        setSelectedMapId(mapsData[0].map_id);
      }
    } catch (err: any) {
      console.error("Failed to load cadastral admin data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleGeoJsonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!geoFile) {
      alert("Please select a GeoJSON file to upload.");
      return;
    }

    setLoading(true);
    setStatusMsg("Validating GeoJSON and importing cadastral parcels...");
    try {
      const formData = new FormData();
      formData.append("file", geoFile);
      formData.append("panchayat", geoPanchayat);
      formData.append("village", geoVillage);
      formData.append("taluk", geoTaluk);
      formData.append("district", geoDistrict);

      const res = await importGeoJsonParcels(formData);
      if (res.success) {
        alert(`Success: ${res.message}`);
        setGeoFile(null);
        await loadData();
      } else {
        alert(`Error: ${res.error}`);
      }
    } catch (err: any) {
      alert(`Import failed: ${err.message}`);
    } finally {
      setLoading(false);
      setStatusMsg("");
    }
  };

  const handleScannedMapSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannedFile) {
      alert("Please select a scanned map image to upload.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", scannedFile);
      formData.append("panchayat", geoPanchayat);
      formData.append("village", geoVillage);
      formData.append("taluk", geoTaluk);
      formData.append("district", geoDistrict);

      const res = await uploadScannedMap(formData);
      if (res.success) {
        alert(`Map uploaded successfully! Map ID: ${res.map_id}`);
        setSelectedMapId(res.map_id);
        setScannedFile(null);
        await loadData();
      } else {
        alert(`Error: ${res.error}`);
      }
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGCPChange = (index: number, field: keyof GCPRow, value: number) => {
    setGcps((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addGcpRow = () => {
    setGcps((prev) => [...prev, { pixel_x: 0, pixel_y: 0, lat: 11.74, lon: 79.76 }]);
  };

  const removeGcpRow = (index: number) => {
    if (gcps.length <= 3) {
      alert("Minimum 3 Ground Control Points (GCPs) are required for affine transformation.");
      return;
    }
    setGcps((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRunGeoreference = async () => {
    if (!selectedMapId) {
      alert("Please select a registered map sheet to georeference.");
      return;
    }

    setLoading(true);
    try {
      const res = await georeferenceScannedMap({
        map_id: selectedMapId,
        gcp_points: gcps,
        img_width: imgWidth,
        img_height: imgHeight
      });
      setCalibrationResult(res);
      await loadData();
    } catch (err: any) {
      alert(`Calibration failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/40">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            Panchayat Cadastral Map Data Management
          </h2>
          <p className="text-xs text-muted-foreground">
            Authoritative Cadastral GIS Vector Layers, Scanned Map GCP Georeferencing, & Parcel Registry
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData} disabled={loading} className="gap-1.5 text-xs">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh Registry
        </Button>
      </div>

      <Tabs defaultValue="maps" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-muted/60 p-1">
          <TabsTrigger value="maps" className="text-xs gap-1.5">
            <MapIcon className="h-3.5 w-3.5" /> Registered Maps ({maps.length})
          </TabsTrigger>
          <TabsTrigger value="geojson" className="text-xs gap-1.5">
            <FileCode className="h-3.5 w-3.5" /> Import GeoJSON Parcels
          </TabsTrigger>
          <TabsTrigger value="georeference" className="text-xs gap-1.5">
            <Compass className="h-3.5 w-3.5" /> Scanned Map Georeferencer
          </TabsTrigger>
          <TabsTrigger value="parcels" className="text-xs gap-1.5">
            <Layers className="h-3.5 w-3.5" /> Cadastral Parcels ({parcels.length})
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: REGISTERED PANCHAYAT MAPS */}
        <TabsContent value="maps" className="space-y-4 pt-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {maps.map((m) => (
              <Card key={m.map_id} className="glass-card border-border/60">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <MapIcon className="h-4 w-4 text-primary" />
                      {m.map_name}
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className={
                        m.georeferenced
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px]"
                          : "bg-amber-500/10 text-amber-600 border-amber-500/30 text-[10px]"
                      }
                    >
                      {m.georeferenced ? "Georeferenced" : "Uncalibrated"}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    Map ID: <span className="font-mono">{m.map_id}</span> • Type: {m.map_type}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-muted/40 p-2.5 rounded-lg">
                    <div>
                      <span className="text-muted-foreground">Panchayat:</span>
                      <p className="font-semibold">{m.panchayat || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Village:</span>
                      <p className="font-semibold">{m.village || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Taluk & District:</span>
                      <p className="font-semibold">{m.taluk || "Cuddalore"}, {m.district || "Cuddalore"}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">CRS:</span>
                      <p className="font-semibold font-mono">{m.coordinate_reference_system}</p>
                    </div>
                  </div>

                  {m.bounds && (
                    <p className="text-[10px] text-muted-foreground font-mono">
                      Bounds: [{m.bounds[0][0].toFixed(3)}, {m.bounds[0][1].toFixed(3)}] to [{m.bounds[1][0].toFixed(3)}, {m.bounds[1][1].toFixed(3)}]
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* TAB 2: IMPORT GEOJSON PARCELS */}
        <TabsContent value="geojson" className="pt-3">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <FileCode className="h-5 w-5 text-primary" />
                Upload Official Cadastral Vector GIS Data (GeoJSON)
              </CardTitle>
              <CardDescription className="text-xs">
                Imports authentic survey parcel polygons, subdivisions, and land areas into the Panchayat registry.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGeoJsonSubmit} className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Panchayat Name *</Label>
                    <Input
                      value={geoPanchayat}
                      onChange={(e) => setGeoPanchayat(e.target.value)}
                      className="text-xs h-8"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Village Name *</Label>
                    <Input
                      value={geoVillage}
                      onChange={(e) => setGeoVillage(e.target.value)}
                      className="text-xs h-8"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Taluk</Label>
                    <Input
                      value={geoTaluk}
                      onChange={(e) => setGeoTaluk(e.target.value)}
                      className="text-xs h-8"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">District</Label>
                    <Input
                      value={geoDistrict}
                      onChange={(e) => setGeoDistrict(e.target.value)}
                      className="text-xs h-8"
                    />
                  </div>
                </div>

                <div className="border-2 border-dashed border-primary/30 rounded-xl p-6 text-center hover:border-primary/60 transition-colors">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-primary/60" />
                  <p className="text-xs font-semibold mb-1">Select Cadastral GeoJSON File (.json, .geojson)</p>
                  <p className="text-[11px] text-muted-foreground mb-3">
                    Must contain Polygon features with properties: survey_no, subdivision, area.
                  </p>
                  <input
                    type="file"
                    accept=".json,.geojson"
                    onChange={(e) => setGeoFile(e.target.files?.[0] || null)}
                    className="text-xs mx-auto"
                  />
                  {geoFile && (
                    <p className="mt-2 text-xs text-primary font-semibold">Selected: {geoFile.name} ({(geoFile.size / 1024).toFixed(1)} KB)</p>
                  )}
                </div>

                <Button type="submit" disabled={loading || !geoFile} className="gap-2">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  Import Cadastral Parcels
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: SCANNED MAP GEOREFERENCER */}
        <TabsContent value="georeference" className="space-y-4 pt-3">
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Compass className="h-5 w-5 text-primary" />
                Ground Control Points (GCP) Georeferencing Tool
              </CardTitle>
              <CardDescription className="text-xs">
                Transforms scanned Panchayat map sheets into geographic coordinates using 2D Affine Least-Squares.
                Rule #4: If minimum 3 GCPs are not provided, system reports "Map is not georeferenced."
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Select Map Sheet */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Select Registered Map</Label>
                  <select
                    className="w-full text-xs h-8 rounded-md border border-input bg-background px-2"
                    value={selectedMapId}
                    onChange={(e) => setSelectedMapId(e.target.value)}
                  >
                    {maps.map((m) => (
                      <option key={m.map_id} value={m.map_id}>
                        {m.map_name} ({m.map_id})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Image Width (pixels)</Label>
                  <Input
                    type="number"
                    value={imgWidth}
                    onChange={(e) => setImgWidth(Number(e.target.value))}
                    className="text-xs h-8"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Image Height (pixels)</Label>
                  <Input
                    type="number"
                    value={imgHeight}
                    onChange={(e) => setImgHeight(Number(e.target.value))}
                    className="text-xs h-8"
                  />
                </div>
              </div>

              {/* GCP Points Table */}
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted text-muted-foreground uppercase text-[10px]">
                    <tr>
                      <th className="px-3 py-2">Point</th>
                      <th className="px-3 py-2">Pixel X</th>
                      <th className="px-3 py-2">Pixel Y</th>
                      <th className="px-3 py-2">Known Latitude (Deg)</th>
                      <th className="px-3 py-2">Known Longitude (Deg)</th>
                      <th className="px-3 py-2 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gcps.map((gcp, idx) => (
                      <tr key={idx} className="border-b last:border-0 bg-background/50">
                        <td className="px-3 py-1.5 font-bold text-primary">Point {idx + 1}</td>
                        <td className="px-2 py-1">
                          <Input
                            type="number"
                            value={gcp.pixel_x}
                            onChange={(e) => handleGCPChange(idx, "pixel_x", Number(e.target.value))}
                            className="h-7 text-xs"
                          />
                        </td>
                        <td className="px-2 py-1">
                          <Input
                            type="number"
                            value={gcp.pixel_y}
                            onChange={(e) => handleGCPChange(idx, "pixel_y", Number(e.target.value))}
                            className="h-7 text-xs"
                          />
                        </td>
                        <td className="px-2 py-1">
                          <Input
                            type="number"
                            step="0.0001"
                            value={gcp.lat}
                            onChange={(e) => handleGCPChange(idx, "lat", Number(e.target.value))}
                            className="h-7 text-xs font-mono"
                          />
                        </td>
                        <td className="px-2 py-1">
                          <Input
                            type="number"
                            step="0.0001"
                            value={gcp.lon}
                            onChange={(e) => handleGCPChange(idx, "lon", Number(e.target.value))}
                            className="h-7 text-xs font-mono"
                          />
                        </td>
                        <td className="px-2 py-1 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() => removeGcpRow(idx)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <Button variant="outline" size="sm" onClick={addGcpRow} className="gap-1.5 text-xs">
                  <Plus className="h-3.5 w-3.5" /> Add Control Point
                </Button>

                <Button onClick={handleRunGeoreference} disabled={loading || gcps.length < 3} className="gap-2">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Compass className="h-4 w-4" />}
                  Compute Affine Transformation & Georeference
                </Button>
              </div>

              {/* Calibration Feedback Result */}
              {calibrationResult && (
                <div
                  className={`p-3.5 rounded-xl border text-xs leading-relaxed space-y-1.5 ${
                    calibrationResult.success
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-200"
                      : "bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-200"
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold">
                    {calibrationResult.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                    <span>{calibrationResult.status}</span>
                  </div>
                  {calibrationResult.rmse_meters !== undefined && (
                    <p className="text-[11px]">
                      Calibration Residual Error (RMSE): <strong>{calibrationResult.rmse_meters} meters</strong>
                    </p>
                  )}
                  {calibrationResult.bounds && (
                    <p className="text-[11px] font-mono">
                      Calculated Geographic Bounds: [{calibrationResult.bounds[0][0].toFixed(4)}, {calibrationResult.bounds[0][1].toFixed(4)}] to [{calibrationResult.bounds[1][0].toFixed(4)}, {calibrationResult.bounds[1][1].toFixed(4)}]
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: CADASTRAL PARCELS EXPLORER */}
        <TabsContent value="parcels" className="pt-3">
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                Cadastral Survey Parcels Database ({parcels.length})
              </CardTitle>
              <CardDescription className="text-xs">
                Authoritative parcel registry queried during Patta-to-Cadastral Localization.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted text-muted-foreground uppercase text-[10px]">
                    <tr>
                      <th className="px-3 py-2">Survey No.</th>
                      <th className="px-3 py-2">Subdivision</th>
                      <th className="px-3 py-2">Village / Panchayat</th>
                      <th className="px-3 py-2">Registered Owner</th>
                      <th className="px-3 py-2">Area (m²)</th>
                      <th className="px-3 py-2">Centroid</th>
                      <th className="px-3 py-2">Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parcels.map((p) => (
                      <tr key={p.id} className="border-b last:border-0 hover:bg-muted/40 transition-colors">
                        <td className="px-3 py-2 font-bold text-foreground">{p.survey_no}</td>
                        <td className="px-3 py-2 font-semibold text-primary">{p.subdivision || "-"}</td>
                        <td className="px-3 py-2">{p.village} {p.panchayat ? `(${p.panchayat})` : ""}</td>
                        <td className="px-3 py-2">{p.owner || "Registered Pattadar"}</td>
                        <td className="px-3 py-2 font-mono">{p.area_sqm ? `${p.area_sqm.toLocaleString()} m²` : p.area}</td>
                        <td className="px-3 py-2 font-mono text-[10px] text-muted-foreground">
                          {p.centroid ? `${p.centroid[0].toFixed(4)}, ${p.centroid[1].toFixed(4)}` : "N/A"}
                        </td>
                        <td className="px-3 py-2 text-[10px] text-muted-foreground">{p.source || "Cadastral Survey"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CadastralAdmin;
