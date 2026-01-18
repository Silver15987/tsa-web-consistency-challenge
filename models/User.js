const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    discordId: {
        type: String,
        required: true,
        unique: true
    },
    username: {
        type: String,
        required: true
    },
    avatar: {
        type: String
    },
    // Track if they have set up their challenge goals
    challengeStarted: {
        type: Boolean,
        default: false
    },
    challengeStartDate: {
        type: Date
    },
    // The 10 fixed goals for the challenge
    goals: [{
        type: String
    }],
    totalScore: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Indexes for Leaderboard performance
UserSchema.index({ totalScore: -1 });
UserSchema.index({ challengeStarted: 1 });

module.exports = mongoose.model('User', UserSchema);
