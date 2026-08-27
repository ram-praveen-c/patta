import { Printer, ShieldCheck, MapPin, AlertTriangle, FileText, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { PropertyRecord } from "@/data/mockData";

interface Props {
  property: PropertyRecord | null;
  rawText: string;
}

const PrintReport = ({ property, rawText }: Props) => {
  if (!property) return null;

  const handlePrint = () => {
    window.print();
  };

  const confidence = property.confidence_scores || {
    ocr_confidence: property.confidence || 90,
    location_confidence: 85,
    location_confidence_detail: "High (OSM Nominatim API)",
    overall_score: property.confidence || 90,
  };

  const fraud = property.fraud_report || {
    fraud_score: 0,
    risk_level: "Low",
    warnings: [],
  };

  return (
    <div className="space-y-4">
      {/* Action Button */}
      <div className="flex justify-end">
        <Button onClick={handlePrint} variant="default" size="sm" className="gap-2">
          <Printer className="h-4 w-4" /> Download / Print PDF Report
        </Button>
      </div>

      {/* Printable Sheet */}
      <Card className="glass-card p-6 print:shadow-none print:border-none print:p-0">
        <CardContent className="space-y-6 p-0 text-foreground">
          {/* Document Header */}
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h1 className="text-xl font-bold text-primary flex items-center gap-2">
                <ShieldCheck className="h-6 w-6 text-primary" />
                LandLens GIS Intelligence Report
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Official Land Record Audit & Geospatial Intelligence Analysis
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-muted font-bold">
                {property.id}
              </span>
              <p className="text-[11px] text-muted-foreground mt-1">
                Generated: {new Date(property.extracted_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Key Summary Cards */}
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-lg border border-border bg-muted/20">
              <span className="text-muted-foreground font-medium">Overall Score</span>
              <p className="text-lg font-bold text-primary">{confidence.overall_score}%</p>
            </div>
            <div className="p-3 rounded-lg border border-border bg-muted/20">
              <span className="text-muted-foreground font-medium">Fraud Risk Level</span>
              <p
                className={`text-lg font-bold ${
                  fraud.risk_level === "High"
                    ? "text-destructive"
                    : fraud.risk_level === "Medium"
                    ? "text-warning"
                    : "text-success"
                }`}
              >
                {fraud.risk_level} Risk ({fraud.fraud_score}/100)
              </p>
            </div>
            <div className="p-3 rounded-lg border border-border bg-muted/20">
              <span className="text-muted-foreground font-medium">Location Precision</span>
              <p className="text-xs font-bold truncate mt-1">
                {confidence.location_confidence_detail}
              </p>
            </div>
          </div>

          {/* Property Attributes Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" /> Extracted Entity Attributes
            </h3>
            <table className="w-full text-xs border border-border rounded-lg overflow-hidden">
              <tbody className="divide-y divide-border">
                <tr className="bg-muted/40">
                  <td className="p-2.5 font-semibold w-1/3">Registered Owner:</td>
                  <td className="p-2.5 font-bold">{property.owner}</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-semibold">Survey & Subdivision:</td>
                  <td className="p-2.5">
                    {property.survey_number} / {property.subdivision || "1A"}
                  </td>
                </tr>
                <tr className="bg-muted/40">
                  <td className="p-2.5 font-semibold">Patta Number:</td>
                  <td className="p-2.5">{property.patta_number || "N/A"}</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-semibold">Village / Location:</td>
                  <td className="p-2.5">{property.village}</td>
                </tr>
                <tr className="bg-muted/40">
                  <td className="p-2.5 font-semibold">Taluk & District:</td>
                  <td className="p-2.5">
                    {property.taluk || "N/A"}, {property.district || "N/A"}
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 font-semibold">Recorded Area:</td>
                  <td className="p-2.5 font-bold text-primary">{property.land_area}</td>
                </tr>
                <tr className="bg-muted/40">
                  <td className="p-2.5 font-semibold">Land Classification:</td>
                  <td className="p-2.5">{property.classification || "Residential"}</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-semibold">Document Type:</td>
                  <td className="p-2.5">{property.document_type}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Survey Subdivision Table */}
          {property.survey_details && property.survey_details.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-success" /> Survey Subdivision Extracted Table
              </h3>
              <table className="w-full text-xs border border-border rounded-lg overflow-hidden text-left">
                <thead className="bg-muted/60 font-semibold border-b border-border">
                  <tr>
                    <th className="p-2">Survey No.</th>
                    <th className="p-2">Subdivision</th>
                    <th className="p-2">Subdivision Area</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {property.survey_details.map((sub, idx) => (
                    <tr key={idx}>
                      <td className="p-2 font-medium">{sub.survey_no}</td>
                      <td className="p-2">{sub.subdivision}</td>
                      <td className="p-2">{sub.area}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Fraud Analysis Alerts */}
          {fraud.warnings.length > 0 && (
            <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/5 space-y-1">
              <h4 className="text-xs font-bold text-destructive flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" /> Fraud Verification Warnings
              </h4>
              <ul className="list-disc list-inside text-xs text-destructive/90 space-y-0.5">
                {fraud.warnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Raw OCR Section */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" /> Raw OCR Extracted Text
            </h3>
            <pre className="p-3 rounded-lg bg-muted/40 text-[11px] font-mono whitespace-pre-wrap leading-relaxed max-h-40 overflow-hidden border border-border">
              {rawText || "No text parsed."}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PrintReport;
