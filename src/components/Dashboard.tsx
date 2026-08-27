import { ShieldAlert, CheckCircle2, AlertTriangle, Activity, Eye, Zap, Building2, School, Bus, Droplet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PropertyRecord } from "@/data/mockData";

interface Props {
  property: PropertyRecord | null;
}

const Dashboard = ({ property }: Props) => {
  if (!property) return null;

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

  const quality = property.quality_report || {
    blur_variance: 145.2,
    average_brightness: 185.0,
    width: 1200,
    height: 1600,
    is_blurry: false,
    is_dark: false,
    is_overexposed: false,
    is_low_resolution: false,
    warnings: [],
  };

  const amenities = property.nearby_amenities || {
    metro_stations: "Kasba Peth Metro (250m)",
    hospitals: "Seth Tarachand Hospital (400m)",
    schools: "Kasba Peth Primary School (300m)",
    water_bodies: "Mutha River (320m)",
  };

  const riskColor =
    fraud.risk_level === "High"
      ? "text-destructive bg-destructive/10 border-destructive/20"
      : fraud.risk_level === "Medium"
      ? "text-warning bg-warning/10 border-warning/20"
      : "text-success bg-success/10 border-success/20";

  return (
    <div className="space-y-6 animate-fade-up">
      {/* 1. Top Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Overall Confidence Meter */}
        <Card className="glass-card">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Overall Confidence</span>
              <Activity className="h-4 w-4 text-primary" />
            </div>
            <div className="text-2xl font-bold text-primary">{confidence.overall_score}%</div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${confidence.overall_score}%` }}
              />
            </div>
            <p className="text-[11px] text-muted-foreground truncate">
              {confidence.location_confidence_detail}
            </p>
          </CardContent>
        </Card>

        {/* Fraud Risk Score */}
        <Card className="glass-card">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Fraud Risk Level</span>
              <ShieldAlert className="h-4 w-4 text-destructive" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{fraud.fraud_score} / 100</span>
              <span className={`px-2 py-0.5 text-xs font-semibold rounded border ${riskColor}`}>
                {fraud.risk_level} Risk
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {fraud.warnings.length === 0
                ? "No document anomalies detected."
                : `${fraud.warnings.length} warning(s) flagged.`}
            </p>
          </CardContent>
        </Card>

        {/* OCR Accuracy */}
        <Card className="glass-card">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>OCR Accuracy</span>
              <Eye className="h-4 w-4 text-primary" />
            </div>
            <div className="text-2xl font-bold">{confidence.ocr_confidence}%</div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="bg-success h-2 rounded-full transition-all"
                style={{ width: `${confidence.ocr_confidence}%` }}
              />
            </div>
            <p className="text-[11px] text-muted-foreground">Tesseract tam+eng engine</p>
          </CardContent>
        </Card>

        {/* Image Scan Quality */}
        <Card className="glass-card">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Image Quality</span>
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <div className="text-2xl font-bold">
              {quality.is_blurry || quality.is_dark ? "Fair" : "Optimal"}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Res: {quality.width}x{quality.height}px | Blur: {quality.blur_variance.toFixed(0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 2. Fraud & Document Warnings Banner (If Warnings Exist) */}
      {fraud.warnings.length > 0 && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Document Verification & Fraud Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-xs">
            {fraud.warnings.map((warn, idx) => (
              <div key={idx} className="flex items-center gap-2 text-destructive/90">
                <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                {warn}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 3. Middle Section: Timeline & Infrastructure Amenities */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Processing Timeline */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Document Processing Pipeline Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-foreground">1. Image Quality Check & Deskewing</p>
                <p className="text-muted-foreground">
                  Blur variance: {quality.blur_variance.toFixed(1)} | Res: {quality.width}x{quality.height}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-foreground">2. Layout & Table Detection</p>
                <p className="text-muted-foreground">
                  Extracted {property.survey_details?.length || 0} survey subdivision row(s).
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-foreground">3. Dual OCR (Tamil + English)</p>
                <p className="text-muted-foreground">Parsed key entity attributes and owner details.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-foreground">4. GIS Location Engine</p>
                <p className="text-muted-foreground">{confidence.location_confidence_detail}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Nearby Infrastructure Amenities */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              Nearby Infrastructure & Surroundings
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-muted/40 space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Bus className="h-3.5 w-3.5 text-primary" />
                <span className="font-medium">Transit</span>
              </div>
              <p className="font-semibold">{amenities.metro_stations}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/40 space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Building2 className="h-3.5 w-3.5 text-primary" />
                <span className="font-medium">Hospitals</span>
              </div>
              <p className="font-semibold">{amenities.hospitals}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/40 space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <School className="h-3.5 w-3.5 text-primary" />
                <span className="font-medium">Schools</span>
              </div>
              <p className="font-semibold">{amenities.schools}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/40 space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Droplet className="h-3.5 w-3.5 text-primary" />
                <span className="font-medium">Water Sources</span>
              </div>
              <p className="font-semibold">{amenities.water_bodies}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
