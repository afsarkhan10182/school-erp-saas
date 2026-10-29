require('module-alias/register');

const { logger } = require('../src/utils/shared/logger');
const { validate } = require('../src/middleware/shared/validate');
const { body } = require('express-validator');

describe('request validation logging', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    jest.restoreAllMocks();
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('does not log request bodies or uploaded files in development', async () => {
    process.env.NODE_ENV = 'development';
    const debug = jest.spyOn(logger, 'debug').mockImplementation(() => {});
    const next = jest.fn();
    const middleware = validate([]);

    await middleware({
      method: 'POST',
      originalUrl: '/api/auth/login',
      body: { email: 'demo@example.test', password: 'do-not-log' },
      files: [{ originalname: 'sensitive-document.pdf' }]
    }, {}, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(debug).not.toHaveBeenCalled();
  });

  it('logs only field names when validation fails, not sensitive input values', async () => {
    process.env.NODE_ENV = 'development';
    const debug = jest.spyOn(logger, 'debug').mockImplementation(() => {});
    const response = {
      status: jest.fn(() => response),
      json: jest.fn(payload => { response.body = payload; })
    };
    const password = 'sensitive-password-value';
    const middleware = validate([body('password').equals('expected').withMessage('Password invalid')]);

    await middleware({ body: { password } }, response, jest.fn());

    expect(response.status).toHaveBeenCalledWith(422);
    expect(response.body.errors).toEqual({ password: 'Password invalid' });
    expect(debug).toHaveBeenCalledWith('Validation errors in fields:', ['password']);
    expect(JSON.stringify(debug.mock.calls)).not.toContain(password);
  });
});
