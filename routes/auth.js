const express = require('express');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const User = require('../models/User');
const router = express.Router();

// Passport Discord Strategy
passport.use(new DiscordStrategy({
    clientID: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    callbackURL: process.env.DISCORD_CALLBACK_URL,
    scope: ['identify']
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ discordId: profile.id });

        if (user) {
            // Update avatar/username if changed
            user.username = profile.username;
            user.avatar = `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`;
            await user.save();
        } else {
            // Create new user
            user = await User.create({
                discordId: profile.id,
                username: profile.username,
                avatar: `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`
            });
        }
        return done(null, user);
    } catch (err) {
        return done(err, null);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

// Auth Routes
router.get('/discord', passport.authenticate('discord'));

router.get('/discord/callback', 
    passport.authenticate('discord', { failureRedirect: process.env.FRONTEND_URL }),
    (req, res) => {
        // Successful authentication, redirect to frontend dashboard
        console.log('User logged in:', req.user.username, 'Discord ID:', req.user.discordId);
        res.redirect(`${process.env.FRONTEND_URL}/consistency-challenge`);
    }
);

router.get('/me', (req, res) => {
    if (req.isAuthenticated()) {
        res.json({
            authenticated: true,
            user: req.user
        });
    } else {
        res.json({ authenticated: false });
    }
});

router.post('/logout', (req, res) => {
    req.logout((err) => {
        if (err) return res.status(500).json({ error: 'Logout failed' });
        res.json({ message: 'Logged out successfully' });
    });
});

module.exports = router;
