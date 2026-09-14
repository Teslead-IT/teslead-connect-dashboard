'use client';

import React, { useState, useEffect } from 'react';
import {
    X,
    Plus,
    Trash2,
    Save,
    Printer,
    Edit3,
    AlertTriangle,
    Loader2,
    FileText,
    FolderKanban,
    ClipboardList,
} from 'lucide-react';
import {
    useSupportForm,
    useCreateSupportForm,
    useUpdateSupportForm,
    useDeleteSupportForm,
    SupportMode,
} from '@/hooks/use-support-forms';
import { useProjects } from '@/hooks/use-projects';

interface SupportFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    supportFormId?: string | null;
    initialMode?: 'create' | 'edit' | 'view';
}

interface FormRowItem {
    sNo: number;
    purpose: string;
    supportMode: SupportMode;
    supportedBy: string;
    startDate: string;
    endDate: string;
}

const escapeHtml = (value: string) =>
    value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

const formatPrintDate = (value: string) => {
    if (!value) return '';
    const [year, month, day] = value.split('-');
    if (!year || !month || !day) return value;
    return `${day}/${month}/${year}`;
};

const PRINT_PAGE1_ROWS = 26;
const PRINT_PAGEN_ROWS = 30;

const buildItemsTableHtml = (items: FormRowItem[], startIndex: number, count: number) => {
    const rows = Array.from({ length: count }, (_, offset) => {
        const idx = startIndex + offset;
        const row = items[idx];
        return `
            <tr>
                <td class="center bold">${String(idx + 1).padStart(2, '0')}</td>
                <td>${escapeHtml(row?.purpose || '')}</td>
                <td class="center">${escapeHtml(row?.supportMode || '')}</td>
                <td>${escapeHtml(row?.supportedBy || '')}</td>
                <td class="center">${escapeHtml(formatPrintDate(row?.startDate || ''))}</td>
                <td class="center">${escapeHtml(formatPrintDate(row?.endDate || ''))}</td>
            </tr>
        `;
    }).join('');

    return `
        <table class="items">
            <thead>
                <tr>
                    <th class="col-sno">S No</th>
                    <th>Purpose</th>
                    <th class="col-mode">Online / Onsite</th>
                    <th class="col-by">Supported By</th>
                    <th class="col-date">Start Date</th>
                    <th class="col-date">End Date</th>
                </tr>
            </thead>
            <tbody>
                ${rows}
            </tbody>
        </table>
    `;
};

