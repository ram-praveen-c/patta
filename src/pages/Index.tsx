import { useState, useCallback } from "react";
import Header from "@/components/Header";
import DocumentUpload from "@/components/DocumentUpload";
import ExtractedData from "@/components/ExtractedData";
import { DocumentEvidenceViewer } from "@/components/DocumentEvidenceViewer";
import { RawOcrModal } from "@/components/RawOcrModal";
import { DebugModeDrawer } from "@/components/DebugModeDrawer";
import CadastralLocatorResult from "@/components/CadastralLocatorResult";
import PropertyMap from "@/components/PropertyMap";
import LandInsights from "@/components/LandInsights";
import PropertyTable from "@/components/PropertyTable";
import Dashboard from "@/components/Dashboard";
import DocumentCompare from "@/components/DocumentCompare";
import HistoryView from "@/components/HistoryView";
import ChatAssistant from "@/components/ChatAssistant";
import PrintReport from "@/components/PrintReport";
import CadastralAdmin from "@/components/CadastralAdmin";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutGrid, BarChart3, ArrowLeftRight, History, MessageSquare, Printer, Database } from "lucide-react";
import type { PropertyRecord } from "@/data/mockData";
import { locateLand, type LocateLandParams } from "@/lib/cadastralApi";
import { useLanguage } from "@/lib/LanguageContext";

