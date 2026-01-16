
export interface Note {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  createdAt: number;
  lastModified: number;
  color?: string;
}

export interface UserProfile {
  name: string;
  avatar: string | null;
}

export enum SortOption {
  CREATED_DESC = 'Created (Newest)',
  CREATED_ASC = 'Created (Oldest)',
  MODIFIED_DESC = 'Modified (Recent)',
  TITLE_ASC = 'A-Z',
}

export type ViewState = 'list' | 'editor' | 'profile' | 'settings';

export const COLORS = [
  'bg-white',
  'bg-red-50',
  'bg-blue-50',
  'bg-green-50',
  'bg-yellow-50',
  'bg-purple-50',
  'bg-pink-50'
];
