const migration = require('../src/migrations/20261027000007-enforce-online-exam-attempt-state');
const Sequelize = require('sequelize');

const queryInterface = rows => ({
  sequelize: { query: jest.fn().mockResolvedValue([rows, {}]) },
  changeColumn: jest.fn().mockResolvedValue(undefined),
  addIndex: jest.fn().mockResolvedValue(undefined),
  removeIndex: jest.fn().mockResolvedValue(undefined)
});

describe('online exam attempt-state migration', () => {
  it('refuses duplicate attempts without changing schema or data', async () => {
    const qi = queryInterface([{ online_exam_id: 'exam', student_id: 'student' }]);

    await expect(migration.up(qi, Sequelize)).rejects.toThrow('duplicate attempts exist');
    expect(qi.changeColumn).not.toHaveBeenCalled();
    expect(qi.addIndex).not.toHaveBeenCalled();
  });

  it('makes submission nullable and enforces one attempt per student and exam', async () => {
    const qi = queryInterface([]);

    await migration.up(qi, Sequelize);

    expect(qi.changeColumn).toHaveBeenCalledWith('online_exam_attempts', 'submitted_at', expect.objectContaining({ allowNull: true }));
    expect(qi.addIndex).toHaveBeenCalledWith('online_exam_attempts', ['online_exam_id', 'student_id'], expect.objectContaining({ unique: true }));
  });

  it('refuses rollback while an unfinished attempt has no submitted timestamp', async () => {
    const qi = queryInterface([{ id: 'attempt' }]);

    await expect(migration.down(qi, Sequelize)).rejects.toThrow('unsubmitted attempts exist');
    expect(qi.removeIndex).not.toHaveBeenCalled();
  });

  it('restores the original non-null submission timestamp after safe rollback', async () => {
    const qi = queryInterface([]);

    await migration.down(qi, Sequelize);

    expect(qi.removeIndex).toHaveBeenCalledWith('online_exam_attempts', 'online_exam_attempts_exam_student_unique');
    expect(qi.changeColumn).toHaveBeenCalledWith('online_exam_attempts', 'submitted_at', expect.objectContaining({ allowNull: false }));
  });
});
