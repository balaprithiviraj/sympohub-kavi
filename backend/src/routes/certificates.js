const express = require('express');
const { param, validationResult } = require('express-validator');
const Certificate = require('../models/Certificate');
const Registration = require('../models/Registration');

const router = express.Router();

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
  }
  return next();
};

// Optional auth: attach student id when token present, allow spec-style unauthenticated reads
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
    // ignore; ownership check below only applies when token was valid
  }
  return next();
};

// GET /api/certificates/student/:studentId — auth optional; enforce ownership when token present; auto-generate for Completed registrations
router.get(
  '/student/:studentId',
  optionalAuth,
  [param('studentId').isMongoId().withMessage('Invalid student id')],
  handleValidation,
  async (req, res, next) => {
    try {
      if (req.studentId && req.studentId !== req.params.studentId) {
        return res.status(403).json({ message: 'Forbidden. You can only view your own certificates.' });
      }
      const { studentId } = req.params;

      const completedRegs = await Registration.find({ studentId, status: 'Completed' })
        .select('eventId')
        .lean();

      const eventIds = [...new Set(completedRegs.map((r) => String(r.eventId)).filter(Boolean))];

      if (eventIds.length) {
        const existing = await Certificate.find({ studentId, eventId: { $in: eventIds } })
          .select('eventId')
          .lean();
        const have = new Set(existing.map((c) => String(c.eventId)));
        const toCreate = eventIds
          .filter((id) => !have.has(id))
          .map((eventId) => ({
            studentId,
            eventId,
            certificateType: 'Participation',
            certificateUrl: `https://sympohub.io/certificates/${studentId}-${eventId}.pdf`,
            issuedDate: new Date()
          }));
        if (toCreate.length) {
          await Certificate.insertMany(toCreate, { ordered: false }).catch((e) => {
            if (e.code !== 11000) throw e;
          });
        }
      }

      const certificates = await Certificate.find({ studentId })
        .populate('eventId')
        .sort({ issuedDate: -1 });

      return res.json({ certificates, total: certificates.length });
    } catch (err) {
      return next(err);
    }
  }
);

module.exports = router;
