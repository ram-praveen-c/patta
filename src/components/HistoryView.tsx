import { useState, useEffect } from "react";
import { History, Search, Filter, Calendar, MapPin, User, Tag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { PropertyRecord } from "@/data/mockData";
import { API_BASE_URL } from "@/lib/apiConfig";

interface Props {
  onSelectProperty: (property: PropertyRecord) => void;
}

const HistoryView = ({ onSelectProperty }: Props) => {
  const [query, setQuery] = useState("");
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = async (searchQuery?: string) => {
    setLoading(true);
    try {
      const url = searchQuery
        ? `${API_BASE_URL}/api/history?query=${encodeURIComponent(searchQuery)}`
        : `${API_BASE_URL}/api/history`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setDocuments(data.documents);
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      console.warn("Backend history fetch failed, using local sample history.", err);
    }

    // Fallback Mock History
    setTimeout(() => {
      const mockDocs = [
        {
          id: "DOC-8F32A1",
          filename: "patta_cuddalore_142.pdf",
          doc_type: "Patta/Chitta Extract",
          processed_at: "2026-07-21 10:15",
          parsed_data: {
            owner: "Rajesh Kumar Sharma",
            survey_number: "142",
            subdivision: "1A",
            village: "Cuddalore Town",
            land_area: "2.5 Acres",
            classification: "Dry Land",
          },
          coordinates: [11.7401, 79.759],
          confidence_scores: { overall_score: 95 },
        },
        {
          id: "DOC-91B2C4",
          filename: "sale_deed_khandala.pdf",
          doc_type: "Sale Deed",
          processed_at: "2026-07-20 14:30",
          parsed_data: {
            owner: "Rajesh Kumar Sharma",
            survey_number: "SY/142/A",
            subdivision: "1A",
            village: "Khandala, Pune",
            land_area: "2.5 Acres",
            classification: "Non-Agricultural (Residential)",
          },
          coordinates: [18.7667, 73.3833],
          confidence_scores: { overall_score: 92 },
        },
        {
          id: "DOC-10293D",
          filename: "perambalur_land_319.pdf",
          doc_type: "Patta/Chitta Extract",
          processed_at: "2026-07-19 16:45",
          parsed_data: {
            owner: "Suresh Kumar Selvam",
            survey_number: "319",
            subdivision: "4",
            village: "Perambalur",
            land_area: "3.2 Acres",
            classification: "Wet Land (Agricultural)",
          },
          coordinates: [11.2333, 78.8667],
          confidence_scores: { overall_score: 98 },
        },
      ];

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const filtered = mockDocs.filter(
          (d) =>
            d.filename.toLowerCase().includes(q) ||
            d.parsed_data.owner.toLowerCase().includes(q) ||
            d.parsed_data.village.toLowerCase().includes(q) ||
            d.parsed_data.survey_number.toLowerCase().includes(q)
        );
        setDocuments(filtered);
      } else {
        setDocuments(mockDocs);
      }
      setLoading(false);
    }, 400);
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchHistory(query);
  };

  const setChipQuery = (q: string) => {
    setQuery(q);
    fetchHistory(q);
  };

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <History className="h-5 w-5 text-primary" />
          Document Audit History & Natural Language Search
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Try: 'Show all lands in Perambalur', 'Show lands above 2 acres', 'Find Survey 319'..."
              className="pl-9 text-xs h-10"
            />
          </div>
          <Button type="submit" size="sm" className="h-10 px-4">
            Search
          </Button>
        </form>

        {/* Quick Suggestion Chips */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-muted-foreground flex items-center gap-1 font-medium">
            <Filter className="h-3 w-3" /> Quick Searches:
          </span>
          <button
            onClick={() => setChipQuery("Perambalur")}
            className="px-2.5 py-1 rounded-full bg-muted hover:bg-primary/20 hover:text-primary transition-colors"
          >
            "Perambalur"
          </button>
          <button
            onClick={() => setChipQuery("above 2 acres")}
            className="px-2.5 py-1 rounded-full bg-muted hover:bg-primary/20 hover:text-primary transition-colors"
          >
            "above 2 acres"
          </button>
          <button
            onClick={() => setChipQuery("Survey 319")}
            className="px-2.5 py-1 rounded-full bg-muted hover:bg-primary/20 hover:text-primary transition-colors"
          >
            "Survey 319"
          </button>
          <button
            onClick={() => setChipQuery("Rajesh")}
            className="px-2.5 py-1 rounded-full bg-muted hover:bg-primary/20 hover:text-primary transition-colors"
          >
            "Owner: Rajesh"
          </button>
        </div>

        {/* Results List */}
        <div className="space-y-3 pt-2">
          {loading ? (
            <div className="text-center py-8 text-xs text-muted-foreground">
              Searching document registry...
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted-foreground">
              No matching land records found.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {documents.map((doc) => {
                const p = doc.parsed_data || {};
                const coords: [number, number] = doc.coordinates || [11.74, 79.76];

                const propRecord: PropertyRecord = {
                  id: doc.id,
                  owner: p.owner || "Unknown",
                  survey_number: p.survey_number || "N/A",
                  subdivision: p.subdivision || "1A",
                  village: p.village || "Unknown",
                  land_area: p.land_area || "N/A",
                  classification: p.classification || "Residential",
                  coordinates: coords,
                  boundary: [
                    [coords[0] + 0.002, coords[1] - 0.002],
                    [coords[0] + 0.002, coords[1] + 0.002],
                    [coords[0] - 0.002, coords[1] + 0.002],
                    [coords[0] - 0.002, coords[1] - 0.002],
                  ],
                  document_type: doc.doc_type || "Land Record",
                  extracted_at: doc.processed_at || new Date().toISOString(),
                  confidence: doc.confidence_scores?.overall_score || 90,
                };

                return (
                  <div
                    key={doc.id}
                    onClick={() => onSelectProperty(propRecord)}
                    className="p-3 rounded-xl border border-border/60 bg-muted/20 hover:border-primary/60 cursor-pointer transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary">
                        {doc.doc_type}
                      </span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> {doc.processed_at}
                      </span>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-primary" /> {p.owner || "Unknown"}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" /> {p.village}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs font-medium">
                      <span>Survey: {p.survey_number}</span>
                      <span className="text-primary font-bold">{p.land_area}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default HistoryView;
