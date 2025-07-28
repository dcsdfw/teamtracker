import { useState, useEffect } from 'react'

interface CleanerLoginProps {
  onCleanerIdSet: (cleanerId: string) => void
}

export const CleanerLogin = ({ onCleanerIdSet }: CleanerLoginProps) => {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showTestMode, setShowTestMode] = useState(false)
  const [testCleanerId, setTestCleanerId] = useState('')

  useEffect(() => {
    const initializeCleaner = async () => {
      try {
        // Get CleanerID from URL query parameter
        const urlParams = new URLSearchParams(window.location.search)
        const cleanerIdFromUrl = urlParams.get('id')

        if (!cleanerIdFromUrl) {
          // Check if we have a stored cleaner ID
          const storedCleanerId = localStorage.getItem('cleanerId')
          if (storedCleanerId) {
            console.log(`Using stored CleanerID: ${storedCleanerId}`)
            onCleanerIdSet(storedCleanerId)
            setIsLoading(false)
            return
          }
          
          // No cleaner ID found - show test mode
          setIsLoading(false)
          setShowTestMode(true)
          return
        }

        // Validate CleanerID format (should start with 'C' followed by numbers)
        if (!/^C\d+$/.test(cleanerIdFromUrl)) {
          setError('Invalid CleanerID format. Should be like C001, C002, etc.')
          setIsLoading(false)
          return
        }

        // Check if we already have this CleanerID stored
        const storedCleanerId = localStorage.getItem('cleanerId')
        
        if (storedCleanerId && storedCleanerId !== cleanerIdFromUrl) {
          // Different CleanerID - update it
          console.log(`Updating CleanerID from ${storedCleanerId} to ${cleanerIdFromUrl}`)
        }

        // Store the CleanerID
        localStorage.setItem('cleanerId', cleanerIdFromUrl)
        
        // Notify parent component
        onCleanerIdSet(cleanerIdFromUrl)
        
      } catch (error) {
        console.error('Error initializing cleaner:', error)
        setError('Failed to initialize. Please refresh the page.')
      } finally {
        setIsLoading(false)
      }
    }

    initializeCleaner()
  }, [onCleanerIdSet])

  if (isLoading) {
    return (
      <div className="cleaner-login">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Initializing...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="cleaner-login">
        <div className="error-container">
          <h2>Error</h2>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="retry-button"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (showTestMode) {
    const handleTestLogin = () => {
      if (!testCleanerId.trim()) {
        setError('Please enter a Cleaner ID')
        return
      }
      
      if (!/^C\d+$/.test(testCleanerId.trim())) {
        setError('Invalid CleanerID format. Should be like C001, C002, etc.')
        return
      }
      
      const cleanerId = testCleanerId.trim()
      localStorage.setItem('cleanerId', cleanerId)
      onCleanerIdSet(cleanerId)
    }

    return (
      <div className="cleaner-login">
        <div className="loading-container">
          <h2>Test Mode</h2>
          <p>Enter a Cleaner ID to test the application:</p>
          <div style={{ marginBottom: '1rem' }}>
            <input
              type="text"
              value={testCleanerId}
              onChange={(e) => setTestCleanerId(e.target.value)}
              placeholder="e.g., C001"
              style={{
                padding: '0.75rem',
                fontSize: '1rem',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                width: '100%',
                marginBottom: '1rem'
              }}
            />
          </div>
          <button 
            onClick={handleTestLogin}
            className="retry-button"
            style={{ marginRight: '0.5rem' }}
          >
            Start Test
          </button>
          <button 
            onClick={() => setShowTestMode(false)}
            style={{
              background: '#6c757d',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              fontSize: '1rem',
              cursor: 'pointer',
              marginRight: '0.5rem'
            }}
          >
            Cancel
          </button>
          <button 
            onClick={() => {
              localStorage.setItem('cleanerId', 'MANAGER')
              onCleanerIdSet('MANAGER')
            }}
            style={{
              background: '#28a745',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              fontSize: '1rem',
              cursor: 'pointer'
            }}
          >
            Manager Mode
          </button>
          {error && (
            <p style={{ color: '#f44336', marginTop: '1rem' }}>{error}</p>
          )}
        </div>
      </div>
    )
  }

  return null
} 