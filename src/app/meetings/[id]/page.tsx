'use client';

import React from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { MeetingForm } from '@/components/meetings/MeetingForm';
import { ArrowLeft } from 'lucide-react';

export default function MeetingDetailPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();

    const rawId = params?.id as string;
    const isNew = rawId === 'new';
    const meetingId = isNew ? null : rawId;
    const dateParam = searchParams.get('date') || undefined;
    const highlightProjectId = searchParams.get('projectId') || undefined;

    return (
        <div className="h-full flex flex-col bg-white">
            {/* Top Navigation Bar with Back Button */}
            <div className="bg-white border-b border-gray-100 px-6 py-2.5 flex items-center justify-between flex-shrink-0">
                <button
                    type="button"
                    onClick={() => router.push('/meetings')}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-700 hover:text-[#091590] hover:bg-blue-50 transition-colors border border-gray-200 shadow-2xs cursor-pointer"
                >
                    <ArrowLeft className="w-4 h-4 text-[#091590]" />
                    <span>Back to Meetings</span>
                </button>
            </div>

            {/* Main Form Content */}
            <div className="flex-1 overflow-hidden">
                <MeetingForm
                    meetingId={meetingId}
                    defaultDate={dateParam}
                    highlightProjectId={highlightProjectId}
                    readOnly={false}
                    isEditing={isNew}
                    onCreated={(newMeeting) => {
                        router.replace(`/meetings/${newMeeting.id}`);
                    }}
                    onSaved={() => {
                        // Stay on current page
                    }}
                    onDeleted={() => {
                        router.push('/meetings');
                    }}
                    onCancel={() => {
                        router.push('/meetings');
                    }}
                />
            </div>
        </div>
    );
}

