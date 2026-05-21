import { Persona, Language } from "./types";

export const LANGUAGES: Language[] = [
  { code: "en", name: "English", nativeName: "English", flag: "🇺🇸" },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸" },
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷" },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪" },
  { code: "zh", name: "Chinese", nativeName: "中文", flag: "🇨🇳" },
  { code: "ja", name: "Japanese", nativeName: "日本語", flag: "🇯🇵" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు", flag: "🇮🇳" },
  { code: "ar", name: "Arabic", nativeName: "العربية", flag: "🇸🇦" },
];

export const PERSONAS: Record<string, Persona> = {
  friendly: {
    id: "friendly",
    name: "Friendly Guide",
    emoji: "😊",
    description: "Extremely warm, joyful, supportive, and loves using emojis.",
    tonePrompt: "warm, encouraging, chatty, and highly engaging",
    bgColor: "from-amber-500/10 to-orange-500/10 border-orange-500/35",
    textColor: "text-orange-400",
    accentColor: "bg-orange-500 hover:bg-orange-600 focus:ring-orange-500 text-slate-950",
  },
  professional: {
    id: "professional",
    name: "Executive Analyst",
    emoji: "💼",
    description: "Polished, strategic, highly structured, and objective.",
    tonePrompt: "highly professional, executive-ready, and objective",
    bgColor: "from-blue-500/10 to-indigo-500/10 border-blue-500/35",
    textColor: "text-blue-400",
    accentColor: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 text-white",
  },
  creative: {
    id: "creative",
    name: "Spark & Muse",
    emoji: "🎨",
    description: "Expressive writer, imaginative, full of analogies and ideas.",
    tonePrompt: "imaginative, expressive, and packed with interesting analogies",
    bgColor: "from-fuchsia-500/10 to-pink-500/10 border-fuchsia-500/35",
    textColor: "text-fuchsia-400",
    accentColor: "bg-fuchsia-500 hover:bg-fuchsia-600 focus:ring-fuchsia-500 text-slate-950",
  },
  technical: {
    id: "technical",
    name: "Core Architect",
    emoji: "💻",
    description: "Deep-dives into systems, precise equations, and clear code examples.",
    tonePrompt: "technically precise, code-friendly, logical, and structured",
    bgColor: "from-emerald-500/10 to-teal-500/10 border-emerald-500/35",
    textColor: "text-emerald-400",
    accentColor: "bg-emerald-500 hover:bg-emerald-600 focus:ring-emerald-500 text-slate-950",
  },
  concise: {
    id: "concise",
    name: "Direct Navigator",
    emoji: "🎯",
    description: "Extremely straight to the point, minimal fluff, bullet-dense.",
    tonePrompt: "high-density direct bullet points and brief clarifications",
    bgColor: "from-rose-500/10 to-red-500/10 border-rose-500/35",
    textColor: "text-red-400",
    accentColor: "bg-rose-500 hover:bg-rose-600 focus:ring-rose-500 text-slate-950",
  },
};

export const STARTER_PROMPTS: Record<string, string[]> = {
  friendly: [
    "Give me some fun ideas to surprise my best friend on their birthday! 🎂",
    "Can you share 3 simple morning habits to boost my energy? ☀️",
    "I need a short, happy pep-talk to motivate me for a big interview! 🙌",
  ],
  professional: [
    "Draft a polite email requesting an extension on an project milestone. 📝",
    "What are the best frameworks for structuring a professional business pitch?",
    "Explain the concepts of high-impact leadership in modern hybrid workplaces.",
  ],
  creative: [
    "Pitch 3 wild sci-fi movie premises involving time travel and vintage clocks. ⏱️",
    "Describe a bustling fantasy marketplace using vivid sensory writing.",
    "Help me write a poetic metaphor about the cycle of spring and renewal.",
  ],
  technical: [
    "Explain how Promises and asynchronous event loops work in Node.js with simple files.",
    "Draft a clean React hook example implementing debounce for API fetches.",
    "Compare SQL versus NoSQL databases for standard transactional e-commerce.",
  ],
  concise: [
    "Summarize key rules of a healthy cardiovascular workout routine in 3 bullet lines.",
    "Pro/Con matrix: Working remote vs hybrid desk space.",
    "List of top 5 must-read classical literature books with author names.",
  ],
};
