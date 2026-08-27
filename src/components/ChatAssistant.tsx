import { useState } from "react";
import { MessageSquare, Send, Bot, User, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PropertyRecord } from "@/data/mockData";

interface Props {
  property: PropertyRecord | null;
}

interface Message {
  sender: "bot" | "user";
  text: string;
}

const ChatAssistant = ({ property }: Props) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "bot",
      text: property
        ? `Hello! I am your AI Land Intelligence Assistant. Ask me anything about ${property.owner}'s document (Survey No: ${property.survey_number}).`
        : "Hello! Upload a land document to start asking questions about property records.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || !property) return;

    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { sender: "user", text: userMsg }]);
    setLoading(true);

    try {
      // 1. Try sending query to backend chatbot endpoint
      const res = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doc_id: property.id, message: userMsg }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setMessages((prev) => [...prev, { sender: "bot", text: data.response }]);
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      console.warn("Backend chat unavailable, running client fallback parsing.", err);
    }

    // 2. Client-side Fallback Parser
    setTimeout(() => {
      const msgLower = userMsg.toLowerCase();
      let botText = "";

      if (msgLower.includes("who") || msgLower.includes("owner") || msgLower.includes("pattadar")) {
        botText = `The registered owner of this land is **${property.owner}**.`;
      } else if (msgLower.includes("survey") || msgLower.includes("subdivision")) {
        botText = `The survey number is **${property.survey_number}** (Subdivision: **${property.subdivision || "1A"}**).`;
      } else if (msgLower.includes("where") || msgLower.includes("location") || msgLower.includes("village")) {
        botText = `The property is situated in **${property.village}**, Taluk: **${property.taluk || "N/A"}**, District: **${property.district || "N/A"}**.`;
      } else if (msgLower.includes("size") || msgLower.includes("area") || msgLower.includes("acres")) {
        botText = `The total recorded land area is **${property.land_area}**.`;
      } else if (msgLower.includes("value") || msgLower.includes("worth") || msgLower.includes("price")) {
        const val = property.classification === "Residential" ? "₹1,20,00,000" : (property.classification === "Commercial" ? "₹1,85,00,000" : "₹35,00,000");
        botText = `The estimated market valuation for this **${property.classification || "Land"}** property is approx **${val}**.`;
      } else if (msgLower.includes("summarize") || msgLower.includes("summary") || msgLower.includes("details")) {
        botText = `**Property Summary:**\n- **Owner:** ${property.owner}\n- **Survey No:** ${property.survey_number}\n- **Location:** ${property.village}\n- **Land Area:** ${property.land_area}\n- **Doc Type:** ${property.document_type}`;
      } else {
        botText = `I can answer queries regarding property ownership, survey numbers, location details, area, estimated value, or document summaries for **${property.owner}**.`;
      }

      setMessages((prev) => [...prev, { sender: "bot", text: botText }]);
      setLoading(false);
    }, 600);
  };

  return (
    <Card className="glass-card flex flex-col h-[480px]">
      <CardHeader className="pb-3 border-b border-border/40">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          AI Document Chat Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-4 justify-between overflow-hidden">
        {/* Messages List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-2 mb-3">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-2.5 ${
                m.sender === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <div
                className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${
                  m.sender === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {m.sender === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>
              <div
                className={`p-3 rounded-xl text-xs max-w-[80%] whitespace-pre-wrap ${
                  m.sender === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-none"
                    : "bg-muted/60 text-foreground rounded-tl-none"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              AI Assistant is thinking...
            </div>
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSend} className="flex items-center gap-2 pt-2 border-t border-border/40">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              property ? "Ask questions about this land record..." : "Upload a document to chat..."
            }
            disabled={!property || loading}
            className="text-xs h-9"
          />
          <Button type="submit" size="sm" className="h-9 px-3" disabled={!property || loading}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ChatAssistant;
