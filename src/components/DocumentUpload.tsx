import { useState, useCallback } from "react";
import { Upload, FileText, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { sampleExtractedText } from "@/data/mockData";
import type { PropertyRecord } from "@/data/mockData";
import { sampleProperties } from "@/data/mockData";

interface Props {
  onExtracted: (property: PropertyRecord, rawText: string) => void;
}

type Stage = "idle" | "uploading" | "ocr" | "nlp" | "done";

const DocumentUpload = ({ onExtracted }: Props) => {
  const [stage, setStage] = useState<Stage>("idle");
  const [fileName, setFileName] = useState("");

  const simulateProcessing = useCallback((name: string) => {
    setFileName(name);
    setStage("uploading");
    setTimeout(() => setStage("ocr"), 800);
    setTimeout(() => setStage("nlp"), 2200);
    setTimeout(() => {
      setStage("done");
      onExtracted(sampleProperties[0], sampleExtractedText);
    }, 3500);
  }, [onExtracted]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) simulateProcessing(file.name);
  }, [simulateProcessing]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) simulateProcessing(file.name);
  }, [simulateProcessing]);

  const stages: { key: Stage; label: string }[] = [
    { key: "uploading", label: "Uploading document..." },
    { key: "ocr", label: "Running OCR (Tesseract)..." },
    { key: "nlp", label: "Extracting entities (SpaCy NLP)..." },
    { key: "done", label: "Extraction complete!" },
  ];

  const stageIndex = stages.findIndex((s) => s.key === stage);

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="h-5 w-5 text-primary" />
          Document Upload & OCR
        </CardTitle>
      </CardHeader>
      <CardContent>
        {stage === "idle" ? (
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
              Supports Sale Deed, 7/12 Extract, Mutation Entry
            </p>
            <label>
              <Button variant="default" size="sm" className="cursor-pointer" asChild>
                <span>Browse Files</span>
              </Button>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.tiff"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-medium truncate">📄 {fileName}</p>
            {stages.map((s, i) => {
              const isActive = s.key === stage;
              const isDone = i < stageIndex || stage === "done";
              return (
                <div key={s.key} className="flex items-center gap-3 text-sm">
                  {isDone ? (
                    <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                  ) : isActive ? (
                    <Loader2 className="h-4 w-4 text-primary animate-spin shrink-0" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border border-border shrink-0" />
                  )}
                  <span className={isDone ? "text-foreground" : isActive ? "text-primary font-medium" : "text-muted-foreground"}>
                    {s.label}
                  </span>
                </div>
              );
            })}
            {stage === "done" && (
              <Button variant="outline" size="sm" className="mt-2" onClick={() => setStage("idle")}>
                Upload Another
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DocumentUpload;
