import React from 'react';
import CalendarView from '@/components/CalendarView';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, FileText, Trash2 } from 'lucide-react';
import { addTestScheduleRule, getScheduleRules } from '../testScheduleRule';
import { useToast } from '@/hooks/use-toast';
import { deleteAllScheduleRules } from '@/services/scheduleService';
import { refetchCalendar } from '@/components/CalendarView';

export default function ManagerDashboard() {
  const { toast } = useToast();

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