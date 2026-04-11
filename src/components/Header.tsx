import { MapPin, Satellite } from "lucide-react";

const Header = () => (
  <header className="gradient-hero border-b border-border/20">
    <div className="container mx-auto px-4 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/20">
          <Satellite className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-primary-foreground">SmartLand AI</h1>
          <p className="text-xs text-muted-foreground">Property Locator & Land Intelligence</p>
        </div>
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <MapPin className="h-4 w-4 text-primary" />
        <span className="text-primary-foreground/80">Pune, Maharashtra</span>
      </div>
    </div>
  </header>
);

export default Header;
