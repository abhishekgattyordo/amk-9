import * as XLSX from 'xlsx';

export function exportToExcel(data: any[], filename: string, sheetName: string = 'Report') {
  try {
    if (!data || data.length === 0) {
      alert('No data available to export.');
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Auto-size columns
    const keys = Object.keys(data[0] || {});
    worksheet['!cols'] = keys.map(k => ({
      wch: Math.max(k.length + 3, 14),
    }));

    XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
  } catch (error) {
    console.error('Failed to export to Excel:', error);
    // Fallback to CSV if xlsx has an issue
    exportToCSV(data, filename);
  }
}

export function exportToCSV(data: any[], filename: string) {
  if (!data || data.length === 0) {
    alert('No data available to export.');
    return;
  }

  const headers = Object.keys(data[0]);
  const rows = data.map(row => {
    return headers.map(header => {
      let cell = row[header] ?? '';
      if (typeof cell === 'object') {
        cell = JSON.stringify(cell);
      }
      cell = String(cell).replace(/"/g, '""');
      if (cell.includes(',') || cell.includes('\n') || cell.includes('"')) {
        cell = `"${cell}"`;
      }
      return cell;
    }).join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function triggerPrintWindow() {
  window.print();
}
