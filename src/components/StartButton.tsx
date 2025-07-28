interface StartButtonProps {
  onClick: () => void
  disabled: boolean
  isRunning: boolean
}

export const StartButton = ({ onClick, disabled, isRunning }: StartButtonProps) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isRunning}
      className="start-button"
      aria-label="Start timer"
    >
      {isRunning ? 'Running...' : 'Start'}
    </button>
  )
} 