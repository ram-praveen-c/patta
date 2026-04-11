import { Satellite } from "lucide-react";

const Header = () => (
  <header className="gradient-hero border-b border-border/20">
    <div className="container mx-auto px-4 py-4 flex items-center gap-3">
      <div className="p-2 rounded-lg bg-primary/20">
        <Satellite className="h-6 w-6 text-primary" />
      </div>
      <div>
        <h1 className="text-lg font-bold text-primary-foreground">SmartLand AI</h1>
        <p className="text-xs text-muted-foreground">Property Locator & Land Intelligence</p>
      </div>
    </div>
  </header>
);

export default Header;
