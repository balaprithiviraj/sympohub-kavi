const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    registrationDate: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['Registered', 'Upcoming', 'Completed'],
      default: 'Registered'
    }
  },
  { versionKey: false }
);

registrationSchema.index({ studentId: 1, eventId: 1 }, { unique: true });

module.exports = mongoose.model('Registration', registrationSchema);
