import { supabase } from '../supabaseClient'

export async function deleteAllScheduleRules() {
  const { data, error } = await supabase
    .from('schedule_rules')
    .delete()
    .neq('id', 0) // Delete all records

  if (error) {
    console.error('Error deleting schedule rules:', error)
    throw error
  }

  console.log(`✅ Cleared schedule_rules documents`)
  return data
}

export async function addScheduleRule(rule: {
  name: string;
  facilityId: string;
  rrule: string;
  color?: string;
  notes?: string;
}) {
  console.log("🔍 Attempting to insert schedule rule:", rule);
  
  const payload = {
    name: rule.name,
    facility_id: rule.facilityId, // ← use facility_id
    rrule: rule.rrule,
    color: rule.color,
    notes: rule.notes ?? null,
  };
  
  console.log("📦 Built payload:", payload);
  
  const { data, error } = await supabase
    .from("schedule_rules")
    .insert([payload])
    .select("*");   // no columns= param

  if (error) {
    console.error("❌ Supabase insert error:", error);
    console.error("📋 Error details:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
    throw error;
  }

  console.log("✅ Schedule rule inserted successfully:", data);
  return data![0];
}

export async function getScheduleRules() {
  try {
    console.log('🔍 Fetching schedule rules...');
    
    const { data, error } = await supabase
      .from('schedule_rules')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching schedule rules:', error);
      throw error;
    }

    console.log('✅ Schedule rules fetched:', data);
    
    // Get facility names separately to avoid join issues
    if (data && data.length > 0) {
      const facilitiesData = await getFacilities();
      
      // Add facility names to schedule rules
      const rulesWithFacilities = data.map(rule => ({
        ...rule,
        facilities: facilitiesData.find(f => f.id === rule.facility_id)
      }));
      
      return rulesWithFacilities;
    }
    
    return data || [];
  } catch (error) {
    console.error('💥 Error in getScheduleRules:', error);
    throw error;
  }
}
// Additional functions for ScheduleManager compatibility
export async function getFacilities() {
  const { data, error } = await supabase
    .from('facilities')        // ← matches new table
    .select('*');
  if (error) throw error;
  return data!;
}

export async function getUsers() {
  const { data, error } = await supabase
    .from('profiles')          // ← use profiles, not users
    .select('id, email, first_name, last_name, role');
  if (error) throw error;
  return data!;
}

// DEPRECATED: Schedule table functions - now using schedule_rules instead
// export async function getSchedule(date: string) {
//   // Removed - use getScheduleRules() instead
//   return []
// }

// export async function addScheduleEntry(entry: any) {
//   // Removed - use addScheduleRule() instead
//   return null
// }

// export async function updateScheduleEntry(id: string, updates: any) {
//   // Removed - use updateScheduleRule() instead
//   return null
// }

// export async function deleteScheduleEntry(id: string) {
//   // Removed - use deleteScheduleRule() instead
// }

// Time entry functions
export async function addTimeEntry(entry: {
  cleanerId: string;
  facilityId: string;
  startISO: string;
  endISO: string;
  durationSeconds: number;
  notes?: string;
}) {
  try {
    const { data, error } = await supabase
      .from('time_entries')
      .insert({
        user_id: entry.cleanerId,
        facility_id: entry.facilityId,
        start_time: entry.startISO,
        end_time: entry.endISO,
        duration: entry.durationSeconds, // duration in seconds
        notes: entry.notes || '', // notes field
      })
      .select();

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error adding time entry:', error);
    throw error;
  }
}

export async function getTimeEntries() {
  try {
    const { data, error } = await supabase
      .from('time_entries')
      .select(`
        *,
        facilities(name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching time entries:', error);
      throw error;
    }

   
   // Transform the data to match your frontend TimeEntry interface
return data.map(entry => ({
  id: entry.id,
  cleanerId: entry.user_id,
  facilityId: entry.facility_id,  // ← Keep as facilityId, not facility name
  startISO: entry.start_time,     // ← Keep as ISO string
  endISO: entry.end_time,         // ← Keep as ISO string
  durationMinutes: entry.duration, // ← Rename from duration to durationMinutes
  notes: entry.notes || '',
  createdAt: new Date(entry.created_at),
}));

  } catch (error) {
    console.error('Error in getTimeEntries:', error);
    throw error;
  }
}



// Facility management functions
export async function addFacility(facility: { id: string; name: string; nickname?: string }) {
  const { data, error } = await supabase
    .from('facilities')
    .insert([facility])
    .select()

  if (error) {
    console.error('Error adding facility:', error)
    throw error
  }

  return data?.[0]
}

export async function updateFacility(facilityId: string, updates: { name?: string; nickname?: string }) {
  const { data, error } = await supabase
    .from('facilities')
    .update(updates)
    .eq('id', facilityId)
    .select()

  if (error) {
    console.error('Error updating facility:', error)
    throw error
  }

  return data?.[0]
}

// User management functions
export async function addUser(userData: { firstName: string; lastName: string; email: string; phone: string }) {
  const username = `${userData.firstName.toLowerCase()}.${userData.lastName.toLowerCase()}`
  
  const { data, error } = await supabase
    .from('users')
    .insert([{
      ...userData,
      id: username,
      username,
      active: true,
      createdAt: new Date().toISOString()
    }])
    .select()

  if (error) {
    console.error('Error adding user:', error)
    throw error
  }

  return data?.[0]
}

export async function updateUser(username: string, updates: { firstName?: string; lastName?: string; email?: string; phone?: string; active?: boolean }) {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('username', username)
    .select()

  if (error) {
    console.error('Error updating user:', error)
    throw error
  }

  return data?.[0]
}

// Time entry deletion
export async function deleteTimeEntry(entryId: string) {
  const { error } = await supabase
    .from('time_entries')
    .delete()
    .eq('id', entryId)

  if (error) {
    console.error('Error deleting time entry:', error)
    throw error
  }
}

// Additional utility functions
export async function getExistingUserIds() {
  try {
    const { data, error } = await supabase
      .from('time_entries')
      .select('user_id')
      .neq('user_id', null)
      .limit(100);
    if (error) throw error;
    // Dedupe the array of IDs
    return Array.from(new Set(data.map(d => d.user_id)));
  } catch (err) {
    console.error('Error getting existing user IDs', err);
    return [];
  }
}

// DEPRECATED: deleteAllScheduleEntries removed - schedule table no longer exists
// export async function deleteAllScheduleEntries() {
//   // Removed - use deleteAllScheduleRules() instead
// }

export async function deleteScheduleRule(ruleId: string) {
  const { error } = await supabase
    .from('schedule_rules')
    .delete()
    .eq('id', ruleId)

  if (error) {
    console.error('Error deleting schedule rule:', error)
    throw error
  }

  return { success: true, message: 'Schedule rule deleted successfully' }
} 

export async function getMonthlyTimeEntries(userId: string, month: string) {
  const from = `${month}-01T00:00:00Z`;
  const to   = `${month}-31T23:59:59Z`;
  const { data, error } = await supabase
    .from('time_entries')
    .select('id, user_id, facility_id, start_time, end_time')
    .eq('user_id', userId)
    .gte('start_time', from)
    .lte('end_time', to);
  if (error) throw error;
  return data!.map(r => ({
    ...r,
    durationH: (new Date(r.end_time).getTime() - new Date(r.start_time).getTime())/3600000
  }));
}