import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { Eye, EyeOff, Grip, Loader2, Lock, Move, Plus, Save, StickyNote, Trash2, Unlock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  dragCurrentOverwolfWindow,
  hideNotesOverlay,
  NOTES_ACTION_STORAGE_KEY,
  NOTES_CREATE_EVENT,
  NOTES_TOGGLE_EVENT,
  resizeCurrentOverwolfWindow,
} from '@/lib/overwolfNotesRuntime';
import { useOverlayNotes } from '@/hooks/useOverlayNotes';

type OverlayDisplayMode = 'edit' | 'text';
type ResizeEdge = 'Left' | 'Right' | 'Top' | 'Bottom' | 'TopLeft' | 'TopRight' | 'BottomLeft' | 'BottomRight';

const DISPLAY_MODE_STORAGE_KEY = 'crmatlant-notes-display-mode';
const RESIZE_EDGES: ResizeEdge[] = ['Left', 'Right', 'Top', 'Bottom', 'TopLeft', 'TopRight', 'BottomLeft', 'BottomRight'];

const defaultNewNote = () => ({
  title: 'New note',
  content: '',
  position: { x: 0, y: 0 },
  size: { width: 520, height: 380 },
  opacity: 0.88,
  pinned: true,
});

const deriveTitle = (content: string) => {
  const firstLine = content.split('\n').find((line) => line.trim());
  return firstLine?.trim().slice(0, 120) || 'Untitled';
};

