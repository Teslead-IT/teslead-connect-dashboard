'use client';

import React, { useState, useMemo } from 'react';
import { useUser } from '@/hooks/use-auth';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { Reorder, motion } from 'framer-motion';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
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
    Search,
    Bell,
    Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Register AG-Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

// ==================== MOCK DATA ====================
const WORKLOAD_DATA = [
    { name: 'Mon', tasks: 12, completed: 8 },
    { name: 'Tue', tasks: 19, completed: 15 },
    { name: 'Wed', tasks: 15, completed: 12 },
    { name: 'Thu', tasks: 22, completed: 18 },
    { name: 'Fri', tasks: 30, completed: 25 },
    { name: 'Sat', tasks: 10, completed: 9 },
    { name: 'Sun', tasks: 8, completed: 7 },
];

const PRIORITY_DATA = [
    { name: 'Critical', value: 5, color: '#ef4444' },
    { name: 'High', value: 15, color: '#f97316' },
    { name: 'Medium', value: 25, color: '#091590' },
    { name: 'Low', value: 20, color: '#94a3b8' },
];

const PROJECT_DATA = [
    { name: 'Web Redesign', progress: 65, tasks: 24 },
    { name: 'Mobile App', progress: 40, tasks: 18 },
    { name: 'API Integr.', progress: 85, tasks: 12 },
    { name: 'SEO Audit', progress: 20, tasks: 8 },
];

const MOCK_TASKS = [
    { id: 'T-001', title: 'Update Landing Page', priority: 'High', status: 'In Progress', assignee: 'John Doe', dueDate: '2026-01-15' },
    { id: 'T-002', title: 'Fix Login Bug', priority: 'Critical', status: 'Open', assignee: 'Jane Smith', dueDate: '2026-01-12' },
    { id: 'T-003', title: 'Database Migration', priority: 'Medium', status: 'In Progress', assignee: 'Mike Chen', dueDate: '2026-01-20' },
    { id: 'T-004', title: 'API Documentation', priority: 'Low', status: 'Completed', assignee: 'Sarah Johnson', dueDate: '2026-01-10' },
    { id: 'T-005', title: 'Security Audit', priority: 'High', status: 'Open', assignee: 'David Park', dueDate: '2026-01-18' },
];

// ==================== WIDGET COMPONENTS ====================

const CardHeader = ({ title, icon: Icon }: { title: string, icon: any }) => (
    <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between cursor-default bg-gray-50/50">
        <div className="flex items-center gap-2">
            <div className="p-1 bg-blue-50 rounded text-[#091590]">
                <Icon className="w-3.5 h-3.5" />
            </div>
            <h3 className="font-bold text-gray-900 text-[12px] uppercase tracking-wider">{title}</h3>
        </div>
        <div className="flex items-center gap-2">
            <button className="p-1 hover:bg-gray-100 rounded text-gray-400">
                <GripVertical className="w-3.5 h-3.5 cursor-grab active:cursor-grabbing" />
            </button>
        </div>
    </div>
);

