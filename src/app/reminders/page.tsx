'use client';

import React, { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { useReminders } from '@/hooks/use-reminders';
import { RemindersList } from '@/components/reminders/RemindersList';
import { CreateReminderModal } from '@/components/reminders/CreateReminderModal';
import { Loader } from '@/components/ui/Loader';
import type { ReminderStatus } from '@/types/reminder';

export default function RemindersPage() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<ReminderStatus | ''>('');
  const [mine, setMine] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading } = useReminders({
    page,
    limit,
    status: status || undefined,
    mine: mine || undefined,
  });

  const reminders = (data?.data || []).filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      r.title.toLowerCase().includes(q) ||
      (r.description || '').toLowerCase().includes(q) ||
      (r.project?.name || '').toLowerCase().includes(q) ||
      (r.task?.title || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-950">
      <div className="border-b border-gray-100 dark:border-slate-800 py-3 px-6 flex-shrink-0 bg-white dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-[140px]">
            <h1 className="text-lg font-bold text-gray-900 dark:text-slate-100 tracking-tight">
              Reminders
            </h1>
            <span className="bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 px-2 py-0.5 rounded-full text-[10px] font-semibold border border-gray-200 dark:border-slate-700">
              {data?.total ?? 0}
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto sm:flex-1 justify-between sm:justify-end">
            <div className="relative flex-1 sm:flex-initial sm:max-w-xs w-full lg:max-w-sm group transition-all">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                <Search className="w-3.5 h-3.5 text-gray-400 group-focus-within:text-[var(--primary)] transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="block w-full pl-8 pr-3 py-1.5 border border-gray-200 dark:border-slate-700 rounded-md leading-5 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-all text-xs"
              />
            </div>

            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as ReminderStatus | '');
                setPage(1);
              }}
              className="text-xs border border-gray-200 dark:border-slate-700 rounded-md px-2 py-1.5 bg-white dark:bg-slate-900 h-8"
            >
              <option value="">All status</option>
              <option value="PENDING">Pending</option>
              <option value="SENT">Sent</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
              <input
                type="checkbox"
                checked={mine}
                onChange={(e) => {
                  setMine(e.target.checked);
                  setPage(1);
                }}
              />
              Mine
            </label>

            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex items-center justify-center bg-[var(--primary)] text-white hover:bg-[#071170] hover:text-white active:scale-[0.98] font-medium px-4 h-8 text-xs rounded-md transition-colors duration-200 border border-transparent shadow-sm whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5 sm:mr-1.5" />
              <span className="hidden sm:inline">New Reminder</span>
              <span className="sm:hidden">New</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden p-0 bg-white dark:bg-slate-950">
        {isLoading && !data ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <Loader />
          </div>
        ) : (
          <RemindersList
            reminders={reminders}
            isLoading={isLoading}
            total={data?.total}
            page={page}
            totalPages={data?.totalPages || 1}
            onPageChange={setPage}
          />
        )}
      </div>

      <CreateReminderModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
