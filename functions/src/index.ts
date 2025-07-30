import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import { RRule } from 'rrule';

// Initialize Firebase Admin SDK
admin.initializeApp();

export const events = functions.https.onRequest(async (req, res) => {
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
    const { start, end } = req.query as { start?: string; end?: string };
    if (!start || !end) {
      res.status(400).send('Missing "start" or "end" query parameters');
      return;
    }

    const startDate = new Date(start);
    const endDate   = new Date(end);

    const rulesSnap = await admin
      .firestore()
      .collection('schedule_rules')
      .get();

    const events: Array<Record<string, any>> = [];

    rulesSnap.forEach(doc => {
      const data = doc.data();
      const rruleString = data.rrule as string;
      if (!rruleString) return;

      const rule = RRule.fromString(rruleString);
      const dates = rule.between(startDate, endDate, true);

      dates.forEach(date => {
        events.push({
          id: `${doc.id}_${date.toISOString()}`,
          title: data.name,
          start: date.toISOString(),
          extendedProps: {
            facilityId: data.facilityId,
            color:      data.color,
            notes:      data.notes
          }
        });
      });
    });

    res.json(events);
  } catch (err: any) {
    console.error('Error generating events:', err);
    res.status(500).send(err.message || 'Internal Server Error');
  }
}); 