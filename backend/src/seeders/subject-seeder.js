const { Subject, Class, School } = require('../models');
const { logger } = require('../utils/logger');

const defaultSubjects = [
  // Core Subjects
  {
    name: 'Mathematics',
    code: 'MATH',
    description: 'Core mathematics including algebra, geometry, and calculus',
    category: 'core',
    credit_hours: 4,
    is_active: true
  },
  {
    name: 'English',
    code: 'ENG',
    description: 'English language and literature',
    category: 'core',
    credit_hours: 3,
    is_active: true
  },
  {
    name: 'Science',
    code: 'SCI',
    description: 'General science including physics, chemistry, and biology',
    category: 'core',
    credit_hours: 4,
    is_active: true
  },
  {
    name: 'Social Studies',
    code: 'SOC',
    description: 'History, geography, and civics',
    category: 'core',
    credit_hours: 3,
    is_active: true
  },
  
  // Language Subjects
  {
    name: 'Hindi',
    code: 'HIN',
    description: 'Hindi language and literature',
    category: 'language',
    credit_hours: 2,
    is_active: true
  },
  {
    name: 'French',
    code: 'FRE',
    description: 'French language and culture',
    category: 'language',
    credit_hours: 2,
    is_active: true
  },
  {
    name: 'Spanish',
    code: 'SPA',
    description: 'Spanish language and culture',
    category: 'language',
    credit_hours: 2,
    is_active: true
  },
  
  // Science Subjects
  {
    name: 'Physics',
    code: 'PHY',
    description: 'Advanced physics concepts',
    category: 'science',
    credit_hours: 3,
    is_active: true
  },
  {
    name: 'Chemistry',
    code: 'CHEM',
    description: 'Advanced chemistry concepts',
    category: 'science',
    credit_hours: 3,
    is_active: true
  },
  {
    name: 'Biology',
    code: 'BIO',
    description: 'Advanced biology concepts',
    category: 'science',
    credit_hours: 3,
    is_active: true
  },
  
  // Arts Subjects
  {
    name: 'Art',
    code: 'ART',
    description: 'Visual arts and drawing',
    category: 'arts',
    credit_hours: 2,
    is_active: true
  },
  {
    name: 'Music',
    code: 'MUSIC',
    description: 'Music theory and practice',
    category: 'arts',
    credit_hours: 2,
    is_active: true
  },
  {
    name: 'Drama',
    code: 'DRAMA',
    description: 'Theater and performing arts',
    category: 'arts',
    credit_hours: 2,
    is_active: true
  },
  
  // Commerce Subjects
  {
    name: 'Economics',
    code: 'ECO',
    description: 'Economic theory and principles',
    category: 'commerce',
    credit_hours: 3,
    is_active: true
  },
  {
    name: 'Business Studies',
    code: 'BUS',
    description: 'Business management and entrepreneurship',
    category: 'commerce',
    credit_hours: 3,
    is_active: true
  },
  {
    name: 'Accounting',
    code: 'ACC',
    description: 'Financial accounting and bookkeeping',
    category: 'commerce',
    credit_hours: 3,
    is_active: true
  },
  
  // Elective Subjects
  {
    name: 'Computer Science',
    code: 'CS',
    description: 'Programming and computer applications',
    category: 'elective',
    credit_hours: 3,
    is_active: true
  },
  {
    name: 'Physical Education',
    code: 'PE',
    description: 'Sports and physical fitness',
    category: 'elective',
    credit_hours: 2,
    is_active: true
  },
  
  // Extra Curricular
  {
    name: 'Debate',
    code: 'DEBATE',
    description: 'Public speaking and debate skills',
    category: 'extra_curricular',
    credit_hours: 1,
    is_active: true
  },
  {
    name: 'Robotics',
    code: 'ROBOT',
    description: 'Robotics and automation',
    category: 'extra_curricular',
    credit_hours: 2,
    is_active: true
  }
];

/**
 * Seed subjects into the database
 * This function is idempotent - safe to run multiple times
 */
async function seedSubjects() {
  try {
    logger.info('🌱 Starting subject seeding process...');
    
    // Get all schools
    const schools = await School.findAll({
      where: { is_active: true },
      attributes: ['id', 'name']
    });
    
    if (schools.length === 0) {
      logger.warn('No active schools found. Please create schools first.');
      return;
    }
    
    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const school of schools) {
      logger.info(`Processing subjects for school: ${school.name}`);
      
      for (const subjectData of defaultSubjects) {
        try {
          // Check if subject already exists for this school
          const existingSubject = await Subject.findOne({
            where: {
              school_id: school.id,
              code: subjectData.code
            }
          });
          
          if (!existingSubject) {
            // Create new subject
            await Subject.create({
              ...subjectData,
              school_id: school.id,
              created_by: null, // System seeder
              updated_by: null
            });
            
            logger.info(`✅ Created subject: ${subjectData.name} (${subjectData.code}) for school ${school.name}`);
            createdCount++;
          } else {
            // Update existing subject if needed
            const needsUpdate = 
              existingSubject.name !== subjectData.name ||
              existingSubject.description !== subjectData.description ||
              existingSubject.category !== subjectData.category ||
              existingSubject.credit_hours !== subjectData.credit_hours ||
              existingSubject.is_active !== subjectData.is_active;
            
            if (needsUpdate) {
              await existingSubject.update({
                name: subjectData.name,
                description: subjectData.description,
                category: subjectData.category,
                credit_hours: subjectData.credit_hours,
                is_active: subjectData.is_active,
                updated_by: null
              });
              
              logger.info(`🔄 Updated subject: ${subjectData.name} (${subjectData.code}) for school ${school.name}`);
              updatedCount++;
            } else {
              logger.debug(`⏭️ Skipped subject: ${subjectData.name} (${subjectData.code}) for school ${school.name} - no changes needed`);
              skippedCount++;
            }
          }
        } catch (error) {
          logger.error(`❌ Error processing subject ${subjectData.name} for school ${school.name}:`, error.message);
        }
      }
    }
    
    logger.info(`🎉 Subject seeding completed!`);
    logger.info(`📊 Summary:`);
    logger.info(`   - Created: ${createdCount} subjects`);
    logger.info(`   - Updated: ${updatedCount} subjects`);
    logger.info(`   - Skipped: ${skippedCount} subjects`);
    
  } catch (error) {
    logger.error('❌ Error in subject seeding process:', error);
    throw error;
  }
}

/**
 * Remove all seeded subjects
 */
async function removeSeededSubjects() {
  try {
    logger.info('🗑️ Starting subject removal process...');
    
    const deletedCount = await Subject.destroy({
      where: {
        created_by: null // Only remove system-seeded subjects
      }
    });
    
    logger.info(`✅ Removed ${deletedCount} seeded subjects`);
    
  } catch (error) {
    logger.error('❌ Error removing seeded subjects:', error);
    throw error;
  }
}

module.exports = {
  seedSubjects,
  removeSeededSubjects
};
