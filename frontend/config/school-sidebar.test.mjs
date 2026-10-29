import assert from 'node:assert/strict';
import test from 'node:test';
import { buildSchoolSidebar } from './school-sidebar.ts';

const icons = new Proxy({}, { get: () => () => {} });
const base = {
  isSuperAdmin: false,
  isAdmin: false,
  isBranchAdmin: false,
  isAccountant: false,
  isReceptionist: false,
  isTeacher: false,
  isLibrarian: false,
  isStudent: false,
  isParent: false,
  streamsEnabled: true,
  icons
};

const groupsFor = role => buildSchoolSidebar({ ...base, ...role });
const allLinks = groups => {
  const flatten = items => items.flatMap(item => [item, ...flatten(item.children || [])]);
  return flatten(groups.flatMap(group => group.items));
};
const roleGroups = role =>
  groupsFor({
    isSuperAdmin: role === 'super_admin',
    isAdmin: role === 'admin',
    isBranchAdmin: role === 'branch_admin',
    isTeacher: role === 'teacher',
    isAccountant: role === 'accountant',
    isReceptionist: role === 'receptionist',
    isLibrarian: role === 'librarian',
    isParent: role === 'parent',
    isStudent: role === 'student'
  });

test('Branch Admin sees staff destinations but not admin-only settings', () => {
  const groups = groupsFor({ isBranchAdmin: true });
  const links = allLinks(groups);
  const translation = links.find(item => item.id === 'translations');

  assert.equal(
    groups.some(group => group.id === 'settings'),
    false
  );
  assert.equal(
    links.some(item => item.path === '/students/custom_field'),
    true
  );
  assert.equal(
    links.some(item => item.path === '/exams/report-card-templates'),
    false
  );
  assert.equal(translation.path, '/website/translation');
  assert.equal(translation.requiredModule, 'website');
});

test('School Admin and Platform Owner school workspace see System Settings', () => {
  const adminGroups = groupsFor({ isAdmin: true });
  assert.equal(
    adminGroups.some(group => group.id === 'settings'),
    true
  );
  assert.equal(
    allLinks(adminGroups).some(item => item.path === '/exams/report-card-templates'),
    true
  );
  assert.equal(
    allLinks(adminGroups).some(item => item.path === '/settings/audit-trail'),
    true
  );
  const schoolWorkspace = groupsFor({
    isSuperAdmin: true,
    workspaceMode: 'school',
    currentSchoolId: 'school-1'
  });
  assert.equal(
    schoolWorkspace.some(group => group.id === 'settings'),
    true
  );
  assert.equal(
    allLinks(schoolWorkspace).some(item => item.path === '/exams/report-card-templates'),
    true
  );
  assert.equal(
    allLinks(schoolWorkspace).some(item => item.path === '/settings/audit-trail'),
    true
  );
  assert.equal(
    groupsFor({ isSuperAdmin: true, workspaceMode: 'platform' }).some(
      group => group.id === 'settings'
    ),
    false
  );
});

test('all nine roles receive their expected navigation home without portal privilege leaks', () => {
  const expectedGroups = {
    super_admin: 'saas',
    admin: 'settings',
    branch_admin: 'student-details',
    teacher: 'teacher-workspace',
    accountant: 'accounting',
    receptionist: 'front-office',
    librarian: 'library',
    parent: 'portal',
    student: 'portal'
  };

  for (const [role, expectedGroup] of Object.entries(expectedGroups)) {
    const groups = roleGroups(role);
    const ids = groups.map(group => group.id);
    assert.equal(ids.includes(expectedGroup), true, `${role} has ${expectedGroup}`);
    if (role !== 'admin') assert.equal(ids.includes('settings'), false, `${role} has no settings`);
    if (role === 'parent' || role === 'student') {
      assert.equal(ids.includes('student-details'), false, `${role} has no staff student menu`);
    }
  }
  assert.equal(
    allLinks(roleGroups('teacher')).some(item => item.path === '/academic/study-materials'),
    true
  );
  assert.equal(
    allLinks(roleGroups('teacher')).some(item => item.path === '/academic/classwork'),
    true
  );
  assert.equal(
    allLinks(roleGroups('admin')).some(item => item.path === '/academic/study-materials'),
    true
  );
  assert.equal(
    allLinks(roleGroups('admin')).some(item => item.path === '/academic/syllabus'),
    true
  );
  assert.equal(
    allLinks(roleGroups('branch_admin')).some(item => item.path === '/academic/syllabus'),
    true
  );
  assert.equal(
    allLinks(roleGroups('teacher')).some(item => item.path === '/academic/syllabus'),
    true
  );
  assert.equal(
    allLinks(roleGroups('admin')).some(item => item.path === '/academic/classwork'),
    true
  );
  assert.equal(
    allLinks(roleGroups('admin')).some(item => item.path === '/academic/live-classes'),
    true
  );
  assert.equal(
    allLinks(roleGroups('teacher')).some(item => item.path === '/academic/live-classes'),
    true
  );
  assert.equal(
    allLinks(roleGroups('student')).some(item => item.path === '/academic/study-materials'),
    false
  );
  assert.equal(
    allLinks(roleGroups('student')).some(item => item.path === '/academic/live-classes'),
    false
  );
  assert.equal(
    allLinks(roleGroups('student')).some(item => item.path === '/academic/classwork'),
    false
  );
  assert.equal(
    allLinks(roleGroups('teacher')).some(item => item.path === '/settings/audit-trail'),
    false
  );
});

test('Accountant receives an Accounting Reports destination within the accounting workspace', () => {
  const groups = roleGroups('accountant');
  const reports = allLinks(groups).find(item => item.id === 'acct-report-list');
  const links = allLinks(groups);

  assert.equal(reports.path, '/reports/suite?module=accounting');
  assert.equal(reports.requiredModule, 'accounting');
  assert.deepEqual(
    links
      .filter(item => ['acct-accounts', 'acct-voucher-heads', 'acct-vouchers'].includes(item.id))
      .map(item => item.path),
    ['/accounting/account', '/accounting/account_head', '/accounting/voucher']
  );
  assert.equal(
    groups.some(group => group.id === 'reports'),
    false
  );
});
