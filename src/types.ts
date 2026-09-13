export type TabType = 'home' | 'notes' | 'upload' | 'scan' | 'links';

export interface UserProfile {
  name: string;
  email: string;
  avatarUrl?: string;
  joinedDate: string;
  plan: string;
  storageUsedMb: number;
  totalStorageMb: number;
}

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  category: 'General' | 'Work' | 'Personal' | 'Ideas' | 'Urgent';
  colorTag: string;
  isPinned?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UploadedImageItem {
  id: string;
  name: string;
  dataUrl: string;
  fileSize: string;
  dimensions?: string;
  source: 'upload' | 'camera';
  createdAt: string;
  notes?: string;
}

export interface LinkItem {
  id: string;
  url: string;
  title: string;
  description: string;
  embedThumb: string;
  linkHost: string;
  embedProvider: string; // 'youtube' | 'vimeo' | 'dailymotion' | 'native_video' | 'generic'
  embedId: string | null;
  isPlayable: boolean;
  createdAt: string;
}
