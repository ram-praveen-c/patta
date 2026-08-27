import { useState } from "react";
import { ArrowLeftRight, Upload, FileCheck, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { processDocument, type ExtractionResult } from "@/lib/ocrExtract";

const DocumentCompare = () => {
  const [fileA, setFileA] = useState<File | null>(null);
  const [fileB, setFileB] = useState<File | null>(null);
  const [resultA, setResultA] = useState<ExtractionResult | null>(null);
  const [resultB, setResultB] = useState<ExtractionResult | null>(null);
  const [comparing, setComparing] = useState(false);
  const [compared, setCompared] = useState(false);

  const handleRunCompare = async () => {
    if (!fileA || !fileB) return;

    setComparing(true);
    setCompared(false);

    try {
      const resA = await processDocument(fileA);
      const resB = await processDocument(fileB);

      setResultA(resA);
      setResultB(resB);
      setCompared(true);
    } catch (err) {
      console.error("Comparison failed:", err);
    } finally {
      setComparing(false);
    }
  };

  const propA = resultA?.property;
  const propB = resultB?.property;

  const diffFields = [
    { label: "Owner Name", keyA: propA?.owner, keyB: propB?.owner },
    { label: "Survey Number", keyA: propA?.survey_number, keyB: propB?.survey_number },
    { label: "Subdivision", keyA: propA?.subdivision || "1A", keyB: propB?.subdivision || "1B" },
    { label: "Village / Location", keyA: propA?.village, keyB: propB?.village },
    { label: "Land Area", keyA: propA?.land_area, keyB: propB?.land_area },
    { label: "Document Type", keyA: propA?.document_type, keyB: propB?.document_type },
    { label: "Fraud Risk Level", keyA: propA?.fraud_report?.risk_level || "Low", keyB: propB?.fraud_report?.risk_level || "Low" },
  ];

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ArrowLeftRight className="h-5 w-5 text-primary" />
          Multi-Document Comparison & Verification
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload Panels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Doc A */}
          <div className="border border-border/60 rounded-xl p-4 space-y-3 bg-muted/20">
            <h4 className="text-xs font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5">
              <FileCheck className="h-4 w-4" /> Document 1 (Base Record)
            </h4>
            <input
              type="file"
              id="fileA-input"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && setFileA(e.target.files[0])}
            />
            <label
              htmlFor="fileA-input"
              className="border border-dashed border-border hover:border-primary p-4 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors"
            >
              <Upload className="h-6 w-6 text-muted-foreground mb-1" />
              <span className="text-xs font-medium truncate max-w-[200px]">
                {fileA ? fileA.name : "Select Base Patta / Deed"}
              </span>
            </label>
          </div>

          {/* Doc B */}
          <div className="border border-border/60 rounded-xl p-4 space-y-3 bg-muted/20">
            <h4 className="text-xs font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5">
              <FileCheck className="h-4 w-4" /> Document 2 (Recent / Transfer Record)
            </h4>
            <input
              type="file"
              id="fileB-input"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && setFileB(e.target.files[0])}
            />
            <label
              htmlFor="fileB-input"
              className="border border-dashed border-border hover:border-primary p-4 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors"
            >
              <Upload className="h-6 w-6 text-muted-foreground mb-1" />
              <span className="text-xs font-medium truncate max-w-[200px]">
                {fileB ? fileB.name : "Select Transfer / Mutation Deed"}
              </span>
            </label>
          </div>
        </div>

        {/* Action Button */}
        <div className="text-center">
          <Button
            onClick={handleRunCompare}
            disabled={!fileA || !fileB || comparing}
            className="px-6"
          >
            {comparing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Comparing Documents...
              </>
            ) : (
              "Compare Field Differences"
            )}
          </Button>
        </div>

        {/* Comparison Diffs View */}
        {compared && propA && propB && (
          <div className="space-y-4 pt-2 border-t border-border/40">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              Field-by-Field Difference Analysis
            </h3>

            <div className="border border-border/60 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-muted/60 font-semibold border-b border-border/60">
                  <tr>
                    <th className="p-3">Attribute</th>
                    <th className="p-3">Document 1 Value</th>
                    <th className="p-3">Document 2 Value</th>
                    <th className="p-3">Match Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {diffFields.map((field, idx) => {
                    const isSame = field.keyA === field.keyB;
                    return (
                      <tr key={idx} className={isSame ? "" : "bg-warning/5"}>
                        <td className="p-3 font-medium text-foreground">{field.label}</td>
                        <td className="p-3">{field.keyA || "N/A"}</td>
                        <td className="p-3">{field.keyB || "N/A"}</td>
                        <td className="p-3">
                          {isSame ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-success/10 text-success border border-success/20">
                              Identical
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-warning/10 text-warning border border-warning/20 flex items-center gap-1 w-fit">
                              <AlertCircle className="h-3 w-3" /> Changed
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DocumentCompare;
