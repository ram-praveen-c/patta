import type { PropertyRecord } from "@/data/mockData";

/** Location dictionary for mapping extracted keywords to coordinates */
const LOCATION_MAP: Record<string, { center: [number, number]; name: string }> = {
  cuddalore: { center: [11.7401, 79.7590], name: "Cuddalore, Tamil Nadu" },
  chennai: { center: [13.0827, 80.2707], name: "Chennai, Tamil Nadu" },
  madurai: { center: [9.9252, 78.1198], name: "Madurai, Tamil Nadu" },
  coimbatore: { center: [11.0168, 76.9558], name: "Coimbatore, Tamil Nadu" },
  salem: { center: [11.6643, 78.1460], name: "Salem, Tamil Nadu" },
  trichy: { center: [10.7905, 78.7047], name: "Trichy, Tamil Nadu" },
  tirunelveli: { center: [8.7139, 77.7567], name: "Tirunelveli, Tamil Nadu" },
  kancheepuram: { center: [12.8342, 79.7036], name: "Kancheepuram, Tamil Nadu" },
  thanjavur: { center: [10.7870, 79.1378], name: "Thanjavur, Tamil Nadu" },
  vellore: { center: [12.9165, 79.1325], name: "Vellore, Tamil Nadu" },
  pune: { center: [18.5204, 73.8567], name: "Pune, Maharashtra" },
  mumbai: { center: [19.0760, 72.8777], name: "Mumbai, Maharashtra" },
  bangalore: { center: [12.9716, 77.5946], name: "Bangalore, Karnataka" },
  hyderabad: { center: [17.3850, 78.4867], name: "Hyderabad, Telangana" },
  perambalur: { center: [11.2333, 78.8667], name: "Perambalur, Tamil Nadu" },
  // Tamil keywords
  கடலூர்: { center: [11.7401, 79.7590], name: "Cuddalore, Tamil Nadu" },
  சென்னை: { center: [13.0827, 80.2707], name: "Chennai, Tamil Nadu" },
  மதுரை: { center: [9.9252, 78.1198], name: "Madurai, Tamil Nadu" },
  கோயம்புத்தூர்: { center: [11.0168, 76.9558], name: "Coimbatore, Tamil Nadu" },
  சேலம்: { center: [11.6643, 78.1460], name: "Salem, Tamil Nadu" },
  தஞ்சாவூர்: { center: [10.7870, 79.1378], name: "Thanjavur, Tamil Nadu" },
  பெரம்பலூர்: { center: [11.2333, 78.8667], name: "Perambalur, Tamil Nadu" },
};

export interface ExtractionResult {
  success: boolean;
  rawText: string;
  property: PropertyRecord | null;
  error?: string;
  id?: string;
  geometry?: any;
}

/** Resolve a location string to coordinates using the dictionary */
export function resolveLocation(text: string): {
  coordinates: [number, number];
  locationName: string;
} | null {
  if (!text) return null;
  const lower = text.toLowerCase();
  for (const [key, val] of Object.entries(LOCATION_MAP)) {
    if (lower.includes(key.toLowerCase())) {
      return { coordinates: val.center, locationName: val.name };
    }
  }
  return null;
}

