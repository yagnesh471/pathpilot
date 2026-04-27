const History = require('../models/History');

exports.getHistory = async (req, res) => {
  const history = await History.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50);
  res.json({ success: true, history });
};

exports.clearHistory = async (req, res) => {
  await History.deleteMany({ user: req.user._id });
  res.json({ success: true, message: 'Your history was cleared' });
};
