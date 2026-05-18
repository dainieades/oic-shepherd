'use client';

import React from 'react';
import { type Dispatch, type SetStateAction } from 'react';
import { type AppData, type Todo } from '../types';
import { type TodoRow } from '../schemas';
import { generateId, calcReminderDueAt } from '../utils';
import { createClient } from '@/utils/supabase/client';
import { SAVE_ERROR_MSG } from '../constants';

interface TodosHookDeps {
  setData: Dispatch<SetStateAction<AppData>>;
  currentPersonaId: string;
  showToast: (message: string, type?: 'success' | 'error') => void;
}

export interface TodosHookResult {
  addTodo: (todo: Omit<Todo, 'id' | 'createdAt' | 'createdBy' | 'completed'>) => Promise<void>;
  updateTodo: (
    todoId: string,
    updates: Partial<Pick<Todo, 'title' | 'dueDate' | 'endDate' | 'repeat' | 'reminder' | 'familyId' | 'personId'>>
  ) => Promise<void>;
  deleteTodo: (todoId: string) => Promise<void>;
  toggleTodo: (todoId: string) => Promise<void>;
}

export function useTodosHook({ setData, currentPersonaId, showToast }: TodosHookDeps): TodosHookResult {
  const addTodo = React.useCallback(
    async (todoData: Omit<Todo, 'id' | 'createdAt' | 'createdBy' | 'completed'>): Promise<void> => {
      const todo: Todo = {
        ...todoData,
        id: generateId(),
        completed: false,
        createdBy: currentPersonaId,
        createdAt: new Date().toISOString(),
      };
      let snapshot: AppData | undefined;
      setData((prev) => {
        snapshot = prev;
        return { ...prev, todos: [todo, ...prev.todos] };
      });
      const supabase = createClient();
      const { error } = await supabase.from('todos').insert({
        id: todo.id,
        person_id: todo.personId ?? null,
        family_id: todo.familyId ?? null,
        title: todo.title,
        due_date: todo.dueDate ?? null,
        end_date: todo.endDate ?? null,
        repeat: todo.repeat ?? null,
        reminder: todo.reminder ?? null,
        reminder_due_at: calcReminderDueAt(todo.dueDate, todo.reminder),
        completed: false,
        created_by: todo.createdBy,
        created_at: todo.createdAt,
      });
      if (error) {
        console.error('todos insert failed:', JSON.stringify(error, null, 2));
        if (snapshot) setData(snapshot);
        showToast(SAVE_ERROR_MSG, 'error');
      }
    },
    [currentPersonaId, setData, showToast]
  );

  const updateTodo = React.useCallback(
    async (
      todoId: string,
      updates: Partial<Pick<Todo, 'title' | 'dueDate' | 'endDate' | 'repeat' | 'reminder' | 'familyId' | 'personId'>>
    ): Promise<void> => {
      let snapshot: AppData | undefined;
      let existingTodo: Todo | undefined;
      setData((prev) => {
        snapshot = prev;
        existingTodo = prev.todos.find((t) => t.id === todoId);
        return {
          ...prev,
          todos: prev.todos.map((t) => (t.id === todoId ? { ...t, ...updates } : t)),
        };
      });
      const supabase = createClient();
      const dbUpdates: Partial<TodoRow> = {};
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate;
      if (updates.endDate !== undefined) dbUpdates.end_date = updates.endDate;
      if (updates.repeat !== undefined) dbUpdates.repeat = updates.repeat;
      if (updates.reminder !== undefined) dbUpdates.reminder = updates.reminder;
      if (updates.familyId !== undefined) dbUpdates.family_id = updates.familyId;
      if (updates.personId !== undefined) dbUpdates.person_id = updates.personId;
      // Recalculate reminder_due_at and reset reminder_sent_at when schedule changes
      if (updates.dueDate !== undefined || updates.reminder !== undefined) {
        const newDueDate = updates.dueDate ?? existingTodo?.dueDate;
        const newReminder = updates.reminder ?? existingTodo?.reminder;
        dbUpdates.reminder_due_at = calcReminderDueAt(newDueDate, newReminder);
        dbUpdates.reminder_sent_at = null;
      }
      const { error } = await supabase.from('todos').update(dbUpdates).eq('id', todoId);
      if (error) {
        console.error('todos update failed:', JSON.stringify(error, null, 2));
        if (snapshot) setData(snapshot);
        showToast(SAVE_ERROR_MSG, 'error');
      }
    },
    [setData, showToast]
  );

  const deleteTodo = React.useCallback(
    async (todoId: string): Promise<void> => {
      let snapshot: AppData | undefined;
      setData((prev) => {
        snapshot = prev;
        return { ...prev, todos: prev.todos.filter((t) => t.id !== todoId) };
      });
      const supabase = createClient();
      const { error } = await supabase.from('todos').delete().eq('id', todoId);
      if (error) {
        console.error('todos delete failed:', JSON.stringify(error, null, 2));
        if (snapshot) setData(snapshot);
        showToast('Failed to delete to-do. Try again.', 'error');
      }
    },
    [setData, showToast]
  );

  const toggleTodo = React.useCallback(
    async (todoId: string): Promise<void> => {
      let newCompleted = false;
      let completedAt: string | undefined;
      let snapshot: AppData | undefined;
      setData((prev) => {
        snapshot = prev;
        return {
          ...prev,
          todos: prev.todos.map((t) => {
            if (t.id === todoId) {
              newCompleted = !t.completed;
              completedAt = newCompleted ? new Date().toISOString() : undefined;
              return { ...t, completed: newCompleted, completedAt };
            }
            return t;
          }),
        };
      });
      const supabase = createClient();
      const { error } = await supabase
        .from('todos')
        .update({ completed: newCompleted, completed_at: completedAt ?? null })
        .eq('id', todoId);
      if (error) {
        console.error('todos toggle failed:', JSON.stringify(error, null, 2));
        if (snapshot) setData(snapshot);
        showToast('Failed to update to-do. Try again.', 'error');
      }
    },
    [setData, showToast]
  );

  return { addTodo, updateTodo, deleteTodo, toggleTodo };
}
