import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2 } from 'lucide-react';

interface Facility {
  id: string;
  name: string;
}

interface FacilitySelectorProps {
  facilities: Facility[];
  selectedFacility: string;
  onSelectFacility: (facility: string) => void;
}

export const FacilitySelector: React.FC<FacilitySelectorProps> = ({
  facilities,
  selectedFacility,
  onSelectFacility,
}) => {
  return (
    <Card className="w-full max-w-2xl mx-auto bg-gradient-card border-border/50 shadow-card backdrop-blur-sm animate-card-float">
      <CardHeader className="text-center pb-6">
        <CardTitle className="flex items-center justify-center gap-3 text-2xl font-bold text-foreground">
          <div className="w-10 h-10 bg-gradient-primary-glow rounded-xl flex items-center justify-center shadow-glow">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          Select Facility
        </CardTitle>
        <p className="text-muted-foreground">
          Choose the facility where you'll be working
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {facilities.length === 0 ? (
          <div className="text-center py-8 space-y-3">
            <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
              <Building2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-medium">No facilities available</p>
            <p className="text-sm text-muted-foreground">Contact your manager to add facilities</p>
          </div>
        ) : (
          <div className="space-y-4">
            <Select value={selectedFacility} onValueChange={onSelectFacility}>
              <SelectTrigger className="w-full h-14 text-lg font-medium bg-background/50 backdrop-blur-sm border-2 border-input hover:border-primary/30 focus:border-primary transition-all duration-300">
                <SelectValue placeholder="Select a facility..." />
              </SelectTrigger>
              <SelectContent className="bg-gradient-menu backdrop-blur-xl border-border/50 shadow-card">
                {facilities.map((facility) => (
                  <SelectItem 
                    key={facility.id} 
                    value={facility.name}
                    className="text-foreground hover:bg-primary/10 focus:bg-primary/10 transition-all duration-300 cursor-pointer"
                  >
                    <div className="flex items-center gap-3 py-2">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Building2 className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-medium">{facility.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {selectedFacility && (
              <div className="p-4 bg-primary/5 rounded-xl border border-primary/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-primary">{selectedFacility}</p>
                    <p className="text-sm text-muted-foreground">Selected for time tracking</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 