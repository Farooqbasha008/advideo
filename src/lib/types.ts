/**
 * Types for script and scene representation
 */

/**
 * ScriptScene represents a single scene in a video script
 */
export interface ScriptScene {
  sceneNumber: number;
  setting: string;
  textToVideoPrompt: string;
  voiceoverPrompt: string;
  backgroundMusicPrompt: string;
}

export interface Character {
  name: string;
  description: string;
  role: string;
  visualAppearance: string;
  personalityTraits: string[];
}

export interface VideoDetails {
  title: string;
  logline: string;
  style: string;
  duration: string;
  scriptSummary: string;
  scenes: ScriptScene[];
}

export type Message = {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectSummary {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  thumbnail?: string;
  duration?: number;
}

export interface ProjectDetails extends ProjectSummary {
  script: any;
  video?: string[];
  audio?: string[];
} 