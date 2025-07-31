import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Shield, ArrowRight } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate('/login');
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

          </div>
        </div>

        {/* Login Card */}
        <Card className="bg-card border-border/50 shadow-lg">
          <CardHeader className="text-center pb-6">
            <CardTitle className="flex items-center justify-center gap-3 text-2xl font-bold">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5 text-white" />
              </div>
              Welcome
            </CardTitle>
            <p className="text-muted-foreground">
              Sign in to access your dashboard
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <Button 
              onClick={handleLogin}
              className="w-full h-14 text-lg font-semibold text-white shadow-glow hover:shadow-timer transition-all duration-300" 
              style={{backgroundColor: '#0066FF'}}
            >
              <div className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4" />
                Sign In
              </div>
            </Button>
            

          </CardContent>
        </Card>
      </div>
    </div>
  );
}; 