const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const ARTIFACTS_DIR = '/home/afsarkhan/Projects/school-erp-saas/ui-audit';

// Ensure artifacts directory exists
if (!fs.existsSync(ARTIFACTS_DIR)) {
  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
}

// Pages to audit
const PAGES = [
  { name: 'login', path: '/auth/login', description: 'Login page' },
  { name: 'dashboard', path: '/dashboard', description: 'Dashboard' },
  { name: 'students-list', path: '/students', description: 'Student list' },
  { name: 'students-create', path: '/students/create', description: 'Create student form' },
  { name: 'students-categories', path: '/students/categories', description: 'Student categories' },
  { name: 'students-bulk-edit', path: '/students/bulk-edit', description: 'Bulk edit students' },
  { name: 'students-promotion', path: '/students/promotion', description: 'Student promotion' },
  { name: 'academic-years', path: '/academic/years', description: 'Academic sessions' },
  { name: 'academic-classes', path: '/academic/classes', description: 'Classes management' },
  { name: 'academic-sections', path: '/academic/sections', description: 'Sections' },
  { name: 'academic-subjects', path: '/academic/subjects', description: 'Subjects' },
  { name: 'academic-streams', path: '/academic/streams', description: 'Streams' },
  { name: 'academic-timetable', path: '/academic/timetable', description: 'Class schedule' },
  { name: 'academic-timetables', path: '/academic/timetables', description: 'Teacher schedule' },
  { name: 'academic-workload', path: '/academic/workload', description: 'Teacher workload' },
  { name: 'academic-calendar', path: '/academic/calendar', description: 'Academic calendar' },
  { name: 'academic-class-assignments', path: '/academic/class-assignments', description: 'Class assignments' },
  { name: 'fees-fines', path: '/fees/fines', description: 'Fees fines' },
  { name: 'fees-collections', path: '/fees/collections', description: 'Fees collections' },
  { name: 'library', path: '/library', description: 'Library' },
  { name: 'reports', path: '/reports', description: 'Reports' },
  { name: 'reports-suite', path: '/reports/suite', description: 'Reports suite' },
  { name: 'portal', path: '/portal', description: 'Portal' },
  { name: 'exams-index', path: '/exams', description: 'Exams index' },
  { name: 'exams-schedules', path: '/exams/schedules', description: 'Exam schedules' },
  { name: 'exams-marks-entry', path: '/exams/marks-entry', description: 'Marks entry' },
  { name: 'exams-results', path: '/exams/results', description: 'Exam results' },
  { name: 'exams-report-cards', path: '/exams/report-cards', description: 'Report cards' },
  { name: 'exams-setup', path: '/exams/setup', description: 'Exam setup' },
  { name: 'admin-config', path: '/admin/config', description: 'Admin config' },
  { name: 'users-list', path: '/users', description: 'Users list' },
  { name: 'visitors', path: '/visitors', description: 'Visitors' },
  { name: 'parents', path: '/parents', description: 'Parents list' },
];

async function auditPage(browser, page, pageConfig) {
  const context = browser.contexts()[0];
  const testPage = await context.newPage();
  
  const results = {
    name: pageConfig.name,
    path: pageConfig.path,
    description: pageConfig.description,
    url: `${BASE_URL}${pageConfig.path}`,
    screenshots: [],
    issues: [],
    warnings: [],
    info: [],
  };

  try {
    console.log(`Navigating to: ${pageConfig.path}`);
    await testPage.goto(`${BASE_URL}${pageConfig.path}`, { waitUntil: 'networkidle', timeout: 15000 });
    await testPage.waitForTimeout(1500);

    // Take screenshot
    const screenshotPath = path.join(ARTIFACTS_DIR, `${pageConfig.name}-light.png`);
    await testPage.screenshot({ path: screenshotPath, fullPage: false });
    results.screenshots.push(screenshotPath);

    // Check for modal overlays
    const modals = await testPage.locator('[class*="modal"]').count();
    if (modals > 0) {
      results.info.push(`Found ${modals} modal elements`);
    }

    // Check for dropdowns
    const selects = await testPage.locator('select').count();
    if (selects > 0) {
      results.info.push(`Found ${selects} native select elements`);
    }

    // Check for labels without proper styling
    const labels = await testPage.locator('label').count();
    if (labels > 0) {
      results.info.push(`Found ${labels} label elements`);
    }

    // Check for buttons
    const buttons = await testPage.locator('button').count();
    if (buttons > 0) {
      results.info.push(`Found ${buttons} buttons`);
    }

    // Check for table headers
    const tables = await testPage.locator('table').count();
    if (tables > 0) {
      results.info.push(`Found ${tables} tables`);
    }

    // Check for forms
    const forms = await testPage.locator('form').count();
    if (forms > 0) {
      results.info.push(`Found ${forms} forms`);
    }

    // Check for cards
    const cards = await testPage.locator('.card, [class*="card"], [class*="Card"]').count();
    if (cards > 0) {
      results.info.push(`Found ${cards} card components`);
    }

    // Look for inline styles (potential issue)
    const inlineStyles = await testPage.evaluate(() => {
      return document.querySelectorAll('[style]').length;
    });
    if (inlineStyles > 0) {
      results.warnings.push(`${inlineStyles} elements with inline styles`);
    }

    // Check for console errors
    const consoleErrors = [];
    testPage.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Check for 404s
    testPage.on('response', (response) => {
      if (response.status() === 404) {
        results.warnings.push(`404: ${response.url()}`);
      }
    });

    // Check theme toggle presence
    const themeToggle = await testPage.locator('[title*="theme"], [title*="dark"], [title*="light"], button:has(svg)').count();
    results.info.push(`Potential theme toggle elements: ${themeToggle}`);

  } catch (error) {
    results.issues.push(`Navigation error: ${error.message}`);
  } finally {
    await testPage.close();
  }

  return results;
}

