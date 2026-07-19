
export type Role = 'user' | 'model';

export interface GroundingChunk {
  web?: {
    uri?: string;
    title?: string;
  };
}

export interface Message {
  id: string;
  role: Role;
  text: string;
  timestamp: Date;
  sources?: GroundingChunk[];
  imageUrl?: string;
  videoUrl?: string;
  isDeep?: boolean;
  grounded?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: Date;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  isPro?: boolean;
  interests?: string[];
  bio?: string;
  phone?: string;
  lastLogin?: Date;
  updatedAt?: Date;
  isOnline?: boolean;
  lastActive?: Date;
}

export type ThemeColor = 'blue' | 'indigo' | 'rose' | 'emerald' | 'amber' | 'violet';
export type AppearanceMode = 'light' | 'dark';
export type Language = 'tr' | 'en' | 'es' | 'de' | 'fr' | 'it' | 'ru';

export interface ChatState {
  sessions: ChatSession[];
  activeSessionId: string | null;
  isLoading: boolean;
  error: string | null;
  user: UserProfile | null;
  theme: ThemeColor;
  appearance: AppearanceMode;
}
