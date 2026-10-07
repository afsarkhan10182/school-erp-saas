const assert = require('assert');
require('module-alias/register');
const BaseService = require('../src/services/shared/base.service');

describe('BaseService pagination response', () => {
  it('keeps page, limit, total, and totalPages in the expected order', () => {
    const response = BaseService.buildPaginationResponse(['row-1', 'row-2'], 2, 2, 5, 'branches');

    assert.deepStrictEqual(response.pagination, {
      page: 2,
      limit: 2,
      total: 5,
      totalPages: 3
    });
    assert.deepStrictEqual(response.branches, ['row-1', 'row-2']);
  });
});
