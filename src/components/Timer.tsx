import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Play, Square } from 'lucide-react';

interface TimerProps {
  onTimeEntry: (entry: { facility: string; duration: number; notes: string; startTime: Date; endTime: Date }) => void;
  selectedFacility: string;
}

export const Timer: React.FC<TimerProps> = ({ onTimeEntry, selectedFacility }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [stopTime, setStopTime] = useState<Date | null>(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds(seconds => seconds + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    if (!selectedFacility) {
      alert('Please select a facility first');
      return;
    }
    setIsRunning(true);
    setStartTime(new Date());
    setStopTime(null);
  };



  const handleStop = () => {
    // Just stop the timer, don't auto-save
    setIsRunning(false);
    setStopTime(new Date());
  };

  const handleSaveEntry = () => {
    if (startTime && seconds > 0) {
      const endTime = new Date();
      onTimeEntry({
        facility: selectedFacility,
        duration: seconds,
        notes: notes,
        startTime: startTime,
        endTime: endTime
      });
      // Reset everything after saving
      setSeconds(0);
      setStartTime(null);
      setStopTime(null);
      setNotes('');
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-gradient-card border-border/50 shadow-timer backdrop-blur-sm animate-card-float">
      <CardHeader className="text-center pb-6">
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Enhanced Timer Display */}
        <div className="text-center space-y-6">
          <div className={`relative p-8 rounded-2xl transition-all duration-500 ${
            isRunning 
              ? 'bg-gradient-success/10 border-success/20 shadow-glow' 
              : 'bg-muted/30 border-muted'
          } border-2`}>
            <div className={`text-6xl font-mono font-bold transition-all duration-300 ${
              isRunning ? 'text-success animate-timer-tick' : 'text-muted-foreground'
            }`}>
              {formatTime(seconds)}
            </div>
            
            {/* Session Info - moved below timer */}
            {startTime && (
              <div className="mt-4 text-center">
                <div className="flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground">
                  <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-success animate-pulse' : 'bg-muted-foreground'}`}></div>
                  {isRunning ? (
                    <>Session started at {startTime.toLocaleTimeString()}</>
                  ) : stopTime ? (
                    <>Session stopped at {stopTime.toLocaleTimeString()}</>
                  ) : (
                    <>Session started at {startTime.toLocaleTimeString()}</>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Timer Controls */}
        <div className="flex justify-center">
          {!isRunning ? (
            <Button
              onClick={handleStart}
              className="w-40 h-24 rounded-2xl transition-all duration-300 hover:scale-105 bg-success hover:bg-success/90 text-white flex flex-col items-center justify-center gap-2 shadow-lg"
            >
              <Play className="h-8 w-8" fill="currentColor" />
              <span className="text-sm font-semibold">START</span>
            </Button>
          ) : (
            <Button
              onClick={handleStop}
              className="w-40 h-24 rounded-2xl transition-all duration-300 hover:scale-105 bg-destructive hover:bg-destructive/90 text-white flex flex-col items-center justify-center gap-2 shadow-lg"
            >
              <Square className="h-8 w-8" fill="currentColor" />
              <span className="text-sm font-semibold">STOP</span>
            </Button>
          )}
        </div>

        {/* Enhanced Notes Input */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-foreground flex items-center gap-2">
            📝 Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes about your work session..."
            className="w-full p-4 rounded-xl border-2 border-input bg-background/50 backdrop-blur-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary/50 transition-all duration-300 resize-none hover:border-primary/30"
            rows={3}
          />
        </div>

        {/* Save Entry Button - always visible */}
        <div className="flex justify-center">
          <Button
            onClick={handleSaveEntry}
            variant="secondary"
            className="w-full h-12 bg-gray-800 hover:bg-gray-700 text-white font-semibold transition-all duration-300"
          >
            Save Entry
          </Button>
        </div>

        {/* Enhanced Session Info - removed since moved above */}
      </CardContent>
    </Card>
  );
}; 