import { useState, useCallback } from "react";
import Header from "@/components/Header";
import DocumentUpload from "@/components/DocumentUpload";
import ExtractedData from "@/components/ExtractedData";
import PropertyMap from "@/components/PropertyMap";
import LandInsights from "@/components/LandInsights";
import PropertyTable from "@/components/PropertyTable";
import Dashboard from "@/components/Dashboard";
import DocumentCompare from "@/components/DocumentCompare";
import HistoryView from "@/components/HistoryView";
import ChatAssistant from "@/components/ChatAssistant";
import PrintReport from "@/components/PrintReport";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutGrid, BarChart3, ArrowLeftRight, History, MessageSquare, Printer } from "lucide-react";
import type { PropertyRecord } from "@/data/mockData";

const Index = () => {
  const [properties, setProperties] = useState<PropertyRecord[]>([]);
  const [extractedProperty, setExtractedProperty] = useState<PropertyRecord | null>(null);
  const [rawText, setRawText] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  const handleExtracted = useCallback((property: PropertyRecord, text: string) => {
    setExtractedProperty(property);
    setRawText(text);
    setSelectedId(property.id);
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
      if (found) setExtractedProperty(found);
    },
    [properties]
  );

  const handleSelectFromHistory = (property: PropertyRecord) => {
    setExtractedProperty(property);
    setRawText(property.rawText || "Historical document record loaded.");
    setSelectedId(property.id);
    setProperties((prev) => {
      const exists = prev.find((p) => p.id === property.id);
      if (exists) return prev;
      return [...prev, property];
    });
    setActiveTab("overview");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Navigation Tabs Header */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex items-center justify-between border-b border-border/40 pb-3 mb-6 overflow-x-auto">
            <TabsList className="glass-card bg-muted/60 p-1">
              <TabsTrigger value="overview" className="gap-2 text-xs">
                <LayoutGrid className="h-4 w-4" /> Overview & GIS Map
              </TabsTrigger>
              <TabsTrigger value="analytics" className="gap-2 text-xs">
                <BarChart3 className="h-4 w-4" /> Analytics & Fraud
              </TabsTrigger>
              <TabsTrigger value="compare" className="gap-2 text-xs">
                <ArrowLeftRight className="h-4 w-4" /> Document Compare
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2 text-xs">
                <History className="h-4 w-4" /> Audit History
              </TabsTrigger>
              <TabsTrigger value="chat" className="gap-2 text-xs">
                <MessageSquare className="h-4 w-4" /> AI Chat Assistant
              </TabsTrigger>
              <TabsTrigger value="report" className="gap-2 text-xs">
                <Printer className="h-4 w-4" /> Printable PDF Report
              </TabsTrigger>
            </TabsList>
          </div>

          {/* TAB 1: OVERVIEW & GIS MAP */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <DocumentUpload onExtracted={handleExtracted} />
              <ExtractedData property={extractedProperty} rawText={rawText} />
            </div>

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
                <p className="text-sm">Upload a land document (Sale Deed, Patta, 7/12) to see extracted OCR data, GIS parcel boundaries, and land insights.</p>
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
        </Tabs>
      </main>

      <footer className="border-t border-border/50 py-4 text-center text-xs text-muted-foreground">
        SmartLand AI — Property Locator & GIS Land Intelligence Platform © 2026
      </footer>
    </div>
  );
};

export default Index;
