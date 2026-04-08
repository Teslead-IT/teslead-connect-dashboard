/**
 * Attendance hooks. On boot fetch GET /attendance/today and set store. Cleared on org switch.
 * Backend returns AttendanceSession (checkIn, checkOut) and AttendanceBreak (startTime, endTime);
 * we map these to AttendanceToday (status, sessionStart, breakStart) for the store.
 */

import React from 'react';
import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOrgStore } from '@/stores/orgStore';
import { useAttendanceStore } from '@/stores/attendanceStore';
import { attendanceApi } from '@/services/attendance.service';
import type { CheckInPayload, StartBreakPayload, AttendanceToday, AttendanceMeResponse } from '@/types/attendance';
import type { AttendanceSessionResponse, AttendanceBreakResponse } from '@/types/attendance';

export const attendanceKeys = {
    today: (orgId: string | null) => ['attendance', 'today', orgId] as const,
    me: (orgId: string | null) => ['attendance', 'me', orgId] as const,
    user: (orgId: string | null, userId: string) => ['attendance', 'user', orgId, userId] as const,
};

function meToToday(me: AttendanceMeResponse): AttendanceToday {
    const apiStatus = (me.status ?? '').toLowerCase();
    const statusMap: Record<string, AttendanceToday['status']> = {
        checked_in: 'checked_in',
        on_break: 'on_break',
        on_lunch: 'on_lunch',
        lunch: 'on_lunch',
        break: 'on_break',
        checked_out: 'checked_out',
    };
    const status = statusMap[apiStatus] ?? 'not_checked_in';
    const session = me.session;
    const breakType = me.activeBreak?.type?.toUpperCase?.();
    const isLunch = breakType === 'LUNCH';
    return {
        status,
        sessionStart: session?.checkIn,
        breakStart: !isLunch ? me.activeBreak?.startTime : undefined,
        lunchStart: isLunch ? me.activeBreak?.startTime : undefined,
        checkedInAt: session?.checkIn,
    };
}

function sessionToToday(session: AttendanceSessionResponse | Record<string, unknown>): AttendanceToday {
    const checkOut = (session as { checkOut?: string | null; check_out?: string | null }).checkOut
        ?? (session as { checkOut?: string | null; check_out?: string | null }).check_out;
    const checkIn = (session as { checkIn?: string; check_in?: string }).checkIn
        ?? (session as { checkIn?: string; check_in?: string }).check_in;
    if (checkOut != null) {
        return { status: 'checked_out', sessionStart: checkIn, checkedOutAt: checkOut };
    }
    return { status: 'checked_in', sessionStart: checkIn, checkedInAt: checkIn };
}

export function useAttendanceToday() {
    const activeOrgId = useOrgStore((s) => s.activeOrgId);
    const setAttendance = useAttendanceStore((s) => s.setAttendance);

    return useQuery({
        queryKey: attendanceKeys.today(activeOrgId ?? null),
        queryFn: async () => {
            const data = await attendanceApi.getToday();
            const toSet = 'status' in data && data.status ? data : sessionToToday(data as unknown as AttendanceSessionResponse);
            setAttendance(toSet);
            return data;
        },
        enabled: !!activeOrgId,
        staleTime: 5 * 60 * 1000, // 5 minutes (maintain state across navigations)
        gcTime: 30 * 60 * 1000, // 30 minutes
        refetchOnWindowFocus: true,
    });
}

/** Fetches GET /attendance/me; falls back to getToday on 404 (legacy backend). */
export function useAttendanceMe() {
    const activeOrgId = useOrgStore((s) => s.activeOrgId);
    const setAttendance = useAttendanceStore((s) => s.setAttendance);

    return useQuery({
        queryKey: attendanceKeys.me(activeOrgId ?? null),
        queryFn: async () => {
            try {
                const data = await attendanceApi.getMe();
                setAttendance(meToToday(data));
                return data;
            } catch (e: unknown) {
                if ((e as { response?: { status?: number } })?.response?.status === 404) {
                    const today = await attendanceApi.getToday();
                    const toSet = 'status' in today && today.status ? today : sessionToToday(today as unknown as AttendanceSessionResponse);
                    setAttendance(toSet);
                    return { status: toSet.status === 'checked_in' ? 'checked_in' : toSet.status === 'on_break' ? 'on_break' : toSet.status === 'checked_out' ? 'checked_out' : null, session: null, activeBreak: null };
                }
                throw e;
            }
        },
        enabled: !!activeOrgId,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 30 * 60 * 1000, // 30 minutes
        refetchOnWindowFocus: true,
    });
}

