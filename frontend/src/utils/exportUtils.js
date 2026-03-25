import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * Exports data to an Excel file.
 * @param {Array} data - The array of objects to export.
 * @param {string} fileName - The name of the file (without extension).
 * @param {string} sheetName - The name of the Excel sheet.
 */
export const exportToExcel = (data, fileName = 'export', sheetName = 'Data') => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

/**
 * Exports data to a PDF file.
 * @param {Array} columns - The columns configuration for the table.
 * @param {Array} data - The array of objects to export.
 * @param {string} fileName - The name of the file (without extension).
 * @param {string} title - The title of the document.
 */
export const exportToPDF = (columns, data, fileName = 'export', title = 'Report') => {
  const doc = jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  
  // Header details
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFontSize(18);
  doc.text(title, pageWidth / 2, 15, { align: 'center' });
  doc.setFontSize(10);
  doc.text(`Fecha de generación: ${new Date().toLocaleString()}`, 14, 22);

  const tableColumnNames = columns.map(col => col.header);
  const tableRows = data.map(item => {
    return columns.map(col => {
      const val = typeof col.key === 'function' ? col.key(item) : item[col.key];
      return val !== undefined && val !== null ? val.toString() : '';
    });
  });

  doc.autoTable({
    head: [tableColumnNames],
    body: tableRows,
    startY: 25,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255 }, // Nice blue header
    alternateRowStyles: { fillColor: [245, 245, 245] },
    margin: { top: 25, left: 10, right: 10, bottom: 20 },
    didDrawPage: function (data) {
        // Footer (Page number)
        let str = 'Página ' + doc.internal.getNumberOfPages();
        doc.setFontSize(10);
        const pageSize = doc.internal.pageSize;
        const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
        doc.text(str, data.settings.margin.left, pageHeight - 10);
    }
  });

  doc.save(`${fileName}.pdf`);
};
