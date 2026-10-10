import ExcelJS from 'exceljs';
import { format } from 'date-fns';
import type { Issue } from '@/types/issue';

const PRIORITY_LABELS: Record<number, string> = {
    1: 'P1-LOWEST',
    2: 'P2-LOW',
    3: 'MEDIUM',
    4: 'HIGH',
    5: 'CRITICAL',
};

function peopleNames(people?: Array<{ name?: string; email?: string }> | null): string {
    if (!people?.length) return '';
    return people.map((p) => p.name || p.email || '').filter(Boolean).join(', ');
}

function formatDateCell(value?: string | null): string {
    if (!value) return '';
    try {
        return format(new Date(value), 'dd-MM-yyyy');
    } catch {
        return String(value);
    }
}

export async function exportIssuesToExcel(issues: Issue[], filePrefix = 'issues') {
    if (!issues.length) {
        alert('No issues to export');
        return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Issues');

    worksheet.columns = [
        { header: 'S.No', key: 'sno', width: 8 },
        { header: 'Issue ID', key: 'issueId', width: 14 },
        { header: 'Title', key: 'title', width: 36 },
        { header: 'Type', key: 'type', width: 14 },
        { header: 'Phase', key: 'phase', width: 18 },
        { header: 'Task List', key: 'taskList', width: 22 },
        { header: 'Related Task', key: 'relatedTask', width: 28 },
        { header: 'Status', key: 'status', width: 16 },
        { header: 'Priority', key: 'priority', width: 14 },
        { header: 'Assignees', key: 'assignees', width: 28 },
        { header: 'Tested By', key: 'testers', width: 28 },
        { header: 'Created', key: 'createdAt', width: 14 },
        { header: 'Due', key: 'dueDate', width: 14 },
        { header: 'Description', key: 'description', width: 40 },
        { header: 'Severity', key: 'severity', width: 12 },
        { header: 'Project Name', key: 'projectName', width: 24 },
    ];

    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF091590' },
    };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    issues.forEach((issue, index) => {
        worksheet.addRow({
            sno: index + 1,
            issueId: issue.issueId || '',
            title: issue.title || '',
            type: issue.type || '',
            phase: issue.phaseName || '',
            taskList: issue.taskListName || '',
            relatedTask: issue.linkedTask?.title || '',
            status: issue.status?.name || '',
            priority: PRIORITY_LABELS[issue.priority] || String(issue.priority ?? ''),
            assignees: peopleNames(issue.assignees),
            testers: peopleNames(issue.testers),
            createdAt: formatDateCell(issue.createdAt),
            dueDate: formatDateCell(issue.dueDate),
            description: issue.description || '',
            severity: issue.severity || '',
            projectName: issue.projectName || '',
        });
    });

    worksheet.eachRow((row) => {
        row.eachCell((cell) => {
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' },
            };
        });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filePrefix}_${format(new Date(), 'dd-MM-yyyy')}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
}
