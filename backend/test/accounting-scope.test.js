require('module-alias/register');

const AccountingCategoryController = require('../src/controllers/accounting/category.controller');
const AccountingTransactionController = require('../src/controllers/accounting/transaction.controller');
const { AccountCategory, Branch, SchoolTransaction } = require('../src/models');

describe('accounting school and branch scope', () => {
  const originals = {};

  beforeEach(() => {
    originals.categoryFindAndCountAll = AccountCategory.findAndCountAll;
    originals.categoryFindOne = AccountCategory.findOne;
    originals.categoryCreate = AccountCategory.create;
    originals.categoryFindByPk = AccountCategory.findByPk;
    originals.transactionFindAndCountAll = SchoolTransaction.findAndCountAll;
    originals.transactionCreate = SchoolTransaction.create;
    originals.transactionFindByPk = SchoolTransaction.findByPk;
    originals.branchFindOne = Branch.findOne;
  });

  afterEach(() => {
    AccountCategory.findAndCountAll = originals.categoryFindAndCountAll;
    AccountCategory.findOne = originals.categoryFindOne;
    AccountCategory.create = originals.categoryCreate;
    AccountCategory.findByPk = originals.categoryFindByPk;
    SchoolTransaction.findAndCountAll = originals.transactionFindAndCountAll;
    SchoolTransaction.create = originals.transactionCreate;
    SchoolTransaction.findByPk = originals.transactionFindByPk;
    Branch.findOne = originals.branchFindOne;
  });

  it('keeps Accountant transaction and category lists inside their school and selected branch', async () => {
    for (const [model, list] of [
      [SchoolTransaction, AccountingTransactionController.getAllTransactions],
      [AccountCategory, AccountingCategoryController.getAllCategories]
    ]) {
      model.findAndCountAll = async options => {
        expect(options.where).toMatchObject({ school_id: 'school-1', branch_id: 'branch-2' });
        return { count: 0, rows: [] };
      };
      const res = { json: jest.fn() };
      await list.call(
        null,
        { user: { role: 'accountant', school_id: 'school-1' }, query: { branch_id: 'branch-2', school_id: 'school-other' } },
        res,
        error => {
          if (error) throw error;
        }
      );
    }
  });

  it.each([
    ['amount', 'ASC', [['amount', 'ASC'], ['date', 'DESC'], ['created_at', 'DESC']]],
    ['category', 'DESC', [[{ model: AccountCategory, as: 'category' }, 'name', 'DESC'], ['date', 'DESC'], ['created_at', 'DESC']]],
    ['unsafe_field', 'ASC', [['date', 'DESC'], ['created_at', 'DESC']]]
  ])('sorts transactions safely by %s', async (sort_by, sort_order, expectedOrder) => {
    SchoolTransaction.findAndCountAll = async options => {
      expect(options.order).toEqual(expectedOrder);
      return { count: 0, rows: [] };
    };
    await AccountingTransactionController.getAllTransactions(
      { user: { role: 'accountant', school_id: 'school-1', branch_id: 'branch-2' }, query: { sort_by, sort_order } },
      { json: jest.fn() },
      error => { if (error) throw error; }
    );
  });

  it('keeps Platform Owner transaction and category lists inside the inspected school when supplied', async () => {
    for (const [model, list] of [
      [SchoolTransaction, AccountingTransactionController.getAllTransactions],
      [AccountCategory, AccountingCategoryController.getAllCategories]
    ]) {
      model.findAndCountAll = async options => {
        expect(options.where).toMatchObject({ school_id: 'school-inspected', branch_id: 'branch-2' });
        return { count: 0, rows: [] };
      };
      await list.call(
        null,
        { user: { role: 'super_admin' }, query: { school_id: 'school-inspected', branch_id: 'branch-2' } },
        { json: jest.fn() },
        error => { if (error) throw error; }
      );
    }
  });

  it('does not run an unscoped transaction query when a staff account lacks a school', async () => {
    SchoolTransaction.findAndCountAll = jest.fn();
    const status = jest.fn().mockReturnThis();
    await AccountingTransactionController.getAllTransactions(
      { user: { role: 'accountant' }, query: {} },
      { status, json: jest.fn() },
      error => {
        if (error) throw error;
      }
    );
    expect(status).toHaveBeenCalledWith(403);
    expect(SchoolTransaction.findAndCountAll).not.toHaveBeenCalled();
  });

  it('does not let a Branch Admin widen accounting lists with a branch query', async () => {
    for (const [model, list] of [
      [SchoolTransaction, AccountingTransactionController.getAllTransactions],
      [AccountCategory, AccountingCategoryController.getAllCategories]
    ]) {
      model.findAndCountAll = async options => {
        expect(options.where).toMatchObject({
          school_id: 'school-1',
          branch_id: 'branch-assigned'
        });
        return { count: 0, rows: [] };
      };
      await list.call(
        null,
        {
          user: { role: 'branch_admin', school_id: 'school-1', branch_id: 'branch-assigned' },
          query: { branch_id: 'branch-other' }
        },
        { json: jest.fn() },
        error => {
          if (error) throw error;
        }
      );
    }
  });

  it('pins assigned Accountant transaction and category lists to their branch', async () => {
    for (const [model, list] of [
      [SchoolTransaction, AccountingTransactionController.getAllTransactions],
      [AccountCategory, AccountingCategoryController.getAllCategories]
    ]) {
      model.findAndCountAll = async options => {
        expect(options.where).toMatchObject({ school_id: 'school-1', branch_id: 'branch-assigned' });
        return { count: 0, rows: [] };
      };
      await list(
        { user: { role: 'accountant', school_id: 'school-1', branch_id: 'branch-assigned' }, query: { branch_id: 'branch-forged' } },
        { json: jest.fn() },
        error => { if (error) throw error; }
      );
    }
  });

  it('pins assigned Accountant transaction and category creation to their branch', async () => {
    Branch.findOne = jest.fn().mockResolvedValue({ id: 'branch-assigned', school_id: 'school-1' });
    AccountCategory.findOne = jest.fn().mockResolvedValue({ id: 'category-1', type: 'income' });
    AccountCategory.create = jest.fn().mockResolvedValue({ id: 'category-created' });
    SchoolTransaction.create = jest.fn().mockResolvedValue({ id: 'transaction-created' });
    const response = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });
    const request = { user: { role: 'accountant', school_id: 'school-1', branch_id: 'branch-assigned' }, body: { branch_id: 'branch-forged', category_id: 'category-1', name: 'Test', amount: 1, date: '2026-10-28' } };

    await AccountingTransactionController.createTransaction(request, response(), error => { if (error) throw error; });
    expect(Branch.findOne).toHaveBeenCalledWith({ where: { id: 'branch-assigned', school_id: 'school-1' } });
    expect(AccountCategory.findOne).toHaveBeenCalledWith({ where: { id: 'category-1', school_id: 'school-1', branch_id: 'branch-assigned' } });
    expect(SchoolTransaction.create).toHaveBeenCalledWith(expect.objectContaining({ branch_id: 'branch-assigned' }));

    await AccountingCategoryController.createCategory({ ...request, body: { ...request.body, type: 'income' } }, response(), error => { if (error) throw error; });
    expect(AccountCategory.create).toHaveBeenCalledWith(expect.objectContaining({ branch_id: 'branch-assigned' }));
  });

  it('denies assigned Accountants reading, updating, or deleting another branch transaction/category', async () => {
    const res = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });
    const req = { user: { role: 'accountant', school_id: 'school-1', branch_id: 'branch-assigned' }, params: { id: 'other-branch-record' }, body: { name: 'Attempted edit' } };
    const foreignTransaction = { id: 'other-branch-record', school_id: 'school-1', branch_id: 'branch-other', update: jest.fn(), destroy: jest.fn() };
    const foreignCategory = { ...foreignTransaction };

    SchoolTransaction.findByPk = jest.fn().mockResolvedValue(foreignTransaction);
    for (const action of [AccountingTransactionController.getTransactionById, AccountingTransactionController.updateTransaction, AccountingTransactionController.deleteTransaction]) {
      const response = res();
      await action(req, response, error => { if (error) throw error; });
      expect(response.status).toHaveBeenCalledWith(403);
    }
    expect(foreignTransaction.update).not.toHaveBeenCalled();
    expect(foreignTransaction.destroy).not.toHaveBeenCalled();

    AccountCategory.findByPk = jest.fn().mockResolvedValue(foreignCategory);
    for (const action of [AccountingCategoryController.getCategoryById, AccountingCategoryController.updateCategory, AccountingCategoryController.deleteCategory]) {
      const response = res();
      await action(req, response, error => { if (error) throw error; });
      expect(response.status).toHaveBeenCalledWith(403);
    }
    expect(foreignCategory.update).not.toHaveBeenCalled();
    expect(foreignCategory.destroy).not.toHaveBeenCalled();
  });

  it('does not let an assigned Accountant move their transaction or category to another branch', async () => {
    Branch.findOne = jest.fn().mockResolvedValue({ id: 'branch-assigned', school_id: 'school-1' });
    AccountCategory.findOne = jest.fn().mockResolvedValue({ id: 'category-1', type: 'income' });
    const transaction = { id: 'transaction-1', school_id: 'school-1', branch_id: 'branch-assigned', category_id: 'category-1', update: jest.fn() };
    const category = { id: 'category-1', school_id: 'school-1', branch_id: 'branch-assigned', update: jest.fn() };
    SchoolTransaction.findByPk = jest.fn().mockResolvedValue(transaction);
    AccountCategory.findByPk = jest.fn().mockResolvedValue(category);
    const req = {
      user: { role: 'accountant', school_id: 'school-1', branch_id: 'branch-assigned' },
      params: { id: 'record-1' },
      body: { branch_id: 'branch-forged', category_id: 'category-1' }
    };

    await AccountingTransactionController.updateTransaction(req, { json: jest.fn() }, error => { if (error) throw error; });
    await AccountingCategoryController.updateCategory(req, { json: jest.fn() }, error => { if (error) throw error; });

    expect(transaction.update).toHaveBeenCalledWith(expect.objectContaining({ branch_id: 'branch-assigned' }));
    expect(category.update).toHaveBeenCalledWith(expect.objectContaining({ branch_id: 'branch-assigned' }));
  });

  it('rejects transaction creation when its branch is outside the authenticated school', async () => {
    Branch.findOne = jest.fn().mockResolvedValue(null);
    SchoolTransaction.create = jest.fn();
    const status = jest.fn().mockReturnThis();
    const json = jest.fn();
    await AccountingTransactionController.createTransaction(
      {
        user: { role: 'accountant', school_id: 'school-1' },
        body: { branch_id: 'foreign-branch' }
      },
      { status, json },
      error => {
        if (error) throw error;
      }
    );
    expect(Branch.findOne).toHaveBeenCalledWith({
      where: { id: 'foreign-branch', school_id: 'school-1' }
    });
    expect(status).toHaveBeenCalledWith(404);
    expect(SchoolTransaction.create).not.toHaveBeenCalled();
  });

  it('rejects category creation for a branch outside the authenticated school', async () => {
    Branch.findOne = jest.fn().mockResolvedValue(null);
    AccountCategory.create = jest.fn();
    const status = jest.fn().mockReturnThis();
    await AccountingCategoryController.createCategory(
      {
        user: { role: 'accountant', school_id: 'school-1' },
        body: { name: 'Foreign', type: 'income', branch_id: 'foreign-branch' }
      },
      { status, json: jest.fn() },
      error => {
        if (error) throw error;
      }
    );
    expect(status).toHaveBeenCalledWith(404);
    expect(AccountCategory.create).not.toHaveBeenCalled();
  });

  it('rejects a category from another branch when creating a transaction', async () => {
    Branch.findOne = jest.fn().mockResolvedValue({ id: 'branch-1' });
    AccountCategory.findOne = jest.fn().mockResolvedValue(null);
    SchoolTransaction.create = jest.fn();
    const status = jest.fn().mockReturnThis();
    await AccountingTransactionController.createTransaction(
      {
        user: { role: 'accountant', school_id: 'school-1' },
        body: { category_id: 'foreign-category', branch_id: 'branch-1' }
      },
      { status, json: jest.fn() },
      error => {
        if (error) throw error;
      }
    );
    expect(AccountCategory.findOne).toHaveBeenCalledWith({
      where: { id: 'foreign-category', school_id: 'school-1', branch_id: 'branch-1' }
    });
    expect(SchoolTransaction.create).not.toHaveBeenCalled();
  });

  it('ignores tenant IDs supplied in category updates', async () => {
    const category = { school_id: 'school-1', branch_id: 'branch-1', update: jest.fn() };
    const originalFindByPk = AccountCategory.findByPk;
    AccountCategory.findByPk = jest.fn().mockResolvedValue(category);
    Branch.findOne = jest.fn().mockResolvedValue({ id: 'branch-1' });
    try {
      await AccountingCategoryController.updateCategory(
        {
          user: { role: 'accountant', school_id: 'school-1' },
          params: { id: 'category-1' },
          body: { school_id: 'school-2', name: 'Local name' }
        },
        { json: jest.fn() },
        error => {
          if (error) throw error;
        }
      );
      expect(category.update).toHaveBeenCalledWith({ name: 'Local name', branch_id: 'branch-1' });
      expect(category.update.mock.calls[0][0]).not.toHaveProperty('school_id');
    } finally {
      AccountCategory.findByPk = originalFindByPk;
    }
  });

  it('does not allow transaction updates to move data to another school', async () => {
    const transaction = {
      school_id: 'school-1',
      branch_id: 'branch-1',
      category_id: 'category-1',
      update: jest.fn()
    };
    const originalFindByPk = SchoolTransaction.findByPk;
    SchoolTransaction.findByPk = jest.fn().mockResolvedValue(transaction);
    Branch.findOne = jest.fn().mockResolvedValue({ id: 'branch-1' });
    AccountCategory.findOne = jest.fn().mockResolvedValue({ type: 'income' });
    try {
      await AccountingTransactionController.updateTransaction(
        {
          user: { role: 'accountant', school_id: 'school-1' },
          params: { id: 'transaction-1' },
          body: { school_id: 'school-2', name: 'Local edit' }
        },
        { json: jest.fn() },
        error => {
          if (error) throw error;
        }
      );
      expect(transaction.update).toHaveBeenCalledWith({
        name: 'Local edit',
        type: 'income',
        category_id: 'category-1',
        branch_id: 'branch-1'
      });
      expect(transaction.update.mock.calls[0][0]).not.toHaveProperty('school_id');
    } finally {
      SchoolTransaction.findByPk = originalFindByPk;
    }
  });
});
