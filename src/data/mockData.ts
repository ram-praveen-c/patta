export interface SurveyDetail {
  survey_no: string;
  subdivision: string;
  area: string;
}

export interface PropertyRecord {
  id: string;
  owner: string;
  survey_number: string;
  subdivision?: string;
  patta_number?: string;
  village: string;
  taluk?: string;
  district?: string;
  land_area: string;
  classification?: string;
  survey_details?: SurveyDetail[];
  coordinates: [number, number];
  boundary: [number, number][];
  document_type: string;
  extracted_at: string;
  confidence: number;
  confidence_scores?: {
    ocr_confidence: number;
    location_confidence: number;
    location_confidence_detail: string;
    overall_score: number;
  };
  fraud_report?: {
    fraud_score: number;
    risk_level: string;
    warnings: string[];
  };
  nearby_amenities?: {
    metro_stations: string;
    hospitals: string;
    schools: string;
    water_bodies: string;
  };
  quality_report?: {
    blur_variance: number;
    average_brightness: number;
    width: number;
    height: number;
    is_blurry: boolean;
    is_dark: boolean;
    is_overexposed: boolean;
    is_low_resolution: boolean;
    warnings: string[];
  };
}

export const sampleProperties: PropertyRecord[] = [
  {
    id: "PROP-001",
    owner: "Rajesh Kumar Sharma",
    survey_number: "SY/142/A",
    village: "Khandala, Pune",
    land_area: "2.5 Acres",
    coordinates: [18.7667, 73.3833],
    boundary: [
      [18.768, 73.381], [18.768, 73.386],
      [18.765, 73.386], [18.765, 73.381],
    ],
    document_type: "Sale Deed",
    extracted_at: "2026-04-11T10:30:00Z",
    confidence: 94,
  },
  {
    id: "PROP-002",
    owner: "Sunita Devi Patil",
    survey_number: "SY/287/B",
    village: "Lonavala, Pune",
    land_area: "1.8 Acres",
    coordinates: [18.7557, 73.4091],
    boundary: [
      [18.757, 73.407], [18.757, 73.412],
      [18.754, 73.412], [18.754, 73.407],
    ],
    document_type: "7/12 Extract",
    extracted_at: "2026-04-10T14:15:00Z",
    confidence: 89,
  },
  {
    id: "PROP-003",
    owner: "Mohammed Farooq Khan",
    survey_number: "SY/056/C",
    village: "Maval, Pune",
    land_area: "3.2 Acres",
    coordinates: [18.7450, 73.3750],
    boundary: [
      [18.747, 73.373], [18.747, 73.378],
      [18.743, 73.378], [18.743, 73.373],
    ],
    document_type: "Mutation Entry",
    extracted_at: "2026-04-09T09:00:00Z",
    confidence: 91,
  },
];

export const sampleGeoJSON = {
  type: "FeatureCollection" as const,
  features: sampleProperties.map((p) => ({
    type: "Feature" as const,
    properties: {
      id: p.id,
      owner: p.owner,
      survey_number: p.survey_number,
      village: p.village,
      land_area: p.land_area,
    },
    geometry: {
      type: "Polygon" as const,
      coordinates: [[...p.boundary, p.boundary[0]].map(([lat, lng]) => [lng, lat])],
    },
  })),
};

export const sampleExtractedText = `OFFICE OF THE SUB-REGISTRAR
DISTRICT: PUNE, TALUKA: MAVAL

SALE DEED NO: 2024/1876

This deed of sale is executed on 15th March 2024.

SELLER: Ramchandra Jadhav, Age 58, R/o Village Khandala
BUYER: Rajesh Kumar Sharma, Age 42, R/o Pune City

Property Details:
Survey Number: SY/142/A
Village: Khandala, Taluka: Maval, District: Pune
Total Area: 2.5 Acres (1.01 Hectares)
Bounded by:
  North - Survey No. 141
  South - Public Road
  East  - Survey No. 143
  West  - Nullah (Stream)

Consideration Amount: Rs. 45,00,000/- (Forty Five Lakhs Only)
Stamp Duty Paid: Rs. 3,15,000/-

Witnesses:
1. Prakash Deshmukh
2. Anita More

Registered on: 20th March 2024
Registration No: PNE/MAVAL/2024/3456`;

export interface LandInsight {
  label: string;
  value: string;
  trend: "up" | "down" | "neutral";
  icon: string;
}

export const sampleInsights: LandInsight[] = [
  { label: "Market Value Estimate", value: "₹52,00,000", trend: "up", icon: "trending-up" },
  { label: "Land Use Type", value: "Agricultural", trend: "neutral", icon: "trees" },
  { label: "Soil Quality Index", value: "7.8 / 10", trend: "up", icon: "leaf" },
  { label: "Nearest Water Source", value: "320m (Stream)", trend: "neutral", icon: "droplets" },
  { label: "Road Connectivity", value: "Good (500m)", trend: "up", icon: "road" },
  { label: "Encumbrance Status", value: "Clear", trend: "neutral", icon: "shield-check" },
];
