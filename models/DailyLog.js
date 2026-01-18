const mongoose = require('mongoose');

const DailyLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: String, // Format: YYYY-MM-DD to easily query specific days
        required: true
    },
    dayNumber: {
        type: Number, // 1 to 21
        required: true
    },
    completedTasks: [{
        type: Boolean // Array of 10 booleans corresponding to the user's 10 goals
    }],
    dailyScore: {
        type: Number, // 0 to 10
        required: true
    },
    note: {
        type: String,
        maxLength: 500
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Ensure a user can only have one log per date
DailyLogSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyLog', DailyLogSchema);
