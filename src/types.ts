export type MusicProvider = 'youtube_music';

export interface NewPipeExtractorInfo {
  codec: string;
  bitrate: string;
  format: string;
  extractorVersion: string;
  isExtracted: boolean;
  viewCount?: string;
  uploader?: string;
  streamQuality?: string;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  genre: string;
  duration: string;
  durationSeconds: number;
  coverUrl: string;
  youtubeId: string;
  youtubeMusicUrl: string;
  audioUrl?: string;
  extractorInfo?: NewPipeExtractorInfo;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  coverUrl: string;
  tracks: Track[];
  providerLinks?: {
    youtube_music?: string;
  };
}

export type AssistantState = 'idle' | 'listening_wake' | 'active_listening' | 'processing' | 'speaking';

export interface VoiceLog {
  id: string;
  timestamp: string;
  type: 'wake' | 'command' | 'reply' | 'error';
  text: string;
  actionExecuted?: string;
}

export interface AssistantResponse {
  action: 'play' | 'pause' | 'next' | 'previous' | 'volume_up' | 'volume_down' | 'mute' | 'search_play' | 'chat';
  query?: string;
  buddyReply: string;
  suggestedTracks?: Array<{
    title: string;
    artist: string;
    genre: string;
  }>;
}
