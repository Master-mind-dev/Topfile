import { NoteItem, UploadedImageItem, LinkItem, UserProfile } from '../types';

export const initialUserProfile: UserProfile = {
  name: 'Mohammed Dastagir',
  email: 'rmohammed7dastagir@gmail.com',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  joinedDate: 'August 2026',
  plan: 'Personal Pro',
  storageUsedMb: 14.8,
  totalStorageMb: 1024,
};

export const initialNotes: NoteItem[] = [
  {
    id: 'note-1',
    title: 'Product Design & Branding Goals',
    content: '1. Maintain a clean pure black & white aesthetic.\n2. Ensure smooth tab transitions for Home, Notes, Uploads, Camera, and Links.\n3. Integrate link metadata scraper for seamless YouTube and web embeds.',
    category: 'Work',
    colorTag: '#ef4444',
    isPinned: true,
    createdAt: '2026-08-22T09:30:00Z',
    updatedAt: '2026-08-23T10:15:00Z',
  },
  {
    id: 'note-2',
    title: 'Camera Snapshot Quick Guide',
    content: 'Open the Scan/Camera section to capture live photos using your device camera. Snaps are automatically formatted and saved into your Uploads gallery with metadata.',
    category: 'Ideas',
    colorTag: '#3b82f6',
    isPinned: true,
    createdAt: '2026-08-21T14:20:00Z',
    updatedAt: '2026-08-21T14:20:00Z',
  },
  {
    id: 'note-3',
    title: 'Weekly Task Checklist',
    content: '• Review architecture diagrams\n• Verify camera framing responsiveness on mobile\n• Test video link parsing for shorts and regular videos\n• Sync account preferences',
    category: 'Personal',
    colorTag: '#10b981',
    isPinned: false,
    createdAt: '2026-08-20T11:00:00Z',
    updatedAt: '2026-08-22T16:45:00Z',
  },
  {
    id: 'note-4',
    title: 'Architecture & Server Engine',
    content: 'Full-stack Express engine configured with Cheerio and Axios to parse OpenGraph titles, descriptions, and thumbnails directly in real time.',
    category: 'Work',
    colorTag: '#8b5cf6',
    isPinned: false,
    createdAt: '2026-08-19T08:15:00Z',
    updatedAt: '2026-08-19T08:15:00Z',
  },
];

export const initialImages: UploadedImageItem[] = [
  {
    id: 'img-1',
    name: 'architecture_diagram.png',
    dataUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    fileSize: '1.4 MB',
    dimensions: '1920 x 1080',
    source: 'upload',
    createdAt: '2026-08-22T15:30:00Z',
    notes: 'Abstract modern minimal visual concept',
  },
  {
    id: 'img-2',
    name: 'camera_capture_01.jpg',
    dataUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80',
    fileSize: '840 KB',
    dimensions: '1280 x 720',
    source: 'camera',
    createdAt: '2026-08-23T09:45:00Z',
    notes: 'Captured via on-spot camera tool',
  },
  {
    id: 'img-3',
    name: 'workspace_concept.png',
    dataUrl: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&auto=format&fit=crop&q=80',
    fileSize: '2.1 MB',
    dimensions: '2560 x 1440',
    source: 'upload',
    createdAt: '2026-08-21T18:10:00Z',
    notes: 'Minimal dark space layout wireframe',
  }
];

export const initialLinks: LinkItem[] = [
  {
    id: 'link-1',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    title: 'Never Gonna Give You Up - Official Music Video',
    description: 'The official music video for Rick Astley - Never Gonna Give You Up. A landmark visual production.',
    embedThumb: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    linkHost: 'youtube.com',
    embedProvider: 'youtube',
    embedId: 'dQw4w9WgXcQ',
    isPlayable: true,
    createdAt: '2026-08-23T10:00:00Z',
  },
  {
    id: 'link-2',
    url: 'https://www.youtube.com/watch?v=LXb3EKWsInQ',
    title: 'COSTA RICA IN 4K 60fps HDR (ULTRA HD)',
    description: 'Relaxing cinematic nature footage captured across Costa Rica rainforests and beaches in ultra high definition.',
    embedThumb: 'https://img.youtube.com/vi/LXb3EKWsInQ/hqdefault.jpg',
    linkHost: 'youtube.com',
    embedProvider: 'youtube',
    embedId: 'LXb3EKWsInQ',
    isPlayable: true,
    createdAt: '2026-08-22T14:15:00Z',
  },
  {
    id: 'link-3',
    url: 'https://www.youtube.com/watch?v=21X5lGlDOfg',
    title: 'NASA | Earth from Orbit - 4K Time-Lapse Views',
    description: 'Stunning 4K footage of Earth as seen from the International Space Station passing over day and night hemispheres.',
    embedThumb: 'https://img.youtube.com/vi/21X5lGlDOfg/hqdefault.jpg',
    linkHost: 'youtube.com',
    embedProvider: 'youtube',
    embedId: '21X5lGlDOfg',
    isPlayable: true,
    createdAt: '2026-08-21T08:45:00Z',
  }
];
