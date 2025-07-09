const { School } = require('../models');
const SchoolService = require('../services/school.service');
const ApiError = require('../utils/ApiError');
const { hasPermission } = require('../middleware/permission');

class LibraryController {
  // Example: Add a book (only if library module enabled and user has permission)
  static async addBook(req, res, next) {
    try {
      // Get the user's school
      const school = await School.findByPk(req.user.school_id);
      if (!school) throw new ApiError(404, 'School not found');

      // Enforce module access
      if (!SchoolService.isModuleEnabled(school, 'library')) {
        throw new ApiError(403, 'Library module is not enabled for this school.');
      }

      // Fine-grained permission check
      if (!hasPermission(req.user, 'library_manage_books')) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to manage library books.'
        });
      }

      // ...proceed with adding the book (not implemented here)...
      res.json({ success: true, message: 'Book added (demo only)' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = LibraryController; 