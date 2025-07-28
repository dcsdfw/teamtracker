import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  doc, 
  updateDoc, 
  deleteDoc,
  orderBy,
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
  cleanerId: string;
  facilityId: string;
  startTime?: string;
  endTime?: string;
  notes?: string;
}

export interface Cleaner {
  id: string;
  active: boolean;
}

class FirestoreService {
  // Time Entries
  async addTimeEntry(entry: Omit<TimeEntry, 'createdAt'>) {
    // Filter out undefined values before saving to Firestore
    const cleanEntry = Object.fromEntries(
      Object.entries(entry).filter(([_, value]) => value !== undefined)
    );
    
    const timeEntry: TimeEntry = {
      ...cleanEntry,
      createdAt: new Date()
    } as TimeEntry;
    
    const docRef = await addDoc(collection(db, "logs"), timeEntry);
    console.log('Time entry added with ID:', docRef.id);
    return { success: true, id: docRef.id };
  }

  async getTimeEntries(cleanerId?: string) {
    let q;
    
    if (cleanerId) {
      q = query(
        collection(db, "logs"),
        where("cleanerId", "==", cleanerId),
        orderBy("createdAt", "desc"),
        limit(100)
      );
    } else {
      // Get all time entries for manager view
      q = query(
        collection(db, "logs"),
        orderBy("createdAt", "desc"),
        limit(100)
      );
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
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