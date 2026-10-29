const { calculateWeightedReportCard } = require('../src/utils/academic/weightedReportCard');

describe('calculateWeightedReportCard', () => {
  const entries = [
    { exam_id: 'a', exam: { name: 'Midterm' }, weightage: 40 },
    { exam_id: 'b', exam: { name: 'Final' }, weightage: 60 }
  ];

  test('normalizes relative weights and excludes a missing result', () => {
    const result = calculateWeightedReportCard(entries, { a: { percentage: 80 } });
    expect(result.percentage).toBe(80);
    expect(result.breakdown[1]).toMatchObject({ percentage: null, has_result: false });
  });

  test('combines available scores using their configured weights', () => {
    const result = calculateWeightedReportCard(entries, {
      a: { percentage: 80 },
      b: { percentage: 90 }
    });
    expect(result.percentage).toBe(86);
  });

  test('excludes absences and distinguishes all-absent from no results', () => {
    expect(calculateWeightedReportCard(entries, { a: { is_absent: true } })).toMatchObject({
      percentage: null,
      is_absent: true
    });
    expect(calculateWeightedReportCard(entries, {})).toMatchObject({
      percentage: null,
      is_absent: false
    });
  });

  test('ignores invalid percentages rather than corrupting the aggregate', () => {
    const result = calculateWeightedReportCard(entries, {
      a: { percentage: 101 },
      b: { percentage: 75 }
    });
    expect(result.percentage).toBe(75);
    expect(result.breakdown[0].percentage).toBeNull();
  });
});
