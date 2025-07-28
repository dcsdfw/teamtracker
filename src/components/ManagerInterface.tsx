import { useState, useEffect } from 'react'
import { firestoreService } from '../firestoreService'

interface ManagerInterfaceProps {
  onBack: () => void
}

interface ScheduleEntry {
  date: string
  cleanerId: string
  facilityId: string
  startTime?: string
  endTime?: string
  notes?: string
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
  const [cleaners, setCleaners] = useState<string[]>(['C001', 'C002', 'C003', 'C004', 'C005'])
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedCleaner, setSelectedCleaner] = useState<string>('')
  const [selectedFacility, setSelectedFacility] = useState<string>('')
  const [startTime, setStartTime] = useState<string>('')
  const [endTime, setEndTime] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [showAddFacility, setShowAddFacility] = useState(false)
  const [newFacilityId, setNewFacilityId] = useState('')
  const [newFacilityName, setNewFacilityName] = useState('')
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [loadingEntries, setLoadingEntries] = useState(false)

  useEffect(() => {
    loadFacilities()
    loadTimeEntries()
    // Set today's date as default
    const today = new Date().toISOString().split('T')[0]
    setSelectedDate(today)
  }, [])

  const loadFacilities = async () => {
    try {
      console.log('Loading facilities...')
      const facilitiesData = await firestoreService.getFacilities()
      console.log('Facilities loaded successfully:', facilitiesData)
      setFacilities(facilitiesData)
    } catch (error) {
      console.error('Error loading facilities:', error)
      setMessage(`Error loading facilities: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const loadTimeEntries = async () => {
    try {
      setLoadingEntries(true)
      const entries = await firestoreService.getTimeEntries()
      setTimeEntries(entries as TimeEntry[])
    } catch (error) {
      console.error('Error loading time entries:', error)
      setMessage(`Error loading time entries: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoadingEntries(false)
    }
  }

  const handleAddSchedule = async () => {
    if (!selectedDate || !selectedCleaner || !selectedFacility) {
      setMessage('Please fill in all required fields (Date, Cleaner, Facility)')
      return
    }

    setIsLoading(true)
    setMessage('')

    try {
      const scheduleEntry: ScheduleEntry = {
        date: selectedDate,
        cleanerId: selectedCleaner,
        facilityId: selectedFacility,
        startTime: startTime || undefined,
        endTime: endTime || undefined,
        notes: notes || undefined
      }

      await firestoreService.addScheduleEntry(scheduleEntry)
      setMessage('Schedule entry added successfully!')
      
      // Clear form
      setSelectedCleaner('')
      setSelectedFacility('')
      setStartTime('')
      setEndTime('')
      setNotes('')
    } catch (error) {
      console.error('Error adding schedule:', error)
      setMessage(`Error adding schedule: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddFacility = async () => {
    if (!newFacilityId.trim() || !newFacilityName.trim()) {
      setMessage('Please fill in both Facility ID and Facility Name')
      return
    }

    // Check if facility ID already exists
    if (facilities.some(f => f.id === newFacilityId.trim())) {
      setMessage('Facility ID already exists. Please use a different ID.')
      return
    }

    setIsLoading(true)
    setMessage('')

    try {
      console.log('Adding facility:', { id: newFacilityId.trim(), name: newFacilityName.trim() })
      
      await firestoreService.addFacility({
        id: newFacilityId.trim(),
        name: newFacilityName.trim()
      })
      
      // Reload facilities to include the new one
      await loadFacilities()
      
      setMessage('Facility added successfully!')
      setShowAddFacility(false)
      setNewFacilityId('')
      setNewFacilityName('')
    } catch (error) {
      console.error('Error adding facility:', error)
      setMessage(`Error adding facility: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="manager-interface">
      <div className="manager-header">
        <button onClick={() => {
          console.log('Back button clicked')
          onBack()
        }} className="back-button">
          ← Back to Timer
        </button>
        <h1>Schedule Manager</h1>
      </div>

      {message && (
        <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      <div className="manager-content">
        {/* Schedule Management Section */}
        <div className="schedule-section">
          <h2>Add Schedule Entry</h2>
          <div className="form-group">
            <label htmlFor="date">Date:</label>
            <input
              type="date"
              id="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="cleaner">Cleaner:</label>
            <select
              id="cleaner"
              value={selectedCleaner}
              onChange={(e) => setSelectedCleaner(e.target.value)}
              required
            >
              <option value="">Select Cleaner</option>
              {cleaners.map(cleaner => (
                <option key={cleaner} value={cleaner}>{cleaner}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="facility">Facility:</label>
            <select
              id="facility"
              value={selectedFacility}
              onChange={(e) => setSelectedFacility(e.target.value)}
              required
            >
              <option value="">Select Facility</option>
              {facilities.map(facility => (
                <option key={facility.id} value={facility.id}>{facility.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="startTime">Start Time (optional):</label>
            <input
              type="time"
              id="startTime"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="endTime">End Time (optional):</label>
            <input
              type="time"
              id="endTime"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="notes">Notes (optional):</label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <button 
            onClick={handleAddSchedule} 
            disabled={isLoading}
            className="add-button"
          >
            {isLoading ? 'Adding...' : 'Add Schedule Entry'}
          </button>
        </div>

        {/* Facility Management Section */}
        <div className="facility-section">
          <h2>Facility Management</h2>
          
          {!showAddFacility ? (
            <button 
              onClick={() => setShowAddFacility(true)}
              className="add-button"
            >
              Add New Facility
            </button>
          ) : (
            <div className="add-facility-form">
              <h3>Add New Facility</h3>
              
              <div className="form-group">
                <label htmlFor="newFacilityId">Facility ID:</label>
                <input
                  type="text"
                  id="newFacilityId"
                  value={newFacilityId}
                  onChange={(e) => setNewFacilityId(e.target.value)}
                  placeholder="e.g., office-building-1"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="newFacilityName">Facility Name:</label>
                <input
                  type="text"
                  id="newFacilityName"
                  value={newFacilityName}
                  onChange={(e) => setNewFacilityName(e.target.value)}
                  placeholder="e.g., Downtown Office Building"
                  required
                />
              </div>

              <div className="button-group">
                <button 
                  onClick={handleAddFacility} 
                  disabled={isLoading}
                  className="add-button"
                >
                  {isLoading ? 'Adding...' : 'Add Facility'}
                </button>
                <button 
                  onClick={() => {
                    setShowAddFacility(false)
                    setNewFacilityId('')
                    setNewFacilityName('')
                  }}
                  className="cancel-button"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="facilities-list">
            <h3>Current Facilities</h3>
            {facilities.length === 0 ? (
              <p>No facilities found. Add your first facility above.</p>
            ) : (
              <ul>
                {facilities.map(facility => (
                  <li key={facility.id}>
                    {facility.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Time Entries Section */}
        <div className="time-entries-section">
          <h2>Time Entries</h2>
          <button 
            onClick={loadTimeEntries}
            disabled={loadingEntries}
            className="refresh-button"
          >
            {loadingEntries ? 'Loading...' : 'Refresh Entries'}
          </button>
          
          {loadingEntries ? (
            <p>Loading time entries...</p>
          ) : timeEntries.length === 0 ? (
            <p>No time entries found.</p>
          ) : (
            <div className="time-entries-list">
              {timeEntries.map(entry => {
                const startDate = new Date(entry.startISO)
                const endDate = new Date(entry.endISO)
                const facility = facilities.find(f => f.id === entry.facilityId)
                
                return (
                  <div key={entry.id} className="time-entry-card">
                    <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                      {entry.cleanerId} - {facility?.name || entry.facilityId}
                    </div>
                    <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
                      <strong>Date:</strong> {startDate.toLocaleDateString()}
                    </div>
                    <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
                      <strong>Time:</strong> {startDate.toLocaleTimeString()} - {endDate.toLocaleTimeString()}
                    </div>
                    <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
                      <strong>Duration:</strong> {entry.durationMinutes} minutes
                    </div>
                    {entry.notes && (
                      <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
                        <strong>Notes:</strong> {entry.notes}
                      </div>
                    )}
                    <div style={{ fontSize: '12px', color: '#999' }}>
                      Created: {new Date(entry.createdAt).toLocaleString()}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 