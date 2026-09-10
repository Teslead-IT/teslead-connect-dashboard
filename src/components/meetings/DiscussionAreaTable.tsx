'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
    Plus,
    Trash2,
    User as UserIcon,
    Folder as FolderIcon,
    AtSign,
    Hash,
    ChevronDown,
    X,
    MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { meetingsApi, SuggestUserItem, SuggestProjectItem } from '@/services/meetings.service';

export interface DiscussionRow {
    id: string;
    sno: number;
    user: string;
    userId?: string;
    userIds?: string[];
    userItems?: Array<{ id: string; name: string }>;
    project: string;
    projectId?: string;
    discussionPoints: string;
    status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'RESOLVED' | 'CLOSED' | 'PENDING';
    remarks: string;
}

interface DiscussionAreaTableProps {
    content: any; // JSON or legacy TipTap JSON
    onChange: (jsonPayload: any) => void;
    readOnly?: boolean;
    userRole?: 'OWNER' | 'ADMIN' | 'MEMBER' | null;
    currentUserId?: string;
    currentUserName?: string;
}

const STATUS_OPTIONS = [
    { value: 'OPEN', label: 'Open', color: 'bg-amber-100 text-amber-800 border-amber-200' },
    { value: 'IN_PROGRESS', label: 'In Progress', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    { value: 'COMPLETED', label: 'Completed', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    { value: 'RESOLVED', label: 'Resolved', color: 'bg-teal-100 text-teal-800 border-teal-200' },
    { value: 'PENDING', label: 'Pending', color: 'bg-purple-100 text-purple-800 border-purple-200' },
    { value: 'CLOSED', label: 'Closed', color: 'bg-gray-100 text-gray-700 border-gray-200' },
] as const;

/**
 * Creates default empty row
 */
function createEmptyRow(sno: number): DiscussionRow {
    return {
        id: `row-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        sno,
        user: '',
        userId: undefined,
        userIds: undefined,
        userItems: undefined,
        project: '',
        projectId: undefined,
        discussionPoints: '',
        status: 'OPEN',
        remarks: '',
    };
}

/**
 * Parses incoming content prop into structured DiscussionRow[]
 */
function parseInitialRows(content: any): DiscussionRow[] {
    if (!content) {
        return [createEmptyRow(1)];
    }

    // New format: { type: 'discussionTable', rows: [...] }
    if (typeof content === 'object' && content.rows && Array.isArray(content.rows) && content.rows.length > 0) {
        return content.rows.map((r: any, idx: number) => ({
            id: r.id || `row-${idx + 1}`,
            sno: idx + 1,
            user: r.user || '',
            userId: r.userId,
            userIds: r.userIds,
            userItems: r.userItems,
            project: r.project || '',
            projectId: r.projectId,
            discussionPoints: r.discussionPoints || r.points || '',
            status: r.status || 'OPEN',
            remarks: r.remarks || '',
        }));
    }

    // Legacy format or plain text string
    if (typeof content === 'string' && content.trim()) {
        return [
            {
                id: 'row-legacy-1',
                sno: 1,
                user: '',
                project: '',
                discussionPoints: content,
                status: 'OPEN',
                remarks: '',
            },
        ];
    }

    // Legacy TipTap JSON doc
    if (typeof content === 'object' && content.type === 'doc' && Array.isArray(content.content)) {
        const textParts: string[] = [];
        const extractText = (node: any) => {
            if (!node) return;
            if (node.type === 'text' && node.text) textParts.push(node.text);
            if (node.type === 'mention' && node.attrs?.label) textParts.push(`@${node.attrs.label}`);
            if (node.type === 'projectMention' && node.attrs?.label) textParts.push(`#${node.attrs.label}`);
            if (Array.isArray(node.content)) node.content.forEach(extractText);
        };
        content.content.forEach(extractText);

        const fullText = textParts.join(' ').trim();
        if (fullText) {
            return [
                {
                    id: 'row-legacy-tiptap',
                    sno: 1,
                    user: '',
                    project: '',
                    discussionPoints: fullText,
                    status: 'OPEN',
                    remarks: '',
                },
            ];
        }
    }

    return [createEmptyRow(1)];
}

export function DiscussionAreaTable({
    content,
    onChange,
    readOnly = false,
    userRole = 'MEMBER',
    currentUserId,
    currentUserName,
}: DiscussionAreaTableProps) {
    const [rows, setRows] = useState<DiscussionRow[]>(() => parseInitialRows(content));

    const isOwner = userRole === 'OWNER';
    const isAdmin = userRole === 'ADMIN';

    // Track rows added during current editing session
    const [newlyAddedRowIds, setNewlyAddedRowIds] = useState<Set<string>>(new Set());

    // Mention suggestions popup states
    const [activeUserSearchRowId, setActiveUserSearchRowId] = useState<string | null>(null);
    const [userQuery, setUserQuery] = useState('');
    const [userSuggestions, setUserSuggestions] = useState<SuggestUserItem[]>([]);
    const [isUserLoading, setIsUserLoading] = useState(false);
    const [typedUserQuery, setTypedUserQuery] = useState<Record<string, string>>({});

    const [activeProjectSearchRowId, setActiveProjectSearchRowId] = useState<string | null>(null);
    const [projectQuery, setProjectQuery] = useState('');
    const [projectSuggestions, setProjectSuggestions] = useState<SuggestProjectItem[]>([]);
    const [isProjectLoading, setIsProjectLoading] = useState(false);
    const [typedProjectQuery, setTypedProjectQuery] = useState<Record<string, string>>({});

    // Position state to render popups fixed above overflow-hidden containers
    const [popupPos, setPopupPos] = useState<{ top: number; left: number; width: number; openAbove?: boolean } | null>(null);

    const isInternalUpdate = useRef(false);

    // Calculate fixed popup position from element bounds
    const calculatePopupPosition = (element: HTMLElement) => {
        const rect = element.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        
        // Open above if space below is limited or space above is sufficient
        const openAbove = spaceBelow < 260 || spaceAbove >= 220;

        setPopupPos({
            top: openAbove ? rect.top - 6 : rect.bottom + 6,
            left: rect.left,
            width: Math.max(rect.width, 280),
            openAbove,
        });
    };

    // Sync external content changes if not internal
    useEffect(() => {
        if (isInternalUpdate.current) {
            isInternalUpdate.current = false;
            return;
        }
        setRows(parseInitialRows(content));
    }, [content]);

    // Emit updated content payload whenever rows change
    const updateRowsAndNotify = (newRows: DiscussionRow[]) => {
        setRows(newRows);
        isInternalUpdate.current = true;

        // Filter out empty rows (where user, project, discussionPoints, and remarks are all blank)
        const validRows = newRows.filter(
            (r) => Boolean(r.user?.trim() || r.project?.trim() || r.discussionPoints?.trim() || r.remarks?.trim())
        );

        // Build list of mention nodes so backend extractMentions() finds ALL user and project mentions automatically
        const mentionNodes: any[] = [];
        validRows.forEach((r) => {
            if (r.userItems && r.userItems.length > 0) {
                r.userItems.forEach((u) => {
                    mentionNodes.push({
                        type: 'mention',
                        attrs: { id: u.id, label: u.name, entityType: 'USER' },
                    });
                });
            } else if (r.user) {
                const names = r.user.split(',').map((s) => s.trim()).filter(Boolean);
                const ids = r.userIds || (r.userId ? [r.userId] : []);
                names.forEach((name, i) => {
                    mentionNodes.push({
                        type: 'mention',
                        attrs: { id: ids[i] || ids[0] || `user-${name}`, label: name, entityType: 'USER' },
                    });
                });
            }

            if (r.projectId && r.project) {
                mentionNodes.push({
                    type: 'projectMention',
                    attrs: { id: r.projectId, label: r.project, entityType: 'PROJECT' },
                });
            }
        });

        const payload = {
            type: 'discussionTable',
            rows: validRows,
            // Standard TipTap doc representation so extractMentions & extractPlainText work natively on backend
            content: mentionNodes.length > 0 ? mentionNodes : undefined,
        };

        onChange(payload);
    };

    // User Suggestion fetch
    useEffect(() => {
        if (!activeUserSearchRowId) {
            setUserSuggestions([]);
            setIsUserLoading(false);
            return;
        }
        let isMounted = true;
        setIsUserLoading(true);
        meetingsApi.suggestUsers(userQuery).then((res) => {
            if (isMounted) {
                setUserSuggestions(res || []);
                setIsUserLoading(false);
            }
        }).catch(() => {
            if (isMounted) {
                setUserSuggestions([]);
                setIsUserLoading(false);
            }
        });
        return () => { isMounted = false; };
    }, [activeUserSearchRowId, userQuery]);

    // Project Suggestion fetch
    useEffect(() => {
        if (!activeProjectSearchRowId) {
            setProjectSuggestions([]);
            setIsProjectLoading(false);
            return;
        }
        let isMounted = true;
        setIsProjectLoading(true);
        meetingsApi.suggestProjects(projectQuery).then((res) => {
            if (isMounted) {
                setProjectSuggestions(res || []);
                setIsProjectLoading(false);
            }
        }).catch(() => {
            if (isMounted) {
                setProjectSuggestions([]);
                setIsProjectLoading(false);
            }
        });
        return () => { isMounted = false; };
    }, [activeProjectSearchRowId, projectQuery]);

    const isMentionedInRow = (row: DiscussionRow): boolean => {
        if (isOwner || isAdmin) return true;
        if (!currentUserId && !currentUserName) return false;

        if (currentUserId) {
            if (row.userId === currentUserId) return true;
            if (row.userIds && row.userIds.includes(currentUserId)) return true;
            if (row.userItems && row.userItems.some((it) => it.id === currentUserId)) return true;
        }

        if (currentUserName) {
            const cleanName = currentUserName.toLowerCase().trim();
            if (row.user && row.user.toLowerCase().includes(cleanName)) return true;
            if (row.userItems && row.userItems.some((it) => it.name.toLowerCase().includes(cleanName))) return true;
        }

        return false;
    };

    // Add Row
    const handleAddRow = () => {
        const nextSno = rows.length + 1;
        const newRow = createEmptyRow(nextSno);
        setNewlyAddedRowIds((prev) => new Set(prev).add(newRow.id));
        const newRows = [...rows, newRow];
        updateRowsAndNotify(newRows);
    };

    // Delete Row
    const handleDeleteRow = (index: number) => {
        if (rows.length <= 1) {
            // Keep at least one empty row
            const resetRows = [createEmptyRow(1)];
            updateRowsAndNotify(resetRows);
            return;
        }
        const updated = rows.filter((_, i) => i !== index).map((r, idx) => ({ ...r, sno: idx + 1 }));
        updateRowsAndNotify(updated);
    };

    // Row field change handler
    const handleRowChange = (index: number, field: keyof DiscussionRow, value: any) => {
        const updated = [...rows];
        updated[index] = { ...updated[index], [field]: value };
        updateRowsAndNotify(updated);
    };

    // Select User from mention popup (supports multi-user selection and mention tracking)
    const handleSelectUser = (index: number, userItem: SuggestUserItem) => {
        const updated = [...rows];
        const currentItem = updated[index];
        const existingItems: Array<{ id: string; name: string }> = currentItem.userItems
            ? [...currentItem.userItems]
            : currentItem.user
            ? currentItem.user.split(',').map((s) => s.trim()).filter(Boolean).map((n) => ({ id: currentItem.userId || `user-${n}`, name: n }))
            : [];

        const exists = existingItems.some((it) => it.id === userItem.id || it.name.toLowerCase() === userItem.name.toLowerCase());
        const newItems = exists ? existingItems : [...existingItems, { id: userItem.id, name: userItem.name }];

        const names = newItems.map((it) => it.name).join(', ');
        const ids = newItems.map((it) => it.id);

        updated[index] = {
            ...updated[index],
            user: names,
            userId: ids[0],
            userIds: ids,
            userItems: newItems,
        };
        setActiveUserSearchRowId(null);
        setPopupPos(null);
        setUserQuery('');
        setTypedUserQuery((prev) => ({ ...prev, [currentItem.id]: '' }));
        updateRowsAndNotify(updated);
    };

    // Remove single user item from row
    const handleRemoveUserItem = (rowIndex: number, userIndex: number) => {
        const updated = [...rows];
        const currentItem = updated[rowIndex];
        const currentItems = currentItem.userItems
            ? [...currentItem.userItems]
            : (currentItem.user ? currentItem.user.split(',').map((s) => s.trim()).filter(Boolean).map((n) => ({ id: currentItem.userId || `user-${n}`, name: n })) : []);

        currentItems.splice(userIndex, 1);

        const names = currentItems.map((it) => it.name).join(', ');
        const ids = currentItems.map((it) => it.id);

        updated[rowIndex] = {
            ...updated[rowIndex],
            user: names,
            userId: ids[0],
            userIds: ids,
            userItems: currentItems,
        };
        updateRowsAndNotify(updated);
    };

    // Select Project from mention popup
    const handleSelectProject = (index: number, projectItem: SuggestProjectItem) => {
        const updated = [...rows];
        const currentItem = updated[index];
        updated[index] = {
            ...updated[index],
            project: projectItem.name,
            projectId: projectItem.id,
        };
        setActiveProjectSearchRowId(null);
        setPopupPos(null);
        setProjectQuery('');
        setTypedProjectQuery((prev) => ({ ...prev, [currentItem.id]: '' }));
        updateRowsAndNotify(updated);
    };

    return (
        <div className="w-full space-y-3">
            {/* Table Container */}
            <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm flex flex-col">
                <div
                    className="overflow-x-auto overflow-y-auto max-h-[400px] min-h-[400px] relative scrollbar-thin"
                    onScroll={() => {
                        if (popupPos) {
                            setActiveUserSearchRowId(null);
                            setActiveProjectSearchRowId(null);
                            setPopupPos(null);
                        }
                    }}
                >
                    <table className="w-full text-left border-collapse min-w-[750px]">
                        {/* Table Header */}
                        <thead className="sticky top-0 z-20 bg-[#091590] shadow-2xs">
                            <tr className="bg-[#091590] text-white text-[11px] font-bold uppercase tracking-wider">
                                <th className="py-2.5 px-3 w-12 text-center border-r border-blue-900/40 sticky top-0 bg-[#091590]">S.No</th>
                                <th className="py-2.5 px-3 w-48 border-r border-blue-900/40 sticky top-0 bg-[#091590]">User</th>
                                <th className="py-2.5 px-3 w-48 border-r border-blue-900/40 sticky top-0 bg-[#091590]">Project</th>
                                <th className="py-2.5 px-3 min-w-[280px] border-r border-blue-900/40 sticky top-0 bg-[#091590]">
                                    Inspection & Discussion Points
                                </th>
                                <th className="py-2.5 px-3 w-36 border-r border-blue-900/40 sticky top-0 bg-[#091590]">Status</th>
                                <th className="py-2.5 px-3 w-44 border-r border-blue-900/40 sticky top-0 bg-[#091590]">Remarks</th>
                                {!readOnly && <th className="py-2.5 px-2 w-10 text-center sticky top-0 bg-[#091590]">Action</th>}
                            </tr>
                        </thead>

                        {/* Table Body */}
                        <tbody className="divide-y divide-gray-200 text-xs">
                            {rows.map((row, index) => {
                                const isNewlyAddedRow = newlyAddedRowIds.has(row.id);
                                const canEditFullRow = !readOnly && (isOwner || isNewlyAddedRow);
                                const canEditStatusRemark = !readOnly && (isOwner || isAdmin || isMentionedInRow(row) || isNewlyAddedRow);
                                const canDeleteThisRow = !readOnly && (isOwner || isNewlyAddedRow);

                                return (
                                    <tr key={row.id} className="hover:bg-blue-50/20 transition-colors group">
                                        {/* S.No */}
                                        <td className="py-2 px-3 text-center font-bold text-gray-500 bg-gray-50/50 align-top pt-3">
                                            {index + 1}
                                        </td>

                                        {/* User Column */}
                                        <td className="py-2 px-2 align-top relative">
                                            {!canEditFullRow ? (
                                                row.user ? (
                                                    <div className="flex flex-wrap gap-1" title={row.user}>
                                                        {row.user.split(',').map((u, i) => (
                                                            <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-semibold text-xs">
                                                                <AtSign className="w-3 h-3 text-amber-600" />
                                                                {u.trim()}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span title="No user assigned" className="text-gray-400 font-normal">-</span>
                                                )
                                            ) : (
                                                <div className="relative space-y-1.5">
                                                    {/* Selected User Tag Badges */}
                                                    {row.user && (
                                                        <div className="flex flex-wrap gap-1">
                                                            {row.user.split(',').map((u, uIdx) => {
                                                                const trimmed = u.trim();
                                                                if (!trimmed) return null;
                                                                return (
                                                                    <span key={uIdx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200 font-semibold text-[11px] shadow-2xs">
                                                                        <AtSign className="w-3 h-3 text-amber-600" />
                                                                        {trimmed}
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleRemoveUserItem(index, uIdx)}
                                                                            className="hover:bg-amber-200 rounded p-0.5 text-amber-700 hover:text-amber-900 transition-colors cursor-pointer"
                                                                            title="Remove mention"
                                                                        >
                                                                            <X className="w-2.5 h-2.5" />
                                                                        </button>
                                                                    </span>
                                                                );
                                                            })}
                                                        </div>
                                                    )}

                                                    <div className="flex items-center gap-1">
                                                        <input
                                                            type="text"
                                                            value={typedUserQuery[row.id] ?? ''}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                calculatePopupPosition(e.currentTarget);
                                                                setTypedUserQuery((prev) => ({ ...prev, [row.id]: val }));
                                                                setUserQuery(val.replace(/^@/, ''));
                                                                setActiveUserSearchRowId(row.id);
                                                                setActiveProjectSearchRowId(null);
                                                            }}
                                                            onFocus={(e) => {
                                                                calculatePopupPosition(e.currentTarget);
                                                                setActiveUserSearchRowId(row.id);
                                                                setUserQuery((typedUserQuery[row.id] ?? '').replace(/^@/, ''));
                                                                setActiveProjectSearchRowId(null);
                                                            }}
                                                            onKeyDown={(e) => {
                                                                if ((e.key === 'Enter' || e.key === ',') && typedUserQuery[row.id]?.trim()) {
                                                                    e.preventDefault();
                                                                    const customName = typedUserQuery[row.id].replace(/^@/, '').replace(/,$/, '').trim();
                                                                    if (customName) {
                                                                        handleSelectUser(index, { id: `custom-${Date.now()}`, name: customName, email: '' });
                                                                    }
                                                                }
                                                            }}
                                                            placeholder={row.user ? "+ Add another @user..." : "Type @user name..."}
                                                            className={cn(
                                                                "w-full px-2.5 py-1.5 rounded-lg border text-xs font-medium focus:outline-none focus:ring-2 transition-all",
                                                                row.userId || (row.userItems && row.userItems.length > 0)
                                                                    ? "border-amber-300 bg-white text-gray-900 focus:ring-amber-400 font-medium"
                                                                    : "border-gray-200 bg-white text-gray-900 focus:border-[#091590] focus:ring-blue-100"
                                                            )}
                                                        />
                                                        {(row.user || typedUserQuery[row.id]) && (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    handleRowChange(index, 'user', '');
                                                                    handleRowChange(index, 'userId', undefined);
                                                                    handleRowChange(index, 'userIds', undefined);
                                                                    handleRowChange(index, 'userItems', undefined);
                                                                    setTypedUserQuery((prev) => ({ ...prev, [row.id]: '' }));
                                                                }}
                                                                className="text-gray-400 hover:text-red-500 p-0.5 cursor-pointer"
                                                                title="Clear all users"
                                                            >
                                                                <X className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                    </div>

                                                    {/* User Mention Suggestions Popup */}
                                                    {activeUserSearchRowId === row.id && popupPos && (
                                                        <>
                                                            <div
                                                                className="fixed inset-0 z-[99990]"
                                                                onClick={() => {
                                                                    setActiveUserSearchRowId(null);
                                                                    setPopupPos(null);
                                                                }}
                                                            />
                                                            <div
                                                                className="fixed bg-white border border-gray-200 rounded-xl shadow-2xl z-[99999] overflow-hidden max-h-60 overflow-y-auto"
                                                                style={{
                                                                    top: popupPos.top,
                                                                    left: popupPos.left,
                                                                    width: popupPos.width,
                                                                    minWidth: '280px',
                                                                    transform: popupPos.openAbove ? 'translateY(-100%)' : 'none',
                                                                }}
                                                            >
                                                                <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center justify-between">
                                                                    <span>Select User (@)</span>
                                                                    <AtSign className="w-3.5 h-3.5 text-amber-600" />
                                                                </div>
                                                                {isUserLoading ? (
                                                                    <div className="p-4 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
                                                                        <div className="w-3.5 h-3.5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                                                                        <span>Loading users...</span>
                                                                    </div>
                                                                ) : userSuggestions.length === 0 ? (
                                                                    <div className="p-4 text-center text-xs text-gray-400">
                                                                        No matching users found
                                                                    </div>
                                                                ) : (
                                                                    userSuggestions.map((u) => {
                                                                        const isAlreadyAdded = (row.userItems || []).some(
                                                                            (it) => it.id === u.id || it.name.toLowerCase() === u.name.toLowerCase()
                                                                        );
                                                                        return (
                                                                            <button
                                                                                key={u.id}
                                                                                type="button"
                                                                                onClick={() => handleSelectUser(index, u)}
                                                                                className={cn(
                                                                                    "w-full text-left px-3.5 py-2.5 flex items-center gap-3 transition-colors border-b border-gray-50 last:border-none",
                                                                                    isAlreadyAdded ? "bg-amber-50/70" : "hover:bg-amber-50 cursor-pointer"
                                                                                )}
                                                                            >
                                                                                <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center flex-shrink-0 border border-amber-300 shadow-2xs">
                                                                                    {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                                                                                </div>
                                                                                <div className="min-w-0 flex-1">
                                                                                    <p className="text-xs font-bold text-gray-900 truncate">{u.name}</p>
                                                                                    {u.email && <p className="text-[10px] text-gray-500 truncate">{u.email}</p>}
                                                                                </div>
                                                                                {isAlreadyAdded && (
                                                                                    <span className="text-[9px] font-extrabold text-amber-700 bg-amber-200/60 px-1.5 py-0.5 rounded uppercase">
                                                                                        Added
                                                                                    </span>
                                                                                )}
                                                                            </button>
                                                                        );
                                                                    })
                                                                )}
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </td>

                                        {/* Project Column */}
                                        <td className="py-2 px-2 align-top relative">
                                            {!canEditFullRow ? (
                                                row.project ? (
                                                    <span title={row.project} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold text-xs">
                                                        <Hash className="w-3 h-3 text-emerald-600" />
                                                        {row.project}
                                                    </span>
                                                ) : (
                                                    <span title="No project assigned" className="text-gray-400 font-normal">-</span>
                                                )
                                            ) : (
                                                <div className="relative">
                                                    <div className="flex items-center gap-1">
                                                        <input
                                                            type="text"
                                                            value={typedProjectQuery[row.id] ?? row.project ?? ''}
                                                            title={row.project}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                calculatePopupPosition(e.currentTarget);
                                                                setTypedProjectQuery((prev) => ({ ...prev, [row.id]: val }));
                                                                handleRowChange(index, 'project', val);
                                                                handleRowChange(index, 'projectId', undefined);
                                                                setProjectQuery(val.replace(/^[#@]/, ''));
                                                                setActiveProjectSearchRowId(row.id);
                                                                setActiveUserSearchRowId(null);
                                                            }}
                                                            onFocus={(e) => {
                                                                calculatePopupPosition(e.currentTarget);
                                                                setActiveProjectSearchRowId(row.id);
                                                                setProjectQuery((typedProjectQuery[row.id] ?? row.project ?? '').replace(/^[#@]/, ''));
                                                                setActiveUserSearchRowId(null);
                                                            }}
                                                            placeholder="Type #project name..."
                                                            className={cn(
                                                                "w-full px-2.5 py-1.5 rounded-lg border text-xs font-medium focus:outline-none focus:ring-2 transition-all",
                                                                row.projectId
                                                                    ? "border-emerald-300 bg-emerald-50/60 text-emerald-900 font-bold focus:ring-emerald-400"
                                                                    : "border-gray-200 bg-white text-gray-900 focus:border-[#091590] focus:ring-blue-100"
                                                            )}
                                                        />
                                                        {row.project && (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    handleRowChange(index, 'project', '');
                                                                    handleRowChange(index, 'projectId', undefined);
                                                                    setTypedProjectQuery((prev) => ({ ...prev, [row.id]: '' }));
                                                                }}
                                                                className="text-gray-400 hover:text-red-500 p-0.5"
                                                            >
                                                                <X className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                    </div>

                                                    {/* Project Mention Suggestions Popup */}
                                                    {activeProjectSearchRowId === row.id && popupPos && (
                                                        <>
                                                            <div
                                                                className="fixed inset-0 z-[99990]"
                                                                onClick={() => {
                                                                    setActiveProjectSearchRowId(null);
                                                                    setPopupPos(null);
                                                                }}
                                                            />
                                                            <div
                                                                className="fixed bg-white border border-gray-200 rounded-xl shadow-2xl z-[99999] overflow-hidden max-h-60 overflow-y-auto"
                                                                style={{
                                                                    top: popupPos.top,
                                                                    left: popupPos.left,
                                                                    width: popupPos.width,
                                                                    minWidth: '280px',
                                                                    transform: popupPos.openAbove ? 'translateY(-100%)' : 'none',
                                                                }}
                                                            >
                                                                <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center justify-between">
                                                                    <span>Select Project (#)</span>
                                                                    <Hash className="w-3.5 h-3.5 text-emerald-600" />
                                                                </div>
                                                                {isProjectLoading ? (
                                                                    <div className="p-4 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
                                                                        <div className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                                                                        <span>Loading projects...</span>
                                                                    </div>
                                                                ) : projectSuggestions.length === 0 ? (
                                                                    <div className="p-4 text-center text-xs text-gray-400">
                                                                        No matching projects found
                                                                    </div>
                                                                ) : (
                                                                    projectSuggestions.map((p) => (
                                                                        <button
                                                                            key={p.id}
                                                                            type="button"
                                                                            onClick={() => handleSelectProject(index, p)}
                                                                            className="w-full text-left px-3.5 py-2.5 hover:bg-emerald-50 flex items-center gap-3 transition-colors border-b border-gray-50 last:border-none cursor-pointer"
                                                                        >
                                                                            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center flex-shrink-0 border border-emerald-300 shadow-2xs">
                                                                                <FolderIcon className="w-3.5 h-3.5" />
                                                                            </div>
                                                                            <div className="min-w-0 flex-1">
                                                                                <p className="text-xs font-bold text-gray-900 truncate">{p.name}</p>
                                                                            </div>
                                                                        </button>
                                                                    ))
                                                                )}
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </td>

                                        {/* Discussion Points Column */}
                                        <td className="py-2 px-2 align-top">
                                            {!canEditFullRow ? (
                                                <p title={row.discussionPoints} className="text-xs text-gray-900 whitespace-pre-wrap leading-relaxed py-1 px-1">
                                                    {row.discussionPoints || '-'}
                                                </p>
                                            ) : (
                                                <textarea
                                                    value={row.discussionPoints}
                                                    title={row.discussionPoints}
                                                    onChange={(e) => handleRowChange(index, 'discussionPoints', e.target.value)}
                                                    placeholder="Enter inspection & discussion details..."
                                                    rows={2}
                                                    className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-900 focus:border-[#091590] focus:ring-2 focus:ring-blue-100 text-xs font-medium outline-none transition-all resize-y min-h-[42px]"
                                                />
                                            )}
                                        </td>

                                        {/* Status Column */}
                                        <td className="py-2 px-2 align-top">
                                            {!canEditStatusRemark ? (
                                                <span
                                                    title={STATUS_OPTIONS.find((s) => s.value === row.status)?.label}
                                                    className={cn(
                                                        "inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border shadow-2xs mt-1",
                                                        STATUS_OPTIONS.find((s) => s.value === row.status)?.color ||
                                                        "bg-gray-100 text-gray-700 border-gray-200"
                                                    )}
                                                >
                                                    {STATUS_OPTIONS.find((s) => s.value === row.status)?.label || row.status}
                                                </span>
                                            ) : (
                                                <select
                                                    value={row.status}
                                                    title={STATUS_OPTIONS.find((s) => s.value === row.status)?.label}
                                                    onChange={(e) => handleRowChange(index, 'status', e.target.value)}
                                                    className={cn(
                                                        "w-full px-2 py-1.5 rounded-lg border text-xs font-bold focus:outline-none transition-all cursor-pointer",
                                                        STATUS_OPTIONS.find((s) => s.value === row.status)?.color ||
                                                        "bg-white border-gray-200 text-gray-900"
                                                    )}
                                                >
                                                    {STATUS_OPTIONS.map((opt) => (
                                                        <option key={opt.value} value={opt.value} className="bg-white text-gray-900 font-medium">
                                                            {opt.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            )}
                                        </td>

                                        {/* Remarks Column */}
                                        <td className="py-2 px-2 align-top">
                                            {!canEditStatusRemark ? (
                                                <p title={row.remarks} className="text-xs text-gray-600 py-1 px-1 mt-1">
                                                    {row.remarks || '-'}
                                                </p>
                                            ) : (
                                                <input
                                                    type="text"
                                                    value={row.remarks}
                                                    title={row.remarks}
                                                    onChange={(e) => handleRowChange(index, 'remarks', e.target.value)}
                                                    placeholder="Remarks / notes..."
                                                    className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-900 focus:border-[#091590] focus:ring-2 focus:ring-blue-100 text-xs font-medium outline-none transition-all"
                                                />
                                            )}
                                        </td>

                                        {/* Action Column */}
                                        {!readOnly && (
                                            <td className="py-2 px-2 text-center align-top pt-3">
                                                {canDeleteThisRow ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteRow(index)}
                                                        className="text-gray-300 hover:text-red-500 p-1 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                                        title="Delete row"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                ) : (
                                                    <span className="text-gray-300 text-xs font-bold cursor-default" title="Only Owner can delete existing rows">-</span>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Bottom Add Row Button (Fixed Footer) */}
                {!readOnly && (
                    <div className="p-2.5 bg-gray-50 border-t border-gray-200 flex items-center justify-between flex-shrink-0 z-10">
                       {isOwner && ( <button
                            type="button"
                            onClick={handleAddRow}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-blue-50 text-[#091590] border border-blue-200 hover:border-[#091590] font-bold text-xs rounded-lg transition-all shadow-2xs cursor-pointer"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Discussion Point Row</span>
                        </button> )}
                        <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                            Total Items: {rows.length}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
