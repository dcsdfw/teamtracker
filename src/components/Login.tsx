import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { Shield, User, CheckCircle, ArrowLeft } from 'lucide-react';
import { supabase } from '@/supabaseClient';
import { useNavigate } from 'react-router-dom';

interface LoginProps {
  onBack: () => void;
}

export const Login: React.FC<LoginProps> = ({ onBack }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      console.log('🔄 Starting auth...');
      
      // Sign in with Supabase - using correct destructuring
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      
      console.log('🔐 Auth response:', { data, error });
      
      if (error) {
        console.error('Auth error:', error);
        setError(error.message);
        setIsLoading(false);
        return;
      }

      if (!data.user) {
        setError('Login failed. Please try again.');
        setIsLoading(false);
        return;
      }

      // TEMPORARY: Skip profile check and go straight to time tracker
      console.log('✅ Auth successful, skipping profile check');
      localStorage.setItem('teamtracker-cleaner-id', data.user.id);
      navigate('/time-tracker');
      
    } catch (err) {
      console.error('Login error:', err);
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
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
            <User className="h-10 w-10 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">TeamTracker</h1>
            <p className="text-muted-foreground text-lg">Professional Time Tracking System</p>
            <div className="flex items-center justify-center gap-2 mt-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
              Secure Login
            </div>
          </div>
        </div>

        {/* Login Card */}
        <Card className="bg-card border-border/50 shadow-lg">
          <CardHeader className="text-center pb-6">
            <CardTitle className="flex items-center justify-center gap-3 text-2xl font-bold">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5 text-white" />
              </div>
              Login
            </CardTitle>
            <p className="text-muted-foreground">
              Enter your credentials to access the system
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-14 text-center font-mono text-lg border-2 border-border bg-background/50 backdrop-blur-sm focus:ring-2 focus:ring-primary focus:border-primary/50 transition-all duration-300 hover:border-primary/30"
                  autoFocus
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                  disabled={!email.trim() || !password.trim() || isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Logging in...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Sign In
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