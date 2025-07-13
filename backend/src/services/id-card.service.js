const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { logger } = require('../utils/logger');

/**
 * Generate ID card for a student
 */
const generateStudentIdCard = async (studentData, schoolData) => {
  try {
    // Create ID card data structure
    const idCardData = {
      id: uuidv4(),
      student_id: studentData.id,
      student_name: `${studentData.first_name} ${studentData.last_name}`,
      admission_number: studentData.admission_number,
      class_name: studentData.current_class,
      section: studentData.section,
      academic_year: studentData.academic_year,
      roll_number: studentData.roll_number,
      date_of_birth: studentData.date_of_birth,
      blood_group: studentData.blood_group,
      emergency_contact: studentData.emergency_contact,
      photo_url: studentData.photo_url,
      school_name: schoolData.name,
      school_address: schoolData.address,
      school_logo: schoolData.logo_url,
      principal_name: schoolData.principal_name,
      principal_signature: schoolData.principal_signature,
      valid_until: new Date(new Date().getFullYear() + 1, 3, 31), // Valid until next March 31
      generated_at: new Date(),
      barcode: generateBarcode(studentData.admission_number),
      qr_code: generateQRCode(studentData.id)
    };

    // Generate HTML template for ID card
    const idCardHtml = generateIdCardHtml(idCardData);
    
    // Save ID card data (in real implementation, save to database)
    const idCardPath = path.join(__dirname, '../../../uploads/id-cards', `${idCardData.id}.html`);
    const idCardDir = path.dirname(idCardPath);
    
    if (!fs.existsSync(idCardDir)) {
      fs.mkdirSync(idCardDir, { recursive: true });
    }
    
    fs.writeFileSync(idCardPath, idCardHtml);
    
    logger.info(`ID card generated successfully for student: ${studentData.admission_number}`);
    
    return {
      success: true,
      data: {
        id_card_id: idCardData.id,
        student_id: idCardData.student_id,
        file_path: idCardPath,
        valid_until: idCardData.valid_until,
        generated_at: idCardData.generated_at
      }
    };
  } catch (error) {
    logger.error('Error generating ID card:', error);
    throw error;
  }
};

/**
 * Generate HTML template for ID card
 */
const generateIdCardHtml = (data) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Student ID Card</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          margin: 0; 
          padding: 20px; 
          background-color: #f0f0f0;
        }
        .id-card {
          width: 350px;
          height: 220px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 15px;
          box-shadow: 0 8px 16px rgba(0,0,0,0.3);
          position: relative;
          overflow: hidden;
          margin: 0 auto;
        }
        .id-card::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
          animation: shine 3s infinite;
        }
        @keyframes shine {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .header {
          background: rgba(255,255,255,0.95);
          padding: 8px 15px;
          text-align: center;
          border-bottom: 2px solid #4a5568;
        }
        .school-name {
          font-size: 14px;
          font-weight: bold;
          color: #2d3748;
          margin: 0;
          text-transform: uppercase;
        }
        .id-title {
          font-size: 10px;
          color: #4a5568;
          margin: 2px 0 0 0;
        }
        .content {
          padding: 15px;
          color: white;
          position: relative;
          z-index: 1;
        }
        .student-info {
          display: flex;
          align-items: flex-start;
          margin-bottom: 10px;
        }
        .photo {
          width: 60px;
          height: 60px;
          border-radius: 8px;
          background: white;
          margin-right: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          color: #666;
          border: 2px solid white;
        }
        .details {
          flex: 1;
          font-size: 11px;
          line-height: 1.3;
        }
        .student-name {
          font-size: 13px;
          font-weight: bold;
          margin-bottom: 4px;
          text-transform: uppercase;
        }
        .info-row {
          margin-bottom: 2px;
        }
        .label {
          font-weight: bold;
          display: inline-block;
          width: 60px;
        }
        .footer {
          position: absolute;
          bottom: 8px;
          left: 15px;
          right: 15px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 9px;
          color: rgba(255,255,255,0.9);
        }
        .valid-until {
          font-weight: bold;
        }
        .barcode {
          width: 80px;
          height: 15px;
          background: white;
          border-radius: 2px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 8px;
          color: #000;
          font-family: monospace;
        }
      </style>
    </head>
    <body>
      <div class="id-card">
        <div class="header">
          <h2 class="school-name">${data.school_name}</h2>
          <p class="id-title">Student Identity Card</p>
        </div>
        
        <div class="content">
          <div class="student-info">
            <div class="photo">
              ${data.photo_url ? `<img src="${data.photo_url}" alt="Student Photo" style="width: 100%; height: 100%; object-fit: cover; border-radius: 6px;">` : 'PHOTO'}
            </div>
            <div class="details">
              <div class="student-name">${data.student_name}</div>
              <div class="info-row">
                <span class="label">Adm No:</span> ${data.admission_number}
              </div>
              <div class="info-row">
                <span class="label">Class:</span> ${data.class_name}${data.section ? '-' + data.section : ''}
              </div>
              <div class="info-row">
                <span class="label">Roll No:</span> ${data.roll_number || 'N/A'}
              </div>
              <div class="info-row">
                <span class="label">DOB:</span> ${data.date_of_birth ? new Date(data.date_of_birth).toLocaleDateString() : 'N/A'}
              </div>
              <div class="info-row">
                <span class="label">Blood:</span> ${data.blood_group || 'N/A'}
              </div>
            </div>
          </div>
        </div>
        
        <div class="footer">
          <div class="valid-until">
            Valid Until: ${data.valid_until.toLocaleDateString()}
          </div>
          <div class="barcode">
            ${data.barcode}
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Generate barcode for student
 */
const generateBarcode = (admissionNumber) => {
  // Simple barcode representation
  return `|||| | ||| || | ||||`;
};

/**
 * Generate QR code for student
 */
const generateQRCode = (studentId) => {
  // In real implementation, you would use a QR code library
  return `QR:${studentId}`;
};

/**
 * Get ID card by student ID
 */
const getStudentIdCard = async (studentId) => {
  try {
    // In real implementation, fetch from database
    const idCardData = {
      id: uuidv4(),
      student_id: studentId,
      file_path: `/uploads/id-cards/${studentId}.html`,
      valid_until: new Date(new Date().getFullYear() + 1, 3, 31),
      generated_at: new Date()
    };

    return {
      success: true,
      data: idCardData
    };
  } catch (error) {
    logger.error('Error fetching ID card:', error);
    throw error;
  }
};

/**
 * Regenerate ID card
 */
const regenerateIdCard = async (studentId) => {
  try {
    // In real implementation, fetch student and school data from database
    const studentData = {
      id: studentId,
      first_name: 'John',
      last_name: 'Doe',
      admission_number: 'ADM2024001',
      current_class: 'Class X',
      section: 'A',
      academic_year: '2024-25',
      roll_number: '15',
      date_of_birth: '2008-05-15',
      blood_group: 'O+',
      emergency_contact: '9876543210',
      photo_url: null
    };

    const schoolData = {
      name: 'St. Mary\'s High School',
      address: '123 Education Street, City',
      logo_url: null,
      principal_name: 'Dr. Jane Smith',
      principal_signature: null
    };

    return await generateStudentIdCard(studentData, schoolData);
  } catch (error) {
    logger.error('Error regenerating ID card:', error);
    throw error;
  }
};

module.exports = {
  generateStudentIdCard,
  getStudentIdCard,
  regenerateIdCard
};
