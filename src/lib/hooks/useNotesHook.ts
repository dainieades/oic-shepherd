'use client';

import React from 'react';
import { formatISO } from 'date-fns';
import { type Dispatch, type SetStateAction } from 'react';
import { type AppData, type Persona, type Note, type Notice } from '../types';
import { type NoteRow, type NoticeRow } from '../schemas';
import { generateId, fullName } from '../utils';
import { createClient } from '@/utils/supabase/client';
import { SAVE_ERROR_MSG } from '../constants';

interface NotesHookDeps {
  setData: Dispatch<SetStateAction<AppData>>;
  currentPersona: Persona;
  currentUserEmail: string;
  showToast: (message: string, type?: 'success' | 'error') => void;
}

export interface NotesHookResult {
  addNote: (note: Omit<Note, 'id' | 'createdBy'> & { createdAt?: string }) => Promise<void>;
  updateNote: (
    noteId: string,
    updates: Partial<Pick<Note, 'type' | 'content' | 'familyId' | 'personId' | 'visibility' | 'createdAt'>>
  ) => Promise<void>;
  deleteNote: (noteId: string) => Promise<void>;
  addNotice: (notice: Omit<Notice, 'id' | 'createdBy' | 'createdAt'>) => Promise<void>;
  updateNotice: (
    noticeId: string,
    updates: Partial<Pick<Notice, 'categories' | 'urgency' | 'privacy' | 'content' | 'personId' | 'familyId'>>
  ) => Promise<void>;
  deleteNotice: (noticeId: string) => Promise<void>;
  canViewNote: (note: Note) => boolean;
}

