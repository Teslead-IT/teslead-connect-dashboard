import ExcelJS from 'exceljs';
import { format } from 'date-fns';

export async function exportMomToExcel(meeting: any) {
    if (!meeting) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('MOM Report');

    // Setup page orientation for printing
    worksheet.pageSetup.orientation = 'landscape';
    worksheet.pageSetup.fitToPage = true;
    worksheet.pageSetup.fitToWidth = 1;

    // Set Column Widths (6 Columns total)
    worksheet.getColumn(1).width = 8;   // SNO
    worksheet.getColumn(2).width = 45;  // INSPECTION & DISCUSSION POINTS
    worksheet.getColumn(3).width = 25;  // PROJECT
    worksheet.getColumn(4).width = 30;  // ASSIGNED TO
    worksheet.getColumn(5).width = 18;  // STATUS
    worksheet.getColumn(6).width = 25;  // REMARKS

    // Header Fill Styles
    const darkHeaderFill: ExcelJS.Fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF404040' },
    };

    const headerFont: Partial<ExcelJS.Font> = {
        name: 'Arial',
        bold: true,
        color: { argb: 'FFFFFFFF' },
        size: 10,
    };

    const valueFont: Partial<ExcelJS.Font> = {
        name: 'Arial',
        bold: true,
        color: { argb: 'FF000000' },
        size: 10,
    };

    const borderStyle: Partial<ExcelJS.Borders> = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } },
    };

    // Row 2: NO OF PEOPLE | LOCATION | DATE (spanning A through F)
    worksheet.mergeCells('B2:D2');
    worksheet.mergeCells('E2:F2');

    worksheet.getCell('A2').value = 'NO OF PEOPLE';
    worksheet.getCell('B2').value = 'LOCATION';
    worksheet.getCell('E2').value = 'DATE';

    ['A2', 'B2', 'C2', 'D2', 'E2', 'F2'].forEach((cellRef) => {
        const cell = worksheet.getCell(cellRef);
        cell.fill = darkHeaderFill;
        cell.font = headerFont;
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = borderStyle;
    });

    // Row 3: Values for NO OF PEOPLE, LOCATION, DATE
    worksheet.mergeCells('B3:D3');
    worksheet.mergeCells('E3:F3');

    const formattedDate = meeting.meetingDate
        ? format(new Date(meeting.meetingDate), 'dd/MM/yy')
        : format(new Date(), 'dd/MM/yy');

    worksheet.getCell('A3').value = meeting.numberOfPeople || meeting.noOfPeople || 0;
    worksheet.getCell('B3').value = (meeting.location || 'N/A').toUpperCase();
    worksheet.getCell('E3').value = formattedDate;

    ['A3', 'B3', 'C3', 'D3', 'E3', 'F3'].forEach((cellRef) => {
        const cell = worksheet.getCell(cellRef);
        cell.font = valueFont;
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = borderStyle;
    });

    // Row 5: PURPOSE OF MEETING (Header)
    worksheet.mergeCells('A5:F5');
    const purposeHeader = worksheet.getCell('A5');
    purposeHeader.value = 'PURPOSE OF MEETING';
    purposeHeader.fill = darkHeaderFill;
    purposeHeader.font = headerFont;
    purposeHeader.alignment = { vertical: 'middle', horizontal: 'center' };

    for (let c = 1; c <= 6; c++) {
        worksheet.getCell(5, c).border = borderStyle;
        worksheet.getCell(5, c).fill = darkHeaderFill;
    }

    // Row 6: PURPOSE OF MEETING (Value)
    worksheet.mergeCells('A6:F6');
    const purposeValue = worksheet.getCell('A6');
    purposeValue.value = (meeting.purpose || 'INTERNAL MEETING').toUpperCase();
    purposeValue.font = valueFont;
    purposeValue.alignment = { vertical: 'middle', horizontal: 'center' };

    for (let c = 1; c <= 6; c++) {
        worksheet.getCell(6, c).border = borderStyle;
    }

    // Row 8: ATTENDED BY (Header)
    worksheet.mergeCells('A8:F8');
    const attendedHeader = worksheet.getCell('A8');
    attendedHeader.value = 'ATTENDED BY';
    attendedHeader.fill = darkHeaderFill;
    attendedHeader.font = headerFont;
    attendedHeader.alignment = { vertical: 'middle', horizontal: 'center' };

    for (let c = 1; c <= 6; c++) {
        worksheet.getCell(8, c).border = borderStyle;
        worksheet.getCell(8, c).fill = darkHeaderFill;
    }

    // Row 9: ATTENDED BY (Value)
    worksheet.mergeCells('A9:F9');
    const attendedValue = worksheet.getCell('A9');
    attendedValue.value = (meeting.attendedBy || 'N/A').toUpperCase();
    attendedValue.font = valueFont;
    attendedValue.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

    for (let c = 1; c <= 6; c++) {
        worksheet.getCell(9, c).border = borderStyle;
    }

    // Row 11: TABLE HEADERS (6 columns)
    const tableHeaders = ['SNO', 'INSPECTION & DISCUSSION POINTS', 'PROJECT', 'ASSIGNED TO', 'STATUS', 'REMARKS'];
    tableHeaders.forEach((th, idx) => {
        const cell = worksheet.getCell(11, idx + 1);
        cell.value = th;
        cell.fill = darkHeaderFill;
        cell.font = headerFont;
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = borderStyle;
    });

    // Extract Rows from meeting content
    let rows: any[] = [];
    if (meeting.content && typeof meeting.content === 'object' && Array.isArray(meeting.content.rows)) {
        rows = meeting.content.rows.filter((r: any) =>
            Boolean(r.user?.trim() || r.project?.trim() || r.discussionPoints?.trim() || r.remarks?.trim())
        );
    } else if (typeof meeting.content === 'string' && meeting.content.trim()) {
        rows = [{ sno: 1, discussionPoints: meeting.content, project: '', user: '', status: 'OPEN', remarks: '' }];
    }

    if (rows.length === 0) {
        rows = [{ sno: 1, discussionPoints: 'NO DISCUSSION POINTS RECORDED', project: 'N/A', user: 'N/A', status: 'N/A', remarks: '' }];
    }

    // Populate Table Rows starting at Row 12
    let currentRow = 12;
    rows.forEach((r, idx) => {
        const snoCell = worksheet.getCell(currentRow, 1);
        snoCell.value = idx + 1;
        snoCell.alignment = { vertical: 'middle', horizontal: 'center' };

        const pointsCell = worksheet.getCell(currentRow, 2);
        pointsCell.value = (r.discussionPoints || r.points || '').toUpperCase();
        pointsCell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };

        const projectCell = worksheet.getCell(currentRow, 3);
        projectCell.value = (r.project || '-').toUpperCase();
        projectCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

        const assignedCell = worksheet.getCell(currentRow, 4);
        assignedCell.value = (r.user || '-').toUpperCase();
        assignedCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

        const statusCell = worksheet.getCell(currentRow, 5);
        statusCell.value = (r.status || 'OPEN').toUpperCase();
        statusCell.alignment = { vertical: 'middle', horizontal: 'center' };

        const remarksCell = worksheet.getCell(currentRow, 6);
        remarksCell.value = (r.remarks || '').toUpperCase();
        remarksCell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };

        for (let c = 1; c <= 6; c++) {
            const cell = worksheet.getCell(currentRow, c);
            cell.font = { name: 'Arial', size: 9, bold: c === 1 || c === 5 };
            cell.border = borderStyle;
        }

        currentRow++;
    });

    // Write Buffer & Download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = format(new Date(), 'dd-MM-yyyy');
    link.download = `MOM_Report_${meeting.title || 'Meeting'}_${dateStr}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
}
