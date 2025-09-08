/**
 * Generic CSV import utility for the School ERP SaaS
 * Following Rule #3: No Redundant Code - One generic CSV import util
 */

export interface CSVImportOptions {
  requiredFields: string[]
  optionalFields?: string[]
  fieldMappings?: Record<string, string>
  validators?: Record<string, (value: any) => string | null>
  transformers?: Record<string, (value: any) => any>
}

export interface CSVImportResult<T = any> {
  success: boolean
  data: T[]
  errors: Array<{
    row: number
    field: string
    message: string
    value: any
  }>
  warnings: Array<{
    row: number
    field: string
    message: string
    value: any
  }>
  summary: {
    totalRows: number
    validRows: number
    errorRows: number
    warningRows: number
  }
}

/**
 * Parse CSV file content
 * @param csvContent - CSV file content as string
 * @returns Parsed CSV data
 */
export const parseCSV = (csvContent: string): string[][] => {
  const lines = csvContent.split('\n').filter(line => line.trim())
  const result: string[][] = []
  
  for (const line of lines) {
    const row: string[] = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        row.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    
    row.push(current.trim())
    result.push(row)
  }
  
  return result
}

/**
 * Generic CSV import function
 * @param file - CSV file
 * @param options - Import options
 * @returns Import result
 */
export const importCSV = async <T = any>(
  file: File, 
  options: CSVImportOptions
): Promise<CSVImportResult<T>> => {
  const result: CSVImportResult<T> = {
    success: false,
    data: [],
    errors: [],
    warnings: [],
    summary: {
      totalRows: 0,
      validRows: 0,
      errorRows: 0,
      warningRows: 0
    }
  }

  try {
    // Read file content
    const csvContent = await readFileContent(file)
    
    // Parse CSV
    const csvData = parseCSV(csvContent)
    
    if (csvData.length < 2) {
      result.errors.push({
        row: 0,
        field: 'file',
        message: 'CSV file must contain at least a header row and one data row',
        value: ''
      })
      return result
    }

    // Get headers and data rows
    const headers = csvData[0].map(h => h.toLowerCase().trim())
    const dataRows = csvData.slice(1)
    
    result.summary.totalRows = dataRows.length

    // Validate headers
    const missingRequiredFields = options.requiredFields.filter(
      field => !headers.includes(field.toLowerCase())
    )
    
    if (missingRequiredFields.length > 0) {
      result.errors.push({
        row: 0,
        field: 'headers',
        message: `Missing required columns: ${missingRequiredFields.join(', ')}`,
        value: headers.join(', ')
      })
      return result
    }

    // Process each data row
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i]
      const rowData: any = {}
      let hasErrors = false
      let hasWarnings = false

      // Map CSV columns to data fields
      for (let j = 0; j < headers.length; j++) {
        const header = headers[j]
        const value = row[j] || ''
        
        // Apply field mapping if provided
        const fieldName = options.fieldMappings?.[header] || header
        
        // Apply transformer if provided
        const transformedValue = options.transformers?.[fieldName] 
          ? options.transformers[fieldName](value)
          : value

        rowData[fieldName] = transformedValue

        // Validate field if validator provided
        if (options.validators?.[fieldName]) {
          const error = options.validators[fieldName](transformedValue)
          if (error) {
            result.errors.push({
              row: i + 2, // +2 because we start from row 1 and skip header
              field: fieldName,
              message: error,
              value: transformedValue
            })
            hasErrors = true
          }
        }

        // Check for required fields
        if (options.requiredFields.includes(fieldName) && !transformedValue) {
          result.errors.push({
            row: i + 2,
            field: fieldName,
            message: `${fieldName} is required`,
            value: transformedValue
          })
          hasErrors = true
        }
      }

      // Add row to result
      if (!hasErrors) {
        result.data.push(rowData as T)
        result.summary.validRows++
      } else {
        result.summary.errorRows++
      }

      if (hasWarnings) {
        result.summary.warningRows++
      }
    }

    result.success = result.errors.length === 0

  } catch (error) {
    result.errors.push({
      row: 0,
      field: 'file',
      message: `Error reading file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      value: ''
    })
  }

  return result
}

/**
 * Read file content as text
 * @param file - File to read
 * @returns File content as string
 */
const readFileContent = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target?.result as string)
    reader.onerror = (e) => reject(e)
    reader.readAsText(file)
  })
}

/**
 * Download CSV template
 * @param headers - CSV headers
 * @param filename - Filename for download
 */
export const downloadCSVTemplate = (headers: string[], filename: string = 'template.csv'): void => {
  const csvContent = headers.join(',') + '\n'
  const blob = new Blob([csvContent], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

/**
 * Export data to CSV
 * @param data - Data to export
 * @param headers - CSV headers
 * @param filename - Filename for download
 */
export const exportToCSV = (data: any[], headers: string[], filename: string = 'export.csv'): void => {
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header] || ''
        // Escape commas and quotes
        return typeof value === 'string' && (value.includes(',') || value.includes('"'))
          ? `"${value.replace(/"/g, '""')}"`
          : value
      }).join(',')
    )
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

/**
 * Common field validators for CSV import
 */
export const csvValidators = {
  required: (value: any) => !value ? 'This field is required' : null,
  email: (value: any) => value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? 'Invalid email format' : null,
  phone: (value: any) => value && !/^(\+91|91)?[6-9]\d{9}$/.test(value.replace(/\s/g, '')) ? 'Invalid phone format' : null,
  numeric: (value: any) => value && isNaN(Number(value)) ? 'Must be a number' : null,
  positiveNumber: (value: any) => value && (isNaN(Number(value)) || Number(value) <= 0) ? 'Must be a positive number' : null,
  date: (value: any) => value && isNaN(new Date(value).getTime()) ? 'Invalid date format' : null
}

/**
 * Common field transformers for CSV import
 */
export const csvTransformers = {
  trim: (value: any) => typeof value === 'string' ? value.trim() : value,
  toLowerCase: (value: any) => typeof value === 'string' ? value.toLowerCase() : value,
  toUpperCase: (value: any) => typeof value === 'string' ? value.toUpperCase() : value,
  toNumber: (value: any) => value ? Number(value) : null,
  toBoolean: (value: any) => {
    if (typeof value === 'string') {
      const lower = value.toLowerCase()
      return lower === 'true' || lower === '1' || lower === 'yes'
    }
    return Boolean(value)
  }
}
