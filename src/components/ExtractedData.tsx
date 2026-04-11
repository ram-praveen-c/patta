import { User, Hash, MapPin, Ruler, FileText, Percent } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
    { icon: Hash, label: "Survey No.", value: property.survey_number },
    { icon: MapPin, label: "Village", value: property.village },
    { icon: Ruler, label: "Land Area", value: property.land_area },
    { icon: FileText, label: "Doc Type", value: property.document_type },
    { icon: Percent, label: "Confidence", value: `${property.confidence}%` },
  ];

  return (
    <Card className="glass-card animate-fade-up">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <span className="flex items-center gap-2">
            <Hash className="h-5 w-5 text-primary" />
            Extracted Data (NLP)
          </span>
          <Badge variant="secondary" className="bg-success/15 text-success border-success/30">
            {property.confidence}% Match
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {fields.map((f) => (
            <div key={f.label} className="p-3 rounded-lg bg-muted/50 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <f.icon className="h-3 w-3" />
                {f.label}
              </div>
              <p className="text-sm font-semibold">{f.value}</p>
            </div>
          ))}
        </div>

        <details className="group">
          <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
            View raw OCR text →
          </summary>
          <pre className="mt-2 p-3 rounded-lg bg-muted/50 text-xs whitespace-pre-wrap max-h-48 overflow-y-auto font-mono leading-relaxed">
            {rawText}
          </pre>
        </details>
      </CardContent>
    </Card>
  );
};

export default ExtractedData;
