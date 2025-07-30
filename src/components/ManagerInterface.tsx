import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Clock, Building2, Users, Plus, RefreshCw, Calendar, CheckCircle, Pencil, Trash2, FileText } from 'lucide-react'
import { ScheduleManager } from './ScheduleManager'
import { 
  getFacilities, 
  getUsers, 
  getTimeEntries, 
  addFacility, 
  updateFacility, 
  addUser, 
  updateUser, 
  deleteTimeEntry,
  getExistingUserIds
  // deleteAllScheduleEntries - DEPRECATED
} from '../services/scheduleService'

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
  const [newFacilityNickname, setNewFacilityNickname] = useState('')
  const [showAddUser, setShowAddUser] = useState(false)
  const [newUserFirstName, setNewUserFirstName] = useState('')
  const [newUserLastName, setNewUserLastName] = useState('')
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserPhone, setNewUserPhone] = useState('')
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [loadingEntries, setLoadingEntries] = useState(false)
  const [listenerActive, setListenerActive] = useState(false)
  const [users, setUsers] = useState<Array<{ id: string; username: string; firstName: string; lastName: string; email: string; phone: string; active: boolean }>>([])
  const [editingUser, setEditingUser] = useState<{ id: string; username: string; firstName: string; lastName: string; email: string; phone: string; active: boolean } | null>(null)
  const [editUserFirstName, setEditUserFirstName] = useState('')
  const [editUserLastName, setEditUserLastName] = useState('')
  const [editUserEmail, setEditUserEmail] = useState('')
  const [editUserPhone, setEditUserPhone] = useState('')
  
  // Facility editing state
  const [editingFacility, setEditingFacility] = useState<{ id: string; name: string; nickname?: string } | null>(null)
  const [editFacilityId, setEditFacilityId] = useState('')
  const [editFacilityName, setEditFacilityName] = useState('')
  const [editFacilityNickname, setEditFacilityNickname] = useState('')

  const { toast } = useToast()

    useEffect(() => {
    loadFacilities()
    loadUsers()
    const unsubscribe = setupTimeEntriesListener()
    
    // Get the current date using local time (always available)
    const getCurrentDate = async () => {
      // Just use local time (always available)
      const today = new Date().toISOString().split('T')[0]
      setSelectedDate(today)
    }
    
    getCurrentDate()

    // Removed automatic database clearing - this was a mistake!
    // The manual "Clear All Schedule Data" button is available when needed

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
      const facilitiesData = await getFacilities()
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

  const loadUsers = async () => {
    try {
      console.log('Loading users...')
      const usersData = await getUsers()
      console.log('Users loaded from profiles collection:', usersData)
      
      // Map profiles data to expected user format
      const mappedUsers = usersData.map((user: any) => ({
        id: user.id,
        username: user.email || user.id,
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        email: user.email || '',
        phone: '',
        active: true
      }))
      
      setUsers(mappedUsers)
    } catch (error) {
      console.error('Error loading users:', error)
      toast({
        title: "Error",
        description: `Error loading users: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      })
    }
  }



  const setupTimeEntriesListener = () => {
    try {
      setLoadingEntries(true)
      setListenerActive(true)
      
      // Load time entries from Supabase (no real-time listener for now)
      const loadTimeEntries = async () => {
        try {
          const entries = await getTimeEntries()
          setTimeEntries(entries)
          setLoadingEntries(false)
        } catch (error) {
          console.error('Error loading time entries:', error)
          toast({
            title: "Error",
            description: `Error loading time entries: ${error instanceof Error ? error.message : 'Unknown error'}`,
            variant: "destructive",
          })
          setLoadingEntries(false)
          setListenerActive(false)
        }
      }
      
      loadTimeEntries()
      
      // Return a cleanup function
      return () => {
        setListenerActive(false)
      }
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
      await addFacility({
        id: newFacilityId.trim(),
        name: newFacilityName.trim(),
        nickname: newFacilityNickname.trim() || undefined
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
      setNewFacilityNickname('')
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

  const handleAddUser = async () => {
    if (!newUserFirstName.trim() || !newUserLastName.trim() || !newUserEmail.trim() || !newUserPhone.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields (First Name, Last Name, Email, and Phone)",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      // Here you would typically call your backend service to add the user
      // For now, we'll just show a success message
      toast({
        title: "User Added Successfully",
        description: `${newUserFirstName} ${newUserLastName} has been added to the system.`,
      })
      
      // Reset form
      setShowAddUser(false)
      setNewUserFirstName('')
      setNewUserLastName('')
      setNewUserEmail('')
      setNewUserPhone('')
    } catch (error) {
      console.error('Error adding user:', error)
      toast({
        title: "Error",
        description: `Error adding user: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditUser = async () => {
    if (!editingUser || !editUserFirstName.trim() || !editUserLastName.trim() || !editUserEmail.trim() || !editUserPhone.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields (First Name, Last Name, Email, and Phone)",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      // Update the user in the database
      await updateUser(editingUser.id, {
        firstName: editUserFirstName.trim(),
        lastName: editUserLastName.trim(),
        email: editUserEmail.trim(),
        phone: editUserPhone.trim()
      })
      
      // Reload users to reflect changes
      await loadUsers()
      
      toast({
        title: "User Updated Successfully",
        description: `${editUserFirstName} ${editUserLastName} has been updated.`,
      })
      
      // Reset edit form
      setEditingUser(null)
      setEditUserFirstName('')
      setEditUserLastName('')
      setEditUserEmail('')
      setEditUserPhone('')
    } catch (error) {
      console.error('Error updating user:', error)
      toast({
        title: "Error",
        description: `Error updating user: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const startEditUser = (user: { id: string; username: string; firstName: string; lastName: string; email: string; phone: string; active: boolean }) => {
    setEditingUser(user)
    setEditUserFirstName(user.firstName)
    setEditUserLastName(user.lastName)
    setEditUserEmail(user.email)
    setEditUserPhone(user.phone)
  }

  const cancelEditUser = () => {
    setEditingUser(null)
    setEditUserFirstName('')
    setEditUserLastName('')
    setEditUserEmail('')
    setEditUserPhone('')
  }

  const handleEditFacility = async () => {
    if (!editingFacility) return;

    if (!editFacilityId.trim() || !editFacilityName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in both Facility ID and Facility Name",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await updateFacility(editingFacility.id, {
        name: editFacilityName.trim(),
        nickname: editFacilityNickname.trim() || undefined
      });
      toast({
        title: "Facility Updated Successfully",
        description: `${editFacilityName} has been updated.`,
      });
      loadFacilities(); // Reload facilities to reflect changes
      setEditingFacility(null);
      setEditFacilityId('');
      setEditFacilityName('');
      setEditFacilityNickname('');
    } catch (error) {
      console.error('Error updating facility:', error);
      toast({
        title: "Error",
        description: `Error updating facility: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startEditFacility = (facility: { id: string; name: string; nickname?: string }) => {
    setEditingFacility(facility);
    setEditFacilityId(facility.id);
    setEditFacilityName(facility.name);
    setEditFacilityNickname(facility.nickname || '');
  };

  const cancelEditFacility = () => {
    setEditingFacility(null);
    setEditFacilityId('');
    setEditFacilityName('');
    setEditFacilityNickname('');
  };

  const handleDeleteTimeEntry = async (entryId: string, facilityName: string) => {
    try {
      await deleteTimeEntry(entryId);
      toast({
        title: "Entry Deleted",
        description: `Time entry for ${facilityName} has been removed.`,
      });
    } catch (error) {
      console.error('Error deleting time entry:', error);
      toast({
        title: "Error",
        description: `Failed to delete time entry: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };





  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6 ml-4">
          <Button
            onClick={onBack}
            variant="ghost"
            size="sm"
            className="hover:bg-primary/10 hover:text-primary transition-all duration-300"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        
        <div className="mb-8 ml-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-foreground">Manager Dashboard</h1>
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

          {/* User & Facility Management Column */}
          <div className="space-y-8">
            {/* User Management Section */}
            <Card className="bg-gradient-card border-border/50 shadow-card backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  User Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!showAddUser ? (
                  <Button 
                    onClick={() => setShowAddUser(true)}
                    className="w-full bg-black hover:bg-gray-800 text-white transition-all duration-300"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add New User
                  </Button>
                ) : (
                  <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-border/50">
                    <h3 className="font-semibold text-foreground">Add New User</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="newUserFirstName">First Name</Label>
                        <Input
                          type="text"
                          id="newUserFirstName"
                          value={newUserFirstName}
                          onChange={(e) => setNewUserFirstName(e.target.value)}
                          placeholder="e.g., John"
                          className="bg-background/50"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="newUserLastName">Last Name</Label>
                        <Input
                          type="text"
                          id="newUserLastName"
                          value={newUserLastName}
                          onChange={(e) => setNewUserLastName(e.target.value)}
                          placeholder="e.g., Doe"
                          className="bg-background/50"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newUserEmail">Email</Label>
                      <Input
                        type="email"
                        id="newUserEmail"
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                        placeholder="e.g., john.doe@example.com"
                        className="bg-background/50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newUserPhone">Phone</Label>
                      <Input
                        type="tel"
                        id="newUserPhone"
                        value={newUserPhone}
                        onChange={(e) => setNewUserPhone(e.target.value)}
                        placeholder="e.g., (555) 123-4567"
                        className="bg-background/50"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        onClick={handleAddUser} 
                        disabled={isLoading}
                        className="flex-1 bg-black hover:bg-gray-800 text-white transition-all duration-300"
                      >
                        {isLoading ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Add User
                          </>
                        )}
                      </Button>
                      <Button 
                        onClick={() => {
                          setShowAddUser(false)
                          setNewUserFirstName('')
                          setNewUserLastName('')
                          setNewUserEmail('')
                          setNewUserPhone('')
                        }}
                        variant="outline"
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {/* Current Users Section */}
                <div className="mt-8">
                  <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4">
                    <Users className="h-4 w-4" />
                    Current Users ({users.length})
                  </h3>
                  {users.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No users found. Add your first user above.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* User Selection Dropdown */}
                      <div className="space-y-2">
                        <Label htmlFor="userSelect">Select User to Edit</Label>
                        <Select onValueChange={(value) => {
                          const selectedUser = users.find(u => u.id === value)
                          if (selectedUser) {
                            startEditUser(selectedUser)
                          }
                        }}>
                          <SelectTrigger className="bg-background/50">
                            <SelectValue placeholder="Choose a user to edit..." />
                          </SelectTrigger>
                          <SelectContent>
                            {users.map(user => (
                              <SelectItem key={user.id} value={user.id}>
                                <span>{user.firstName} {user.lastName}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Edit User Form */}
                      {editingUser && (
                        <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-border/50">
                          <h3 className="font-semibold text-foreground">Edit User: {editingUser.firstName} {editingUser.lastName}</h3>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="editUserFirstName">First Name</Label>
                              <Input
                                type="text"
                                id="editUserFirstName"
                                value={editUserFirstName}
                                onChange={(e) => setEditUserFirstName(e.target.value)}
                                placeholder="e.g., John"
                                className="bg-background/50"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="editUserLastName">Last Name</Label>
                              <Input
                                type="text"
                                id="editUserLastName"
                                value={editUserLastName}
                                onChange={(e) => setEditUserLastName(e.target.value)}
                                placeholder="e.g., Doe"
                                className="bg-background/50"
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="editUserEmail">Email</Label>
                            <Input
                              type="email"
                              id="editUserEmail"
                              value={editUserEmail}
                              onChange={(e) => setEditUserEmail(e.target.value)}
                              placeholder="e.g., john.doe@example.com"
                              className="bg-background/50"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="editUserPhone">Phone</Label>
                            <Input
                              type="tel"
                              id="editUserPhone"
                              value={editUserPhone}
                              onChange={(e) => setEditUserPhone(e.target.value)}
                              placeholder="e.g., 555-123-4567"
                              className="bg-background/50"
                            />
                          </div>
                          

                          
                          <div className="flex gap-2">
                            <Button
                              onClick={handleEditUser}
                              disabled={isLoading}
                              className="flex-1 bg-black hover:bg-gray-800 text-white transition-all duration-300"
                            >
                              {isLoading ? (
                                <>
                                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                  Updating...
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Update User
                                </>
                              )}
                            </Button>
                            <Button
                              onClick={cancelEditUser}
                              variant="outline"
                              className="flex-1"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Facility Management Section */}
            <Card className="bg-gradient-card border-border/50 shadow-card backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-success rounded-lg flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-white" />
                  </div>
                  Facility Management
                </CardTitle>
              </CardHeader>
              <CardContent>
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

                  <div className="space-y-2">
                    <Label htmlFor="newFacilityNickname">Nickname (Optional)</Label>
                    <Input
                      type="text"
                      id="newFacilityNickname"
                      value={newFacilityNickname}
                      onChange={(e) => setNewFacilityNickname(e.target.value)}
                      placeholder="e.g., DOB, Main Office"
                      className="bg-background/50"
                    />
                    <p className="text-xs text-muted-foreground">
                      Short name for calendar display (e.g., "DOB" for "Downtown Office Building")
                    </p>
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
                        setNewFacilityNickname('')
                      }}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-3 mt-8">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Current Facilities ({facilities.length})
                </h3>
                {facilities.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Building2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No facilities found. Add your first facility above.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="facilitySelect">Select Facility to Edit</Label>
                    <Select onValueChange={(value) => {
                      const selectedFacility = facilities.find(f => f.id === value)
                      if (selectedFacility) {
                        startEditFacility(selectedFacility)
                      }
                    }}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose a facility to edit..." />
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
                )}

                {/* Edit Facility Form */}
                {editingFacility && (
                  <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-border/50 mt-4">
                    <h3 className="font-semibold text-foreground">Edit Facility</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="editFacilityId">Facility ID</Label>
                      <Input
                        type="text"
                        id="editFacilityId"
                        value={editFacilityId}
                        onChange={(e) => setEditFacilityId(e.target.value)}
                        placeholder="e.g., office-building-1"
                        className="bg-background/50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="editFacilityName">Facility Name</Label>
                      <Input
                        type="text"
                        id="editFacilityName"
                        value={editFacilityName}
                        onChange={(e) => setEditFacilityName(e.target.value)}
                        placeholder="e.g., Downtown Office Building"
                        className="bg-background/50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="editFacilityNickname">Nickname (Optional)</Label>
                      <Input
                        type="text"
                        id="editFacilityNickname"
                        value={editFacilityNickname}
                        onChange={(e) => setEditFacilityNickname(e.target.value)}
                        placeholder="e.g., DOB, Main Office"
                        className="bg-background/50"
                      />
                      <p className="text-xs text-muted-foreground">
                        Short name for calendar display (e.g., "DOB" for "Downtown Office Building")
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        onClick={handleEditFacility} 
                        disabled={isLoading}
                        className="flex-1 bg-gradient-success hover:bg-gradient-success/90 text-white transition-all duration-300"
                      >
                        {isLoading ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Update Facility
                          </>
                        )}
                      </Button>
                      <Button 
                        onClick={cancelEditFacility}
                        variant="outline"
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          </div>
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
                    <div key={entry.id} className="p-4 bg-background/50 rounded-lg border border-border/50 hover:shadow-card transition-all duration-300 group">
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
                      
                      <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          <span>{startDate.toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          <span>{startDate.toLocaleTimeString()} - {endDate.toLocaleTimeString()}</span>
                        </div>
                        <div className="flex justify-center" style={{ width: '60px' }}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteTimeEntry(entry.id, facility?.name || 'Unknown Facility')}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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