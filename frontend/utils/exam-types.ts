/**
 * Hardcoded exam types
 * These are system-level constants, not user-configurable data
 */

export interface ExamType {
  id: number;
  name: string;
  label: string;
  description: string;
  reportColumns: string[];
}

export const EXAM_TYPES: ExamType[] = [
  {
    id: 1,
    name: 'marks',
    label: 'Marks',
    description: 'Numeric marks only',
    reportColumns: ['total']
  },
  {
    id: 2,
    name: 'grade',
    label: 'Grade',
    description: 'Letter grades only',
    reportColumns: ['grade', 'point']
  },
  {
    id: 3,
    name: 'both',
    label: 'Marks and Grade',
    description: 'Both numeric marks and letter grades',
    reportColumns: ['total', 'grade', 'point']
  }
];

/**
 * Get exam type by ID
 */
export function getExamTypeById(id: number): ExamType | undefined {
  return EXAM_TYPES.find(type => type.id === id);
}

/**
 * Get exam type by name
 */
export function getExamTypeByName(name: string): ExamType | undefined {
  return EXAM_TYPES.find(type => type.name === name);
}

/**
 * Get exam type options for dropdowns
 */
export function getExamTypeOptions() {
  return EXAM_TYPES.map(type => ({
    value: type.id,
    label: type.label
  }));
}

/**
 * Get exam type display name by ID
 */
export function getExamTypeLabel(id: number): string {
  const type = getExamTypeById(id);
  return type ? type.label : 'Unknown';
}

/**
 * Get exam type name by ID
 */
export function getExamTypeName(id: number): string {
  const type = getExamTypeById(id);
  return type ? type.name : 'unknown';
}
