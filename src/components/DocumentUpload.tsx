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
    <Card className="glass-card shadow-md">
      <CardHeader className="p-3.5 sm:p-5 pb-3 border-b border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <CardTitle className="flex items-center gap-2 text-sm sm:text-base font-semibold">
          <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          {t.uploadTitle}
        </CardTitle>

        {/* OCR Language Selector (Requirement 2) */}
        <div className="flex items-center gap-1.5 text-xs w-full sm:w-auto">
          <Languages className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <select
            value={docLang}
            onChange={(e) => setDocLang(e.target.value)}
            disabled={processing}
            className="w-full sm:w-auto h-7 sm:h-8 text-xs bg-muted/70 border border-border/50 rounded-lg px-2 font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary truncate"
          >
            <option value="tam+eng">{t.docLangTamilEnglish}</option>
            <option value="eng">{t.docLangEnglish}</option>
            <option value="hin+eng">{t.docLangHindiEnglish}</option>
          </select>
        </div>
      </CardHeader>

      <CardContent className="p-3.5 sm:p-5">
        {!processing && !result ? (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed border-primary/30 rounded-xl p-5 sm:p-8 text-center hover:border-primary/60 transition-colors cursor-pointer bg-primary/[0.02]"
          >
            <Upload className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-2 text-primary/70 animate-bounce" />
            <p className="text-sm font-semibold mb-1 text-foreground">
              {t.uploadDrop}
            </p>
            <p className="text-[11px] sm:text-xs text-muted-foreground mb-3.5">
              {t.uploadHelp}
            </p>
            <label>
              <Button variant="default" size="sm" className="cursor-pointer shadow-md text-xs h-8 sm:h-9" asChild>
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
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs sm:text-sm font-semibold truncate flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-primary shrink-0" /> <span className="truncate">{fileName}</span>
              </p>
              <Badge variant="outline" className="text-[10px] sm:text-xs font-mono shrink-0">
                Step {stepNumber}/10 ({progressPercentage}%)
              </Badge>
            </div>

            <Progress value={progressPercentage} className="h-2" />

            <div className="flex items-center gap-2.5 text-xs bg-muted/40 p-2.5 sm:p-3 rounded-xl border border-border/40">
              <Loader2 className="h-4 w-4 text-primary animate-spin shrink-0" />
              <span className="text-primary font-medium truncate">{statusMsg}</span>
            </div>

            <p className="text-[10px] sm:text-[11px] text-muted-foreground">
              Pipeline: Quality Check → Deskewing → Multilingual OCR → Layout Detection → Table Extraction → Cadastral GIS Matching
            </p>
          </div>
        ) : result ? (
          <div className="space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs sm:text-sm font-semibold truncate flex items-center gap-1.5 min-w-0">
                <FileText className="h-4 w-4 text-primary shrink-0" /> <span className="truncate">{fileName}</span>
              </p>
              {result.success && onOpenRawOcr && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1 border-primary/30 shrink-0"
                  onClick={onOpenRawOcr}
                >
                  <FileCode className="h-3 w-3 text-primary" />
                  <span className="hidden sm:inline">{t.viewRawOcr}</span>
                  <span className="sm:hidden">OCR</span>
                </Button>
              )}
            </div>

            {result.success && result.property ? (
              <div className="p-3 sm:p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{t.completed} — Survey No. <strong>{result.property.survey_display || result.property.survey_number || "Identified"}</strong></span>
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
              <div className="p-3 sm:p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-500 dark:text-rose-300 space-y-2">
                <div className="flex items-start gap-2 text-xs font-semibold">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-rose-500" />
                  <span className="leading-snug">{result.error || t.errorQualityLow}</span>
                </div>
                <p className="text-[10px] sm:text-[11px] opacity-80 pl-6">
                  The system adheres to a strict No-Fake-Data policy and will not fabricate missing property details.
                </p>
              </div>
            )}

            <Button variant="outline" size="sm" onClick={reset} className="text-xs h-8">
              Upload Another Document
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default DocumentUpload;
