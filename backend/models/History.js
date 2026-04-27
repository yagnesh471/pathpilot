const mongoose = require('mongoose');

const HistorySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    job: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    tagline: { type: String, default: '' },
    roadmap: { type: Object, required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('History', HistorySchema);
