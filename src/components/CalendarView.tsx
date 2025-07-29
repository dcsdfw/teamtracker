import { useState, useEffect } from 'react'
import { firestoreService } from '../firestoreService'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

import { Calendar, ChevronLeft, ChevronRight, Plus, Edit, Trash2, RefreshCw } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { ScheduleManager } from './ScheduleManager'

interface CalendarViewProps {
  isManager?: boolean
  currentUserId?: string
}

interface ScheduleEntry {
  id?: string
  date: string
  cleanerIds: string[]
  facilityId: string
  startTime?: string
  endTime?: string
  notes?: string
}

export const CalendarView = ({ isManager = false, currentUserId }: CalendarViewProps) => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [scheduleEntries, setScheduleEntries] = useState<ScheduleEntry[]>([])
  const [facilities, setFacilities] = useState<Array<{ id: string; name: string }>>([])
  const [users, setUsers] = useState<Array<{ id: string; username: string; firstName: string; lastName: string }>>([])
  const [loading, setLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const [deleteEntryId, setDeleteEntryId] = useState<string | null>(null)
  const [showScheduleManager, setShowScheduleManager] = useState(false)
  const { toast } = useToast()

  // Generate consistent colors for facilities
  const getFacilityColor = (facilityId: string) => {
    const colors = [
      'bg-blue-500/20 border-blue-500/30 text-blue-700',
      'bg-green-500/20 border-green-500/30 text-green-700',
      'bg-purple-500/20 border-purple-500/30 text-purple-700',
      'bg-orange-500/20 border-orange-500/30 text-orange-700',
      'bg-pink-500/20 border-pink-500/30 text-pink-700',
      'bg-indigo-500/20 border-indigo-500/30 text-indigo-700',
      'bg-teal-500/20 border-teal-500/30 text-teal-700',
      'bg-red-500/20 border-red-500/30 text-red-700',
      'bg-yellow-500/20 border-yellow-500/30 text-yellow-700',
      'bg-cyan-500/20 border-cyan-500/30 text-cyan-700',
    ]
    
    // Use facility ID to consistently assign colors
    const index = facilities.findIndex(f => f.id === facilityId)
    return colors[index % colors.length] || colors[0]
  }

  useEffect(() => {
    loadFacilities()
    loadUsers()
    loadScheduleForMonth()
  }, [currentDate])

  const loadFacilities = async () => {
    try {
      const facilitiesData = await firestoreService.getFacilities()
      setFacilities(facilitiesData)
    } catch (error) {
      console.error('Error loading facilities:', error)
    }
  }

  const loadUsers = async () => {
    try {
      const usersData = await firestoreService.getUsers()
      setUsers(usersData)
    } catch (error) {
      console.error('Error loading users:', error)
    }
  }

  const loadScheduleForMonth = async () => {
    setLoading(true)
    try {
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth() + 1
      const daysInMonth = new Date(year, month, 0).getDate()
      
      const allEntries: ScheduleEntry[] = []
      
      // Load schedule for each day of the month
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
        try {
          const dayEntries = await firestoreService.getSchedule(dateStr)
          allEntries.push(...dayEntries)
        } catch (error) {
          console.error(`Error loading schedule for ${dateStr}:`, error)
        }
      }
      
      console.log('Calendar Debug - All entries loaded:', {
        currentUserId,
        isManager,
        totalEntries: allEntries.length,
        allEntries: allEntries.map(e => ({ 
          cleanerIds: e.cleanerIds, 
          date: e.date, 
          facilityId: e.facilityId,
          startTime: e.startTime,
          endTime: e.endTime
        }))
      })
      
      // Show all unique cleaner IDs in the database
      const uniqueCleanerIds = [...new Set(allEntries.flatMap(e => e.cleanerIds))]
      console.log('🔍 ALL CLEANER IDs IN DATABASE:', uniqueCleanerIds)
      console.log('📅 ALL ENTRIES DETAILS:', allEntries.map(e => ({
        cleanerIds: e.cleanerIds,
        date: e.date,
        facilityId: e.facilityId,
        startTime: e.startTime,
        endTime: e.endTime
      })))
      
      // Filter entries based on user permissions
      let filteredEntries = allEntries
      if (!isManager && currentUserId) {
        // For regular users, only show their own schedule
        console.log('Calendar Debug - Before filtering:', {
          currentUserId,
          allCleanerIds: allEntries.flatMap(e => e.cleanerIds),
          comparison: allEntries.map(e => ({ 
            entryCleanerIds: e.cleanerIds, 
            currentUserId, 
            matches: e.cleanerIds.some(id => id.toLowerCase() === currentUserId?.toLowerCase())
          }))
        })
        
        filteredEntries = allEntries.filter(entry => 
          entry.cleanerIds.some(id => id.toLowerCase() === currentUserId?.toLowerCase())
        )
        console.log('Calendar Debug - After filtering:', {
          currentUserId,
          filteredEntriesCount: filteredEntries.length,
          filteredEntries: filteredEntries.map(e => ({ cleanerIds: e.cleanerIds, date: e.date, facilityId: e.facilityId }))
        })
      }
      
      setScheduleEntries(filteredEntries)
    } catch (error) {
      console.error('Error loading schedule:', error)
      toast({
        title: "Error",
        description: "Failed to load schedule",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    return { daysInMonth, startingDayOfWeek }
  }

  const getEntriesForDate = (date: string) => {
    return scheduleEntries.filter(entry => entry.date === date)
  }

  const getFacilityName = (facilityId: string) => {
    const facility = facilities.find(f => f.id === facilityId)
    return facility?.name || 'Unknown Facility'
  }

  const getUserDisplayName = (cleanerId: string) => {
    const user = users.find(u => u.username === cleanerId)
    return user ? `${user.firstName} ${user.lastName} (${cleanerId})` : cleanerId
  }

  const formatTime = (time?: string) => {
    if (!time) return ''
    return time.substring(0, 5) // Show only HH:MM
  }

  const handleEditEntry = (entry: ScheduleEntry) => {
    setSelectedDate(entry.date)
    setShowScheduleManager(true)
  }

  const handleDeleteEntry = async () => {
    if (!deleteEntryId) return
    
    setLoading(true)
    try {
      await firestoreService.deleteScheduleEntry(deleteEntryId)
      toast({
        title: "Success",
        description: "Schedule entry deleted successfully",
      })
      setDeleteEntryId(null)
      loadScheduleForMonth()
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to delete schedule entry: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleScheduleUpdated = () => {
    loadScheduleForMonth()
  }

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate)
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const renderCalendarDays = () => {
    const days = []
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 bg-muted/20 border border-border/50"></div>)
    }
    
    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
      const dayEntries = getEntriesForDate(dateStr)
      const isToday = dateStr === new Date().toISOString().split('T')[0]
      
      days.push(
        <div 
          key={day} 
          className={`h-24 border border-border/50 p-1 ${isToday ? 'bg-primary/10 border-primary' : 'bg-background/50'}`}
        >
          <div className="flex justify-between items-start mb-1">
            <span className={`text-sm font-medium ${isToday ? 'text-primary' : 'text-foreground'}`}>
              {day}
            </span>
            {isManager && (
              <Button
                size="sm"
                variant="ghost"
                className="h-4 w-4 p-0 hover:bg-primary/20"
                onClick={() => {
                  setSelectedDate(dateStr)
                  setShowScheduleManager(true)
                }}
              >
                <Plus className="h-3 w-3" />
              </Button>
            )}
          </div>
          
                     <div className="space-y-1 max-h-16 overflow-y-auto">
             {dayEntries.map((entry, index) => (
               <div 
                 key={entry.id || `entry-${index}`} 
                 className={`text-xs p-1 rounded border ${getFacilityColor(entry.facilityId)}`}
               >
                 <div className="font-medium">
                   {getFacilityName(entry.facilityId)}
                 </div>
                 <div className="text-muted-foreground">
                   {entry.cleanerIds.map(id => getUserDisplayName(id)).join(', ')}
                   {entry.startTime && ` • ${formatTime(entry.startTime)}`}
                   {entry.endTime && ` - ${formatTime(entry.endTime)}`}
                 </div>
                 {entry.notes && (
                   <div className="text-muted-foreground truncate" title={entry.notes}>
                     {entry.notes}
                   </div>
                 )}
                 {isManager && (
                   <div className="flex gap-1 mt-1">
                     <Button
                       size="sm"
                       variant="ghost"
                       className="h-3 w-3 p-0 hover:bg-primary/20"
                       onClick={() => handleEditEntry(entry)}
                     >
                       <Edit className="h-2 w-2" />
                     </Button>
                     <Button
                       size="sm"
                       variant="ghost"
                       className="h-3 w-3 p-0 hover:bg-destructive/20 text-destructive"
                       onClick={() => setDeleteEntryId(entry.id!)}
                     >
                       <Trash2 className="h-2 w-2" />
                     </Button>
                   </div>
                 )}
               </div>
             ))}
           </div>
        </div>
      )
    }
    
    return days
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        <Card className="bg-gradient-card border-border/50 shadow-card backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                Schedule Calendar
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  onClick={previousMonth}
                  variant="outline"
                  size="sm"
                  className="hover:bg-primary/10"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-lg font-semibold min-w-[150px] text-center">
                  {monthName}
                </span>
                <Button
                  onClick={nextMonth}
                  variant="outline"
                  size="sm"
                  className="hover:bg-primary/10"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">Loading schedule...</p>
              </div>
            ) : (
              <>
                {/* Calendar Header */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="h-8 flex items-center justify-center text-sm font-semibold text-muted-foreground">
                      {day}
                    </div>
                  ))}
                </div>
                
                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {renderCalendarDays()}
                </div>
                
                                 {/* Legend */}
                 <div className="mt-4 pt-4 border-t border-border/50">
                   <div className="space-y-3">
                     <div className="flex items-center gap-4 text-sm">
                       <div className="flex items-center gap-2">
                         <div className="w-3 h-3 bg-primary/10 border border-primary rounded"></div>
                         <span>Today</span>
                       </div>
                       {isManager && (
                         <div className="flex items-center gap-2">
                           <Plus className="h-3 w-3 text-primary" />
                           <span>Add Entry</span>
                         </div>
                       )}
                     </div>
                     
                     {/* Facility Color Legend */}
                     {facilities.length > 0 && (
                       <div className="space-y-2">
                         <div className="text-sm font-medium text-muted-foreground">Facilities:</div>
                         <div className="flex flex-wrap gap-2">
                           {facilities.map((facility) => (
                             <div key={facility.id} className="flex items-center gap-2 text-xs">
                               <div className={`w-3 h-3 rounded border ${getFacilityColor(facility.id)}`}></div>
                               <span>{facility.name}</span>
                             </div>
                           ))}
                         </div>
                       </div>
                     )}
                   </div>
                 </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Schedule Manager Dialog */}
      {showScheduleManager && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg border border-border/50 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Schedule Manager</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowScheduleManager(false)
                  setSelectedDate(null)
                }}
              >
                ×
              </Button>
            </div>
            <ScheduleManager
              selectedDate={selectedDate || undefined}
              onScheduleUpdated={handleScheduleUpdated}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteEntryId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg border border-border/50 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-foreground mb-4">Delete Schedule Entry</h3>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to delete this schedule entry? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={handleDeleteEntry}
                disabled={loading}
                variant="destructive"
                className="flex-1"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </>
                )}
              </Button>
              <Button
                onClick={() => setDeleteEntryId(null)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 