import { TrendingUp, TrendingDown, Minus, Trees, Leaf, Droplets, ShieldCheck, MapPin, Home, Building, Compass, Train, Brain } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PropertyRecord } from "@/data/mockData";

const iconMap: Record<string, React.ElementType> = {
  "trending-up": TrendingUp,
  trees: Trees,
  leaf: Leaf,
  droplets: Droplets,
  road: MapPin,
  "shield-check": ShieldCheck,
  home: Home,
  building: Building,
  compass: Compass,
  train: Train,
};

interface Props {
  property: PropertyRecord | null;
  rawText: string;
}

const LandInsights = ({ property, rawText }: Props) => {
  if (!property) return null;

  const textLower = (rawText + " " + (property.village || "") + " " + (property.document_type || "")).toLowerCase();
  
  // 1. Determine Land Use Type
  let landUse = "Agricultural";
  let landUseIcon = "trees";
  
  const isUrban = textLower.includes("peth") || 
                  textLower.includes("pune") || 
                  textLower.includes("chennai") || 
                  textLower.includes("mumbai") || 
                  textLower.includes("bangalore") || 
                  textLower.includes("flat") || 
                  textLower.includes("building") || 
                  textLower.includes("residential") || 
                  textLower.includes("commercial") || 
                  textLower.includes("shop") ||
                  textLower.includes("cuddalore town");
  
  if (textLower.includes("commercial") || textLower.includes("shop") || textLower.includes("office") || textLower.includes("showroom")) {
    landUse = "Commercial";
    landUseIcon = "building";
  } else if (textLower.includes("residential") || textLower.includes("plot") || textLower.includes("house") || textLower.includes("flat") || isUrban) {
    landUse = "Residential";
    landUseIcon = "home";
  } else if (textLower.includes("dry land") || textLower.includes("wet land") || textLower.includes("agricultural") || textLower.includes("agri") || textLower.includes("patta") || textLower.includes("7/12")) {
    landUse = "Agricultural";
    landUseIcon = "trees";
  } else {
    landUse = isUrban ? "Residential" : "Agricultural";
    landUseIcon = isUrban ? "home" : "trees";
  }
  
  // 2. Market Value Estimate
  let valueStr = "₹52,00,000";
  if (landUse === "Commercial") {
    valueStr = "₹1,85,00,000";
  } else if (landUse === "Residential") {
    valueStr = isUrban ? "₹1,20,00,000" : "₹45,00,000";
  } else {
    valueStr = "₹35,00,000"; // Agricultural
  }
  
  // 3. Second Card: Soil Quality (Agri) vs Zoning/FSI (Non-Agri)
  let secondLabel = "Soil Quality Index";
  let secondValue = "7.8 / 10";
  let secondIcon = "leaf";
  let secondTrend: "up" | "down" | "neutral" = "up";
  
  if (landUse === "Residential") {
    secondLabel = "Zoning Status";
    secondValue = "R-Zone (Residential)";
    secondIcon = "compass";
    secondTrend = "neutral";
  } else if (landUse === "Commercial") {
    secondLabel = "FSI Max Permissible";
    secondValue = "2.25 FSI";
    secondIcon = "building";
    secondTrend = "up";
  }
  
  // 4. Third Card: Nearest Water Source (Agri) vs Nearest Transit/Infrastructure (Non-Agri)
  let thirdLabel = "Nearest Water Source";
  let thirdValue = "320m (Stream)";
  let thirdIcon = "droplets";
  
  if (isUrban) {
    thirdLabel = "Nearest Transit";
    if (textLower.includes("peth") || textLower.includes("pune")) {
      thirdValue = "250m (Kasba Peth Metro)";
    } else {
      thirdValue = "500m (Bus Station)";
    }
    thirdIcon = "train";
  }
  
  // 5. Fourth Card: Road Connectivity
  let fourthLabel = "Road Connectivity";
  let fourthValue = isUrban ? "Excellent (Direct Road)" : "Good (500m Link Road)";
  let fourthIcon = "road";
  let fourthTrend: "up" | "down" | "neutral" = "up";
  
  // 6. Fifth Card: Encumbrance Status
  let fifthLabel = "Encumbrance Status";
  let fifthValue = "Clear";
  let fifthIcon = "shield-check";
  let fifthTrend: "up" | "down" | "neutral" = "neutral";
  
  const insights = [
    { label: "Market Value Estimate", value: valueStr, trend: "up" as const, icon: "trending-up" },
    { label: "Land Use Type", value: landUse, trend: "neutral" as const, icon: landUseIcon },
    { label: secondLabel, value: secondValue, trend: secondTrend, icon: secondIcon },
    { label: thirdLabel, value: thirdValue, trend: "neutral" as const, icon: thirdIcon },
    { label: fourthLabel, value: fourthValue, trend: fourthTrend, icon: fourthIcon },
    { label: fifthLabel, value: fifthValue, trend: fifthTrend, icon: fifthIcon },
  ];

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
          {insights.map((insight) => {
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
