require('module-alias/register');

const config = require('../src/config/config');
const { resolveUploadsPath, resolvePrivateReportCardsPath } = require('../src/utils/shared/pathHelper');

describe('private report-card archive storage path', () => {
  const originalDirectory = config.uploads.privateReportCardsDir;

  afterEach(() => {
    config.uploads.privateReportCardsDir = originalDirectory;
  });

  it('keeps archived PDFs outside the publicly served uploads tree', () => {
    const archivePath = resolvePrivateReportCardsPath('DEMOERP', '2026', 'archive.pdf');
    const relative = require('path').relative(resolveUploadsPath(), archivePath);
    expect(relative === '..' || relative.startsWith(`..${require('path').sep}`)).toBe(true);
  });

  it('rejects a public archive root and path traversal segments', () => {
    config.uploads.privateReportCardsDir = resolveUploadsPath('public');
    expect(() => resolvePrivateReportCardsPath('DEMOERP')).toThrow(/outside the public uploads directory/);
    config.uploads.privateReportCardsDir = originalDirectory;
    expect(() => resolvePrivateReportCardsPath('..', '..', 'exposed.pdf')).toThrow(/Invalid private report-card path/);
  });
});
