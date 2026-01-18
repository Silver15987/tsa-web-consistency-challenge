const express = require('express');
const router = express.Router();
const User = require('../models/User');
const DailyLog = require('../models/DailyLog');
const DateService = require('../services/DateService');

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ error: 'Not authenticated' });
};

// @route   POST /api/challenge/start
// @desc    Start the challenge and set 10 goals
router.post('/start', isAuthenticated, async (req, res) => {
    const { goals } = req.body;
    console.log('User:', req.user.username, 'Starting Challenge with Goals:', goals);

    if (!goals || !Array.isArray(goals) || goals.length < 5) {
        return res.status(400).json({ error: 'Please provide at least 5 goals.' });
    }

    try {
        const user = await User.findById(req.user.id);
        
        if (user.challengeStarted) {
            return res.status(400).json({ error: 'Challenge already started.' });
        }

        user.goals = goals;
        user.challengeStarted = true;
        // Use DateService to get strictly server-side IST start date
        // Note: For consistency, we might want to store "YYYY-MM-DD" or continue storing Date object
        // Storing Date object is fine as long as we treat it as UTC=IST
        user.challengeStartDate = DateService.getNow(); 
        user.totalScore = 0; // Reset score on start
        
        await user.save();

        res.json({ success: true, user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   POST /api/challenge/log
// @desc    Log a daily entry
router.post('/log', isAuthenticated, async (req, res) => {
    const { date, dayNumber, completedTasks, note } = req.body;
    console.log('User:', req.user.username, 'Logging Day:', dayNumber, 'Date:', date, 'Tasks:', completedTasks);

    if (!date || !dayNumber || !completedTasks) {
        return res.status(400).json({ error: 'Missing required fields.' });
    }

    // STRICT DATE LOCKING CHECK
    if (!DateService.isLogDateAllowed(date)) {
        return res.status(403).json({ error: 'This date is locked. You can only log for Today or Yesterday (IST).' });
    }

    // Calculate score (number of true values in completedTasks)
    try {
        // Fetch User to get total goals count
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const totalGoals = user.goals.length || 10; // Default to 10 if missing (legacy)
        
        // Calculate raw completed count
        const completedCount = completedTasks.filter(Boolean).length;
        
        // Calculate Normalized Score (Out of 10)
        // Formula: (Completed / Total) * 10
        // Rounded to 1 decimal place to avoid long floats (e.g. 3.3)
        let dailyScore = (completedCount / totalGoals) * 10;
        dailyScore = Math.round(dailyScore * 10) / 10;

        // Check if log already exists for this date
        let log = await DailyLog.findOne({ userId: req.user.id, date });

        if (log) {
            // Update existing log
            const scoreDiff = dailyScore - log.dailyScore;
            
            log.completedTasks = completedTasks;
            log.dailyScore = dailyScore;
            log.note = note;
            await log.save();

            // Update user total score
            // Use precise addition to avoid floating point drift, then round
            user.totalScore = Math.round((user.totalScore + scoreDiff) * 10) / 10;
            await user.save();
        } else {
            // Create new log
            log = new DailyLog({
                userId: req.user.id,
                date,
                dayNumber,
                completedTasks,
                dailyScore,
                note
            });
            await log.save();

            // Add to user total score
            user.totalScore = Math.round((user.totalScore + dailyScore) * 10) / 10;
            await user.save();
        }

        res.json({ success: true, log, totalScore: user.totalScore });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   GET /api/challenge/logs
// @desc    Get all daily logs for the current user
router.get('/logs', isAuthenticated, async (req, res) => {
    try {
        const logs = await DailyLog.find({ userId: req.user.id }).sort({ date: 1 });
        res.json(logs);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   GET /api/challenge/status
// @desc    Get current challenge status (server time, active day, etc.)
router.get('/status', isAuthenticated, async (req, res) => {
    try {
        const info = DateService.getChallengeInfo();
        res.json(info);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
