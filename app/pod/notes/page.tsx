'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, MessageSquare, Send, Shield, AlertCircle, Loader2 } from 'lucide-react';

interface PodNote {
  id: string;
  body: string;
  author_display_name: string;
  is_own: boolean;
  created_at: string;
}

export default function PodNotesPage() {
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<PodNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [podId, setPodId] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const userId = typeof window !== 'undefined' ? (localStorage.getItem('taranga_user_id') ?? 'usr-a1') : 'usr-a1';

  useEffect(() => {
    async function loadData() {
      try {
        const podRes = await fetch('/api/me/pod', { headers: { 'x-user-id': userId } });
        if (!podRes.ok) throw new Error('Pod not found');
        const podData = await podRes.json();
        const pId = podData.pod.id;
        setPodId(pId);

        const notesRes = await fetch(`/api/notes?podId=${pId}&userId=${userId}`);
        if (notesRes.ok) {
          const data = await notesRes.json();
          setNotes(data.notes || []);
        }
      } catch {
        setError('Could not load pod notes.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [userId]);

  const handleSubmitNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !podId) return;

    if (newNote.length > 500) {
      setError('Notes are limited to 500 characters.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setWarningMessage(null);

    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          podId,
          body: newNote.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to post note.');
        setSubmitting(false);
        return;
      }

      if (data.user_warning) {
        setWarningMessage(data.user_warning);
      }

      // Add to list
      const addedNote: PodNote = {
        id: data.note_id || `note-${Date.now()}`,
        body: newNote.trim(),
        author_display_name: 'You',
        is_own: true,
        created_at: new Date().toISOString(),
      };

      setNotes((prev) => [addedNote, ...prev]);
      setNewNote('');
    } catch {
      setError('Network error posting note.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-wave-600" />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4 space-y-5 pb-16">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Link href="/pod" className="p-1 text-paper-700 hover:text-paper-900">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-serif text-xl font-bold text-paper-900">Pod Notes</h1>
          <p className="text-xs text-paper-700">A quiet bulletin board for your pod</p>
        </div>
      </div>

      {/* Info notice */}
      <div className="p-3 bg-paper-100 border border-paper-200 rounded-xl flex items-start gap-2.5">
        <Shield className="w-4 h-4 text-wave-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-paper-800 leading-relaxed">
          Short reflections, book or cafe recommendations, or warm notes between tables. Text only, up to 500 characters, host-moderated.
        </p>
      </div>

      {/* Post note form */}
      <form onSubmit={handleSubmitNote} className="space-y-2">
        <div className="relative">
          <textarea
            rows={3}
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            maxLength={500}
            placeholder="Leave a note for your pod (e.g. favourite book, a cafe thought)..."
            className="w-full p-3 text-xs bg-paper-50 border border-paper-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-wave-500 text-paper-900"
          />
          <div className="flex items-center justify-between px-1 pt-1">
            <span className="text-[11px] text-muted-foreground">
              {newNote.length}/500 characters
            </span>
            <button
              type="submit"
              disabled={submitting || !newNote.trim()}
              className="py-1.5 px-3 bg-wave-600 hover:bg-wave-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Post</span>
            </button>
          </div>
        </div>
      </form>

      {/* Self-harm / helpline warning */}
      {warningMessage && (
        <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-2 text-xs text-amber-900">
          <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed">{warningMessage}</div>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
          {error}
        </div>
      )}

      {/* Notes List */}
      <div className="space-y-3 pt-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-paper-700">
          Recent Notes
        </h2>

        {notes.length === 0 ? (
          <div className="p-6 text-center bg-paper-50 border border-paper-200 rounded-xl">
            <MessageSquare className="w-8 h-8 text-paper-300 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">No notes posted yet. Be the first to share one!</p>
          </div>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className={`p-3.5 rounded-xl border space-y-1.5 ${
                note.is_own ? 'bg-wave-50/50 border-wave-200' : 'bg-paper-100 border-paper-200'
              }`}
            >
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-paper-900">
                  {note.is_own ? 'You' : note.author_display_name}
                </span>
                <span className="text-muted-foreground">
                  {new Date(note.created_at).toLocaleDateString('en-IN', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
              <p className="text-xs text-paper-800 leading-relaxed whitespace-pre-wrap">
                {note.body}
              </p>
            </div>
          ))
        )}
      </div>

      <div className="text-center pt-2">
        <Link href="/pod" className="text-xs text-wave-700 hover:underline">
          Return to Pod Home
        </Link>
      </div>
    </div>
  );
}
