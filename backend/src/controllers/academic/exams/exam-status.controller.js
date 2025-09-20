const ExamStatusService = require('~/services/academic/exam-status.service');
const { logger } = require('~/utils/shared/logger');

class ExamStatusController {
  /**
   * Get active exam statuses
   */
  static async getActiveExamStatuses(req, res, next) {
    try {
      const result = await ExamStatusService.getActiveExamStatuses(req.user);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get exam statuses for dropdown
   */
  static async getExamStatusesForDropdown(req, res, next) {
    try {
      const result = await ExamStatusService.getExamStatusesForDropdown(req.user);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all exam statuses with pagination and filtering
   */
  static async getAllExamStatuses(req, res, next) {
    try {
      const result = await ExamStatusService.getAllExamStatuses(req.query, req.user);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get exam status by ID
   */
  static async getExamStatusById(req, res, next) {
    try {
      const result = await ExamStatusService.getExamStatusById(req.params.id, req.user);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new exam status
   */
  static async createExamStatus(req, res, next) {
    try {
      const result = await ExamStatusService.createExamStatus(req.body, req.user.id);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update exam status
   */
  static async updateExamStatus(req, res, next) {
    try {
      const result = await ExamStatusService.updateExamStatus(req.params.id, req.body, req.user.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete exam status
   */
  static async deleteExamStatus(req, res, next) {
    try {
      const result = await ExamStatusService.deleteExamStatus(req.params.id, req.user);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ExamStatusController;
