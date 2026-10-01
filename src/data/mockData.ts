import { NoteItem, UploadedImageItem, LinkItem, UserProfile } from '../types';

export const initialUserProfile: UserProfile = {
  name: '',
  email: '',
  avatarUrl: '',
  joinedDate: '',
  plan: 'Personal Pro',
  storageUsedMb: 0,
  totalStorageMb: 5 * 1024,
};

// Start with NO mock data so counts are always real/accurate
export const initialNotes: NoteItem[] = [];
export const initialImages: UploadedImageItem[] = [];
export const initialLinks: LinkItem[] = [];
