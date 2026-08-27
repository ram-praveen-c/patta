import { User, Hash, MapPin, Ruler, Table } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PropertyRecord } from "@/data/mockData";

interface Props {
  property: PropertyRecord | null;
  rawText: string;
}

const ExtractedData = ({ property, rawText }: Props) => {
  if (!property) {
    return (
      <Card className="glass-card h-full flex items-center justify-center">
        <p className="text-sm text-muted-foreground py-12">Upload a document to see extracted data</p>
      </Card>
    );
  }

  const fields = [
    { icon: User, label: "Owner", value: property.owner },
    { icon: Hash, label: "Patta No.", value: property.patta_number || "N/A" },
    { icon: MapPin, label: "Village", value: property.village },
    { icon: Ruler, label: "Total Area", value: property.land_area },
  ];

  const hasTable = property.survey_details && property.survey_details.length > 0;

  return (
    <Card className="glass-card animate-fade-up">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <span className="flex items-center gap-2">
            <Table className="h-5 w-5 text-primary" />
            Extracted Data
          </span>
          <Badge variant="secondary" className="bg-success/15 text-success border-success/30">
            Layout Analyzed
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 mb-4">
          {fields.map((f) => (
            <div key={f.label} className="p-3 rounded-lg bg-muted/50 space-y-1 border border-border/50">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <f.icon className="h-3 w-3" />
                {f.label}
              </div>
              <p className="text-sm font-semibold truncate">{f.value}</p>
            </div>
          ))}
        </div>

        <Tabs defaultValue={hasTable ? "table" : "raw"} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="table" disabled={!hasTable}>Structured Table</TabsTrigger>
            <TabsTrigger value="raw">Raw OCR Output</TabsTrigger>
          </TabsList>
          
          <TabsContent value="table" className="mt-4">
            {hasTable ? (
              <div className="rounded-md border overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted text-muted-foreground text-xs uppercase">
                    <tr>
                      <th className="px-4 py-3 border-b">Survey No</th>
                      <th className="px-4 py-3 border-b">Subdivision</th>
                      <th className="px-4 py-3 border-b">Area</th>
                    </tr>
                  </thead>
                  <tbody>
                    {property.survey_details!.map((row, i) => (
                      <tr key={i} className="border-b last:border-0 bg-background/50 hover:bg-muted/50 transition-colors">
                        <td className="px-4 py-2 font-medium">{row.survey_no || "-"}</td>
                        <td className="px-4 py-2">{row.subdivision || "-"}</td>
                        <td className="px-4 py-2 text-right">{row.area || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground text-sm border rounded-lg border-dashed">
                No tables detected in the document.
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="raw" className="mt-4">
            <pre className="p-4 rounded-lg bg-muted/50 text-xs whitespace-pre-wrap h-64 overflow-y-auto font-mono leading-relaxed border">
              {rawText || "No text extracted."}
            </pre>
          </TabsContent>
        </Tabs>

      </CardContent>
    </Card>
  );
};

export default ExtractedData;
