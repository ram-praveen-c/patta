import { TrendingUp, TrendingDown, Minus, Trees, Leaf, Droplets, ShieldCheck, MapPin, Home, Building, Compass, Brain, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/lib/LanguageContext";
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
};

interface Props {
  property: PropertyRecord | null;
  rawText: string;
}

const LandInsights = ({ property, rawText }: Props) => {
  const { t } = useLanguage();
  if (!property) return null;

  const textLower = (rawText + " " + (property.village || "") + " " + (property.classification || "") + " " + (property.document_type || "")).toLowerCase();
  const classification = (property.classification || "").toLowerCase();

  // 1. Determine Land Use Type accurately from extracted classification
  let landUse = "Agricultural";
  let landUseIcon = "trees";
  
  if (
    classification.includes("commercial") ||
    textLower.includes("வணிக") ||
    textLower.includes("commercial")
  ) {
    landUse = "Commercial / வணிகம்";
    landUseIcon = "building";
  } else if (
    classification.includes("residential") ||
    classification.includes("natham") ||
    classification.includes("மனை") ||
    textLower.includes("residential") ||
    textLower.includes("வீட்டு மனை")
  ) {
    landUse = "Residential / வீட்டு மனை";
    landUseIcon = "home";
  } else if (
    classification.includes("wet") ||
    classification.includes("நஞ்சை") ||
    textLower.includes("நஞ்சை")
  ) {
    landUse = "Wet Agricultural / நஞ்சை";
    landUseIcon = "droplets";
  } else if (
    classification.includes("dry") ||
    classification.includes("புஞ்சை") ||
    textLower.includes("புஞ்சை")
  ) {
    landUse = "Dry Agricultural / புஞ்சை";
    landUseIcon = "trees";
  } else if (property.classification) {
    landUse = property.classification;
    landUseIcon = "compass";
  }

  // 2. Soil & Agro Characteristics
  let soilType = "Clay Loam / Alluvial";
  if (landUse.includes("நஞ்சை") || landUse.includes("Wet")) {
    soilType = "Alluvial Wet Soil (High fertility)";
  } else if (landUse.includes("புஞ்சை") || landUse.includes("Dry")) {
    soilType = "Red Soil / Mixed Loam";
  } else if (landUse.includes("Residential") || landUse.includes("Commercial")) {
    soilType = "Settled Non-Agricultural Subgrade";
  }

  // 3. Irrigation / Access
  let waterSource = "Rainfed / Borewell";
  if (landUse.includes("நஞ்சை") || landUse.includes("Wet")) {
    waterSource = "Canal / River Basin / Well";
  } else if (landUse.includes("Residential") || landUse.includes("Commercial")) {
    waterSource = "Piped Municipal / Panchayat Supply";
  }

  // 4. Road Access
  let roadAccess = "Village Panchayat Road Access";
  if (landUse.includes("Commercial") || landUse.includes("Residential")) {
    roadAccess = "Survey Boundary Approach Road";
  }

  // 5. Encumbrance / Title Status
  const encumbrance = property.validation_status === "VALID" 
    ? "Verified Patta Record" 
    : "Review Survey Boundaries";

  // Check if backend provided specific land_intelligence
  const backendIntel = (property as any).land_intelligence;

  const insights = [
    {
      label: "Land Classification",
      value: backendIntel?.land_use || landUse,
      trend: "neutral" as const,
      icon: landUseIcon
    },
    {
      label: "Soil & Geo-Terrain",
      value: backendIntel?.soil_type || soilType,
      trend: "up" as const,
      icon: "leaf"
    },
    {
      label: "Irrigation / Utility",
      value: backendIntel?.irrigation_status || waterSource,
      trend: "neutral" as const,
      icon: "droplets"
    },
    {
      label: "Road / Boundary Access",
      value: backendIntel?.connectivity || roadAccess,
      trend: "up" as const,
      icon: "road"
    },
    {
      label: "Document Verification",
      value: encumbrance,
      trend: property.validation_status === "VALID" ? ("up" as const) : ("neutral" as const),
      icon: "shield-check"
    },
    {
      label: "Valuation Guidance",
      value: backendIntel?.market_estimate || "Subject to local SRO guideline value",
      trend: "neutral" as const,
      icon: "trending-up"
    },
  ];

  return (
    <Card className="glass-card animate-fade-up">
      <CardHeader className="pb-3 border-b border-border/40">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-bold">
            <Brain className="h-5 w-5 text-primary" />
            AI Land Intelligence & Geo-Characteristics
          </CardTitle>
          <Badge variant="outline" className="text-[11px] text-muted-foreground border-primary/30">
            Document-Derived Insights
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {insights.map((insight) => {
            const Icon = iconMap[insight.icon] || Minus;
            const TrendIcon = insight.trend === "up" ? TrendingUp : insight.trend === "down" ? TrendingDown : Minus;
            const trendColor = insight.trend === "up" ? "text-emerald-500" : insight.trend === "down" ? "text-rose-500" : "text-muted-foreground";

            return (
              <div key={insight.label} className="p-3 rounded-lg bg-muted/40 border border-border/40 space-y-1.5 transition-all hover:bg-muted/60">
                <div className="flex items-center justify-between">
                  <Icon className="h-4 w-4 text-primary" />
                  <TrendIcon className={`h-3 w-3 ${trendColor}`} />
                </div>
                <p className="text-xs font-semibold text-foreground line-clamp-1">{insight.value}</p>
                <p className="text-[11px] text-muted-foreground">{insight.label}</p>
              </div>
            );
          })}
        </div>

        <div className="p-2.5 rounded-lg bg-muted/30 border border-border/30 text-[11px] text-muted-foreground flex items-center gap-2">
          <AlertCircle className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          <span>
            {backendIntel?.disclaimer || "All insights are dynamically derived from document classification. Official Sub-Registrar valuation and on-ground survey are required for legal registration."}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default LandInsights;
