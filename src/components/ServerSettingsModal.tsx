import { useState, useEffect } from "react";
import { Server, Wifi, CheckCircle2, AlertTriangle, RefreshCw, Globe, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { getApiBaseUrl, setApiBaseUrl } from "@/lib/apiConfig";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ServerSettingsModal = ({ open, onOpenChange }: Props) => {
  const [url, setUrl] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    status: "idle" | "success" | "error";
    message: string;
  }>({ status: "idle", message: "" });

  useEffect(() => {
    if (open) {
      setUrl(getApiBaseUrl());
      setTestResult({ status: "idle", message: "" });
    }
  }, [open]);

  const testConnection = async (targetUrl: string) => {
    setTesting(true);
    setTestResult({ status: "idle", message: "" });
    const cleanUrl = targetUrl.trim().replace(/\/+$/, "");

    try {
      const endpoint = cleanUrl === "" ? "/health" : `${cleanUrl}/health`;
      const res = await fetch(endpoint, { method: "GET" });
      if (res.ok) {
        const data = await res.json();
        if (data.status === "ok") {
          setTestResult({
            status: "success",
            message: "Connected successfully! Backend is healthy and ready.",
          });
          return;
        }
      }
      setTestResult({
        status: "error",
        message: `Server returned status code: ${res.status}`,
      });
    } catch (err: any) {
      setTestResult({
        status: "error",
        message: `Connection failed: ${err.message || "Could not reach server"}`,
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    setApiBaseUrl(url);
    onOpenChange(false);
    // Reload page to reinitialize all API endpoints with new URL
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  const handleReset = () => {
    setApiBaseUrl("");
    setUrl(getApiBaseUrl());
    setTestResult({ status: "idle", message: "" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md glass-card">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/20 text-primary">
              <Server className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">
                Backend Server Connection
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Configure the cloud backend API URL for this mobile app.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Backend API Endpoint</Label>
            <div className="flex gap-2">
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://your-backend-api.onrender.com"
                className="text-xs font-mono"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => testConnection(url)}
                disabled={testing}
                className="text-xs gap-1 shrink-0"
              >
                {testing ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Wifi className="h-3.5 w-3.5" />
                )}
                Test
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Example: Deployed Render URL (<code>https://patta-api.onrender.com</code>) or local Wi-Fi IP (<code>http://192.168.31.109:8000</code>).
            </p>
          </div>

          {/* Test Status Feedback */}
          {testResult.status === "success" && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{testResult.message}</span>
            </div>
          )}

          {testResult.status === "error" && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{testResult.message}</span>
            </div>
          )}

          <div className="p-3 rounded-lg bg-muted/40 border border-border/30 text-[11px] text-muted-foreground space-y-1">
            <div className="font-semibold text-foreground flex items-center gap-1">
              <Globe className="h-3.5 w-3.5 text-primary" />
              Mobile App Hint:
            </div>
            <p>
              On a smartphone, <code>localhost</code> points to the phone itself. Always use your deployed cloud backend URL or your PC's Wi-Fi IP address when testing over the same network.
            </p>
          </div>
        </div>

        <DialogFooter className="flex sm:justify-between gap-2 pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-xs text-muted-foreground"
          >
            Reset to Default
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleSave}
              className="text-xs gap-1.5 shadow-md"
            >
              <Check className="h-3.5 w-3.5" />
              Save & Apply
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
