import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  Plus,
  Trash2,
  Settings,
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  Sparkles,
  Globe,
  Languages,
  BookOpen,
  HelpCircle,
  RefreshCw,
  SlidersHorizontal,
  X,
  ChevronRight,
  Menu,
  Sun,
  Moon,
  Info,
  AlertTriangle
} from "lucide-react";
import { Message, ChatSession, AppSettings, PersonaType } from "./types";
import { LANGUAGES, PERSONAS, STARTER_PROMPTS } from "./data";
import { HighlightParser } from "./components/HighlightParser";

// Predefined rotation of trivia messages to display on the loading state
const LOADING_TRIVIA = [
  "Gemini 3.5-flash uses advanced neural models to parse multi-turn intent accurately.",
  "Your Intellichat responses can be translated to over 9 different international languages instantly.",
  "Adjusting your Persona changes the system guidelines, altering how formal or creative the answers feel.",
  "You can toggle Text-to-Speech (TTS) using the speaker icon next to any assistant reply to have it read aloud.",
  "The related insights side panel isolates interesting background context and educational links related to your chats!"
];

export default function App() {
  // --- STATE ---
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>("");
  const [inputMessage, setInputMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [triviaIndex, setTriviaIndex] = useState<number>(0);
  
  // App-wide Settings
  const [settings, setSettings] = useState<AppSettings>({
    language: "en",
    persona: "friendly",
    highContrast: false,
    textSize: "base",
    theme: "vibrant"
  });

  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // References
  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // --- INITIALIZATION ---
  useEffect(() => {
    // Load from LocalStorage
    const storedSessions = localStorage.getItem("intellichat_sessions");
    const storedSettings = localStorage.getItem("intellichat_settings");
    
    let loadedSettings: AppSettings = {
      language: "en",
      persona: "friendly",
      highContrast: false,
      textSize: "base",
      theme: "vibrant"
    };

    if (storedSettings) {
      try {
        loadedSettings = JSON.parse(storedSettings);
        setSettings(loadedSettings);
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }

    if (storedSessions) {
      try {
        const parsed = JSON.parse(storedSessions) as ChatSession[];
        if (parsed.length > 0) {
          setSessions(parsed);
          const firstId = parsed[0].id;
          setActiveSessionId(firstId);
          // Set inputs matching that session settings
          setSettings(prev => ({
            ...prev,
            language: parsed[0].language || prev.language,
            persona: parsed[0].persona || prev.persona
          }));
        } else {
          createInitialSession(loadedSettings);
        }
      } catch (e) {
        console.error("Failed to parse sessions", e);
        createInitialSession(loadedSettings);
      }
    } else {
      createInitialSession(loadedSettings);
    }
  }, []);

  // Sync settings and sessions to LocalStorage on changes
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem("intellichat_sessions", JSON.stringify(sessions));
    }
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem("intellichat_settings", JSON.stringify(settings));
  }, [settings]);

  // Adjust active screen on resizing for smooth layout
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    window.addEventListener("resize", handleResize);
    handleResize(); // trigger once initially
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Update loading screen trivia on interval when active
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setTriviaIndex(prev => (prev + 1) % LOADING_TRIVIA.length);
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [loading]);

  // Auto scroll to chat end
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [sessions, activeSessionId, loading]);

  // --- ACTIONS ---
  const createInitialSession = (currentSettings: AppSettings) => {
    const newSession: ChatSession = {
      id: "session-" + Date.now(),
      title: "Welcome to Intellichat!",
      messages: [
        {
          id: "welcome-msg",
          role: "model",
          content: "Hello and welcome to Intellichat! 👋 I am your advanced AI conversation partner, equipped with multi-turn memory, tailored tone personalization, and multi-lingual output. What would you like to discuss today?\n\n[Blue Info: Tip — Use the quick persona buttons at the top of the chat to dynamically change my voice and response style!]",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          suggestions: STARTER_PROMPTS[currentSettings.persona] || STARTER_PROMPTS.friendly,
          insights: ["Intellichat operates with advanced @google/genai context loops."]
        }
      ],
      language: currentSettings.language,
      persona: currentSettings.persona,
      createdAt: new Date().toISOString()
    };
    setSessions([newSession]);
    setActiveSessionId(newSession.id);
  };

  const startNewChat = () => {
    const activePersona = settings.persona;
    const starterMessage = `Hello, I'm ready to learn or write as your ${PERSONAS[activePersona].name}! Ask me anything, or pick one of the core ideas below.`;
    
    const newSession: ChatSession = {
      id: "session-" + Date.now(),
      title: `Chat Session ${sessions.length + 1}`,
      messages: [
        {
          id: "msg-" + Date.now(),
          role: "model",
          content: starterMessage,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          suggestions: STARTER_PROMPTS[activePersona] || STARTER_PROMPTS.friendly,
          insights: ["Each session independently captures settings and persona parameters."]
        }
      ],
      language: settings.language,
      persona: activePersona,
      createdAt: new Date().toISOString()
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setErrorNotice(null);
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const filtered = sessions.filter(s => s.id !== id);
    if (filtered.length === 0) {
      createInitialSession(settings);
    } else {
      setSessions(filtered);
      if (activeSessionId === id) {
        setActiveSessionId(filtered[0].id);
      }
    }
  };

  const clearAllHistory = () => {
    if (window.confirm("Are you sure you want to clear all chat history and parameters? This cannot be undone.")) {
      localStorage.removeItem("intellichat_sessions");
      createInitialSession(settings);
      setErrorNotice(null);
    }
  };

  const handleSendMessage = async (userMessageText: string) => {
    if (!userMessageText.trim()) return;
    setErrorNotice(null);

    // Find the current session messages
    const currentSession = sessions.find(s => s.id === activeSessionId);
    if (!currentSession) return;

    const userMessage: Message = {
      id: "user-" + Date.now(),
      role: "user",
      content: userMessageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Construct new messages list
    const updatedMessages = [...currentSession.messages, userMessage];

    // Update state immediately with the user message
    setSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) {
        // Dynamic title change if it was default
        const title = s.title.startsWith("Chat Session") || s.title === "Welcome to Intellichat!"
          ? (userMessageText.slice(0, 30) + (userMessageText.length > 30 ? "..." : ""))
          : s.title;

        return {
          ...s,
          title,
          messages: updatedMessages
        };
      }
      return s;
    }));

    setInputMessage("");
    setLoading(true);
    setTriviaIndex(Math.floor(Math.random() * LOADING_TRIVIA.length));

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: userMessageText,
          history: updatedMessages,
          persona: settings.persona,
          language: settings.language
        })
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to fetch response from Intellichat API.");
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: "model-" + Date.now(),
        role: "model",
        content: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestions: data.suggestions,
        insights: data.insights
      };

      setSessions(prev => prev.map(s => {
        if (s.id === activeSessionId) {
          return {
            ...s,
            messages: [...updatedMessages, assistantMessage]
          };
        }
        return s;
      }));

    } catch (error: any) {
      console.error("Send error:", error);
      setErrorNotice(error.message || "An unexpected communication error occurred.");
      
      const errorMessage: Message = {
        id: "err-" + Date.now(),
        role: "model",
        content: `🔴 [Red Warning: Failed to retrieve answer from server. Ensure your GEMINI_API_KEY is configured in the secrets menu.] \n\n**Details:** ${error.message || "Unknown Connection Failure"}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true
      };

      setSessions(prev => prev.map(s => {
        if (s.id === activeSessionId) {
          return {
            ...s,
            messages: [...updatedMessages, errorMessage]
          };
        }
        return s;
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  // --- SPEECH RECOGNITION (Voice Typing) ---
  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Try Chrome or Safari.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = settings.language;

      recognition.onstart = () => {
        setIsListening(true);
        setErrorNotice(null);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputMessage(prev => prev + (prev ? " " : "") + transcript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();

    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  // --- TEXT TO SPEECH (Speak Aloud) ---
  const toggleSpeak = (textToSpeak: string) => {
    if (!window.speechSynthesis) {
      alert("TTS Text-To-Speech is not supported in this browser.");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    // Clean text of custom bracketed elements
    const cleanedText = textToSpeak
      .replace(/\[(Blue Info|Green Success|Red Warning):\s*([^\]]+)\]/g, "$2")
      .replace(/\*\*|`|###|##|#/g, ""); // replace markdown syntax

    const utterance = new SpeechSynthesisUtterance(cleanedText);
    utterance.lang = settings.language;
    
    utterance.onend = () => {
      setIsSpeaking(false);
    };
    
    utterance.onerror = (e) => {
      console.error(e);
      setIsSpeaking(false);
    };

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Quick swap settings handlers
  const updateSettings = (key: keyof AppSettings, value: any) => {
    setSettings(prev => {
      const updated = { ...prev, [key]: value };
      
      // Update running session configuration if active
      setSessions(curr => curr.map(s => {
        if (s.id === activeSessionId) {
          return {
            ...s,
            language: key === "language" ? value : s.language,
            persona: key === "persona" ? value : s.persona
          };
        }
        return s;
      }));

      return updated;
    });
  };

  // Extract ongoing helper lists
  const currentSessionObj = sessions.find(s => s.id === activeSessionId);
  const activePersonaObj = PERSONAS[settings.persona] || PERSONAS.friendly;
  const activeLanguageObj = LANGUAGES.find(l => l.code === settings.language) || LANGUAGES[0];
  
  // Aggregate all unique related insights harvested inside this room's messages
  const currentInsights = currentSessionObj
    ? Array.from(new Set(currentSessionObj.messages.flatMap(m => m.insights || []))).filter(Boolean)
    : [];

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 relative overflow-hidden ${
      settings.highContrast ? "contrast-125 saturate-150" : ""
    } ${settings.theme === "vibrant" ? "bg-slate-950 font-sans text-slate-100" : "bg-zinc-950 text-zinc-100"}`}>
      
      {/* Mesh Background Blorbs for Frosted Glass Theme */}
      <div className="mesh-gradient">
        <div className="blob bg-indigo-600 w-[600px] h-[600px] -top-48 -left-48"></div>
        <div className="blob bg-pink-600 w-[500px] h-[500px] top-1/2 -right-32"></div>
        <div className="blob bg-emerald-500 w-[400px] h-[400px] bottom-0 left-1/4"></div>
      </div>

      {/* HEADER BAR */}
      <header className="h-16 shrink-0 border-b border-white/10 glass-panel flex items-center justify-between px-4 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 glass-card transition"
            title="Toggle session history sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-600 flex items-center justify-center shadow-lg font-bold text-white">
              iC
            </div>
            <div>
              <span className="font-display font-bold tracking-tight text-white text-base">
                Intellichat
              </span>
              <span className="text-[10px] ml-1.5 px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 font-mono font-bold">
                ONLINE
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic header summary */}
        <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 font-mono">
          <span>Active Persona:</span>
          <span className={`px-2 py-0.5 rounded bg-white/5 text-slate-200 font-semibold border border-white/10`}>
            {activePersonaObj.emoji} {activePersonaObj.name}
          </span>
          <span className="text-slate-700">|</span>
          <span>Language:</span>
          <span className="px-2 py-0.5 rounded bg-white/5 text-slate-200 font-semibold border border-white/10">
            {activeLanguageObj.flag} {activeLanguageObj.name}
          </span>
        </div>

        {/* Global toggles and controls */}
        <div className="flex items-center gap-2">
          {/* Settings open icon */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1.5 rounded-lg text-slate-300 hover:text-slate-50 glass-card transition flex items-center gap-1.5 text-xs font-semibold"
            title="Configure Chat Settings"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Configure</span>
          </button>
        </div>
      </header>

      {/* CORE FRAMEWORK ELEMENT LAYER */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* SIDEBAR: CONVERSATION HISTORY */}
        <div
          className={`shrink-0 border-r border-white/10 glass-panel transition-all duration-300 flex flex-col scroll-py-2 z-10 ${
            sidebarOpen ? "w-[270px] translate-x-0" : "w-0 -translate-x-full lg:w-0"
          }`}
        >
          <div className="p-4 flex flex-col gap-3 h-full overflow-hidden">
            <button
              onClick={startNewChat}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-semibold text-sm flex items-center justify-center gap-2 transition shadow-md active:scale-98"
            >
              <Plus className="w-4 h-4" />
              <span>Start New Chat</span>
            </button>

            <div className="flex-1 flex flex-col overflow-y-auto mt-2 space-y-2 pr-1">
              <span className="text-[10px] font-bold font-mono tracking-wider text-slate-500 uppercase select-none px-2 mt-2">
                History Sessions ({sessions.length})
              </span>
              
              {sessions.map(s => {
                const isActive = activeSessionId === s.id;
                const personaIcon = PERSONAS[s.persona]?.emoji || "😊";
                const langIcon = LANGUAGES.find(l => l.code === s.language)?.flag || "🇺🇸";

                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      setActiveSessionId(s.id);
                      setSettings(prev => ({
                        ...prev,
                        language: s.language || prev.language,
                        persona: s.persona || prev.persona
                      }));
                    }}
                    className={`group w-full p-3 rounded-xl border text-left flex items-start gap-3 transition-colors ${
                      isActive
                        ? "glass-card border-indigo-500/30 text-white"
                        : "bg-transparent border-transparent hover:bg-white/5 text-slate-300"
                    }`}
                  >
                    <MessageSquare className={`w-4 h-4 shrink-0 mt-1 ${isActive ? "text-indigo-400" : "text-slate-500"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate leading-tight pr-1">
                        {s.title}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className="text-[10px] px-1 py-0.2 bg-white/5 border border-white/10 rounded text-slate-300 font-mono">
                          {personaIcon} {PERSONAS[s.persona]?.name.split(" ")[0]}
                        </span>
                        <span className="text-[10px] px-1 py-0.2 bg-white/5 border border-white/10 rounded text-slate-300 font-mono">
                          {langIcon} {s.language.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    
                    <button
                      onClick={(e) => deleteSession(e, s.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-800/80 hover:text-rose-400 text-slate-500 transition shrink-0"
                      title="Delete Chat"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </button>
                );
              })}
            </div>

            <div className="pt-3 border-t border-white/10 flex flex-col gap-2 shrink-0">
              <button
                onClick={clearAllHistory}
                className="w-full py-2.5 rounded-lg text-xs font-semibold text-rose-400 glass-card bg-rose-500/10 border-rose-500/25 hover:bg-rose-500/20 transition flex items-center justify-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset Application Storage</span>
              </button>
            </div>
          </div>
        </div>

        {/* MAIN CONVERSATION DISPLAY WRAPPER */}
        <div className="flex-1 flex flex-col overflow-hidden bg-transparent relative">
          
          {/* Quick Persona Swap Bar - Horizontal list */}
          <div className="px-4 py-2 bg-white/5 border-b border-white/5 flex items-center justify-between z-10 shrink-0 gap-3 overflow-x-auto select-none">
            <span className="text-[10px] font-bold font-mono text-slate-400 uppercase flex items-center gap-1 shrink-0">
              <SlidersHorizontal className="w-3 text-indigo-400" /> Quick Tone Selection:
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-1">
              {Object.values(PERSONAS).map(p => {
                const isSelected = settings.persona === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => updateSettings("persona", p.id)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold compromise transit transition border whitespace-nowrap ${
                      isSelected
                        ? "glass-card border-indigo-400 text-indigo-300"
                        : "glass-card border-white/5 hover:border-white/10 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <span>{p.emoji}</span>
                    <span>{p.name.split(" ")[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* CHAT CHRONICLE LIST */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
            {currentSessionObj?.messages.map((m, index) => {
              const isAssistant = m.role === "model";
              const personaConfig = PERSONAS[currentSessionObj.persona] || PERSONAS.friendly;

              return (
                <div
                  key={m.id}
                  className={`flex flex-col max-w-4xl animate-slide-up ${
                    isAssistant ? "mr-auto w-full items-start" : "ml-auto w-full md:w-3/4 items-end"
                  }`}
                >
                  {/* Speaker indicator row */}
                  <div className="flex items-center gap-2 mb-1 text-[11px] font-mono text-slate-400 px-1">
                    {isAssistant ? (
                      <>
                        <span className={`w-2 h-2 rounded-full ${isSpeaking ? "bg-emerald-500 animate-pulse" : "bg-teal-500"}`} />
                        <span className="font-bold text-teal-400">
                          {personaConfig.emoji} Intellichat ({personaConfig.name})
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-cyan-400">👤 You</span>
                      </>
                    )}
                    <span className="text-slate-600">·</span>
                    <span>{m.timestamp}</span>

                    {/* Audio output trigger for Assistant responses */}
                    {isAssistant && !m.isError && (
                      <button
                        onClick={() => toggleSpeak(m.content)}
                        className={`ml-3 p-1 rounded hover:bg-slate-800 transition ${
                          isSpeaking ? "text-emerald-400" : "text-slate-500 hover:text-slate-300"
                        }`}
                        title="Read aloud response (Text-to-Speech)"
                      >
                        {isSpeaking ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>

                  {/* Bubble content */}
                  <div className={`p-4 rounded-xl text-sm shadow-md leading-relaxed relative ${
                    isAssistant ? "glass-card border-l-2 border-l-indigo-400" : "glass-card-user"
                  } ${
                    isAssistant ? "rounded-tl-none" : "rounded-tr-none"
                  } ${
                    settings.textSize === "sm" ? "text-xs" : settings.textSize === "lg" ? "text-base" : "text-sm"
                  }`}>
                    {/* Render helper text parsed dynamically with alert blocks */}
                    <HighlightParser text={m.content} />
                    
                    {/* If suggestions exist on the message AND it's the latest model message or last assistant message, render inline picker */}
                    {isAssistant && m.suggestions && m.suggestions.length > 0 && index === currentSessionObj.messages.length - 1 && (
                      <div className="mt-5 border-t border-white/10 pt-4">
                        <span className="text-[10px] font-bold font-mono tracking-wider text-slate-400 uppercase block mb-2.5">
                          💡 Explored Next Steps (Proactive Suggestions):
                        </span>
                        <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                          {m.suggestions.map((suggestion, sIdx) => (
                            <button
                              key={sIdx}
                              onClick={() => handleSuggestClick(suggestion)}
                              className="px-3 py-1.5 text-xs text-left font-medium rounded-lg glass-card hover:border-white/20 hover:bg-white/10 hover:text-white transition flex items-center gap-1.5 group select-none cursor-pointer"
                            >
                              <ChevronRight className="w-3 h-3 text-emerald-400 font-bold shrink-0 duration-150 group-hover:translate-x-0.5" />
                              <span>{suggestion}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* ERROR CARD ALERT */}
            {errorNotice && (
              <div className="max-w-2xl glass-card-warning rounded-xl p-4 flex gap-3 text-sm text-rose-100 mt-2">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-rose-300 font-display">Intellichat Engine Interrupted</h4>
                  <p className="mt-1 font-mono text-xs leading-normal">{errorNotice}</p>
                </div>
              </div>
            )}

            {/* CHAT LOADING STATE (With educational trivia rotation!) */}
            {loading && (
              <div className="flex flex-col mr-auto max-w-xl animate-pulse space-y-2 mt-4">
                <div className="flex items-center gap-2 mb-1 text-[11px] font-mono text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping" />
                  <span>Intellichat is formulating an answer...</span>
                </div>
                
                <div className="p-4 rounded-xl glass-card border-dashed flex flex-col gap-3">
                  {/* Pulse visual bars */}
                  <div className="space-y-2">
                    <div className="h-4 bg-white/5 rounded w-1/3"></div>
                    <div className="h-3 bg-white/5 rounded w-5/6"></div>
                    <div className="h-3 bg-white/5 rounded w-4/5"></div>
                  </div>

                  {/* Rotating Trivia insight block */}
                  <div className="mt-3 pt-3 border-t border-white/10 border-dashed text-xs text-slate-300 font-sans flex items-start gap-2 bg-indigo-500/5 p-3 rounded-xl border">
                    <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-indigo-300 block font-semibold mb-0.5 font-display">Did You Know? (Knowledge Insight)</strong>
                      <span className="italic">"{LOADING_TRIVIA[triviaIndex]}"</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* INPUT FORM SECTION */}
          <div className="p-4 border-t border-white/10 bg-transparent shrink-0 select-none">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(inputMessage);
              }}
              className="max-w-4xl mx-auto flex items-end gap-2.5 glass-panel rounded-2xl p-2.5 shadow-xl focus-within:border-indigo-500/40 focus-within:ring-2 focus-within:ring-indigo-500/10 transition"
            >
              {/* Mic Icon for Speech typing */}
              <button
                type="button"
                onClick={toggleListening}
                className={`p-2 rounded-lg border transition ${
                  isListening
                    ? "bg-rose-500 border-rose-600 text-white animate-pulse"
                    : "glass-card text-slate-300 hover:text-slate-100"
                }`}
                title={isListening ? "Listening... Click to stop voice typing" : "Speak to Intellichat (Speech-to-Text)"}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={isListening ? "Listening... speak now." : "Type a message or click suggested explore prompts to begin..."}
                className="flex-1 bg-transparent border-0 outline-none focus:ring-0 text-sm py-1.5 resize-none h-10 max-h-32 text-slate-100 placeholder-slate-500 px-2"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(inputMessage);
                  }
                }}
              />

              <button
                type="submit"
                disabled={!inputMessage.trim() || loading}
                className={`p-2.5 rounded-lg font-semibold transition shrink-0 shadow-lg ${
                  inputMessage.trim() && !loading
                    ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20 pointer-events-auto select-none cursor-pointer"
                    : "glass-card text-slate-500 pointer-events-none"
                }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            <span className="text-[10px] text-center block mt-2 text-slate-500 font-mono">
              ⚡ Intellichat remembers state over multi-turns. Backed safely by server proxy. Output is formatted with rich color blocks.
            </span>
          </div>

        </div>

        {/* INSIGHTS KNOWLEDGE EXPANSION PANEL - Collapsible side column */}
        {currentInsights.length > 0 && (
          <div className="hidden xl:flex w-[260px] shrink-0 border-l border-white/10 glass-panel p-4 flex-col gap-3 overflow-hidden select-none animate-slide-up">
            <span className="text-[10px] font-bold font-mono tracking-wider text-indigo-400 uppercase flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" /> Conversational Insights
            </span>
            <p className="text-[11px] text-slate-400 leading-normal font-sans">
              These are parsed knowledge expansions derived from topics explained inside your query:
            </p>

            <div className="flex-1 overflow-y-auto space-y-3 mt-2 pr-1">
              {currentInsights.map((insight, idx) => (
                <div
                  key={idx}
                  className="glass-card p-3 rounded-2xl text-xs leading-relaxed text-slate-300 flex items-start gap-2"
                >
                  <span className="text-indigo-400 font-bold font-mono">#</span>
                  <span>{insight}</span>
                </div>
              ))}
            </div>

            <div className="bg-indigo-500/5 border border-indigo-500/10 p-3.5 rounded-2xl text-[11px] text-slate-400 mt-auto">
              <span className="font-semibold text-indigo-300 font-display block mb-1">💡 Interactive Pro-Tip</span>
              Change the Persona settings to see the variety of insights, code details, or metaphors Intellichat expands on!
            </div>
          </div>
        )}

      </div>

      {/* SETTINGS DIALOG / MODAL PANEL */}
      {showSettings && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col animate-slide-up">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold font-display text-slate-100">
                  Intellichat Parameters
                </h3>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="p-1.5 px-2 rounded-lg glass-card text-slate-400 hover:text-slate-100 font-semibold"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal content */}
            <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
              
              {/* Persona Selection */}
              <div>
                <label className="text-xs font-bold font-mono uppercase text-slate-400 block mb-2">
                  1. Assistant Persona (Tone & Style)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {Object.values(PERSONAS).map(p => {
                    const isSelected = settings.persona === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => updateSettings("persona", p.id)}
                        className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition ${
                          isSelected
                            ? "glass-card border-indigo-500/50 text-white"
                            : "bg-white/5 border-transparent hover:bg-white/10 text-slate-300"
                        }`}
                      >
                        <span className="text-xl mt-0.5">{p.emoji}</span>
                        <div>
                          <p className={`text-xs font-bold ${isSelected ? "text-indigo-450 text-indigo-300" : "text-slate-200"}`}>
                            {p.name}
                          </p>
                          <p className="text-[10px] text-slate-400 leading-normal mt-0.5">
                            {p.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Language Selection */}
              <div>
                <label className="text-xs font-bold font-mono uppercase text-slate-400 block mb-2">
                  2. Conversations Language Output
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {LANGUAGES.map(l => {
                    const isSelected = settings.language === l.code;
                    return (
                      <button
                        key={l.code}
                        onClick={() => updateSettings("language", l.code)}
                        className={`p-2.5 rounded-lg border text-center transition flex flex-col items-center gap-1 ${
                          isSelected
                            ? "glass-card border-indigo-400 text-indigo-300"
                            : "bg-white/5 border-transparent hover:border-white/10 hover:bg-white/5 text-slate-300"
                        }`}
                      >
                        <span className="text-lg">{l.flag}</span>
                        <span className="text-[10px] font-semibold block leading-tight">
                          {l.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Layout Accessibility */}
              <div className="border-t border-white/10 pt-4">
                <label className="text-xs font-bold font-mono uppercase text-slate-400 block mb-3">
                  3. System Accessibility & Aesthetics
                </label>
                
                <div className="grid grid-cols-2 gap-4">
                  
                  {/* High Contrast */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-slate-300 block">Contrast Adjust</span>
                    <button
                      onClick={() => updateSettings("highContrast", !settings.highContrast)}
                      className={`w-full py-2 px-3 rounded-lg border text-xs font-semibold select-none cursor-pointer text-center ${
                        settings.highContrast
                          ? "bg-amber-500/15 border-amber-500/50 text-amber-300"
                          : "glass-card border-white/10 text-slate-400"
                      }`}
                    >
                      {settings.highContrast ? "♿ High Contrast Enabled" : "Standard Contrast"}
                    </button>
                  </div>

                  {/* Text Size */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-slate-300 block">Text Font Size</span>
                    <div className="flex rounded-lg overflow-hidden border border-white/10 bg-black/25 text-xs">
                      {(["sm", "base", "lg"] as const).map(sz => {
                        const isSelected = settings.textSize === sz;
                        return (
                          <button
                            key={sz}
                            onClick={() => updateSettings("textSize", sz)}
                            className={`flex-1 py-1.5 font-mono uppercase text-[10px] font-bold ${
                              isSelected
                                ? "bg-indigo-650 bg-indigo-600 text-white"
                                : "text-slate-400 hover:text-slate-200"
                            }`}
                          >
                            {sz}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-black/30 border-t border-white/10 flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  // Re-verify initial settings
                  setShowSettings(false);
                }}
                className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-500/20"
              >
                Apply Parameters
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
