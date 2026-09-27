const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, param, validationResult } = require('express-validator');
const Student = require('../models/Student');
const auth = require('../middleware/auth');

const router = express.Router();

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
  }
  return next();
};

const signToken = (id) => {
  if (!process.env.JWT_SECRET) {
    const err = new Error('Server misconfigured: JWT_SECRET is not set.');
    err.statusCode = 500;
    throw err;
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const publicStudent = (s) => ({
  id: s._id,
  name: s.name,
  email: s.email,
  phone: s.phone,
  college: s.college,
  department: s.department,
  createdAt: s.createdAt
});

// POST /api/students/register
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required').escape(),
    body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('phone')
      .trim()
      .matches(/^[0-9]{10}$/)
      .withMessage('Phone must be 10 digits'),
    body('college').trim().notEmpty().withMessage('College is required').escape(),
    body('department')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Department is required')
      .escape(),
    body('dept').optional().trim().escape(),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters')
  ],
  handleValidation,
  async (req, res, next) => {
    try {
      const { name, email, phone, college, password } = req.body;
      // Support both `department` and `dept` field names (spec uses dept)
      const department = req.body.department || req.body.dept;
      if (!department || !String(department).trim()) {
        return res.status(400).json({ message: 'Department is required' });
      }

      const existing = await Student.findOne({ email });
      if (existing) {
        return res.status(409).json({ message: 'Email already registered.' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const student = await Student.create({
        name,
        email,
        phone,
        college,
        department,
        passwordHash
      });

      const token = signToken(student._id);
      return res.status(201).json({ student: publicStudent(student), token });
    } catch (err) {
      return next(err);
    }
  }
);

// POST /api/students/login
router.post(
  '/login',
  [
    body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required')
  ],
  handleValidation,
  async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const student = await Student.findOne({ email });
      if (!student) {
        return res.status(401).json({ message: 'Invalid email or password.' });
      }
      const ok = await bcrypt.compare(password, student.passwordHash);
      if (!ok) {
        return res.status(401).json({ message: 'Invalid email or password.' });
      }
      const token = signToken(student._id);
      return res.json({ student: publicStudent(student), token });
    } catch (err) {
      return next(err);
    }
  }
);

// GET /api/students/:id — public basic profile (omit passwordHash)
router.get(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid student id')],
  handleValidation,
  async (req, res, next) => {
    try {
      const student = await Student.findById(req.params.id).select('-passwordHash -__v');
      if (!student) {
        return res.status(404).json({ message: 'Student not found.' });
      }
      return res.json({ student });
    } catch (err) {
      return next(err);
    }
  }
);

// PUT /api/students/:id — auth required, update name/phone/college/department
router.put(
  '/:id',
  auth,
  [
    param('id').isMongoId().withMessage('Invalid student id'),
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty').escape(),
    body('phone')
      .optional()
      .trim()
      .matches(/^[0-9]{10}$/)
      .withMessage('Phone must be 10 digits'),
    body('college').optional().trim().notEmpty().withMessage('College cannot be empty').escape(),
    body('department').optional().trim().notEmpty().withMessage('Department cannot be empty').escape(),
    body('dept').optional().trim().notEmpty().withMessage('Department cannot be empty').escape()
  ],
  handleValidation,
  async (req, res, next) => {
    try {
      if (req.studentId !== req.params.id) {
        return res.status(403).json({ message: 'Forbidden. You can only update your own profile.' });
      }
      // Support `dept` alias for `department`
      if (req.body.dept !== undefined && req.body.department === undefined) {
        req.body.department = req.body.dept;
      }
      const allowed = ['name', 'phone', 'college', 'department'];
      const update = {};
      allowed.forEach((k) => {
        if (req.body[k] !== undefined) update[k] = req.body[k];
      });
      const student = await Student.findByIdAndUpdate(req.params.id, update, {
        new: true,
        runValidators: true
      }).select('-passwordHash');
      if (!student) {
        return res.status(404).json({ message: 'Student not found.' });
      }
      return res.json({ student });
    } catch (err) {
      return next(err);
    }
  }
);

module.exports = router;
