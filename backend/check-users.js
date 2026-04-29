const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const User = require('./models/User');

async function checkUsers() {
  try {
    const users = await User.find({}, 'name email _id');
    console.log('👥 All users in database:');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - ID: ${user._id}`);
    });
    
    const fileOwner = users.find(user => user._id.toString() === '68d192856d6442c35dbb449c');
    if (fileOwner) {
      console.log(`\n📁 Files belong to: ${fileOwner.name} (${fileOwner.email})`);
    } else {
      console.log(`\n❌ No user found with ID: 68d192856d6442c35dbb449c`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkUsers();