const XLSX = require('xlsx');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

/**
 * Universal Export Service
 * Handles multiple export formats with industry-standard implementations
 */
class ExportService {
  constructor() {
    this.supportedFormats = ['excel', 'csv', 'pdf', 'json'];
    this.defaultOptions = {
      includeHeader: true,
      includeFooter: true,
      includeSummary: false,
      compression: true,
      dateFormat: 'YYYY-MM-DD',
      timeFormat: 'HH:mm:ss',
      locale: 'en-IN',
      currency: 'INR',
      pageSize: 'A4',
      orientation: 'portrait'
    };
  }

  /**
   * Main export method - handles all formats
   * @param {Object} config - Export configuration
   * @param {Array} data - Data to export
   * @param {string} format - Export format
   * @returns {Buffer|string} - Exported data
   */
  async export(config, data, format = 'excel') {
    try {
      // Validate format
      if (!this.supportedFormats.includes(format.toLowerCase())) {
        throw new Error(`Unsupported format: ${format}. Supported formats: ${this.supportedFormats.join(', ')}`);
      }

      // Merge with default options
      const options = { ...this.defaultOptions, ...config.options };

      // Validate data
      if (!data || !Array.isArray(data) || data.length === 0) {
        throw new Error('No data provided for export');
      }

      logger.info(`Starting ${format.toUpperCase()} export for ${data.length} records`);

      // Route to appropriate export method
      switch (format.toLowerCase()) {
        case 'excel':
          return await this.exportToExcel(config, data, options);
        case 'csv':
          return await this.exportToCSV(config, data, options);
        case 'pdf':
          return await this.exportToPDF(config, data, options);
        case 'json':
          return await this.exportToJSON(config, data, options);
        default:
          throw new Error(`Export method not implemented for format: ${format}`);
      }
    } catch (error) {
      logger.error(`Export failed for format ${format}:`, error);
      throw error;
    }
  }

