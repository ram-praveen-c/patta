export type Language = "en" | "ta" | "hi";

export interface Translations {
  // App header
  appTitle: string;
  appSubtitle: string;
  languageSelect: string;
  debugMode: string;
  debugModeActive: string;

  // Tabs
  tabOverview: string;
  tabAnalytics: string;
  tabCompare: string;
  tabHistory: string;
  tabChat: string;
  tabReport: string;
  tabAdmin: string;

  // Document Upload
  uploadTitle: string;
  uploadDrop: string;
  uploadHelp: string;
  uploadBrowse: string;
  uploading: string;
  preprocessing: string;
  ocrProcessing: string;
  layoutDetecting: string;
  tableExtracting: string;
  infoExtracting: string;
  validating: string;
  locating: string;
  completed: string;
  docLangSelect: string;
  docLangTamilEnglish: string;
  docLangEnglish: string;
  docLangHindiEnglish: string;

  // Extracted Information
  extractedTitle: string;
  owner: string;
  pattaNumber: string;
  surveyNumber: string;
  subdivision: string;
  surveyDisplay: string;
  village: string;
  panchayat: string;
  taluk: string;
  district: string;
  landArea: string;
  totalArea: string;
  classification: string;
  documentType: string;
  surveyTableTitle: string;
  locateLandBtn: string;
  locatingLand: string;
  editIdentifiers: string;
  viewSummary: string;
  saveChanges: string;

  // Evidence & OCR
  viewRawOcr: string;
  evidenceViewerTitle: string;
  evidenceHelp: string;
  clickToHighlight: string;
  confidence: string;

  // Validation
  validationTitle: string;
  statusValid: string;
  statusPartial: string;
  statusInvalid: string;
  areaConsistencyTitle: string;
  areaConsistent: string;
  areaInconsistent: string;
  calculatedSum: string;
  documentTotal: string;

  // Location & Map
  mapTitle: string;
  exactParcelLocated: string;
  administrativeLocation: string;
  locationUnresolved: string;
  exactParcelDesc: string;
  administrativeDesc: string;
  unresolvedDesc: string;
  mapLayerSatellite: string;
  mapLayerStreet: string;
  mapLayerCadastral: string;

  // Land Intelligence
  intelligenceTitle: string;
  intelligenceSummary: string;
  discrepancies: string;
  noneDetected: string;
  gisMatchStatus: string;
  documentQuality: string;

  // Errors
  errorQualityLow: string;
  errorOcrFailed: string;
  errorTableFailed: string;
  errorNoSurvey: string;
  errorServerOffline: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    appTitle: "SmartLand AI",
    appSubtitle: "AI-Based Smart Property Locator & Land Intelligence System",
    languageSelect: "Language",
    debugMode: "Developer Mode",
    debugModeActive: "Debug Mode Active",

    tabOverview: "Overview & GIS Map",
    tabAnalytics: "Analytics & Validation",
    tabCompare: "Document Compare",
    tabHistory: "Audit History",
    tabChat: "AI Land Assistant",
    tabReport: "Printable PDF Report",
    tabAdmin: "Panchayat GIS Admin",

    uploadTitle: "Document Upload & OCR",
    uploadDrop: "Drop Patta document here (PDF / Image: JPG, PNG, WEBP)",
    uploadHelp: "Tamil, English, and Hindi Patta / Chitta / Sale Deed documents",
    uploadBrowse: "Browse Files",
    uploading: "Uploading document...",
    preprocessing: "Preprocessing & Deskewing...",
    ocrProcessing: "Multilingual OCR Processing...",
    layoutDetecting: "Detecting Document Layout...",
    tableExtracting: "Extracting Survey Table & Cells...",
    infoExtracting: "Extracting Structured Information...",
    validating: "Validating Document & Area Consistency...",
    locating: "Cadastral GIS Matching...",
    completed: "Extraction Complete!",
    docLangSelect: "Document Language",
    docLangTamilEnglish: "Tamil + English (தமிழ் + ஆங்கிலம்)",
    docLangEnglish: "English",
    docLangHindiEnglish: "Hindi + English (हिन्दी + अंग्रेज़ी)",

