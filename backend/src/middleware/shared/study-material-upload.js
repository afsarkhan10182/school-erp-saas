const multer = require('multer');
const path = require('path');
const config = require('~/config/config');

const allowedExtensions = new Map([
  ['.pdf', new Set(['application/pdf'])],
  ['.jpg', new Set(['image/jpeg'])],
  ['.jpeg', new Set(['image/jpeg'])],
  ['.png', new Set(['image/png'])],
  ['.gif', new Set(['image/gif'])],
  ['.doc', new Set(['application/msword'])],
  [
    '.docx',
    new Set(['application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
  ]
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: Number(config.uploads.maxFileSize) || 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (!allowedExtensions.get(extension)?.has(file.mimetype)) {
      return callback(new Error('Only PDF, image, and Word study materials are allowed'));
    }
    callback(null, true);
  }
});

module.exports = upload.single('file');
