require('module-alias/register');

const config = require('../src/config/config');
const { logger } = require('../src/utils/shared/logger');
const { sendSMS } = require('../src/utils/communication/sms');

describe('SMS development utility', () => {
  const originalEnvironment = config.app.env;

  afterAll(() => {
    config.app.env = originalEnvironment;
    jest.restoreAllMocks();
  });

  it('logs a valid notification without contacting a provider in development', async () => {
    config.app.env = 'development';
    const info = jest.spyOn(logger, 'info').mockImplementation(() => logger);

    await expect(sendSMS({ to: '+919000000002', message: 'Attendance update' })).resolves.toMatchObject({
      success: true,
      provider: 'development'
    });
    expect(info).toHaveBeenCalledWith('SMS would be sent:', expect.objectContaining({
      to: '+919000000002',
      message: 'Attendance update...'
    }));
  });
});
