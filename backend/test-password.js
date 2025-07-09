const bcrypt = require('bcryptjs');

const testPassword = async () => {
  const password = 'Admin@123';
  const hash = '$2b$12$rmBjYgb9wcj4R6GxBK0Y/uPnI7KoMZ9cjKRxhhiS15L3G4mKI2QBO';
  
  console.log('Testing password:', password);
  console.log('Stored hash:', hash);
  
  const isMatch = await bcrypt.compare(password, hash);
  console.log('Password match:', isMatch);
  
  // Test creating a new hash
  const newHash = await bcrypt.hash(password, 12);
  console.log('New hash:', newHash);
  
  const newMatch = await bcrypt.compare(password, newHash);
  console.log('New hash match:', newMatch);
};

testPassword(); 