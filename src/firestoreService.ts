import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  doc,
  updateDoc,
  setDoc,
  deleteDoc,
  limit
} from "firebase/firestore";
import { db } from "./firebase";

// Types
export interface TimeEntry {
  cleanerId: string;
  facilityId: string;
  startISO: string;
  endISO: string;
  durationMinutes: number;
  notes: string;
  createdAt: Date;
}

export interface Facility {
  id: string;
  name: string;
}

export interface ScheduleEntry {
  date: string; // YYYY-MM-DD
  cleanerIds: string[]; // Changed from cleanerId to cleanerIds array
  facilityId: string;
  startTime?: string;
  endTime?: string;
  notes?: string;
}

export interface Cleaner {
  id: string;
  active: boolean;
}

export interface User {
  id: string;
  username: string; // Auto-generated from first.lastname
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  active: boolean;
  createdAt: Date;
}

class FirestoreService {
  // Time Entries
  async addTimeEntry(entry: Omit<TimeEntry, 'createdAt'>) {
    try {
      const timeEntryRef = doc(collection(db, "logs"));
      const timeEntry: TimeEntry = {
        ...entry,
        createdAt: new Date()
      };
      await setDoc(timeEntryRef, timeEntry);
      return { success: true, message: 'Time entry added successfully' };
    } catch (error) {
      throw new Error(`Failed to add time entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteTimeEntry(entryId: string) {
    try {
      const timeEntryRef = doc(db, "logs", entryId);
      await deleteDoc(timeEntryRef);
      return { success: true, message: 'Time entry deleted successfully' };
    } catch (error) {
      throw new Error(`Failed to delete time entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getTimeEntries(cleanerId?: string) {
    let q;
    
    if (cleanerId) {
      q = query(
        collection(db, "logs"),
        where("cleanerId", "==", cleanerId),
        limit(100)
      );
    } else {
      // Get all time entries for manager view
      q = query(
        collection(db, "logs"),
        limit(100)
      );
    }
    
    const snapshot = await getDocs(q);
    const entries = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[];
    
    // Sort in memory instead of using Firestore orderBy to avoid index requirements
    return entries.sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
      return dateB.getTime() - dateA.getTime(); // Descending order
    });
  }

  // Facilities
  async getFacilities(): Promise<Facility[]> {
    const snapshot = await getDocs(collection(db, "facilities"));
    return snapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name
    }));
  }

  async addFacility(facility: { id: string; name: string }) {
    // Check if facility already exists
    const existingFacilities = await this.getFacilities();
    if (existingFacilities.find(f => f.id === facility.id)) {
      throw new Error('Facility ID already exists');
    }

    await addDoc(collection(db, "facilities"), {
      name: facility.name
    });
    
    return { success: true, message: 'Facility added successfully' };
  }

  async updateFacility(facilityId: string, newName: string) {
    try {
      const facilityRef = doc(db, "facilities", facilityId);
      await updateDoc(facilityRef, {
        name: newName
      });
      
      return { success: true, message: 'Facility updated successfully' };
    } catch (error) {
      throw new Error(`Failed to update facility: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Schedule
  async getSchedule(date: string): Promise<ScheduleEntry[]> {
    const q = query(
      collection(db, "schedule"),
      where("date", "==", date)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ScheduleEntry & { id: string }));
  }

  async addScheduleEntry(entry: ScheduleEntry) {
    // Filter out undefined values before saving to Firestore
    const cleanEntry = Object.fromEntries(
      Object.entries(entry).filter(([_, value]) => value !== undefined)
    );
    
    const docRef = await addDoc(collection(db, "schedule"), cleanEntry);
    return { success: true, id: docRef.id };
  }

  async updateScheduleEntry(entryId: string, updates: Partial<ScheduleEntry>) {
    try {
      const scheduleEntryRef = doc(db, "schedule", entryId);
      await updateDoc(scheduleEntryRef, updates);
      return { success: true, message: 'Schedule entry updated successfully' };
    } catch (error) {
      throw new Error(`Failed to update schedule entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteScheduleEntry(entryId: string) {
    try {
      const scheduleEntryRef = doc(db, "schedule", entryId);
      await deleteDoc(scheduleEntryRef);
      return { success: true, message: 'Schedule entry deleted successfully' };
    } catch (error) {
      throw new Error(`Failed to delete schedule entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async addRecurringSchedule(entry: ScheduleEntry, recurrence: {
    type: 'daily' | 'weekly' | 'bi-weekly' | 'monthly';
    daysOfWeek?: number[]; // 0-6 (Sunday-Saturday)
    interval?: number; // Every X days/weeks/months
    endDate?: string; // YYYY-MM-DD
  }) {
    try {
      const entries: ScheduleEntry[] = [];
      const startDate = new Date(entry.date);
      const endDate = recurrence.endDate ? new Date(recurrence.endDate) : new Date(startDate.getFullYear() + 1, startDate.getMonth(), startDate.getDate());
      
      let currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        let shouldAdd = false;
        
        switch (recurrence.type) {
          case 'daily':
            shouldAdd = true;
            break;
          case 'weekly':
            if (recurrence.daysOfWeek?.includes(currentDate.getDay())) {
              shouldAdd = true;
            }
            break;
          case 'monthly':
            if (currentDate.getDate() === startDate.getDate()) {
              shouldAdd = true;
            }
            break;
          case 'bi-weekly':
            if (recurrence.daysOfWeek?.includes(currentDate.getDay())) {
              shouldAdd = true;
            }
            break;
        }
        
        if (shouldAdd) {
          const dateStr = currentDate.toISOString().split('T')[0];
          entries.push({
            ...entry,
            date: dateStr
          });
        }
        
        // Move to next date based on interval
        const interval = recurrence.interval || 1;
        switch (recurrence.type) {
          case 'daily':
            currentDate.setDate(currentDate.getDate() + interval);
            break;
          case 'weekly':
            currentDate.setDate(currentDate.getDate() + 1);
            break;
          case 'monthly':
            currentDate.setMonth(currentDate.getMonth() + interval);
            break;
          case 'bi-weekly':
            currentDate.setDate(currentDate.getDate() + interval);
            break;
        }
      }
      
      // Add all entries to Firestore
      const addPromises = entries.map(entry => this.addScheduleEntry(entry));
      await Promise.all(addPromises);
      
      return { success: true, message: `Created ${entries.length} recurring schedule entries` };
    } catch (error) {
      throw new Error(`Failed to create recurring schedule: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Cleaners
  async getActiveCleaner(cleanerId: string): Promise<Cleaner | null> {
    const q = query(
      collection(db, "logins"),
      where("__name__", "==", cleanerId)
    );
    
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return null;
    }
    
    const data = snapshot.docs[0].data();
    return {
      id: cleanerId,
      active: data.active || false
    };
  }

  // Users
  async getUsers(): Promise<User[]> {
    const snapshot = await getDocs(collection(db, "users"));
    const users: User[] = [];
    
    for (const docSnapshot of snapshot.docs) {
      const data = docSnapshot.data();
      const currentDocId = docSnapshot.id;
      
      // If this is an old user without proper structure, automatically migrate it
      if (!data.username && (data.name || data.id)) {
        const oldId = data.id || data.name;
        const newUsername = oldId.toLowerCase().replace(/\s+/g, '');
        
        // Create new user with proper structure
        const newUserRef = doc(db, "users", newUsername);
        await setDoc(newUserRef, {
          id: newUsername,
          username: newUsername,
          firstName: data.firstName || oldId,
          lastName: data.lastName || '',
          email: data.email || '',
          phone: data.phone || '',
          active: data.active || true,
          createdAt: data.createdAt || new Date()
        });
        
        // Delete the old document if it's different
        if (currentDocId !== newUsername) {
          await deleteDoc(docSnapshot.ref);
        }
        
        // Add the migrated user to our results
        users.push({
          id: newUsername,
          username: newUsername,
          firstName: data.firstName || oldId,
          lastName: data.lastName || '',
          email: data.email || '',
          phone: data.phone || '',
          active: data.active || true,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
        });
      } else {
        // User already has proper structure
        users.push({
          id: data.username || docSnapshot.id,
          username: data.username || data.name || 'Unknown',
          firstName: data.firstName || 'Unknown',
          lastName: data.lastName || 'Unknown',
          email: data.email || '',
          phone: data.phone || '',
          active: data.active || true,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
        });
      }
    }
    
    return users;
  }

  async updateUser(username: string, updates: { firstName?: string; lastName?: string; email?: string; phone?: string; active?: boolean }) {
    try {
      const userRef = doc(db, "users", username);
      await updateDoc(userRef, updates);
      
      return { success: true, message: 'User updated successfully' };
    } catch (error) {
      throw new Error(`Failed to update user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getExistingUserIds(): Promise<string[]> {
    try {
      const snapshot = await getDocs(collection(db, "logs"));
      const userIds = [...new Set(snapshot.docs.map(doc => doc.data().cleanerId))];
      return userIds.filter(id => id && id !== 'MANAGER');
    } catch (error) {
      throw new Error(`Failed to get existing user IDs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async addUser(userData: { firstName: string; lastName: string; email: string; phone: string }) {
    // Generate username from first.lastname (lowercase, no spaces)
    const username = `${userData.firstName.toLowerCase()}.${userData.lastName.toLowerCase()}`.replace(/\s+/g, '');
    
    // Check if user already exists
    const existingUsers = await this.getUsers();
    if (existingUsers.find(u => u.username === username)) {
      throw new Error('Username already exists');
    }

    // Use the username as the document ID to ensure consistency
    const userRef = doc(db, "users", username);
    await setDoc(userRef, {
      id: username,
      username: username,
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      phone: userData.phone,
      active: true,
      createdAt: new Date()
    });
    
    return { success: true, message: 'User added successfully' };
  }

  async deleteAllUsers(): Promise<{ success: boolean; message: string; deletedCount: number }> {
    try {
      const snapshot = await getDocs(collection(db, "users"));
      let deletedCount = 0;
      
      for (const docSnapshot of snapshot.docs) {
        await deleteDoc(docSnapshot.ref);
        deletedCount++;
      }
      
      return {
        success: true,
        message: `Successfully deleted ${deletedCount} users`,
        deletedCount
      };
    } catch (error) {
      throw new Error(`Failed to delete users: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }


  // Facility Resolution
  async resolveFacility(cleanerId: string, date?: string) {
    const today = date || new Date().toISOString().slice(0, 10);
    
    const q = query(
      collection(db, "schedule"),
      where("date", "==", today),
      where("cleanerId", "==", cleanerId)
    );
    
    const snapshot = await getDocs(q);
    const scheduleEntries = snapshot.docs.map(doc => doc.data() as ScheduleEntry);
    
    if (scheduleEntries.length === 1) {
      return { facility: scheduleEntries[0].facilityId };
    }
    
    if (scheduleEntries.length > 1) {
      return { 
        facility: scheduleEntries[0].facilityId,
        warning: "Multiple shifts today—using first"
      };
    }
    
    // No schedule found, return all facilities as choices
    const facilities = await this.getFacilities();
    return { choices: facilities.map(f => f.id) };
  }
}

export const firestoreService = new FirestoreService(); 