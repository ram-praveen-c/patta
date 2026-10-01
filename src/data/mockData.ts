export interface SurveyDetail {
  survey_no: string;
  subdivision: string;
  area: string;
  display?: string;
}

export interface CadastralConfidence {
  ocr: number;
  survey_match: number;
  location_match: number;
  parcel_match: number;
  overall: number;
}

export interface PropertyRecord {
  id: string;
  owner: string;
  survey_number: string;
  subdivision?: string;
  survey_display?: string;
  survey_confidence?: number;
  patta_number?: string;
  village: string;
  panchayat?: string;
  taluk?: string;
  district?: string;
  land_area: string;
  classification?: string;
  survey_details?: SurveyDetail[];
  coordinates?: [number, number] | null;
  boundary?: [number, number][];
  document_type: string;
  extracted_at: string;
  confidence: number;
  rawText?: string;

  // Cadastral GIS & Location fields
  location_status?: string; // "parcel_found" | "village_found" | "panchayat_found" | "map_available_but_parcel_not_found" | "insufficient_information" | "map_not_available" | "multiple_matches"
  match_type?: string;
  level?: string;
  level_description?: string;
  patta_area?: number;
  gis_area?: number;
  area_difference?: number;
  area_difference_percentage?: number;
  area_validation_status?: string;
  area_validation_message?: string;
  multi_confidence?: CadastralConfidence;
  source?: string;

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
    message?: string;
  };

  // Multilingual, Evidence & Verification fields
  language?: string;
  evidence?: Record<string, { x: number; y: number; width: number; height: number; confidence: number }>;
  tokens?: Array<{ text: string; confidence: number; x: number; y: number; width: number; height: number; line_no: number }>;
  layout_regions?: Array<{ name: string; label: string; box: { x: number; y: number; width: number; height: number } }>;
  table_structures?: Array<any>;
  original_image_base64?: string;
  processed_image_base64?: string;
  validation?: {
    status: "VALID" | "PARTIAL" | "INVALID";
    score: number;
    checks: Record<string, boolean>;
    summary: string;
  };
  area_validation?: {
    is_consistent: boolean;
    calculated_sum_sqm?: number;
    document_total_sqm?: number;
    difference_sqm?: number;
    difference_percentage?: number;
    status: string;
    message: string;
  };
  land_intelligence?: {
    survey_display: string;
    administrative_location: string;
    location_status: string;
    location_level: string;
    location_note: string;
    area_validation: any;
    document_validation: any;
    quality_status: string;
    ocr_confidence: number;
    verified_fields_count: number;
  };
}

