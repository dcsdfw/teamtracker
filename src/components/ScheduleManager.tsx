import React, { useState, useEffect, useRef } from 'react'
import { firestoreService } from '../firestoreService'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { Badge } from '@/components/ui/badge'
import { Calendar, Plus, Edit, Trash2, Clock, Building2, Users, RefreshCw, X, ChevronDown } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ScheduleEntry {
  id?: string
  date: string
  cleanerIds: string[] // Changed from cleanerId to cleanerIds array
  facilityId: string
  startTime?: string
  endTime?: string
  notes?: string
}

interface ScheduleManagerProps {
  selectedDate?: string
  onScheduleUpdated?: () => void
}

export const ScheduleManager = ({ selectedDate, onScheduleUpdated }: ScheduleManagerProps) => {
  const [isLoading, setIsLoading] = useState(false)
  const [facilities, setFacilities] = useState<Array<{ id: string; name: string }>>([])
  const [users, setUsers] = useState<Array<{ id: string; username: string; firstName: string; lastName: string }>>([])
  const [scheduleEntries, setScheduleEntries] = useState<ScheduleEntry[]>([])
  const [editingEntry, setEditingEntry] = useState<ScheduleEntry | null>(null)
  const [deleteEntryId, setDeleteEntryId] = useState<string | null>(null)
  const { toast } = useToast()

  // Form state
  const [formData, setFormData] = useState({
    date: selectedDate || new Date().toISOString().split('T')[0],
    cleanerIds: [] as string[],
    facilityId: '',
    startTime: '',
    endTime: '',
    notes: ''
  })

  // Recurring schedule state
  const [recurringData, setRecurringData] = useState({
    type: 'weekly' as 'daily' | 'weekly' | 'bi-weekly' | 'monthly',
    daysOfWeek: [] as number[],
    interval: 1,
    endDate: ''
  })

  const daysOfWeek = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' }
  ]

  const [showCleanerDropdown, setShowCleanerDropdown] = useState(false)
  const cleanerDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadData()
  }, [selectedDate])

  // Handle clicking outside the cleaner dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cleanerDropdownRef.current && !cleanerDropdownRef.current.contains(event.target as Node)) {
        setShowCleanerDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [facilitiesData, usersData] = await Promise.all([
        firestoreService.getFacilities(),
        firestoreService.getUsers()
      ])
      setFacilities(facilitiesData)
      setUsers(usersData)

      if (selectedDate) {
        const entries = await firestoreService.getSchedule(selectedDate)
        setScheduleEntries(entries)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to load data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      date: selectedDate || new Date().toISOString().split('T')[0],
      cleanerIds: [],
      facilityId: '',
      startTime: '',
      endTime: '',
      notes: ''
    })
    setEditingEntry(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (editingEntry?.id) {
        await firestoreService.updateScheduleEntry(editingEntry.id, formData)
        toast({
          title: "Success",
          description: "Schedule entry updated successfully",
        })
      } else {
        await firestoreService.addScheduleEntry(formData)
        toast({
          title: "Success",
          description: "Schedule entry added successfully",
        })
      }
      
      resetForm()
      loadData()
      onScheduleUpdated?.()
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to save schedule entry: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteEntryId) return
    
    setIsLoading(true)
    try {
      await firestoreService.deleteScheduleEntry(deleteEntryId)
      toast({
        title: "Success",
        description: "Schedule entry deleted successfully",
      })
      setDeleteEntryId(null)
      loadData()
      onScheduleUpdated?.()
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to delete schedule entry: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (entry: ScheduleEntry) => {
    setEditingEntry(entry)
    setFormData({
      date: entry.date,
      cleanerIds: entry.cleanerIds,
      facilityId: entry.facilityId,
      startTime: entry.startTime || '',
      endTime: entry.endTime || '',
      notes: entry.notes || ''
    })
  }

  const handleRecurringSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const entry: ScheduleEntry = {
        date: formData.date,
        cleanerIds: formData.cleanerIds,
        facilityId: formData.facilityId,
        startTime: formData.startTime || undefined,
        endTime: formData.endTime || undefined,
        notes: formData.notes || undefined
      }

      await firestoreService.addRecurringSchedule(entry, recurringData)
      toast({
        title: "Success",
        description: "Recurring schedule created successfully",
      })
      
      resetForm()
      onScheduleUpdated?.()
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to create recurring schedule: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const toggleDayOfWeek = (day: number) => {
    setRecurringData(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter(d => d !== day)
        : [...prev.daysOfWeek, day]
    }))
  }

  const getFacilityName = (facilityId: string) => {
    return facilities.find(f => f.id === facilityId)?.name || 'Unknown Facility'
  }

  const getUserDisplayName = (cleanerId: string) => {
    const user = users.find(u => u.id === cleanerId)
    return user ? `${user.firstName} ${user.lastName}` : cleanerId
  }

  const formatTime = (time: string) => {
    return time.substring(0, 5) // Show HH:MM format
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Today's Date</h3>
          {selectedDate && (
            <Badge variant="secondary">
              {new Date(selectedDate).toLocaleDateString()}
            </Badge>
          )}
        </div>
        <Button
          variant="outline"
          onClick={() => {
            setFormData({
              date: selectedDate || new Date().toISOString().split('T')[0],
              cleanerIds: [],
              facilityId: '',
              startTime: '',
              endTime: '',
              notes: ''
            })
            setEditingEntry(null)
            loadData()
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Entry
        </Button>
      </div>

      {/* Add/Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {editingEntry ? <Edit className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {editingEntry ? 'Edit Schedule Entry' : 'Add Schedule Entry'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="facility">Facility</Label>
                <Select
                  value={formData.facilityId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, facilityId: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select facility" />
                  </SelectTrigger>
                  <SelectContent>
                    {facilities.map((facility) => (
                      <SelectItem key={facility.id} value={facility.id}>
                        {facility.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cleaner">Team Members</Label>
                <div className="relative" ref={cleanerDropdownRef}>
                  <div 
                    className="min-h-[40px] border border-input bg-background px-3 py-2 rounded-md cursor-pointer flex items-center justify-between"
                    onClick={() => setShowCleanerDropdown(!showCleanerDropdown)}
                  >
                    <div className="flex flex-wrap gap-1 flex-1">
                      {formData.cleanerIds.length === 0 ? (
                        <span className="text-muted-foreground">Select team members...</span>
                      ) : (
                        formData.cleanerIds.map(cleanerId => {
                          const user = users.find(u => u.id === cleanerId)
                          return (
                            <Badge key={cleanerId} variant="secondary" className="text-xs">
                              {user ? `${user.firstName} ${user.lastName}` : cleanerId}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setFormData(prev => ({
                                    ...prev,
                                    cleanerIds: prev.cleanerIds.filter(id => id !== cleanerId)
                                  }))
                                }}
                                className="ml-1 hover:text-destructive"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          )
                        })
                      )}
                    </div>
                    <ChevronDown className={`h-4 w-4 transition-transform ${showCleanerDropdown ? 'rotate-180' : ''}`} />
                  </div>
                  
                  {showCleanerDropdown && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 border border-input bg-background rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {users.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center space-x-2 px-3 py-2 hover:bg-muted cursor-pointer"
                          onClick={() => {
                            if (formData.cleanerIds.includes(user.id)) {
                              setFormData(prev => ({
                                ...prev,
                                cleanerIds: prev.cleanerIds.filter(id => id !== user.id)
                              }))
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                cleanerIds: [...prev.cleanerIds, user.id]
                              }))
                            }
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={formData.cleanerIds.includes(user.id)}
                            onChange={() => {}} // Handled by onClick
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm flex-1">
                            {user.firstName} {user.lastName}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {formData.cleanerIds.length === 0 && (
                  <p className="text-xs text-red-500 mt-1">Please select at least one cleaner</p>
                )}
              </div>
              <div>
                <Label htmlFor="startTime">Start Time (Optional)</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="endTime">End Time (Optional)</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes..."
                />
              </div>
            </div>

            {/* Recurring Schedule Options */}
            <div className="border rounded-lg p-4 bg-muted/20">
              <div className="flex items-center gap-2 mb-3">
                <RefreshCw className="h-4 w-4" />
                <Label className="font-medium">Recurring Schedule Options</Label>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="recurrenceType">Recurrence Type</Label>
                  <Select
                    value={recurringData.type}
                    onValueChange={(value: 'daily' | 'weekly' | 'bi-weekly' | 'monthly') => 
                      setRecurringData(prev => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="endDate">End Date (Optional)</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={recurringData.endDate}
                    onChange={(e) => setRecurringData(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Leave empty to create entries for 1 year
                  </p>
                </div>
              </div>

              {(recurringData.type === 'weekly' || recurringData.type === 'bi-weekly') && (
                <div className="mt-3">
                  <Label>Days of Week</Label>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {daysOfWeek.map((day) => (
                      <Button
                        key={day.value}
                        type="button"
                        variant={recurringData.daysOfWeek.includes(day.value) ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleDayOfWeek(day.value)}
                        className="justify-start text-xs"
                      >
                        {day.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}


            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    {editingEntry ? <Edit className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                    {editingEntry ? 'Update Entry' : 'Add New Entry'}
                  </>
                )}
              </Button>
              <Button
                type="button"
                onClick={handleRecurringSubmit}
                disabled={isLoading || (recurringData.type !== 'daily' && recurringData.daysOfWeek.length === 0)}
                variant="outline"
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Create Recurring
                  </>
                )}
              </Button>
              {editingEntry && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Schedule Entries List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Schedule Entries
            {selectedDate && (
              <Badge variant="secondary">
                {scheduleEntries.length} entries
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p className="text-muted-foreground">Loading...</p>
            </div>
          ) : scheduleEntries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No schedule entries for this date
            </div>
          ) : (
            <div className="space-y-3">
              {scheduleEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="p-3 border rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Building2 className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium">{getFacilityName(entry.facilityId)}</span>
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">
                          {entry.cleanerIds.map(id => getUserDisplayName(id)).join(', ')}
                        </span>
                      </div>
                      {entry.startTime && entry.endTime && (
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">
                            {formatTime(entry.startTime)} - {formatTime(entry.endTime)}
                          </span>
                        </div>
                      )}
                      {entry.notes && (
                        <p className="text-sm text-muted-foreground mt-1">{entry.notes}</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(entry)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleteEntryId(entry.id!)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
                onClick={handleDelete}
                disabled={isLoading}
                variant="destructive"
                className="flex-1"
              >
                {isLoading ? (
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