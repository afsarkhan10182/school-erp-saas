const { Op } = require('sequelize');
const { GradingSystem, GradeScale } = require('~/models');
const BaseService = require('../shared/base.service');
const ApiError = require('~/utils/ApiError');
const { logger } = require('~/utils/logger');

class GradingService {
  /**
   * Get the default grading system for a school
   */
  static async getDefaultGradingSystem(schoolId) {
    return BaseService.executeWithErrorHandling(async () => {
      // First try to get school-specific default
      let gradingSystem = await GradingSystem.findOne({
        where: {
          school_id: schoolId,
          is_default: true,
          is_active: true
        },
        include: [
          {
            model: GradeScale,
            as: 'gradeScales',
            where: { is_passing: { [Op.ne]: null } },
            required: false,
            order: [['sort_order', 'ASC']]
          }
        ]
      });

      // If no school-specific default, get global default
      if (!gradingSystem) {
        gradingSystem = await GradingSystem.findOne({
          where: {
            school_id: null,
            is_default: true,
            is_active: true
          },
          include: [
            {
              model: GradeScale,
              as: 'gradeScales',
              where: { is_passing: { [Op.ne]: null } },
              required: false,
              order: [['sort_order', 'ASC']]
            }
          ]
        });
      }

      if (!gradingSystem) {
        throw new ApiError(404, 'No default grading system found');
      }

      return gradingSystem;
    }, 'Get Default Grading System');
  }

  /**
   * Calculate grade based on percentage using database-driven grading system
   */
  static async calculateGrade(percentage, schoolId) {
    return BaseService.executeWithErrorHandling(async () => {
      const gradingSystem = await this.getDefaultGradingSystem(schoolId);
      
      if (!gradingSystem.gradeScales || gradingSystem.gradeScales.length === 0) {
        throw new ApiError(400, 'No grade scales found for the grading system');
      }

      // Find the appropriate grade based on percentage
      const gradeScale = gradingSystem.gradeScales.find(scale => 
        percentage >= scale.min_percentage && percentage <= scale.max_percentage
      );

      if (!gradeScale) {
        throw new ApiError(400, `No grade found for percentage ${percentage}%`);
      }

      return {
        grade: gradeScale.grade,
        grade_points: gradeScale.grade_points,
        is_passing: gradeScale.is_passing,
        description: gradeScale.description,
        grading_system: {
          id: gradingSystem.id,
          name: gradingSystem.name,
          code: gradingSystem.code
        }
      };
    }, 'Calculate Grade');
  }

  /**
   * Calculate grade points based on grade using database-driven system
   */
  static async calculateGradePoints(grade, schoolId) {
    return BaseService.executeWithErrorHandling(async () => {
      const gradingSystem = await this.getDefaultGradingSystem(schoolId);
      
      const gradeScale = await GradeScale.findOne({
        where: {
          grading_system_id: gradingSystem.id,
          grade: grade
        }
      });

      if (!gradeScale) {
        throw new ApiError(400, `Grade '${grade}' not found in the grading system`);
      }

      return gradeScale.grade_points;
    }, 'Calculate Grade Points');
  }

  /**
   * Get all grade scales for a grading system
   */
  static async getGradeScales(gradingSystemId) {
    return BaseService.executeWithErrorHandling(async () => {
      const gradeScales = await GradeScale.findAll({
        where: { grading_system_id: gradingSystemId },
        order: [['sort_order', 'ASC']]
      });

      return gradeScales;
    }, 'Get Grade Scales');
  }

  /**
   * Validate if a percentage is passing based on the grading system
   */
  static async isPassing(percentage, schoolId) {
    return BaseService.executeWithErrorHandling(async () => {
      const gradingSystem = await this.getDefaultGradingSystem(schoolId);
      
      // Check if percentage meets the passing threshold
      return percentage >= gradingSystem.passing_percentage;
    }, 'Check Passing Status');
  }

  /**
   * Get grading system statistics
   */
  static async getGradingStats(schoolId) {
    return BaseService.executeWithErrorHandling(async () => {
      const gradingSystem = await this.getDefaultGradingSystem(schoolId);
      
      const stats = {
        total_grades: gradingSystem.gradeScales.length,
        passing_grades: gradingSystem.gradeScales.filter(scale => scale.is_passing).length,
        failing_grades: gradingSystem.gradeScales.filter(scale => !scale.is_passing).length,
        passing_percentage: gradingSystem.passing_percentage,
        max_grade_points: gradingSystem.max_grade_points,
        grade_type: gradingSystem.grade_type
      };

      return stats;
    }, 'Get Grading Stats');
  }
}

module.exports = GradingService;
