// Export Configuration for Professional Reports
// Simplified version - only essential utilities

// Shared interfaces
export interface ExportColumn {
  key: string
  header: string
}

export interface ExportFilters {
  [key: string]: any
}



// Enhanced formatting utilities
export const formatCurrency = (amount: any): string => {
  const numericAmount = parseFloat(String(amount || 0).replace(/[₹,]/g, '')) || 0
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(numericAmount)
}

export const formatDate = (date: any): string => {
  if (!date) return 'N/A'
  try {
    const dateObj = new Date(date)
    if (isNaN(dateObj.getTime())) {
      console.warn('Invalid date value:', date)
      return 'Invalid Date'
    }
    return dateObj.toLocaleDateString('en-IN')
  } catch (e) {
    console.error('Error formatting date:', e, 'Date value:', date)
    return 'Invalid Date'
  }
}

// Helper function to parse amount values
const parseAmount = (value: any): number => {
  return parseFloat(String(value || 0).replace(/[₹,]/g, '')) || 0
}

// Calculate summary values for different report types
export const calculateReportSummary = (data: any[], reportType: string) => {
  let totalAmount = 0
  let totalCollected = 0
  let totalPending = 0
  let summaryLabel = 'TOTAL RECORDS'
  let amountLabel = 'TOTAL AMOUNT'
  
  if (Array.isArray(data) && data.length > 0) {
    if (reportType === 'receipts') {
      totalAmount = data.reduce((sum: number, row: any) => {
        const amount = row.payment_amount || row.amount || 0
        return sum + parseAmount(amount)
      }, 0)
      summaryLabel = 'TOTAL RECEIPTS'
      amountLabel = 'TOTAL COLLECTED'
    } else if (reportType === 'fees') {
      totalAmount = data.reduce((sum: number, row: any) => {
        const amount = row.total_amount || row.amount || 0
        return sum + parseAmount(amount)
      }, 0)
      totalCollected = data.reduce((sum: number, row: any) => {
        const amount = row.paid_amount || row.collected_amount || 0
        return sum + parseAmount(amount)
      }, 0)
      totalPending = data.reduce((sum: number, row: any) => {
        const amount = row.balance_amount || row.pending_amount || 0
        return sum + parseAmount(amount)
      }, 0)
      summaryLabel = 'TOTAL INVOICES'
      amountLabel = 'TOTAL FEES'
    } else if (reportType === 'students') {
      summaryLabel = 'TOTAL STUDENTS'
      amountLabel = 'TOTAL STUDENTS'
    } else if (reportType === 'attendance') {
      summaryLabel = 'TOTAL RECORDS'
      amountLabel = 'TOTAL RECORDS'
    } else if (reportType === 'collections') {
      totalAmount = data.reduce((sum: number, row: any) => {
        const amount = row.payment_amount || row.amount || 0
        return sum + parseAmount(amount)
      }, 0)
      summaryLabel = 'TOTAL COLLECTIONS'
      amountLabel = 'TOTAL COLLECTED'
    }
  }
  
  const formattedAmount = formatCurrency(totalAmount)
  const formattedCollected = formatCurrency(totalCollected)
  const formattedPending = formatCurrency(totalPending)
  const collectionRate = totalAmount > 0 ? Math.round((totalCollected / totalAmount) * 100) : 0
  
  return {
    totalAmount,
    formattedAmount,
    totalCollected: formattedCollected,
    totalPending: formattedPending,
    collectionRate: `${collectionRate}%`,
    summaryLabel,
    amountLabel
  }
}

// Format cell values based on column type
export const formatCellValue = (value: any, columnKey: string): string => {
  if (value === '' || value === null || value === undefined) {
    return 'N/A'
  }
  
  // Handle currency columns
  if (columnKey.includes('amount') || columnKey.includes('total') || columnKey.includes('paid')) {
    return formatCurrency(value)
  }
  
  // Handle date columns
  if (columnKey.includes('date') || columnKey.includes('time')) {
    return formatDate(value)
  }
  
  // Handle status columns
  if (columnKey === 'status') {
    return String(value).toUpperCase()
  }
  
  // Handle payment method columns
  if (columnKey === 'payment_method') {
    const methodTexts: Record<string, string> = {
      cash: 'Cash',
      card: 'Card',
      upi: 'UPI',
      bank_transfer: 'Bank Transfer',
      cheque: 'Cheque',
    }
    return methodTexts[value] || String(value)
  }
  
  // Handle student name columns
  if (columnKey === 'student_name') {
    return String(value).replace(/null/g, '').trim()
  }
  
  return String(value)
}

// Get text alignment for table cells based on column type
export const getCellAlignment = (columnKey: string): string => {
  if (columnKey.includes('amount') || columnKey.includes('total') || columnKey.includes('paid')) {
    return 'text-right'
  } else if (columnKey.includes('status') || columnKey.includes('type')) {
    return 'text-center'
  }
  return 'text-left'
}

// Clean export filters by removing empty values
export const cleanExportFilters = (filters: ExportFilters): ExportFilters => {
  const cleaned: ExportFilters = {}
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      cleaned[key] = value
    }
  })
  return cleaned
}

// Validate export options
export const validateExportOptions = (reportType: string, format: string, columns: ExportColumn[]): string | null => {
  const supportedReportTypes = ['receipts', 'fees', 'students', 'attendance']
  const supportedFormats = ['pdf', 'excel', 'csv', 'print']
  
  if (!supportedReportTypes.includes(reportType)) {
    return `Unsupported report type: ${reportType}`
  }
  
  if (!supportedFormats.includes(format)) {
    return `Unsupported format: ${format}`
  }
  
  if (columns.length === 0) {
    return 'No columns selected for export'
  }
  
  return null
}
