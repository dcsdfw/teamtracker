import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { supabase } from '@/supabaseClient';

import { User, Shield, Clock, CheckCircle } from 'lucide-react';

interface CleanerLoginProps {
  onLogin: (cleanerId: string) => void;
}

export const CleanerLogin: React.FC<CleanerLoginProps> = ({ onLogin }) => {
  const [cleanerId, setCleanerId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [managerEmail, setManagerEmail] = useState('');
  const [managerPassword, setManagerPassword] = useState('');
  const [isManagerLoading, setIsManagerLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cleanerId.trim()) return;
    
    setIsLoading(true);
    // Simulate a brief login process
    await new Promise(resolve => setTimeout(resolve, 800));
    onLogin(cleanerId.trim());
    setIsLoading(false);
  };

  const handleManagerAccess = () => {
    setShowPasswordInput(true);
  };

  const handleManagerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsManagerLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: managerEmail,
        password: managerPassword
      });
      
      if (error) {
        alert(error.message);
        setIsManagerLoading(false);
        return;
      }
      
      // Successfully authenticated
      localStorage.setItem('teamtracker-manager-auth', 'true');
      onLogin('MANAGER');
    } catch (err) {
      alert('Login failed. Please try again.');
    } finally {
      setIsManagerLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-card-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-success/5 rounded-full blur-3xl animate-card-float" style={{animationDelay: '2s'}}></div>
      </div>
      
      <div className="w-full max-w-md space-y-8 relative z-10">
        {/* Enhanced Header */}
        <div className="text-center space-y-6">
          <div className="w-20 h-20 mx-auto bg-gradient-primary-glow rounded-2xl flex items-center justify-center shadow-glow animate-glow-pulse">
            <Clock className="h-10 w-10 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">TeamTracker</h1>
            <p className="text-muted-foreground text-lg">Professional Time Tracking System</p>
            <div className="flex items-center justify-center gap-2 mt-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
              System Online
            </div>
          </div>
        </div>

        {/* Enhanced Login Card */}
        <Card className="bg-card border-border/50 shadow-lg">
          <CardHeader className="text-center pb-6">
            <CardTitle className="flex items-center justify-center gap-3 text-2xl font-bold">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
              Cleaner Login
            </CardTitle>
            <p className="text-muted-foreground">
              Enter your cleaner ID to start tracking time
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="cleanerId" className="text-sm font-medium text-foreground">
                  Cleaner ID
                </label>
                <Input
                  id="cleanerId"
                  type="text"
                  placeholder="Enter your cleaner ID..."
                  value={cleanerId}
                  onChange={(e) => setCleanerId(e.target.value)}
                  className="h-14 text-center font-mono text-lg border-2 border-border bg-background/50 backdrop-blur-sm focus:ring-2 focus:ring-primary focus:border-primary/50 transition-all duration-300 hover:border-primary/30"
                  autoFocus
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-14 text-lg font-semibold text-white shadow-glow hover:shadow-timer transition-all duration-300" 
                style={{backgroundColor: '#0066FF'}}
                disabled={!cleanerId.trim() || isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Logging in...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Start Tracking
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Manager Access Button */}
        {!showPasswordInput ? (
          <Card className="bg-card border-border/50 shadow-lg cursor-pointer hover:shadow-xl transition-all duration-300" onClick={handleManagerAccess}>
            <CardContent className="pt-6">
              <div className="text-center space-y-3">
                <div className="flex items-center justify-center gap-3">
                  <div className="w-8 h-8 bg-gradient-primary/20 rounded-lg flex items-center justify-center">
                    <Shield className="h-4 w-4 text-primary" />
                  </div>
                  <span className="font-semibold text-foreground">Manager Access</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Click here to access manager dashboard
                </p>
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  © Dream Cleaned Services
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-card border-border/50 shadow-lg">
            <CardContent className="pt-6">
              <form onSubmit={handleManagerLogin} className="space-y-4">
                <div className="text-center space-y-2">
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-8 h-8 bg-gradient-primary/20 rounded-lg flex items-center justify-center">
                      <Shield className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-semibold text-foreground">Manager Login</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="managerEmail" className="text-sm font-medium text-foreground">
                    Email
                  </label>
                  <Input
                    id="managerEmail"
                    type="email"
                    placeholder="Enter your email..."
                    value={managerEmail}
                    onChange={(e) => setManagerEmail(e.target.value)}
                    className="h-12 text-center border-2 border-border bg-background/50 backdrop-blur-sm focus:ring-2 focus:ring-primary focus:border-primary/50 transition-all duration-300"
                    autoFocus
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="managerPassword" className="text-sm font-medium text-foreground">
                    Password
                  </label>
                  <Input
                    id="managerPassword"
                    type="password"
                    placeholder="Enter password..."
                    value={managerPassword}
                    onChange={(e) => setManagerPassword(e.target.value)}
                    className="h-12 text-center border-2 border-border bg-background/50 backdrop-blur-sm focus:ring-2 focus:ring-primary focus:border-primary/50 transition-all duration-300"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowPasswordInput(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1 text-white" 
                    style={{backgroundColor: '#0066FF'}}
                    disabled={!managerEmail.trim() || !managerPassword.trim() || isManagerLoading}
                  >
                    {isManagerLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Logging in...
                      </div>
                    ) : (
                      'Access Manager'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}; 