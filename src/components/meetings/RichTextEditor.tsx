'use client';

import React, { useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import Placeholder from '@tiptap/extension-placeholder';
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
    Table as TableIcon,
    Minus,
} from 'lucide-react';

interface RichTextEditorProps {
    content: string;
    onChange: (html: string) => void;
    placeholder?: string;
}

export function RichTextEditor({ content, onChange, placeholder = 'Start typing your description...' }: RichTextEditorProps) {
    const isUpdatingRef = useRef(false);

    const editor = useEditor({
        immediatelyRender: false,
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
            Placeholder.configure({
                placeholder,
            }),
        ],
        content,
        onUpdate: ({ editor }) => {
            if (!isUpdatingRef.current) {
                onChange(editor.getHTML());
            }
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm max-w-none focus:outline-none min-h-[400px] p-5',
            },
        },
    });

    // Reset content when it changes externally
    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            isUpdatingRef.current = true;
            editor.commands.setContent(content);
            // Reset the flag after a small delay
            setTimeout(() => {
                isUpdatingRef.current = false;
            }, 0);
        }
    }, [content, editor]);

    if (!editor) {
        return null;
    }

    const ToolbarButton = ({ onClick, active, disabled, children, title }: any) => (
        <button
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
            {/* Toolbar */}
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

                {/* Insert Table - Commented out per user request */}
                {/* 
                <ToolbarButton
                    onClick={() =>
                        editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
                    }
                    title="Insert Table"
                >
                    <TableIcon className="w-4 h-4" />
                </ToolbarButton> 
                */}

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
            </div>

            {/* Editor */}
            <EditorContent editor={editor} />

            {/* Character Count */}
            <div className="bg-gray-50 border-t border-gray-200 px-4 py-2 text-xs text-gray-500 flex justify-between items-center">
                <span>{editor.getHTML().length} characters</span>
                <span className="text-[10px] text-gray-400 uppercase tracking-wide">
                    {/* COMMAND LINE: Rich Text Editor Canvas for Meeting Minutes Documentation */}
                    {/* COMMAND: Use toolbar above to format text */}
                    Use toolbar above to format text
                </span>
            </div>
        </div>
    );
}