    extractedTitle: "Extracted Land Information",
    owner: "Owner / Pattadar",
    pattaNumber: "Patta Number",
    surveyNumber: "Survey Number",
    subdivision: "Subdivision",
    surveyDisplay: "Survey Identifier",
    village: "Village",
    panchayat: "Panchayat",
    taluk: "Taluk",
    district: "District",
    landArea: "Land Area",
    totalArea: "Total Area",
    classification: "Land Classification",
    documentType: "Document Type",
    surveyTableTitle: "Survey & Subdivision Table",
    locateLandBtn: "Locate Land Parcel",
    locatingLand: "Locating Parcel...",
    editIdentifiers: "Edit Land Identifiers",
    viewSummary: "View Summary",
    saveChanges: "Save & Apply",

    viewRawOcr: "View Raw OCR",
    evidenceViewerTitle: "Document Evidence Viewer",
    evidenceHelp: "Click on any extracted field or table row to highlight the verified region on the original Patta.",
    clickToHighlight: "Highlight on Document",
    confidence: "Confidence",

    validationTitle: "Validation & Quality Status",
    statusValid: "VALID",
    statusPartial: "PARTIAL",
    statusInvalid: "INVALID",
    areaConsistencyTitle: "Area Consistency Validation",
    areaConsistent: "Consistent",
    areaInconsistent: "Potential area inconsistency detected. Manual verification required.",
    calculatedSum: "Calculated Subdivisions Sum",
    documentTotal: "Document Total Area",

    mapTitle: "Cadastral GIS Land Map",
    exactParcelLocated: "Exact Parcel Located",
    administrativeLocation: "Administrative Location",
    locationUnresolved: "Location Unresolved",
    exactParcelDesc: "Exact cadastral parcel boundary identified from registered spatial GIS.",
    administrativeDesc: "Exact parcel boundary could not be identified. Displaying verified administrative location.",
    unresolvedDesc: "Exact parcel location could not be determined from available data.",
    mapLayerSatellite: "Satellite",
    mapLayerStreet: "Street Map",
    mapLayerCadastral: "Cadastral Parcels",

    intelligenceTitle: "Land Intelligence Summary",
    intelligenceSummary: "Objective Cadastral Assessment",
    discrepancies: "Potential Discrepancies",
    noneDetected: "No critical inconsistencies detected in document records.",
    gisMatchStatus: "GIS Cadastral Match Status",
    documentQuality: "Document Scan Quality",

