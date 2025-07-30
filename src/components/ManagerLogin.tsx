import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Navigation } from '@/components/Navigation';
import { Shield, ArrowLeft, CheckCircle } from 'lucide-react';
import { supabase } from '@/supabaseClient';

interface ManagerLoginProps {
  onManagerLogin: () => void;
  onBack: () => void;
}

export const ManagerLogin: React.FC<ManagerLoginProps> = ({ onManagerLogin, onBack }) => {
  const [managerEmail, setManagerEmail] = useState('');
  const [managerPassword, setManagerPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleManagerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: managerEmail,
        password: managerPassword
      });
      
      if (error) {
        setError(error.message);
        setIsLoading(false);
        return;
      }
      
      // Successfully authenticated
      localStorage.setItem('teamtracker-manager-auth', 'true');
      onManagerLogin();
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Navigation Component */}
      <Navigation 
        currentView="timer"
        onViewChange={() => {}} // No-op since we're on login page
        cleanerId={undefined}
        onLogout={onBack}
        onBackToFacilitySelection={onBack}
        onBackToLogin={onBack}
      />
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-card-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-success/5 rounded-full blur-3xl animate-card-float" style={{animationDelay: '2s'}}></div>
      </div>
      
      <div className="w-full max-w-md space-y-8 relative z-10">
        {/* Enhanced Header */}
        <div className="text-center space-y-6">
          <div className="w-20 h-20 mx-auto bg-gradient-primary-glow rounded-2xl flex items-center justify-center shadow-glow animate-glow-pulse">
            <Shield className="h-10 w-10 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Manager Access</h1>
            <p className="text-muted-foreground text-lg">Enter password to access dashboard</p>
            <div className="flex items-center justify-center gap-2 mt-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
              Secure Access
            </div>
          </div>
        </div>

        {/* Manager Login Card */}
        <Card className="bg-card border-border/50 shadow-lg">
          <CardHeader className="text-center pb-6">
            <CardTitle className="flex items-center justify-center gap-3 text-2xl font-bold">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5 text-white" />
              </div>
              Manager Login
            </CardTitle>
            <p className="text-muted-foreground">
              Enter your manager password to continue
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <form onSubmit={handleManagerLogin} className="space-y-4">
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
                  className="h-14 text-center font-mono text-lg border-2 border-border bg-background/50 backdrop-blur-sm focus:ring-2 focus:ring-primary focus:border-primary/50 transition-all duration-300 hover:border-primary/30"
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
                  className="h-14 text-center font-mono text-lg border-2 border-border bg-background/50 backdrop-blur-sm focus:ring-2 focus:ring-primary focus:border-primary/50 transition-all duration-300 hover:border-primary/30"
                />
                {error && (
                  <p className="text-sm text-destructive text-center">{error}</p>
                )}
              </div>
              
              <div className="flex gap-3">
                <Button 
                  type="button"
                  variant="outline"
                  className="flex-1 h-14"
                  onClick={onBack}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 h-14 text-lg font-semibold text-white shadow-glow hover:shadow-timer transition-all duration-300" 
                  style={{backgroundColor: '#0066FF'}}
                  disabled={!managerEmail.trim() || !managerPassword.trim() || isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Logging in...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Access Dashboard
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}; 