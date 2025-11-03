const { DataTypes } = require('sequelize');
const { sequelize } = require('~/config/database');
const { logger } = require('~/utils/shared/logger');

const CertificateTemplate = sequelize.define(
  'CertificateTemplate',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Certificate name is required' },
        len: {
          args: [2, 255],
          msg: 'Certificate name must be between 2 and 255 characters'
        }
      }
    },
    user_type: {
      type: DataTypes.ENUM('student', 'employee'),
      allowNull: false,
      validate: {
        isIn: {
          args: [['student', 'employee']],
          msg: 'User type must be either student or employee'
        }
      }
    },
    page_layout: {
      type: DataTypes.ENUM('portrait', 'landscape'),
      allowNull: false,
      defaultValue: 'portrait',
      validate: {
        isIn: {
          args: [['portrait', 'landscape']],
          msg: 'Page layout must be either portrait or landscape'
        }
      }
    },
    qr_code_text: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'QR code text is required' }
      }
    },
    user_photo_style: {
      type: DataTypes.ENUM('square', 'round'),
      allowNull: false,
      defaultValue: 'square',
      validate: {
        isIn: {
          args: [['square', 'round']],
          msg: 'User photo style must be either square or round'
        }
      }
    },
    photo_size: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 100,
      validate: {
        min: { args: [50], msg: 'Photo size must be at least 50px' },
        max: { args: [300], msg: 'Photo size must not exceed 300px' }
      }
    },
    top_space: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 20,
      validate: {
        min: { args: [0], msg: 'Top space cannot be negative' }
      }
    },
    bottom_space: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 20,
      validate: {
        min: { args: [0], msg: 'Bottom space cannot be negative' }
      }
    },
    left_space: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 20,
      validate: {
        min: { args: [0], msg: 'Left space cannot be negative' }
      }
    },
    right_space: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 20,
      validate: {
        min: { args: [0], msg: 'Right space cannot be negative' }
      }
    },
    signature_image: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'Path to signature image file'
    },
    logo_image: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'Path to logo image file'
    },
    background_image: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'Path to background image file'
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Certificate content is required' }
      }
    },
    branch_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'branches',
        key: 'id'
      }
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    updated_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  },
  {
    tableName: 'certificate_templates',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['branch_id'] },
      { fields: ['user_type'] },
      { fields: ['is_active'] },
      { fields: ['created_by'] }
    ],
    hooks: {
      afterCreate: async template => {
        logger.info(`New certificate template created: ${template.name} (${template.id})`);
      },
      afterUpdate: async template => {
        logger.info(`Certificate template updated: ${template.name} (${template.id})`);
      }
    }
  }
);

// Define associations
CertificateTemplate.associate = models => {
  // Certificate template belongs to Branch
  CertificateTemplate.belongsTo(models.Branch, {
    foreignKey: 'branch_id',
    as: 'branch'
  });

  // Certificate template belongs to User (created_by)
  CertificateTemplate.belongsTo(models.User, {
    foreignKey: 'created_by',
    as: 'createdBy'
  });

  // Certificate template belongs to User (updated_by)
  CertificateTemplate.belongsTo(models.User, {
    foreignKey: 'updated_by',
    as: 'updatedBy'
  });
};

module.exports = CertificateTemplate;
