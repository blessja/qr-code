// utils/pdfExport.ts
// Note: You'll need to install jsPDF: npm install jspdf jspdf-autotable
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface WorkerPDFData {
  workerID: string;
  name: string;
  total_stock_count: number;
  totalHours: number;
  position: number;
  efficiency: string;
}

export const exportWorkersToPDF = (workers: WorkerPDFData[], title: string = 'Worker Performance Report') => {
  // For now, this is a placeholder implementation
  // You'll need to install jsPDF and jspdf-autotable packages
  
  console.log('PDF Export would include:', {
    title,
    totalWorkers: workers.length,
    data: workers
  });
  
  // Here's how the implementation would look with jsPDF:
  
  
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  
  // Add generation date
  doc.setFontSize(11);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 32);
  
  // Summary statistics
  const totalVines = workers.reduce((sum, worker) => sum + worker.total_stock_count, 0);
  const totalHours = workers.reduce((sum, worker) => sum + worker.totalHours, 0);
  const avgPosition = totalHours > 0 ? totalVines / totalHours : 0;
  
  doc.text(`Total Workers: ${workers.length}`, 14, 42);
  doc.text(`Total Vines: ${totalVines.toLocaleString()}`, 14, 50);
  doc.text(`Total Hours: ${totalHours.toFixed(1)}`, 14, 58);
  doc.text(`Average Position: ${avgPosition.toFixed(1)} vines/hour`, 14, 66);
  
  // Create table data
  const tableData = workers.map((worker, index) => [
    index + 1, // Rank
    worker.workerID || 'N/A',
    worker.name || 'Unknown',
    worker.total_stock_count.toLocaleString(),
    worker.totalHours.toString(),
    worker.position.toString(),
    worker.efficiency
  ]);
  
  // Add table
  autoTable(doc, {
    head: [['Rank', 'Worker ID', 'Name', 'Total Vines', 'Hours', 'Position', 'Efficiency']],
    body: tableData,
    startY: 75,
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [59, 130, 246], // Blue color
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // Light gray
    },
    columnStyles: {
      0: { halign: 'center' }, // Rank
      1: { halign: 'center' }, // Worker ID
      3: { halign: 'right' },  // Total Vines
      4: { halign: 'right' },  // Hours
      5: { halign: 'right' },  // Position
      6: { halign: 'center' }, // Efficiency
    },
  });
  
  // Save the PDF
  doc.save(`worker-performance-report-${new Date().toISOString().split('T')[0]}.pdf`);
  // 
  
  // Temporary implementation using browser print
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    const htmlContent = generatePrintableHTML(workers, title);
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  }
};

const generatePrintableHTML = (workers: WorkerPDFData[], title: string): string => {
  const totalVines = workers.reduce((sum, worker) => sum + worker.total_stock_count, 0);
  const totalHours = workers.reduce((sum, worker) => sum + worker.totalHours, 0);
  const avgPosition = totalHours > 0 ? totalVines / totalHours : 0;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
          color: #333;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #3b82f6;
          padding-bottom: 20px;
        }
        .header h1 {
          color: #1f2937;
          margin: 0;
          font-size: 24px;
        }
        .header p {
          color: #6b7280;
          margin: 5px 0;
        }
        .summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        .summary-card {
          background: #f8fafc;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 15px;
          text-align: center;
        }
        .summary-card h3 {
          margin: 0;
          color: #374151;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .summary-card p {
          margin: 5px 0 0 0;
          font-size: 24px;
          font-weight: bold;
          color: #1f2937;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th, td {
          border: 1px solid #e5e7eb;
          padding: 8px 12px;
          text-align: left;
        }
        th {
          background-color: #3b82f6;
          color: white;
          font-weight: bold;
          text-align: center;
        }
        tr:nth-child(even) {
          background-color: #f8fafc;
        }
        tr:hover {
          background-color: #e5e7eb;
        }
        .rank {
          text-align: center;
          font-weight: bold;
        }
        .worker-id {
          text-align: center;
        }
        .number {
          text-align: right;
        }
        .efficiency {
          text-align: center;
        }
        .efficiency-excellent { color: #059669; }
        .efficiency-high { color: #2563eb; }
        .efficiency-medium { color: #d97706; }
        .efficiency-low { color: #dc2626; }
        .footer {
          margin-top: 30px;
          text-align: center;
          color: #6b7280;
          font-size: 12px;
          border-top: 1px solid #e5e7eb;
          padding-top: 20px;
        }
        @media print {
          body { margin: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${title}</h1>
        <p>Generated on: ${new Date().toLocaleString()}</p>
      </div>

      <div class="summary">
        <div class="summary-card">
          <h3>Total Workers</h3>
          <p>${workers.length}</p>
        </div>
        <div class="summary-card">
          <h3>Total Vines</h3>
          <p>${totalVines.toLocaleString()}</p>
        </div>
        <div class="summary-card">
          <h3>Total Hours</h3>
          <p>${totalHours.toFixed(1)}</p>
        </div>
        <div class="summary-card">
          <h3>Average Position</h3>
          <p>${avgPosition.toFixed(1)}</p>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Worker ID</th>
            <th>Name</th>
            <th>Total Vines</th>
            <th>Hours Worked</th>
            <th>Position (Vines/Hr)</th>
            <th>Efficiency</th>
          </tr>
        </thead>
        <tbody>
          ${workers.map((worker, index) => `
            <tr>
              <td class="rank">${index + 1}</td>
              <td class="worker-id">${worker.workerID || 'N/A'}</td>
              <td>${worker.name || 'Unknown'}</td>
              <td class="number">${worker.total_stock_count.toLocaleString()}</td>
              <td class="number">${worker.totalHours}</td>
              <td class="number">${worker.position}</td>
              <td class="efficiency efficiency-${worker.efficiency.toLowerCase()}">${worker.efficiency}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="footer">
        <p>Worker Performance Report - Confidential</p>
        <p>This report contains sensitive employee performance data</p>
      </div>
    </body>
    </html>
  `;
};