const Index = () => {
  const { t, debugMode, setDebugMode } = useLanguage();
  const [properties, setProperties] = useState<PropertyRecord[]>([]);
  const [extractedProperty, setExtractedProperty] = useState<PropertyRecord | null>(null);
  const [rawText, setRawText] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [isLocating, setIsLocating] = useState(false);

  // Evidence highlighting and debugging modals
  const [highlightedField, setHighlightedField] = useState<string | null>(null);
  const [rawOcrOpen, setRawOcrOpen] = useState(false);
  const [debugDrawerOpen, setDebugDrawerOpen] = useState(false);

  const handleExtracted = useCallback((property: PropertyRecord, text: string) => {
    setExtractedProperty(property);
    setRawText(text);
    setSelectedId(property.id);
    setHighlightedField(null);
    setProperties((prev) => {
      const exists = prev.find((p) => p.id === property.id);
      if (exists) return prev.map((p) => (p.id === property.id ? property : p));
      return [...prev, property];
    });
  }, []);

  const handleSelect = useCallback(
    (id: string) => {
      setSelectedId(id);
      const found = properties.find((p) => p.id === id);
      if (found) {
        setExtractedProperty(found);
        setHighlightedField(null);
      }
    },
    [properties]
  );

  const handleSelectFromHistory = (property: PropertyRecord) => {
    setExtractedProperty(property);
    setRawText(property.rawText || "Historical document record loaded.");
    setSelectedId(property.id);
    setHighlightedField(null);
    setProperties((prev) => {
      const exists = prev.find((p) => p.id === property.id);
      if (exists) return prev;
      return [...prev, property];
    });
    setActiveTab("overview");
  };

  // Patta-to-Cadastral Parcel Localization Search Handler
  const handleLocateLand = async (params: LocateLandParams) => {
    setIsLocating(true);
    try {
      const res = await locateLand({
        ...params,
        document_id: extractedProperty?.id,
        ocr_confidence: (extractedProperty?.confidence_scores?.ocr_confidence || 94) / 100.0
      });

      if (extractedProperty) {
        let boundaryPoints: [number, number][] | undefined = undefined;
        if (res.geometry) {
          if (Array.isArray(res.geometry) && res.geometry.length > 0) {
            if (Array.isArray(res.geometry[0]) && typeof res.geometry[0][0] === "number") {
              boundaryPoints = res.geometry as [number, number][];
            } else if (res.geometry.coordinates && res.geometry.coordinates[0]) {
              boundaryPoints = res.geometry.coordinates[0].map((pt: [number, number]) => [pt[1], pt[0]]);
            }
          }
        }

        const updated: PropertyRecord = {
          ...extractedProperty,
          survey_number: res.survey_number || params.survey_number,
          subdivision: res.subdivision || params.subdivision,
          survey_display: `${res.survey_number || params.survey_number}${res.subdivision || params.subdivision ? `/${res.subdivision || params.subdivision}` : ""}`,
          village: res.village || params.village || extractedProperty.village,
          panchayat: res.panchayat || params.panchayat || extractedProperty.panchayat,
          taluk: res.taluk || params.taluk || extractedProperty.taluk,
          district: res.district || params.district || extractedProperty.district,
          coordinates: res.centroid || extractedProperty.coordinates,
          boundary: boundaryPoints || extractedProperty.boundary,
          location_status: res.location_status,
          match_type: res.match_type,
          level: res.level,
          level_description: res.level_description,
          patta_area: res.patta_area,
          gis_area: res.gis_area,
          area_difference: res.area_difference,
          area_difference_percentage: res.area_difference_percentage,
          area_validation_status: res.area_validation_status,
          area_validation_message: res.area_validation_message,
          source: res.source,
          multi_confidence: res.confidence ? {
            ocr: Math.round((res.confidence.ocr || 0.94) * 100),
            survey_match: Math.round((res.confidence.survey_match || 0.98) * 100),
            location_match: Math.round((res.confidence.location_match || 1.0) * 100),
            parcel_match: Math.round((res.confidence.parcel_match || 1.0) * 100),
            overall: Math.round((res.confidence.overall || 0.98) * 100)
          } : undefined
        };

        setExtractedProperty(updated);
        setProperties((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      }
    } catch (err: any) {
      console.error("Locate land error:", err);
    } finally {
      setIsLocating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onOpenDebug={() => setDebugDrawerOpen(true)} />
      <main className="max-w-7xl mx-auto px-2.5 sm:px-4 py-3 sm:py-6 space-y-4 sm:space-y-6">
        {/* Navigation Tabs Header */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex items-center border-b border-border/30 pb-2 mb-4 overflow-x-auto no-scrollbar -mx-2.5 px-2.5 sm:mx-0 sm:px-0">
            <TabsList className="glass-card bg-muted/60 p-1 flex-nowrap inline-flex h-9 sm:h-10">
              <TabsTrigger value="overview" className="gap-1.5 text-xs py-1 px-2.5 sm:px-3 whitespace-nowrap">
                <LayoutGrid className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> {t.tabOverview}
              </TabsTrigger>
              <TabsTrigger value="analytics" className="gap-1.5 text-xs py-1 px-2.5 sm:px-3 whitespace-nowrap">
                <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> {t.tabAnalytics}
              </TabsTrigger>
              <TabsTrigger value="compare" className="gap-1.5 text-xs py-1 px-2.5 sm:px-3 whitespace-nowrap">
                <ArrowLeftRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> {t.tabCompare}
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-1.5 text-xs py-1 px-2.5 sm:px-3 whitespace-nowrap">
                <History className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> {t.tabHistory}
              </TabsTrigger>
              <TabsTrigger value="chat" className="gap-1.5 text-xs py-1 px-2.5 sm:px-3 whitespace-nowrap">
                <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> {t.tabChat}
              </TabsTrigger>
              <TabsTrigger value="report" className="gap-1.5 text-xs py-1 px-2.5 sm:px-3 whitespace-nowrap">
                <Printer className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> {t.tabReport}
              </TabsTrigger>
              <TabsTrigger value="admin" className="gap-1.5 text-xs py-1 px-2.5 sm:px-3 whitespace-nowrap text-primary font-medium">
                <Database className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> {t.tabAdmin}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* TAB 1: OVERVIEW & GIS MAP */}
          <TabsContent value="overview" className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <DocumentUpload
                onExtracted={handleExtracted}
                onOpenRawOcr={() => setRawOcrOpen(true)}
              />
              <ExtractedData
                property={extractedProperty}
                rawText={rawText}
                onLocateLand={handleLocateLand}
                isLocating={isLocating}
                onHighlightField={(f) => setHighlightedField(f)}
                onOpenRawOcr={() => setRawOcrOpen(true)}
              />
            </div>

            {/* Document Evidence Viewer: original scan with bounding boxes */}
            {extractedProperty && (
              <DocumentEvidenceViewer
                property={extractedProperty}
                highlightedField={highlightedField}
                onClearHighlight={() => setHighlightedField(null)}
              />
            )}

            {/* Research Feature: Patta-to-Cadastral Parcel Localization Card */}
            {extractedProperty && (
              <CadastralLocatorResult property={extractedProperty} />
            )}

            {properties.length > 0 && (
              <>
                <PropertyMap
                  properties={properties}
                  selectedId={selectedId}
                  onSelect={handleSelect}
                />
                <LandInsights property={extractedProperty} rawText={rawText} />
                <PropertyTable
                  properties={properties}
                  selectedId={selectedId}
                  onSelect={handleSelect}
                />
              </>
            )}

            {properties.length === 0 && (
              <div className="text-center py-16 text-muted-foreground glass-card rounded-xl">
                <p className="text-sm font-medium">Upload a Patta or Land Document to cross-reference against Panchayat Cadastral GIS.</p>
                <p className="text-xs text-muted-foreground mt-1">
                  The Patta document acts as the source of land identifiers; the Cadastral dataset provides verified geographic polygon boundaries.
                </p>
              </div>
            )}
          </TabsContent>

          {/* TAB 2: ANALYTICS & FRAUD DASHBOARD */}
          <TabsContent value="analytics" className="space-y-6">
            {extractedProperty ? (
              <Dashboard property={extractedProperty} />
            ) : (
              <div className="text-center py-16 text-muted-foreground glass-card rounded-xl">
                <p className="text-sm">Upload or select a property record to view risk analytics and confidence meters.</p>
              </div>
            )}
          </TabsContent>

          {/* TAB 3: DOCUMENT COMPARE */}
          <TabsContent value="compare" className="space-y-6">
            <DocumentCompare />
          </TabsContent>

          {/* TAB 4: AUDIT HISTORY */}
          <TabsContent value="history" className="space-y-6">
            <HistoryView onSelectProperty={handleSelectFromHistory} />
          </TabsContent>

          {/* TAB 5: AI CHAT ASSISTANT */}
          <TabsContent value="chat" className="space-y-6">
            <ChatAssistant property={extractedProperty} />
          </TabsContent>

          {/* TAB 6: PRINTABLE PDF REPORT */}
          <TabsContent value="report" className="space-y-6">
            <PrintReport property={extractedProperty} rawText={rawText} />
          </TabsContent>

          {/* TAB 7: PANCHAYAT GIS MAP DATA MANAGEMENT (ADMIN) */}
          <TabsContent value="admin" className="space-y-6">
            <CadastralAdmin />
          </TabsContent>
        </Tabs>
      </main>

      {/* Raw OCR Text Modal */}
      <RawOcrModal
        open={rawOcrOpen}
        onOpenChange={setRawOcrOpen}
        rawText={rawText}
        tokens={extractedProperty?.tokens}
      />

      {/* Developer / Pipeline Diagnostics Drawer */}
      <DebugModeDrawer
        open={debugDrawerOpen || debugMode}
        onOpenChange={(open) => {
          setDebugDrawerOpen(open);
          if (!open && debugMode) {
            setDebugMode(false);
          }
        }}
        property={extractedProperty}
        rawText={rawText}
      />

      <footer className="border-t border-border/50 py-4 text-center text-xs text-muted-foreground">
        SmartLand AI — Property Locator & GIS Land Intelligence Platform © 2026 • Patta-to-Cadastral Parcel Localization Architecture
      </footer>
    </div>
  );
};

export default Index;
