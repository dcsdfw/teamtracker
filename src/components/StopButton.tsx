interface StopButtonProps {
  onClick: () => void
  disabled: boolean
  isRunning: boolean
  isLoading?: boolean
}

export const StopButton = ({ onClick, disabled, isRunning, isLoading = false }: StopButtonProps) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled || !isRunning || isLoading}
      className="stop-button"
      aria-label="Stop timer"
    >
      {isLoading ? 'Saving...' : 'Stop'}
    </button>
  )
} 