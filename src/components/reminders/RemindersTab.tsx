'use client';

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useProjectReminders } from '@/hooks/use-reminders';
import { RemindersList } from './RemindersList';
import { CreateReminderModal } from './CreateReminderModal';
import { Loader } from '@/components/ui/Loader';

interface RemindersTabProps {
  projectId: string;
}

export function RemindersTab({ projectId }: RemindersTabProps) {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const { data, isLoading } = useProjectReminders(projectId, { page, limit: 20 });

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-950">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Project Reminders</h3>
          <span className="bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 px-2 py-0.5 rounded-full text-[10px] font-semibold border border-gray-200 dark:border-slate-700">
            {data?.total ?? 0}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 h-8 text-xs font-medium rounded-md bg-[var(--primary)] text-white hover:bg-[#071170]"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Reminder
        </button>
      </div>
      <div className="flex-1 overflow-hidden">
        {isLoading && !data ? (
          <div className="flex items-center justify-center h-full">
            <Loader />
          </div>
        ) : (
          <RemindersList
            reminders={data?.data || []}
            isLoading={isLoading}
            total={data?.total}
            page={page}
            totalPages={data?.totalPages || 1}
            onPageChange={setPage}
          />
        )}
      </div>
      <CreateReminderModal
        open={open}
        onClose={() => setOpen(false)}
        projectId={projectId}
      />
    </div>
  );
}
