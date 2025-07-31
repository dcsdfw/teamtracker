import React, { useRef, useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import rrulePlugin from '@fullcalendar/rrule';
import type { CalendarApi } from '@fullcalendar/core';
import { supabase } from '../supabaseClient';
import { RRule } from 'rrule';

import { useNavigate } from 'react-router-dom';

interface CalendarViewProps {
  isManager?: boolean;
  currentUserId?: string;
}

// Global calendar API reference
let calendarApi: any = null;

export function refetchCalendar() {
  calendarApi?.refetchEvents();
}

function CalendarView(props: CalendarViewProps) {
  const calendarRef = useRef<FullCalendar>(null);

  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState('');

  useEffect(() => {
    calendarApi = calendarRef.current?.getApi();
  }, []);

  // Single initializer for all data loading
  useEffect(() => {
    (async () => {
      try {
        // use local clock instead of worldtimeapi
        const today = new Date().toISOString().split('T')[0];
        setDate(today);

        // kick off your parallel data loads here
        await Promise.all([
          loadFacilities(),
          loadUsers(),
          loadTimeEntries(today),
        ]);
      } catch (err) {
        console.error('Calendar init error', err);
      } finally {
        setLoading(false);      // ✅ always clear loading
      }
    })();
  }, []);



  // Loading functions for parallel data fetching
  const loadFacilities = async () => {
    // Calendar doesn't need facilities data, but keeping for consistency
    console.log('Calendar: Loading facilities...');
  };

  const loadUsers = async () => {
    // Calendar doesn't need users data, but keeping for consistency
    console.log('Calendar: Loading users...');
  };

  const loadTimeEntries = async (date: string) => {
    // Calendar doesn't need time entries data, but keeping for consistency
    console.log('Calendar: Loading time entries for date:', date);
  };

  async function fetchEvents(fetchInfo: any, successCallback: any) {
    console.log('⚙️ fetchEvents range:', fetchInfo.startStr, '→', fetchInfo.endStr);

    try {
      // Fetch schedule rules from Supabase
      const { data: rules, error } = await supabase
        .from('schedule_rules')
        .select('*');

      if (error) {
        console.error('Error fetching schedule rules:', error);
        successCallback([]);
        return;
      }

      console.log('📋 Schedule rules from Supabase:', rules);

      const events: any[] = [];
      const startDate = new Date(fetchInfo.startStr);
      const endDate = new Date(fetchInfo.endStr);

      // Process each schedule rule
      rules?.forEach(rule => {
        try {
          const rrule = RRule.fromString(rule.rrule);
          const dates = rrule.between(startDate, endDate, true);

          dates.forEach(date => {
            events.push({
              id: `${rule.id}_${date.toISOString()}`,
              title: rule.name,
              start: date.toISOString(),
              backgroundColor: rule.color || '#3b82f6',
              extendedProps: {
                facilityId: rule.facilityId,
                color: rule.color,
                notes: rule.notes
              }
            });
          });
        } catch (err) {
          console.error('Error processing rule:', rule, err);
        }
      });

      console.log('⬅️ events payload:', events);
      successCallback(events);
    } catch (err) {
      console.error('Calendar fetch error', err);
      successCallback([]);
    }
  }



  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 pt-20 pb-8">
        <div className="mb-6 ml-4">
          <h1 className="text-3xl font-bold text-foreground mb-2">Calendar View</h1>
          <p className="text-muted-foreground">View and manage recurring schedules</p>
        </div>
        
        <div className="bg-card border border-border/50 rounded-lg shadow-card">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, rrulePlugin]}
            initialView="dayGridMonth"
            events={fetchEvents}
            height="auto"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth'
            }}
            dayMaxEvents={true}
            moreLinkClick="popover"
          />
        </div>
      </div>
    </div>
  );
}

export default CalendarView; 