const { Term } = require('~/models');
const { logger } = require('~/utils/shared/logger');
const { Op } = require('sequelize');

/**
 * Get all terms with filtering and pagination
 */
const getAllTerms = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      academic_year,
      is_active,
      school_id,
      branch_id
    } = req.query;

    // Build where clause
    const whereClause = {};

    // School and branch filtering
    if (school_id) {
      whereClause.school_id = school_id;
    }
    if (branch_id) {
      whereClause.branch_id = branch_id;
    }

    // Academic year filtering
    if (academic_year) {
      whereClause.academic_year = academic_year;
    }

    // Active status filtering
    if (is_active !== undefined) {
      whereClause.is_active = is_active === 'true';
    }

    // Search filtering
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { code: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Calculate pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Get terms with pagination
    const { count, rows: terms } = await Term.findAndCountAll({
      where: whereClause,
      order: [
        ['start_date', 'ASC'],
        ['name', 'ASC']
      ],
      limit: parseInt(limit),
      offset,
      include: [
        {
          model: Term.associations.school?.target,
          as: 'school',
          attributes: ['id', 'name']
        },
        {
          model: Term.associations.branch?.target,
          as: 'branch',
          attributes: ['id', 'name']
        }
      ]
    });

    const totalPages = Math.ceil(count / parseInt(limit));

    res.json({
      success: true,
      data: terms,
      pagination: {
        current_page: parseInt(page),
        total_pages: totalPages,
        total_items: count,
        items_per_page: parseInt(limit),
        has_next: parseInt(page) < totalPages,
        has_prev: parseInt(page) > 1
      }
    });
  } catch (error) {
    logger.error('Error fetching terms:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch terms',
      error: error.message
    });
  }
};

/**
 * Get a single term by ID
 */
const getTermById = async (req, res) => {
  try {
    const { id } = req.params;

    const term = await Term.findByPk(id, {
      include: [
        {
          model: Term.associations.school?.target,
          as: 'school',
          attributes: ['id', 'name']
        },
        {
          model: Term.associations.branch?.target,
          as: 'branch',
          attributes: ['id', 'name']
        }
      ]
    });

    if (!term) {
      return res.status(404).json({
        success: false,
        message: 'Term not found'
      });
    }

    res.json({
      success: true,
      data: term
    });
  } catch (error) {
    logger.error('Error fetching term:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch term',
      error: error.message
    });
  }
};

/**
 * Create a new term -
 */
const createTerm = async (req, res) => {
  try {
    //  - Only 2 essential fields, set defaults for others
    const termData = {
      branch_id: req.body.branch_id,
      name: req.body.name,
      // Set defaults for hidden fields ()
      code: req.body.code || `T${Date.now()}`,
      description: req.body.description || '',
      start_date: req.body.start_date || new Date().toISOString().split('T')[0],
      end_date:
        req.body.end_date ||
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      academic_year: req.body.academic_year || new Date().getFullYear().toString(),
      is_active: req.body.is_active !== false,
      school_id: req.user.school_id,
      created_by: req.user.id
    };

    const term = await Term.create(termData);

    // Fetch the created term with associations
    const createdTerm = await Term.findByPk(term.id, {
      include: [
        {
          model: Term.associations.school?.target,
          as: 'school',
          attributes: ['id', 'name']
        },
        {
          model: Term.associations.branch?.target,
          as: 'branch',
          attributes: ['id', 'name']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Term created successfully',
      data: createdTerm
    });
  } catch (error) {
    logger.error('Error creating term:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create term',
      error: error.message
    });
  }
};

/**
 * Update a term -
 */
const updateTerm = async (req, res) => {
  try {
    const { id } = req.params;

    // Debug logging
    console.log('Update Term - ID:', id);
    console.log('Update Term - Body:', req.body);
    console.log('Update Term - Params:', req.params);

    // Check if body exists
    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: 'Request body is missing'
      });
    }

    //  - Only update essential fields, keep others as defaults
    const updateData = {
      branch_id: req.body.branch_id,
      name: req.body.name,
      updated_by: req.user.id
    };

    const [updatedRowsCount] = await Term.update(updateData, {
      where: { id }
    });

    if (updatedRowsCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Term not found'
      });
    }

    // Fetch the updated term
    const updatedTerm = await Term.findByPk(id, {
      include: [
        {
          model: Term.associations.school?.target,
          as: 'school',
          attributes: ['id', 'name']
        },
        {
          model: Term.associations.branch?.target,
          as: 'branch',
          attributes: ['id', 'name']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Term updated successfully',
      data: updatedTerm
    });
  } catch (error) {
    logger.error('Error updating term:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update term',
      error: error.message
    });
  }
};

/**
 * Delete a term
 */
const deleteTerm = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedRowsCount = await Term.destroy({
      where: { id }
    });

    if (deletedRowsCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Term not found'
      });
    }

    res.json({
      success: true,
      message: 'Term deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting term:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete term',
      error: error.message
    });
  }
};

module.exports = {
  getAllTerms,
  getTermById,
  createTerm,
  updateTerm,
  deleteTerm
};
