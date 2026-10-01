import { useState, useRef, useEffect } from "react";
import { Eye, ZoomIn, ZoomOut, RotateCcw, Crosshair, Layers, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/LanguageContext";
import type { PropertyRecord } from "@/data/mockData";

interface Props {
  property: PropertyRecord | null;
  highlightedField?: string | null;
  onClearHighlight?: () => void;
}

export const DocumentEvidenceViewer = ({ property, highlightedField, onClearHighlight }: Props) => {
  const { t } = useLanguage();
  const [zoom, setZoom] = useState(1);
  const [showLayoutRegions, setShowLayoutRegions] = useState(true);
  const [showAllTokens, setShowAllTokens] = useState(false);
  const [selectedToken, setSelectedToken] = useState<any | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Active highlighted region from field evidence
  const activeRegion = highlightedField && property?.evidence ? property.evidence[highlightedField] : null;

  const originalImg = property?.original_image_base64;
  const layoutRegions = property?.layout_regions || [];
  const tokens = property?.tokens || [];

  // Reset zoom on document change
  useEffect(() => {
    setZoom(1);
    setSelectedToken(null);
  }, [property?.id]);

  if (!property || !originalImg) {
    return (
      <Card className="glass-card">
        <CardHeader className="pb-3 border-b border-border/40">
          <CardTitle className="text-base flex items-center gap-2">
            <Eye className="h-4 w-4 text-primary" />
            {t.evidenceViewerTitle}
          </CardTitle>
        </CardHeader>
        <CardContent className="py-10 text-center text-muted-foreground text-xs">
          Upload a document to inspect visual OCR tokens and field evidence overlays.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card overflow-hidden">
      <CardHeader className="pb-3 border-b border-border/40 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <Eye className="h-4 w-4 text-primary" />
            {t.evidenceViewerTitle}
          </CardTitle>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {t.evidenceHelp}
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant={showLayoutRegions ? "default" : "outline"}
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => setShowLayoutRegions(!showLayoutRegions)}
          >
            <Layers className="h-3 w-3" />
            Regions
          </Button>

          <Button
            variant={showAllTokens ? "default" : "outline"}
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => setShowAllTokens(!showAllTokens)}
          >
            <Crosshair className="h-3 w-3" />
            Tokens
          </Button>

          <div className="flex items-center bg-muted/50 rounded-lg p-0.5 border border-border/40">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setZoom((z) => Math.max(0.6, z - 0.2))}
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <span className="text-[11px] px-1.5 font-mono">{Math.round(zoom * 100)}%</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setZoom((z) => Math.min(2.5, z + 0.2))}
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 ml-0.5"
              onClick={() => {
                setZoom(1);
                onClearHighlight?.();
              }}
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 relative">
        {/* Active field highlight indicator bar */}
        {highlightedField && (
          <div className="bg-primary/10 border-b border-primary/20 px-4 py-2 flex items-center justify-between text-xs animate-fade-in">
            <span className="flex items-center gap-1.5 font-medium text-primary">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Highlighting source evidence for: <strong>{highlightedField}</strong>
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[11px] text-muted-foreground hover:text-foreground"
              onClick={onClearHighlight}
            >
              Clear Highlight
            </Button>
          </div>
        )}

        {/* Selected token inspector popover */}
        {selectedToken && (
          <div className="absolute top-3 right-3 z-30 bg-background/95 backdrop-blur border border-primary/40 rounded-xl p-3 shadow-xl max-w-xs text-xs space-y-1 animate-fade-in">
            <div className="flex items-center justify-between font-semibold text-primary">
              <span>Verified OCR Token</span>
              <Badge variant="outline" className="text-[10px] h-4">
                {selectedToken.confidence}% Conf
              </Badge>
            </div>
            <p className="font-mono text-sm bg-muted/50 p-1.5 rounded">{selectedToken.text}</p>
            <p className="text-[10px] text-muted-foreground">
              Box: x={selectedToken.x}, y={selectedToken.y}, w={selectedToken.width}, h={selectedToken.height}
            </p>
          </div>
        )}

        {/* Scrollable Document Canvas with Bounding Box Overlays */}
        <div
          ref={containerRef}
          className="overflow-auto max-h-[580px] bg-slate-950/20 p-4 flex justify-center items-start min-h-[350px]"
        >
          <div
            className="relative transition-transform duration-150 origin-top shadow-2xl rounded-lg overflow-hidden border border-border/40"
            style={{ transform: `scale(${zoom})` }}
          >
            <img
              src={originalImg}
              alt="Uploaded Land Document"
              className="max-w-none block pointer-events-none select-none"
              style={{ width: "850px", height: "auto" }}
            />

            {/* SVG Overlay Layer for Exact Bounding Boxes */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-auto"
              viewBox={`0 0 ${containerRef.current?.querySelector("img")?.naturalWidth || 850} ${containerRef.current?.querySelector("img")?.naturalHeight || 1100}`}
            >
              {/* 1. Layout Regions */}
              {showLayoutRegions &&
                layoutRegions.map((region, idx) => {
                  const b = region.box;
                  return (
                    <g key={`region-${idx}`}>
                      <rect
                        x={b.x}
                        y={b.y}
                        width={b.width}
                        height={b.height}
                        fill="rgba(59, 130, 246, 0.04)"
                        stroke="rgba(59, 130, 246, 0.45)"
                        strokeWidth="1.5"
                        strokeDasharray="4 3"
                      />
                      <text
                        x={b.x + 8}
                        y={b.y + 18}
                        fill="#3b82f6"
                        fontSize="12"
                        fontWeight="600"
                        className="select-none pointer-events-none"
                      >
                        {region.name}
                      </text>
                    </g>
                  );
                })}

              {/* 2. All OCR Word Tokens */}
              {showAllTokens &&
                tokens.map((tok, idx) => (
                  <rect
                    key={`token-${idx}`}
                    x={tok.x}
                    y={tok.y}
                    width={tok.width}
                    height={tok.height}
                    fill="rgba(34, 197, 94, 0.08)"
                    stroke="rgba(34, 197, 94, 0.4)"
                    strokeWidth="1"
                    className="cursor-pointer hover:fill-primary/30 transition-colors"
                    onClick={() => setSelectedToken(tok)}
                  />
                ))}

              {/* 3. Prominently Highlighted Active Field Evidence */}
              {activeRegion && (
                <g>
                  <rect
                    x={activeRegion.x - 4}
                    y={activeRegion.y - 4}
                    width={activeRegion.width + 8}
                    height={activeRegion.height + 8}
                    fill="rgba(245, 158, 11, 0.25)"
                    stroke="#f59e0b"
                    strokeWidth="3"
                    rx="3"
                    className="animate-pulse"
                  />
                  <rect
                    x={activeRegion.x - 4}
                    y={activeRegion.y - 24}
                    width={Math.max(100, activeRegion.width + 8)}
                    height="20"
                    fill="#f59e0b"
                    rx="3"
                  />
                  <text
                    x={activeRegion.x}
                    y={activeRegion.y - 9}
                    fill="#000000"
                    fontSize="11"
                    fontWeight="700"
                    className="select-none"
                  >
                    {highlightedField} ({Math.round(activeRegion.confidence || 90)}%)
                  </text>
                </g>
              )}
            </svg>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentEvidenceViewer;
