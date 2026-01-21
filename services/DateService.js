const CHALLENGE_START_DATE = new Date('2026-01-19T00:00:00+05:30'); // Jan 19, 2026 IST

let virtualDate = null; // For testing/time-travel

const DateService = {
    // Get current time in IST (or virtual time if set)
    // Returns a Date object where the UTC components match the IST time
    // e.g. If IST is 16:00, this returns a Date that says 16:00 UTC
    getNow: () => {
        if (virtualDate) {
            return new Date(virtualDate);
        }
        
        // Robust IST Conversion:
        // 1. Get current Absolute UTC time
        // 2. Add 5 hours 30 minutes (19800000 ms)
        // This creates a "Shifted Date" where .toISOString() matches IST
        return new Date(Date.now() + 19800000); 
    },

    // Set virtual time (Test only)
    setVirtualDate: (isoDateString) => {
        if (!isoDateString) {
            virtualDate = null; // Reset to real time
        } else {
            virtualDate = new Date(isoDateString);
        }
        console.log(`🕒 Virtual Time set to: ${DateService.getNow().toISOString()}`);
    },

    // Get strictly formatted "YYYY-MM-DD" in IST
    getTodayDateString: () => {
        if (virtualDate) {
            return virtualDate.toISOString().split('T')[0];
        }
        // Use Intl to guarantee correct IST Date String regardless of offset tricks
        return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    },

    getChallengeInfo: () => {
        const now = DateService.getNow();
        
        // Check if pre-challenge
        if (now < CHALLENGE_START_DATE) {
            return {
                isActive: false,
                status: 'PRE_START',
                dayNumber: 0,
                currentDate: DateService.getTodayDateString(),
                startDate: '2026-01-19',
                isGracePeriodActive: false
            };
        }

        const diffTime = Math.abs(now - CHALLENGE_START_DATE);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); 
        const dayNumber = diffDays + 1; // Day 1 is the start date

        // Check if post-challenge (Day 22+)
        if (dayNumber > 21) {
            return {
                isActive: false,
                status: 'COMPLETED',
                dayNumber: dayNumber,
                currentDate: DateService.getTodayDateString(),
                startDate: '2026-01-19',
                isGracePeriodActive: false
            };
        }

        const currentHour = now.getHours();

        return {
            isActive: true,
            status: 'ACTIVE',
            dayNumber: dayNumber,
            currentDate: DateService.getTodayDateString(),
            startDate: '2026-01-19',
            isGracePeriodActive: currentHour < 10
        };
    },

    // Check if a specific "YYYY-MM-DD" is allowed to be logged (Today or Yesterday)
    isLogDateAllowed: (logDateString) => {
        const now = DateService.getNow();
        const todayStr = now.toISOString().split('T')[0];
        
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        // Allowed if it matches Today
        if (logDateString === todayStr) {
            return true;
        }

        // Allowed for Yesterday ONLY IF current time is before 10:00 AM
        if (logDateString === yesterdayStr) {
            const currentHour = now.getHours(); // 0-23
            // logic: If it's before 10 AM (00:00 - 09:59), allow yesterday.
            if (currentHour < 10) {
                return true;
            }
        }

        return false;
    }
};

module.exports = DateService;
