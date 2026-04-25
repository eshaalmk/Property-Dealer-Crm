/* eslint-disable @typescript-eslint/no-explicit-any */
export function exportToExcel(leads: any[]) {
  // Dynamic import to avoid SSR issues
  import('xlsx').then(XLSX => {
    const data = leads.map(l => ({
      Name: l.name,
      Email: l.email,
      Phone: l.phone,
      'Property Interest': l.propertyInterest,
      Location: l.location,
      'Budget (PKR)': l.budget,
      Status: l.status,
      Priority: l.priority,
      Score: l.score,
      Source: l.source,
      'Assigned To': l.assignedTo?.name || 'Unassigned',
      'Follow-up Date': l.followUpDate ? new Date(l.followUpDate).toLocaleDateString() : '',
      Notes: l.notes,
      'Created At': new Date(l.createdAt).toLocaleDateString(),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();

    // Column widths
    ws['!cols'] = [
      { wch: 20 }, { wch: 28 }, { wch: 16 }, { wch: 18 }, { wch: 20 },
      { wch: 14 }, { wch: 14 }, { wch: 10 }, { wch: 8 }, { wch: 14 },
      { wch: 18 }, { wch: 14 }, { wch: 30 }, { wch: 14 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Leads');
    XLSX.writeFile(wb, `property-crm-leads-${Date.now()}.xlsx`);
  });
}

export function exportToPDF(leads: any[]) {
  import('jspdf').then(async ({ default: jsPDF }) => {
    const { default: autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF({ orientation: 'landscape' });

    // Header
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 297, 20, 'F');
    doc.setTextColor(240, 114, 15);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('PropertyCRM — Leads Export', 14, 13);
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(9);
    doc.text(`Generated: ${new Date().toLocaleString()}  |  Total: ${leads.length} leads`, 200, 13);

    autoTable(doc, {
      startY: 25,
      head: [['Name', 'Phone', 'Interest', 'Budget', 'Status', 'Priority', 'Agent', 'Created']],
      body: leads.map(l => [
        l.name,
        l.phone,
        l.propertyInterest,
        `PKR ${(l.budget / 1_000_000).toFixed(1)}M`,
        l.status,
        l.priority,
        l.assignedTo?.name || 'Unassigned',
        new Date(l.createdAt).toLocaleDateString(),
      ]),
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [15, 23, 42], textColor: [240, 114, 15], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      didParseCell: (data) => {
        if (data.column.index === 5) {
          const p = data.cell.raw as string;
          if (p === 'High') data.cell.styles.textColor = [239, 68, 68];
          else if (p === 'Medium') data.cell.styles.textColor = [245, 158, 11];
          else data.cell.styles.textColor = [16, 185, 129];
        }
      },
    });

    doc.save(`property-crm-leads-${Date.now()}.pdf`);
  });
}
