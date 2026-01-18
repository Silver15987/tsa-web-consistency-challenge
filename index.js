const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const passport = require('passport');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Trust Proxy (Required for Azure App Service)
app.set('trust proxy', 1);

// Middleware
app.use(express.json());
app.use(cookieParser());
const MongoStore = require('connect-mongo');

// CORS Setup
const allowedOrigins = [
    process.env.FRONTEND_URL?.replace(/\/$/, ''), // Cleaned URL
    'https://thestudyadda.in' // Hardcoded backup
];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1 || origin === 'http://localhost:5173') {
            callback(null, true);
        } else {
            console.log('Blocked Origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true 
}));

// Session Setup (Required for Passport)
app.use(session({
    secret: process.env.SESSION_SECRET || 'super_secret_key_change_me',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
    cookie: {
        secure: process.env.NODE_ENV === 'production', // Secure cookies in production (Required for SameSite=None)
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Allow cross-site cookies in production
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Passport Config
app.use(passport.initialize());
app.use(passport.session());

// Database Connection
const connectDB = require('./db');
connectDB();

// Basic Route
app.get('/', (req, res) => {
    res.send('TSA Web Backend is Running 🚀');
});

// Import Routes
app.use('/auth', require('./routes/auth'));
app.use('/api/challenge', require('./routes/challenge'));
app.use('/api/leaderboard', require('./routes/leaderboard'));
app.use('/api/dev', require('./routes/dev'));

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
