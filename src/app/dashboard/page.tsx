'use client';

import React, { useState, useMemo } from 'react';
import { useUser } from '@/hooks/use-auth';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { motion } from 'framer-motion';
import {
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
    CheckCircle2,
    Clock,
    TrendingUp,
    Users,
    Activity,
    GripVertical,
    BarChart3,
    PieChart as PieChartIcon,
    Calendar,
    ListTodo,
    Building2,
    Layers,
    ListChecks,
    AlertTriangle,
    Target,
    UserCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Loader } from '@/components/ui/Loader';
import {
    useDashboard,
    useDashboardMine,
    useTaskLists,
    useTaskListsMine,
    useDashboardUsers,
} from '@/hooks/use-analytics';
import type { TaskListItem, TaskListProject, LabelValue, PeriodValue } from '@/types/analytics';
import type { DashboardUser } from '@/types/analytics';

ModuleRegistry.registerModules([AllCommunityModule]);

// Vibrant palette for priority donut (Critical=red, High=orange, Medium=blue, Low=slate)
const PRIORITY_COLORS: Record<string, string> = {
    Critical: '#dc2626',
    High: '#ea580c',
    Medium: '#2563eb',
    Low: '#64748b',
    // API / backend label variants
    Urgent: '#dc2626',
    'Priority 1': '#dc2626',
    'Priority 2': '#ea580c',
    'Priority 3': '#2563eb',
    'Priority 4': '#64748b',
    'Priority 5': '#94a3b8',
};
// Fallback by index when label is unknown (red -> orange -> blue -> slate)
const PRIORITY_PALETTE = ['#dc2626', '#ea580c', '#2563eb', '#64748b'];

const STATUS_COLORS: Record<string, string> = {
    'To Do': '#6366f1',
    'In Progress': '#0ea5e9',
    Done: '#10b981',
    'Not Started': '#94a3b8',
};

const CHART_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#84cc16', '#f97316'];

