module.exports = (percentage, isAbsent, gradingSystem) => {
  if (isAbsent) return null;

  const value = Number(percentage);
  const gradeScale = gradingSystem?.gradeScales?.find(
    scale => value >= Number(scale.min_percentage) && value <= Number(scale.max_percentage)
  );

  return (
    gradeScale?.is_passing ??
    (gradingSystem?.passing_percentage == null
      ? null
      : value >= Number(gradingSystem.passing_percentage))
  );
};