/** Helper to generate mock extraction for frontend fallback when backend is offline */
export function getMockExtraction(fileName: string): ExtractionResult {
  const isPatta = fileName.toLowerCase().includes("patta") || fileName.toLowerCase().includes("chitta") || fileName.toLowerCase().includes("image");
  const coords: [number, number] = isPatta ? [11.7401, 79.7590] : [18.7667, 73.3833]; // default Cuddalore (Patta) or Khandala (Sale Deed)
  const villageName = isPatta ? "Cuddalore Town" : "Khandala, Pune";

  const rawText = isPatta ? `LAND RECORDS DEPARTMENT - GOVERNMENT OF TAMIL NADU
PATTA / CHITTA EXTRACT (Form VI)

Patta Number: PAT/875/2026
District: Cuddalore, Taluk: Cuddalore, Village: Cuddalore Town

Pattadar (Owner) Name: Rajesh Kumar Sharma
Father/Husband Name: Ramachandran

Property Details:
Survey No.   Subdivision   Land Classification   Area (Hectares-Ares)
142          1A            Dry Land              0.40.50 (1.00 Acre)
142          1B            Dry Land              0.60.75 (1.50 Acres)

Total Land Area: 2.5 Acres (1.01.25 Hectares)
Status: Active and verified.` : `OFFICE OF THE SUB-REGISTRAR
DISTRICT: PUNE, TALUKA: MAVAL

SALE DEED NO: 2024/1876

This deed of sale is executed on 15th March 2024.

SELLER: Ramchandra Jadhav, Age 58, R/o Village Khandala
BUYER: Rajesh Kumar Sharma, Age 42, R/o Pune City

Property Details:
Survey Number: SY/142/A
Village: Khandala, Pune
Total Area: 2.5 Acres (1.01 Hectares)
Bounded by:
  North - Survey No. 141
  South - Public Road
  East  - Survey No. 143
  West  - Nullah (Stream)

Consideration Amount: Rs. 45,00,000/- (Forty Five Lakhs Only)
Stamp Duty Paid: Rs. 3,15,000/-`;

  const geometry = isPatta ? {
    type: "Polygon",
    coordinates: [[
      [79.757, 11.742], [79.759, 11.742],
      [79.759, 11.739], [79.757, 11.739],
      [79.757, 11.742]
    ]]
  } : {
    type: "Polygon",
    coordinates: [[
      [73.381, 18.768], [73.384, 18.768],
      [73.384, 18.765], [73.381, 18.765],
      [73.381, 18.768]
    ]]
  };

  const property: PropertyRecord = {
    id: `DEMO-${Date.now().toString(36).toUpperCase()}`,
    owner: "Rajesh Kumar Sharma",
    survey_number: isPatta ? "142" : "SY/142/A",
    subdivision: isPatta ? "1A" : "1A",
    patta_number: isPatta ? "PAT/875/2026" : "PNE/MAVAL/2024/3456",
    village: villageName,
    taluk: isPatta ? "Cuddalore" : "Maval",
    district: isPatta ? "Cuddalore" : "Pune",
    land_area: "2.5 Acres",
    classification: isPatta ? "Dry Land" : "Non-Agricultural (Residential)",
    survey_details: [
      {
        survey_no: isPatta ? "142" : "SY/142/A",
        subdivision: "1A",
        area: isPatta ? "1.00 Acre" : "1.5 Acres"
      },
      {
        survey_no: isPatta ? "142" : "SY/142/A",
        subdivision: "1B",
        area: isPatta ? "1.50 Acres" : "1.0 Acres"
      }
    ],
    coordinates: coords,
    boundary: geometry.coordinates[0].map(([lng, lat]) => [lat, lng]),
    document_type: isPatta ? "Patta/Chitta Extract" : "Sale Deed",
    extracted_at: new Date().toISOString(),
    confidence: 90,
    confidence_scores: {
      ocr_confidence: 90,
      location_confidence: 100,
      location_confidence_detail: "100% (Exact GIS Database Match)",
      overall_score: 95
    },
    fraud_report: {
      fraud_score: 0,
      risk_level: "Low",
      warnings: []
    },
    nearby_amenities: {
      metro_stations: isPatta ? "Not Available" : "Kasba Peth Metro (250m)",
      hospitals: isPatta ? "Cuddalore HQ Hospital (2.8km)" : "Seth Tarachand Hospital (400m)",
      schools: isPatta ? "Cuddalore High School (1.4km)" : "Kasba Peth Primary School (300m)",
      water_bodies: isPatta ? "Gedilam River (450m)" : "Mutha River (320m)"
    },
    quality_report: {
      blur_variance: 145.2,
      average_brightness: 185.0,
      width: 1200,
      height: 1600,
      is_blurry: false,
      is_dark: false,
      is_overexposed: false,
      is_low_resolution: false,
      warnings: []
    }
  };

  return {
    success: true,
    rawText: rawText + "\n\n[DEMO FALLBACK MODE - ACTIVE (FastAPI backend offline)]",
    property,
    geometry
  };
}

