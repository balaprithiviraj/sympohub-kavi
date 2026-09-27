require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const studentRoutes = require('./routes/students');
const eventRoutes = require('./routes/events');
const registrationRoutes = require('./routes/registrations');
const certificateRoutes = require('./routes/certificates');

const app = express();
const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();

  // Auto-seed an empty database so the app works out of the box
  // (essential for the in-memory dev DB; harmless for persistent DBs).
  if (process.env.AUTO_SEED !== 'false') {
    try {
      const Event = require('./models/Event');
      const Student = require('./models/Student');
      const bcrypt = require('bcryptjs');
      const count = await Event.countDocuments();
      if (count === 0) {
        const { events } = require('./seed/seed');
        await Event.insertMany(events);
        console.log(`Auto-seeded ${events.length} events`);
        const sampleEmail = 'priya.sharma@college.edu';
        if (!(await Student.findOne({ email: sampleEmail }))) {
          await Student.create({
            name: 'Priya Sharma',
            email: sampleEmail,
            phone: '9876543210',
            college: 'Anna University',
            department: 'Computer Science',
            passwordHash: await bcrypt.hash('Priya@123', 10)
          });
          console.log('Created sample student priya.sharma@college.edu / Priya@123');
        }
      }
    } catch (err) {
      console.error('Auto-seed failed:', err.message);
    }
  }

  app.listen(PORT, () => {
    console.log(`SympoHub backend listening on port ${PORT}`);
  });
};

const FRONTEND_URLS = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (FRONTEND_URLS.includes(origin)) return cb(null, true);
      // Allow any localhost port only in development for Vite preview
      if (
        process.env.NODE_ENV !== 'production' &&
        origin.startsWith('http://localhost:')
      )
        return cb(null, true);
      return cb(new Error('Not allowed by CORS'));
    },
    credentials: true
  })
);
app.use(express.json());
app.use(morgan('dev'));

app.get('/', (req, res) => {
  res.json({ message: 'SympoHub API running' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/students', studentRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/certificates', certificateRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use(errorHandler);

start();
