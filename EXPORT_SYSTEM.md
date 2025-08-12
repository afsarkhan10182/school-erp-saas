# Universal Export System

A comprehensive, reusable export system for all report types in the School ERP SaaS application.

## Features

- **Multiple Formats**: Excel, CSV, PDF, JSON
- **Universal**: Works with any report type
- **Future-Proof**: Easy to extend for new report types
- **Industry Standard**: Professional formatting and metadata
- **Server-Side**: Efficient data processing
- **Progress Tracking**: Real-time export progress
- **Error Handling**: Comprehensive error management

## Architecture

### Backend Components

1. **Export Service** (`backend/src/services/export.service.js`)
   - Handles all export formats
   - Professional formatting
   - Metadata generation
   - Error handling

2. **Export Controller** (`backend/src/controllers/export.controller.js`)
   - Generic controller for all report types
   - Data transformation
   - Filter handling
   - Summary calculations

3. **Export Routes** (`backend/src/routes/export.routes.js`)
   - RESTful API endpoints
   - Authentication and authorization
   - Parameter validation

### Frontend Components

1. **Export Composable** (`frontend/composables/useExport.js`)
   - Reusable export logic
   - Progress tracking
   - Error handling
   - Format validation

2. **Export Dropdown Component** (`frontend/components/ExportDropdown.vue`)
   - User-friendly interface
   - Format selection
   - Progress indication
   - Event handling

## Usage

### Backend API

```javascript
// Export students report to Excel
GET /api/export/students/excel?includeSummary=true&status=active

// Export fee invoices to PDF
GET /api/export/fee-invoices/pdf?from_date=2024-01-01&to_date=2024-12-31

// Export attendance to CSV
GET /api/export/attendance/csv?class_id=1&section_id=2

// Export financial report to JSON
GET /api/export/financial/json?includeSummary=true
```

### Frontend Integration

```vue
<template>
  <ExportDropdown
    report-type="students"
    :filters="filters"
    :disabled="isLoading"
    custom-filename="student-report"
    @export-started="handleExportStarted"
    @export-completed="handleExportCompleted"
    @export-error="handleExportError"
  />
</template>

<script setup>
import { useExport } from '~/composables/useExport';

const { exportReport, exportToExcel, exportToPDF } = useExport();

// Direct export
await exportReport({
  reportType: 'students',
  format: 'excel',
  filters: { status: 'active' },
  includeSummary: true
});

// Format-specific helpers
await exportToExcel({ reportType: 'students', filters });
await exportToPDF({ reportType: 'fees', filters });
</script>
```

## Supported Report Types

1. **Students** (`students`)
   - Student information
   - Admission details
   - Guardian information
   - Class and section data

2. **Fee Invoices** (`fee-invoices`)
   - Invoice details
   - Payment information
   - Student details
   - Financial summaries

3. **Attendance** (`attendance`) - *Future*
   - Attendance records
   - Class-wise reports
   - Date range filtering

4. **Academic** (`academic`) - *Future*
   - Performance reports
   - Grade sheets
   - Subject-wise analysis

5. **Financial** (`financial`) - *Future*
   - Revenue reports
   - Expense tracking
   - Budget analysis

## Export Formats

### Excel (.xlsx)
- **Best for**: Data analysis, calculations, complex reports
- **Features**: 
  - Multiple worksheets (Data, Summary, Metadata)
  - Professional formatting
  - Column width optimization
  - Header styling

### CSV (.csv)
- **Best for**: Simple data exchange, compatibility
- **Features**:
  - UTF-8 encoding with BOM
  - Proper quote escaping
  - Summary data included
  - Universal compatibility

### PDF (.pdf)
- **Best for**: Printing, sharing, professional presentation
- **Features**:
  - Professional layout
  - Page breaks for large datasets
  - Header and footer
  - Summary section

### JSON (.json)
- **Best for**: Developers, API integration, data processing
- **Features**:
  - Structured data
  - Metadata included
  - Filter information
  - Machine-readable format

## Configuration

### Export Options

```javascript
const exportConfig = {
  reportType: 'students',
  format: 'excel',
  filters: {
    status: 'active',
    class_id: 1,
    date_from: '2024-01-01'
  },
  includeSummary: true,
  customFilename: 'student-report',
  options: {
    includeHeader: true,
    includeFooter: true,
    compression: true,
    locale: 'en-IN',
    currency: 'INR'
  }
};
```

### Column Configuration

```javascript
const columns = [
  { key: 'Admission Number', label: 'Admission Number', type: 'text' },
  { key: 'Student Name', label: 'Student Name', type: 'text' },
  { key: 'Total Amount', label: 'Total Amount', type: 'currency' },
  { key: 'Admission Date', label: 'Admission Date', type: 'date' },
  { key: 'Status', label: 'Status', type: 'text' }
];
```

## Adding New Report Types

### Backend

1. **Add to Export Controller**:
```javascript
// In export.controller.js
async getNewReportData(filters, user) {
  // Fetch and transform data
  const data = await NewModel.findAll({ where: filters });
  
  const exportData = data.map(item => ({
    'Field 1': item.field1,
    'Field 2': item.field2
  }));

  const config = {
    title: 'New Report',
    description: 'Description of the report',
    sheetName: 'New Data',
    columns: [
      { key: 'Field 1', label: 'Field 1', type: 'text' },
      { key: 'Field 2', label: 'Field 2', type: 'text' }
    ]
  };

  return { config, data: exportData, summary: {} };
}
```

2. **Add to Route Handler**:
```javascript
// In export.controller.js
async getReportData(reportType, filters, user) {
  switch (reportType.toLowerCase()) {
    // ... existing cases
    case 'new-report':
      return await this.getNewReportData(filters, user);
    default:
      throw new Error(`Unsupported report type: ${reportType}`);
  }
}
```

### Frontend

1. **Add to Export Composable**:
```javascript
// In useExport.js
const getSupportedFormats = (reportType) => {
  const formatConfig = {
    // ... existing configs
    'new-report': ['excel', 'csv', 'pdf', 'json']
  };
  return formatConfig[reportType] || ['excel', 'csv'];
};
```

2. **Use in Component**:
```vue
<ExportDropdown
  report-type="new-report"
  :filters="filters"
  custom-filename="new-report"
/>
```

## Error Handling

The system includes comprehensive error handling:

- **Validation Errors**: Invalid parameters, unsupported formats
- **Permission Errors**: Unauthorized access
- **Data Errors**: No data found, database errors
- **Network Errors**: Connection issues, timeouts

All errors are logged and user-friendly messages are displayed.

## Performance Considerations

- **Server-Side Processing**: All heavy processing done on backend
- **Streaming**: Large files are streamed to client
- **Compression**: Excel files are compressed
- **Caching**: Metadata and configurations cached
- **Progress Tracking**: Real-time progress updates

## Security

- **Authentication**: All export endpoints require authentication
- **Authorization**: Role-based access control
- **Data Filtering**: Users can only export data they have access to
- **Input Validation**: All parameters validated
- **Rate Limiting**: Export requests are rate limited

## Future Enhancements

1. **Scheduled Exports**: Automated report generation
2. **Email Delivery**: Send reports via email
3. **Template System**: Customizable report templates
4. **Advanced Filtering**: Complex filter combinations
5. **Real-time Updates**: Live data exports
6. **Bulk Operations**: Multiple report exports
7. **Export History**: Track export activities
8. **Custom Formats**: User-defined export formats
