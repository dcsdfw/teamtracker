import { useEffect, useState } from 'react';
import { getMonthlyTimeEntries } from '@/services/scheduleService';
import { CSVLink } from 'react-csv';

interface MonthlyReportProps {
  userId: string;
  month: string;
}

export default function MonthlyReport({ userId, month }: MonthlyReportProps) {
  const [rows, setRows] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    
    getMonthlyTimeEntries(userId, month)
      .then(setRows)
      .catch(err => {
        console.error('Error fetching monthly time entries:', err);
        setError(err.message || 'Failed to load time entries');
      })
      .finally(() => setIsLoading(false));
  }, [userId, month]);

  const headers = [
    { label: 'Date',     key: 'date'       },
    { label: 'Facility', key: 'facility_id'},
    { label: 'Start',    key: 'start_time' },
    { label: 'End',      key: 'end_time'   },
    { label: 'Hours',    key: 'durationH'  },
  ];

  const csvData = rows.map(r => ({
    date: r.start_time.slice(0,10),
    facility_id: r.facility_id,
    start_time:  r.start_time,
    end_time:    r.end_time,
    durationH:   r.durationH.toFixed(2)
  }));

  const totalHours = rows.reduce((sum, r) => sum + r.durationH, 0);

  if (isLoading) {
    return <div className="p-4">Loading monthly report...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">Error: {error}</div>;
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Hours in {month}</h2>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            Total: {totalHours.toFixed(2)} hours
          </span>
          <CSVLink 
            data={csvData} 
            headers={headers} 
            filename={`hours-${month}.csv`}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            Download CSV
          </CSVLink>
        </div>
      </div>
      
      {rows.length === 0 ? (
        <div className="text-gray-500 text-center py-8">
          No time entries found for {month}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300">
            <thead>
              <tr className="bg-gray-50">
                {headers.map(h => (
                  <th key={h.key} className="px-4 py-2 text-left border-b">
                    {h.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {csvData.map((r, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border-b">{r.date}</td>
                  <td className="px-4 py-2 border-b">{r.facility_id}</td>
                  <td className="px-4 py-2 border-b">{r.start_time}</td>
                  <td className="px-4 py-2 border-b">{r.end_time}</td>
                  <td className="px-4 py-2 border-b font-medium">{r.durationH}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 