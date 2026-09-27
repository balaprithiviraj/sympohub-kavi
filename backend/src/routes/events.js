const express = require('express');
const { query, param, validationResult } = require('express-validator');
const Event = require('../models/Event');

const router = express.Router();

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
  }
  return next();
};

const withComputed = (e) => {
  const obj = e.toObject ? e.toObject() : e;
  const limit = obj.participantLimit || 0;
  const count = obj.registeredCount || 0;
  const spotsLeft = Math.max(limit - count, 0);
  return { ...obj, spotsLeft, isFull: spotsLeft <= 0 };
};

// GET /api/events?search=&category=&college=&type=featured/upcoming/past/all&sort=upcoming|recent|popular&page=&limit=
router.get(
  '/',
  [
    query('search').optional().trim().escape(),
    query('category').optional().trim().escape(),
    query('college').optional().trim().escape(),
    query('type')
      .optional()
      .trim()
      .escape()
      .isIn(['featured', 'upcoming', 'past', 'all'])
      .withMessage('Invalid type filter'),
    query('sort').optional().isIn(['upcoming', 'recent', 'popular']).withMessage('Invalid sort'),
    query('page').optional().isInt({ min: 1 }).toInt().withMessage('Page must be >= 1'),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt().withMessage('Limit must be 1-100')
  ],
  handleValidation,
  async (req, res, next) => {
    try {
      const {
        search,
        category,
        college,
        type,
        sort = 'upcoming',
        page = 1,
        limit = 12
      } = req.query;

      const filter = {};
      const now = new Date();

      if (search) {
        filter.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { college: { $regex: search, $options: 'i' } },
          { organizer: { $regex: search, $options: 'i' } }
        ];
      }
      if (category && category.toLowerCase() !== 'all') {
        // Case-insensitive exact category match
        filter.category = { $regex: `^${category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' };
      }
      if (college) filter.college = { $regex: college, $options: 'i' };

      if (type === 'featured') filter.featured = true;
      else if (type === 'upcoming') filter.date = { $gte: now };
      else if (type === 'past') filter.date = { $lt: now };
      // type === 'all' or undefined => no date/featured filter

      let sortOption = { date: 1 };
      if (sort === 'recent') sortOption = { createdAt: -1 };
      else if (sort === 'popular') sortOption = { registeredCount: -1 };
      else sortOption = { date: 1 };

      const [total, docs] = await Promise.all([
        Event.countDocuments(filter),
        Event.find(filter)
          .sort(sortOption)
          .skip((page - 1) * limit)
          .limit(Number(limit))
          .lean()
      ]);
      const pages = Math.ceil(total / limit) || 1;

      return res.json({
        events: docs.map(withComputed),
        total,
        page: Number(page),
        pages
      });
    } catch (err) {
      return next(err);
    }
  }
);

// GET /api/events/search?q=
router.get(
  '/search',
  [query('q').trim().notEmpty().withMessage('Query q is required').escape()],
  handleValidation,
  async (req, res, next) => {
    try {
      const q = req.query.q;
      const events = await Event.find({
        $or: [
          { title: { $regex: q, $options: 'i' } },
          { description: { $regex: q, $options: 'i' } },
          { college: { $regex: q, $options: 'i' } },
          { category: { $regex: q, $options: 'i' } }
        ]
      })
        .sort({ date: 1 })
        .limit(50)
        .lean();
      return res.json({ events: events.map(withComputed), total: events.length });
    } catch (err) {
      return next(err);
    }
  }
);

// GET /api/events/category/:category
router.get(
  '/category/:category',
  [param('category').trim().notEmpty().withMessage('Category is required').escape()],
  handleValidation,
  async (req, res, next) => {
    try {
      // Case-insensitive exact match so ?category=workshop still works
      const cat = req.params.category;
      const events = await Event.find({
        category: { $regex: `^${cat.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' }
      })
        .sort({ date: 1 })
        .limit(50)
        .lean();
      return res.json({ events: events.map(withComputed), total: events.length });
    } catch (err) {
      return next(err);
    }
  }
);

// GET /api/events/categories — counts per category (60s cached)
let catCache = { at: 0, data: null };
router.get('/categories', async (req, res, next) => {
  try {
    if (Date.now() - catCache.at < 60000 && catCache.data) {
      return res.json({ categories: catCache.data });
    }
    const agg = await Event.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    catCache = {
      at: Date.now(),
      data: agg.map((a) => ({ name: a._id, count: a.count }))
    };
    return res.json({
      categories: catCache.data
    });
  } catch (err) {
    return next(err);
  }
});

// POST /api/events/:id/register — alias for POST /api/registrations
router.post(
  '/:id/register',
  require('../middleware/auth'),
  [param('id').isMongoId().withMessage('Invalid event id')],
  handleValidation,
  async (req, res, next) => {
    try {
      const EventModel = require('../models/Event');
      const Registration = require('../models/Registration');
      const event = await EventModel.findOneAndUpdate(
        { _id: req.params.id, $expr: { $lt: ['$registeredCount', '$participantLimit'] } },
        { $inc: { registeredCount: 1 } },
        { new: true }
      );
      if (!event) {
        const exists = await EventModel.exists({ _id: req.params.id });
        if (!exists) return res.status(404).json({ message: 'Event not found.' });
        return res.status(400).json({ message: 'Event is full.' });
      }
      const status = new Date(event.date).getTime() < Date.now() ? 'Registered' : 'Upcoming';
      let registration;
      try {
        registration = await Registration.create({ studentId: req.studentId, eventId: event._id, status });
      } catch (err) {
        await EventModel.updateOne({ _id: event._id }, { $inc: { registeredCount: -1 } });
        if (err.code === 11000) return res.status(409).json({ message: 'You have already registered for this event.' });
        throw err;
      }
      return res.status(201).json({ registration });
    } catch (err) {
      if (err.code === 11000) return res.status(409).json({ message: 'You have already registered for this event.' });
      return next(err);
    }
  }
);

// GET /api/events/:id
router.get(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid event id')],
  handleValidation,
  async (req, res, next) => {
    try {
      const event = await Event.findById(req.params.id);
      if (!event) {
        return res.status(404).json({ message: 'Event not found.' });
      }
      return res.json({ event: withComputed(event) });
    } catch (err) {
      return next(err);
    }
  }
);

module.exports = router;
