import { useState, useCallback } from "react";
import Header from "@/components/Header";
import DocumentUpload from "@/components/DocumentUpload";
import ExtractedData from "@/components/ExtractedData";
import PropertyMap from "@/components/PropertyMap";
import LandInsights from "@/components/LandInsights";
import PropertyTable from "@/components/PropertyTable";
import { sampleProperties } from "@/data/mockData";
import type { PropertyRecord } from "@/data/mockData";

const Index = () => {
  const [extractedProperty, setExtractedProperty] = useState<PropertyRecord | null>(null);
  const [rawText, setRawText] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleExtracted = useCallback((property: PropertyRecord, text: string) => {
    setExtractedProperty(property);
    setRawText(text);
    setSelectedId(property.id);
  }, []);

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
    const found = sampleProperties.find((p) => p.id === id);
    if (found) {
      setExtractedProperty(found);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Top row: Upload + Extracted Data */}
        <div className="grid md:grid-cols-2 gap-6">
          <DocumentUpload onExtracted={handleExtracted} />
          <ExtractedData property={extractedProperty} rawText={rawText} />
        </div>

        {/* Map */}
        <PropertyMap
          properties={sampleProperties}
          selectedId={selectedId}
          onSelect={handleSelect}
        />

        {/* Insights */}
        <LandInsights visible={!!extractedProperty} />

        {/* Table */}
        <PropertyTable
          properties={sampleProperties}
          selectedId={selectedId}
          onSelect={handleSelect}
        />
      </main>

      <footer className="border-t border-border/50 py-4 text-center text-xs text-muted-foreground">
        SmartLand AI — Property Locator & Land Intelligence System © 2026
      </footer>
    </div>
  );
};

export default Index;
