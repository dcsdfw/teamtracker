import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Menu, Clock, BarChart3, Shield, LogOut, ArrowLeft, Calendar } from 'lucide-react';

interface NavigationProps {
  currentView: 'timer' | 'manager' | 'calendar';
  onViewChange: (view: 'timer' | 'manager' | 'calendar') => void;
  cleanerId?: string;
  totalHours?: number;
  onLogout?: () => void;
  onBackToFacilitySelection?: () => void;
  onBackToLogin?: () => void;
  users?: Array<{ id: string; username: string; firstName: string; lastName: string; email: string; phone: string; active: boolean }>;
}

export const Navigation: React.FC<NavigationProps> = ({ 
  currentView, 
  onViewChange, 
  cleanerId,
  onLogout,
  onBackToLogin,
  users = []
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const isManager = cleanerId === 'MANAGER';
  
  const getUserDisplayName = (cleanerId: string) => {
    const user = users.find(u => u.username === cleanerId);
    return user ? `${user.firstName} ${user.lastName} (${cleanerId})` : cleanerId;
  };


  const menuItems = [
    {
      id: 'timer',
      label: 'Time Tracker',
      icon: Clock,
      description: isManager ? 'View time tracking' : 'Track your work time'
    },
    {
      id: 'calendar',
      label: 'Schedule Calendar',
      icon: Calendar,
      description: 'View schedule calendar'
    },
    // Manager Dashboard - available for all users
    {
      id: 'manager',
      label: 'Manager Dashboard',
      icon: Shield,
      description: 'View all time entries'
    },
    // Navigation items
    // Facility Selection removed as per user request
    {
      id: 'back-to-login',
      label: 'Back to Login',
      icon: ArrowLeft,
      description: 'Return to login screen',
      action: onBackToLogin
    },
    // Logout item
    {
      id: 'logout',
      label: 'Logout',
      icon: LogOut,
      description: 'Sign out of the application',
      action: onLogout
    }
  ];

  const handleMenuClick = (item: any) => {
    if (item.action) {
      // Handle action items (logout, back to login, etc.)
      item.action();
      setIsOpen(false);
    } else if (item.id === 'timer' || item.id === 'manager' || item.id === 'calendar') {
      // Handle view changes
      onViewChange(item.id as 'timer' | 'manager' | 'calendar');
      setIsOpen(false);
    }
  };

  return (
    <div className="fixed top-4 left-4 z-50">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button 
            variant="secondary" 
            size="icon"
            className="h-14 w-14 rounded-xl shadow-lg bg-gradient-menu backdrop-blur-sm border-border/50 hover:bg-primary/90 hover:text-primary-foreground transition-all duration-300"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        
        <SheetContent side="left" className="w-80 bg-gradient-menu backdrop-blur-xl border-border/50 shadow-card animate-menu-slide">
          <SheetHeader className="pb-8">
            <SheetTitle className="flex items-center gap-3 text-2xl font-bold">
              <div className="w-12 h-12 bg-gradient-primary-glow rounded-xl flex items-center justify-center shadow-glow animate-glow-pulse">
                <Clock className="h-7 w-7 text-white" />
              </div>
              <div>
                <div className="text-foreground">TeamTracker</div>
                <div className="text-sm text-muted-foreground font-normal">Professional Time Management</div>
              </div>
            </SheetTitle>
          </SheetHeader>
          
          <div className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              const isActionItem = item.action;
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleMenuClick(item)}
                  className={`w-full p-5 rounded-xl text-left transition-all duration-300 group ${
                    isActive 
                      ? 'bg-blue-200 text-black shadow-md' 
                      : isActionItem
                      ? 'hover:bg-gradient-card hover:shadow-card border border-border/20 hover:border-primary/20 text-foreground'
                      : 'hover:bg-gradient-card hover:shadow-card border border-border/20 hover:border-primary/20 text-foreground'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-3 rounded-xl transition-all duration-300 ${
                      isActive 
                        ? 'bg-blue-300' 
                        : isActionItem && item.id === 'logout'
                        ? 'bg-destructive/10 group-hover:bg-destructive/20'
                        : 'bg-muted group-hover:bg-primary/10'
                    }`}>
                      <Icon className={`h-5 w-5 ${
                        isActive 
                          ? 'text-black' 
                          : isActionItem && item.id === 'logout'
                          ? 'text-destructive'
                          : 'text-primary'
                      }`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={`font-semibold truncate ${
                          isActive 
                            ? 'text-black' 
                            : isActionItem && item.id === 'logout'
                            ? 'text-destructive'
                            : 'text-foreground'
                        }`}>{item.label}</h3>
                        {(item as any).badge && (
                          <Badge 
                            variant={isActive ? "secondary" : "outline"}
                            className="text-xs ml-2"
                          >
                            {(item as any).badge}
                          </Badge>
                        )}
                      </div>
                      <p className={`text-sm ${
                        isActive 
                          ? 'text-black' 
                          : isActionItem && item.id === 'logout'
                          ? 'text-destructive/70'
                          : 'text-muted-foreground'
                      }`}>
                        {item.description}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          
          {/* Enhanced Footer */}
          <div className="absolute bottom-6 left-6 right-6">
            <div className="p-5 bg-gradient-card rounded-xl border border-border/50 shadow-card animate-card-float">
              <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="font-semibold text-foreground">Professional Time Tracking</div>
                  {cleanerId && (
                    <div className="text-xs text-primary font-medium">
                      {isManager ? 'Manager Access' : `User: ${getUserDisplayName(cleanerId)}`}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                System Online
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}; 