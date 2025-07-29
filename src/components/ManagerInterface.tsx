import { useState, useEffect } from 'react'
import { firestoreService } from '../firestoreService'
import { onSnapshot, collection, query, orderBy, limit } from 'firebase/firestore'
import { db } from '../firebase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Clock, Building2, Users, Plus, RefreshCw, Calendar, FileText, CheckCircle } from 'lucide-react'
import { ScheduleManager } from './ScheduleManager'

interface ManagerInterfaceProps {
  onBack: () => void
}



interface TimeEntry {
  id: string
  cleanerId: string
  facilityId: string
  startISO: string
  endISO: string
  durationMinutes: number
  notes?: string
  createdAt: Date
}

export const ManagerInterface = ({ onBack }: ManagerInterfaceProps) => {
  const [facilities, setFacilities] = useState<Array<{ id: string; name: string }>>([])

  const [isLoading, setIsLoading] = useState(false)

  const [selectedDate, setSelectedDate] = useState<string>('')

  const [selectedFacility, setSelectedFacility] = useState<string>('')
  const [showAddFacility, setShowAddFacility] = useState(false)
  const [newFacilityId, setNewFacilityId] = useState('')
  const [newFacilityName, setNewFacilityName] = useState('')
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [loadingEntries, setLoadingEntries] = useState(false)
  const [listenerActive, setListenerActive] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadFacilities()
    const unsubscribe = setupTimeEntriesListener()
    // Set today's date as default
    const today = new Date().toISOString().split('T')[0]
    setSelectedDate(today)

    // Cleanup function to unsubscribe from listener
    return () => {
      if (unsubscribe) {
        unsubscribe()
        setListenerActive(false)
      }
    }
  }, [])

  const loadFacilities = async () => {
    try {
      const facilitiesData = await firestoreService.getFacilities()
      setFacilities(facilitiesData)
    } catch (error) {
      console.error('Error loading facilities:', error)
      toast({
        title: "Error",
        description: `Error loading facilities: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      })
    }
  }



  const setupTimeEntriesListener = () => {
    try {
      setLoadingEntries(true)
      setListenerActive(true)
      
      // Create a real-time listener for time entries
      const q = query(
        collection(db, "logs"),
        orderBy("createdAt", "desc"),
        limit(100)
      )
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const entries = snapshot.docs.map(doc => {
          const data = doc.data()
          return {
            id: doc.id,
            cleanerId: data.cleanerId,
            facilityId: data.facilityId,
            startISO: data.startISO,
            endISO: data.endISO,
            durationMinutes: data.durationMinutes,
            notes: data.notes,
            createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
          } as TimeEntry
        })
        
        setTimeEntries(entries)
        setLoadingEntries(false)
      }, (error) => {
        console.error('Error listening to time entries:', error)
        toast({
          title: "Error",
          description: `Error listening to time entries: ${error.message}`,
          variant: "destructive",
        })
        setLoadingEntries(false)
        setListenerActive(false)
      })
      
      // Store the unsubscribe function for cleanup
      return unsubscribe
    } catch (error) {
      console.error('Error setting up time entries listener:', error)
      toast({
        title: "Error",
        description: `Error setting up time entries listener: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      })
      setLoadingEntries(false)
      setListenerActive(false)
    }
  }



  const handleAddFacility = async () => {
    if (!newFacilityId.trim() || !newFacilityName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in both Facility ID and Facility Name",
        variant: "destructive",
      })
      return
    }

    // Check if facility ID already exists
    if (facilities.some(f => f.id === newFacilityId.trim())) {
      toast({
        title: "Duplicate Facility",
        description: "Facility ID already exists. Please use a different ID.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      await firestoreService.addFacility({
        id: newFacilityId.trim(),
        name: newFacilityName.trim()
      })
      
      // Reload facilities to include the new one
      await loadFacilities()
      
      toast({
        title: "Success",
        description: "Facility added successfully!",
      })
      setShowAddFacility(false)
      setNewFacilityId('')
      setNewFacilityName('')
    } catch (error) {
      console.error('Error adding facility:', error)
      toast({
        title: "Error",
        description: `Error adding facility: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-8">
          <Button
            onClick={onBack}
            variant="ghost"
            size="sm"
            className="hover:bg-primary/10 hover:text-primary transition-all duration-300"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Timer
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Manager Dashboard</h1>
            <p className="text-muted-foreground">Schedule and facility management</p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Schedule Management Section */}
          <Card className="bg-gradient-card border-border/50 shadow-card backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                Schedule Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScheduleManager selectedDate={selectedDate} />
            </CardContent>
          </Card>

          {/* User & Facility Management */}
          <Card className="bg-gradient-card border-border/50 shadow-card backdrop-blur-sm">
            <CardContent className="space-y-12">
              {/* User Management Section */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground">User Management</h2>
                </div>
                
                {/* Add New User Form */}
                <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-border/50">
                  <h3 className="font-semibold text-foreground">Add New User</h3>
                  <p className="text-sm text-muted-foreground">Click the button below to add a new user with first name, last name, email, and phone number.</p>
                  <Button 
                    className="w-full bg-black hover:bg-gray-800 text-white transition-all duration-300"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add New User
                  </Button>
                </div>

                {/* Current Users Section */}
                <div className="mt-8">
                  <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4">
                    <Users className="h-4 w-4" />
                    Current Users (0)
                  </h3>
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No users found. Add your first user above.</p>
                  </div>
                </div>
              </div>

              {/* Visual Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border/50"></span>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-gradient-card px-3 text-muted-foreground">Management Sections</span>
                </div>
              </div>

              {/* Facility Management Section */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-gradient-success rounded-lg flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground">Facility Management</h2>
                </div>
              {!showAddFacility ? (
                <Button 
                  onClick={() => setShowAddFacility(true)}
                  className="w-full bg-gradient-success hover:bg-gradient-success/90 text-white transition-all duration-300"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Facility
                </Button>
              ) : (
                <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-border/50">
                  <h3 className="font-semibold text-foreground">Add New Facility</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="newFacilityId">Facility ID</Label>
                    <Input
                      type="text"
                      id="newFacilityId"
                      value={newFacilityId}
                      onChange={(e) => setNewFacilityId(e.target.value)}
                      placeholder="e.g., office-building-1"
                      className="bg-background/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newFacilityName">Facility Name</Label>
                    <Input
                      type="text"
                      id="newFacilityName"
                      value={newFacilityName}
                      onChange={(e) => setNewFacilityName(e.target.value)}
                      placeholder="e.g., Downtown Office Building"
                      className="bg-background/50"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      onClick={handleAddFacility} 
                      disabled={isLoading}
                      className="flex-1 bg-gradient-success hover:bg-gradient-success/90 text-white transition-all duration-300"
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Add Facility
                        </>
                      )}
                    </Button>
                    <Button 
                      onClick={() => {
                        setShowAddFacility(false)
                        setNewFacilityId('')
                        setNewFacilityName('')
                      }}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Current Facilities
                </h3>
                {facilities.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Building2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No facilities found. Add your first facility above.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                                         {facilities.map(facility => (
                       <div key={facility.id} className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-border/50">
                         <span className="font-medium text-foreground">{facility.name}</span>
                       </div>
                     ))}
                  </div>
                )}
              </div>

              {/* Facility Dropdown Selector */}
              <div className="mt-8">
                <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4">
                  <Building2 className="h-4 w-4" />
                  Select Facility for Schedule
                </h3>
                <Select value={selectedFacility} onValueChange={setSelectedFacility}>
                  <SelectTrigger className="w-full bg-background/50 border-border/50">
                    <SelectValue placeholder="Select a facility for scheduling" />
                  </SelectTrigger>
                  <SelectContent>
                    {facilities.map(facility => (
                      <SelectItem key={facility.id} value={facility.id}>
                        {facility.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Time Entries Section */}
        <Card className="mt-8 bg-gradient-card border-border/50 shadow-card backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                Time Entries
              </CardTitle>
              <div className="flex items-center gap-2">
                {listenerActive && (
                  <div className="flex items-center gap-1 text-xs text-success">
                    <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                    Live
                  </div>
                )}
                <Button 
                  onClick={() => {
                    const unsubscribe = setupTimeEntriesListener()
                    if (unsubscribe) {
                      // Re-setup the listener
                      setTimeout(() => unsubscribe(), 100)
                    }
                  }}
                  disabled={loadingEntries}
                  variant="outline"
                  size="sm"
                  className="hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                >
                  {loadingEntries ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh Entries
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loadingEntries ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 mx-auto mb-2 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading time entries...</p>
              </div>
            ) : timeEntries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No time entries found.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {timeEntries.map(entry => {
                  const startDate = new Date(entry.startISO)
                  const endDate = new Date(entry.endISO)
                  const facility = facilities.find(f => f.id === entry.facilityId)
                  
                  return (
                                           <div key={entry.id} className="p-4 bg-background/50 rounded-lg border border-border/50 hover:shadow-card transition-all duration-300">
                         <div className="flex items-start justify-between mb-3">
                           <div className="flex items-center gap-2">
                             <Users className="h-4 w-4 text-primary" />
                             <span className="font-semibold text-foreground">{entry.cleanerId}</span>
                             <span className="text-muted-foreground">•</span>
                             <Building2 className="h-4 w-4 text-success" />
                             <span className="font-medium text-foreground">{facility?.name || 'Unknown Facility'}</span>
                           </div>
                        <Badge variant="outline" className="text-xs">
                          {(() => {
                            const totalSeconds = entry.durationMinutes; // Duration is already in seconds
                            const hours = Math.floor(totalSeconds / 3600);
                            const minutes = Math.floor((totalSeconds % 3600) / 60);
                            const secs = totalSeconds % 60;
                            return `${hours}h:${minutes}m:${secs}s`;
                          })()}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          <span>{startDate.toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          <span>{startDate.toLocaleTimeString()} - {endDate.toLocaleTimeString()}</span>
                        </div>
                      </div>
                      
                      {entry.notes && (
                        <div className="flex items-start gap-2 text-sm text-muted-foreground mb-3">
                          <FileText className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          <span>{entry.notes}</span>
                        </div>
                      )}
                      
                      <div className="text-sm text-muted-foreground pt-3 border-t border-border/50">
                        <strong>Total time:</strong> {(() => {
                          const totalSeconds = entry.durationMinutes; // Duration is already in seconds
                          const hours = Math.floor(totalSeconds / 3600);
                          const minutes = Math.floor((totalSeconds % 3600) / 60);
                          const secs = totalSeconds % 60;
                          return `${hours}h:${minutes}m:${secs}s`;
                        })()}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 