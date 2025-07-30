import React, { useRef, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import rrulePlugin from '@fullcalendar/rrule';
import type { CalendarApi } from '@fullcalendar/core';
import { supabase } from '../supabaseClient';
import { RRule } from 'rrule';

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

  useEffect(() => {
    calendarApi = calendarRef.current?.getApi();
  }, []);

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

  return (
    <div className="w-full h-full">
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
  );
}

export default CalendarView; 