import { useState } from 'react';
import { supabase } from '@/supabaseClient';
import { Button } from '@/components/ui/button';
import { Clock, Square } from 'lucide-react';

interface TimeClockProps {
  userId: string;
  facilityId: string;
}

export default function TimeClock({ userId, facilityId }: TimeClockProps) {
  const [entryId, setEntryId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleStart = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('time_entries')
        .insert([{ 
          user_id: userId, 
          facility_id: facilityId, 
          start_time: new Date().toISOString(), 
          end_time: new Date().toISOString() 
        }])
        .select('id')
        .single();
      
      if (error) {
        console.error('Error starting time entry:', error);
        return;
      }
      
      setEntryId(data!.id);
    } catch (error) {
      console.error('Error starting time entry:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = async () => {
    if (!entryId) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('time_entries')
        .update({ end_time: new Date().toISOString() })
        .eq('id', entryId);
      
      if (error) {
        console.error('Error stopping time entry:', error);
        return;
      }
      
      setEntryId(null);
    } catch (error) {
      console.error('Error stopping time entry:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {entryId ? (
        <Button 
          onClick={handleStop} 
          disabled={isLoading}
          variant="destructive"
          className="flex items-center gap-2"
        >
          <Square className="h-4 w-4" />
          {isLoading ? 'Stopping...' : 'Stop Clock'}
        </Button>
      ) : (
        <Button 
          onClick={handleStart} 
          disabled={isLoading}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
        >
          <Clock className="h-4 w-4" />
          {isLoading ? 'Starting...' : 'Start Clock'}
        </Button>
      )}
    </div>
  );
} 