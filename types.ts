
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
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: Date;
}

export interface UserInfo {
  email: string;
  name: string;
}

export type ThemeColor = 'blue' | 'indigo' | 'rose' | 'emerald' | 'amber' | 'violet';
export type AppearanceMode = 'light' | 'dark';

export interface ChatState {
  sessions: ChatSession[];
  activeSessionId: string | null;
  isLoading: boolean;
  error: string | null;
  user: UserInfo | null;
  theme: ThemeColor;
  appearance: AppearanceMode;
}
