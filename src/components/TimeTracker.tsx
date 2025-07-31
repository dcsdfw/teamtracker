import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { Timer } from '@/components/Timer';
import { FacilitySelector } from '@/components/FacilitySelector';
import { TimeEntries } from '@/components/TimeEntries';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useSession } from '@/hooks/useSession';
import { Clock, LogOut } from 'lucide-react';
import { supabase } from "../supabaseClient";

// Import our Supabase backend services
import { 
  getFacilities, 
  getUsers, 
  getTimeEntries, 
  addTimeEntry 
} from '../services/scheduleService';

interface TimeEntry {
  id: string;
  cleanerId: string;
  facility: string;
  duration: number;
  notes: string;
  startTime: Date;
  endTime: Date;
  createdAt: Date;
}

interface Facility {
  id: string;
  name: string;
}

export default function TimeTracker() {
  const navigate = useNavigate();
  const { session, loading: sessionLoading } = useSession();
  const [cleanerId, setCleanerId] = useState<string | null>(null);
  const [selectedFacility, setSelectedFacility] = useState('');
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [users, setUsers] = useState<Array<{ id: string; username: string; firstName: string; lastName: string; email: string; phone: string; active: boolean }>>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Handle session-based routing
  useEffect(() => {
    if (session?.user) {
      // Set up auth flags based on role
      if (session.role === 'manager') {
        localStorage.setItem('teamtracker-manager-auth', 'true');
      }
      
      // All users (including managers) can track time
      localStorage.setItem('teamtracker-cleaner-id', session.user.id);
      setCleanerId(session.user.id);
    }
  }, [session, navigate]);

  // Single initializer for all data loading
  useEffect(() => {
    async function init() {
      try {
        // 1. Load saved cleaner ID from localStorage
        const savedCleanerId = localStorage.getItem('cleanerId');
        if (savedCleanerId) {
          setCleanerId(savedCleanerId);
        }

        // 2. Load facilities
        const facilitiesData = await getFacilities();
        setFacilities(facilitiesData);

        // 3. Load users
        const usersData = await getUsers();
        const mappedUsers = usersData.map((user: any) => ({
          id: user.id,
          username: user.email,
          firstName: user.first_name || '',
          lastName: user.last_name || '',
          email: user.email,
          phone: user.phone || '',
          active: user.active || true
        }));
        setUsers(mappedUsers);

        // 4. Load time entries if cleanerId exists
        if (cleanerId) {
          const entriesData = await getTimeEntries();
          setTimeEntries(entriesData);
        }
      } catch (err) {
        console.error('TimeTracker init error:', err);
        toast({
          title: "Error loading data",
          description: "Failed to load dashboard data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [cleanerId, toast]);

  const handleLogout = () => {
    localStorage.removeItem('cleanerId');
    localStorage.removeItem('teamtracker-cleaner-id');
    navigate('/login');
  };

  const handleTimeEntry = async (entry: Omit<TimeEntry, 'id' | 'cleanerId' | 'createdAt'>) => {
    if (!cleanerId) {
      toast({
        title: "Error",
        description: "No cleaner ID found. Please log in again.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Find the facility ID by name
      const facility = facilities.find(f => f.name === entry.facility);
      if (!facility) {
        toast({
          title: "Error",
          description: `Facility "${entry.facility}" not found`,
          variant: "destructive",
        });
        return;
      }

      const newEntry = {
        cleanerId,
        facilityId: facility.id,
        startISO: entry.startTime.toISOString(),
        endISO: entry.endTime.toISOString(),
        durationMinutes: entry.duration,
        notes: entry.notes,
      };

      await addTimeEntry(newEntry);
      
      // Refresh time entries
      const updatedEntries = await getTimeEntries();
      setTimeEntries(updatedEntries);

      toast({
        title: "Time entry added",
        description: `Added ${entry.duration} hours for ${entry.facility}`,
      });
    } catch (error) {
      console.error('Error adding time entry:', error);
      toast({
        title: "Error",
        description: "Failed to add time entry. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteEntry = async (id: string) => {
    try {
      // Note: You'll need to implement deleteTimeEntry in scheduleService
      // await deleteTimeEntry(id);
      
      // For now, just remove from local state
      setTimeEntries(prev => prev.filter(entry => entry.id !== id));
      
      toast({
        title: "Entry deleted",
        description: "Time entry has been removed.",
      });
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast({
        title: "Error",
        description: "Failed to delete entry. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getCleanerEntries = () => {
    return timeEntries.filter(entry => entry.cleanerId === cleanerId);
  };

  const getTotalHours = (entries: TimeEntry[]) => {
    return entries.reduce((total, entry) => total + entry.duration, 0).toFixed(2);
  };

  const getUserDisplayName = (cleanerId: string) => {
    const user = users.find(u => u.id === cleanerId);
    return user ? `${user.firstName} ${user.lastName} (${cleanerId})` : cleanerId;
  };

  // Show loading while session is being determined
  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If no session, show login
  if (!session) {
    return <div>Redirecting to login...</div>;
  }

  // If session exists but no cleanerId set, show redirecting message
  if (session?.user && !cleanerId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  // Show loading while data is being fetched
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  const cleanerEntries = getCleanerEntries();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 pt-20 pb-8">
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3 text-4xl md:text-5xl font-bold text-foreground">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-primary-glow rounded-xl flex items-center justify-center shadow-glow">
                <Clock className="h-6 w-6 md:h-8 md:w-8 text-white" />
              </div>
              Time Tracker
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Badge variant="secondary" className="text-base px-4 py-2 bg-gradient-primary/10 text-primary border-primary/20">
                👤 {getUserDisplayName(cleanerId || '')}
              </Badge>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="hover:bg-destructive/10 hover:text-destructive transition-all duration-300">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
          
          <div className="grid gap-8 lg:grid-cols-2 max-w-6xl mx-auto">
            <div className="space-y-6">
              <FacilitySelector
                facilities={facilities}
                selectedFacility={selectedFacility}
                onSelectFacility={setSelectedFacility}
              />
              
              <Timer
                onTimeEntry={handleTimeEntry}
                selectedFacility={selectedFacility}
              />
            </div>
            
            <div>
              <TimeEntries
                entries={cleanerEntries}
                onDeleteEntry={handleDeleteEntry}
                loading={loading}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 