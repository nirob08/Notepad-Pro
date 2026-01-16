
import { Note, UserProfile } from '../types';

const STORAGE_KEY = 'notepad_pro_notes';
const PROFILE_KEY = 'notepad_pro_profile';

export const saveNotes = (notes: Note[]): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
};

export const loadNotes = (): Note[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error('Failed to parse notes from storage', e);
    return [];
  }
};

export const saveProfile = (profile: UserProfile): void => {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
};

export const loadProfile = (): UserProfile => {
  const data = localStorage.getItem(PROFILE_KEY);
  if (!data) return { name: 'Guest', avatar: null };
  try {
    return JSON.parse(data);
  } catch (e) {
    return { name: 'Guest', avatar: null };
  }
};
