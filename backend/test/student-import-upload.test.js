require('module-alias/register');

const express = require('express');
const XLSX = require('xlsx');
const { uploadCSV } = require('../src/middleware/shared/upload');

describe('student spreadsheet upload middleware', () => {
  let server;
  let baseUrl;

  beforeAll(async () => {
    const app = express();
    app.post('/upload', uploadCSV('file', { spreadsheets: true }), (req, res) => {
      res.status(200).json({ name: req.file.originalname });
    });
    app.post('/limited', uploadCSV('file', { maxFileSize: 16 }), (req, res) => {
      res.status(200).json({ name: req.file.originalname });
    });
    app.use((error, req, res, next) => {
      res.status(error.statusCode || 400).json({ message: error.message });
    });
    server = app.listen(0);
    await new Promise(resolve => server.once('listening', resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
  });

  afterAll(async () => {
    await new Promise((resolve, reject) => server.close(error => (error ? reject(error) : resolve())));
  });

  it('accepts an XLSX upload in memory', async () => {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([['FirstName']]), 'Students');
    const form = new FormData();
    form.append(
      'file',
      new Blob([XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }),
      'students.xlsx'
    );

    const response = await fetch(`${baseUrl}/upload`, { method: 'POST', body: form });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ name: 'students.xlsx' });
  });

  it('accepts legacy XLS uploads', async () => {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([['FirstName']]), 'Students');
    const form = new FormData();
    form.append(
      'file',
      new Blob([XLSX.write(workbook, { type: 'buffer', bookType: 'xls' })], {
        type: 'application/vnd.ms-excel'
      }),
      'students.xls'
    );

    const response = await fetch(`${baseUrl}/upload`, { method: 'POST', body: form });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ name: 'students.xls' });
  });

  it('continues to reject unsupported upload types', async () => {
    const form = new FormData();
    form.append('file', new Blob(['not a spreadsheet'], { type: 'application/pdf' }), 'students.pdf');

    const response = await fetch(`${baseUrl}/upload`, { method: 'POST', body: form });
    expect(response.status).toBe(400);
  });

  it('enforces a route-specific file size limit', async () => {
    const form = new FormData();
    form.append('file', new Blob(['12345678901234567'], { type: 'text/csv' }), 'students.csv');

    const response = await fetch(`${baseUrl}/limited`, { method: 'POST', body: form });
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ message: 'File too large. Max size is 16 bytes.' });
  });
});
