import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import NotFound from "./pages/NotFound";
import CalendarView from "@/components/CalendarView";
import { Login } from "@/components/Login";
import { LandingPage } from "@/components/LandingPage";
import { ManagerInterface } from "@/components/ManagerInterface";
import TimeTracker from "@/components/TimeTracker";
import Navigation from "./components/Navigation";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        {/* Navigation component always visible */}
        <Navigation />
        
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login onBack={() => window.history.back()} />} />
          <Route path="/manager-dashboard" element={<ManagerInterface onBack={() => window.history.back()} />} />
          <Route path="/time-tracker" element={<TimeTracker />} />
          <Route path="/calendar" element={<CalendarView />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
