
# Notepad Pro - Mobile Web Application

A professional, offline-first notepad application built with React, TypeScript, and Tailwind CSS. It mimics the behavior and aesthetics of premium native mobile apps like Google Keep and Apple Notes.

## Key Features
- **Offline Storage**: Uses `localStorage` for data persistence.
- **Auto-Save**: Updates the local database instantly as you type.
- **Search & Filter**: Find notes by title or body text in real-time.
- **Pinning**: Keep important notes anchored at the top of your list.
- **Sorting Options**: Sort by modification date, creation date, or alphabetically.
- **Dark Mode**: High-contrast dark theme support.
- **Responsive Design**: Optimized for mobile, tablet, and desktop viewports.

## How to Run
1. Ensure you have Node.js installed.
2. The app is a standalone React SPA. 
3. Open `index.html` in your browser (via a development server like Vite or similar).

## Architecture (Simulated MVVM)
- **Model**: `types.ts` defines the data structures.
- **View**: React components (`ListView`, `EditorView`, `NoteCard`).
- **ViewModel/Service**: State management in `App.tsx` and storage utilities in `utils/storage.ts`.
- **Database Layer**: `localStorage` serves as the persistent local store (similar to Room in Android).
