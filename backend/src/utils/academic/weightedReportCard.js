const calculateWeightedReportCard = (examEntries, resultsByExam) => {
  const breakdown = examEntries.map(entry => {
    const result = resultsByExam[entry.exam_id];
    const percentage = Number(result?.percentage);
    return {
      exam_id: entry.exam_id,
      exam_name: entry.exam?.name || 'Exam',
      weightage: Number(entry.weightage),
      percentage:
        result &&
        !result.is_absent &&
        Number.isFinite(percentage) &&
        percentage >= 0 &&
        percentage <= 100
          ? percentage
          : null,
      is_absent: Boolean(result?.is_absent),
      has_result: Boolean(result)
    };
  });
  const included = breakdown.filter(item => item.percentage !== null);
  const totalWeight = included.reduce((sum, item) => sum + item.weightage, 0);
  const percentage = totalWeight
    ? included.reduce((sum, item) => sum + item.percentage * item.weightage, 0) / totalWeight
    : null;

  return {
    percentage,
    is_absent:
      percentage === null &&
      breakdown.some(item => item.has_result) &&
      breakdown.filter(item => item.has_result).every(item => item.is_absent),
    breakdown
  };
};

module.exports = { calculateWeightedReportCard };