/** Full pipeline: OCR → Extract → Validate → Build property via FastAPI */
export async function processDocument(
  file: File,
  onProgress?: (msg: string) => void
): Promise<ExtractionResult> {
  onProgress?.("Uploading document to extraction server...");

  const formData = new FormData();
  formData.append("file", file);

  try {
    let response;
    try {
      response = await fetch("http://localhost:8000/api/extract", {
        method: "POST",
        body: formData,
      });
    } catch (fetchError) {
      console.warn("Backend not reachable. Falling back to frontend mock extractor:", fetchError);
      onProgress?.("Backend offline. Simulating OCR extraction via Demo Fallback...");
      await new Promise((resolve) => setTimeout(resolve, 1500)); // simulate network delay
      onProgress?.("Extraction complete!");
      return getMockExtraction(file.name);
    }

    if (!response.ok) {
      throw new Error(`Server returned ${response.status} ${response.statusText}`);
    }

    onProgress?.("Analyzing layout and extracting tables...");

    const data = await response.json();

    if (!data.success) {
      return {
        success: false,
        rawText: data.rawText || "",
        property: null,
        error: data.error || "OCR returned no readable text.",
      };
    }

    const { rawText, parsed_data } = data;
    const fields = parsed_data;

    // Validation — check if we have either partial fields or table data
    const hasData = fields.owner || fields.survey_number || fields.village || fields.land_area || fields.patta_number;
    const hasTableData = fields.survey_details && fields.survey_details.length > 0;

    if (!hasData && !hasTableData) {
      return {
        success: false,
        rawText,
        property: null,
        error: "Could not extract any structured data from this document. See raw OCR output.",
      };
    }

    // Step 4: Resolve coordinates & geometry
    const coords: [number, number] = data.coordinates ?? [11.74, 79.76];
    const villageName = fields.village || "Unknown Location";
    
    // Process custom boundaries (from GeoJSON coords [lng, lat] to Leaflet [lat, lng])
    let boundary: [number, number][] = [
      [coords[0] + 0.002, coords[1] - 0.002],
      [coords[0] + 0.002, coords[1] + 0.002],
      [coords[0] - 0.002, coords[1] + 0.002],
      [coords[0] - 0.002, coords[1] - 0.002],
    ];
    if (data.geometry && data.geometry.coordinates && data.geometry.coordinates[0]) {
      boundary = data.geometry.coordinates[0].map((pt: [number, number]) => [pt[1], pt[0]]);
    }

    // Step 5: Build property record
    const property: PropertyRecord = {
      id: data.id || `EXT-${Date.now().toString(36).toUpperCase()}`,
      owner: fields.owner || "Not extracted",
      survey_number: fields.survey_number || "Not extracted",
      subdivision: fields.subdivision || undefined,
      patta_number: fields.patta_number || undefined,
      village: villageName,
      taluk: fields.taluk || undefined,
      district: fields.district || undefined,
      land_area: fields.land_area || (hasTableData ? "Extracted from table" : "Not extracted"),
      classification: fields.classification || "Residential",
      survey_details: fields.survey_details,
      coordinates: coords,
      boundary: boundary,
      document_type: fields.document_type || (hasTableData ? "Table/Structured Document" : "Standard Upload"),
      extracted_at: new Date().toISOString(),
      confidence: data.confidence_scores?.overall_score ?? Math.min(95, (hasTableData ? 60 : 0) + 30),
      confidence_scores: data.confidence_scores,
      fraud_report: data.fraud_report,
      nearby_amenities: data.nearby_amenities,
      quality_report: data.quality_report
    };

    onProgress?.("Extraction complete!");

    return { 
      success: true, 
      rawText, 
      property,
      id: data.id,
      geometry: data.geometry
    } as any;
    
  } catch (error: any) {
    return {
      success: false,
      rawText: "",
      property: null,
      error: `Processing failed: ${error.message}. Is the Python backend running?`,
    };
  }
}
