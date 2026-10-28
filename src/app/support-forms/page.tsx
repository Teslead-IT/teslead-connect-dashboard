'use client';

import React, { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { SupportFormsTable } from '@/components/support-forms/SupportFormsTable';
import { SupportFormModal } from '@/components/support-forms/SupportFormModal';
import { useSupportForms, SupportForm } from '@/hooks/use-support-forms';

export default function SupportFormsPage() {
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

    const [modalOpen, setModalOpen] = useState(false);
    const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
    const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');

    const { data: formsResponse, isLoading } = useSupportForms({
        page,
        limit: 20,
        search: search.trim() || undefined,
    });

    const forms = formsResponse?.data || [];
    const total = formsResponse?.total || 0;
    const totalPages = formsResponse?.totalPages || 1;

    const handleCreateNew = () => {
        setSelectedFormId(null);
        setModalMode('create');
        setModalOpen(true);
    };

    const handleViewForm = (form: SupportForm) => {
        setSelectedFormId(form.id);
        setModalMode('view');
        setModalOpen(true);
    };

    const handleEditForm = (form: SupportForm) => {
        setSelectedFormId(form.id);
        setModalMode('edit');
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setSelectedFormId(null);
    };

    return (
        <div className="h-full flex flex-col bg-white overflow-hidden">
            {/* Top Page Header */}
            <div className="border-b border-gray-100 py-3 px-6 flex-shrink-0 bg-white">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    {/* Left: Title & Total Count Badge */}
                    <div className="flex items-center justify-between w-full sm:w-auto gap-3 min-w-[140px]">
                        <div className="flex items-center gap-3">
                            <h1 className="text-lg font-bold text-gray-900 tracking-tight">Support Forms</h1>
                            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-[10px] font-semibold border border-gray-200">
                                {total}
                            </span>
                        </div>
                    </div>

                    {/* Right: Search Input & Action Button */}
                    <div className="flex items-center gap-3 w-full sm:w-auto sm:flex-1 justify-between sm:justify-end">
                        {/* Search Input matching Projects Page styling */}
                        <div className="relative flex-1 sm:flex-initial sm:max-w-xs w-full lg:max-w-sm group transition-all">
                            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                                <Search className="w-3.5 h-3.5 text-gray-400 group-focus-within:text-[var(--primary)] transition-colors" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search..."
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setPage(1);
                                }}
                                className="block w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-md leading-5 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-all text-xs"
                            />
                        </div>

                        {/* New Support Form Button */}
                        <button
                            onClick={handleCreateNew}
                            className="inline-flex items-center justify-center bg-[#091590] hover:bg-blue-900 text-white font-medium px-4 py-2 text-xs rounded-md transition-all duration-200 shadow-md active:scale-[0.98] cursor-pointer whitespace-nowrap gap-1.5"
                        >
                            <Plus className="w-4 h-4 stroke-[2.5]" />
                            <span>New Support Form</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 min-h-0 overflow-hidden bg-slate-50/50">
                <SupportFormsTable
                    forms={forms}
                    isLoading={isLoading}
                    total={total}
                    totalPages={totalPages}
                    page={page}
                    setPage={setPage}
                    search={search}
                    onView={handleViewForm}
                    onEdit={handleEditForm}
                />
            </div>

            {/* Modal for Create / Edit / View / Delete */}
            <SupportFormModal
                isOpen={modalOpen}
                onClose={handleCloseModal}
                supportFormId={selectedFormId}
                initialMode={modalMode}
            />
        </div>
    );
}
