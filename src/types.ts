export type PersonaType = 'friendly' | 'professional' | 'creative' | 'technical' | 'concise';

export interface Persona {
  id: PersonaType;
  name: string;
  emoji: string;
  description: string;
  tonePrompt: string;
  bgColor: string;
  textColor: string;
  accentColor: string;
}

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  suggestions?: string[];
  insights?: string[];
  isError?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  language: string; // language code
  persona: PersonaType;
  createdAt: string;
}

export interface AppSettings {
  language: string;
  persona: PersonaType;
  highContrast: boolean;
  textSize: 'sm' | 'base' | 'lg';
  theme: 'vibrant' | 'minimal' | 'dark';
}
