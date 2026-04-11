import Tesseract from "tesseract.js";
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
  // Tamil keywords
  கடலூர்: { center: [11.7401, 79.7590], name: "Cuddalore, Tamil Nadu" },
  சென்னை: { center: [13.0827, 80.2707], name: "Chennai, Tamil Nadu" },
  மதுரை: { center: [9.9252, 78.1198], name: "Madurai, Tamil Nadu" },
  கோயம்புத்தூர்: { center: [11.0168, 76.9558], name: "Coimbatore, Tamil Nadu" },
  சேலம்: { center: [11.6643, 78.1460], name: "Salem, Tamil Nadu" },
  தஞ்சாவூர்: { center: [10.7870, 79.1378], name: "Thanjavur, Tamil Nadu" },
};

export interface ExtractionResult {
  success: boolean;
  rawText: string;
  property: PropertyRecord | null;
  error?: string;
}

/** Run Tesseract.js OCR on a File (image or PDF page) */
export async function performOCR(
  file: File,
  onProgress?: (msg: string) => void
): Promise<string> {
  onProgress?.("Initializing OCR engine (tam+eng)...");

  const { data } = await Tesseract.recognize(file, "tam+eng", {
    logger: (m) => {
      if (m.status === "recognizing text") {
        const pct = Math.round((m.progress ?? 0) * 100);
        onProgress?.(`OCR in progress... ${pct}%`);
      }
    },
  });

  return data.text;
}

/** Regex-based extraction for land document fields */
export function extractFields(text: string): {
  owner: string | null;
  survey_number: string | null;
  village: string | null;
  land_area: string | null;
} {
  const result = {
    owner: null as string | null,
    survey_number: null as string | null,
    village: null as string | null,
    land_area: null as string | null,
  };

  // Survey Number patterns (English + Tamil)
  const surveyPatterns = [
    /(?:Survey\s*(?:No|Number|#)\.?|S\.?\s*No\.?|Sy\.?\s*No\.?)[:\s]*([\w\d\/\-]+)/i,
    /(?:புல\s*எண்|சர்வே\s*எண்)[:\s]*([\w\d\/\-]+)/,
    /(?:பட்டா\s*எண்)[:\s]*([\w\d\/\-]+)/,
    /(\d{1,5}\/\d{1,5}[A-Z]?)/,
  ];
  for (const pat of surveyPatterns) {
    const m = text.match(pat);
    if (m) { result.survey_number = m[1].trim(); break; }
  }

  // Village / location patterns
  const villagePatterns = [
    /(?:Village|Taluk|District)[:\s]*([A-Za-z\s,]+?)(?:\n|,\s*(?:Taluk|District|State))/i,
    /(?:கிராமம்|வட்டம்|மாவட்டம்)[:\s]*([^\n,]+)/,
  ];
  for (const pat of villagePatterns) {
    const m = text.match(pat);
    if (m) { result.village = m[1].trim(); break; }
  }

  // Land area patterns
  const areaPatterns = [
    /(?:Area|Extent|Total\s*Area)[:\s]*([\d.,]+\s*(?:acres?|cents?|sq\.?\s*ft\.?|hectares?|guntas?|ares?))/i,
    /(?:பரப்பளவு|நிலப்பரப்பு)[:\s]*([\d.,]+\s*(?:ஏக்கர்|சென்ட்|சதுர\s*அடி|ஹெக்டேர்|எக்டேர்))/,
    /([\d.,]+)\s*(?:acres?|cents?|hectares?|ஏக்கர்|சென்ட்|ஹெக்டேர்)/i,
  ];
  for (const pat of areaPatterns) {
    const m = text.match(pat);
    if (m) { result.land_area = m[0].trim(); break; }
  }

  // Owner name patterns
  const ownerPatterns = [
    /(?:Owner\s*(?:Name)?|Buyer|Pattadar|Name\s*of\s*(?:the\s*)?owner)[:\s]*([A-Za-z\s.\-]+)/i,
    /(?:உரிமையாளர்|பட்டாதாரர்\s*பெயர்|பெயர்)[:\s]*([^\n,]+)/,
    /(?:S\/o|D\/o|W\/o|Son of|Daughter of)[:\s]*([A-Za-z\s.\-]+)/i,
  ];
  for (const pat of ownerPatterns) {
    const m = text.match(pat);
    if (m) { result.owner = m[1].trim(); break; }
  }

  return result;
}

/** Resolve a location string to coordinates using the dictionary */
export function resolveLocation(text: string): {
  coordinates: [number, number];
  locationName: string;
} | null {
  const lower = text.toLowerCase();
  for (const [key, val] of Object.entries(LOCATION_MAP)) {
    if (lower.includes(key.toLowerCase())) {
      return { coordinates: val.center, locationName: val.name };
    }
  }
  return null;
}

/** Full pipeline: OCR → Extract → Validate → Build property */
export async function processDocument(
  file: File,
  onProgress?: (msg: string) => void
): Promise<ExtractionResult> {
  // Step 1: OCR
  const rawText = await performOCR(file, onProgress);

  if (!rawText || rawText.trim().length < 10) {
    return {
      success: false,
      rawText: rawText || "",
      property: null,
      error: "OCR returned no readable text. Please upload a clearer document.",
    };
  }

  onProgress?.("Extracting entities with regex rules...");

  // Step 2: Extract fields
  const fields = extractFields(rawText);

  // Step 3: Validate — at least one field must be found
  const foundCount = Object.values(fields).filter(Boolean).length;
  if (foundCount === 0) {
    return {
      success: false,
      rawText,
      property: null,
      error:
        "Could not extract any structured data from this document. The raw OCR text is shown below for reference.",
    };
  }

  // Step 4: Resolve location
  const location = resolveLocation(rawText);
  const coords: [number, number] = location?.coordinates ?? [11.74, 79.76]; // default Cuddalore if Tamil doc
  const villageName = fields.village || location?.locationName || "Unknown";

  // Step 5: Build property record
  const property: PropertyRecord = {
    id: `EXT-${Date.now().toString(36).toUpperCase()}`,
    owner: fields.owner || "Not extracted",
    survey_number: fields.survey_number || "Not extracted",
    village: villageName,
    land_area: fields.land_area || "Not extracted",
    coordinates: coords,
    boundary: [
      [coords[0] + 0.002, coords[1] - 0.002],
      [coords[0] + 0.002, coords[1] + 0.002],
      [coords[0] - 0.002, coords[1] + 0.002],
      [coords[0] - 0.002, coords[1] - 0.002],
    ],
    document_type: "Uploaded Document",
    extracted_at: new Date().toISOString(),
    confidence: Math.min(95, foundCount * 25),
  };

  onProgress?.("Extraction complete!");

  return { success: true, rawText, property };
}
