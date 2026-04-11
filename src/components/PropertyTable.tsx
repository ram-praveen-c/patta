import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { PropertyRecord } from "@/data/mockData";

interface Props {
  properties: PropertyRecord[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const PropertyTable = ({ properties, selectedId, onSelect }: Props) => (
  <Card className="glass-card">
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-2 text-lg">
        <Database className="h-5 w-5 text-primary" />
        Property Records ({properties.length})
      </CardTitle>
    </CardHeader>
    <CardContent className="p-0">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left py-2.5 px-4 font-medium text-muted-foreground">ID</th>
              <th className="text-left py-2.5 px-4 font-medium text-muted-foreground">Owner</th>
              <th className="text-left py-2.5 px-4 font-medium text-muted-foreground">Survey No.</th>
              <th className="text-left py-2.5 px-4 font-medium text-muted-foreground">Village</th>
              <th className="text-left py-2.5 px-4 font-medium text-muted-foreground">Area</th>
              <th className="text-left py-2.5 px-4 font-medium text-muted-foreground">Confidence</th>
            </tr>
          </thead>
          <tbody>
            {properties.map((p) => (
              <tr
                key={p.id}
                onClick={() => onSelect(p.id)}
                className={`border-b border-border/50 cursor-pointer transition-colors hover:bg-primary/5 ${
                  selectedId === p.id ? "bg-primary/10" : ""
                }`}
              >
                <td className="py-2.5 px-4 font-mono text-xs">{p.id}</td>
                <td className="py-2.5 px-4 font-medium">{p.owner}</td>
                <td className="py-2.5 px-4">{p.survey_number}</td>
                <td className="py-2.5 px-4">{p.village}</td>
                <td className="py-2.5 px-4">{p.land_area}</td>
                <td className="py-2.5 px-4">
                  <Badge
                    variant="secondary"
                    className={
                      p.confidence >= 90
                        ? "bg-success/15 text-success border-success/30"
                        : "bg-warning/15 text-warning border-warning/30"
                    }
                  >
                    {p.confidence}%
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </CardContent>
  </Card>
);

export default PropertyTable;
