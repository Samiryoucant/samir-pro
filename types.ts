export type Theme = 'pizza' | 'lemon' | 'dark';
export type Role = 'user' | 'admin';

export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string; // In a real app this is hashed, here we just store string for demo
  role: Role;
  isBanned: boolean;
  theme: Theme;
  createdAt: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  thumbnail: string;
  banner?: string;
  sampleImages: string[]; // URLs or Base64
  unlockAdsRequired: number;
  files: CourseFile[];
  createdAt: string;
}

export interface CourseFile {
  id: string;
  name: string;
  type: 'video' | 'pdf' | 'zip';
  size: string;
  url: string; // Placeholder URL or Blob URL
  data?: string; // For small files stored in localstorage (Base64)
  sourceType: 'link' | 'upload';
}

export interface BuyRequest {
  id: string;
  userId: string;
  courseId: string;
  screenshot: string; // Base64
  status: 'pending' | 'approved' | 'rejected';
  method: 'Bkash' | 'Nagad';
  createdAt: string;
}

export interface Purchase {
  id: string;
  userId: string;
  courseId: string;
  grantedAt: string;
  type: 'buy' | 'ad_unlock' | 'manual';
}

export interface AdWatch {
  userId: string;
  courseId: string;
  count: number;
  lastWatchedAt: string;
}

export interface DownloadRecord {
  id: string;
  userId: string;
  fileName: string;
  courseTitle: string;
  downloadedAt: string;
}

export interface AppState {
  currentUser: User | null;
  theme: Theme;
}

// Global declaration for Monetag SDK
declare global {
  interface Window {
    show_10231981: () => Promise<void>;
  }
}