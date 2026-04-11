import { useState, useCallback } from "react";
import Header from "@/components/Header";
import DocumentUpload from "@/components/DocumentUpload";
import ExtractedData from "@/components/ExtractedData";
import PropertyMap from "@/components/PropertyMap";
import LandInsights from "@/components/LandInsights";
import PropertyTable from "@/components/PropertyTable";
import type { PropertyRecord } from "@/data/mockData";

const Index = () => {
  const [properties, setProperties] = useState<PropertyRecord[]>([]);
  const [extractedProperty, setExtractedProperty] = useState<PropertyRecord | null>(null);
  const [rawText, setRawText] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleExtracted = useCallback((property: PropertyRecord, text: string) => {
    setExtractedProperty(property);
    setRawText(text);
    setSelectedId(property.id);
    setProperties((prev) => {
      // Replace if same id, otherwise add
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6 space-y-6">
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
            <LandInsights visible={!!extractedProperty} />
            <PropertyTable
              properties={properties}
              selectedId={selectedId}
              onSelect={handleSelect}
            />
          </>
        )}

        {properties.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-sm">Upload a land document to see extracted data, map location, and insights.</p>
          </div>
        )}
      </main>

      <footer className="border-t border-border/50 py-4 text-center text-xs text-muted-foreground">
        SmartLand AI — Property Locator & Land Intelligence System © 2026
      </footer>
    </div>
  );
};

export default Index;
