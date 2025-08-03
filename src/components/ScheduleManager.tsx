import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { Badge } from '@/components/ui/badge'
import { Plus, RefreshCw, X, ChevronDown, Repeat } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { refetchCalendar } from './CalendarView'
import { 
  addScheduleRule,
  getFacilities,
  getUsers
} from '../services/scheduleService'

interface ScheduleManagerProps {
  selectedDate?: string
  onScheduleUpdated?: () => void
}

export const ScheduleManager = ({ selectedDate, onScheduleUpdated }: ScheduleManagerProps) => {
  const [isLoading, setIsLoading] = useState(false)
  const [isProcessingRecurring, setIsProcessingRecurring] = useState(false)
  const [facilities, setFacilities] = useState<Array<{ id: string; name: string }>>([])
  const [users, setUsers] = useState<Array<{ id: string; username: string; firstName: string; lastName: string }>>([])
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
    startDate: '',
    endDate: ''
  })

  // New state for streamlined form
  const [isRecurring, setIsRecurring] = useState(false)
  const [endType, setEndType] = useState<'never' | 'count' | 'date'>('never')
  const [endCount, setEndCount] = useState(5)
  const [endDate, setEndDate] = useState('')

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
        getFacilities(),
        getUsers()
      ])
      setFacilities(facilitiesData)
      
      // Map profiles data to expected user format
      const mappedUsers = usersData.map((user: any) => ({
        id: user.id,
        username: user.email || user.id,
        firstName: user.first_name || '',
        lastName: user.last_name || ''
      }))
      setUsers(mappedUsers)
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
    setRecurringData({
      type: 'weekly',
      daysOfWeek: [],
      interval: 1,
      startDate: '',
      endDate: ''
    })
    setIsRecurring(false)
    setEndType('never')
    setEndCount(5)
    setEndDate('')
  }

  // Helper function to build RRULE string from recurrence options
  const buildRRuleString = () => {
    const { type, daysOfWeek, interval } = recurringData

    let rrule = 'FREQ='

    switch (type) {
      case 'daily':
        rrule += 'DAILY'
        break
      case 'weekly':
        rrule += 'WEEKLY'
        if (daysOfWeek.length > 0) {
          rrule += `;BYDAY=${daysOfWeek.map(day => ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'][day]).join(',')}`
        }
        break
      case 'bi-weekly':
        rrule += 'WEEKLY;INTERVAL=2'
        if (daysOfWeek.length > 0) {
          rrule += `;BYDAY=${daysOfWeek.map(day => ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'][day]).join(',')}`
        }
        break
      case 'monthly':
        rrule += 'MONTHLY'
        break
    }

    if (interval > 1 && type !== 'bi-weekly') {
      rrule += `;INTERVAL=${interval}`
    }

    // Handle end conditions
    if (endType === 'count') {
      rrule += `;COUNT=${endCount}`
    } else if (endType === 'date' && endDate) {
      rrule += `;UNTIL=${endDate.replace(/-/g, '')}T235959Z`
    } else {
      // Default to 1 year if no end date
      const oneYearFromNow = new Date()
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1)
      rrule += `;UNTIL=${oneYearFromNow.toISOString().slice(0, 10).replace(/-/g, '')}T235959Z`
    }

    return rrule
  }

  const handleRecurringSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessingRecurring(true)

    try {
      // Validate required fields
      if (!formData.facilityId || formData.cleanerIds.length === 0) {
        throw new Error('Please select a facility and at least one cleaner')
      }

      if (isRecurring && recurringData.type !== 'daily' && recurringData.daysOfWeek.length === 0) {
        throw new Error('Please select at least one day of the week for weekly/bi-weekly schedules')
      }

      // Get facility name for the schedule rule
      const facilityName = getFacilityName(formData.facilityId)

      if (isRecurring) {
        // Build the RRULE string
        const rruleString = buildRRuleString()
        
        console.log('Creating schedule rule with RRULE:', rruleString)

        // Add the schedule rule using the new approach
        await addScheduleRule({
          name: facilityName,
          facilityId: formData.facilityId,
          rrule: rruleString,
          color: '#3b82f6', // Default blue color
          notes: formData.notes || `Recurring schedule for ${facilityName}`
        })

        toast({
          title: "Success",
          description: "Recurring schedule rule created successfully",
        })
      } else {
        // Handle one-off entry (for now, just show a message)
        toast({
          title: "Info",
          description: "One-off entries are handled through the calendar view",
        })
      }
      
      // Refresh the calendar to show the new events
      refetchCalendar()
      
      resetForm()
      setIsRecurring(false)
      onScheduleUpdated?.()
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to create schedule: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      })
    } finally {
      setIsProcessingRecurring(false)
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

  // Preset configurations
  const presets = [
    { label: 'Daily ×5', type: 'daily', count: 5, daysOfWeek: [] },
    { label: 'Weekly', type: 'weekly', count: 12, daysOfWeek: [] },
    { label: 'Monthly', type: 'monthly', count: 6, daysOfWeek: [] },
    { label: 'Custom…', type: 'custom', count: 0, daysOfWeek: [] }
  ]

  const applyPreset = (preset: typeof presets[0]) => {
    if (preset.type === 'custom') return
    
    setRecurringData(prev => ({
      ...prev,
      type: preset.type as any,
      daysOfWeek: preset.daysOfWeek
    }))
    setEndType('count')
    setEndCount(preset.count)
    setIsRecurring(true)
  }

  const toggleWeekdays = () => {
    const weekdays = [1, 2, 3, 4, 5] // Mon-Fri
    setRecurringData(prev => ({
      ...prev,
      daysOfWeek: weekdays
    }))
  }

  const toggleWeekends = () => {
    const weekends = [0, 6] // Sun, Sat
    setRecurringData(prev => ({
      ...prev,
      daysOfWeek: weekends
    }))
  }

  // Live preview calculation
  const getNextDates = () => {
    if (!isRecurring || !formData.date) return []
    
    try {
      const startDate = new Date(formData.date)
      const dates = []
      
      // For daily, start from the day after the selected date
      if (recurringData.type === 'daily') {
        for (let i = 1; i <= 5; i++) {
          const nextDate = new Date(startDate.getTime() + (i * 24 * 60 * 60 * 1000))
          dates.push(nextDate)
        }
      }
      // For weekly/bi-weekly, find the next matching days of week starting from the day after
      else if (recurringData.type === 'weekly' || recurringData.type === 'bi-weekly') {
        const interval = recurringData.type === 'bi-weekly' ? 2 : 1
        const selectedDays = recurringData.daysOfWeek
        
        if (selectedDays.length === 0) return []
        
        let foundCount = 0
        let daysChecked = 1 // Start from day 1 (day after selected date)
        const maxDaysToCheck = 50 // Prevent infinite loop
        
        while (foundCount < 5 && daysChecked < maxDaysToCheck) {
          // Check each selected day of the week
          for (const dayOfWeek of selectedDays) {
            const testDate = new Date(startDate.getTime() + (daysChecked * 24 * 60 * 60 * 1000))
            
            // If this is a matching day of week and we haven't found it yet
            if (testDate.getDay() === dayOfWeek) {
              // For bi-weekly, only include if it's the right week
              if (interval === 1 || Math.floor((daysChecked - 1) / 7) % interval === 0) {
                dates.push(new Date(testDate))
                foundCount++
                if (foundCount >= 5) break
              }
            }
          }
          daysChecked++
        }
      }
      // For monthly, start from the next month
      else if (recurringData.type === 'monthly') {
        for (let i = 1; i <= 5; i++) {
          const nextDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, startDate.getDate())
          dates.push(nextDate)
        }
      }
      
      return dates.slice(0, 5) // Ensure we only return max 5 dates
    } catch (error) {
      console.error('Error calculating next dates:', error)
      return []
    }
  }

  const nextDates = getNextDates()

  return (
    <div className="space-y-6">
      {/* Add/Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Schedule Entry
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRecurringSubmit} className="space-y-4">
            {/* 1. Date and Time Row with Recurring Toggle */}
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  required
                />
              </div>
              <div className="flex-1">
                <Label>Time Range</Label>
                <div className="flex gap-2">
                  <Input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                    placeholder="Start"
                  />
                  <span className="flex items-center text-muted-foreground">–</span>
                  <Input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                    placeholder="End"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant={isRecurring ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsRecurring(!isRecurring)}
                  className="flex items-center gap-2"
                >
                  <Repeat className="h-4 w-4" />
                  Recurring
                </Button>
              </div>
            </div>

            {/* 2. Facility and Team Members Row */}
            <div className="grid grid-cols-2 gap-4">
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
            </div>

            {/* 3. Notes */}
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes..."
              />
            </div>

            {/* 4. Recurring Section (only shown when isRecurring is true) */}
            {isRecurring && (
              <div className="border rounded-lg p-4 bg-muted/20 space-y-4">
                {/* Presets */}
                <div>
                  <Label className="text-sm font-medium">Presets</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {presets.map((preset) => (
                      <Button
                        key={preset.label}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => applyPreset(preset)}
                        className="text-xs"
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Day Picker */}
                <div>
                  <Label className="text-sm font-medium">Days of Week</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {daysOfWeek.map((day) => (
                      <Button
                        key={day.value}
                        type="button"
                        variant={recurringData.daysOfWeek.includes(day.value) ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleDayOfWeek(day.value)}
                        className="w-10 h-8 text-xs"
                      >
                        {day.label.slice(0, 2)}
                      </Button>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={toggleWeekdays}
                      className="text-xs"
                    >
                      Weekdays
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={toggleWeekends}
                      className="text-xs"
                    >
                      Weekends
                    </Button>
                  </div>
                </div>

                {/* End Options */}
                <div>
                  <Label className="text-sm font-medium">Ends</Label>
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        id="endNever"
                        name="endType"
                        checked={endType === 'never'}
                        onChange={() => setEndType('never')}
                      />
                      <Label htmlFor="endNever" className="text-sm">Never</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        id="endCount"
                        name="endType"
                        checked={endType === 'count'}
                        onChange={() => setEndType('count')}
                      />
                      <Label htmlFor="endCount" className="text-sm">After</Label>
                      {endType === 'count' && (
                        <Input
                          type="number"
                          value={endCount}
                          onChange={(e) => setEndCount(parseInt(e.target.value) || 1)}
                          className="w-16 h-8"
                          min="1"
                        />
                      )}
                      <Label className="text-sm">occurrences</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        id="endDate"
                        name="endType"
                        checked={endType === 'date'}
                        onChange={() => setEndType('date')}
                      />
                      <Label htmlFor="endDate" className="text-sm">On</Label>
                      {endType === 'date' && (
                        <Input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-32 h-8"
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Live Preview */}
                {nextDates.length > 0 && (
                  <div className="text-xs text-muted-foreground pt-2 border-t">
                    Next dates: {nextDates.map((date, i) => (
                      <span key={i}>
                        {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        {i < nextDates.length - 1 ? ' · ' : ''}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 5. Action Buttons */}
            <div className="flex gap-2">
              <Button 
                type="submit" 
                disabled={isLoading || isProcessingRecurring} 
                className="flex-1"
              >
                {isProcessingRecurring ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    {isRecurring ? <Repeat className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                    {isRecurring ? 'Add One-Off' : 'Add One-Off'}
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                disabled={isLoading || isProcessingRecurring}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}