const express = require('express');
const { generateRoadmap } = require('../controllers/roadmapController');
const { getHistory, clearHistory } = require('../controllers/historyController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/roadmap', protect, generateRoadmap);
router.get('/history', protect, getHistory);
router.delete('/history', protect, clearHistory);

module.exports = router;
