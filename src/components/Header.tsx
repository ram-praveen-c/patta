import { useState, useEffect } from "react";
import { Satellite, Globe, Terminal, Server, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/LanguageContext";
import type { Language } from "@/lib/i18n";
import { ServerSettingsModal } from "@/components/ServerSettingsModal";

interface Props {
  onOpenDebug?: () => void;
}

const Header = ({ onOpenDebug }: Props) => {
  const { language, setLanguage, t, debugMode, toggleDebugMode } = useLanguage();
  const [serverModalOpen, setServerModalOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("landlens_theme");
    if (saved === "light") {
      document.documentElement.classList.remove("dark");
      setIsDark(false);
    } else {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    }
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    if (root.classList.contains("dark")) {
      root.classList.remove("dark");
      setIsDark(false);
      localStorage.setItem("landlens_theme", "light");
    } else {
      root.classList.add("dark");
      setIsDark(true);
      localStorage.setItem("landlens_theme", "dark");
    }
  };

  const languages: { code: Language; label: string; short: string }[] = [
    { code: "en", label: "English", short: "EN" },
    { code: "ta", label: "தமிழ்", short: "தமிழ்" },
    { code: "hi", label: "हिन्दी", short: "हि" }
  ];

  return (
    <>
      <header className="gradient-hero border-b border-border/20 sticky top-0 z-40 backdrop-blur-md bg-background/90 pt-[max(env(safe-area-inset-top,0px),0.5rem)] pb-2.5 px-2.5 sm:px-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-2 min-w-0 shrink">
            <div className="p-1.5 sm:p-2 rounded-xl bg-primary/20 border border-primary/30 shrink-0">
              <Satellite className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-lg font-bold text-foreground tracking-tight truncate leading-tight">
                {t.appTitle}
              </h1>
              <p className="text-[10px] sm:text-[11px] text-muted-foreground hidden sm:block truncate">
                {t.appSubtitle}
              </p>
            </div>
          </div>

          {/* Action Controls & Navigation */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Server Settings Modal Trigger */}
            <Button
              variant="outline"
              size="sm"
              className="h-7 sm:h-8 px-2 sm:px-2.5 text-xs gap-1 border-primary/30 relative"
              onClick={() => setServerModalOpen(true)}
              title="Configure Backend Server URL"
            >
              <Server className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="hidden sm:inline">Server</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 absolute top-1 right-1 sm:static sm:ml-0.5" />
            </Button>

            {/* Dark/Light Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 sm:h-8 w-7 sm:w-8 p-0 text-muted-foreground hover:text-foreground"
              onClick={toggleTheme}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? (
                <Sun className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-400" />
              ) : (
                <Moon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-700" />
              )}
            </Button>

            {/* Debug Mode Toggle */}
            <Button
              variant={debugMode ? "default" : "outline"}
              size="sm"
              className="h-7 sm:h-8 px-2 sm:px-2.5 text-xs gap-1 border-primary/30"
              onClick={() => {
                toggleDebugMode();
                if (onOpenDebug && !debugMode) {
                  onOpenDebug();
                }
              }}
              title="Toggle Debug Console"
            >
              <Terminal className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden md:inline">{t.debugMode}</span>
              {debugMode && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
              )}
            </Button>

            {/* Compact Multilingual Selector */}
            <div className="flex items-center bg-muted/70 rounded-lg p-0.5 border border-border/50">
              {languages.map((l) => (
                <Button
                  key={l.code}
                  variant={language === l.code ? "default" : "ghost"}
                  size="sm"
                  className={`h-6 sm:h-7 px-1.5 sm:px-2.5 text-[11px] sm:text-xs font-medium rounded-md transition-all ${
                    language === l.code
                      ? "shadow-sm font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setLanguage(l.code)}
                >
                  <span className="hidden sm:inline">{l.label}</span>
                  <span className="sm:hidden">{l.short}</span>
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
