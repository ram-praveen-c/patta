import { useState } from "react";
import { Terminal, Code, Layers, Table, CheckSquare, Image as ImageIcon, MapPin } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PropertyRecord } from "@/data/mockData";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property: PropertyRecord | null;
}

export const DebugModeDrawer = ({ open, onOpenChange, property }: Props) => {
  const [activeTab, setActiveTab] = useState("json");

  if (!property) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col glass-card border-primary/40 p-0 overflow-hidden">
        <DialogHeader className="p-4 border-b border-border/40 bg-muted/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="h-5 w-5 text-primary" />
              <DialogTitle className="text-base font-bold">
                Developer / Pipeline Diagnostic Mode
              </DialogTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
                Status: {property.location_status || "Processed"}
              </Badge>
              <Badge variant="outline" className="text-xs">
                Score: {property.confidence}%
              </Badge>
            </div>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Complete diagnostic inspect of all pipeline transformations from raw document scan to structured cadastral match.
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 border-b border-border/40 bg-background/50">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-5 w-full bg-muted/60 p-1 text-xs">
              <TabsTrigger value="json" className="gap-1.5 text-xs">
                <Code className="h-3.5 w-3.5" /> Structured JSON
              </TabsTrigger>
              <TabsTrigger value="images" className="gap-1.5 text-xs">
                <ImageIcon className="h-3.5 w-3.5" /> Image Diff (CV)
              </TabsTrigger>
              <TabsTrigger value="layout" className="gap-1.5 text-xs">
                <Layers className="h-3.5 w-3.5" /> Layout Regions
              </TabsTrigger>
              <TabsTrigger value="tables" className="gap-1.5 text-xs">
                <Table className="h-3.5 w-3.5" /> Table Reconstruct
              </TabsTrigger>
              <TabsTrigger value="validation" className="gap-1.5 text-xs">
                <CheckSquare className="h-3.5 w-3.5" /> Validation Layer
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex-1 overflow-y-auto p-4 max-h-[580px]">
          {/* TAB 1: Structured JSON */}
          {activeTab === "json" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-primary">Normalized Cadastral Data Output</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => navigator.clipboard.writeText(JSON.stringify(property, null, 2))}
                >
                  Copy JSON
                </Button>
              </div>
              <pre className="p-4 rounded-xl bg-slate-950 font-mono text-xs text-emerald-400 overflow-x-auto border border-border/40 leading-relaxed">
                {JSON.stringify(
                  {
                    id: property.id,
                    patta_number: property.patta_number,
                    district: property.district,
                    taluk: property.taluk,
                    village: property.village,
                    panchayat: property.panchayat,
                    survey_number: property.survey_number,
                    subdivision: property.subdivision,
                    survey_display: property.survey_display,
                    land_area: property.land_area,
                    total_area: property.land_area,
                    classification: property.classification,
                    survey_details: property.survey_details,
                    location: {
                      status: property.location_status,
                      level: property.level,
                      coordinates: property.coordinates,
                      geometry: property.boundary,
                      source: property.source
                    },
                    validation: property.validation,
                    area_validation: property.area_validation,
                    evidence_links: property.evidence
                  },
                  null,
                  2
                )}
              </pre>
            </div>
          )}

          {/* TAB 2: Image Diff (Original vs Preprocessed) */}
          {activeTab === "images" && (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Inspection of computer vision preprocessing: Deskewing, CLAHE contrast enhancement, and noise reduction.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <span className="text-xs font-semibold">1. Original Scan</span>
                  <div className="border border-border/40 rounded-xl overflow-hidden bg-slate-950/20 max-h-[420px] flex items-center justify-center p-2">
                    {property.original_image_base64 ? (
                      <img
                        src={property.original_image_base64}
                        alt="Original Document"
                        className="max-h-[380px] w-auto object-contain rounded"
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground">Original image preview unavailable</span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-semibold">2. Preprocessed (Deskewed & Enhanced)</span>
                  <div className="border border-border/40 rounded-xl overflow-hidden bg-slate-950/20 max-h-[420px] flex items-center justify-center p-2">
                    {property.processed_image_base64 ? (
                      <img
                        src={property.processed_image_base64}
                        alt="Preprocessed Document"
                        className="max-h-[380px] w-auto object-contain rounded"
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground">Preprocessed preview unavailable</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Layout Regions */}
          {activeTab === "layout" && (
            <div className="space-y-3">
              <span className="text-xs font-semibold text-primary">Detected Document Contour Regions</span>
              <div className="space-y-2">
                {(property.layout_regions || []).map((r, i) => (
                  <div key={i} className="p-3 rounded-lg border border-border/40 bg-muted/20 flex items-center justify-between text-xs font-mono">
                    <span className="font-semibold text-foreground">{r.name} ({r.label})</span>
                    <Badge variant="outline">
                      x={r.box.x}, y={r.box.y}, w={r.box.width}, h={r.box.height}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: Table Reconstruction */}
          {activeTab === "tables" && (
            <div className="space-y-4">
              <span className="text-xs font-semibold text-primary">Extracted Survey Table Grid</span>
              {property.survey_details && property.survey_details.length > 0 ? (
                <div className="rounded-xl border border-border/40 overflow-hidden">
                  <table className="w-full text-xs font-mono">
                    <thead className="bg-muted/60 text-muted-foreground">
                      <tr>
                        <th className="p-2.5 text-left">Row</th>
                        <th className="p-2.5 text-left">Survey No</th>
                        <th className="p-2.5 text-left">Subdivision</th>
                        <th className="p-2.5 text-left">Area</th>
                        <th className="p-2.5 text-left">Display</th>
                        <th className="p-2.5 text-left">Evidence Region</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {property.survey_details.map((s, idx) => (
                        <tr key={idx} className="hover:bg-muted/30">
                          <td className="p-2.5 text-muted-foreground">#{idx + 1}</td>
                          <td className="p-2.5 font-bold text-primary">{s.survey_no}</td>
                          <td className="p-2.5">{s.subdivision || "-"}</td>
                          <td className="p-2.5">{s.area}</td>
                          <td className="p-2.5">{s.display}</td>
                          <td className="p-2.5 text-[11px] text-muted-foreground">
                            {s.source_region ? `x:${s.source_region.x}, y:${s.source_region.y}` : "Matched from OCR"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No tabular data detected in this document.</p>
              )}
            </div>
          )}

          {/* TAB 5: Validation Layer */}
          {activeTab === "validation" && (
            <div className="space-y-4 text-xs">
              <div className="p-3 rounded-xl border border-primary/30 bg-primary/5 space-y-2">
                <div className="flex items-center justify-between font-semibold">
                  <span>Document Validation Status:</span>
                  <Badge variant={property.validation?.status === "VALID" ? "default" : "secondary"}>
                    {property.validation?.status || "PARTIAL"}
                  </Badge>
                </div>
                <p className="text-muted-foreground">{property.validation?.summary || "Document checked for essential cadastral survey parameters."}</p>
              </div>

              {property.area_validation && (
                <div className="p-3 rounded-xl border border-border/40 bg-muted/20 space-y-2">
                  <div className="flex items-center justify-between font-semibold">
                    <span>Area Consistency Verification:</span>
                    <Badge variant={property.area_validation.is_consistent ? "default" : "destructive"}>
                      {property.area_validation.status}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">{property.area_validation.message}</p>
                </div>
              )}

              <div className="p-3 rounded-xl border border-border/40 bg-muted/20 space-y-2">
                <span className="font-semibold flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-primary" /> GIS Localization Resolution:
                </span>
                <p className="text-muted-foreground">
                  Status: <strong>{property.location_status}</strong> • Level: <strong>{property.level}</strong>
                </p>
                <p className="text-muted-foreground">
                  Coordinates: <strong>{property.coordinates ? `${property.coordinates[0]}, ${property.coordinates[1]}` : "None (Unresolved)"}</strong>
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DebugModeDrawer;