export default function DashboardPage() {
    const { data: user } = useUser();
    const [widgetOrder, setWidgetOrder] = useState(['workload', 'priorities', 'projects', 'tasks']);
    const [isScrolled, setIsScrolled] = useState(false);

    React.useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const currentOrg = user?.memberships?.find(m => m.orgId === user.currentOrgId);
    const orgName = currentOrg?.orgName || 'Your Organization';

    const colDefs: ColDef[] = useMemo(() => [
        { field: 'id', headerName: 'ID', width: 70, cellClass: 'font-medium text-gray-500 text-[11px]' },
        { field: 'title', headerName: 'TASK NAME', flex: 1, cellClass: 'font-semibold text-gray-900 text-[12px]' },
        {
            field: 'status',
            headerName: 'STATUS',
            width: 110,
            cellRenderer: (p: any) => (
                <div className="flex items-center h-full">
                    <span className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                        p.value === 'Completed' ? "bg-green-100 text-green-700" :
                            p.value === 'In Progress' ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"
                    )}>
                        {p.value}
                    </span>
                </div>
            )
        },
        { field: 'priority', headerName: 'PRIORITY', width: 90, cellClass: 'text-[11px]' },
        { field: 'dueDate', headerName: 'DUE DATE', width: 100, cellClass: 'text-[11px] text-gray-500' }
    ], []);

    const defaultColDef = useMemo(() => ({
        sortable: true,
        filter: true,
        resizable: true,
    }), []);

    const widgets: Record<string, React.ReactNode> = {
        workload: (
            <div key="workload" className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <CardHeader title="Workload Activity" icon={Activity} />
                <div className="h-[220px] w-full p-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={WORKLOAD_DATA}>
                            <defs>
                                <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#091590" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#091590" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '11px' }}
                            />
                            <Area type="monotone" dataKey="tasks" stroke="#091590" strokeWidth={2} fillOpacity={1} fill="url(#colorTasks)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        ),
        priorities: (
            <div key="priorities" className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden text-center">
                <CardHeader title="Priority Distribution" icon={PieChartIcon} />
                <div className="h-[220px] w-full p-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={PRIORITY_DATA}
                                innerRadius={45}
                                outerRadius={65}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {PRIORITY_DATA.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                            <Legend verticalAlign="bottom" height={36} iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        ),
        projects: (
            <div key="projects" className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <CardHeader title="Project Pulse" icon={BarChart3} />
                <div className="p-4 space-y-4">
                    {PROJECT_DATA.map((p, i) => (
                        <div key={i} className="space-y-1.5">
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-[12px] font-bold text-gray-900 leading-none">{p.name}</p>
                                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-1">{p.tasks} tasks</p>
                                </div>
                                <span className="text-[11px] font-black text-[#091590]">{p.progress}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${p.progress}%` }}
                                    transition={{ duration: 1, delay: i * 0.1 }}
                                    className="h-full bg-[#091590] rounded-full"
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        ),
        tasks: (
            <div key="tasks" className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <CardHeader title="Action Items" icon={CheckCircle2} />
                <div className="h-[350px] ag-theme-alpine">
                    <AgGridReact
                        theme="legacy"
                        rowData={MOCK_TASKS}
                        columnDefs={colDefs}
                        defaultColDef={defaultColDef}
                        rowHeight={40}
                        headerHeight={34}
                        animateRows={true}
                    />
                </div>
            </div>
        )
    };

    return (
        <div className="min-h-screen bg-[#f3f4f6] pb-8">
            {/* Header Section */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 mb-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <motion.div
                            animate={{ opacity: isScrolled ? 0 : 1, y: isScrolled ? -10 : 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <span className="px-2 py-0.5 bg-blue-50 text-[#091590] text-[9px] font-black uppercase tracking-wider rounded">
                                    Live Performance
                                </span>
                                <span className="text-gray-200">|</span>
                                <span className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400">
                                    <Calendar className="w-3 h-3" />
                                    {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                            </div>
                            <h1 className="text-xl font-black text-gray-900 tracking-tight">
                                Welcome back, {user?.name?.split(' ')[0] || 'Member'}
                            </h1>
                        </motion.div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6">
                {/* Stats Row - Always fixed size/type for immediate context */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {[
                        { label: 'Completed', value: '154', trend: '+12%', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                        { label: 'In Progress', value: '42', trend: '+5%', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
                        { label: 'Efficiency', value: '94%', trend: '+2.4%', icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                        { label: 'Capacity', value: '88%', trend: '-3%', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
                    ].map((s, i) => (
                        <div key={i} className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm">
                            <div className="flex justify-between items-start mb-2">
                                <div className={cn("p-1.5 rounded-lg", s.bg, s.color)}>
                                    <s.icon className="w-4 h-4" />
                                </div>
                                <span className={cn("text-[10px] font-bold", s.trend.startsWith('+') ? "text-green-600" : "text-red-600")}>
                                    {s.trend}
                                </span>
                            </div>
                            <h4 className="text-lg font-black text-gray-900">{s.value}</h4>
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{s.label}</p>
                        </div>
                    ))}
                </div>

                {/* Reorderable Dashboard Grid */}
                <Reorder.Group
                    axis="y"
                    values={widgetOrder}
                    onReorder={setWidgetOrder}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-max"
                >
                    <Reorder.Item key="workload" value="workload" className="lg:col-span-2">
                        {widgets.workload}
                    </Reorder.Item>

                    <Reorder.Item key="priorities" value="priorities">
                        {widgets.priorities}
                    </Reorder.Item>

                    <Reorder.Item key="projects" value="projects">
                        {widgets.projects}
                    </Reorder.Item>

                    <Reorder.Item key="tasks" value="tasks" className="lg:col-span-2">
                        {widgets.tasks}
                    </Reorder.Item>
                </Reorder.Group>
            </div>
        </div>
    );
}
