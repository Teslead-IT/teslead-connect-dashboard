'use client';

import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useEditor, EditorContent, ReactRenderer } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import Placeholder from '@tiptap/extension-placeholder';
import Mention from '@tiptap/extension-mention';
import { MentionList } from './MentionList';
import { meetingsApi } from '@/services/meetings.service';
import {
    Bold,
    Italic,
    List,
    ListOrdered,
    Heading1,
    Heading2,
    Quote,
    Undo,
    Redo,
    Minus,
    AtSign,
    Hash,
} from 'lucide-react';

interface RichTextEditorProps {
    content: any; // TipTap JSON or HTML string (backward compat)
    onChange: (json: any) => void; // Returns TipTap JSON
    placeholder?: string;
    highlightId?: string;
    readOnly?: boolean;
}

/**
 * Creates the suggestion configuration for TipTap Mention extension
 */
function createSuggestion(
    type: 'user' | 'project',
    fetchFn: (query: string) => Promise<any[]>
) {
    return {
        items: async ({ query }: { query: string }) => {
            try {
                const results = await fetchFn(query);
                return results.slice(0, 8);
            } catch (error) {
                console.error(`Failed to fetch ${type} suggestions:`, error);
                return [];
            }
        },
        render: () => {
            let component: ReactRenderer | null = null;
            let popup: HTMLDivElement | null = null;

            return {
                onStart: (props: any) => {
                    popup = document.createElement('div');
                    popup.style.position = 'absolute';
                    popup.style.zIndex = '99999';
                    document.body.appendChild(popup);

                    component = new ReactRenderer(MentionList, {
                        props: { ...props, type },
                        editor: props.editor,
                    });

                    if (popup && component.element) {
                        popup.appendChild(component.element);
                    }

                    // Position the popup near the cursor
                    const { clientRect } = props;
                    if (clientRect && popup) {
                        const rect = clientRect();
                        if (rect) {
                            popup.style.left = `${rect.left}px`;
                            popup.style.top = `${rect.bottom + 4}px`;
                        }
                    }
                },
                onUpdate: (props: any) => {
                    component?.updateProps({ ...props, type });

                    const { clientRect } = props;
                    if (clientRect && popup) {
                        const rect = clientRect();
                        if (rect) {
                            popup.style.left = `${rect.left}px`;
                            popup.style.top = `${rect.bottom + 4}px`;
                        }
                    }
                },
                onKeyDown: (props: any) => {
                    if (props.event.key === 'Escape') {
                        popup?.remove();
                        component?.destroy();
                        return true;
                    }
                    return (component?.ref as any)?.onKeyDown?.(props) ?? false;
                },
                onExit: () => {
                    popup?.remove();
                    component?.destroy();
                },
            };
        },
    };
}

