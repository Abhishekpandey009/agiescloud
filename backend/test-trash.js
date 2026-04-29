// Test script to debug trash functionality
const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const File = require('./models/File');

async function testTrashFunctionality() {
  try {
    console.log('🔍 Testing trash functionality...');
    
    // Find all files
    const allFiles = await File.find({});
    console.log(`📁 Total files in database: ${allFiles.length}`);
    
    // Find non-deleted files
    const activeFiles = await File.find({ isDeleted: false });
    console.log(`✅ Active files: ${activeFiles.length}`);
    
    // Find deleted files
    const deletedFiles = await File.find({ isDeleted: true });
    console.log(`🗑️ Deleted files: ${deletedFiles.length}`);
    
    console.log('\n📋 All files:');
    allFiles.forEach((file, index) => {
      console.log(`${index + 1}. ${file.originalName} - Deleted: ${file.isDeleted} - Owner: ${file.ownerId}`);
    });
    
    if (deletedFiles.length > 0) {
      console.log('\n🗑️ Deleted files details:');
      deletedFiles.forEach((file, index) => {
        console.log(`${index + 1}. ${file.originalName} - Deleted at: ${file.deletedAt}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

testTrashFunctionality();