const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    certificateType: { type: String, default: 'Participation', trim: true },
    certificateUrl: { type: String, default: '' },
    issuedDate: { type: Date, default: Date.now }
  },
  { versionKey: false }
);

certificateSchema.index({ studentId: 1, eventId: 1 }, { unique: true });

module.exports = mongoose.model('Certificate', certificateSchema);