/** Fetches GET /attendance/users/:userId for another user's attendance. */
export function useAttendanceUser(userId: string) {
    const activeOrgId = useOrgStore((s) => s.activeOrgId);

    return useQuery({
        queryKey: attendanceKeys.user(activeOrgId ?? null, userId),
        queryFn: () => attendanceApi.getUser(userId),
        enabled: !!activeOrgId && !!userId,
        staleTime: 30 * 1000,
    });
}

/** Fetches attendance for multiple users in parallel. Returns Map<userId, status>. */
export function useAttendanceForUsers(userIds: string[]) {
    const activeOrgId = useOrgStore((s) => s.activeOrgId);
    const queries = useQueries({
        queries: userIds.map((uid) => ({
            queryKey: attendanceKeys.user(activeOrgId ?? null, uid),
            queryFn: () => attendanceApi.getUser(uid),
            enabled: !!activeOrgId && !!uid,
            staleTime: 30 * 1000,
        })),
    });

    const statusMap = React.useMemo(() => {
        const map = new Map<string, 'checked_in' | 'on_break' | 'checked_out' | 'offline'>();
        userIds.forEach((uid, i) => {
            const q = queries[i];
            if (q?.data?.status) {
                const s = (q.data.status as string).toLowerCase();
                if (s === 'checked_in' || s === 'on_break' || s === 'on_lunch' || s === 'break' || s === 'lunch') {
                    map.set(uid, (s === 'lunch' ? 'on_lunch' : s === 'break' ? 'on_break' : s) as any);
                } else {
                    map.set(uid, 'checked_out');
                }
            } else {
                map.set(uid, 'offline');
            }
        });
        return map;
    }, [userIds, queries]);

    return statusMap;
}

export function useAttendanceCheckIn() {
    const queryClient = useQueryClient();
    const activeOrgId = useOrgStore((s) => s.activeOrgId);
    const setAttendance = useAttendanceStore((s) => s.setAttendance);

    return useMutation({
        mutationFn: (payload: CheckInPayload) => attendanceApi.checkIn(payload),
        onSuccess: (data: AttendanceSessionResponse) => {
            setAttendance(sessionToToday(data));
            queryClient.invalidateQueries({ queryKey: attendanceKeys.today(activeOrgId ?? null) });
            queryClient.invalidateQueries({ queryKey: attendanceKeys.me(activeOrgId ?? null) });
        },
    });
}

export function useAttendanceCheckOut() {
    const queryClient = useQueryClient();
    const activeOrgId = useOrgStore((s) => s.activeOrgId);
    const setAttendance = useAttendanceStore((s) => s.setAttendance);

    return useMutation({
        mutationFn: () => attendanceApi.checkOut(),
        onSuccess: (data: AttendanceSessionResponse) => {
            setAttendance(sessionToToday(data));
            queryClient.invalidateQueries({ queryKey: attendanceKeys.today(activeOrgId ?? null) });
            queryClient.invalidateQueries({ queryKey: attendanceKeys.me(activeOrgId ?? null) });
        },
    });
}

export function useAttendanceStartBreak() {
    const queryClient = useQueryClient();
    const activeOrgId = useOrgStore((s) => s.activeOrgId);
    const setAttendance = useAttendanceStore((s) => s.setAttendance);

    return useMutation({
        mutationFn: (payload: StartBreakPayload) => attendanceApi.startBreak(payload),
        onSuccess: (data: AttendanceBreakResponse, variables) => {
            const current = useAttendanceStore.getState();
            const isLunch = variables.type === 'LUNCH';
            setAttendance({
                status: isLunch ? 'on_lunch' : 'on_break',
                sessionStart: current.sessionStart ?? undefined,
                breakStart: !isLunch ? data.startTime : undefined,
                lunchStart: isLunch ? data.startTime : undefined,
            });
            queryClient.invalidateQueries({ queryKey: attendanceKeys.today(activeOrgId ?? null) });
            queryClient.invalidateQueries({ queryKey: attendanceKeys.me(activeOrgId ?? null) });
        },
    });
}

export function useAttendanceEndBreak() {
    const queryClient = useQueryClient();
    const activeOrgId = useOrgStore((s) => s.activeOrgId);
    const setAttendance = useAttendanceStore((s) => s.setAttendance);

    return useMutation({
        mutationFn: () => attendanceApi.endBreak(),
        onSuccess: () => {
            const current = useAttendanceStore.getState();
            setAttendance({
                status: 'checked_in',
                sessionStart: current.sessionStart ?? undefined,
            });
            queryClient.invalidateQueries({ queryKey: attendanceKeys.today(activeOrgId ?? null) });
            queryClient.invalidateQueries({ queryKey: attendanceKeys.me(activeOrgId ?? null) });
        },
    });
}
