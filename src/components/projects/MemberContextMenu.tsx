import React, { useRef, useEffect } from 'react';
import { ProjectMember } from '@/types/project';
import { CheckSquare } from 'lucide-react';

interface MemberContextMenuProps {
    member: ProjectMember;
    x: number;
    y: number;
    onClose: () => void;
    onAssignTasks: (member: ProjectMember) => void;
}

export function MemberContextMenu({ member, x, y, onClose, onAssignTasks }: MemberContextMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        // Use mousedown to catch clicks before they trigger other things
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    // Ensure menu stays within viewport (basic implementation)
    // You might want to add window.innerHeight/Width checks here
    const style: React.CSSProperties = {
        top: Math.min(y, window.innerHeight - 100), // Prevent going off bottom
        left: Math.min(x, window.innerWidth - 200), // Prevent going off right
    };

    return (
        <div
            ref={menuRef}
            className="fixed z-[9999] w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 animated fade-in"
            style={style}
        >
            <div className="px-3 py-2 border-b border-gray-100 mb-1 bg-gray-50/50 rounded-t-lg">
                <p className="text-xs font-semibold text-gray-900 truncate">{member.user.name}</p>
                <p className="text-[10px] text-gray-500 truncate uppercase tracking-wider">{member.role}</p>
            </div>

            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onAssignTasks(member);
                    onClose();
                }}
                className="w-full text-left px-3 py-2.5 text-xs font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2 transition-colors"
            >
                <CheckSquare className="w-3.5 h-3.5" />
                Assign Tasks
            </button>
        </div>
    );
}