async function login(browser) {
  const context = browser.contexts()[0];
  const page = await context.newPage();

  console.log('Logging in with demo credentials...');
  await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Click the demo login button
  const demoButton = page.locator('button:has-text("Quick Demo Login"), button:has-text("Demo"), button:has-text("demo")').first();
  if (await demoButton.isVisible({ timeout: 3000 }).catch(() => false)) {
    await demoButton.click();
    await page.waitForTimeout(500);
  }

  // Also try filling credentials directly
  await page.fill('input[type="email"]', 'demo@gmail.com').catch(() => {});
  await page.fill('input[type="password"]', 'demo@123').catch(() => {});
  
  // Take screenshot of filled form
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'login-filled.png'), fullPage: false });

  // Submit the form
  await page.click('button[type="submit"], button:has-text("Sign In")').catch(() => {});
  await page.waitForTimeout(3000);

  // Verify login
  const currentUrl = page.url();
  console.log('After login, URL:', currentUrl);

  await page.close();
  return !currentUrl.includes('/auth/login');
}

async function main() {
  console.log('Starting UI/UX Audit for School ERP SaaS');
  console.log('==========================================');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Artifacts: ${ARTIFACTS_DIR}`);
  console.log('');

  const browser = await chromium.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });

  // Capture console logs
  const allConsoleLogs = [];
  context.on('page', (page) => {
    page.on('console', (msg) => {
      allConsoleLogs.push({ type: msg.type(), text: msg.text() });
    });
    page.on('pageerror', (err) => {
      allConsoleLogs.push({ type: 'error', text: err.message });
    });
  });

  const allResults = [];

  // First audit login page (no auth needed)
  console.log('--- Auditing Login Page ---');
  const loginResult = await auditPage(browser, null, PAGES[0]);
  allResults.push(loginResult);

  // Try to login
  console.log('--- Attempting Login ---');
  const loggedIn = await login(browser);
  console.log('Login successful:', loggedIn);

  // Audit remaining pages
  for (const pageConfig of PAGES.slice(1)) {
    console.log(`\n--- Auditing: ${pageConfig.name} ---`);
    const result = await auditPage(browser, null, pageConfig);
    allResults.push(result);
  }

  // Write results summary
  const summaryPath = path.join(ARTIFACTS_DIR, 'audit-summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(allResults, null, 2));

  // Write human-readable report
  const reportPath = path.join(ARTIFACTS_DIR, 'audit-report.md');
  let report = `# School ERP SaaS - UI/UX Audit Report\n\n`;
  report += `**Date:** ${new Date().toISOString()}\n`;
  report += `**Base URL:** ${BASE_URL}\n\n`;
  report += `## Summary\n\n`;
  report += `| Page | Path | Status | Issues |\n`;
  report += `|------|------|--------|--------|\n`;
  
  for (const result of allResults) {
    const status = result.issues.length > 0 ? '⚠️ Issues' : '✅ OK';
    report += `| ${result.name} | ${result.path} | ${status} | ${result.issues.length + result.warnings.length} |\n`;
  }

  report += `\n\n## Detailed Results\n\n`;
  for (const result of allResults) {
    report += `### ${result.name} (${result.description})\n`;
    report += `- URL: ${result.url}\n`;
    if (result.issues.length > 0) {
      report += `- **Issues:**\n`;
      for (const issue of result.issues) report += `  - ${issue}\n`;
    }
    if (result.warnings.length > 0) {
      report += `- **Warnings:**\n`;
      for (const warning of result.warnings) report += `  - ${warning}\n`;
    }
    if (result.info.length > 0) {
      report += `- **Info:**\n`;
      for (const info of result.info) report += `  - ${info}\n`;
    }
    report += `\n`;
  }

  fs.writeFileSync(reportPath, report);

  console.log('\n\n==========================================');
  console.log('Audit Complete!');
  console.log(`Report: ${reportPath}`);
  console.log(`Screenshots: ${ARTIFACTS_DIR}`);
  console.log('==========================================');

  await browser.close();
}

main().catch(console.error);
