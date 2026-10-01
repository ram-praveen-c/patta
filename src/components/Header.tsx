import { useState } from "react";
import { Satellite, Globe, Terminal, Server } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/lib/LanguageContext";
import type { Language } from "@/lib/i18n";
import { ServerSettingsModal } from "@/components/ServerSettingsModal";

interface Props {
  onOpenDebug?: () => void;
}

const Header = ({ onOpenDebug }: Props) => {
  const { language, setLanguage, t, debugMode, toggleDebugMode } = useLanguage();
  const [serverModalOpen, setServerModalOpen] = useState(false);

  const languages: { code: Language; label: string }[] = [
    { code: "en", label: "English" },
    { code: "ta", label: "தமிழ்" },
    { code: "hi", label: "हिन्दी" }
  ];

  return (
    <>
      <header className="gradient-hero border-b border-border/20 sticky top-0 z-40 backdrop-blur bg-background/80">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/20 border border-primary/30">
              <Satellite className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
                {t.appTitle}
              </h1>
              <p className="text-[11px] text-muted-foreground hidden sm:block">
                {t.appSubtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Server Settings (For Mobile & Cloud Backend) */}
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5 border-primary/30"
              onClick={() => setServerModalOpen(true)}
              title="Configure Backend Server URL"
            >
              <Server className="h-3.5 w-3.5 text-primary" />
              <span className="hidden sm:inline">Server</span>
            </Button>

            {/* Debug Mode Toggle */}
            <Button
              variant={debugMode ? "default" : "outline"}
              size="sm"
              className="h-8 text-xs gap-1.5 border-primary/30"
              onClick={() => {
                toggleDebugMode();
                if (onOpenDebug && !debugMode) {
                  onOpenDebug();
                }
              }}
            >
              <Terminal className="h-3.5 w-3.5" />
              <span className="hidden md:inline">{t.debugMode}</span>
              {debugMode && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
              )}
            </Button>

          {/* Multilingual Selector: English | தமிழ் | हिन्दी (Requirement 3) */}
          <div className="flex items-center bg-muted/70 rounded-lg p-0.5 border border-border/50">
            <div className="px-2 text-muted-foreground hidden md:flex items-center gap-1 text-xs">
              <Globe className="h-3 w-3" />
            </div>
            {languages.map((l) => (
              <Button
                key={l.code}
                variant={language === l.code ? "default" : "ghost"}
                size="sm"
                className={`h-7 px-2.5 text-xs font-medium rounded-md transition-all ${
                  language === l.code ? "shadow-sm font-semibold" : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setLanguage(l.code)}
              >
                {l.label}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </header>

    <ServerSettingsModal
      open={serverModalOpen}
      onOpenChange={setServerModalOpen}
    />
  </>
);
};

export default Header;
