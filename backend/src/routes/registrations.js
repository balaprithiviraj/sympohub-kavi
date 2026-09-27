const express = require('express');
const { body, param, validationResult } = require('express-validator');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const auth = require('../middleware/auth');

const router = express.Router();

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
  }
  return next();
};

const isPast = (date) => new Date(date).getTime() < Date.now();

// Optional auth: attaches req.studentId when a valid Bearer token is present,
// but does not reject requests without one (spec-style calls pass studentId in body).
const optionalAuth = (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token || !process.env.JWT_SECRET) return next();
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.studentId = decoded.id;
    req.student = decoded;
  } catch {
    // ignore invalid token here; strict routes use `auth`
  }
  return next();
};

// POST /api/registrations — supports { eventId } with auth, or { studentId, eventId } (spec style)
router.post(
  '/',
  optionalAuth,
  [
    body('eventId').isMongoId().withMessage('Valid eventId is required'),
    body('studentId').optional().isMongoId().withMessage('Valid studentId is required')
  ],
  handleValidation,
  async (req, res, next) => {
    try {
      // If route is called without auth, require studentId in body.
      // If both token and body studentId are present, they must match.
      let studentId = req.studentId || req.body.studentId;
      if (req.studentId && req.body.studentId && req.body.studentId !== req.studentId) {
        return res.status(403).json({ message: 'Forbidden. studentId does not match token.' });
      }
      if (!studentId) {
        return res.status(401).json({ message: 'Authentication required. Provide a Bearer token or studentId.' });
      }
      const { eventId } = req.body;
      // Pro: atomic seat reserve first to prevent oversell on concurrent requests
      const event = await Event.findOneAndUpdate(
        { _id: eventId, $expr: { $lt: ['$registeredCount', '$participantLimit'] } },
        { $inc: { registeredCount: 1 } },
        { new: true }
      );
      if (!event) {
        const exists = await Event.exists({ _id: eventId });
        if (!exists) {
          return res.status(404).json({ message: 'Event not found.' });
        }
        return res.status(400).json({ message: 'Event is full.' });
      }

      const status = isPast(event.date) ? 'Registered' : 'Upcoming';

      let registration;
      try {
        registration = await Registration.create({
          studentId,
          eventId,
          status
        });
      } catch (err) {
        // Rollback reserved seat on duplicate / failure
        await Event.updateOne({ _id: eventId }, { $inc: { registeredCount: -1 } });
        if (err.code === 11000) {
          return res.status(409).json({ message: 'You have already registered for this event.' });
        }
        throw err;
      }

      const populated = await registration.populate('eventId');
      return res.status(201).json({ registration: populated });
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({ message: 'You have already registered for this event.' });
      }
      return next(err);
    }
  }
);

// GET /api/registrations/student/:studentId — auth optional; enforce ownership when token present; populate eventId; auto-mark Completed if past
router.get(
  '/student/:studentId',
  optionalAuth,
  [param('studentId').isMongoId().withMessage('Invalid student id')],
  handleValidation,
  async (req, res, next) => {
    try {
      if (req.studentId && req.studentId !== req.params.studentId) {
        return res.status(403).json({ message: 'Forbidden. You can only view your own registrations.' });
      }
      const regs = await Registration.find({ studentId: req.params.studentId })
        .populate('eventId')
        .sort({ registrationDate: -1 })
        .lean();

      // Auto-mark Completed if event date is past — single bulk write
      const pastIds = regs
        .filter((r) => r.eventId && r.eventId.date && isPast(r.eventId.date) && r.status !== 'Completed')
        .map((r) => r._id);
      if (pastIds.length) {
        await Registration.updateMany({ _id: { $in: pastIds } }, { $set: { status: 'Completed' } });
        regs.forEach((r) => {
          if (pastIds.some((id) => String(id) === String(r._id))) r.status = 'Completed';
        });
      }

      return res.json({ registrations: regs, total: regs.length });
    } catch (err) {
      return next(err);
    }
  }
);

// GET /api/registrations/:id
router.get(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid registration id')],
  handleValidation,
  async (req, res, next) => {
    try {
      const reg = await Registration.findById(req.params.id).populate('eventId').populate('studentId', '-passwordHash');
      if (!reg) {
        return res.status(404).json({ message: 'Registration not found.' });
      }
      return res.json({ registration: reg });
    } catch (err) {
      return next(err);
    }
  }
);

// DELETE /api/registrations/:id — auth, decrement count
router.delete(
  '/:id',
  auth,
  [param('id').isMongoId().withMessage('Invalid registration id')],
  handleValidation,
  async (req, res, next) => {
    try {
      const reg = await Registration.findById(req.params.id);
      if (!reg) {
        return res.status(404).json({ message: 'Registration not found.' });
      }
      if (reg.studentId.toString() !== req.studentId) {
        return res.status(403).json({ message: 'Forbidden. You can only cancel your own registration.' });
      }
      await Registration.deleteOne({ _id: reg._id });
      await Event.findByIdAndUpdate(reg.eventId, { $inc: { registeredCount: -1 } });
      // Guard against negative counts
      await Event.updateOne({ _id: reg.eventId, registeredCount: { $lt: 0 } }, { $set: { registeredCount: 0 } });
      return res.json({ message: 'Registration cancelled.' });
    } catch (err) {
      return next(err);
    }
  }
);

module.exports = router;
