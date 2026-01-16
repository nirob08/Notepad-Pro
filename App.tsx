
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Search, Settings, ArrowLeft, Pin, Trash2, Share2, MoreVertical, Check, SortDesc, PinOff, User, Camera, Download, Upload, AlertTriangle } from 'lucide-react';
import { Note, SortOption, ViewState, COLORS, UserProfile } from './types';
import { loadNotes, saveNotes, loadProfile, saveProfile } from './utils/storage';
import { format } from 'date-fns';

const App: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [profile, setProfile] = useState<UserProfile>({ name: 'Guest', avatar: null });
  const [viewState, setViewState] = useState<ViewState>('list');
  const [currentNoteId, setCurrentNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>(SortOption.MODIFIED_DESC);

  // Initialize
  useEffect(() => {
    setNotes(loadNotes());
    const savedProfile = loadProfile();
    if (!savedProfile.name || savedProfile.name.trim() === '') savedProfile.name = 'Guest User';
    setProfile(savedProfile);
  }, []);

  // Sync to Storage
  useEffect(() => {
    if (notes.length > 0 || localStorage.getItem('notepad_pro_notes')) {
        saveNotes(notes);
    }
  }, [notes]);

  useEffect(() => {
    saveProfile(profile);
  }, [profile]);

  const currentNote = useMemo(() => 
    notes.find(n => n.id === currentNoteId), 
    [notes, currentNoteId]
  );

  const filteredNotes = useMemo(() => {
    let result = notes.filter(n => 
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      n.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    result.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      switch (sortBy) {
        case SortOption.CREATED_DESC: return b.createdAt - a.createdAt;
        case SortOption.CREATED_ASC: return a.createdAt - b.createdAt;
        case SortOption.MODIFIED_DESC: return b.lastModified - a.lastModified;
        case SortOption.TITLE_ASC: return a.title.localeCompare(b.title);
        default: return 0;
      }
    });

    return result;
  }, [notes, searchQuery, sortBy]);

  const handleCreateNote = () => {
    const newNote: Note = {
      id: crypto.randomUUID(),
      title: '',
      content: '',
      isPinned: false,
      createdAt: Date.now(),
      lastModified: Date.now(),
      color: COLORS[0],
    };
    setNotes([newNote, ...notes]);
    setCurrentNoteId(newNote.id);
    setViewState('editor');
  };

  const handleUpdateNote = (updates: Partial<Note>) => {
    if (!currentNoteId) return;
    setNotes(prev => prev.map(n => 
      n.id === currentNoteId ? { ...n, ...updates, lastModified: Date.now() } : n
    ));
  };

  const handleDeleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    setViewState('list');
    setCurrentNoteId(null);
  };

  const handleTogglePin = (id: string) => {
    setNotes(prev => prev.map(n => 
      n.id === id ? { ...n, isPinned: !n.isPinned } : n
    ));
  };

  const handleShare = (note: Note) => {
    if (navigator.share) {
      navigator.share({
        title: note.title || 'Untitled Note',
        text: note.content,
      }).catch(console.error);
    } else {
      alert('Content copied to clipboard.');
      navigator.clipboard.writeText(`${note.title}\n\n${note.content}`);
    }
  };

  const handleClearAll = () => {
    const isConfirmed = window.confirm("Are you sure? This will delete ALL your notes and reset your profile. This action cannot be undone!");
    
    if (isConfirmed) {
      // 1. Clear Local Storage specifically
      localStorage.removeItem('notepad_pro_notes');
      localStorage.removeItem('notepad_pro_profile');
      
      // 2. Reset State
      setNotes([]);
      setProfile({ name: 'Guest User', avatar: null });
      
      // 3. Navigate back
      setViewState('list');
      setCurrentNoteId(null);
      
      window.alert("System Reset Complete. All data has been cleared.");
    }
  };

  const handleExport = () => {
    if (notes.length === 0) {
      alert("No notes to export!");
      return;
    }
    const data = JSON.stringify(notes, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `notes_backup_${format(new Date(), 'yyyy_MM_dd')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const importedNotes = JSON.parse(event.target?.result as string);
          if (Array.isArray(importedNotes)) {
            setNotes(prev => [...importedNotes, ...prev]);
            alert("Notes imported successfully!");
          } else {
            alert("Invalid backup format.");
          }
        } catch (err) {
          alert("Could not read backup file.");
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100">
      {viewState === 'list' && (
        <ListView 
          notes={filteredNotes}
          profile={profile}
          onNoteClick={(id) => { setCurrentNoteId(id); setViewState('editor'); }}
          onTogglePin={handleTogglePin}
          onProfileClick={() => setViewState('profile')}
          onSettingsClick={() => setViewState('settings')}
          onCreate={handleCreateNote}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          sortBy={sortBy}
          setSortBy={setSortBy}
        />
      )}
      {viewState === 'editor' && (
        <EditorView 
          note={currentNote}
          onUpdate={handleUpdateNote}
          onBack={() => setViewState('list')}
          onDelete={() => handleDeleteNote(currentNoteId!)}
          onShare={() => handleShare(currentNote!)}
          onTogglePin={() => handleTogglePin(currentNoteId!)}
        />
      )}
      {viewState === 'profile' && (
        <ProfileView 
          profile={profile}
          setProfile={setProfile}
          onBack={() => setViewState('list')}
        />
      )}
      {viewState === 'settings' && (
        <SettingsView 
          onBack={() => setViewState('list')}
          onExport={handleExport}
          onImport={handleImport}
          onClearAll={handleClearAll}
        />
      )}
    </div>
  );
};

// --- ListView Sub-Component ---

interface ListViewProps {
  notes: Note[];
  profile: UserProfile;
  onNoteClick: (id: string) => void;
  onTogglePin: (id: string) => void;
  onProfileClick: () => void;
  onSettingsClick: () => void;
  onCreate: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  sortBy: SortOption;
  setSortBy: (s: SortOption) => void;
}

const ListView: React.FC<ListViewProps> = ({ 
  notes, profile, onNoteClick, onTogglePin, onProfileClick, onSettingsClick, onCreate, 
  searchQuery, setSearchQuery, sortBy, setSortBy 
}) => {
  const [showSortMenu, setShowSortMenu] = useState(false);

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto overflow-hidden">
      <header className="px-6 pt-10 pb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={onProfileClick}
            className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-800 border-2 border-slate-700 shadow-sm flex items-center justify-center transition-transform active:scale-95"
          >
            {profile.avatar ? (
              <img src={profile.avatar} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User size={24} className="text-blue-500" />
            )}
          </button>
          <div className="flex flex-col">
            <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest leading-none">My Workspace</p>
            <h1 className="text-2xl font-black tracking-tight text-white leading-none mt-1">
              {profile.name}
            </h1>
          </div>
        </div>
        <div className="flex gap-2">
            <button 
              onClick={onSettingsClick}
              className="p-3 bg-slate-800/50 rounded-2xl border border-slate-700 hover:bg-slate-800 transition-colors"
              title="Settings"
            >
                <Settings size={20} className="text-slate-400" />
            </button>
        </div>
      </header>

      <div className="px-6 mb-6">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={20} />
          <input 
            type="text"
            placeholder="Search your notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800/50 backdrop-blur-md pl-12 pr-4 py-4 rounded-2xl shadow-sm border border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all text-white placeholder:text-slate-500 font-bold"
          />
        </div>
      </div>

      <div className="px-6 pb-3 flex items-center justify-between text-[11px] text-slate-400 font-black uppercase tracking-[0.1em]">
        <span>{notes.length} {notes.length === 1 ? 'Note' : 'Notes'}</span>
        <div className="relative">
          <button 
            onClick={() => setShowSortMenu(!showSortMenu)}
            className="flex items-center gap-1.5 bg-slate-800 px-4 py-2 rounded-full shadow-sm border border-slate-700 hover:border-blue-600 transition-colors text-white"
          >
            <SortDesc size={14} />
            {sortBy}
          </button>
          
          {showSortMenu && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 z-50 py-2 overflow-hidden ring-1 ring-black/20">
              {Object.values(SortOption).map(option => (
                <button
                  key={option}
                  onClick={() => { setSortBy(option); setShowSortMenu(false); }}
                  className={`w-full text-left px-4 py-3.5 hover:bg-slate-700 flex items-center justify-between text-sm transition-colors ${sortBy === option ? 'text-blue-400 font-black' : 'text-slate-300'}`}
                >
                  {option}
                  {sortBy === option && <Check size={18} strokeWidth={3} />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pt-2 pb-28 custom-scrollbar">
        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-24 h-24 bg-slate-800/50 rounded-[2rem] flex items-center justify-center mb-6 shadow-sm border border-slate-800">
                <Plus size={48} className="text-slate-700" strokeWidth={1.5} />
            </div>
            <p className="text-2xl font-black text-slate-500">Capture an idea</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {notes.map(note => (
              <NoteCard 
                key={note.id} 
                note={note} 
                onClick={() => onNoteClick(note.id)} 
              />
            ))}
          </div>
        )}
      </div>

      <button 
        onClick={onCreate}
        className="fixed bottom-10 right-8 w-16 h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-[1.8rem] shadow-2xl shadow-blue-600/30 flex items-center justify-center transition-all hover:scale-110 active:scale-90 z-40"
      >
        <Plus size={36} strokeWidth={3} />
      </button>
    </div>
  );
};

const NoteCard: React.FC<{ note: Note, onClick: () => void }> = ({ note, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="p-6 rounded-[1.5rem] border-2 border-slate-800 cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1 bg-slate-800/40 backdrop-blur-sm shadow-sm hover:border-blue-600 relative group"
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-black text-xl truncate pr-8 text-slate-50 leading-tight">
          {note.title || <span className="text-slate-600 font-bold italic">Untitled</span>}
        </h3>
        {note.isPinned && (
          <Pin size={18} className="text-blue-500 fill-blue-500 absolute top-6 right-6" />
        )}
      </div>
      <p className="text-slate-400 text-sm line-clamp-3 mb-5 leading-relaxed font-bold">
        {note.content || <span className="text-slate-600 italic font-normal">No details provided...</span>}
      </p>
      <div className="flex items-center gap-2 pt-3 border-t-2 border-slate-700/50">
         <div className="w-2 h-2 rounded-full bg-blue-500"></div>
         <div className="text-[11px] text-slate-500 font-black uppercase tracking-widest">
            {format(note.lastModified, 'MMM d, h:mm a')}
         </div>
      </div>
    </div>
  );
};

// --- SettingsView Sub-Component ---

interface SettingsViewProps {
  onBack: () => void;
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearAll: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ onBack, onExport, onImport, onClearAll }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto overflow-hidden bg-[#020617]">
      <nav className="p-6 flex items-center gap-6 border-b-2 border-slate-900/50">
        <button onClick={onBack} className="p-3 rounded-2xl hover:bg-slate-800 transition-all text-white">
          <ArrowLeft size={28} strokeWidth={2.5} />
        </button>
        <h2 className="text-2xl font-black text-white tracking-tight">Settings</h2>
      </nav>

      <div className="flex-1 p-8 space-y-6 overflow-y-auto custom-scrollbar">
        <div className="space-y-4">
          <h3 className="text-[11px] font-black text-blue-400 uppercase tracking-widest px-1">Data Management</h3>
          
          <button 
            onClick={onExport}
            className="w-full flex items-center gap-4 p-6 bg-slate-900/50 border-2 border-slate-800 rounded-3xl hover:bg-slate-800 transition-all text-left group"
          >
            <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500 group-hover:scale-110 transition-transform">
              <Download size={24} />
            </div>
            <div>
              <p className="font-black text-white">Backup Notes</p>
              <p className="text-xs text-slate-500 font-bold">Download all notes as a JSON file</p>
            </div>
          </button>

          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center gap-4 p-6 bg-slate-900/50 border-2 border-slate-800 rounded-3xl hover:bg-slate-800 transition-all text-left group"
          >
            <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500 group-hover:scale-110 transition-transform">
              <Upload size={24} />
            </div>
            <div>
              <p className="font-black text-white">Restore Backup</p>
              <p className="text-xs text-slate-500 font-bold">Import notes from a backup file</p>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="application/json" 
              onChange={onImport} 
            />
          </button>
        </div>

        <div className="space-y-4 pt-4">
          <h3 className="text-[11px] font-black text-red-500 uppercase tracking-widest px-1">Danger Zone</h3>
          
          <button 
            onClick={() => onClearAll()}
            className="w-full flex items-center gap-4 p-6 bg-red-500/5 border-2 border-red-500/20 rounded-3xl hover:bg-red-500/10 transition-all text-left group"
          >
            <div className="p-3 bg-red-500/10 rounded-2xl text-red-500 group-hover:scale-110 transition-transform">
              <AlertTriangle size={24} />
            </div>
            <div>
              <p className="font-black text-red-500">Clear All Data</p>
              <p className="text-xs text-red-500/60 font-bold">Permanently delete everything</p>
            </div>
          </button>
        </div>

        <div className="pt-10 text-center">
          <p className="text-[10px] text-slate-700 font-black uppercase tracking-widest">Notepad Pro v1.0.0</p>
          <p className="text-[10px] text-slate-800 mt-1">Design with ❤️ for Mobile Experience</p>
        </div>
      </div>
    </div>
  );
};

// --- EditorView Sub-Component ---

interface EditorViewProps {
  note?: Note;
  onUpdate: (updates: Partial<Note>) => void;
  onBack: () => void;
  onDelete: () => void;
  onShare: () => void;
  onTogglePin: () => void;
}

const EditorView: React.FC<EditorViewProps> = ({ note, onUpdate, onBack, onDelete, onShare, onTogglePin }) => {
  if (!note) return null;

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto overflow-hidden bg-[#020617]">
      <nav className="px-4 py-4 flex items-center justify-between border-b-2 border-slate-900/50">
        <button onClick={onBack} className="p-2.5 rounded-2xl hover:bg-slate-800 transition-all text-white">
          <ArrowLeft size={28} strokeWidth={2.5} />
        </button>
        <div className="flex items-center gap-2">
          <button 
            onClick={(e) => { e.stopPropagation(); onTogglePin(); }} 
            className={`p-3 rounded-2xl transition-all ${note.isPinned ? 'text-blue-500 bg-blue-500/10 shadow-inner' : 'text-slate-500 hover:bg-slate-800'}`}
          >
            {note.isPinned ? <Pin size={24} fill="currentColor" /> : <PinOff size={24} />}
          </button>
          <button onClick={onShare} className="p-3 rounded-2xl hover:bg-slate-800 transition-all text-slate-300">
            <Share2 size={24} />
          </button>
          <button onClick={onDelete} className="p-3 rounded-2xl hover:bg-red-500/10 transition-all text-red-500">
            <Trash2 size={24} />
          </button>
        </div>
      </nav>

      <div className="flex-1 flex flex-col p-8 space-y-8 overflow-y-auto custom-scrollbar">
        <input 
          type="text"
          placeholder="New Idea Title..."
          value={note.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          className="w-full text-4xl font-black bg-transparent border-none focus:outline-none placeholder:text-slate-800 text-white"
        />
        <div className="flex items-center gap-4 text-[11px] text-slate-500 font-black uppercase tracking-widest pb-6 border-b-2 border-slate-900/50">
          <span className="bg-slate-800 px-3 py-1 rounded-lg">Created {format(note.createdAt, 'MMM d, yyyy')}</span>
          <span className="text-blue-500 font-black">Latest Update {format(note.lastModified, 'h:mm a')}</span>
        </div>
        <textarea 
          placeholder="Start typing your story..."
          value={note.content}
          onChange={(e) => onUpdate({ content: e.target.value })}
          className="w-full flex-1 bg-transparent border-none focus:outline-none resize-none text-xl leading-relaxed placeholder:text-slate-800 min-h-[300px] text-slate-200 font-bold"
          autoFocus
        />
      </div>

      <div className="p-6 border-t-2 border-slate-900/50 flex items-center justify-around text-slate-400 bg-slate-900/40 backdrop-blur-2xl">
        <button className="w-12 h-12 flex items-center justify-center hover:bg-slate-800 rounded-2xl transition-all font-black text-xl hover:shadow-md">B</button>
        <button className="w-12 h-12 flex items-center justify-center hover:bg-slate-800 rounded-2xl transition-all italic text-xl hover:shadow-md">I</button>
        <button className="w-12 h-12 flex items-center justify-center hover:bg-slate-800 rounded-2xl transition-all underline text-xl hover:shadow-md">U</button>
        <button onClick={onBack} className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl transition-all text-sm font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-95">Save & Close</button>
      </div>
    </div>
  );
};

// --- ProfileView Sub-Component ---

interface ProfileViewProps {
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  onBack: () => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ profile, setProfile, onBack }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile(prev => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto overflow-hidden bg-[#020617]">
      <nav className="p-6 flex items-center gap-6 border-b-2 border-slate-900/50">
        <button onClick={onBack} className="p-3 rounded-2xl hover:bg-slate-800 transition-all text-white">
          <ArrowLeft size={28} strokeWidth={2.5} />
        </button>
        <h2 className="text-2xl font-black text-white tracking-tight">Identity Settings</h2>
      </nav>

      <div className="flex-1 p-8 flex flex-col items-center">
        <div className="relative mb-14">
          <div className="w-44 h-44 rounded-[2.5rem] overflow-hidden bg-slate-900 border-4 border-slate-800 shadow-2xl flex items-center justify-center transition-all hover:scale-105 duration-500">
            {profile.avatar ? (
              <img src={profile.avatar} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User size={100} className="text-blue-500/20" strokeWidth={1} />
            )}
          </div>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="absolute -bottom-4 -right-4 p-5 bg-blue-600 text-white rounded-[1.5rem] shadow-2xl hover:bg-blue-700 transition-all active:scale-90 border-4 border-[#020617]"
          >
            <Camera size={28} />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleImageUpload} 
          />
        </div>

        <div className="w-full space-y-10">
          <div className="space-y-4">
            <label className="block text-xs font-black text-blue-400 uppercase tracking-[0.2em] px-1">Display Name</label>
            <input 
              type="text"
              placeholder="Enter your name..."
              value={profile.name}
              onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
              className="w-full bg-slate-900/50 p-7 rounded-[1.5rem] border-2 border-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-600/10 text-white text-3xl font-black transition-all placeholder:text-slate-700 shadow-sm"
            />
          </div>
          
          <div className="p-8 bg-blue-900/20 rounded-[2rem] border-2 border-blue-900/30">
            <h4 className="text-lg font-black text-blue-300 mb-2 uppercase tracking-tight">Private & Encrypted</h4>
            <p className="text-sm text-blue-400/60 leading-relaxed font-bold">Your identity is stored locally. We never sync your data to the cloud. Your thoughts are yours alone.</p>
          </div>
        </div>

        <button 
          onClick={onBack}
          className="mt-auto w-full py-6 bg-white text-black rounded-[1.8rem] font-black text-xl shadow-[0_20px_40px_rgba(0,0,0,0.5)] transition-all active:scale-95"
        >
          Update Profile
        </button>
      </div>
    </div>
  );
};

export default App;
