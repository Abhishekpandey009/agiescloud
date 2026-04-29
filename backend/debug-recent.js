const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const File = require('./models/File');
const User = require('./models/User');

async function debugRecentActivity() {
  try {
    console.log('🔍 Debugging recent file activity...');
    
    // Find all files sorted by creation date
    const allFiles = await File.find({}).sort({ createdAt: -1 });
    console.log(`\n📁 Total files: ${allFiles.length}`);
    
    console.log('\n📋 All files (newest first):');
    allFiles.forEach((file, index) => {
      const createdTime = new Date(file.createdAt).toLocaleString();
      const deletedTime = file.deletedAt ? new Date(file.deletedAt).toLocaleString() : 'Not deleted';
      console.log(`${index + 1}. ${file.originalName}`);
      console.log(`   - Created: ${createdTime}`);
      console.log(`   - Owner: ${file.ownerId}`);
      console.log(`   - Deleted: ${file.isDeleted} (${deletedTime})`);
      console.log('');
    });
    
    // Check for any recently created files
    const recentFiles = await File.find({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
    });
    
    if (recentFiles.length > 0) {
      console.log(`🆕 Recent files (last 24 hours): ${recentFiles.length}`);
      recentFiles.forEach(file => {
        console.log(`- ${file.originalName} (Owner: ${file.ownerId}, Deleted: ${file.isDeleted})`);
      });
    }
    
    // Find all users for reference
    const users = await User.find({}, 'name email _id');
    console.log('\n👥 All users:');
    users.forEach(user => {
      console.log(`- ${user.name} (${user.email}) - ID: ${user._id}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

debugRecentActivity();