const assert = require('assert');
const resolveCorsOrigin = require('../src/utils/shared/corsOrigin');

describe('CORS origin allowlist', () => {
  it('reflects an explicitly allowed request origin', () => {
    assert.strictEqual(
      resolveCorsOrigin(['http://localhost:3000', 'http://127.0.0.1:3001'], 'http://127.0.0.1:3001'),
      'http://127.0.0.1:3001'
    );
  });

  it('does not allow an origin outside the configured allowlist', () => {
    assert.strictEqual(resolveCorsOrigin(['http://localhost:3000'], 'http://unlisted.example'), false);
  });

  it('preserves wildcard configuration and non-browser requests', () => {
    assert.strictEqual(resolveCorsOrigin(['*'], 'http://unlisted.example'), 'http://unlisted.example');
    assert.strictEqual(resolveCorsOrigin(['http://localhost:3000'], undefined), '*');
  });
});