const NotesOverlay = () => {
  const {
    notes,
    selectedNote,
    selectedNoteId,
    isLoading,
    isSaving,
    error,
    setSelectedNoteId,
    createNote,
    updateNote,
    deleteNote,
  } = useOverlayNotes();
  const consumedActionRef = useRef<string | null>(sessionStorage.getItem('crmatlant-notes-last-action'));
  const [isBrowserOverlayVisible, setIsBrowserOverlayVisible] = useState(true);
  const [isListOpen, setIsListOpen] = useState(false);
  const [displayMode, setDisplayMode] = useState<OverlayDisplayMode>(() => {
    const stored = localStorage.getItem(DISPLAY_MODE_STORAGE_KEY);
    return stored === 'text' ? 'text' : 'edit';
  });

  const handleClose = useCallback(() => {
    void hideNotesOverlay();
  }, []);

  const handleCreateNote = useCallback(() => {
    void createNote(defaultNewNote());
  }, [createNote]);

  useEffect(() => {
    document.body.classList.add('notes-overlay-body');
    return () => document.body.classList.remove('notes-overlay-body');
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClose]);

  const consumeAction = useCallback(
    (rawValue: string | null) => {
      if (!rawValue) {
        return;
      }

      try {
        const action = JSON.parse(rawValue) as { type?: string; nonce?: string; createdAt?: number };
        if (action.type !== 'new_note' || !action.nonce || consumedActionRef.current === action.nonce) {
          return;
        }

        if (typeof action.createdAt === 'number' && Date.now() - action.createdAt > 10000) {
          return;
        }

        consumedActionRef.current = action.nonce;
        sessionStorage.setItem('crmatlant-notes-last-action', action.nonce);
        handleCreateNote();
      } catch (actionError) {
        console.warn('[OverlayNotes] Failed to read note action:', actionError);
      }
    },
    [handleCreateNote]
  );

  useEffect(() => {
    consumeAction(localStorage.getItem(NOTES_ACTION_STORAGE_KEY));

    const handleStorage = (event: StorageEvent) => {
      if (event.key === NOTES_ACTION_STORAGE_KEY) {
        consumeAction(event.newValue);
      }
    };

    const handleCreate = () => {
      consumeAction(localStorage.getItem(NOTES_ACTION_STORAGE_KEY));
    };

    const handleToggle = () => {
      setIsBrowserOverlayVisible((current) => !current);
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(NOTES_CREATE_EVENT, handleCreate);
    window.addEventListener(NOTES_TOGGLE_EVENT, handleToggle);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(NOTES_CREATE_EVENT, handleCreate);
      window.removeEventListener(NOTES_TOGGLE_EVENT, handleToggle);
    };
  }, [consumeAction]);

  useEffect(() => {
    if (!isLoading && notes.length === 0) {
      handleCreateNote();
    }
  }, [handleCreateNote, isLoading, notes.length]);

  const handleContentChange = (content: string) => {
    if (!selectedNote) {
      return;
    }

    updateNote(selectedNote.id, {
      content,
      title: selectedNote.title ? selectedNote.title : deriveTitle(content),
    });
  };

  const handleWindowDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('button,input,textarea,[role="slider"]')) {
      return;
    }

    event.preventDefault();
    void dragCurrentOverwolfWindow();
  };

  const setPersistedDisplayMode = (mode: OverlayDisplayMode) => {
    setDisplayMode(mode);
    localStorage.setItem(DISPLAY_MODE_STORAGE_KEY, mode);
    setIsListOpen(false);
  };

  const handleResize = (edge: ResizeEdge) => (event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    void resizeCurrentOverwolfWindow(edge);
  };

  if (isLoading) {
    return (
      <main className="notes-overlay-root">
        <div className="notes-overlay-loading">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      </main>
    );
  }

  if (!isBrowserOverlayVisible) {
    return <main className="notes-overlay-root" />;
  }

  return (
    <main className="notes-overlay-root">
      {isListOpen && (
        <aside className="notes-overlay-list">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
              <StickyNote className="h-4 w-4 text-cyan-300" />
              Notes
            </div>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-slate-200 hover:bg-white/10"
              title="Hide notes list"
              onClick={() => setIsListOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-3 space-y-2">
            {notes.map((note) => (
              <button
                key={note.id}
                type="button"
                onClick={() => {
                  setSelectedNoteId(note.id);
                  setIsListOpen(false);
                }}
                className={cn(
                  'w-full rounded-md border px-3 py-2 text-left text-sm transition',
                  selectedNoteId === note.id
                    ? 'border-cyan-300/70 bg-cyan-300/15 text-white'
                    : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                )}
              >
                <span className="block truncate font-medium">{note.title || deriveTitle(note.content)}</span>
                <span className="mt-0.5 block truncate text-xs text-slate-400">
                  {note.content || 'Empty note'}
                </span>
              </button>
            ))}
          </div>

          {error && <p className="mt-3 text-xs text-red-200">{error}</p>}
        </aside>
      )}

      {selectedNote && (
        <section
          className={cn('notes-overlay-panel', displayMode === 'text' && 'notes-overlay-panel-text-only')}
          style={{
            '--notes-bg-alpha': selectedNote.opacity,
            '--notes-surface-alpha': Math.max(selectedNote.opacity - 0.08, 0.08),
            '--notes-header-alpha': Math.min(selectedNote.opacity, 0.32),
            '--notes-footer-alpha': Math.min(selectedNote.opacity, 0.28),
          } as CSSProperties}
          onDoubleClick={() => {
            if (displayMode === 'text') {
              setPersistedDisplayMode('edit');
            }
          }}
        >
          {displayMode === 'text' ? (
            <div className="notes-overlay-text-only-content" onPointerDown={handleWindowDrag}>
              {selectedNote.content}
            </div>
          ) : (
            <>
              <div className="notes-overlay-panel-header" onPointerDown={handleWindowDrag}>
                <div className="flex min-w-0 items-center gap-2">
                  <Move className="h-4 w-4 shrink-0 text-slate-400" />
                  <Input
                    value={selectedNote.title || ''}
                    placeholder="Name"
                    onPointerDown={(event) => event.stopPropagation()}
                    onChange={(event) => updateNote(selectedNote.id, { title: event.target.value })}
                    className="h-8 border-white/10 bg-white/5 text-sm text-white placeholder:text-slate-500"
                  />
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-slate-200 hover:bg-white/10"
                    title="Show notes list"
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={() => setIsListOpen((current) => !current)}
                  >
                    <StickyNote className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    className="h-8 w-8"
                    title="Create note"
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={handleCreateNote}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-slate-200 hover:bg-white/10"
                    title="Text only mode"
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={() => setPersistedDisplayMode('text')}
                  >
                    <EyeOff className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-slate-200 hover:bg-white/10"
                    title={selectedNote.pinned ? 'Unlink' : 'Pin'}
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={() => updateNote(selectedNote.id, { pinned: !selectedNote.pinned }, { immediate: true })}
                  >
                    {selectedNote.pinned ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-red-100 hover:bg-red-500/20"
                    title="Delete"
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={() => void deleteNote(selectedNote.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-slate-200 hover:bg-white/10"
                    title="Close overlay"
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={handleClose}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Textarea
                value={selectedNote.content}
                onChange={(event) => handleContentChange(event.target.value)}
                placeholder="Game note..."
                className="notes-overlay-textarea"
              />

              <div className="notes-overlay-footer">
                <div className="flex w-36 items-center gap-2">
                  <span className="text-xs text-slate-400">Opacity</span>
                  <Slider
                    min={0}
                    max={100}
                    step={5}
                    value={[Math.round(selectedNote.opacity * 100)]}
                    onValueChange={([value]) => updateNote(selectedNote.id, { opacity: value / 100 })}
                  />
                </div>

                <div className="flex items-center gap-1 text-xs text-slate-400">
                  {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  {isSaving ? 'Saving' : 'Saved'}
                </div>
              </div>
            </>
          )}

          {displayMode === 'text' && (
            <button
              type="button"
              className="notes-overlay-text-mode-exit"
              title="Back to edit mode"
              onClick={() => setPersistedDisplayMode('edit')}
            >
              <Eye className="h-4 w-4" />
            </button>
          )}

          {RESIZE_EDGES.map((edge) => (
            <button
              key={edge}
              type="button"
              className={cn('notes-overlay-resize-zone', `notes-overlay-resize-${edge.toLowerCase()}`)}
              title={`Resize ${edge}`}
              aria-label={`Resize ${edge}`}
              onPointerDown={handleResize(edge)}
            />
          ))}

          {displayMode === 'edit' && (
            <div className="notes-overlay-resize-cue" aria-hidden="true">
              <Grip className="h-4 w-4" />
            </div>
          )}
        </section>
      )}
    </main>
  );
};

export default NotesOverlay;
