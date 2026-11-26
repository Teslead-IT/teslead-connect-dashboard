'use client';

import React, { useState } from 'react';
import { X, Bell } from 'lucide-react';
import { useCreateReminder } from '@/hooks/use-reminders';
import { useToast } from '@/components/ui/Toast';

interface CreateReminderModalProps {
  open: boolean;
  onClose: () => void;
  projectId?: string;
  taskId?: string;
  defaultTitle?: string;
}

export function CreateReminderModal({
  open,
  onClose,
  projectId,
  taskId,
  defaultTitle = '',
}: CreateReminderModalProps) {
  const [title, setTitle] = useState(defaultTitle);
  const [description, setDescription] = useState('');
  const [remindAt, setRemindAt] = useState('');
  const createReminder = useCreateReminder();
  const toast = useToast();

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !remindAt) {
      toast.error('Title and remind time required');
      return;
    }
    try {
      await createReminder.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        remindAt: new Date(remindAt).toISOString(),
        projectId,
        taskId,
      });
      toast.success('Reminder created');
      setTitle('');
      setDescription('');
      setRemindAt('');
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create reminder');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#091590]" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              New Reminder
            </h2>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
              placeholder="What should we remind you?"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Remind at</label>
            <input
              type="datetime-local"
              value={remindAt}
              onChange={(e) => setRemindAt(e.target.value)}
              className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Notes (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createReminder.isPending}
              className="px-3 py-1.5 text-xs font-medium rounded-md !bg-[#091590] text-white hover:!bg-[#071170] disabled:opacity-50"
            >
              {createReminder.isPending ? 'Saving…' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
