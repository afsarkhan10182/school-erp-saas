import { safeStudyMaterialUrl } from './safeStudyMaterialUrl.js';

export const getHomeworkStudyMaterials = (materials, subjectId = '') =>
  (Array.isArray(materials) ? materials : []).filter(material =>
    (!subjectId || material.subject_id === subjectId) &&
    safeStudyMaterialUrl(material.external_url || material.notes)
  );
