import { useState, useCallback } from "react";
import { Upload, FileText, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { processDocument, type ExtractionResult } from "@/lib/ocrExtract";
import type { PropertyRecord } from "@/data/mockData";

interface Props {
  onExtracted: (property: PropertyRecord, rawText: string) => void;
}

const DocumentUpload = ({ onExtracted }: Props) => {
  const [processing, setProcessing] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState<ExtractionResult | null>(null);

  const handleFile = useCallback(async (file: File) => {
    setFileName(file.name);
    setProcessing(true);
    setResult(null);
    setStatusMsg("Starting...");

    try {
      const res = await processDocument(file, setStatusMsg);
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
  }, [onExtracted]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const reset = () => {
    setProcessing(false);
    setResult(null);
    setFileName("");
    setStatusMsg("");
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="h-5 w-5 text-primary" />
          Document Upload & OCR
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!processing && !result ? (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed border-primary/30 rounded-xl p-8 text-center hover:border-primary/60 transition-colors cursor-pointer"
          >
            <Upload className="h-10 w-10 mx-auto mb-3 text-primary/60" />
            <p className="text-sm font-medium mb-1">
              Drop land document here (PDF / Image)
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Supports Sale Deed, 7/12 Extract, Patta, Mutation Entry — Tamil & English
            </p>
            <label>
              <Button variant="default" size="sm" className="cursor-pointer" asChild>
                <span>Browse Files</span>
              </Button>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.tiff,.bmp,.webp"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          </div>
        ) : processing ? (
          <div className="space-y-3 py-4">
            <p className="text-sm font-medium truncate">📄 {fileName}</p>
            <div className="flex items-center gap-3 text-sm">
              <Loader2 className="h-4 w-4 text-primary animate-spin shrink-0" />
              <span className="text-primary font-medium">{statusMsg}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              First run downloads OCR models (~15 MB). Please wait...
            </p>
          </div>
        ) : result ? (
          <div className="space-y-3">
            <p className="text-sm font-medium truncate">📄 {fileName}</p>
            {result.success ? (
              <div className="flex items-center gap-2 text-sm text-success">
                <CheckCircle2 className="h-4 w-4" />
                Extraction complete — {Object.values(result.property ?? {}).filter(v => v && v !== "Not extracted").length} fields found
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  {result.error}
                </div>
                {result.rawText && (
                  <details>
                    <summary className="text-xs text-muted-foreground cursor-pointer">
                      View raw OCR output →
                    </summary>
                    <pre className="mt-2 p-3 rounded-lg bg-muted/50 text-xs whitespace-pre-wrap max-h-48 overflow-y-auto font-mono">
                      {result.rawText}
                    </pre>
                  </details>
                )}
              </div>
            )}
            <Button variant="outline" size="sm" onClick={reset}>
              Upload Another
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default DocumentUpload;
