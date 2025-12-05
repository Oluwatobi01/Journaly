export type Mood = 'happy' | 'sad' | 'anxious' | 'excited' | 'tired' | 'neutral' | 'angry';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

export interface JournalEntry {
  id: string;
  date: Date; // ISO string
  summary: string;
  fullText: string;
  mood: Mood;
  messages: ChatMessage[];
}

export interface UserStats {
  streak: number;
  totalEntries: number;
  topMood: Mood;
}

export enum Screen {
  Onboarding = 'ONBOARDING',
  Home = 'HOME',
  Chat = 'CHAT',
  History = 'HISTORY',
  Insights = 'INSIGHTS',
  Settings = 'SETTINGS',
}

export interface ThemeColors {
    primary: string;
    purple: string;
    coral: string;
    background: string;
    surface: string;
}
