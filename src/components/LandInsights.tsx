import { TrendingUp, TrendingDown, Minus, Trees, Leaf, Droplets, ShieldCheck, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { sampleInsights } from "@/data/mockData";
import { Brain } from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  "trending-up": TrendingUp,
  trees: Trees,
  leaf: Leaf,
  droplets: Droplets,
  road: MapPin,
  "shield-check": ShieldCheck,
};

const LandInsights = ({ visible }: { visible: boolean }) => {
  if (!visible) return null;

  return (
    <Card className="glass-card animate-fade-up">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Brain className="h-5 w-5 text-primary" />
          AI Land Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {sampleInsights.map((insight) => {
            const Icon = iconMap[insight.icon] || Minus;
            const TrendIcon = insight.trend === "up" ? TrendingUp : insight.trend === "down" ? TrendingDown : Minus;
            const trendColor = insight.trend === "up" ? "text-success" : insight.trend === "down" ? "text-destructive" : "text-muted-foreground";

            return (
              <div key={insight.label} className="p-3 rounded-lg bg-muted/50 space-y-2">
                <div className="flex items-center justify-between">
                  <Icon className="h-4 w-4 text-primary" />
                  <TrendIcon className={`h-3 w-3 ${trendColor}`} />
                </div>
                <p className="text-sm font-bold">{insight.value}</p>
                <p className="text-xs text-muted-foreground">{insight.label}</p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default LandInsights;
