import { useState, useCallback } from "react";
import { Upload, FileText, Loader2, CheckCircle2, AlertTriangle, Languages, FileCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { processDocument, type ExtractionResult } from "@/lib/ocrExtract";
import { useLanguage } from "@/lib/LanguageContext";
import type { PropertyRecord } from "@/data/mockData";

interface Props {
  onExtracted: (property: PropertyRecord, rawText: string) => void;
  onOpenRawOcr?: () => void;
}

const DocumentUpload = ({ onExtracted, onOpenRawOcr }: Props) => {
  const { t } = useLanguage();
  const [processing, setProcessing] = useState(false);
  const [stepNumber, setStepNumber] = useState(1);
  const [statusMsg, setStatusMsg] = useState("");
  const [fileName, setFileName] = useState("");
  const [docLang, setDocLang] = useState("tam+eng");
  const [result, setResult] = useState<ExtractionResult | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setFileName(file.name);
      setProcessing(true);
      setResult(null);
      setStepNumber(1);
      setStatusMsg(t.uploading);

      try {
        const res = await processDocument(
          file,
          docLang,
          (step, msg) => {
            setStepNumber(step);
            setStatusMsg(msg);
          }
        );
        setResult(res);
        if (res.success && res.property) {
          onExtracted(res.property, res.rawText);
        }
      } catch (err: any) {
        setResult({
          success: false,
          rawText: "",
          property: null,
          error: `Processing failed: ${err.message}`,
        });
      } finally {
        setProcessing(false);
      }
    },
    [docLang, onExtracted, t]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const reset = () => {
    setProcessing(false);
    setResult(null);
    setFileName("");
    setStatusMsg("");
    setStepNumber(1);
  };

  const progressPercentage = Math.min(100, Math.round((stepNumber / 10) * 100));

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3 border-b border-border/40 flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-5 w-5 text-primary" />
          {t.uploadTitle}
        </CardTitle>

        {/* OCR Language Selector (Requirement 2) */}
        <div className="flex items-center gap-1.5 text-xs">
          <Languages className="h-3.5 w-3.5 text-muted-foreground" />
          <select
            value={docLang}
            onChange={(e) => setDocLang(e.target.value)}
            disabled={processing}
            className="h-7 text-xs bg-muted/70 border border-border/50 rounded-md px-2 font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="tam+eng">{t.docLangTamilEnglish}</option>
            <option value="eng">{t.docLangEnglish}</option>
            <option value="hin+eng">{t.docLangHindiEnglish}</option>
          </select>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {!processing && !result ? (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed border-primary/30 rounded-xl p-8 text-center hover:border-primary/60 transition-colors cursor-pointer bg-primary/[0.02]"
          >
            <Upload className="h-10 w-10 mx-auto mb-3 text-primary/70 animate-bounce" />
            <p className="text-sm font-semibold mb-1 text-foreground">
              {t.uploadDrop}
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              {t.uploadHelp}
            </p>
            <label>
              <Button variant="default" size="sm" className="cursor-pointer shadow-md" asChild>
                <span>{t.uploadBrowse}</span>
              </Button>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp,.tiff"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          </div>
        ) : processing ? (
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold truncate flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" /> {fileName}
              </p>
              <Badge variant="outline" className="text-xs font-mono">
                Step {stepNumber} / 10 ({progressPercentage}%)
              </Badge>
            </div>

            <Progress value={progressPercentage} className="h-2" />

            <div className="flex items-center gap-3 text-xs bg-muted/40 p-3 rounded-xl border border-border/40">
              <Loader2 className="h-4 w-4 text-primary animate-spin shrink-0" />
              <span className="text-primary font-medium">{statusMsg}</span>
            </div>

            <p className="text-[11px] text-muted-foreground">
              Pipeline: Quality Check → Deskewing → Multilingual OCR → Layout Detection → Table Extraction → Cadastral GIS Matching
            </p>
          </div>
        ) : result ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold truncate flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" /> {fileName}
              </p>
              {result.success && onOpenRawOcr && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1 border-primary/30"
                  onClick={onOpenRawOcr}
                >
                  <FileCode className="h-3 w-3 text-primary" />
                  {t.viewRawOcr}
                </Button>
              )}
            </div>

            {result.success && result.property ? (
              <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  {t.completed} — Survey No. <strong>{result.property.survey_display || result.property.survey_number || "Identified"}</strong>
                </div>
                <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                  <span>Village: <strong className="text-foreground">{result.property.village || "N/A"}</strong></span>
                  <span>•</span>
                  <span>District: <strong className="text-foreground">{result.property.district || "N/A"}</strong></span>
                  <span>•</span>
                  <span>Area: <strong className="text-foreground">{result.property.land_area || "N/A"}</strong></span>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl border border-destructive/30 bg-destructive/10 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  {result.error || t.errorQualityLow}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  The system adheres to a strict No-Fake-Data policy and will not fabricate missing property details.
                </p>
              </div>
            )}

            <Button variant="outline" size="sm" onClick={reset} className="text-xs">
              Upload Another Document
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default DocumentUpload;
