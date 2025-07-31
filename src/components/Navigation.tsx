import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { useSession } from '@/hooks/useSession'; // Add this import

export default function Navigation() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { session } = useSession(); // Add this to get user session

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  // Check if user is a manager
  const isManager = session?.role === 'manager';

  return (
    <header className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold">Dream Cleaned Services</h1>
        {/* Hamburger button */}
        <button
          className="md:hidden p-2 rounded-md hover:bg-gray-100"
          onClick={() => setMobileOpen((o) => !o)}
        >
          ☰
        </button>
        {/* Desktop nav */}
        <nav className="hidden md:flex space-x-6">
          <NavLink to="/calendar" className="hover:underline">Calendar</NavLink>
          {/* Only show Dashboard link to managers */}
          {isManager && (
            <NavLink to="/manager-dashboard" className="hover:underline">Dashboard</NavLink>
          )}
          <NavLink to="/time-tracker" className="hover:underline">Time Tracker</NavLink>
          <button 
            onClick={handleLogout}
            className="hover:underline text-red-600"
          >
            Logout
          </button>
        </nav>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <nav className="md:hidden bg-white border-t border-gray-200">
          <ul className="flex flex-col px-4 py-2 space-y-2">
            <li>
              <NavLink
                to="/calendar"
                className="block py-2"
                onClick={() => setMobileOpen(false)}
              >
                Calendar
              </NavLink>
            </li>
            {/* Only show Dashboard link to managers in mobile menu too */}
            {isManager && (
              <li>
                <NavLink
                  to="/manager-dashboard"
                  className="block py-2"
                  onClick={() => setMobileOpen(false)}
                >
                  Dashboard
                </NavLink>
              </li>
            )}
            <li>
              <NavLink
                to="/time-tracker"
                className="block py-2"
                onClick={() => setMobileOpen(false)}
              >
                Time Tracker
              </NavLink>
            </li>
            <li>
              <button
                onClick={() => {
                  setMobileOpen(false);
                  handleLogout();
                }}
                className="block py-2 text-red-600 w-full text-left"
              >
                Logout
              </button>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
} 