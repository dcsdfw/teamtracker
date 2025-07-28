import { useState, useEffect } from 'react'
import { useTimer } from './useTimer'

import { firestoreService } from './firestoreService'
import { scheduleService, type FacilityResolution } from './ScheduleService'
import { CleanerLogin } from './CleanerLogin'
import { StartButton } from './components/StartButton'
import { StopButton } from './components/StopButton'
import { NotesBox } from './components/NotesBox'
import { ManagerInterface } from './components/ManagerInterface'
import './App.css'

function App() {
  const [cleanerId, setCleanerId] = useState<string | null>(null)
  const [facilityResolution, setFacilityResolution] = useState<FacilityResolution | null>(null)
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showNotes, setShowNotes] = useState(false)
  const [storedTimeEntry, setStoredTimeEntry] = useState<any>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [showMenu, setShowMenu] = useState(false)
  const [showManagerInterface, setShowManagerInterface] = useState(false)

  const timer = useTimer()

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      showToast('Back online - syncing entries...', 'success')
      // Firestore handles offline sync automatically
      showToast('Back online - data will sync automatically', 'success')
    }

    const handleOffline = () => {
      setIsOnline(false)
      showToast('Offline - entries will sync when connection returns', 'warning')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Initialize facility resolution when cleaner ID is set
  useEffect(() => {
    if (cleanerId) {
      initializeFacilityResolution()
    }
  }, [cleanerId])

  // Firestore handles background sync automatically

  const initializeFacilityResolution = async () => {
    if (!cleanerId) return

    try {
      const resolution = await scheduleService.resolveFacilityId(cleanerId)
      setFacilityResolution(resolution)
      
      if (resolution.facilityId) {
        setSelectedFacilityId(resolution.facilityId)
      }

      if (resolution.hasMultipleShifts) {
        showToast('Multiple shifts found; using first listed', 'warning')
      }
    } catch (error) {
      console.error('Failed to resolve facility:', error)
      showToast('Failed to load schedule', 'error')
    }
  }

  const showToast = (message: string, type: 'success' | 'error' | 'warning') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleStart = () => {
    if (!cleanerId || !selectedFacilityId) return

    timer.startTimer()
    showToast('Timer started', 'success')
  }

  const handleStop = () => {
    if (!cleanerId || !selectedFacilityId) return

    const timeEntry = timer.stopTimer()
    if (!timeEntry) return

    // Store the time entry for later saving
    setStoredTimeEntry(timeEntry)
    
    // Show notes input
    setShowNotes(true)
  }

  const handleSaveEntry = async () => {
    if (!storedTimeEntry) return

    setIsLoading(true)
    
    try {
      const finalNotes = notes.trim()
      
      const entry = {
        cleanerId: cleanerId!,
        facilityId: selectedFacilityId!,
        startISO: storedTimeEntry.startISO,
        endISO: storedTimeEntry.endISO,
        durationMinutes: storedTimeEntry.durationMinutes,
        notes: finalNotes
      }

      // Save directly to Firestore (handles offline automatically)
      await firestoreService.addTimeEntry(entry)
      showToast('Entry saved', 'success')

      // Reset everything
      setNotes('')
      setShowNotes(false)
      setStoredTimeEntry(null)

    } catch (error) {
      console.error('Failed to save entry:', error)
      showToast('Error saving entry', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFacilitySelect = (facilityId: string) => {
    setSelectedFacilityId(facilityId)
  }

  const handleSwitchFacility = () => {
    setShowMenu(false)
    // Reset facility resolution to require selection
    setFacilityResolution({
      facilityId: undefined,
      facilityName: undefined,
      requiresSelection: true,
      availableFacilities: facilityResolution?.availableFacilities || [],
      hasMultipleShifts: false
    })
  }

  const handleLogout = () => {
    setShowMenu(false)
    // Clear all state and localStorage
    localStorage.removeItem('cleanerId')
    localStorage.removeItem('timerState')
    setCleanerId(null)
    setSelectedFacilityId(null)
    setFacilityResolution(null)
    setShowManagerInterface(false)
    setShowNotes(false)
    setNotes('')
    setStoredTimeEntry(null)
    // Timer will reset automatically when component re-renders
  }

  // Show login screen if no cleaner ID
  if (!cleanerId) {
    return <CleanerLogin onCleanerIdSet={setCleanerId} />
  }

  // Show manager interface if requested
  if (showManagerInterface) {
    console.log('Showing manager interface, showManagerInterface:', showManagerInterface)
    return <ManagerInterface onBack={() => {
      console.log('Manager onBack called, setting showManagerInterface to false')
      setShowManagerInterface(false)
    }} />
  }

  // Show facility selection if required
  if (facilityResolution?.requiresSelection) {
    return (
      <div className="app">
        {/* Hamburger Menu */}
        <div className="hamburger-menu">
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="hamburger-button"
            aria-label="Menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
          
          {showMenu && (
            <div className="menu-dropdown">
              <div className="menu-header">
                <span>Menu</span>
                <button 
                  onClick={() => setShowMenu(false)}
                  className="close-menu"
                  aria-label="Close menu"
                >
                  ×
                </button>
              </div>
              <div className="menu-items">
                <button 
                  onClick={() => {
                    setShowManagerInterface(true)
                    setShowMenu(false)
                  }}
                  className="menu-item"
                >
                  📊 Manager Mode
                </button>
                <button 
                  onClick={handleLogout}
                  className="menu-item"
                >
                  👤 Switch User
                </button>
                <div className="menu-item info">
                  <span>Cleaner: {cleanerId}</span>
                  <span className={`status-indicator ${isOnline ? 'online' : 'offline'}`}>
                    {isOnline ? '🟢 Online' : '🔴 Offline'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="facility-selection">
          <h1>Select Facility</h1>
          <p>No schedule found for today. Please select your facility:</p>
          
          <div className="facility-dropdown-container">
            <select
              value={selectedFacilityId || ''}
              onChange={(e) => handleFacilitySelect(e.target.value)}
              className="facility-dropdown"
            >
              <option value="">Select a facility...</option>
              {facilityResolution.availableFacilities.map(facility => (
                <option key={facility.id} value={facility.id}>
                  {facility.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="facility-selection-actions">
            <button 
              onClick={() => {
                if (!selectedFacilityId) {
                  showToast('Please select a facility first', 'warning')
                  return
                }
                // Update facility resolution to not require selection
                setFacilityResolution({
                  facilityId: selectedFacilityId,
                  facilityName: facilityResolution.availableFacilities.find(f => f.id === selectedFacilityId)?.name || selectedFacilityId,
                  requiresSelection: false,
                  availableFacilities: [],
                  hasMultipleShifts: false
                })
              }}
              disabled={!selectedFacilityId}
              className="continue-button"
              style={{
                background: selectedFacilityId ? '#4CAF50' : '#ccc',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '6px',
                fontSize: '16px',
                cursor: selectedFacilityId ? 'pointer' : 'not-allowed',
                marginTop: '20px',
                transition: 'background-color 0.3s ease'
              }}
            >
              Continue to Timer
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      {/* Hamburger Menu */}
      <div className="hamburger-menu">
        <button 
          onClick={() => setShowMenu(!showMenu)}
          className="hamburger-button"
          aria-label="Menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        
        {showMenu && (
          <div className="menu-dropdown">
            <div className="menu-header">
              <span>Menu</span>
              <button 
                onClick={() => setShowMenu(false)}
                className="close-menu"
                aria-label="Close menu"
              >
                ×
              </button>
            </div>
            <div className="menu-items">
              <button 
                onClick={() => {
                  setShowManagerInterface(true)
                  setShowMenu(false)
                }}
                className="menu-item"
              >
                📊 Manager Mode
              </button>
              <button 
                onClick={handleSwitchFacility}
                className="menu-item"
              >
                🏢 Switch Facility
              </button>
              <button 
                onClick={handleLogout}
                className="menu-item"
              >
                👤 Switch User
              </button>
              <div className="menu-item info">
                <span>Cleaner: {cleanerId}</span>
                <span className={`status-indicator ${isOnline ? 'online' : 'offline'}`}>
                  {isOnline ? '🟢 Online' : '🔴 Offline'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Toast notifications */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}

      {/* Timer display */}
      <div className="timer-display">
        <div className="timer-time">{timer.formatTime()}</div>
        {facilityResolution?.facilityName && (
          <div className="facility-info">
            {facilityResolution.facilityName}
          </div>
        )}
      </div>

      {/* Main buttons */}
      <div className="button-container">
        <StartButton
          onClick={handleStart}
          disabled={!selectedFacilityId}
          isRunning={timer.isRunning}
        />
        <StopButton
          onClick={handleStop}
          disabled={!selectedFacilityId}
          isRunning={timer.isRunning}
          isLoading={isLoading}
        />
      </div>

      {/* Notes box (shown when stopping) */}
      {showNotes && (
        <div className="notes-container">
          <NotesBox
            value={notes}
            onChange={setNotes}
            disabled={isLoading}
            placeholder="Add notes about your shift..."
          />
          <div className="notes-actions">
            <button
              onClick={handleSaveEntry}
              disabled={isLoading}
              className="save-button"
              style={{
                background: '#4CAF50',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '6px',
                fontSize: '16px',
                cursor: 'pointer',
                marginTop: '10px'
              }}
            >
              {isLoading ? 'Saving...' : 'Save Entry'}
            </button>
          </div>
        </div>
      )}


    </div>
  )
}

export default App