  /**
   * Export to Excel with advanced formatting
   */
  async exportToExcel(config, data, options) {
    try {
      const workbook = XLSX.utils.book_new();
      
      // Create main data worksheet
      const worksheet = XLSX.utils.json_to_sheet(data, {
        header: config.columns.map(col => col.key),
        skipHeader: !options.includeHeader
      });

      // Apply column formatting
      this.applyExcelFormatting(worksheet, config.columns, data.length);

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, config.sheetName || 'Data');

      // Add summary sheet if requested
      if (options.includeSummary && config.summary) {
        const summarySheet = this.createSummarySheet(config.summary);
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
      }

      // Add metadata sheet
      const metadataSheet = this.createMetadataSheet(config, data.length);
      XLSX.utils.book_append_sheet(workbook, metadataSheet, 'Metadata');

      // Write to buffer
      const excelBuffer = XLSX.write(workbook, {
        type: 'buffer',
        bookType: 'xlsx',
        compression: options.compression,
        bookSST: false
      });

      logger.info(`Excel export completed: ${data.length} records, ${excelBuffer.length} bytes`);
      return excelBuffer;
    } catch (error) {
      logger.error('Excel export failed:', error);
      throw error;
    }
  }

  /**
   * Export to CSV with proper encoding
   */
  async exportToCSV(config, data, options) {
    try {
      // Prepare headers
      const headers = config.columns.map(col => col.label || col.key);
      
      // Prepare CSV rows
      const csvRows = [headers];
      
      data.forEach(row => {
        const csvRow = config.columns.map(col => {
          let value = row[col.key] || '';
          
          // Format value based on column type
          value = this.formatValueForCSV(value, col.type, options);
          
          // Escape quotes and wrap in quotes if needed
          if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
            value = `"${value.replace(/"/g, '""')}"`;
          }
          
          return value;
        });
        csvRows.push(csvRow);
      });

      // Add summary row if requested
      if (options.includeSummary && config.summary) {
        csvRows.push([]); // Empty row
        csvRows.push(['Summary']);
        Object.entries(config.summary).forEach(([key, value]) => {
          csvRows.push([key, value]);
        });
      }

      // Join rows and add BOM for UTF-8 compatibility
      const csvContent = csvRows.map(row => row.join(',')).join('\n');
      const BOM = '\uFEFF';
      const csvWithBOM = BOM + csvContent;

      logger.info(`CSV export completed: ${data.length} records, ${csvWithBOM.length} characters`);
      return csvWithBOM;
    } catch (error) {
      logger.error('CSV export failed:', error);
      throw error;
    }
  }

  /**
   * Export to PDF with professional formatting
   */
  async exportToPDF(config, data, options) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: options.pageSize,
          layout: options.orientation,
          margins: {
            top: 50,
            bottom: 50,
            left: 50,
            right: 50
          }
        });

        const chunks = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));

        // Add header
        this.addPDFHeader(doc, config);

        // Add data table
        this.addPDFTable(doc, config, data, options);

        // Add summary if requested
        if (options.includeSummary && config.summary) {
          this.addPDFSummary(doc, config.summary);
        }

        // Add footer
        if (options.includeFooter) {
          this.addPDFFooter(doc, config);
        }

        doc.end();
      } catch (error) {
        logger.error('PDF export failed:', error);
        reject(error);
      }
    });
  }

  /**
   * Export to JSON with metadata
   */
  async exportToJSON(config, data, options) {
    try {
      const exportData = {
        metadata: {
          title: config.title,
          description: config.description,
          exported_at: new Date().toISOString(),
          total_records: data.length,
          format: 'json',
          version: '1.0'
        },
        data: data
      };

      // Add summary if requested
      if (options.includeSummary && config.summary) {
        exportData.summary = config.summary;
      }

      // Add filters if provided
      if (config.filters) {
        exportData.filters = config.filters;
      }

      const jsonString = JSON.stringify(exportData, null, 2);
      logger.info(`JSON export completed: ${data.length} records, ${jsonString.length} characters`);
      return jsonString;
    } catch (error) {
      logger.error('JSON export failed:', error);
      throw error;
    }
  }

  /**
   * Apply Excel formatting
   */
  applyExcelFormatting(worksheet, columns, rowCount) {
    // Set column widths
    columns.forEach((col, index) => {
      const colLetter = XLSX.utils.encode_col(index);
      const maxWidth = Math.max(
        col.label.length,
        ...worksheet[XLSX.utils.encode_cell({ r: 0, c: index })] ? [worksheet[XLSX.utils.encode_cell({ r: 0, c: index })].v.length] : [],
        ...Array.from({ length: rowCount }, (_, i) => {
          const cell = worksheet[XLSX.utils.encode_cell({ r: i + 1, c: index })];
          return cell ? String(cell.v).length : 0;
        })
      );
      worksheet['!cols'] = worksheet['!cols'] || [];
      worksheet['!cols'][index] = { width: Math.min(maxWidth + 2, 50) };
    });

    // Style header row
    const headerRange = XLSX.utils.decode_range(worksheet['!ref']);
    for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (worksheet[cellAddress]) {
        worksheet[cellAddress].s = {
          font: { bold: true, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: '4472C4' } },
          alignment: { horizontal: 'center' }
        };
      }
    }
  }

  /**
   * Create summary sheet for Excel
   */
  createSummarySheet(summary) {
    const summaryData = Object.entries(summary).map(([key, value]) => ({
      Metric: key,
      Value: value
    }));

    return XLSX.utils.json_to_sheet(summaryData);
  }

  /**
   * Create metadata sheet for Excel
   */
  createMetadataSheet(config, recordCount) {
    const metadata = [
      { Field: 'Report Title', Value: config.title || 'Export Report' },
      { Field: 'Description', Value: config.description || 'Generated report' },
      { Field: 'Total Records', Value: recordCount },
      { Field: 'Generated At', Value: new Date().toISOString() },
      { Field: 'Generated By', Value: config.generatedBy || 'System' },
      { Field: 'Version', Value: '1.0' }
    ];

    return XLSX.utils.json_to_sheet(metadata);
  }

  /**
   * Format value for CSV export
   */
  formatValueForCSV(value, type, options) {
    if (value === null || value === undefined) return '';

    switch (type) {
      case 'date':
        return new Date(value).toLocaleDateString(options.locale);
      case 'datetime':
        return new Date(value).toLocaleString(options.locale);
      case 'currency':
        return new Intl.NumberFormat(options.locale, {
          style: 'currency',
          currency: options.currency
        }).format(value);
      case 'number':
        return new Intl.NumberFormat(options.locale).format(value);
      case 'percentage':
        return `${value}%`;
      default:
        return String(value);
    }
  }

  /**
   * Add PDF header
   */
  addPDFHeader(doc, config) {
    doc.fontSize(20)
       .font('Helvetica-Bold')
       .text(config.title || 'Export Report', { align: 'center' });

    doc.moveDown(0.5)
       .fontSize(12)
       .font('Helvetica')
       .text(config.description || '', { align: 'center' });

    doc.moveDown(1)
       .fontSize(10)
       .text(`Generated on: ${new Date().toLocaleString()}`, { align: 'right' });

    doc.moveDown(1);
  }

  /**
   * Add PDF table
   */
  addPDFTable(doc, config, data, options) {
    const tableTop = doc.y;
    const tableLeft = 50;
    const tableWidth = 500;
    const columnWidth = tableWidth / config.columns.length;

    // Draw header
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .fillColor('white');

    config.columns.forEach((col, index) => {
      const x = tableLeft + (index * columnWidth);
      doc.rect(x, tableTop, columnWidth, 20)
         .fill()
         .fillColor('black')
         .text(col.label || col.key, x + 5, tableTop + 5, { width: columnWidth - 10 });
    });

    // Draw data rows
    doc.fontSize(9)
       .font('Helvetica')
       .fillColor('black');

    data.forEach((row, rowIndex) => {
      const y = tableTop + 20 + (rowIndex * 15);
      
      // Check if we need a new page
      if (y > doc.page.height - 100) {
        doc.addPage();
        return this.addPDFTable(doc, config, data.slice(rowIndex), options);
      }

      config.columns.forEach((col, colIndex) => {
        const x = tableLeft + (colIndex * columnWidth);
        const value = this.formatValueForPDF(row[col.key], col.type, options);
        
        doc.text(value, x + 5, y + 2, { width: columnWidth - 10 });
      });
    });
  }

  /**
   * Add PDF summary
   */
  addPDFSummary(doc, summary) {
    doc.addPage()
       .fontSize(16)
       .font('Helvetica-Bold')
       .text('Summary', { align: 'center' });

    doc.moveDown(1);

    Object.entries(summary).forEach(([key, value]) => {
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .text(key);

      doc.fontSize(10)
         .font('Helvetica')
         .text(value.toString());

      doc.moveDown(0.5);
    });
  }

  /**
   * Add PDF footer
   */
  addPDFFooter(doc, config) {
    const pageCount = doc.bufferedPageRange().count;
    
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      
      doc.fontSize(8)
         .font('Helvetica')
         .text(
           `Page ${i + 1} of ${pageCount} | Generated by ${config.generatedBy || 'System'}`,
           50,
           doc.page.height - 50,
           { align: 'center' }
         );
    }
  }

  /**
   * Format value for PDF
   */
  formatValueForPDF(value, type, options) {
    if (value === null || value === undefined) return '';

    switch (type) {
      case 'date':
        return new Date(value).toLocaleDateString(options.locale);
      case 'datetime':
        return new Date(value).toLocaleString(options.locale);
      case 'currency':
        return new Intl.NumberFormat(options.locale, {
          style: 'currency',
          currency: options.currency
        }).format(value);
      case 'number':
        return new Intl.NumberFormat(options.locale).format(value);
      case 'percentage':
        return `${value}%`;
      default:
        return String(value).substring(0, 30); // Truncate long text for PDF
    }
  }

  /**
   * Generate filename with timestamp
   */
  generateFilename(prefix, format) {
    const timestamp = new Date().toISOString().split('T')[0];
    const time = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
    return `${prefix}-${timestamp}-${time}.${format}`;
  }

  /**
   * Set response headers for download
   */
  setDownloadHeaders(res, filename, format, buffer) {
    const mimeTypes = {
      excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      csv: 'text/csv; charset=utf-8',
      pdf: 'application/pdf',
      json: 'application/json'
    };

    res.setHeader('Content-Type', mimeTypes[format] || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', Buffer.byteLength(buffer));
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Pragma', 'no-cache');
  }
}

module.exports = new ExportService();