export const sampleProperties: PropertyRecord[] = [
  {
    id: "PROP-001",
    owner: "Rajesh Kumar Sharma",
    survey_number: "125",
    subdivision: "3A",
    survey_display: "125/3A",
    survey_confidence: 0.98,
    patta_number: "PAT/875/2026",
    village: "Cuddalore Town",
    panchayat: "Cuddalore Town Panchayat",
    taluk: "Cuddalore",
    district: "Cuddalore",
    land_area: "1000 m² (0.24 Acres)",
    classification: "Dry Land",
    coordinates: [11.7435, 79.7645],
    boundary: [
      [11.7445, 79.7635],
      [11.7445, 79.7655],
      [11.7425, 79.7655],
      [11.7425, 79.7635],
      [11.7445, 79.7635]
    ],
    document_type: "Patta/Chitta Extract",
    extracted_at: "2026-04-11T10:30:00Z",
    confidence: 96,
    location_status: "parcel_found",
    match_type: "exact",
    level: "LEVEL 1: Exact Parcel Location",
    level_description: "Exact parcel identified from cadastral/GIS data.",
    patta_area: 1000,
    gis_area: 982,
    area_difference: 18,
    area_difference_percentage: 1.8,
    area_validation_status: "Consistent",
    area_validation_message: "Document area (1000.0 m²) matches Cadastral GIS parcel (982.0 m²) within standard 2% survey tolerance.",
    multi_confidence: {
      ocr: 94,
      survey_match: 98,
      location_match: 100,
      parcel_match: 100,
      overall: 97
    },
    source: "Official Cadastral Survey Records",
    confidence_scores: {
      ocr_confidence: 94,
      location_confidence: 100,
      location_confidence_detail: "100% (Exact Cadastral GIS Match)",
      overall_score: 97
    }
  },
  {
    id: "PROP-002",
    owner: "K. Venkataraman",
    survey_number: "125",
    subdivision: "1",
    survey_display: "125/1",
    patta_number: "PAT/420/2025",
    village: "Cuddalore Town",
    panchayat: "Cuddalore Town Panchayat",
    taluk: "Cuddalore",
    district: "Cuddalore",
    land_area: "2500 m²",
    classification: "Dry Land",
    coordinates: [11.7450, 79.7620],
    boundary: [
      [11.7460, 79.7610],
      [11.7460, 79.7630],
      [11.7440, 79.7630],
      [11.7440, 79.7610],
      [11.7460, 79.7610]
    ],
    document_type: "Patta/Chitta Extract",
    extracted_at: "2026-04-10T14:15:00Z",
    confidence: 94,
    location_status: "parcel_found",
    match_type: "exact",
    level: "LEVEL 1: Exact Parcel Location",
    patta_area: 2500,
    gis_area: 2500,
    area_difference: 0,
    area_difference_percentage: 0.0,
    area_validation_status: "Consistent",
    source: "Official Cadastral Survey Records"
  },
  {
    id: "PROP-003",
    owner: "Suresh Kumar Selvam",
    survey_number: "319",
    subdivision: "4",
    survey_display: "319/4",
    village: "Perambalur",
    panchayat: "Perambalur Town Panchayat",
    taluk: "Perambalur",
    district: "Perambalur",
    land_area: "8903 m² (2.2 Acres)",
    classification: "Wet Land (Agricultural)",
    coordinates: [11.2333, 78.8667],
    boundary: [
      [11.235, 78.864],
      [11.235, 78.868],
      [11.231, 78.868],
      [11.231, 78.864],
      [11.235, 78.864]
    ],
    document_type: "Patta/Chitta Extract",
    extracted_at: "2026-04-09T09:00:00Z",
    confidence: 91,
    location_status: "parcel_found",
    match_type: "exact",
    level: "LEVEL 1: Exact Parcel Location",
    patta_area: 8903,
    gis_area: 8903,
    area_difference: 0,
    area_difference_percentage: 0.0,
    area_validation_status: "Consistent",
    source: "Perambalur Cadastral GIS"
  }
];

export const sampleGeoJSON = {
  type: "FeatureCollection" as const,
  features: sampleProperties.map((p) => ({
    type: "Feature" as const,
    properties: {
      id: p.id,
      owner: p.owner,
      survey_number: p.survey_number,
      subdivision: p.subdivision,
      village: p.village,
      panchayat: p.panchayat,
      land_area: p.land_area,
    },
    geometry: {
      type: "Polygon" as const,
      coordinates: [[...(p.boundary || []), (p.boundary || [])[0]].map(([lat, lng]) => [lng, lat])],
    },
  })),
};

export const sampleExtractedText = `வருவாய்த்துறை - தமிழ்நாடு அரசு (LAND RECORDS DEPARTMENT)
படிவம் VI - பட்டா / சிட்டா சான்று (PATTA / CHITTA EXTRACT - Form VI)

பட்டா எண் (Patta Number): PAT/875/2026
மாவட்டம்: Cuddalore, வட்டம்: Cuddalore, கிராமம்: Cuddalore Town
ஊராட்சி: Cuddalore Town Panchayat

பட்டாதாரர் பெயர்: Rajesh Kumar Sharma
தந்தை / கணவர் பெயர்: Ramachandran

சொத்து விவரங்கள் (Property Details):
புல எண்: 125/3A
நில வகைப்பாடு: புன்செய் (Dry Land)
பரப்பளவு: 1000 சதுர மீட்டர் (0.24 Acres)

நிலை: சரிபார்க்கப்பட்டது (Verified Cadastral Record)`;

export interface LandInsight {
  label: string;
  value: string;
  trend: "up" | "down" | "neutral";
  icon: string;
}

export const sampleInsights: LandInsight[] = [
  { label: "Cadastral Status", value: "Verified Parcel", trend: "up", icon: "shield-check" },
  { label: "Survey Subdivision", value: "125/3A (Panchayat Cadastre)", trend: "neutral", icon: "trees" },
  { label: "Cadastral Surface Area", value: "982 m² (Consistent)", trend: "up", icon: "leaf" },
  { label: "Nearest Water Channel", value: "Irrigation Canal (450m)", trend: "neutral", icon: "droplets" },
  { label: "Cadastral Road Access", value: "Panchayat Road (25m frontage)", trend: "up", icon: "road" },
  { label: "Encumbrance Status", value: "Clear Title / Single Pattadar", trend: "neutral", icon: "shield-check" },
];
