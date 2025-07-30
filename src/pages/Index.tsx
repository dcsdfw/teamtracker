import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Timer } from '@/components/Timer';
import { FacilitySelector } from '@/components/FacilitySelector';
import { TimeEntries } from '@/components/TimeEntries';
import { Navigation } from '@/components/Navigation';
import { CleanerLogin } from '@/components/CleanerLogin';
import { ManagerLogin } from '@/components/ManagerLogin';
import { ManagerInterface } from '@/components/ManagerInterface';
import CalendarView from '@/components/CalendarView';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Clock, LogOut } from 'lucide-react';

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



export default function Index() {
  const location = useLocation();
  const navigate = useNavigate();
  const [cleanerId, setCleanerId] = useState<string | null>(null);
  // Determine current view from URL path
  const getCurrentView = (): 'timer' | 'manager' | 'calendar' => {
    const path = location.pathname;
    if (path === '/manager') return 'manager';
    if (path === '/calendar') return 'calendar';
    return 'timer'; // Default to timer for '/' and '/timer'
  };
  const currentView = getCurrentView();
  const [showManagerLogin, setShowManagerLogin] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState('');
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [users, setUsers] = useState<Array<{ id: string; username: string; firstName: string; lastName: string; email: string; phone: string; active: boolean }>>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Load data from localStorage and Supabase on mount
  useEffect(() => {
    const savedCleanerId = localStorage.getItem('cleanerId');
    
    if (savedCleanerId) {
      setCleanerId(savedCleanerId);
    }
    
    loadFacilities();
    loadUsers();
  }, []);

  // Reload time entries when facilities are loaded
  useEffect(() => {
    if (facilities.length > 0 && cleanerId) {
      loadTimeEntries(cleanerId);
    }
  }, [facilities, cleanerId]);

  const loadFacilities = async () => {
    try {
      const facilitiesData = await getFacilities();
      setFacilities(facilitiesData);
    } catch (error) {
      console.error('Error loading facilities:', error);
      toast({
        title: "Error",
        description: "Failed to load facilities",
        variant: "destructive",
      });
    }
  };

  const loadUsers = async () => {
    try {
      const usersData = await getUsers();
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadTimeEntries = async (id?: string) => {
    setLoading(true);
    try {
      const supabaseEntries = await getTimeEntries(id);
      
      // Transform Supabase data to match TimeEntry interface
      const transformedEntries = supabaseEntries.map((entry: any) => {
        // Find facility name by ID
        const facility = facilities.find(f => f.id === entry.facilityId);
        
        return {
          id: entry.id,
          cleanerId: entry.cleanerId,
          facility: facility?.name || 'Unknown Facility',
          duration: entry.durationMinutes || 0, // Duration is already in seconds
          notes: entry.notes || '',
          startTime: new Date(entry.startISO),
          endTime: new Date(entry.endISO),
          createdAt: entry.createdAt ? new Date(entry.createdAt) : new Date(),
        } as TimeEntry;
      });
      
      setTimeEntries(transformedEntries);
    } catch (error) {
      console.error('Error loading time entries:', error);
      toast({
        title: "Error",
        description: "Failed to load time entries",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (id: string) => {
    setCleanerId(id);
    localStorage.setItem('cleanerId', id);
    toast({
      title: "Welcome!",
      description: `Logged in as ${id}`,
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('cleanerId');
    localStorage.removeItem('teamtracker-manager-auth');
    setCleanerId(null);
    navigate('/timer');
    setSelectedFacility('');
  };

  const handleBackToFacilitySelection = () => {
    setSelectedFacility('');
  };

  const handleBackToLogin = () => {
    handleLogout();
  };

  const handleManagerLogin = () => {
    setShowManagerLogin(false);
    setCleanerId('MANAGER'); // Set cleanerId to MANAGER for manager access
    navigate('/manager');
    toast({
      title: "Manager Access Granted",
      description: "Welcome to the Manager Dashboard",
    });
  };

  const handleManagerLoginBack = () => {
    setShowManagerLogin(false);
  };

  const handleViewChange = (view: 'timer' | 'manager' | 'calendar') => {
    if (view === 'manager') {
      const hasManagerAuth = localStorage.getItem('teamtracker-manager-auth') === 'true';
      if (!hasManagerAuth) {
        setShowManagerLogin(true);
        return;
      }
    }
    switch (view) {
      case 'timer':
        navigate('/timer');
        break;
      case 'manager':
        navigate('/manager');
        break;
      case 'calendar':
        navigate('/calendar');
        break;
    }
  };

  const handleTimeEntry = async (entry: Omit<TimeEntry, 'id' | 'cleanerId' | 'createdAt'>) => {
    if (!cleanerId) return;

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

      const result = await addTimeEntry({
        cleanerId,
        facilityId: facility.id, // Use facility ID, not name
        startISO: entry.startTime.toISOString(),
        endISO: entry.endTime.toISOString(),
        durationMinutes: entry.duration, // Store duration in seconds (keeping the field name for compatibility)
        notes: entry.notes,
      });

      if (result.success) {
        // Reload time entries to show the new entry
        if (facilities.length > 0) {
          await loadTimeEntries(cleanerId);
        }
        const minutes = Math.round(entry.duration / 60);
        const seconds = entry.duration % 60;
        const timeDisplay = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
        toast({
          title: "Time Entry Saved",
          description: `${timeDisplay} at ${entry.facility}`,
        });
      }
    } catch (error) {
      console.error('Error saving time entry:', error);
      toast({
        title: "Error",
        description: "Failed to save time entry",
        variant: "destructive",
      });
    }
  };

  const handleDeleteEntry = async (id: string) => {
    // Note: We'll need to add delete functionality to scheduleService
    // For now, just remove from local state
    setTimeEntries(prev => prev.filter(entry => entry.id !== id));
    toast({
      title: "Entry Deleted",
      description: "Time entry has been removed",
    });
  };

  const getCleanerEntries = () => {
    return timeEntries.filter(entry => entry.cleanerId === cleanerId);
  };

  const getTotalHours = (entries: TimeEntry[]) => {
    const totalSeconds = entries.reduce((sum, entry) => sum + entry.duration, 0);
    return (totalSeconds / 3600).toFixed(1); // Convert seconds to hours
  };

  const getUserDisplayName = (cleanerId: string) => {
    const user = users.find(u => u.username === cleanerId);
    return user ? `${user.firstName} ${user.lastName} (${cleanerId})` : cleanerId;
  };



  // If not logged in, show login screen
  if (!cleanerId) {
    return <CleanerLogin onLogin={handleLogin} />;
  }

  // If showing manager login, show manager login screen
  if (showManagerLogin) {
    return <ManagerLogin onManagerLogin={handleManagerLogin} onBack={handleManagerLoginBack} />;
  }

  const cleanerEntries = getCleanerEntries();

  return (
    <div className="min-h-screen bg-background">
      <Navigation 
        currentView={currentView}
        onViewChange={handleViewChange}
        cleanerId={cleanerId}
        totalHours={parseFloat(getTotalHours(cleanerEntries))}
        onLogout={handleLogout}
        onBackToFacilitySelection={handleBackToFacilitySelection}
        onBackToLogin={handleBackToLogin}
        users={users}
      />
      
      <div className="container mx-auto px-4 py-6 pt-20 pb-8">
        {currentView === 'timer' ? (
          // Enhanced Cleaner View
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
                  👤 {getUserDisplayName(cleanerId)}
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
        ) : currentView === 'calendar' ? (
          // Calendar View
          <CalendarView isManager={cleanerId === 'MANAGER'} currentUserId={cleanerId} />
        ) : (
          // Manager Interface - using the original working component
          <ManagerInterface onBack={() => navigate('/timer')} />
        )}
      </div>
    </div>
  );
} 