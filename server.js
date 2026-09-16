require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const studentRoutes = require('./routes/students');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend assets
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/students', studentRoutes);

// Database connection state info
let dbStatus = {
  type: 'connecting',
  uri: '',
  connected: false
};

app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    database: dbStatus
  });
});

// Fallback to index.html for Single-Page Application routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initialize MongoDB (Local / Atlas with auto In-Memory fallback)
async function connectDatabase() {
  const targetUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/student_records';
  
  try {
    console.log(`[DB] Attempting connection to MongoDB at: ${targetUri}`);
    // Connect with a 3-second timeout for local DB check
    await mongoose.connect(targetUri, {
      serverSelectionTimeoutMS: 3000
    });
    dbStatus = { type: 'standalone', uri: targetUri, connected: true };
    console.log('[DB] Successfully connected to configured MongoDB instance.');
  } catch (err) {
    console.warn(`[DB] Could not connect to configured MongoDB (${err.message}).`);
    
    if (process.env.USE_MEMORY_DB_FALLBACK !== 'false') {
      try {
        console.log('[DB] Starting embedded MongoDB in-memory server fallback...');
        const { MongoMemoryServer } = require('mongodb-memory-server');
        const mongod = await MongoMemoryServer.create();
        const memUri = mongod.getUri();
        await mongoose.connect(memUri);
        dbStatus = { type: 'in-memory-fallback', uri: memUri, connected: true };
        console.log(`[DB] Successfully connected to in-memory MongoDB instance.`);
        
        // Auto-seed initial records for in-memory DB so the dashboard is immediately rich
        const Student = require('./models/Student');
        const count = await Student.countDocuments();
        if (count === 0) {
          await Student.insertMany([
            {
              studentId: 'STU-1001',
              name: 'Aarav Sharma',
              email: 'aarav.sharma@example.com',
              course: 'Computer Science & Engineering',
              semester: 6,
              mobile: '9876543210'
            },
            {
              studentId: 'STU-1002',
              name: 'Priya Patel',
              email: 'priya.patel@example.com',
              course: 'Data Science & AI',
              semester: 4,
              mobile: '9812345678'
            },
            {
              studentId: 'STU-1003',
              name: 'Rohan Mehta',
              email: 'rohan.mehta@example.com',
              course: 'Information Technology',
              semester: 2,
              mobile: '9765432109'
            },
            {
              studentId: 'STU-1004',
              name: 'Ananya Iyer',
              email: 'ananya.iyer@example.com',
              course: 'Electronics & Communication',
              semester: 8,
              mobile: '9988776655'
            },
            {
              studentId: 'STU-1005',
              name: 'Vikram Sengupta',
              email: 'vikram.s@example.com',
              course: 'Computer Science & Engineering',
              semester: 4,
              mobile: '9845123456'
            }
          ]);
          console.log('[DB] Seeded initial demo students into in-memory database.');
        }
      } catch (memErr) {
        console.error('[DB] Failed to start in-memory MongoDB:', memErr.message);
        dbStatus = { type: 'failed', error: memErr.message, connected: false };
      }
    } else {
      dbStatus = { type: 'failed', error: err.message, connected: false };
    }
  }
}

// Start Server
connectDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`  Student Record Management Server Running!         `);
    console.log(`  URL: http://localhost:${PORT}                    `);
    console.log(`  API: http://localhost:${PORT}/api/students       `);
    console.log(`====================================================`);
  });
});
