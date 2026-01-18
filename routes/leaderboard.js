const express = require('express');
const router = express.Router();
const User = require('../models/User');

// @route   GET /api/leaderboard
// @desc    Get top users by total score
router.get('/', async (req, res) => {
    try {
        // Fetch top 50 users sorted by totalScore descending
        const leaderboard = await User.find({ challengeStarted: true })
            .sort({ totalScore: -1 })
            .limit(50)
            .select('username avatar totalScore challengeStartDate');

        res.json(leaderboard);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
