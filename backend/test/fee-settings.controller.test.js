require('module-alias/register');

const FeeSettingsController = require('../src/controllers/administration/settings/fee-settings.controller');
const { School } = require('../src/models');

const callController = async (method, req) => {
  let body;
  let statusCode = 200;
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(payload) {
      body = payload;
      return this;
    }
  };
  let error;

  await FeeSettingsController[method](req, res, value => {
    error = value;
  });
  if (error) throw error;
  return { body, statusCode };
};

afterEach(() => jest.restoreAllMocks());

describe('fee settings', () => {
  it('loads saved fee settings for the selected Platform Owner school', async () => {
    const findByPk = jest.spyOn(School, 'findByPk').mockResolvedValue({
      currency: 'USD',
      fee_settings: { defaultPaymentDueDays: 20, lateFeePercentage: 0 }
    });

    const { body, statusCode } = await callController('getFeeSettings', {
      user: { role: 'super_admin', school_id: null },
      schoolId: 'selected-school'
    });

    expect(statusCode).toBe(200);
    expect(findByPk).toHaveBeenCalledWith('selected-school', expect.any(Object));
    expect(body.data.feeSettings).toMatchObject({
      defaultCurrency: 'USD',
      defaultPaymentDueDays: 20,
      lateFeePercentage: 0
    });
  });

  it('persists a zero late-fee percentage instead of replacing it with the default', async () => {
    const school = { update: jest.fn() };
    jest.spyOn(School, 'findByPk').mockResolvedValue(school);

    const { body, statusCode } = await callController('updateFeeSettings', {
      user: { school_id: 'school-1' },
      body: { feeSettings: { lateFeePercentage: 0 } }
    });

    expect(statusCode).toBe(200);
    expect(school.update).toHaveBeenCalledWith(expect.objectContaining({
      fee_settings: expect.objectContaining({ lateFeePercentage: 0 })
    }));
    expect(body.data.feeSettings.lateFeePercentage).toBe(0);
  });

  it.each([-1, 50.1, 'not-a-number'])(
    'rejects late-fee percentage %s before loading or writing a school',
    async lateFeePercentage => {
      const findByPk = jest.spyOn(School, 'findByPk');

      await expect(callController('updateFeeSettings', {
        user: { school_id: 'school-1' },
        body: { feeSettings: { lateFeePercentage } }
      })).rejects.toMatchObject({ statusCode: 400 });

      expect(findByPk).not.toHaveBeenCalled();
    }
  );
});
