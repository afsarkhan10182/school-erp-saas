const Papa = require('papaparse');
const XLSX = require('xlsx');

const MAX_STUDENT_IMPORT_ROWS = 20000;
const STUDENT_IMPORT_FIELDS = [
  ['AdmissionNumber', 'Admission number', true],
  ['Roll', 'Roll number', false],
  ['FirstName', 'First name (or map Full name)', false],
  ['FullName', 'Full name (alternative to first/last name)', false],
  ['MiddleName', 'Middle name', false],
  ['LastName', 'Last name', false],
  ['Gender', 'Gender', true],
  ['Birthday', 'Date of birth', true],
  ['AdmissionDate', 'Admission date', true],
  ['BloodGroup', 'Blood group', false],
  ['MotherTongue', 'Mother tongue', false],
  ['Religion', 'Religion', false],
  ['Caste', 'Caste', false],
  ['AadhaarNumber', 'Aadhaar number', false],
  ['Address', 'Address', false],
  ['PostalCode', 'Postal code', false],
  ['Country', 'Country', false],
  ['Nationality', 'Nationality', false],
  ['Phone', 'Student phone', false],
  ['EmergencyContact', 'Emergency contact', false],
  ['City', 'City', false],
  ['State', 'State', false],
  ['PresentAddress', 'Present address', false],
  ['PermanentAddress', 'Permanent address', false],
  ['Category', 'Category', false],
  ['StudentEmail', 'Student email', false],
  ['Stream', 'Stream', false],
  ['PreviousExams', 'Previous exams', false],
  ['House', 'House', false],
  ['PEN', 'PEN', false],
  ['APAARID', 'APAAR ID', false],
  ['SRNo', 'SR No.', false],
  ['PreviousSoftwareID', 'ID in previous software', false],
  ['FatherName', "Father's name", false],
  ['FatherPhone', "Father's phone", false],
  ['FatherEmail', "Father's email", false],
  ['FatherOccupation', "Father's occupation", false],
  ['FatherQualification', "Father's qualification", false],
  ['FatherIncome', "Father's annual income", false],
  ['MotherName', "Mother's name", false],
  ['MotherPhone', "Mother's phone", false],
  ['MotherEmail', "Mother's email", false],
  ['MotherOccupation', "Mother's occupation", false],
  ['MotherQualification', "Mother's qualification", false],
  ['MotherIncome', "Mother's annual income", false],
  ['PlaceOfBirth', 'Place of birth', false],
  ['Height', 'Height', false],
  ['Weight', 'Weight', false],
  ['MedicalHistory', 'Medical history', false],
  ['GuardianName', 'Guardian name', true],
  ['GuardianRelation', 'Guardian relation', true],
  ['GuardianMobileNo', 'Guardian mobile', true],
  ['GuardianAddress', 'Guardian address', true],
  ['GuardianEducation', 'Guardian education', false],
  ['GuardianEmail', 'Guardian email', false],
  ['GuardianIncome', 'Guardian income', false],
  ['GuardianOccupation', 'Guardian occupation', false]
];
const REQUIRED_IMPORT_FIELDS = STUDENT_IMPORT_FIELDS.filter(([, , required]) => required).map(
  ([field]) => field
);

const normalizeHeader = value => String(value ?? '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');

const readRows = (buffer, filename) => {
  const extension = String(filename || '').toLowerCase().split('.').pop();
  if (extension === 'xlsx' || extension === 'xls') {
    const workbook = XLSX.read(buffer, {
      type: 'buffer',
      cellDates: true,
      sheetRows: MAX_STUDENT_IMPORT_ROWS + 10
    });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    if (!firstSheet) return [];
    return XLSX.utils.sheet_to_json(firstSheet, {
      header: 1,
      blankrows: false,
      defval: '',
      raw: true
    });
  }

  const parsed = Papa.parse(buffer.toString('utf8'), {
    header: false,
    skipEmptyLines: 'greedy',
    dynamicTyping: false,
    delimiter: '',
    newline: ''
  });
  if (parsed.errors.length) throw new Error(`File parsing failed: ${parsed.errors[0].message}`);
  return parsed.data;
};

