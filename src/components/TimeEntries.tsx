import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { History, Clock, Building2, FileText, Trash2, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TimeEntry {
  id: string;
  facility: string;
  duration: number;
  notes: string;
  startTime: Date;
  endTime: Date;
}

interface TimeEntriesProps {
  entries: TimeEntry[];
  onDeleteEntry?: (id: string) => void;
  loading?: boolean;
}

export const TimeEntries: React.FC<TimeEntriesProps> = ({ entries, onDeleteEntry, loading = false }) => {
  const { toast } = useToast();
  


  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours}h:${minutes}m:${secs}s`;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const getTotalHours = () => {
    const totalSeconds = entries.reduce((sum, entry) => sum + entry.duration, 0);
    return (totalSeconds / 3600).toFixed(1);
  };

  const handleDelete = (id: string, facility: string) => {
    if (onDeleteEntry) {
      onDeleteEntry(id);
      toast({
        title: "Entry Deleted",
        description: `Time entry for ${facility} has been removed.`,
      });
    }
  };

  if (loading) {
    return (
      <Card className="w-full bg-gradient-card border-border/50 shadow-lg">
        <CardContent className="p-8">
          <div className="text-center space-y-3">
            <div className="w-8 h-8 mx-auto border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
            <p className="text-muted-foreground">Loading time entries...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full bg-gradient-card border-border/50 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-xl font-bold text-foreground">
            <History className="h-5 w-5 text-primary" />
            Time Entries
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-sm font-semibold">
              {getTotalHours()}h total
            </Badge>
            <Badge variant="outline" className="text-xs">
              {entries.length} entries
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {entries.length === 0 ? (
          <div className="text-center py-8 space-y-3">
            <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-medium">No time entries yet</p>
            <p className="text-sm text-muted-foreground">Start your timer to create your first entry</p>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="p-4 bg-background border border-border rounded-lg hover:shadow-md transition-all duration-200 group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    {/* Header */}
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-foreground">{entry.facility}</span>
                      <Badge variant="outline" className="text-xs">
                        {formatDuration(entry.duration)}
                      </Badge>
                    </div>
                    
                    {/* Time Details */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(entry.startTime)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(entry.startTime)} - {formatTime(entry.endTime)}
                      </div>
                    </div>
                    
                    {/* Notes */}
                    {entry.notes && (
                      <div className="flex items-start gap-2 mt-2">
                        <FileText className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">{entry.notes}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Delete Button */}
                  {onDeleteEntry && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(entry.id, entry.facility)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 