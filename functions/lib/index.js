"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.events = void 0;
const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const rrule_1 = require("rrule");
// Initialize Firebase Admin SDK
admin.initializeApp();
exports.events = functions.https.onRequest(async (req, res) => {
    // Enable CORS
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }
    try {
        const { start, end } = req.query;
        if (!start || !end) {
            res.status(400).send('Missing "start" or "end" query parameters');
            return;
        }
        const startDate = new Date(start);
        const endDate = new Date(end);
        const rulesSnap = await admin
            .firestore()
            .collection('schedule_rules')
            .get();
        const events = [];
        rulesSnap.forEach(doc => {
            const data = doc.data();
            const rruleString = data.rrule;
            if (!rruleString)
                return;
            const rule = rrule_1.RRule.fromString(rruleString);
            const dates = rule.between(startDate, endDate, true);
            dates.forEach(date => {
                events.push({
                    id: `${doc.id}_${date.toISOString()}`,
                    title: data.name,
                    start: date.toISOString(),
                    extendedProps: {
                        facilityId: data.facilityId,
                        color: data.color,
                        notes: data.notes
                    }
                });
            });
        });
        res.json(events);
    }
    catch (err) {
        console.error('Error generating events:', err);
        res.status(500).send(err.message || 'Internal Server Error');
    }
});
//# sourceMappingURL=index.js.map