    errorQualityLow: "Document quality is too low for reliable extraction.",
    errorOcrFailed: "Text could not be reliably extracted from the document.",
    errorTableFailed: "Survey table could not be reliably reconstructed.",
    errorNoSurvey: "Survey number could not be identified.",
    errorServerOffline: "Could not connect to Python backend. Please start the backend service."
  },

  ta: {
    appTitle: "ஸ்மார்ட்லேண்ட் AI",
    appSubtitle: "AI நில நுண்ணறிவு மற்றும் பட்டா அடையாளக் கண்டுபிடிப்பு தளம்",
    languageSelect: "மொழி",
    debugMode: "டெவலப்பர் பயன்முறை",
    debugModeActive: "பிழைதிருத்த பயன்முறை செயலில் உள்ளது",

    tabOverview: "மேலோட்டம் & GIS வரைபடம்",
    tabAnalytics: "பகுப்பாய்வு & சரிபார்ப்பு",
    tabCompare: "ஆவண ஒப்பீடு",
    tabHistory: "தணிக்கை வரலாறு",
    tabChat: "AI நில உதவியாளர்",
    tabReport: "அச்சிடக்கூடிய PDF அறிக்கை",
    tabAdmin: "ஊராட்சி GIS நிர்வாகம்",

    uploadTitle: "ஆவணப் பதிவேற்றம் & OCR",
    uploadDrop: "பட்டா ஆவணத்தை இங்கே பதிவேற்றவும் (PDF / படம்: JPG, PNG, WEBP)",
    uploadHelp: "தமிழ், ஆங்கிலம் மற்றும் இந்தி பட்டா / சிட்டா / கிரயப் பத்திரங்கள்",
    uploadBrowse: "கோப்புகளைத் தேர்ந்தெடுக்கவும்",
    uploading: "ஆவணம் பதிவேற்றப்படுகிறது...",
    preprocessing: "முன் செயலாக்கம் & நேராக்கல்...",
    ocrProcessing: "பல்மொழி OCR செயலாக்கம்...",
    layoutDetecting: "ஆவண தளவமைப்பு கண்டறிதல்...",
    tableExtracting: "புல எண் அட்டவணை பிரித்தெடுத்தல்...",
    infoExtracting: "கட்டமைக்கப்பட்ட விவரங்கள் பிரித்தெடுத்தல்...",
    validating: "ஆவணம் & நிலப்பரப்பு சரிபார்ப்பு...",
    locating: "GIS புல எல்லை பொருத்துதல்...",
    completed: "பிரித்தெடுத்தல் முடிந்தது!",
    docLangSelect: "ஆவணத்தின் மொழி",
    docLangTamilEnglish: "தமிழ் + ஆங்கிலம்",
    docLangEnglish: "ஆங்கிலம்",
    docLangHindiEnglish: "இந்தி + ஆங்கிலம்",

    extractedTitle: "பிரித்தெடுக்கப்பட்ட நில விவரங்கள்",
    owner: "பட்டாதாரர் பெயர்",
    pattaNumber: "பட்டா எண்",
    surveyNumber: "சர்வே எண்",
    subdivision: "உட்பிரிவு",
    surveyDisplay: "புல அடையாள எண்",
    village: "கிராமம்",
    panchayat: "ஊராட்சி",
    taluk: "வட்டம்",
    district: "மாவட்டம்",
    landArea: "நிலப்பரப்பு",
    totalArea: "மொத்த பரப்பளவு",
    classification: "நில வகைப்பாடு",
    documentType: "ஆவண வகை",
    surveyTableTitle: "புல எண் & உட்பிரிவு அட்டவணை",
    locateLandBtn: "நில எல்லையைக் கண்டறியவும்",
    locatingLand: "எல்லை கண்டறியப்படுகிறது...",
    editIdentifiers: "புல எண்களைத் திருத்தவும்",
    viewSummary: "சுருக்கத்தைப் பார்க்கவும்",
    saveChanges: "சேமிக்கவும்",

    viewRawOcr: "அசல் OCR உரையைக் காண்க",
    evidenceViewerTitle: "ஆவண ஆதார காட்சிப்பான்",
    evidenceHelp: "பட்டாவில் உள்ள சரிபார்க்கப்பட்ட பகுதியை வரைபடத்தில் காண ஏதேனும் புல விவரத்தை கிளிக் செய்யவும்.",
    clickToHighlight: "ஆவணத்தில் முன்னிலைப்படுத்தவும்",
    confidence: "நம்பகத்தன்மை",

    validationTitle: "சரிபார்ப்பு & தர நிலை",
    statusValid: "செல்லுபடியாகும் (VALID)",
    statusPartial: "பகுதி சரிபார்ப்பு (PARTIAL)",
    statusInvalid: "செல்லுபடியாகாது (INVALID)",
    areaConsistencyTitle: "நிலப்பரப்பு நிலைத்தன்மை சரிபார்ப்பு",
    areaConsistent: "நிலப்பரப்பு சரியாகப் பொருந்துகிறது",
    areaInconsistent: "சாத்தியமான பகுதி முரண்பாடு கண்டறியப்பட்டது. கைமுறை சரிபார்ப்பு தேவை.",
    calculatedSum: "உட்பிரிவு பரப்பளவுகளின் கூட்டுத்தொகை",
    documentTotal: "ஆவண மொத்த பரப்பளவு",

    mapTitle: "நில வருவாய் GIS வரைபடம்",
    exactParcelLocated: "துல்லியமான நில எல்லை கண்டறியப்பட்டது",
    administrativeLocation: "நிர்வாக இருப்பிடம்",
    locationUnresolved: "இருப்பிடம் தீர்க்கப்படவில்லை",
    exactParcelDesc: "அங்கீகரிக்கப்பட்ட காடாஸ்ட்ரல் GIS இலிருந்து உண்மையான நில எல்லை அடையாளம் காணப்பட்டது.",
    administrativeDesc: "துல்லியமான எல்லை கண்டறியப்படவில்லை. சரிபார்க்கப்பட்ட கிராம நிர்வாக மையம் காட்டப்படுகிறது.",
    unresolvedDesc: "கிடைக்கக்கூடிய தரவுகளிலிருந்து நிலத்தின் இருப்பிடத்தை தீர்மானிக்க முடியவில்லை.",
    mapLayerSatellite: "செயற்கைக்கோள்",
    mapLayerStreet: "தெரு வரைபடம்",
    mapLayerCadastral: "புல எல்லைகள்",

    intelligenceTitle: "நில நுண்ணறிவு அறிக்கை",
    intelligenceSummary: "புறநிலை நில மதிப்பீடு",
    discrepancies: "கண்டறியப்பட்ட முரண்பாடுகள்",
    noneDetected: "ஆவணப் பதிவுகளில் முக்கியமான முரண்பாடுகள் எதுவும் கண்டறியப்படவில்லை.",
    gisMatchStatus: "GIS பொருத்த நிலை",
    documentQuality: "ஆவண ஸ்கேன் தரம்",

    errorQualityLow: "நம்பகமான தரவுப் பிரித்தெடுப்பிற்கு ஆவணத்தின் தரம் மிகவும் குறைவாக உள்ளது.",
    errorOcrFailed: "ஆவணத்திலிருந்து உரையை நம்பகத்தன்மையுடன் பிரித்தெடுக்க முடியவில்லை.",
    errorTableFailed: "புல எண் அட்டவணையை நம்பகத்தன்மையுடன் மறுகட்டமைக்க முடியவில்லை.",
    errorNoSurvey: "புல எண்ணை அடையாளம் காண முடியவில்லை.",
    errorServerOffline: "பின்தள சேவையகத்தை இணைக்க முடியவில்லை. தயவுசெய்து சேவையகத்தைத் தொடங்கவும்."
  },

  hi: {
    appTitle: "स्मार्टलैंड AI",
    appSubtitle: "एआई आधारित स्मार्ट भूमि लोकेटर एवं भू-खुफिया प्रणाली",
    languageSelect: "भाषा",
    debugMode: "डेवलपर मोड",
    debugModeActive: "डीबग मोड सक्रिय",

    tabOverview: "अवलोकन एवं GIS मानचित्र",
    tabAnalytics: "विश्लेषण एवं सत्यापन",
    tabCompare: "दस्तावेज़ तुलना",
    tabHistory: "ऑडिट इतिहास",
    tabChat: "एआई भूमि सहायक",
    tabReport: "मुद्रण योग्य PDF रिपोर्ट",
    tabAdmin: "पंचायत GIS प्रशासन",

    uploadTitle: "दस्तावेज़ अपलोड एवं OCR",
    uploadDrop: "पट्टा / भू-अभिलेख दस्तावेज़ यहाँ छोड़ें (PDF / चित्र: JPG, PNG, WEBP)",
    uploadHelp: "तमिल, अंग्रेज़ी और हिन्दी पट्टा, खतौनी एवं विक्रय विलेख समर्थित",
    uploadBrowse: "फ़ाइलें चुनें",
    uploading: "दस्तावेज़ अपलोड हो रहा है...",
    preprocessing: "पूर्व-प्रसंस्करण एवं सीधा करना...",
    ocrProcessing: "बहुभाषी OCR प्रसंस्करण...",
    layoutDetecting: "दस्तावेज़ लेआउट पहचान...",
    tableExtracting: "सर्वेक्षण तालिका एवं सेल निष्कर्षण...",
    infoExtracting: "संरचित जानकारी निष्कर्षण...",
    validating: "दस्तावेज़ एवं क्षेत्रफल सत्यापन...",
    locating: "भू-स्थानिक GIS मिलान...",
    completed: "निष्कर्षण पूर्ण!",
    docLangSelect: "दस्तावेज़ की भाषा",
    docLangTamilEnglish: "तमिल + अंग्रेज़ी",
    docLangEnglish: "अंग्रेज़ी",
    docLangHindiEnglish: "हिन्दी + अंग्रेज़ी",

    extractedTitle: "निकाली गई भूमि जानकारी",
    owner: "खातेदार / स्वामी",
    pattaNumber: "पट्टा / खाता संख्या",
    surveyNumber: "सर्वेक्षण संख्या",
    subdivision: "उप-विभाजन",
    surveyDisplay: "सर्वे पहचान संख्या",
    village: "गाँव",
    panchayat: "पंचायत",
    taluk: "तालुक / तहसील",
    district: "जिला",
    landArea: "भूमि क्षेत्रफल",
    totalArea: "कुल क्षेत्रफल",
    classification: "भूमि वर्गीकरण",
    documentType: "दस्तावेज़ प्रकार",
    surveyTableTitle: "सर्वेक्षण एवं उप-विभाजन तालिका",
    locateLandBtn: "भूमि भूखंड खोजें",
    locatingLand: "भूखंड खोजा जा रहा है...",
    editIdentifiers: "पहचानकर्ताओं में सुधार करें",
    viewSummary: "सारांश देखें",
    saveChanges: "सहेजें",

    viewRawOcr: "मूल OCR पाठ देखें",
    evidenceViewerTitle: "दस्तावेज़ साक्ष्य दर्शक",
    evidenceHelp: "पट्टे पर सत्यापित क्षेत्र को देखने के लिए किसी भी फ़ील्ड या तालिका पंक्ति पर क्लिक करें।",
    clickToHighlight: "दस्तावेज़ पर हाइलाइट करें",
    confidence: "विश्वसनीयता",

    validationTitle: "सत्यापन एवं गुणवत्ता स्थिति",
    statusValid: "वैध (VALID)",
    statusPartial: "आंशिक (PARTIAL)",
    statusInvalid: "अमान्य (INVALID)",
    areaConsistencyTitle: "क्षेत्रफल निरंतरता सत्यापन",
    areaConsistent: "सुसंगत (Consistent)",
    areaInconsistent: "संभावित क्षेत्रफल विसंगति पाई गई। मैन्युअल सत्यापन आवश्यक है।",
    calculatedSum: "उप-विभाजनों का कुल योग",
    documentTotal: "दस्तावेज़ में उल्लिखित कुल क्षेत्रफल",

    mapTitle: "कैडस्ट्रल GIS भूमि मानचित्र",
    exactParcelLocated: "सटीक भूखंड स्थित (Exact Parcel Located)",
    administrativeLocation: "प्रशासनिक स्थान (Administrative Location)",
    locationUnresolved: "स्थान अनसुलझा (Location Unresolved)",
    exactParcelDesc: "आधिकारिक कैडस्ट्रल GIS डेटाबेस से वास्तविक पार्सल बहुभुज की पहचान की गई।",
    administrativeDesc: "सटीक सीमा की पहचान नहीं हो सकी। सत्यापित प्रशासनिक केंद्र प्रदर्शित हो रहा है।",
    unresolvedDesc: "उपलब्ध स्थानिक डेटा से सटीक स्थान निर्धारित नहीं किया जा सका।",
    mapLayerSatellite: "उपग्रह",
    mapLayerStreet: "सड़क मानचित्र",
    mapLayerCadastral: "कैडस्ट्रल पार्सल",

    intelligenceTitle: "भूमि आसूचना रिपोर्ट",
    intelligenceSummary: "वस्तुनिष्ठ भू-मूल्यांकन",
    discrepancies: "संभावित विसंगतियाँ",
    noneDetected: "दस्तावेज़ रिकॉर्ड में कोई महत्वपूर्ण विसंगति नहीं पाई गई।",
    gisMatchStatus: "GIS मिलान स्थिति",
    documentQuality: "स्कैन गुणवत्ता",

    errorQualityLow: "विश्वसनीय निष्कर्षण के लिए दस्तावेज़ की गुणवत्ता अपर्याप्त है।",
    errorOcrFailed: "दस्तावेज़ से पाठ को विश्वसनीय रूप से नहीं निकाला जा सका।",
    errorTableFailed: "सर्वेक्षण तालिका का पुनर्गठन नहीं हो सका।",
    errorNoSurvey: "सर्वेक्षण संख्या की पहचान नहीं की जा सकी।",
    errorServerOffline: "पायथन बैकएंड से संपर्क नहीं हो सका। कृपया बैकएंड सेवा प्रारंभ करें।"
  }
};