const locateHeaderRow = rows => {
  const knownHeaders = new Set(STUDENT_IMPORT_FIELDS.flatMap(([field]) => [
    normalizeHeader(field),
    normalizeHeader(field.replace(/([a-z])([A-Z])/g, '$1 $2'))
  ]));
  let bestIndex = -1;
  let bestScore = 0;
  rows.slice(0, 10).forEach((row, index) => {
    const cells = (row || []).map(value => String(value ?? '').trim()).filter(Boolean);
    if (!cells.length) return;
    const score = cells.filter(value => knownHeaders.has(normalizeHeader(value))).length * 100 + cells.length;
    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  });
  return bestIndex;
};

const inspectStudentImport = (buffer, filename) => {
  const rows = readRows(buffer, filename);
  const headerRow = locateHeaderRow(rows);
  if (headerRow < 0) throw new Error('File must include a heading row');
  const headers = (rows[headerRow] || []).map((label, index) => ({
    index,
    label: String(label ?? '').trim()
  })).filter(header => header.label);
  if (!headers.length) throw new Error('File must include valid headings');
  const dataRows = rows.slice(headerRow + 1).filter(row => (row || []).some(value => String(value ?? '').trim()));
  if (!dataRows.length) throw new Error('File must contain at least one data row');
  if (dataRows.length > MAX_STUDENT_IMPORT_ROWS) {
    throw new Error(`File cannot contain more than ${MAX_STUDENT_IMPORT_ROWS} student rows`);
  }
  return { headers, dataRows, headerRow };
};

const mapStudentImportRows = (dataRows, mapping) => {
  if (!mapping || typeof mapping !== 'object' || Array.isArray(mapping)) {
    throw new Error('Choose which file columns match the student fields');
  }
  const invalidFields = Object.keys(mapping).filter(
    field => !STUDENT_IMPORT_FIELDS.some(([supported]) => supported === field)
  );
  if (invalidFields.length) throw new Error('Import mapping contains unsupported fields');
  const validIndex = index =>
    (typeof index === 'number' || (typeof index === 'string' && /^\d+$/.test(index))) &&
    Number.isInteger(Number(index)) && Number(index) >= 0;
  const invalidIndexes = Object.entries(mapping).filter(
    ([, index]) => index !== '' && index !== null && index !== undefined && !validIndex(index)
  );
  if (invalidIndexes.length) throw new Error('Import mapping contains an invalid file column');
  const missing = REQUIRED_IMPORT_FIELDS.filter(field =>
    !validIndex(mapping[field])
  );
  const nameField = validIndex(mapping.FirstName) ? 'FirstName' : 'FullName';
  if (!validIndex(mapping.FirstName) && !validIndex(mapping.FullName)) {
    missing.push('FirstName or FullName');
  }
  if (missing.length) throw new Error(`Match required fields: ${missing.join(', ')}`);
  const requiredIndexes = [
    ...REQUIRED_IMPORT_FIELDS.filter(field => field !== 'FirstName').map(field =>
      Number(mapping[field])
    ),
    Number(mapping[nameField])
  ];
  if (new Set(requiredIndexes).size !== requiredIndexes.length) {
    throw new Error('Each required student field must use a different file column');
  }
  return dataRows.map(row => {
    const mapped = {};
    Object.entries(mapping).forEach(([field, index]) => {
      const column = Number(index);
      if (!Number.isInteger(column) || column < 0 || column >= row.length) return;
      const value = row[column];
      if (value === undefined || value === null || String(value).trim() === '') return;
      if (['Birthday', 'AdmissionDate'].includes(field)) {
        if (value instanceof Date && !Number.isNaN(value.getTime())) {
          mapped[field] = value.toISOString().slice(0, 10);
          return;
        }
        if (typeof value === 'number') {
          const date = XLSX.SSF.parse_date_code(value);
          if (date) {
            mapped[field] = `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
            return;
          }
        }
        const dmy = String(value).trim().match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})$/);
        if (dmy) {
          mapped[field] = `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
          return;
        }
      }
      mapped[field] = String(value).trim();
    });
    return mapped;
  });
};

module.exports = {
  MAX_STUDENT_IMPORT_ROWS,
  STUDENT_IMPORT_FIELDS: STUDENT_IMPORT_FIELDS.map(([field, label, required]) => ({
    field,
    label,
    required
  })),
  inspectStudentImport,
  mapStudentImportRows
};
