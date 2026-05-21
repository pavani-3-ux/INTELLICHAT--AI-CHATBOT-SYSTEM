import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini API Client
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    })
  : null;

// Predefined Persona configurations
const PERSONAS = {
  friendly: {
    name: "Friendly Guide",
    description: "Extremely warm, encouraging, chatty, and uses plenty of emojis and motivational remarks.",
  },
  professional: {
    name: "Executive Analyst",
    description: "Highly polished, structured, eloquent, clear, and focused on maximum professionalism.",
  },
  creative: {
    name: "Spark & Muse",
    description: "Out-of-the-box thinker, expressive, uses rich metaphors, analogies, and inspires creativity.",
  },
  technical: {
    name: "Core Architect",
    description: "Precise, logic-oriented, code-friendly, deep-dives into mechanics, and uses clear technical analogies.",
  },
  concise: {
    name: "Direct Navigator",
    description: "Brief, high-impact, gets straight to the point without filler words, highly structured.",
  },
};

// API chat endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history, persona = "friendly", language = "en" } = req.body;

    if (!message) {
       res.status(400).json({ error: "Message is required" });
       return;
    }

    if (!ai) {
       res.status(500).json({
        error: "GEMINI_API_KEY environment variable is not configured. Please set it in Settings > Secrets.",
      });
       return;
    }

    const selectedPersona = PERSONAS[persona as keyof typeof PERSONAS] || PERSONAS.friendly;
    
    // Detailed system configuration instructing the model on all behavior rules:
    const systemInstruction = `You are Intellichat, an advanced AI chatbot system designed to engage, assist, and delight users.

Core Guidelines:
1. Persona: Adapt your tone completely to "${selectedPersona.name}" - ${selectedPersona.description}.
2. Language: Respond fluently and comprehensively in the language code: "${language}". Translation or localized dialogue must be perfect.
3. Multi-turn memory: Maintain conversational continuity with the provided message history.
4. Formatting: Write exceptionally clear markdown. Use headers (###), lists, bold text, and tables. 
5. Visual Cues: Incorporate appropriate emojis. Use color markers where relevant:
   - For informational blocks/notes, wrap them with "[Blue Info: text]"
   - For positive achievements, completion, or success points, wrap with "[Green Success: text]"
   - For warnings, important considerations, or cautions, wrap with "[Red Warning: text]"
6. Persona rules:
   - Friendly: Start or end with warm, cheerful expressions.
   - Professional: Focus on executive-ready structure.
   - Creative: Deliver vivid illustrations or analogies.
   - Technical: Include rich explanations, precise details, or structured steps.
   - Concise: Be extremely short, direct, and packed with high density facts.

Output Schema:
You must respond with a JSON object containing:
- "reply" (string): The complete markdown answer obeying the guidelines above.
- "suggestions" (array of strings): Exactly 3 highly relevant and engaging follow-up questions/prompts that the user might want to click next based on this response.
- "insights" (array of strings): 1 to 3 short, interesting, high-value related facts or educational contextual details connected to the topic of conversation.
`;

    // Map history to the Gemini format
    const contents = [];
    if (history && Array.isArray(history)) {
      // Process last 14 messages to prevent exceeding window limits, keep it compact and fast
      const recentHistory = history.slice(-14);
      for (const h of recentHistory) {
        contents.push({
          role: h.role,
          parts: [{ text: h.content }],
        });
      }
    }
    // Add the new user message
    contents.push({
      role: "user",
      parts: [{ text: message }],
    });

    // Call the Gemini-3.5-flash model
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: { 
              type: Type.STRING,
              description: "The main markdown response text complying with current persona, language, structure, and formatting instructions."
            },
            suggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Exactly 3 quick follow-up questions to prompt next."
            },
            insights: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "1 to 3 short educational or background facts about the topic of discussion."
            },
          },
          required: ["reply", "suggestions", "insights"],
        },
      },
    });

    const textOutput = response.text;
    if (!textOutput) {
      throw new Error("Empty response returned from Gemini API");
    }

    const payload = JSON.parse(textOutput.trim());
    res.json({
      reply: payload.reply,
      suggestions: payload.suggestions || [
        "Tell me more about this.",
        "Could you give an example?",
        "Whom should I share this with?"
      ],
      insights: payload.insights || ["You are chatting with Intellichat, your advanced personal assistant."]
    });
  } catch (error: any) {
    console.error("Chat API error:", error);
    res.status(500).json({
      error: error.message || "An error occurred while generating the response from Gemini.",
    });
  }
});

// Serve frontend assets in production or Vite middleware in development
if (process.env.NODE_ENV !== "production") {
  import("vite").then(async (viteModule) => {
    const vite = await viteModule.createServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }).catch(err => {
    console.error("Failed to load Vite server on backend:", err);
  });
} else {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

// Start Server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Intellichat full-stack server running on http://localhost:${PORT}`);
});
