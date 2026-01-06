const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/leaves', require('./routes/leave'));

app.get('/', (req, res) => {
  res.json({ 
    message: 'Leave Management System API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      leaves: '/api/leaves'
    }
  });
});

// Error-handling middleware (keep at the VERY END)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Server Error'
  });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);  // Fallback for NODE_ENV
});