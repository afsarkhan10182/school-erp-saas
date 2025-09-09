// Common Print Report Composable
// Reusable print functionality for all reports

import { calculateReportSummary, formatCellValue, getCellAlignment } from '~/utils/exportConfig';

export interface PrintReportData {
  title: string;
  data: any[];
  columns: any[];
  filters: Record<string, any>;
  reportType: string;
}

export interface PrintOptions {
  showHeader?: boolean;
  showSummary?: boolean;
  showFilters?: boolean;
  showFooter?: boolean;
  autoPrint?: boolean;
}

export const usePrintReport = () => {
  // Helper function to format date consistently
  const formatDate = () => {
    return new Date().toLocaleString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Main print function
  // Note: The data passed in reportData should already be filtered based on user selections
  const printReport = async (
    reportData: PrintReportData,
    options: PrintOptions = {}
  ): Promise<void> => {
    try {
      // Generate HTML content
      const htmlContent = generatePrintHTML(reportData, options);

      // Show print preview or print directly
      if (options.autoPrint) {
        await printDirectly(htmlContent);
      } else {
        await showPrintPreview(htmlContent, reportData.title);
      }
    } catch (error) {
      console.error('Print error:', error);
      throw new Error('Failed to print report');
    }
  };

  // Generate print HTML content
  const generatePrintHTML = (reportData: PrintReportData, options: PrintOptions = {}): string => {
    const { title, data, columns, filters, reportType } = reportData;

    const {
      showHeader = true,
      showSummary = true,
      showFilters = true,
      showFooter = true,
      autoPrint = false
    } = options;

    // Calculate summary values using shared utility
    const summary = calculateReportSummary(data, reportType);

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title} - School ERP System</title>
        <style>
          /* Professional Print Styles */
          @media print {
            @page {
              size: A4 portrait;
              margin: 1cm;
            }
            
            body {
              font-family: 'Georgia', 'Times New Roman', serif;
              font-size: 10pt;
              line-height: 1.3;
              color: #2c3e50;
              background: white;
              margin: 0;
              padding: 0;
            }
            
            .no-print { display: none !important; }
            .page-break { page-break-before: always; }
            .keep-together { page-break-inside: avoid; }
            
            table { 
              page-break-inside: auto;
              border-collapse: collapse;
            }
            
            tr { page-break-inside: avoid; }
            
            .data-table th {
              background: #f8f9fa !important;
              color: #2c3e50 !important;
              border: 1pt solid #dee2e6 !important;
            }
            
            .data-table td {
              border: 1pt solid #dee2e6 !important;
              background: white !important;
            }
            
            .data-table tr:nth-child(even) {
              background: #f8f9fa !important;
            }
          }
          
          /* Screen styles - Clean and professional design */
          body {
            font-family: 'Georgia', 'Times New Roman', serif;
            font-size: 10pt;
            line-height: 1.3;
            color: #2c3e50;
            background: #f8f9fa;
            margin: 0;
            padding: 15px;
          }
          
          .report-container {
            max-width: 210mm;
            margin: 0 auto;
            background: white;
            min-height: auto;
            padding: 20px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            border-radius: 8px;
          }
          
          /* Professional Report Header */
          .report-header {
            text-align: center;
            padding: 15pt 0;
            border-bottom: 1pt solid #34495e;
            margin-bottom: 15pt;
            background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
            border-radius: 6pt;
          }
          
          .school-name {
            font-size: 16pt;
            font-weight: bold;
            margin-bottom: 4pt;
            color: #2c3e50;
            text-transform: uppercase;
            letter-spacing: 1pt;
            font-family: 'Georgia', serif;
          }
          
          .report-title {
            font-size: 14pt;
            font-weight: bold;
            margin-bottom: 4pt;
            color: #34495e;
            font-family: 'Georgia', serif;
          }
          
          .report-date {
            font-size: 9pt;
            color: #6c757d;
            font-style: italic;
            font-family: 'Georgia', serif;
          }
          
          /* Summary Section */
          .summary-section {
            margin: 15pt 0;
            padding: 12pt;
            border: 1pt solid #dee2e6;
            background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
            border-radius: 6pt;
            box-shadow: 0 2pt 8pt rgba(0,0,0,0.06);
          }
          
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(140pt, 1fr));
            gap: 12pt;
          }
          
          .summary-card {
            text-align: center;
            padding: 10pt;
            border: 1pt solid #dee2e6;
            background: white;
            border-radius: 6pt;
            box-shadow: 0 1pt 4pt rgba(0,0,0,0.04);
            transition: all 0.3s ease;
          }
          
          .summary-card:hover {
            transform: translateY(-3pt);
            box-shadow: 0 4pt 16pt rgba(0,0,0,0.12);
          }
          
          .summary-value {
            font-size: 14pt;
            font-weight: bold;
            margin-bottom: 4pt;
            color: #27ae60;
            font-family: 'Georgia', serif;
          }
          
          .summary-label {
            font-size: 8pt;
            text-transform: uppercase;
            font-weight: bold;
            color: #6c757d;
            letter-spacing: 0.5pt;
            font-family: 'Georgia', serif;
          }
          
          /* Filters Section */
          .filters-section {
            margin: 12pt 0;
            padding: 10pt;
            border: 1pt solid #dee2e6;
            background: linear-gradient(to right, #f8f9fa, #ffffff);
            border-radius: 6pt;
          }
          
          .filters-title {
            font-weight: bold;
            margin-bottom: 4pt;
            font-size: 9pt;
            color: #2c3e50;
            text-transform: uppercase;
            letter-spacing: 0.5pt;
            font-family: 'Georgia', serif;
          }
          
          .filters-content {
            font-size: 8pt;
            color: #6c757d;
            font-weight: 500;
            font-family: 'Georgia', serif;
          }
          
          /* Professional Data Table - No Column Colors */
          .data-table {
            width: 100%;
            border-collapse: collapse;
            margin: 15pt 0;
            font-size: 9pt;
            border-radius: 6pt;
            overflow: hidden;
            box-shadow: 0 2pt 8pt rgba(0,0,0,0.06);
            font-family: 'Georgia', serif;
          }
          
          .data-table th {
            background: #f8f9fa;
            color: #2c3e50;
            padding: 8pt 6pt;
            text-align: left;
            font-weight: bold;
            border: 1pt solid #dee2e6;
            font-size: 9pt;
            text-transform: uppercase;
            letter-spacing: 0.5pt;
            font-family: 'Georgia', serif;
          }
          
          .data-table td {
            padding: 6pt 4pt;
            border: 1pt solid #dee2e6;
            vertical-align: top;
            font-size: 9pt;
            background: white;
            font-family: 'Georgia', serif;
          }
          
          .data-table tr {
            background: white;
            transition: background-color 0.2s ease;
          }
          
          .data-table tr:nth-child(even) {
            background: #f8f9fa;
          }
          
          .data-table tr:hover {
            background: #e9ecef;
          }
          

          
          /* Print Preview Controls */
          .preview-controls {
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            padding: 20px;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            z-index: 1000;
            font-family: 'Georgia', serif;
          }
          
          .preview-controls button {
            margin: 0 8px;
            padding: 10px 20px;
            border: 1px solid #dee2e6;
            background: #f8f9fa;
            cursor: pointer;
            border-radius: 6px;
            font-size: 12px;
            font-family: 'Georgia', serif;
            transition: all 0.2s ease;
          }
          
          .preview-controls button:hover {
            background: #e9ecef;
            transform: translateY(-1px);
          }
          
          .preview-controls button.primary {
            background: #007bff;
            color: white;
            border-color: #007bff;
          }
          
          .preview-controls button.primary:hover {
            background: #0056b3;
          }
          
          .preview-controls button.success {
            background: #28a745;
            color: white;
            border-color: #28a745;
          }
          
          .preview-controls button.success:hover {
            background: #1e7e34;
          }
          
          /* No Data Message */
          .no-data-message {
            text-align: center;
            padding: 50pt;
            color: #6c757d;
            font-style: italic;
            font-size: 12pt;
            font-family: 'Georgia', serif;
            background: #f8f9fa;
            border-radius: 8pt;
            border: 1pt solid #dee2e6;
          }
          
          /* Footer */
          .report-footer {
            margin-top: 15pt;
            text-align: center;
            font-size: 8pt;
            color: #6c757d;
            border-top: 1pt solid #dee2e6;
            padding-top: 8pt;
            background: linear-gradient(to right, #f8f9fa, #ffffff, #f8f9fa);
            border-radius: 4pt;
            font-family: 'Georgia', serif;
          }
        </style>
      </head>
      <body>
        ${
          !autoPrint
            ? `
        <!-- Print Preview Controls -->
        <div class="preview-controls no-print">
          <button onclick="window.print()" class="primary">Print Report</button>
          <button onclick="window.print()" class="success">Save as PDF</button>
          <button onclick="window.close()">Close</button>
        </div>
        `
            : ''
        }
        
        <div class="report-container">
          ${
            showHeader
              ? `
          <!-- Report Header -->
          <div class="report-header">
            <div class="school-name">School ERP System</div>
            <div class="report-title">${title} Report</div>
            <div class="report-date">Generated on: ${formatDate()}</div>
          </div>
          `
              : ''
          }
          
          ${
            showFilters && Object.keys(filters).length > 0
              ? `
          <!-- Filters Section -->
          <div class="filters-section keep-together">
            <div class="filters-title">Applied Filters:</div>
            <div class="filters-content">
              ${
                Object.entries(filters)
                  .map(([key, value]) => {
                    if (!value) return '';
                    const label = key.replace(/_/g, ' ').replace(/\\b\\w/g, l => l.toUpperCase());
                    return `${label}: ${value}`;
                  })
                  .filter(Boolean)
                  .join(' | ') || 'None'
              }
            </div>
          </div>
          `
              : ''
          }
          
          ${
            showSummary
              ? `
          <!-- Summary Section -->
          <div class="summary-section keep-together">
            <div class="summary-grid">
              ${
                reportType === 'receipts'
                  ? `
              <!-- Receipts: Only 2 cards - Total Collected and Total Receipts -->
              <div class="summary-card">
                <div class="summary-value">${summary.formattedAmount}</div>
                <div class="summary-label">TOTAL COLLECTED</div>
              </div>
              <div class="summary-card">
                <div class="summary-value">${data.length}</div>
                <div class="summary-label">TOTAL RECEIPTS</div>
              </div>
              `
                  : reportType === 'fees'
                    ? `
              <!-- Fees: 4 cards - Total Amount, Total Collected, Total Pending, Collection Rate -->
              <div class="summary-card">
                <div class="summary-value">${summary.formattedAmount}</div>
                <div class="summary-label">TOTAL AMOUNT</div>
              </div>
              <div class="summary-card">
                <div class="summary-value">${summary.totalCollected || '₹0'}</div>
                <div class="summary-label">TOTAL COLLECTED</div>
              </div>
              <div class="summary-card">
                <div class="summary-value">${summary.totalPending || '₹0'}</div>
                <div class="summary-label">TOTAL PENDING</div>
              </div>
              <div class="summary-card">
                <div class="summary-value">${summary.collectionRate || '0%'}</div>
                <div class="summary-label">COLLECTION RATE</div>
              </div>
              `
                    : `
              <!-- Default: Simple record count -->
              <div class="summary-card">
                <div class="summary-value">${data.length}</div>
                <div class="summary-label">${summary.summaryLabel}</div>
              </div>
              `
              }
            </div>
          </div>
          `
              : ''
          }
          
          <!-- Data Table -->
          ${
            columns.length > 0 && data.length > 0
              ? `
          <table class="data-table">
            <thead>
              <tr>
                ${columns.map((col: any) => `<th>${col.header || col.key}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${data
                .map(
                  (row: any) => `
                <tr>
                  ${columns
                    .map((col: any) => {
                      const value = row[col.key] || '';
                      let displayValue = String(value);

                      // Format values using shared utility
                      displayValue = formatCellValue(value, col.key);

                      // Get text alignment using shared utility
                      const textAlign = getCellAlignment(col.key);

                      return `<td class="${textAlign}">${displayValue}</td>`;
                    })
                    .join('')}
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
          `
              : `
          <div class="no-data-message">
            No data found for the specified filters.
          </div>
          `
          }
          
          ${
            showFooter
              ? `
          <!-- Footer -->
          <div class="report-footer">
            Total Records: ${data.length} | Generated on: ${formatDate()}
          </div>
          `
              : ''
          }
        </div>
        

      </body>
      </html>
    `;
  };

  // Note: calculateSummary function removed - now using shared utility calculateReportSummary

  // Print directly without preview
  const printDirectly = async (htmlContent: string): Promise<void> => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Please allow popups to print the report');
    }

    printWindow.document.write(htmlContent);
    printWindow.document.close();

    // Wait for content to load, then trigger print
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 1000);
  };

  // Show print preview
  const showPrintPreview = async (htmlContent: string, title: string): Promise<void> => {
    const previewWindow = window.open('', '_blank', 'width=1200,height=800');
    if (!previewWindow) {
      throw new Error('Please allow popups to view print preview');
    }

    previewWindow.document.write(htmlContent);
    previewWindow.document.close();

    // Focus the window
    previewWindow.focus();
  };

  return {
    printReport
  };
};
