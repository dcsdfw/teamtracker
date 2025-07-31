import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CalendarView from '@/components/CalendarView';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, FileText, Trash2 } from 'lucide-react';
import { addTestScheduleRule, getScheduleRules } from '../testScheduleRule';
import { useToast } from '@/hooks/use-toast';
import { useSession } from '@/hooks/useSession';
import { deleteAllScheduleRules } from '@/services/scheduleService';
import { refetchCalendar } from '@/components/CalendarView';

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const { session, loading: sessionLoading } = useSession();
  const { toast } = useToast();

  // Protect manager dashboard - only allow managers
  useEffect(() => {
    if (!sessionLoading && session) {
      if (session.role !== 'manager') {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access the manager dashboard.",
          variant: "destructive",
        });
        navigate('/time-tracker'); // Redirect non-managers to time tracker
        return;
      }
    }
  }, [session, sessionLoading, navigate, toast]);

  // Show loading while session is being determined
  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If no session, redirect to login
  if (!session) {
    navigate('/login');
    return <div>Redirecting to login...</div>;
  }

  // If not a manager, the useEffect above will handle the redirect
  if (session.role !== 'manager') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">Manager Dashboard</h1>
      </div>

      {/* Test Controls */}
      <Card className="bg-gradient-card border-border/50 shadow-card backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <FileText className="h-5 w-5 text-white" />
            </div>
            Schedule Rules Testing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
            <Button
              onClick={() => {
                addTestScheduleRule()
                  .then(() => {
                    console.log('Test rule added')
                    toast({
                      title: "Success",
                      description: "Test schedule rule added successfully!",
                    })
                  })
                  .catch((error) => {
                    console.error('Error adding test schedule rule:', error)
                    toast({
                      title: "Error",
                      description: `Error adding test schedule rule: ${error instanceof Error ? error.message : 'Unknown error'}`,
                      variant: "destructive",
                    })
                  })
              }}
              className="btn btn-success flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              <Plus className="h-4 w-4" />
              Add Test Schedule Rule
            </Button>
            
            <Button
              onClick={() => {
                getScheduleRules()
                  .then(rules => {
                    console.log('Current rules:', rules)
                    toast({
                      title: "Schedule Rules",
                      description: `Found ${rules.length} schedule rules`,
                    })
                  })
                  .catch((error) => {
                    console.error('Error getting schedule rules:', error)
                    toast({
                      title: "Error",
                      description: `Error getting schedule rules: ${error instanceof Error ? error.message : 'Unknown error'}`,
                      variant: "destructive",
                    })
                  })
              }}
              className="btn btn-primary flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <FileText className="h-4 w-4" />
              View Schedule Rules
            </Button>

            <Button
              onClick={async () => {
                try {
                  await deleteAllScheduleRules();
                  console.log('✅ Cleared all schedule_rules documents');
                  refetchCalendar();
                  toast({
                    title: "Success",
                    description: "All schedule rules cleared successfully!",
                  })
                } catch (err) {
                  console.error('Clear failed', err)
                  toast({
                    title: "Error",
                    description: `Failed to clear schedule rules: ${err instanceof Error ? err.message : 'Unknown error'}`,
                    variant: "destructive",
                  })
                }
              }}
              className="btn btn-danger flex items-center gap-2 bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4" />
              Clear All Schedule Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Calendar View */}
      <Card className="bg-gradient-card border-border/50 shadow-card backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <FileText className="h-5 w-5 text-white" />
            </div>
            Calendar View
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[600px]">
            <CalendarView />
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 