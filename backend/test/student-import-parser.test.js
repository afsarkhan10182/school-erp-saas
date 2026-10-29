const XLSX = require('xlsx');
const {
  inspectStudentImport,
  mapStudentImportRows
} = require('../src/utils/academic/studentImportParser');

const mapping = {
  AdmissionNumber: 4,
  FirstName: 0,
  Gender: 1,
  Birthday: 2,
  AdmissionDate: 3,
  GuardianName: 5,
  GuardianRelation: 6,
  GuardianMobileNo: 7,
  GuardianAddress: 8
};

describe('student import parser', () => {
  it.each([
    ['CSV', 'students.csv', Buffer.from('School roster\nStudent,Sex,DOB,Joined,Adm No,Parent,Relation,Mobile,Address\nSarah,Female,2015-01-01,2026-04-01,DEMO-1,Guardian,Mother,9000000000,Address')],
    ['Excel', 'students.xlsx', XLSX.write(
      (() => {
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([
          ['School roster'],
          ['Student', 'Sex', 'DOB', 'Joined', 'Adm No', 'Parent', 'Relation', 'Mobile', 'Address'],
          ['Sarah', 'Female', '2015-01-01', '2026-04-01', 'DEMO-1', 'Guardian', 'Mother', '9000000000', 'Address']
        ]), 'Students');
        return workbook;
      })(),
      { type: 'buffer', bookType: 'xlsx' }
    )]
  ])('detects a title row and maps required fields from %s', (_label, filename, buffer) => {
    const parsed = inspectStudentImport(buffer, filename);
    expect(parsed.headerRow).toBe(1);
    expect(parsed.headers[4]).toEqual({ index: 4, label: 'Adm No' });
    expect(parsed.dataRows).toHaveLength(1);
    expect(mapStudentImportRows(parsed.dataRows, mapping)[0]).toEqual({
      AdmissionNumber: 'DEMO-1',
      FirstName: 'Sarah',
      Gender: 'Female',
      Birthday: '2015-01-01',
      AdmissionDate: '2026-04-01',
      GuardianName: 'Guardian',
      GuardianRelation: 'Mother',
      GuardianMobileNo: '9000000000',
      GuardianAddress: 'Address'
    });
  });

  it('rejects mappings that omit or reuse a required source column', () => {
    expect(() => mapStudentImportRows([[]], {})).toThrow('Match required fields');
    expect(() => mapStudentImportRows([[]], { ...mapping, GuardianAddress: 7 })).toThrow(
      'different file column'
    );
  });

  it('accepts FullName instead of FirstName and maps schema-backed optional fields', () => {
    const [row] = mapStudentImportRows(
      [['DEMO-2', 'Aarav Kumar Sharma', 'Male', '2015-08-15', '2026-04-01', 'Guardian', 'Father', '9000000000', 'Address', '12345']],
      {
        AdmissionNumber: 0,
        FullName: 1,
        Gender: 2,
        Birthday: 3,
        AdmissionDate: 4,
        GuardianName: 5,
        GuardianRelation: 6,
        GuardianMobileNo: 7,
        GuardianAddress: 8,
        PostalCode: 9
      }
    );

    expect(row).toMatchObject({ FullName: 'Aarav Kumar Sharma', PostalCode: '12345' });
    expect(() => mapStudentImportRows([[]], { ...mapping, FirstName: '' })).toThrow(
      'FirstName or FullName'
    );
  });

  it('recognizes reference student identifiers for mapped imports', () => {
    const parsed = inspectStudentImport(
      Buffer.from('Roster\nAdmission number,First name,Gender,Birthday,Admission date,Guardian name,Guardian relation,Guardian mobile,Guardian address,APAAR ID,SR No.\nDEMO-3,Aarav,male,2015-08-15,2026-04-01,Parent,father,9000000000,Address,APAAR-3,SR-3'),
      'students.csv'
    );
    const [row] = mapStudentImportRows(parsed.dataRows, {
      AdmissionNumber: 0, FirstName: 1, Gender: 2, Birthday: 3, AdmissionDate: 4,
      GuardianName: 5, GuardianRelation: 6, GuardianMobileNo: 7, GuardianAddress: 8,
      APAARID: 9, SRNo: 10
    });
    expect(row).toMatchObject({ APAARID: 'APAAR-3', SRNo: 'SR-3' });
  });

  it('normalizes day-first dates to ISO for model validation', () => {
    const [row] = mapStudentImportRows(
      [['DEMO-1', 'Sarah', 'Female', '15/08/2015', '01/04/2026', 'Guardian', 'Mother', '9000000000', 'Address']],
      {
        AdmissionNumber: 0,
        FirstName: 1,
        Gender: 2,
        Birthday: 3,
        AdmissionDate: 4,
        GuardianName: 5,
        GuardianRelation: 6,
        GuardianMobileNo: 7,
        GuardianAddress: 8
      }
    );
    expect(row.Birthday).toBe('2015-08-15');
    expect(row.AdmissionDate).toBe('2026-04-01');
  });

  it('reads legacy XLS workbooks', () => {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.aoa_to_sheet([['AdmissionNumber'], ['DEMO-1']]),
      'Students'
    );
    const parsed = inspectStudentImport(
      XLSX.write(workbook, { type: 'buffer', bookType: 'xls' }),
      'students.xls'
    );
    expect(parsed.headers).toEqual([{ index: 0, label: 'AdmissionNumber' }]);
    expect(parsed.dataRows).toEqual([['DEMO-1']]);
  });

  it('accepts up to 20,000 student rows and rejects larger files', () => {
    const makeCsv = count =>
      `AdmissionNumber,FirstName\n${Array.from({ length: count }, (_, index) => `DEMO-${index},Student`).join('\n')}`;

    expect(inspectStudentImport(Buffer.from(makeCsv(20000)), 'students.csv').dataRows).toHaveLength(
      20000
    );
    expect(() => inspectStudentImport(Buffer.from(makeCsv(20001)), 'students.csv')).toThrow(
      'File cannot contain more than 20000 student rows'
    );
  });
});
