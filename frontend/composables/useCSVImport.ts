/**
 * Composable for CSV import functionality
 * Following Rule #2: Move all common/repeated logic into /utils
 * Following Rule #3: No Redundant Code - One generic CSV import util
 * Following Rule #4: Follow Nuxt.js Standards - Use composables for shared logic
 */

import { 
  importCSV, 
  downloadCSVTemplate, 
  exportToCSV, 
  csvValidators, 
  csvTransformers,
  type CSVImportOptions,
  type CSVImportResult 
} from '~/utils/csvImport'

export const useCSVImport = () => {
  return {
    importCSV,
    downloadCSVTemplate,
    exportToCSV,
    csvValidators,
    csvTransformers
  }
}