export function useNotesHook({ setData, currentPersona, currentUserEmail, showToast }: NotesHookDeps): NotesHookResult {
  const addNote = React.useCallback(
    async (noteData: Omit<Note, 'id' | 'createdBy'> & { createdAt?: string }): Promise<void> => {
      const note: Note = {
        ...noteData,
        id: generateId(),
        createdBy: currentPersona.id,
        createdAt: noteData.createdAt ?? new Date().toISOString(),
      };

      let snapshot: AppData | undefined;
      setData((prev) => {
        snapshot = prev;
        const newData = { ...prev, notes: [note, ...prev.notes] };
        if (note.personId) {
          newData.people = prev.people.map((p) =>
            p.id === note.personId ? { ...p, lastContactDate: formatISO(new Date()) } : p
          );
        }
        if (note.familyId) {
          const family = prev.families.find((f) => f.id === note.familyId);
          if (family) {
            newData.people = (newData.people || prev.people).map((p) =>
              family.memberIds.includes(p.id) ? { ...p, lastContactDate: formatISO(new Date()) } : p
            );
          }
        }
        return newData;
      });

      const supabase = createClient();
      const { error: noteInsertError } = await supabase.from('notes').insert({
        id: note.id,
        person_id: note.personId ?? null,
        family_id: note.familyId ?? null,
        todo_id: note.todoId ?? null,
        type: note.type,
        visibility: note.visibility,
        content: note.content ?? null,
        mentions: note.mentions ?? [],
        created_by: note.createdBy,
        created_at: note.createdAt,
      });
      if (noteInsertError) {
        console.error('notes insert failed:', JSON.stringify(noteInsertError, null, 2));
        if (snapshot) setData(snapshot);
        showToast(SAVE_ERROR_MSG, 'error');
        return;
      }

      if (note.personId) {
        const { error: contactDateError } = await supabase
          .from('people')
          .update({ last_contact_date: formatISO(new Date()) })
          .eq('id', note.personId);
        if (contactDateError) {
          console.error('people last_contact_date update failed:', JSON.stringify(contactDateError, null, 2));
        }
      }
    },
    [currentPersona.id, setData, showToast]
  );

  const updateNote = React.useCallback(
    async (
      noteId: string,
      updates: Partial<Pick<Note, 'type' | 'content' | 'familyId' | 'personId' | 'visibility' | 'createdAt'>>
    ): Promise<void> => {
      let snapshot: AppData | undefined;
      setData((prev) => {
        snapshot = prev;
        return { ...prev, notes: prev.notes.map((n) => (n.id === noteId ? { ...n, ...updates } : n)) };
      });
      const supabase = createClient();
      const dbUpdates: Partial<NoteRow> = {};
      if (updates.type !== undefined) dbUpdates.type = updates.type;
      if (updates.content !== undefined) dbUpdates.content = updates.content;
      if (updates.familyId !== undefined) dbUpdates.family_id = updates.familyId;
      if (updates.personId !== undefined) dbUpdates.person_id = updates.personId;
      if (updates.visibility !== undefined) dbUpdates.visibility = updates.visibility;
      if (updates.createdAt !== undefined) dbUpdates.created_at = updates.createdAt;
      const { error } = await supabase.from('notes').update(dbUpdates).eq('id', noteId);
      if (error) {
        console.error('notes update failed:', JSON.stringify(error, null, 2));
        if (snapshot) setData(snapshot);
        showToast(SAVE_ERROR_MSG, 'error');
      }
    },
    [setData, showToast]
  );

  const deleteNote = React.useCallback(
    async (noteId: string): Promise<void> => {
      let snapshot: AppData | undefined;
      setData((prev) => {
        snapshot = prev;
        return { ...prev, notes: prev.notes.filter((n) => n.id !== noteId) };
      });
      const supabase = createClient();
      const { error } = await supabase.from('notes').delete().eq('id', noteId);
      if (error) {
        console.error('notes delete failed:', JSON.stringify(error, null, 2));
        if (snapshot) setData(snapshot);
        showToast('Failed to delete log. Try again.', 'error');
      }
    },
    [setData, showToast]
  );

  const addNotice = React.useCallback(
    async (noticeData: Omit<Notice, 'id' | 'createdBy' | 'createdAt'>): Promise<void> => {
      const notice: Notice = {
        ...noticeData,
        id: generateId(),
        createdBy: currentPersona.id,
        createdAt: new Date().toISOString(),
      };
      let snapshot: AppData | undefined;
      let aboutName = '';
      setData((prev) => {
        snapshot = prev;
        if (notice.personId) {
          const p = prev.people.find((p) => p.id === notice.personId);
          aboutName = p ? fullName(p) : '';
        } else if (notice.familyId) {
          aboutName = prev.families.find((f) => f.id === notice.familyId)?.label ?? '';
        }
        return { ...prev, notices: [notice, ...prev.notices] };
      });
      const supabase = createClient();
      const { error } = await supabase.from('notices').insert({
        id: notice.id,
        person_id: notice.personId ?? null,
        family_id: notice.familyId ?? null,
        categories: notice.categories,
        urgency: notice.urgency,
        privacy: notice.privacy,
        content: notice.content,
        created_by: notice.createdBy,
        created_at: notice.createdAt,
      });
      if (error) {
        console.error('notices insert failed:', JSON.stringify(error, null, 2));
        if (snapshot) setData(snapshot);
        showToast(SAVE_ERROR_MSG, 'error');
        return;
      }
      void fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'notice.added',
          aboutName: aboutName || 'General',
          content: notice.content,
          urgency: notice.urgency,
          privacy: notice.privacy,
          addedByName: currentPersona.name,
          actorEmail: currentUserEmail,
          actorUserId: currentPersona.userId,
        }),
      });
    },
    [currentPersona.id, currentPersona.name, currentPersona.userId, currentUserEmail, setData, showToast]
  );

  const updateNotice = React.useCallback(
    async (
      noticeId: string,
      updates: Partial<Pick<Notice, 'categories' | 'urgency' | 'privacy' | 'content' | 'personId' | 'familyId'>>
    ): Promise<void> => {
      let snapshot: AppData | undefined;
      setData((prev) => {
        snapshot = prev;
        return {
          ...prev,
          notices: prev.notices.map((n) => (n.id === noticeId ? { ...n, ...updates } : n)),
        };
      });
      const supabase = createClient();
      const dbUpdates: Partial<NoticeRow> = {};
      if (updates.categories !== undefined) dbUpdates.categories = updates.categories;
      if (updates.urgency !== undefined) dbUpdates.urgency = updates.urgency;
      if (updates.privacy !== undefined) dbUpdates.privacy = updates.privacy;
      if (updates.content !== undefined) dbUpdates.content = updates.content;
      if (updates.personId !== undefined) dbUpdates.person_id = updates.personId;
      if (updates.familyId !== undefined) dbUpdates.family_id = updates.familyId;
      const { error } = await supabase.from('notices').update(dbUpdates).eq('id', noticeId);
      if (error) {
        console.error('notices update failed:', JSON.stringify(error, null, 2));
        if (snapshot) setData(snapshot);
        showToast(SAVE_ERROR_MSG, 'error');
      }
    },
    [setData, showToast]
  );

  const deleteNotice = React.useCallback(
    async (noticeId: string): Promise<void> => {
      let snapshot: AppData | undefined;
      setData((prev) => {
        snapshot = prev;
        return { ...prev, notices: prev.notices.filter((n) => n.id !== noticeId) };
      });
      const supabase = createClient();
      const { error } = await supabase.from('notices').delete().eq('id', noticeId);
      if (error) {
        console.error('notices delete failed:', JSON.stringify(error, null, 2));
        if (snapshot) setData(snapshot);
        showToast('Failed to delete notice. Try again.', 'error');
      }
    },
    [setData, showToast]
  );

  const canViewNote = React.useCallback(
    (note: Note): boolean => {
      if (currentPersona.role === 'admin') return true;
      if (note.visibility === 'public') return true;
      if (note.createdBy === currentPersona.id) return true;
      if (currentPersona.role === 'shepherd' && note.personId) {
        return currentPersona.assignedPeopleIds.includes(note.personId);
      }
      return false;
    },
    [currentPersona]
  );

  return { addNote, updateNote, deleteNote, addNotice, updateNotice, deleteNotice, canViewNote };
}
