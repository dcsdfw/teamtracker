import { useState, useEffect } from 'react'

interface NotesBoxProps {
  value: string
  onChange: (notes: string) => void
  disabled?: boolean
  placeholder?: string
}

export const NotesBox = ({ 
  value, 
  onChange, 
  disabled = false, 
  placeholder = "Add notes (optional)..." 
}: NotesBoxProps) => {
  const [charCount, setCharCount] = useState(value.length)
  const maxChars = 280

  useEffect(() => {
    setCharCount(value.length)
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    if (newValue.length <= maxChars) {
      onChange(newValue)
    }
  }

  return (
    <div className="notes-box">
      <textarea
        value={value}
        onChange={handleChange}
        disabled={disabled}
        placeholder={placeholder}
        className="notes-textarea"
        rows={3}
        maxLength={maxChars}
        aria-label="Notes"
      />
      <div className="char-counter">
        <span className={charCount > maxChars * 0.9 ? 'warning' : ''}>
          {charCount}
        </span>
        <span>/ {maxChars}</span>
      </div>
    </div>
  )
} 