const buildSupportFormPrintDocument = ({
    projectName,
    projectStartDate,
    projectCompletionDate,
    items,
    rowCount,
}: {
    projectName: string;
    projectStartDate: string;
    projectCompletionDate: string;
    items: FormRowItem[];
    rowCount: number;
}) => {
    const firstCount = Math.min(PRINT_PAGE1_ROWS, rowCount);
    let continuationPages = '';
    let offset = firstCount;

    while (offset < rowCount) {
        const count = Math.min(PRINT_PAGEN_ROWS, rowCount - offset);
        continuationPages += `
            <div class="page page-next">
                ${buildItemsTableHtml(items, offset, count)}
            </div>
        `;
        offset += count;
    }

    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <title></title>
    <style>
        @page {
            size: A4 portrait;
            margin: 0;
        }
        @page {
            @top-left { content: none; }
            @top-center { content: none; }
            @top-right { content: none; }
            @bottom-left { content: none; }
            @bottom-center { content: none; }
            @bottom-right { content: none; }
        }
        * { box-sizing: border-box; }
        html, body {
            margin: 0;
            padding: 0;
            background: #fff;
            color: #111;
            font-family: Arial, Helvetica, sans-serif;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        .page-first {
            width: 100%;
            padding: 12mm;
        }
        .page-next {
            width: 100%;
            page-break-before: always;
            break-before: page;
            padding: 20mm 12mm 12mm 12mm;
        }
        .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 2px solid #091590;
            padding-bottom: 10px;
            margin-bottom: 16px;
        }
        .brand { display: flex; align-items: center; gap: 8px; }
        .brand-badge {
            background: #091590;
            color: #fff;
            font-weight: 900;
            font-size: 12px;
            letter-spacing: 0.04em;
            padding: 3px 8px;
        }
        .brand-sub {
            color: #091590;
            font-size: 9px;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
        }
        .title {
            margin: 0;
            color: #091590;
            font-size: 15px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            text-align: center;
        }
        table { width: 100%; border-collapse: collapse; }
        .items tr { break-inside: avoid; page-break-inside: avoid; }
        .meta { margin-bottom: 16px; }
        .meta th, .items th {
            background: #dbeafe;
            color: #091590;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            padding: 8px 6px;
            border: 1px solid #091590;
        }
        .meta td, .items td {
            font-size: 12px;
            padding: 8px 6px;
            border: 1px solid #091590;
            vertical-align: middle;
        }
        .meta td { text-align: center; font-weight: 600; }
        .items td { height: 28px; }
        .center { text-align: center; }
        .bold { font-weight: 700; }
        .col-sno { width: 48px; }
        .col-mode { width: 110px; }
        .col-by { width: 140px; }
        .col-date { width: 100px; }
    </style>
</head>
<body>
    <div class="page-first">
        <div class="header">
            <div class="brand">
                <span class="brand-badge">TESLEAD</span>
                <span class="brand-sub">Technology Solutions</span>
            </div>
            <h1 class="title">Online / Onsite Support Form</h1>
            <div style="width: 140px;"></div>
        </div>
        <table class="meta">
            <thead>
                <tr>
                    <th>Project Name</th>
                    <th>Project Start Date</th>
                    <th>Project Completion Date</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>${escapeHtml(projectName || '—')}</td>
                    <td>${escapeHtml(formatPrintDate(projectStartDate) || '—')}</td>
                    <td>${escapeHtml(formatPrintDate(projectCompletionDate) || '—')}</td>
                </tr>
            </tbody>
        </table>
        ${buildItemsTableHtml(items, 0, firstCount)}
    </div>
    ${continuationPages}
</body>
</html>`;
};

export const SupportFormModal: React.FC<SupportFormModalProps> = ({
    isOpen,
    onClose,
    supportFormId,
    initialMode = 'create',
}) => {
    const [mode, setMode] = useState<'create' | 'edit' | 'view'>(initialMode);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Form states
    const [projectId, setProjectId] = useState<string>('');
    const [projectName, setProjectName] = useState<string>('');
    const [projectStartDate, setProjectStartDate] = useState<string>('');
    const [projectCompletionDate, setProjectCompletionDate] = useState<string>('');
    const [items, setItems] = useState<FormRowItem[]>([]);

    // API Hooks
    const { data: projectsData } = useProjects({ limit: 100 });
    const { data: supportForm, isLoading: isFetching } = useSupportForm(supportFormId);

    const createMutation = useCreateSupportForm();
    const updateMutation = useUpdateSupportForm();
    const deleteMutation = useDeleteSupportForm();

    const projects = projectsData?.data || [];

    useEffect(() => {
        setMode(initialMode);
    }, [initialMode, isOpen]);

    // Populate form data when viewing/editing existing item
    useEffect(() => {
        if (supportFormId && supportForm && (mode === 'edit' || mode === 'view')) {
            setProjectId(supportForm.projectId || '');
            setProjectName(supportForm.projectName || '');
            setProjectStartDate(
                supportForm.projectStartDate
                    ? new Date(supportForm.projectStartDate).toISOString().split('T')[0]
                    : ''
            );
            setProjectCompletionDate(
                supportForm.projectCompletionDate
                    ? new Date(supportForm.projectCompletionDate).toISOString().split('T')[0]
                    : ''
            );

            if (supportForm.items && supportForm.items.length > 0) {
                setItems(
                    supportForm.items.map((item, idx) => ({
                        sNo: item.sNo ?? idx + 1,
                        purpose: item.purpose || '',
                        supportMode: item.supportMode || 'ONLINE',
                        supportedBy: item.supportedBy || '',
                        startDate: item.startDate
                            ? new Date(item.startDate).toISOString().split('T')[0]
                            : '',
                        endDate: item.endDate
                            ? new Date(item.endDate).toISOString().split('T')[0]
                            : '',
                    }))
                );
            } else {
                setItems([createEmptyRow(1)]);
            }
        } else if (mode === 'create') {
            resetForm();
        }
    }, [supportFormId, supportForm, mode]);

    const createEmptyRow = (sNo: number): FormRowItem => ({
        sNo,
        purpose: '',
        supportMode: 'ONLINE',
        supportedBy: '',
        startDate: '',
        endDate: '',
    });

    const resetForm = () => {
        setProjectId('');
        setProjectName('');
        setProjectStartDate('');
        setProjectCompletionDate('');
        setItems([
            createEmptyRow(1),
            createEmptyRow(2),
            createEmptyRow(3),
        ]);
    };

    const handleProjectSelect = (selectedId: string) => {
        setProjectId(selectedId);
        if (selectedId) {
            const proj = projects.find((p: any) => p.id === selectedId);
            if (proj) {
                setProjectName(proj.name);
            }
        }
    };

    const handleRowChange = (index: number, field: keyof FormRowItem, value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const handleAddRow = () => {
        setItems((prev) => [...prev, createEmptyRow(prev.length + 1)]);
    };

    const handleRemoveRow = (index: number) => {
        if (items.length <= 1) return;
        const newItems = items
            .filter((_, i) => i !== index)
            .map((item, idx) => ({ ...item, sNo: idx + 1 }));
        setItems(newItems);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!projectName.trim()) {
            alert('Please specify a Project Name');
            return;
        }

        // Clean items
        const validItems = items
            .filter((it) => it.purpose.trim() !== '' || it.supportedBy.trim() !== '')
            .map((it, idx) => ({
                sNo: idx + 1,
                purpose: it.purpose || 'N/A',
                supportMode: it.supportMode,
                supportedBy: it.supportedBy || 'N/A',
                startDate: it.startDate ? new Date(it.startDate).toISOString() : undefined,
                endDate: it.endDate ? new Date(it.endDate).toISOString() : undefined,
            }));

        try {
            if (mode === 'create') {
                await createMutation.mutateAsync({
                    projectName,
                    projectId: projectId || undefined,
                    projectStartDate: projectStartDate ? new Date(projectStartDate).toISOString() : undefined,
                    projectCompletionDate: projectCompletionDate
                        ? new Date(projectCompletionDate).toISOString()
                        : undefined,
                    items: validItems,
                });
            } else if (mode === 'edit' && supportFormId) {
                await updateMutation.mutateAsync({
                    id: supportFormId,
                    payload: {
                        projectName,
                        projectId: projectId || undefined,
                        projectStartDate: projectStartDate
                            ? new Date(projectStartDate).toISOString()
                            : undefined,
                        projectCompletionDate: projectCompletionDate
                            ? new Date(projectCompletionDate).toISOString()
                            : undefined,
                        items: validItems,
                    },
                });
            }
            onClose();
        } catch (error: any) {
            console.error('Failed to save support form:', error);
            alert(error?.response?.data?.message || 'Failed to save support form');
        }
    };

    const handleDelete = async () => {
        if (!supportFormId) return;
        try {
            await deleteMutation.mutateAsync(supportFormId);
            setShowDeleteConfirm(false);
            onClose();
        } catch (error: any) {
            console.error('Failed to soft delete support form:', error);
            alert(error?.response?.data?.message || 'Failed to delete support form');
        }
    };

    const handlePrint = () => {
        const iframe = document.createElement('iframe');
        iframe.setAttribute('aria-hidden', 'true');
        Object.assign(iframe.style, {
            position: 'fixed',
            left: '-10000px',
            top: '0',
            width: '210mm',
            height: '297mm',
            border: '0',
        });
        document.body.appendChild(iframe);

        const frameWindow = iframe.contentWindow;
        const frameDoc = iframe.contentDocument || frameWindow?.document;
        if (!frameWindow || !frameDoc) {
            iframe.remove();
            return;
        }

        frameDoc.open();
        frameDoc.write(
            buildSupportFormPrintDocument({
                projectName,
                projectStartDate,
                projectCompletionDate,
                items,
                rowCount: Math.max(10, items.length),
            })
        );
        frameDoc.close();

        const previousTitle = document.title;
        document.title = ' ';
        frameDoc.title = '';

        const cleanup = () => {
            document.title = previousTitle;
            iframe.remove();
        };

        frameWindow.addEventListener('afterprint', cleanup, { once: true });

        window.setTimeout(() => {
            frameWindow.focus();
            frameWindow.print();
        }, 250);
    };

    if (!isOpen) return null;

    const isSubmitting = createMutation.isPending || updateMutation.isPending;
    const isDeleting = deleteMutation.isPending;

    // Minimum 10 rows for print layout to match specimen
    const printRowsCount = Math.max(10, items.length);

    // Specimen Document Component
    const renderSpecimenTable = () => (
        <div className="bg-white p-6 w-full text-slate-900 font-sans rounded-xl border border-gray-200 shadow-sm max-w-4xl mx-auto">
            {/* Specimen Header */}
            <div className="flex items-center justify-between border-b-2 border-[#091590] pb-3 mb-4">
                <div className="flex items-center gap-2">
                    <div className="font-extrabold text-base text-[#091590] tracking-tight flex items-center gap-1.5">
                        <span className="bg-[#091590] text-white px-2 py-0.5 rounded font-black text-xs">TESLEAD</span>
                        <span className="text-[10px] text-[#091590] font-bold tracking-wider uppercase">TECHNOLOGY SOLUTIONS</span>
                    </div>
                </div>
                <h1 className="text-base font-black text-[#091590] uppercase tracking-wide text-center">
                    ONLINE / ONSITE SUPPORT FORM
                </h1>
                <div className="w-24"></div>
            </div>

            {/* Table 1: Top Metadata Table */}
            <div className="border border-[#091590] bg-white mb-5">
                <div className="grid grid-cols-3 border-b border-[#091590] bg-blue-100/90 divide-x divide-[#091590] text-center font-bold text-xs text-[#091590] py-1.5">
                    <div>Project Name</div>
                    <div>Project Start Date</div>
                    <div>Project Completion Date</div>
                </div>
                <div className="grid grid-cols-3 divide-x divide-[#091590] text-center text-xs font-semibold py-2">
                    <div className="px-2 truncate">{projectName || '—'}</div>
                    <div className="px-2">{projectStartDate || '—'}</div>
                    <div className="px-2">{projectCompletionDate || '—'}</div>
                </div>
            </div>

            {/* Table 2: Support Items Table */}
            <div className="border border-[#091590] bg-white">
                <table className="w-full border-collapse text-xs text-left">
                    <thead>
                        <tr className="bg-blue-100/90 text-[#091590] border-b border-[#091590] font-bold text-xs uppercase tracking-wider text-center">
                            <th className="border-r border-[#091590] px-2 py-2 w-12">S No</th>
                            <th className="border-r border-[#091590] px-3 py-2">Purpose</th>
                            <th className="border-r border-[#091590] px-2 py-2 w-32">Online / Onsite</th>
                            <th className="border-r border-[#091590] px-3 py-2 w-40">Supported By</th>
                            <th className="border-r border-[#091590] px-2 py-2 w-28">Start Date</th>
                            <th className="px-2 py-2 w-28">End Date</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#091590]">
                        {Array.from({ length: printRowsCount }).map((_, idx) => {
                            const row = items[idx];
                            return (
                                <tr key={idx} className="h-8">
                                    <td className="border-r border-[#091590] px-2 py-1.5 text-center font-bold text-slate-800">
                                        {String(idx + 1).padStart(2, '0')}
                                    </td>
                                    <td className="border-r border-[#091590] px-3 py-1.5 font-medium">
                                        {row?.purpose || ''}
                                    </td>
                                    <td className="border-r border-[#091590] px-2 py-1.5 text-center font-semibold">
                                        {row?.supportMode || ''}
                                    </td>
                                    <td className="border-r border-[#091590] px-3 py-1.5 font-medium">
                                        {row?.supportedBy || ''}
                                    </td>
                                    <td className="border-r border-[#091590] px-2 py-1.5 text-center font-medium">
                                        {row?.startDate || ''}
                                    </td>
                                    <td className="px-2 py-1.5 text-center font-medium">
                                        {row?.endDate || ''}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
            {/* ═══════════════════════════════════════════════════════════════════════════ */}
            {/* INTERACTIVE POPUP MODAL (Displays strictly on screen, hidden in print)      */}
            {/* ═══════════════════════════════════════════════════════════════════════════ */}
            <div className="bg-white rounded-xl shadow-2xl border border-gray-100 w-full max-w-5xl overflow-hidden max-h-[92vh] flex flex-col">
                {/* Modal Top Header Bar */}
                <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-50 text-[#091590] p-2.5 rounded-xl border border-blue-100">
                            <ClipboardList className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 tracking-tight">
                                {mode === 'create'
                                    ? 'New Support Form'
                                    : mode === 'edit'
                                    ? 'Edit Support Form'
                                    : 'Support Form Preview'}
                            </h2>
                            <p className="text-xs text-gray-500 font-medium">
                                {mode === 'view' ? 'Formal Document Specimen Preview' : 'Online & Onsite Support Details'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {mode === 'view' && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => setMode('edit')}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-[#091590] bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors cursor-pointer"
                                >
                                    <Edit3 className="w-3.5 h-3.5" />
                                    Edit
                                </button>
                                <button
                                    type="button"
                                    onClick={handlePrint}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-[#091590] hover:bg-blue-900 rounded-md shadow-sm transition-all cursor-pointer"
                                >
                                    <Printer className="w-3.5 h-3.5" />
                                    Print
                                </button>
                            </>
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 p-2 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Modal Main Body */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/60">
                    {isFetching ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <Loader2 className="w-8 h-8 text-[#091590] animate-spin" />
                            <p className="text-xs font-semibold text-gray-500">Loading form details...</p>
                        </div>
                    ) : mode === 'view' ? (
                        /* VIEW MODE: Displays formal document specimen preview on screen */
                        <div className="space-y-4">
                            {renderSpecimenTable()}
                        </div>
                    ) : (
                        /* CREATE / EDIT MODE: Displays interactive input form */
                        <form id="support-form" onSubmit={handleSave} className="space-y-6">
                            {/* Section 1: Project Information */}
                            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                                <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                                    <FolderKanban className="w-4 h-4 text-[#091590]" />
                                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                                        Project Information
                                    </h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* Project Name Input */}
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-bold text-gray-700">
                                            Project Name <span className="text-red-500">*</span>
                                        </label>
                                        <div className="space-y-2">
                                            {projects.length > 0 && (
                                                <select
                                                    value={projectId}
                                                    onChange={(e) => handleProjectSelect(e.target.value)}
                                                    className="w-full text-xs font-medium border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#091590] bg-white text-gray-800"
                                                >
                                                    <option value="">-- Select Existing Project (Optional) --</option>
                                                    {projects.map((p: any) => (
                                                        <option key={p.id} value={p.id}>
                                                            {p.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            )}
                                            <input
                                                type="text"
                                                placeholder="Enter Project Name *"
                                                value={projectName}
                                                onChange={(e) => setProjectName(e.target.value)}
                                                required
                                                className="w-full text-xs font-semibold border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#091590] text-gray-900 bg-white"
                                            />
                                        </div>
                                    </div>

                                    {/* Project Start Date */}
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-bold text-gray-700">
                                            Project Start Date
                                        </label>
                                        <input
                                            type="date"
                                            value={projectStartDate}
                                            onChange={(e) => setProjectStartDate(e.target.value)}
                                            className="w-full text-xs font-medium border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#091590] text-gray-800 bg-white"
                                        />
                                    </div>

                                    {/* Project Completion Date */}
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-bold text-gray-700">
                                            Project Completion Date
                                        </label>
                                        <input
                                            type="date"
                                            value={projectCompletionDate}
                                            onChange={(e) => setProjectCompletionDate(e.target.value)}
                                            className="w-full text-xs font-medium border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#091590] text-gray-800 bg-white"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Support Items & Tasks */}
                            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                                    <div className="flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-[#091590]" />
                                        <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                                            Support Tasks & Schedule
                                        </h3>
                                    </div>
                                    <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full border border-gray-200">
                                        Rows: {items.length}
                                    </span>
                                </div>

                                {/* Items Dynamic Data Table */}
                                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-xs">
                                    <table className="w-full border-collapse text-left text-xs">
                                        <thead>
                                            <tr className="bg-slate-100/70 text-slate-700 font-bold border-b border-gray-200 uppercase tracking-wider text-[11px]">
                                                <th className="px-3 py-2.5 w-12 text-center">S.No</th>
                                                <th className="px-3 py-2.5">Purpose</th>
                                                <th className="px-3 py-2.5 w-36">Mode</th>
                                                <th className="px-3 py-2.5 w-48">Supported By</th>
                                                <th className="px-3 py-2.5 w-36">Start Date</th>
                                                <th className="px-3 py-2.5 w-36">End Date</th>
                                                <th className="px-2 py-2.5 w-10 text-center"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {items.map((row, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                                                    {/* S No */}
                                                    <td className="px-3 py-2 text-center font-bold text-gray-600 bg-gray-50/50">
                                                        {String(row.sNo).padStart(2, '0')}
                                                    </td>

                                                    {/* Purpose */}
                                                    <td className="p-2">
                                                        <input
                                                            type="text"
                                                            placeholder="Describe task purpose..."
                                                            value={row.purpose}
                                                            onChange={(e) =>
                                                                handleRowChange(idx, 'purpose', e.target.value)
                                                            }
                                                            className="w-full text-xs px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-[#091590] font-medium bg-white"
                                                        />
                                                    </td>

                                                    {/* Online / Onsite */}
                                                    <td className="p-2">
                                                        <select
                                                            value={row.supportMode}
                                                            onChange={(e) =>
                                                                handleRowChange(
                                                                    idx,
                                                                    'supportMode',
                                                                    e.target.value as SupportMode
                                                                )
                                                            }
                                                            className="w-full text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-[#091590] font-semibold bg-white"
                                                        >
                                                            <option value="ONLINE">ONLINE</option>
                                                            <option value="ONSITE">ONSITE</option>
                                                        </select>
                                                    </td>

                                                    {/* Supported By */}
                                                    <td className="p-2">
                                                        <input
                                                            type="text"
                                                            placeholder="Engineer / Assignee..."
                                                            value={row.supportedBy}
                                                            onChange={(e) =>
                                                                handleRowChange(idx, 'supportedBy', e.target.value)
                                                            }
                                                            className="w-full text-xs px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-[#091590] font-medium bg-white"
                                                        />
                                                    </td>

                                                    {/* Start Date */}
                                                    <td className="p-2">
                                                        <input
                                                            type="date"
                                                            value={row.startDate}
                                                            onChange={(e) =>
                                                                handleRowChange(idx, 'startDate', e.target.value)
                                                            }
                                                            className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-[#091590] font-medium bg-white"
                                                        />
                                                    </td>

                                                    {/* End Date */}
                                                    <td className="p-2">
                                                        <input
                                                            type="date"
                                                            value={row.endDate}
                                                            onChange={(e) =>
                                                                handleRowChange(idx, 'endDate', e.target.value)
                                                            }
                                                            className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-[#091590] font-medium bg-white"
                                                        />
                                                    </td>

                                                    {/* Action Remove */}
                                                    <td className="p-2 text-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveRow(idx)}
                                                            disabled={items.length <= 1}
                                                            className="text-gray-400 hover:text-red-600 disabled:opacity-30 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                                                            title="Remove row"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Table Add Row Controls */}
                                <div className="flex justify-between items-center pt-1">
                                    <button
                                        type="button"
                                        onClick={handleAddRow}
                                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#091590] bg-blue-50 border border-blue-200 px-3.5 py-2 rounded-lg hover:bg-blue-100 transition-all cursor-pointer shadow-xs"
                                    >
                                        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                                        Add Row
                                    </button>
                                </div>
                            </div>
                        </form>
                    )}
                </div>

                {/* Modal Footer Controls */}
                <div className="bg-white border-t border-gray-100 px-6 py-4 flex items-center justify-between flex-shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-all cursor-pointer"
                    >
                        {mode === 'view' ? 'Close' : 'Cancel'}
                    </button>

                    {mode !== 'view' && (
                        <div className="flex items-center gap-2">
                            <button
                                type="submit"
                                form="support-form"
                                disabled={isSubmitting}
                                className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-[#091590] hover:bg-blue-900 rounded-md shadow-md transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        {mode === 'create' ? 'Create Form' : 'Save Changes'}
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Soft Delete Confirmation Dialog */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-100 animate-in fade-in zoom-in duration-150">
                        <div className="flex items-center gap-3 text-red-600 mb-4">
                            <div className="p-3 bg-red-100 rounded-xl">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-gray-900">Soft Delete Support Form?</h3>
                                <p className="text-xs text-gray-500 font-medium">
                                    This form will be soft-deleted and removed from active lists.
                                </p>
                            </div>
                        </div>

                        <p className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-200 mb-6 font-medium">
                            Are you sure you want to delete <span className="font-bold text-gray-900">&quot;{projectName}&quot;</span>? You can access archived records if needed.
                        </p>

                        <div className="flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setShowDeleteConfirm(false)}
                                className="px-4 py-2 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                            >
                                {isDeleting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="w-4 h-4" />
                                        Delete Form
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
