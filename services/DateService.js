const CHALLENGE_START_DATE = new Date('2026-01-19T00:00:00+05:30'); // Jan 19, 2026 IST
const IST_OFFSET = 5.5 * 60 * 60 * 1000; // +5:30

let virtualDate = null; // For testing/time-travel

const DateService = {
    // Get current time in IST (or virtual time if set)
    getNow: () => {
        if (virtualDate) {
            return new Date(virtualDate);
        }
        
        // Convert local server time to IST
        const now = new Date();
        const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
        return new Date(utc + IST_OFFSET);
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
        const now = DateService.getNow();
        return now.toISOString().split('T')[0];
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
                startDate: '2026-01-19'
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
                startDate: '2026-01-19'
            };
        }

        return {
            isActive: true,
            status: 'ACTIVE',
            dayNumber: dayNumber,
            currentDate: DateService.getTodayDateString(),
            startDate: '2026-01-19'
        };
    },

    // Check if a specific "YYYY-MM-DD" is allowed to be logged (Today or Yesterday)
    isLogDateAllowed: (logDateString) => {
        const now = DateService.getNow();
        const todayStr = now.toISOString().split('T')[0];
        
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        // Allowed if it matches Today or Yesterday IN IST
        return logDateString === todayStr || logDateString === yesterdayStr;
    }
};

module.exports = DateService;
