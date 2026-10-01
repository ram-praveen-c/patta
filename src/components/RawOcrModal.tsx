import { useState } from "react";
import { FileCode, Copy, Check, Info } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/lib/LanguageContext";
import type { PropertyRecord } from "@/data/mockData";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rawText: string;
  property: PropertyRecord | null;
}

export const RawOcrModal = ({ open, onOpenChange, rawText, property }: Props) => {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(rawText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = rawText.split("\n");
  const tokenCount = property?.tokens?.length || 0;
  const confidence = property?.confidence_scores?.ocr_confidence || property?.confidence || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col glass-card border-primary/30">
        <DialogHeader className="pb-2 border-b border-border/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCode className="h-5 w-5 text-primary" />
              <DialogTitle className="text-lg">{t.viewRawOcr}</DialogTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {lines.length} Lines • {tokenCount} Tokens
              </Badge>
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/30 text-xs">
                {confidence}% Confidence
              </Badge>
            </div>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Direct output from the multilingual OCR engine before parsing. Reviewing raw OCR verifies that extracted data originates genuinely from the uploaded Patta document.
          </DialogDescription>
        </DialogHeader>

        <div className="p-3 bg-primary/5 rounded-xl border border-primary/20 text-xs text-muted-foreground flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Info className="h-4 w-4 text-primary shrink-0" />
            Language: <strong>{property?.language || "tam+eng"}</strong> • Filename: <strong>{property?.document_type || "Patta Document"}</strong>
          </span>
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5" onClick={handleCopy}>
            {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied!" : "Copy Text"}
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto font-mono text-xs p-4 rounded-xl bg-slate-950/80 border border-border/40 leading-relaxed max-h-[460px]">
          {rawText ? (
            <ol className="list-decimal list-inside space-y-1">
              {lines.map((line, idx) => (
                <li key={idx} className="hover:bg-primary/10 px-1 py-0.5 rounded transition-colors text-slate-200">
                  <span className="font-sans text-muted-foreground/60 select-none mr-2">
                    {String(idx + 1).padStart(3, " ")}:
                  </span>
                  {line || <span className="text-muted-foreground/30 italic">{"<empty line>"}</span>}
                </li>
              ))}
            </ol>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No raw OCR text available for this document.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RawOcrModal;
