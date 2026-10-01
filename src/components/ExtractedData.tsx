import { useState, useEffect } from "react";
import { User, Hash, MapPin, Ruler, Table, Compass, Edit3, Check, Loader2, Landmark, CheckCircle2, AlertTriangle, FileCode, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/lib/LanguageContext";
import type { PropertyRecord } from "@/data/mockData";
import type { LocateLandParams } from "@/lib/cadastralApi";

interface Props {
  property: PropertyRecord | null;
  rawText: string;
  onLocateLand?: (params: LocateLandParams) => Promise<void>;
  isLocating?: boolean;
  onHighlightField?: (fieldName: string) => void;
  onOpenRawOcr?: () => void;
}

const ExtractedData = ({
  property,
  rawText,
  onLocateLand,
  isLocating = false,
  onHighlightField,
  onOpenRawOcr
}: Props) => {
  const { t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<LocateLandParams>({
    survey_number: "",
    subdivision: "",
    village: "",
    panchayat: "",
    taluk: "",
    district: "",
    patta_area: ""
  });

  useEffect(() => {
    if (property) {
      setFormData({
        survey_number: property.survey_number || "",
        subdivision: property.subdivision || "",
        village: property.village || "",
        panchayat: property.panchayat || "",
        taluk: property.taluk || "",
        district: property.district || "",
        patta_area: property.land_area || "",
        document_id: property.id
      });
    }
  }, [property]);

  if (!property) {
    return (
      <Card className="glass-card h-full flex items-center justify-center">
        <p className="text-sm text-muted-foreground py-12">Upload a document to see extracted data</p>
      </Card>
    );
  }

  const handleInputChange = (field: keyof LocateLandParams, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleLocateClick = async () => {
    if (onLocateLand) {
      await onLocateLand(formData);
    }
  };

  const fields = [
    { key: "owner", icon: User, label: t.owner, value: property.owner },
    { key: "patta_number", icon: Hash, label: t.pattaNumber, value: property.patta_number || "N/A" },
    { key: "panchayat", icon: Landmark, label: t.panchayat, value: property.panchayat || "N/A" },
    { key: "village", icon: MapPin, label: t.village, value: property.village || "N/A" },
    { key: "taluk", icon: MapPin, label: t.taluk, value: property.taluk || "N/A" },
    { key: "district", icon: MapPin, label: t.district, value: property.district || "N/A" },
    { key: "total_area", icon: Ruler, label: t.totalArea, value: property.land_area || "N/A" },
    {
      key: "survey_number",
      icon: Compass,
      label: t.surveyDisplay,
      value: property.survey_display || (property.survey_number ? `${property.survey_number}${property.subdivision ? `/${property.subdivision}` : ''}` : "N/A")
    },
  ];

  const hasTable = property.survey_details && property.survey_details.length > 0;
  const validation = property.validation;
  const areaVal = property.area_validation;

  return (
    <Card className="glass-card animate-fade-up">
      <CardHeader className="pb-3 border-b border-border/40">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Table className="h-5 w-5 text-primary" />
            {t.extractedTitle}
          </CardTitle>

          <div className="flex items-center gap-2">
            {validation && (
              <Badge
                variant={validation.status === "VALID" ? "default" : "secondary"}
                className={`text-xs ${
                  validation.status === "VALID"
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                    : validation.status === "PARTIAL"
                    ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                    : "bg-destructive/20 text-destructive border-destructive/30"
                }`}
              >
                {validation.status}
              </Badge>
            )}

            {onOpenRawOcr && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-7 gap-1 border-primary/30"
                onClick={onOpenRawOcr}
              >
                <FileCode className="h-3.5 w-3.5 text-primary" />
                <span className="hidden sm:inline">{t.viewRawOcr}</span>
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7 gap-1"
              onClick={() => setIsEditing(!isEditing)}
            >
              <Edit3 className="h-3 w-3" />
              {isEditing ? t.viewSummary : t.editIdentifiers}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {/* EDITING FORM FOR MANUAL CORRECTION */}
        {isEditing ? (
          <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-3 animate-fade-in">
            <div className="flex items-center justify-between pb-1 border-b border-border/40">
              <span className="text-xs font-semibold text-primary flex items-center gap-1.5">
                <Edit3 className="h-3.5 w-3.5" />
                Review & Correct Land Identifiers Before Search
              </span>
              <span className="text-[11px] text-muted-foreground">OCR Verification</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">{t.surveyNumber} *</Label>
                <Input
                  className="h-8 text-xs font-medium"
                  value={formData.survey_number}
                  onChange={(e) => handleInputChange("survey_number", e.target.value)}
                  placeholder="e.g. 47"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">{t.subdivision}</Label>
                <Input
                  className="h-8 text-xs font-medium"
                  value={formData.subdivision || ""}
                  onChange={(e) => handleInputChange("subdivision", e.target.value)}
                  placeholder="e.g. 2A"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">{t.village} *</Label>
                <Input
                  className="h-8 text-xs"
                  value={formData.village || ""}
                  onChange={(e) => handleInputChange("village", e.target.value)}
                  placeholder="e.g. Cuddalore Town"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">{t.panchayat}</Label>
                <Input
                  className="h-8 text-xs"
                  value={formData.panchayat || ""}
                  onChange={(e) => handleInputChange("panchayat", e.target.value)}
                  placeholder="e.g. Town Panchayat"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">{t.taluk}</Label>
                <Input
                  className="h-8 text-xs"
                  value={formData.taluk || ""}
                  onChange={(e) => handleInputChange("taluk", e.target.value)}
                  placeholder="e.g. Cuddalore"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">{t.district}</Label>
                <Input
                  className="h-8 text-xs"
                  value={formData.district || ""}
                  onChange={(e) => handleInputChange("district", e.target.value)}
                  placeholder="e.g. Cuddalore"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <Button size="sm" className="h-7 text-xs gap-1.5" onClick={() => setIsEditing(false)}>
                <Check className="h-3 w-3" />
                {t.saveChanges}
              </Button>
            </div>
          </div>
        ) : null}

        {/* 1. EXTRACTED METADATA FIELDS WITH INTERACTIVE EVIDENCE HIGHLIGHT */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {fields.map(({ key, icon: Icon, label, value }) => {
            const hasEvidence = property.evidence && property.evidence[key];
            return (
              <div
                key={key}
                onClick={() => onHighlightField?.(key)}
                className={`p-2.5 rounded-xl border border-border/40 bg-muted/20 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer relative group ${
                  hasEvidence ? "ring-1 ring-primary/20" : ""
                }`}
                title="Click to highlight on original Patta document"
              >
                <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
                  <span className="flex items-center gap-1.5 font-medium truncate">
                    <Icon className="h-3.5 w-3.5 text-primary shrink-0" />
                    {label}
                  </span>
                  {hasEvidence && (
                    <Eye className="h-3 w-3 text-primary/60 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  )}
                </div>
                <div className="text-xs font-semibold text-foreground truncate">
                  {value || <span className="text-muted-foreground/40 italic font-normal">Not detected</span>}
                </div>
              </div>
            );
          })}
        </div>

        {/* 2. AREA CONSISTENCY VALIDATION CARD (Requirement 17) */}
        {areaVal && (
          <div
            className={`p-3 rounded-xl border text-xs space-y-1.5 ${
              areaVal.is_consistent
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                : "bg-amber-500/10 border-amber-500/30 text-amber-300"
            }`}
          >
            <div className="flex items-center justify-between font-semibold">
              <span className="flex items-center gap-1.5">
                {areaVal.is_consistent ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                )}
                {t.areaConsistencyTitle}
              </span>
              <Badge
                variant="outline"
                className={`text-[10px] h-4 ${
                  areaVal.is_consistent
                    ? "border-emerald-500/40 text-emerald-400"
                    : "border-amber-500/40 text-amber-400"
                }`}
              >
                {areaVal.status}
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">{areaVal.message}</p>
            {areaVal.calculated_sum_sqm !== undefined && areaVal.document_total_sqm !== undefined && (
              <div className="flex gap-4 text-[11px] text-foreground font-mono pt-1">
                <span>
                  {t.calculatedSum}: <strong>{areaVal.calculated_sum_sqm} m²</strong>
                </span>
                <span>
                  {t.documentTotal}: <strong>{areaVal.document_total_sqm} m²</strong>
                </span>
              </div>
            )}
          </div>
        )}

        {/* 3. STRUCTURED SURVEY & SUBDIVISION TABLE */}
        {hasTable && (
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Table className="h-3.5 w-3.5 text-primary" />
                {t.surveyTableTitle} ({property.survey_details?.length} Rows)
              </span>
              <span className="text-[10px] text-muted-foreground">Click row to highlight on Patta</span>
            </div>

            <div className="rounded-xl border border-border/40 overflow-hidden bg-muted/20">
              <table className="w-full text-xs">
                <thead className="bg-muted/60 text-muted-foreground border-b border-border/30">
                  <tr>
                    <th className="py-2 px-3 text-left font-medium">{t.surveyNumber}</th>
                    <th className="py-2 px-3 text-left font-medium">{t.subdivision}</th>
                    <th className="py-2 px-3 text-left font-medium">{t.landArea}</th>
                    <th className="py-2 px-3 text-right font-medium">Cadastral ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {property.survey_details?.map((item, idx) => (
                    <tr
                      key={idx}
                      onClick={() => onHighlightField?.(item.display || `${item.survey_no}/${item.subdivision}`)}
                      className="hover:bg-primary/10 transition-colors cursor-pointer"
                    >
                      <td className="py-2 px-3 font-semibold text-primary">{item.survey_no}</td>
                      <td className="py-2 px-3 text-foreground font-medium">{item.subdivision || "-"}</td>
                      <td className="py-2 px-3 text-muted-foreground font-mono">{item.area}</td>
                      <td className="py-2 px-3 text-right">
                        <Badge variant="outline" className="font-mono text-[10px] py-0 h-4">
                          {item.display}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. LOCATE LAND PARCEL ACTION BUTTON */}
        <div className="pt-2 flex items-center justify-between">
          <div className="text-[11px] text-muted-foreground">
            Location Status: <strong className="text-foreground">{property.location_status || "Pending"}</strong>
          </div>

          <Button
            size="sm"
            onClick={handleLocateClick}
            disabled={isLocating || !formData.survey_number}
            className="gap-1.5 text-xs shadow-md"
          >
            {isLocating ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {t.locatingLand}
              </>
            ) : (
              <>
                <Compass className="h-3.5 w-3.5" />
                {t.locateLandBtn}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExtractedData;