const CARD_HEADER = ({ title, icon: Icon }: { title: string; icon: React.ElementType }) => (
    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50/80 to-white">
        <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-[#091590]/10 text-[#091590]">
                <Icon className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-gray-900 text-[11px] uppercase tracking-widest">{title}</h3>
        </div>
        <div className="p-1 rounded hover:bg-gray-100 text-gray-400 cursor-grab active:cursor-grabbing">
            <GripVertical className="w-4 h-4" />
        </div>
    </div>
);

export default function DashboardPage() {
    const { data: user } = useUser();
    const orgId = user?.currentOrgId || user?.memberships?.[0]?.orgId;
    const [scope, setScope] = useState<'org' | 'mine'>('mine');
    const [taskBucket, setTaskBucket] = useState<'all' | 'overdue' | 'due_soon' | 'due_today'>('due_soon');
    // widgetOrder kept for potential future reorderable layout
    const [isScrolled, setIsScrolled] = useState(false);

    const { data: dashboard, isLoading: loadingDashboard } = useDashboard(orgId);
    const { data: dashboardMine, isLoading: loadingMine } = useDashboardMine(orgId);
    const { data: taskListData, isLoading: loadingTasks } = useTaskLists(orgId, { bucket: taskBucket, limit: 25 });
    const { data: taskListMineData, isLoading: loadingMineTasks } = useTaskListsMine(orgId, { bucket: taskBucket, limit: 25 });
    const { data: usersData, isLoading: loadingUsers } = useDashboardUsers(orgId);

    const overview = scope === 'org' ? dashboard?.overview : dashboardMine?.overview;
    const ov = overview as any;
    const tasksByStatus: LabelValue[] = scope === 'org' ? (dashboard?.tasksByStatus ?? []) : (dashboardMine?.myTasksByStatus ?? []);
    const tasksByPriority: LabelValue[] = scope === 'org' ? (dashboard?.tasksByPriority ?? []) : (dashboardMine?.myTasksByPriority ?? []);
    const tasksByAssignee: LabelValue[] = dashboard?.tasksByAssignee ?? [];
    const myTasksByProject: LabelValue[] = dashboardMine?.myTasksByProject ?? [];
    const myTasksByDueBucket: LabelValue[] = dashboardMine?.myTasksByDueBucket ?? [];
    const taskDueByWeek: PeriodValue[] = dashboard?.taskDueCountByWeek ?? [];
    const taskListResponse = scope === 'org' ? taskListData : taskListMineData;
    const projects: TaskListProject[] = taskListResponse?.projects ?? [];
    const taskItems: TaskListItem[] = taskListResponse?.items ?? [];
    const users: DashboardUser[] = usersData?.users ?? [];

    const isLoading = scope === 'org' ? loadingDashboard : loadingMine;
    const isLoadingTasks = scope === 'org' ? loadingTasks : loadingMineTasks;

    React.useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const orgName = user?.memberships?.find(m => m.orgId === orgId)?.orgName || 'Organization';

    const totalProjects = scope === 'org' ? (ov?.totalProjects ?? 0) : (ov?.myProjectsCount ?? 0);
    const totalTasks = scope === 'org' ? (ov?.totalTasks ?? 0) : (ov?.myTasksAssigned ?? 0);
    const totalPhases = ov?.totalPhases ?? 0;
    const totalTaskLists = ov?.totalTaskLists ?? 0;
    const tasksCompleted = ov?.tasksCompleted ?? ov?.myTasksCompleted ?? 0;
    const tasksPending = ov?.tasksPending ?? ov?.myTasksPending ?? 0;
    const tasksOverdue = ov?.tasksOverdue ?? ov?.myTasksOverdue ?? 0;
    const tasksDueSoon = ov?.tasksDueSoon ?? ov?.myTasksDueSoon ?? 0;
    const tasksDueToday = ov?.tasksDueToday ?? ov?.myTasksDueToday ?? 0;
    const phasesEndingSoon = ov?.phasesEndingSoon ?? 0;
    const assignedUsersCount = ov?.assignedUsersCount ?? 0;
    const efficiency = totalTasks > 0 ? Math.round((tasksCompleted / totalTasks) * 100) : 0;

    const workloadChartData = useMemo(() => {
        if (scope === 'org' && taskDueByWeek.length) {
            return taskDueByWeek.map(({ period, value }, i) => {
                const short = period.replace(/^Week \d+ \(|\)$/g, '').trim();
                return { name: short || period, value, full: period, fill: CHART_COLORS[i % CHART_COLORS.length] };
            });
        }
        if (scope === 'mine' && myTasksByDueBucket.length) {
            return myTasksByDueBucket.map(({ label, value }, i) => ({
                name: label,
                value,
                full: label,
                fill: CHART_COLORS[i % CHART_COLORS.length],
            }));
        }
        return [];
    }, [scope, taskDueByWeek, myTasksByDueBucket]);

    const statusChartData = useMemo(
        () =>
            tasksByStatus.map(({ label, value }, i) => ({
                name: label,
                value,
                fill: STATUS_COLORS[label] || CHART_COLORS[i % CHART_COLORS.length],
            })),
        [tasksByStatus]
    );

    const priorityChartData = useMemo(
        () =>
            tasksByPriority.map(({ label, value }, i) => {
                const color =
                    PRIORITY_COLORS[label] ??
                    PRIORITY_COLORS[String(label).trim()] ??
                    PRIORITY_PALETTE[i % PRIORITY_PALETTE.length];
                return { name: label, value, color, fill: color };
            }),
        [tasksByPriority]
    );

    const assigneeChartData = useMemo(
        () =>
            tasksByAssignee.slice(0, 10).map(({ label, value }, i) => ({
                name: label.length > 12 ? label.slice(0, 12) + '…' : label,
                fullName: label,
                value,
                fill: CHART_COLORS[i % CHART_COLORS.length],
            })),
        [tasksByAssignee]
    );

    const myTasksByProjectChartData = useMemo(
        () =>
            myTasksByProject.map(({ label, value }, i) => ({
                name: label.length > 14 ? label.slice(0, 14) + '…' : label,
                fullName: label,
                value,
                fill: CHART_COLORS[i % CHART_COLORS.length],
            })),
        [myTasksByProject]
    );

    const kpiRows = useMemo(() => {
        if (scope === 'mine') {
            return [
                [
                    { label: 'My projects', value: totalProjects, icon: Building2, color: 'text-violet-600', bg: 'bg-violet-50' },
                    { label: 'My tasks', value: totalTasks, icon: ListTodo, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { label: 'Completed', value: tasksCompleted, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'In progress', value: tasksPending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
                ],
                [
                    { label: 'Overdue', value: tasksOverdue, icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50' },
                    { label: 'Due today', value: tasksDueToday, icon: Calendar, color: 'text-sky-600', bg: 'bg-sky-50' },
                    { label: 'Due soon', value: tasksDueSoon, icon: Target, color: 'text-orange-600', bg: 'bg-orange-50' },
                ],
                [
                    { label: 'My tasks', value: totalTasks, icon: ListTodo, color: 'text-gray-700', bg: 'bg-gray-100' },
                    { label: 'Efficiency', value: `${efficiency}%`, icon: TrendingUp, color: 'text-[#091590]', bg: 'bg-[#091590]/10' },
                ],
            ];
        }
        return [
            [
                { label: 'Projects', value: totalProjects, icon: Building2, color: 'text-violet-600', bg: 'bg-violet-50' },
                { label: 'Phases', value: totalPhases, icon: Layers, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                { label: 'Task lists', value: totalTaskLists, icon: ListChecks, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Team members', value: assignedUsersCount, icon: Users, color: 'text-cyan-600', bg: 'bg-cyan-50' },
            ],
            [
                { label: 'Completed', value: tasksCompleted, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'In progress', value: tasksPending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
                { label: 'Overdue', value: tasksOverdue, icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50' },
                { label: 'Due today', value: tasksDueToday, icon: Calendar, color: 'text-sky-600', bg: 'bg-sky-50' },
                { label: 'Due soon', value: tasksDueSoon, icon: Target, color: 'text-orange-600', bg: 'bg-orange-50' },
                { label: 'Phases ending soon', value: phasesEndingSoon, icon: Activity, color: 'text-fuchsia-600', bg: 'bg-fuchsia-50' },
            ],
            [
                { label: 'Total tasks', value: totalTasks, icon: ListTodo, color: 'text-gray-700', bg: 'bg-gray-100' },
                { label: 'Efficiency', value: `${efficiency}%`, icon: TrendingUp, color: 'text-[#091590]', bg: 'bg-[#091590]/10' },
            ],
        ];
    }, [scope, totalProjects, totalPhases, totalTaskLists, assignedUsersCount, tasksCompleted, tasksPending, tasksOverdue, tasksDueToday, tasksDueSoon, phasesEndingSoon, totalTasks, efficiency]);

    const colDefs: ColDef[] = useMemo(
        () => [
            { field: 'title', headerName: 'Task', flex: 1, minWidth: 200, cellClass: 'font-semibold text-gray-900 text-[12px]' },
            { field: 'projectName', headerName: 'Project', width: 140, cellClass: 'text-[11px] text-gray-600' },
            {
                field: 'statusName',
                headerName: 'Status',
                width: 120,
                cellRenderer: (p: any) => (
                    <div className="flex items-center h-full">
                        <span
                            className={cn(
                                'px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider',
                                /done|complete/i.test(String(p.value)) ? 'bg-emerald-100 text-emerald-700' :
                                    /progress/i.test(String(p.value)) ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                            )}
                        >
                            {p.value || '—'}
                        </span>
                    </div>
                ),
            },
            { field: 'priorityLabel', headerName: 'Priority', width: 90, cellClass: 'text-[11px]' },
            {
                field: 'dueDate',
                headerName: 'Due',
                width: 100,
                valueFormatter: (p) =>
                    p.value ? new Date(p.value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—',
                cellClass: 'text-[11px] text-gray-500',
            },
        ],
        []
    );

    const defaultColDef = useMemo(() => ({ sortable: true, filter: true, resizable: true }), []);

    const tooltipStyle = {
        borderRadius: 12,
        border: 'none',
        boxShadow: '0 12px 40px -10px rgba(0,0,0,0.2)',
        fontSize: 11,
        padding: '10px 14px',
    };

    return (
        <div className="min-h-screen bg-[#f1f5f9] pb-10">
            <div className="bg-white border-b border-gray-200 px-6 py-4 mb-6 shadow-sm">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        animate={{ opacity: isScrolled ? 0.95 : 1, y: isScrolled ? -2 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className="flex items-center gap-3 mb-1 flex-wrap">
                            <span className="px-2.5 py-1 bg-[#091590]/10 text-[#091590] text-[9px] font-black uppercase tracking-wider rounded">
                                Live
                            </span>
                            <span className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500">
                                <Calendar className="w-3.5 h-3.5" />
                                {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => setScope('mine')}
                                    className={cn(
                                        'px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors',
                                        scope === 'mine' ? 'bg-[#091590] text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                    )}
                                >
                                    <UserCheck className="w-3 h-3" /> Individual
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setScope('org')}
                                    className={cn(
                                        'px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors',
                                        scope === 'org' ? 'bg-[#091590] text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                    )}
                                >
                                    <Building2 className="w-3 h-3" /> Organization
                                </button>
                            </div>
                        </div>
                        <h1 className="text-xl font-black text-gray-900 tracking-tight">
                            {scope === 'mine' ? `Welcome back, ${user?.name?.split(' ')[0] || 'Member'}` : `${orgName} · Dashboard`}
                        </h1>
                    </motion.div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6">
                {!orgId ? (
                    <div className="flex items-center justify-center py-24 text-gray-500 font-medium">Select an organization to see analytics.</div>
                ) : isLoading && (scope === 'org' ? !dashboard : !dashboardMine) ? (
                    <div className="flex items-center justify-center py-24">
                        <Loader />
                    </div>
                ) : (
                    <>
                        {/* KPI counters - org owner view */}
                        <div className="space-y-4 mb-8">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {kpiRows[0].map((k, i) => (
                                    <motion.div
                                        key={k.label}
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.04 }}
                                        className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm"
                                    >
                                        <div className={cn('inline-flex p-2 rounded-lg mb-2', k.bg, k.color)}>
                                            <k.icon className="w-4 h-4" />
                                        </div>
                                        <p className="text-2xl font-black text-gray-900 tabular-nums">{k.value}</p>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{k.label}</p>
                                    </motion.div>
                                ))}
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                                {kpiRows[1].map((k, i) => (
                                    <motion.div
                                        key={k.label}
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.16 + i * 0.03 }}
                                        className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm"
                                    >
                                        <div className={cn('inline-flex p-1.5 rounded-lg', k.bg, k.color)}>
                                            <k.icon className="w-3.5 h-3.5" />
                                        </div>
                                        <p className="text-lg font-black text-gray-900 tabular-nums mt-1">{k.value}</p>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{k.label}</p>
                                    </motion.div>
                                ))}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {kpiRows[2].map((k, i) => (
                                    <motion.div
                                        key={k.label}
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.34 + i * 0.05 }}
                                        className="bg-white p-4 rounded-xl border-2 border-[#091590]/20 shadow-sm"
                                    >
                                        <div className={cn('inline-flex p-2 rounded-lg', k.bg, k.color)}>
                                            <k.icon className="w-4 h-4" />
                                        </div>
                                        <p className="text-2xl font-black text-gray-900 tabular-nums mt-1">{k.value}</p>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{k.label}</p>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* Charts row - colorful */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                <CARD_HEADER title={scope === 'mine' ? 'My tasks by status' : 'Tasks by status'} icon={Activity} />
                                <div className="h-[220px] p-4">
                                    {statusChartData.length === 0 ? (
                                        <div className="h-full flex items-center justify-center text-gray-400 text-sm">No data</div>
                                    ) : (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={statusChartData} layout="vertical" margin={{ left: 60, right: 8 }}>
                                                <XAxis type="number" hide />
                                                <YAxis type="category" dataKey="name" width={60} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                                                <Tooltip contentStyle={tooltipStyle} />
                                                <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={24}>
                                                    {statusChartData.map((entry, i) => (
                                                        <Cell key={i} fill={entry.fill} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            </div>

                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                <CARD_HEADER title={scope === 'mine' ? 'My tasks by due date' : 'Tasks due by week'} icon={BarChart3} />
                                <div className="h-[220px] p-4">
                                    {workloadChartData.length === 0 ? (
                                        <div className="h-full flex items-center justify-center text-gray-400 text-sm">No data</div>
                                    ) : (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={workloadChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                                                <defs>
                                                    {workloadChartData.map((_, i) => (
                                                        <linearGradient key={i} id={`workGrad-${i}`} x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="0%" stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={1} />
                                                            <stop offset="100%" stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0.5} />
                                                        </linearGradient>
                                                    ))}
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b' }} dy={8} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b' }} width={28} />
                                                <Tooltip contentStyle={tooltipStyle} formatter={(v: number, _n: string, props: any) => [v, props.payload?.full || '']} />
                                                <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={36}>
                                                    {workloadChartData.map((_, i) => (
                                                        <Cell key={i} fill={`url(#workGrad-${i})`} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            </div>

                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                <CARD_HEADER title={scope === 'mine' ? 'My tasks by priority' : 'Priority distribution'} icon={PieChartIcon} />
                                <div className="h-[220px] p-4">
                                    {priorityChartData.length === 0 ? (
                                        <div className="h-full flex items-center justify-center text-gray-400 text-sm">No data</div>
                                    ) : (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={priorityChartData}
                                                    innerRadius={48}
                                                    outerRadius={68}
                                                    paddingAngle={4}
                                                    dataKey="value"
                                                    nameKey="name"
                                                >
                                                    {priorityChartData.map((entry, i) => (
                                                        <Cell key={i} fill={entry.fill ?? entry.color} stroke="#fff" strokeWidth={2} />
                                                    ))}
                                                </Pie>
                                                <Tooltip contentStyle={tooltipStyle} />
                                                <Legend verticalAlign="bottom" height={36} iconSize={10} iconType="circle" wrapperStyle={{ fontSize: 10, fontWeight: 600 }} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Tasks by assignee (org) / My tasks by project (individual) + Team workload */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                <CARD_HEADER
                                    title={scope === 'mine' ? 'My tasks by project' : 'Tasks by assignee (top 10)'}
                                    icon={UserCheck}
                                />
                                <div className="h-[260px] p-4">
                                    {scope === 'mine' ? (
                                        myTasksByProjectChartData.length === 0 ? (
                                            <div className="h-full flex items-center justify-center text-gray-400 text-sm">No data</div>
                                        ) : (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={myTasksByProjectChartData} layout="vertical" margin={{ left: 8, right: 8 }}>
                                                    <XAxis type="number" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                                                    <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                                                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number, _n: string, props: any) => [v, props.payload?.fullName || '']} />
                                                    <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={20}>
                                                        {myTasksByProjectChartData.map((entry, i) => (
                                                            <Cell key={i} fill={entry.fill} />
                                                        ))}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        )
                                    ) : assigneeChartData.length === 0 ? (
                                        <div className="h-full flex items-center justify-center text-gray-400 text-sm">No data</div>
                                    ) : (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={assigneeChartData} layout="vertical" margin={{ left: 8, right: 8 }}>
                                                <XAxis type="number" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                                                <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                                                <Tooltip contentStyle={tooltipStyle} formatter={(v: number, _n: string, props: any) => [v, props.payload?.fullName || '']} />
                                                <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={20}>
                                                    {assigneeChartData.map((entry, i) => (
                                                        <Cell key={i} fill={entry.fill} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            </div>

                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                <CARD_HEADER title="All users · working tasks" icon={Users} />
                                <div className="p-4 max-h-[320px] overflow-y-auto">
                                    {loadingUsers ? (
                                        <div className="flex items-center justify-center py-12"><Loader /></div>
                                    ) : users.length === 0 ? (
                                        <div className="py-12 text-center text-gray-400 text-sm">No members</div>
                                    ) : (
                                        <ul className="space-y-2">
                                            {users.map((u, i) => {
                                                const pct = u.tasksAssignedCount > 0 ? Math.round((u.tasksCompleted / u.tasksAssignedCount) * 100) : 0;
                                                return (
                                                    <motion.li
                                                        key={u.userId || u.email}
                                                        initial={{ opacity: 0, x: -8 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: i * 0.03 }}
                                                        className="flex items-center justify-between gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-100"
                                                    >
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <div className="w-9 h-9 rounded-full bg-[#091590]/10 text-[#091590] flex items-center justify-center text-sm font-bold flex-shrink-0">
                                                                {u.name?.charAt(0)?.toUpperCase() || '?'}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-sm font-semibold text-gray-900 truncate">{u.name || u.email}</p>
                                                                <p className="text-[10px] text-gray-500 truncate">{u.email}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-4 flex-shrink-0">
                                                            <span className="text-[10px] font-bold text-gray-400 uppercase">Assigned</span>
                                                            <span className="text-sm font-black text-gray-900 tabular-nums w-6 text-right">{u.tasksAssignedCount}</span>
                                                            <span className="text-[10px] font-bold text-emerald-600 tabular-nums">Done {u.tasksCompleted}</span>
                                                            <span className="text-[10px] font-bold text-amber-600 tabular-nums">Pending {u.tasksPending}</span>
                                                            <span className="text-[10px] font-bold text-[#091590]">{pct}%</span>
                                                        </div>
                                                    </motion.li>
                                                );
                                            })}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Project pulse (org: all projects; individual: my projects from task list) */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
                            <CARD_HEADER title={scope === 'mine' ? 'My projects' : 'Project pulse'} icon={BarChart3} />
                            <div className="p-4">
                                {projects.length === 0 && !isLoadingTasks ? (
                                    <div className="py-8 text-center text-gray-400 text-sm">No projects</div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {projects.slice(0, 6).map((p, i) => {
                                            const total = p.taskCount || 1;
                                            const onTrack = Math.max(0, total - p.tasksOverdue - p.tasksDueSoon);
                                            const pct = Math.round((onTrack / total) * 100);
                                            return (
                                                <div key={p.id} className="p-4 rounded-xl border border-gray-100 bg-gradient-to-br from-gray-50 to-white space-y-2">
                                                    <div className="flex justify-between items-start">
                                                        <p className="text-sm font-bold text-gray-900 truncate">{p.name}</p>
                                                        <span className="text-xs font-black text-[#091590] tabular-nums">{pct}%</span>
                                                    </div>
                                                    <p className="text-[10px] text-gray-500">{p.taskCount} tasks · {p.tasksOverdue} overdue · {p.tasksDueSoon} due soon</p>
                                                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${pct}%` }}
                                                            transition={{ duration: 0.6, delay: i * 0.05 }}
                                                            className="h-full rounded-full bg-gradient-to-r from-[#091590] to-[#4f46e5]"
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Action items */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2 bg-gradient-to-r from-gray-50/80 to-white">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-1.5 rounded-lg bg-[#091590]/10 text-[#091590]">
                                        <ListTodo className="w-4 h-4" />
                                    </div>
                                    <h3 className="font-bold text-gray-900 text-[11px] uppercase tracking-widest">{scope === 'mine' ? 'My action items' : 'Action items'}</h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    {(['due_soon', 'overdue', 'due_today', 'all'] as const).map((b) => (
                                        <button
                                            key={b}
                                            onClick={() => setTaskBucket(b)}
                                            className={cn(
                                                'px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors',
                                                taskBucket === b ? 'bg-[#091590] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            )}
                                        >
                                            {b === 'due_soon' ? 'Due soon' : b === 'due_today' ? 'Today' : b === 'overdue' ? 'Overdue' : 'All'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="h-[380px] ag-theme-alpine">
                                {isLoadingTasks ? (
                                    <div className="h-full flex items-center justify-center"><Loader /></div>
                                ) : (
                                    <AgGridReact
                                        theme="legacy"
                                        rowData={taskItems}
                                        columnDefs={colDefs}
                                        defaultColDef={defaultColDef}
                                        rowHeight={44}
                                        headerHeight={38}
                                        animateRows={true}
                                    />
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