export function RichTextEditor({
    content,
    onChange,
    placeholder = 'Start typing your description... Use @ to mention users and # to mention projects',
    highlightId,
    readOnly = false,
}: RichTextEditorProps) {
    const isUpdatingRef = useRef(false);

    const UserMention = Mention.configure({
        HTMLAttributes: { class: 'mention mention-user' },
        suggestion: createSuggestion('user', (q) => meetingsApi.suggestUsers(q)),
    });

    const ProjectMention = Mention.extend({
        name: 'projectMention',
        renderHTML({ node, HTMLAttributes }) {
            const isHighlighted = highlightId && node.attrs.id === highlightId;
            return [
                'span',
                {
                    ...this.options.HTMLAttributes,
                    ...HTMLAttributes,
                    class: cn(
                        this.options.HTMLAttributes?.class,
                        HTMLAttributes?.class,
                        isHighlighted && 'highlight-targeted'
                    ),
                },
                `#${node.attrs.label || node.attrs.id}`,
            ];
        },
    }).configure({
        HTMLAttributes: { class: 'mention mention-project' },
        suggestion: {
            ...createSuggestion('project', (q) => meetingsApi.suggestProjects(q)),
            char: '#',
            allowSpaces: true,
        },
    });

    const editor = useEditor({
        immediatelyRender: false,
        editable: !readOnly,
        extensions: [
            StarterKit,
            Table.configure({
                resizable: true,
                HTMLAttributes: {
                    class: 'border-collapse border border-gray-300 w-full',
                },
            }),
            TableRow,
            TableCell.configure({
                HTMLAttributes: {
                    class: 'border border-gray-300 p-2',
                },
            }),
            TableHeader.configure({
                HTMLAttributes: {
                    class: 'border border-gray-300 p-2 bg-gray-50 font-bold',
                },
            }),
            Placeholder.configure({ placeholder }),
            UserMention,
            ProjectMention,
        ],
        content,
        onUpdate: ({ editor }) => {
            if (!isUpdatingRef.current) {
                onChange(editor.getJSON());
            }
        },
        editorProps: {
            attributes: {
                class: cn(
                    'prose prose-sm max-w-none focus:outline-none min-h-[700px] p-5',
                    readOnly && 'bg-gray-50/10 cursor-default'
                ),
            },
        },
    });

    // Reset content when it changes externally
    useEffect(() => {
        if (editor && content) {
            const currentJson = JSON.stringify(editor.getJSON());
            const incomingJson = typeof content === 'string' ? content : JSON.stringify(content);

            if (currentJson !== incomingJson) {
                isUpdatingRef.current = true;
                editor.commands.setContent(content);
                setTimeout(() => {
                    isUpdatingRef.current = false;
                }, 0);
            }
        }
    }, [content, editor]);

    // Update editable state when readOnly prop changes
    useEffect(() => {
        if (editor) {
            editor.setEditable(!readOnly);
        }
    }, [readOnly, editor]);

    // Auto-scroll to highlighted mention and blink for 2 seconds then fade out
    useEffect(() => {
        if (!highlightId || !editor) return;

        // Scroll into view after a short delay
        const scrollTimer = setTimeout(() => {
            const el = document.querySelector('.highlight-targeted');
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 300);

        // Blink: toggle background every 500ms for 2 seconds (4 toggles)
        let blinkCount = 0;
        const blinkInterval = setInterval(() => {
            const els = document.querySelectorAll('.highlight-targeted');
            els.forEach(el => {
                const htmlEl = el as HTMLElement;
                if (blinkCount % 2 === 0) {
                    htmlEl.style.background = 'transparent';
                } else {
                    htmlEl.style.background = '#fef9c3';
                }
            });
            blinkCount++;
            if (blinkCount >= 4) {
                clearInterval(blinkInterval);
                // Restore yellow briefly before fade-out
                els.forEach(el => {
                    (el as HTMLElement).style.background = '#fef9c3';
                });
            }
        }, 500);

        // Remove highlight after 3 seconds total
        const removeTimer = setTimeout(() => {
            document.querySelectorAll('.highlight-targeted').forEach(el => {
                (el as HTMLElement).style.background = '';
                el.classList.add('highlight-fade-out');
                el.classList.remove('highlight-targeted');
            });
        }, 3000);

        return () => {
            clearTimeout(scrollTimer);
            clearInterval(blinkInterval);
            clearTimeout(removeTimer);
        };
    }, [highlightId, editor]);

    if (!editor) {
        return null;
    }

    const ToolbarButton = ({ onClick, active, disabled, children, title }: any) => (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed ${active
                ? 'bg-[#091590] text-white shadow-lg shadow-blue-900/20'
                : 'text-gray-500 hover:bg-white hover:text-[#091590] hover:shadow-sm'
                }`}
        >
            {children}
        </button>
    );

    return (
        <div className="border border-gray-100 rounded-[2rem] bg-white shadow-sm transition-all hover:shadow-md overflow-visible">
            {/* Mention Styles - professional chip design */}
            <style jsx global>{`
                .mention {
                    padding: 2px 8px;
                    border-radius: 6px;
                    font-weight: 600;
                    font-size: 0.8125rem;
                    cursor: default;
                    box-decoration-break: clone;
                    margin: 0 2px;
                    display: inline-flex;
                    align-items: center;
                    line-height: 1.35;
                    border: 1px solid transparent;
                    transition: box-shadow 0.15s ease, border-color 0.15s ease;
                }
                .mention:hover {
                    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
                }
                .mention-user {
                    background: linear-gradient(135deg, #fefce8 0%, #fef9c3 100%);
                    color: #854d0e;
                    border-color: #fde047;
                }
                .mention-user:hover {
                    border-color: #facc15;
                }
                .mention-project {
                    background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
                    color: #065f46;
                    border-color: #6ee7b7;
                    transition: all 0.2s ease;
                }
                .mention-project:hover {
                    border-color: #34d399;
                }
                .highlight-targeted {
                    background: linear-gradient(135deg, #fef9c3 0%, #fef08a 100%) !important;
                    color: #0f172a !important;
                    border-color: #fde047 !important;
                    box-shadow: 0 0 0 2px rgba(253, 224, 71, 0.35);
                }
                .highlight-fade-out {
                    background: transparent !important;
                    border-color: #e0e7ff !important;
                    transition: all 0.5s ease-out !important;
                }
            `}</style>

            {/* Toolbar */}
            {!readOnly && (
                <div className="bg-gray-50/50 backdrop-blur-sm border-b border-gray-100 p-3 flex flex-wrap items-center gap-1.5">
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        active={editor.isActive('bold')}
                        title="Bold"
                    >
                        <Bold className="w-4 h-4" />
                    </ToolbarButton>

                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        active={editor.isActive('italic')}
                        title="Italic"
                    >
                        <Italic className="w-4 h-4" />
                    </ToolbarButton>

                    <div className="w-px h-8 bg-gray-200/60 mx-1.5" />

                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                        active={editor.isActive('heading', { level: 1 })}
                        title="Heading 1"
                    >
                        <Heading1 className="w-4 h-4" />
                    </ToolbarButton>

                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                        active={editor.isActive('heading', { level: 2 })}
                        title="Heading 2"
                    >
                        <Heading2 className="w-4 h-4" />
                    </ToolbarButton>

                    <div className="w-px h-8 bg-gray-200/60 mx-1.5" />

                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        active={editor.isActive('bulletList')}
                        title="Bullet List"
                    >
                        <List className="w-4 h-4" />
                    </ToolbarButton>

                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        active={editor.isActive('orderedList')}
                        title="Numbered List"
                    >
                        <ListOrdered className="w-4 h-4" />
                    </ToolbarButton>

                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleBlockquote().run()}
                        active={editor.isActive('blockquote')}
                        title="Quote"
                    >
                        <Quote className="w-4 h-4" />
                    </ToolbarButton>

                    <div className="w-px h-8 bg-gray-200/60 mx-1.5" />

                    <ToolbarButton
                        onClick={() => editor.chain().focus().setHorizontalRule().run()}
                        title="Horizontal Line"
                    >
                        <Minus className="w-4 h-4" />
                    </ToolbarButton>

                    <div className="w-px h-8 bg-gray-200/60 mx-1.5" />

                    <ToolbarButton
                        onClick={() => editor.chain().focus().undo().run()}
                        disabled={!editor.can().undo()}
                        title="Undo"
                    >
                        <Undo className="w-4 h-4" />
                    </ToolbarButton>

                    <ToolbarButton
                        onClick={() => editor.chain().focus().redo().run()}
                        disabled={!editor.can().redo()}
                        title="Redo"
                    >
                        <Redo className="w-4 h-4" />
                    </ToolbarButton>

                    <div className="w-px h-8 bg-gray-200/60 mx-1.5" />

                    {/* Mention hints */}
                    <div className="ml-auto flex items-center gap-3 text-[11px] text-gray-500">
                        <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-gray-100/80 border border-gray-200/60">
                            <AtSign className="w-3.5 h-3.5 text-amber-600" />
                            <span className="font-medium">@ user</span>
                        </span>
                        <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-gray-100/80 border border-gray-200/60">
                            <Hash className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="font-medium"># project</span>
                        </span>
                    </div>
                </div>
            )}

            {/* Editor */}
            <EditorContent editor={editor} />

            {/* Footer */}
            {/* {!readOnly && (
                <div className="bg-gray-50 border-t border-gray-200 px-4 py-2 text-xs text-gray-500 flex justify-between items-center">
                    <span>Use toolbar above to format text</span>
                    <span className="text-[10px] text-gray-400 uppercase tracking-wide">
                        Type @ for users · # for projects
                    </span>
                </div>
            )} */}
        </div>
    );
}
