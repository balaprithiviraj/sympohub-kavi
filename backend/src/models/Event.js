const mongoose = require('mongoose');

const CATEGORIES = [
  'Symposium',
  'Workshop',
  'Hackathon',
  'Paper Presentation',
  'Project Expo',
  'Cultural',
  'Sports'
];

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true, enum: CATEGORIES, trim: true },
    description: { type: String, required: true },
    college: { type: String, required: true, trim: true },
    organizer: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    time: { type: String, required: true, trim: true },
    venue: { type: String, required: true, trim: true },
    rules: { type: [String], default: [] },
    participantLimit: { type: Number, required: true, min: 1 },
    registeredCount: { type: Number, default: 0, min: 0 },
    image: { type: String, default: '' },
    featured: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  },
  { versionKey: false, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

eventSchema.index({ title: 'text', description: 'text', college: 'text' });
eventSchema.index({ category: 1 });
eventSchema.index({ date: 1 });
eventSchema.index({ createdAt: -1 });
eventSchema.index({ registeredCount: -1 });
eventSchema.index({ featured: 1, date: 1 });
eventSchema.index({ category: 1, date: 1 });

module.exports = mongoose.model('Event', eventSchema);
module.exports.CATEGORIES = CATEGORIES;
