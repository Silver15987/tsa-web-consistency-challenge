const express = require('express');
const router = express.Router();
const DateService = require('../services/DateService');

// Middleware to ensure this is only available in development
const isDev = (req, res, next) => {
    // You can enforce NODE_ENV here, but for now we'll allow it for the demo
    // if (process.env.NODE_ENV === 'production') return res.status(403).send('Forbidden');
    next();
};

// @route   POST /api/dev/set-time
// @desc    Set the server's virtual time (Time Travel)
router.post('/set-time', isDev, (req, res) => {
    const { date } = req.body; // Expects ISO string or YYYY-MM-DD
    
    if (!date) {
        DateService.setVirtualDate(null); // Reset
        return res.json({ message: 'Time reset to real server time.', currentTime: DateService.getNow() });
    }

    // Ensure we parse it correctly
    // If just YYYY-MM-DD is sent, append time to be mid-day or start of day
    let targetDate = date;
    if (date.length === 10) { 
        targetDate = `${date}T12:00:00+05:30`; 
    }

    DateService.setVirtualDate(targetDate);
    
    const info = DateService.getChallengeInfo();

    res.json({ 
        message: `Time traveled to ${targetDate}`, 
        serverTime: DateService.getNow(),
        challengeStatus: info
    });
});

module.exports = router;
