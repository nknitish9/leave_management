const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/leave_management');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

const seedUsers = async () => {
  try {
    // Clear existing users
    await User.deleteMany();

    // Create demo users
    const users = [
      {
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'password123',
        role: 'admin',
        department: 'Management',
        leaveBalance: {
          sick: 10,
          casual: 15,
          annual: 20
        }
      },
      {
        name: 'Employee User',
        email: 'employee@example.com',
        password: 'password123',
        role: 'employee',
        department: 'Engineering',
        leaveBalance: {
          sick: 10,
          casual: 15,
          annual: 20
        }
      }
    ];

    for (const userData of users) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);

      const user = new User({
        ...userData,
        password: hashedPassword
      });

      await user.save();
      console.log(`Created user: ${userData.email}`);
    }

    console.log('Demo users created successfully!');
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

connectDB().then(() => {
  seedUsers();
});
